// assets/src (KayKit gltf) → assets/hex.glb : 루트 노드 하나 = 모델 하나 (이름 = 파일 이름), meshopt 압축
// 개발 도구 gltf-transform 이 필요하다 (저장소에는 안 넣는다):
//   npm i --prefix <폴더> @gltf-transform/core@4 @gltf-transform/functions@4 @gltf-transform/extensions@4 meshoptimizer@0.21
//   GLTFT=<폴더> node tools/pack_hex.mjs
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const req = createRequire(path.join(process.env.GLTFT || '.', 'package.json'));
const load = (n) => import(pathToFileURL(req.resolve(n)).href);
const { NodeIO } = await load('@gltf-transform/core');
const { prune, dedup, mergeDocuments, unpartition, meshopt } = await load('@gltf-transform/functions');
const { ALL_EXTENSIONS } = await load('@gltf-transform/extensions');
const { MeshoptEncoder, MeshoptDecoder } = await load('meshoptimizer');
await MeshoptEncoder.ready; await MeshoptDecoder.ready;

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'assets', 'src');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith('.gltf') ? [path.join(d, e.name)] : []));
const files = walk(SRC).sort();

const doc = await io.read(files[0]);
const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
const wrap = (sc, name) => { const root = doc.createNode(name); for (const c of sc.listChildren()) { sc.removeChild(c); root.addChild(c); } return root; };
const roots = [wrap(scene, path.basename(files[0], '.gltf'))];
for (const f of files.slice(1)) {
  const before = new Set(doc.getRoot().listScenes());
  mergeDocuments(doc, await io.read(f));
  for (const sc of doc.getRoot().listScenes()) if (!before.has(sc)) { roots.push(wrap(sc, path.basename(f, '.gltf'))); sc.dispose(); }
}
for (const r of roots) scene.addChild(r);
await doc.transform(unpartition(), dedup(), prune({ keepAttributes: false, keepLeaves: true }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }));
const out = path.join(ROOT, 'assets', 'hex.glb');
await io.write(out, doc);
console.log('hex.glb', (fs.statSync(out).size / 1024).toFixed(0) + ' KB', roots.length + '개');
