// Blender 가 내보낸 세트 glb → meshopt 압축 + 텍스처 WebP(1K, 그늘 지도는 2K) glb.
// tools/blender/kit_common.py 가 내보내기 다음에 이 도구를 부른다. 손으로 부를 때:
//   GLTFT=<gltf-transform 이 깔린 폴더> node docs/past-life/tools/pack_kit.mjs <입력.glb> <출력.glb>
// 개발 도구는 저장소에 넣지 않는다 (tools/pack_hex.mjs 와 같은 방식):
//   npm i --prefix <폴더> @gltf-transform/core@4 @gltf-transform/functions@4 @gltf-transform/extensions@4 meshoptimizer@0.21 sharp
// three.js 쪽은 GLTFLoader.setMeshoptDecoder(MeshoptDecoder) 가 필요하다 (WebP 는 EXT_texture_webp, 브라우저 기본 지원).
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) { console.error('사용: node pack_kit.mjs <입력.glb> <출력.glb>'); process.exit(2); }
const req = createRequire(path.join(process.env.GLTFT || '.', 'package.json'));
const load = (n) => import(pathToFileURL(req.resolve(n)).href);
const { NodeIO } = await load('@gltf-transform/core');
const { prune, dedup, meshopt, textureCompress } = await load('@gltf-transform/functions');
const { ALL_EXTENSIONS } = await load('@gltf-transform/extensions');
const { MeshoptEncoder, MeshoptDecoder } = await load('meshoptimizer');
const sharp = (await load('sharp')).default;
await MeshoptEncoder.ready; await MeshoptDecoder.ready;

const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(inPath);
// 빈 노드(smithy_forge, *_smoke)와 쓰지 않는 UV 도 남긴다: 코드가 이름으로 찾는다
await doc.transform(
  dedup(),
  prune({ keepLeaves: true, keepAttributes: true }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [2048, 2048], quality: 80, slots: /^occlusionTexture$/ }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 78, slots: /^baseColorTexture$/ }),
  // 노멀: 가까이서 결이 중요한 초가·돌·슬레이트·나무는 1K, 나머지(회벽·흙벽·자갈·천·판자·벽돌·막돌·바닥·기와)는 512
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [512, 512], quality: 80, slots: /^normalTexture$/, pattern: /plaster|clay|cobble|linen|plank|broken_wall|japanese_stone|brick_wall|weathered|hinoki|rubble|granite|earth|floor|boards|roof_tile/ }),
  textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 80, slots: /^normalTexture$/, pattern: /^(?!.*(plaster|clay|cobble|linen|plank|broken_wall|japanese_stone|brick_wall|weathered|hinoki|rubble|granite|earth|floor|boards|roof_tile))/ }),
  meshopt({ encoder: MeshoptEncoder, level: 'high' }),
);
// 결과를 늘 같게: 생성기 문자열 고정
doc.getRoot().getAsset().generator = 'past-life kit_common.py + gltf-transform';
await io.write(outPath, doc);

const root = doc.getRoot();
let tris = 0;
for (const m of root.listMeshes()) for (const p of m.listPrimitives()) { const i = p.getIndices(); tris += (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3; }
const texBytes = root.listTextures().reduce((s, t) => s + (t.getImage()?.byteLength || 0), 0);
console.log(JSON.stringify({ out: outPath, kb: Math.round(fs.statSync(outPath).size / 1024), textures: root.listTextures().length, textureKB: Math.round(texBytes / 1024), materials: root.listMaterials().map((m) => m.getName()), tris }));
