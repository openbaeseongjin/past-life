// 마을 사람 glb 압축 + 동작 묶음 만들기 (tools/blender/kit_clothes.py 가 내보내기 다음에 부른다).
//   GLTFT=<gltf-transform 폴더> node docs/past-life/tools/pack_people.mjs <villagers_raw.glb> <villagers.glb> <남 몸 .gltf> <여 몸 .gltf> <UAL1_Standard.glb> <anims.glb> <동작,이름,…>
// 1) villagers: 뼈 쉼 자세(TRS)가 Quaternius 원본과 같은지 확인한다 (다르면 UAL 동작이 어긋나므로 멈춘다).
//    텍스처 WebP(몸 아틀라스 2K, 몸 노멀 1K, 천 결·노멀 512) + meshopt.
// 2) anims: UAL 묶음에서 쓰는 동작만, 회전 + 골반 이동만 남긴다 (몸마다 뼈 길이가 달라 다른 이동·크기 곡선은 빼고 제 쉼 자세를 쓴다).
//    쉼 자세 뼈(노드)는 남겨 장면 코드가 UAL 골반 높이를 읽는다.
// 둘 다 임시 파일(.tmp)에 쓴 뒤, 둘 다 성공해야 제자리로 옮긴다 (한쪽만 바뀌어 어긋난 채 남지 않게).
// 개발 도구는 저장소에 넣지 않는다: npm i --prefix <폴더> @gltf-transform/core@4 @gltf-transform/functions@4 @gltf-transform/extensions@4 meshoptimizer@0.21 sharp
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const [, , rawPath, outPath, maleGltf, femaleGltf, ualPath, animsOut, clipList] = process.argv;
if (!clipList) { console.error('사용: node pack_people.mjs <raw.glb> <out.glb> <남.gltf> <여.gltf> <UAL.glb> <anims.glb> <동작,…>'); process.exit(2); }
const req = createRequire(path.join(process.env.GLTFT || '.', 'package.json'));
const load = (n) => import(pathToFileURL(req.resolve(n)).href);
const { NodeIO } = await load('@gltf-transform/core');
const { prune, dedup, meshopt, textureCompress, resample } = await load('@gltf-transform/functions');
const { ALL_EXTENSIONS } = await load('@gltf-transform/extensions');
const { MeshoptEncoder, MeshoptDecoder } = await load('meshoptimizer');
const sharp = (await load('sharp')).default;
await MeshoptEncoder.ready; await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });

// ── 1. villagers ──
// 원본 뼈 쉼 자세 (이름 → TRS). .gltf JSON 만 읽는다 (버퍼·그림 필요 없음)
function restOf(gltfPath) {
  const j = JSON.parse(fs.readFileSync(gltfPath, 'utf8'));
  const out = new Map();
  for (const i of j.skins[0].joints) { const n = j.nodes[i]; out.set(n.name, { t: n.translation || [0, 0, 0], r: n.rotation || [0, 0, 0, 1], s: n.scale || [1, 1, 1] }); }
  return out;
}
const REST = { m: restOf(maleGltf), f: restOf(femaleGltf) };
const doc = await io.read(rawPath);
const root = doc.getRoot();
const skinCheck = [];
for (const skin of root.listSkins()) {
  const joints = skin.listJoints();
  let best = null;
  for (const fam of ['m', 'f']) {
    let dev = 0;
    for (const j of joints) {
      const o = REST[fam].get(j.getName()); if (!o) { dev = Infinity; break; }
      const t = j.getTranslation(), r = j.getRotation(), s = j.getScale();
      dev = Math.max(dev, ...t.map((v, i) => Math.abs(v - o.t[i])), 1 - Math.abs(r.reduce((a, v, i) => a + v * o.r[i], 0)), ...s.map((v, i) => Math.abs(v - o.s[i])));
    }
    if (!best || dev < best.dev) best = { fam, dev };
  }
  skinCheck.push({ joints: joints.length, fam: best.fam, dev: +best.dev.toExponential(2) });
  if (!(best.dev < 1e-4)) throw new Error(`뼈 쉼 자세가 원본과 다르다 (${best.dev}): UAL 동작이 어긋난다. 배포 glb 를 덮지 않았다.`);
}
const texNames = root.listTextures().map((t) => t.getName() || t.getURI());
await doc.transform(
  dedup(),
  prune({ keepLeaves: true, keepAttributes: true }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [2048, 2048], quality: 86, pattern: /^people_skin$|people_skin\.png/ }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 86, pattern: /people_skin_n/ }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512], quality: 88, pattern: /people_cloth/ }),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);
doc.getRoot().getAsset().generator = 'past-life kit_clothes.py + gltf-transform';
const tmpOf = (f) => f.replace(/\.glb$/, '') + '.tmp.glb';      // 확장자가 .glb 여야 GLB 로 쓴다
const outTmp = tmpOf(outPath), animsTmp = tmpOf(animsOut);
await io.write(outTmp, doc);
let tris = {};
for (const n of root.listNodes()) {
  const m = n.getMesh(); if (!m) continue;
  let t = 0; for (const p of m.listPrimitives()) { const i = p.getIndices(); t += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3; }
  tris[n.getName()] = t;
}
const texBytes = root.listTextures().reduce((s, t) => s + (t.getImage()?.byteLength || 0), 0);
console.log(JSON.stringify({ out: path.basename(outPath), kb: Math.round(fs.statSync(outTmp).size / 1024), textures: texNames, textureKB: Math.round(texBytes / 1024), materials: root.listMaterials().map((m) => m.getName()), skins: skinCheck, tris }));

// ── 2. anims ──
const keep = new Set(clipList.split(','));
const ad = await io.read(ualPath);
const ar = ad.getRoot();
for (const a of ar.listAnimations()) {
  if (!keep.has(a.getName())) { for (const c of a.listChannels()) c.dispose(); for (const s of a.listSamplers()) s.dispose(); a.dispose(); continue; }
  for (const c of a.listChannels()) {
    const n = c.getTargetNode(), p = c.getTargetPath(), nm = n ? n.getName() : '';
    const drop = p === 'scale' || p === 'weights' || (p === 'translation' && nm !== 'pelvis') || nm === 'root';
    if (drop) { const s = c.getSampler(); c.dispose(); if (s && !a.listChannels().some((ch) => ch.getSampler() === s)) s.dispose(); }
  }
}
for (const n of ar.listNodes()) { if (n.getMesh()) n.setMesh(null); if (n.getSkin()) n.setSkin(null); }
for (const m of ar.listMeshes()) m.dispose();
for (const s of ar.listSkins()) s.dispose();
for (const m of ar.listMaterials()) m.dispose();
for (const t of ar.listTextures()) t.dispose();
await ad.transform(resample({ tolerance: 2e-4 }), prune({ keepLeaves: true }), dedup(), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
ad.getRoot().getAsset().generator = 'past-life kit_clothes.py + gltf-transform';
await io.write(animsTmp, ad);
fs.renameSync(outTmp, outPath);
fs.renameSync(animsTmp, animsOut);
console.log(JSON.stringify({ out: path.basename(animsOut), kb: Math.round(fs.statSync(animsOut).size / 1024), clips: ar.listAnimations().map((a) => [a.getName(), a.listChannels().length]) }));
