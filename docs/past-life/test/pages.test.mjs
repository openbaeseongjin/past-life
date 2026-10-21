// 공개 사이트 모으기 (tools/build_pages.mjs --dry): 런타임 파일이 다 들고, 시험·도구·미리보기는 섞이지 않는다
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const tool = fileURLToPath(new URL('../tools/build_pages.mjs', import.meta.url));
const out = JSON.parse(execFileSync(process.execPath, [tool, '/tmp/pl-pages-dry', '--dry'], { encoding: 'utf8' }));

test('공개 사이트 목록: 런타임 파일이 다 든다', () => {
  for (const f of ['index.html', 'main.js', 'ui.js', 'realscene.js', 'worldmap.js', 'geo.js', 'phase.js', 'assets/geo/land.json', 'assets/real/SOURCES.md', 'README.md', '.nojekyll', 'CONTENT-SOURCES.md'])
    assert.ok(out.files.includes(f), f);
  assert.ok(out.files.some((f) => /^assets\/real\/kits\/.*\.glb$/.test(f)) && out.files.some((f) => /^assets\/real\/people\/.*\.glb$/.test(f)) && out.files.some((f) => /^assets\/real\/tex\//.test(f)));
  for (const m of out.modules) assert.ok(out.files.includes(m), `main.js 에서 닿는 모듈 ${m}`);
  assert.ok(out.modules.includes('realscene.js') && out.modules.includes('worldmap.js'), '동적 import 도 따라간다');
});

test('공개 사이트 목록: 시험·도구·미리보기·시험 화면은 없다', () => {
  for (const f of out.files) assert.ok(!/(^|\/)(test|tools|preview)\/|-test\.html$|^look-real\.html$|\.(mjs|py)$|package\.json$/.test(f), f);
});
