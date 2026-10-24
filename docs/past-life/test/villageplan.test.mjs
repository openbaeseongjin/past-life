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

test('큰 집 장소 (setting === "estate"): 4대 문화권 큰 집 중심 + 하인 집 3~5채 + 장터 없음', async () => {
  const { recipeFor, planVillage } = await import('../villageplan.js');
  const EXPECT = {
    england: 'manor',
    southasia: 'haveli',
    eastasia: 'courtyard_estate',
    mudbrick: 'palace_mb',
  };
  for (const [kit, piece] of Object.entries(EXPECT)) {
    const rc = recipeFor(kit, { setting: 'estate' });
    assert.equal(rc.setting, 'estate', `${kit} setting`);
    assert.equal(rc.estatePiece, piece, `${kit} estatePiece`);
    assert.ok(rc.fixed.some((f) => f.role === 'estate' && f.piece === piece), `${kit} fixed estate`);
    assert.equal(rc.noMarket, true, `${kit} noMarket`);

    for (const s of [1329, 42, 999]) {
      const layout = planVillage(s, env, rc);
      assert.ok(layout.estate, `${kit} layout.estate`);
      assert.equal(layout.estate.piece, piece, `${kit} estate piece`);
      assert.ok(layout.houses.length >= 3 && layout.houses.length <= 5, `${kit} 하인 집 3~5채: ${layout.houses.length}`);
      assert.equal(layout.stalls.length, 0, `${kit} stalls 0`);
      assert.equal(layout.awnings.length, 0, `${kit} awnings 0`);
      for (const h of layout.houses) {
        assert.ok(h.croft, `${kit} 하인 집 croft 보유`);
      }
    }
  }
});

test('5대 마을 골격 (Morphologies): 문화권·시대별 수계·도로·차선·농가·카메라가 고유하게 구성되고 정상 배치된다', async () => {
  const { MORPHOLOGIES, makeEnv, planVillage, recipeFor } = await import('../villageplan.js');
  const morphKeys = ['england', 'eastasia', 'mudbrick', 'southasia', 'steppe'];
  assert.deepEqual(Object.keys(MORPHOLOGIES).sort(), morphKeys.sort());

  for (const m of morphKeys) {
    const M = MORPHOLOGIES[m];
    assert.ok(Array.isArray(M.riverPts) && M.riverPts.length >= 5, `${m} riverPts`);
    assert.ok(Array.isArray(M.roads) && M.roads.length >= 3, `${m} roads`);
    assert.ok(Array.isArray(M.lanes) && M.lanes.length >= 3, `${m} lanes`);
    assert.ok(Array.isArray(M.farms), `${m} farms`);
    assert.ok(M.vc && typeof M.vc.x === 'number' && typeof M.vc.z === 'number', `${m} vc`);
    assert.ok(typeof M.riverHw === 'number' && M.riverHw > 0, `${m} riverHw`);
    assert.ok(M.overview && M.overview.pos && M.overview.look, `${m} overview`);

    const envM = makeEnv(m);
    assert.equal(envM.morphology, m);
    assert.equal(envM.riverHw, M.riverHw);
    assert.equal(envM.lanes, M.lanes);
    assert.equal(envM.farms, M.farms);

    const kit = m === 'steppe' ? 'eastasia' : m;
    const rc = recipeFor(kit);
    const layout = planVillage(1329, envM, rc);
    assert.ok(layout.houses.length > 0, `${m} houses > 0`);
    if (m === 'steppe') {
      assert.equal(layout.farms.length, 0, '초원/야영지는 외딴 농가 없음');
    } else {
      assert.equal(layout.farms.length, M.farms.length, `${m} farms match`);
    }
  }
});
