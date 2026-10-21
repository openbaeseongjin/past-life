// 마을 짜기·꾸미기 규칙(villageplan.js, three 없는 순수 모듈)을 여러 시드로 시험한다
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, planAll, smoothLine, YARD_PIECES, LANES } from '../villageplan.js';
import { PROP_DIMS } from '../kitdata.js';

const env = makeEnv();
const SEEDS = Array.from({ length: 200 }, (_, i) => (i === 0 ? 1329 : (i * 7919 + 13) >>> 0));
const plans = new Map(SEEDS.map((s) => [s, planAll(s, env, undefined, PROP_DIMS)]));

test('같은 시드면 같은 마을이 나온다 (환경을 새로 지어도)', () => {
  const env2 = makeEnv();
  for (const s of [1329, 7, 424242]) {
    const a = JSON.stringify(planAll(s, env, undefined, PROP_DIMS)), b = JSON.stringify(planAll(s, env2, undefined, PROP_DIMS));
    assert.equal(a, b, `시드 ${s}`);
  }
  assert.notEqual(JSON.stringify(plans.get(1329).layout.houses), JSON.stringify(planAll(7, env, undefined, PROP_DIMS).layout.houses));
});

test('시드 200개: 장터 좌판 2 + 천막 3~5', () => {
  for (const [s, { layout, dressing }] of plans) {
    assert.equal(layout.stalls.length, 2, `시드 ${s} 좌판`);
    assert.ok(layout.awnings.length >= 3 && layout.awnings.length <= 5, `시드 ${s} 천막 ${layout.awnings.length}`);
    assert.equal(dressing.items.filter((i) => i.p === 'cloth_awning').length, layout.awnings.length, `시드 ${s} 천막 소품 수`);
  }
});

test('시드 200개: 강가 양 떼(주 무리) 15~30마리', () => {
  for (const [s, { dressing }] of plans) {
    const n = dressing.items.filter((i) => i.p === 'sheep' && i.flock === 'main').length;
    assert.ok(n >= 15 && n <= 30, `시드 ${s} 양 ${n}`);
  }
});

test('시드 200개: 집마다 뒤뜰(마당)이 있고 마당 소품이 2~5개', () => {
  for (const [s, { layout, dressing }] of plans) {
    assert.ok(layout.houses.length >= 30, `시드 ${s} 집 ${layout.houses.length}`);
    const cnt = new Map();
    for (const it of dressing.items) if (it.yard != null) { assert.ok(YARD_PIECES.includes(it.p), `마당 소품 종류 ${it.p}`); cnt.set(it.yard, (cnt.get(it.yard) || 0) + 1); }
    layout.houses.forEach((h, hi) => {
      assert.ok(h.croft, `시드 ${s} 집 ${hi} 뒤뜰 없음`);
      const n = cnt.get(hi) || 0;
      assert.ok(n >= 2 && n <= 5, `시드 ${s} 집 ${hi} 마당 소품 ${n}`);
    });
  }
});

test('smoothLine: 끝점을 지나고 간격이 거의 고르다', () => {
  for (const lane of LANES) {
    const pts = smoothLine(lane, 3), first = pts[0], last = pts[pts.length - 1];
    assert.ok(Math.hypot(first[0] - lane[0][0], first[1] - lane[0][1]) < 1e-6 && Math.hypot(last[0] - lane.at(-1)[0], last[1] - lane.at(-1)[1]) < 1e-6);
    const d = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
    assert.ok(Math.max(...d) - Math.min(...d) < 0.05, `간격 ${Math.min(...d)}~${Math.max(...d)}`);
  }
});
