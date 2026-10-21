// 공개 사이트(GitHub Pages, main 가지 뿌리)에 올릴 런타임 파일만 한 폴더로 모은다. main 에 올리지는 않는다 (사람이 확인하고 올린다)
//   node tools/build_pages.mjs [나갈 폴더=../../_site] [--clean] [--dry]   (--dry: 쓰지 않고 확인만, 담을 목록을 JSON 으로)
// 담는 것 (CLAUDE.md 「공개 사이트 갱신」): docs/past-life/*.js · index.html · CONTENT-SOURCES*.md · assets/hex.glb · assets/geo/*.json ·
//   assets/real/{SOURCES.md, people/*.glb, tex/*, kits/*.glb·*.json} · tools/pages/{README.md, .nojekyll}
// 빼는 것: 시험·도구·미리보기·시험 화면(*-test.html, look-real.html) · build_share.py · package.json
// 확인: index.html 이 여는 main.js 에서 정적·동적 import 를 따라가 우리 모듈이 다 들었는지, 코드에 적힌 assets/… 파일이 다 있는지, 시험 화면이 섞이지 않았는지
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(path.dirname(fileURLToPath(import.meta.url)));   // docs/past-life
const ROOT = path.resolve(HERE, '..', '..');
const args = process.argv.slice(2);
const OUT = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(ROOT, '_site'));
if (OUT === HERE || OUT.startsWith(HERE + path.sep) || OUT === ROOT) throw new Error(`나갈 폴더가 원본 안이다: ${OUT}`);

const rel = (p) => path.relative(HERE, p).split(path.sep).join('/');
const files = [];   // [원본, 나갈 상대 경로]
const add = (src, to = rel(src)) => files.push([src, to]);
const list = (dir, re) => (fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => re.test(f) && fs.statSync(path.join(dir, f)).isFile()).sort().map((f) => path.join(dir, f)) : []);

for (const f of list(HERE, /\.js$/)) add(f);
add(path.join(HERE, 'index.html'));
for (const f of list(HERE, /^CONTENT-SOURCES.*\.md$/)) add(f);
if (fs.existsSync(path.join(HERE, 'assets', 'hex.glb'))) add(path.join(HERE, 'assets', 'hex.glb'));
for (const f of list(path.join(HERE, 'assets', 'geo'), /\.json$/)) add(f);
add(path.join(HERE, 'assets', 'real', 'SOURCES.md'));
for (const f of list(path.join(HERE, 'assets', 'real', 'people'), /\.glb$/)) add(f);
for (const f of list(path.join(HERE, 'assets', 'real', 'tex'), /\.(jpe?g|png|webp|ktx2)$/i)) add(f);
for (const f of list(path.join(HERE, 'assets', 'real', 'kits'), /\.(glb|json)$/)) add(f);
add(path.join(HERE, 'tools', 'pages', 'README.md'), 'README.md');
add(path.join(HERE, 'tools', 'pages', '.nojekyll'), '.nojekyll');

// ── 확인 ──
const have = new Set(files.map(([, to]) => to));
const bad = [];
for (const [, to] of files) if (/(^|\/)(test|tools|preview)(\/|$)|-test\.html$|^look-real\.html$|\.(mjs|py)$/.test(to)) bad.push(`섞이면 안 되는 파일: ${to}`);
// main.js 에서 우리 모듈을 따라간다 (import … from './x.js' · import('./x.js'))
const seen = new Set();
(function walk(name) {
  if (seen.has(name)) return;
  seen.add(name);
  if (!have.has(name)) { bad.push(`모듈이 없다: ${name}`); return; }
  const src = fs.readFileSync(path.join(HERE, name), 'utf8');
  for (const m of src.matchAll(/(?:from\s+|import\s*\(\s*)'\.\/([\w-]+\.js)'/g)) walk(m[1]);
})('main.js');
if (!/src="\.\/main\.js"/.test(fs.readFileSync(path.join(HERE, 'index.html'), 'utf8'))) bad.push('index.html 이 ./main.js 를 열지 않는다');
// 코드에 적힌 자산 경로 (assets/…/이름.확장자). 글자 이어 붙이기로 만든 이름은 앞부분만 보이므로 확장자까지 적힌 것만 본다
for (const name of seen) {
  const src = fs.readFileSync(path.join(HERE, name), 'utf8');
  for (const m of src.matchAll(/['"`](?:\.\/)?(assets\/[\w./-]+\.(?:glb|json|jpe?g|png))['"`]/g)) if (!have.has(m[1])) bad.push(`${name} 이 찾는 자산이 없다: ${m[1]}`);
}
for (const [src] of files) if (!fs.existsSync(src)) bad.push(`원본이 없다: ${rel(src)}`);
if (bad.length) { console.error(bad.join('\n')); process.exit(1); }

if (args.includes('--dry')) { console.log(JSON.stringify({ files: files.map(([, to]) => to), modules: [...seen] })); process.exit(0); }
// ── 쓰기 ──
if (args.includes('--clean') && fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true });
let bytes = 0;
for (const [src, to] of files) {
  const dst = path.join(OUT, to);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
  bytes += fs.statSync(src).size;
}
const unused = list(HERE, /\.js$/).map(rel).filter((n) => !seen.has(n));
console.log(`${OUT}\n파일 ${files.length}개 · ${(bytes / 1048576).toFixed(1)} MB · main.js 에서 닿는 모듈 ${seen.size}개${unused.length ? ` (안 쓰는 모듈도 담음: ${unused.join(', ')})` : ''}`);
console.log('main 에 올리기 (사용자에게 먼저 묻는다): 이 폴더 내용을 main 가지 뿌리에 그대로 두고 [deploy] 커밋 → push');
