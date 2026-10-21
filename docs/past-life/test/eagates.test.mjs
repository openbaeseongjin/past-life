// 작업 2-2: 동아시아 세트의 시대·땅 갈래와 농사 전 야영
//   - 출생 1,500개(동아시아 세트를 쓰는 생)로 마을을 짜 보아: 절·탑(절 문 포함)은 불교가 닿은 해(중국 100, 한국 372, 일본 538) 뒤에만,
//     기와집·큰 집 대문은 중국 −1000·한국 300·일본 590 뒤에만, 농사 전(FARM_FROM) 해에는 움집·야영 화덕만 (장터·가축·수레 없음)
//   - 갈래(한국·일본)는 그 땅 건물 크기 표·사람 glb·물감, 수렵 시대 생은 동아시아 야영으로 (lands.js sceneKitOf)
//   - 잉글랜드·남아시아 마을과 사람 계획 고정 (작업 2-2 전과 같은 해시)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, planVillage, planAll, recipeFor, flavorOf, pieceAllowed, isCampYear, RECIPES, PIECE_GATES, EA_FLAVOR_OF, rng as vrng } from '../villageplan.js';
import { KIT_SETS, KIT_DIMS_EA, KIT_DIMS_EA_KR, KIT_DIMS_EA_JP, PROP_DIMS, PROP_DIMS_SA, PROP_DIMS_EA, TREES_EA, TREE_GLB_EA } from '../kitdata.js';
import { stageOf, stageSeed, builtKit, sceneKitOf } from '../lands.js';
import { FARM_FROM } from '../context_data.js';
import { drawBirth } from '../birth.js';
import { planPeople, peopleSeed, PALETTES, paletteOf, campVariant } from '../peopleplan.js';

const env = makeEnv();
const BUDDHA = { china: 100, korea: 372, japan: 538 }, TILE = { china: -1000, korea: 300, japan: 590 };
const DIMS = { china: KIT_DIMS_EA, korea: KIT_DIMS_EA_KR, japan: KIT_DIMS_EA_JP };
const eaBirths = (n, tag = 'EAG-') => {
  const out = [];
  for (let i = 0; out.length < n && i < n * 40; i++) {
    const b = drawBirth(tag + i), s = stageOf(b);
    if (sceneKitOf(s) === 'eastasia') out.push({ b, s });
  }
  return out;
};

test('출생 1,500개 (동아시아 세트): 절·탑·기와집·대문은 정한 해 뒤에만, 농사 전 해에는 움집·야영 화덕만, 조각은 그 갈래 크기 표에 있다', () => {
  const births = eaBirths(1500);
  assert.equal(births.length, 1500);
  const n = { temple: 0, noTemple: 0, camp: 0, korea: 0, japan: 0 };
  for (const { b, s } of births) {
    const area = s.variant, y = b.year, V = flavorOf('eastasia', area) || 'china';
    const R = recipeFor('eastasia', { year: y, area });
    const layout = planVillage(stageSeed(b), env, R);
    const placed = [...layout.fixed.map((f) => f.piece), ...layout.houses.map((h) => h.piece), ...layout.farms.map((h) => h.piece)];
    for (const p of placed) assert.ok(p in DIMS[V], `${b.seed} ${y} ${area}: ${p} 가 ${V} 크기 표에 없다`);
    assert.equal(R.dims, DIMS[V], `${b.seed}: ${V} 크기 표`);
    const camp = isCampYear(area, y);
    assert.equal(R.camp, camp);
    if (camp) {
      assert.deepEqual([...new Set(placed)].sort(), ['camp_hearth', 'pit_house_ea'], `${b.seed} ${y} ${area}: 야영`);
      assert.equal(layout.stalls.length, 0, '야영에는 장터가 없다');
      n.camp++;
      continue;
    }
    const hasTemple = placed.includes('temple_ea');
    assert.equal(hasTemple, y >= BUDDHA[V], `${b.seed} ${y} ${area}: 절 ${hasTemple}`);
    assert.equal(placed.includes('pagoda_small'), hasTemple, '탑은 절과 함께');
    if (!hasTemple) assert.equal(layout.fixed.find((f) => f.role === 'church').piece, 'shrine_ea', '절 자리는 마을 사당');
    if (y < TILE[V]) {   // 기와집·집 대문은 기와 해 뒤에만 (절 문은 절과 함께 — 절 기와는 불교와 같이 왔다)
      assert.ok(!placed.includes('house_tile_ea'), `${b.seed} ${y} ${area}: 기와집`);
      assert.ok(!layout.fixed.some((f) => f.role === 'biggate'), `${b.seed} ${y} ${area}: 큰 집 대문`);
      assert.equal(placed.filter((p) => p === 'gate_ea').length, hasTemple ? 1 : 0, `${b.seed} ${y} ${area}: 대문 수`);
    }
    n.temple += hasTemple; n.noTemple += !hasTemple; n.korea += V === 'korea'; n.japan += V === 'japan';
  }
  assert.ok(n.temple > 300 && n.noTemple > 100 && n.camp > 5 && n.korea > 25 && n.japan > 50, `표본이 고르다: ${JSON.stringify(n)}`);
});

test('경계 해: 불교(중국 100·한국 372·일본 538), 기와(한국 300·일본 590), 장독(한국 300~), 통(일본 1300~), 일본에는 돼지·물소가 없다', () => {
  for (const [area, y] of Object.entries(BUDDHA)) {
    assert.equal(pieceAllowed('eastasia', 'temple_ea', y - 1, area), false, `${area} ${y - 1}`);
    assert.equal(pieceAllowed('eastasia', 'temple_ea', y, area), true, `${area} ${y}`);
  }
  assert.equal(pieceAllowed('eastasia', 'house_tile_ea', 299, 'korea'), false);
  assert.equal(pieceAllowed('eastasia', 'house_tile_ea', 300, 'korea'), true);
  assert.equal(pieceAllowed('eastasia', 'house_tile_ea', 589, 'japan'), false);
  assert.equal(pieceAllowed('eastasia', 'jangdok', 1700, 'korea'), true);
  assert.equal(pieceAllowed('eastasia', 'jangdok', 1700, 'china'), false);
  assert.equal(pieceAllowed('eastasia', 'taru_ea', 1299, 'japan'), false);
  assert.equal(pieceAllowed('eastasia', 'taru_ea', 1300, 'japan'), true);
  assert.equal(pieceAllowed('eastasia', 'pig', 1700, 'japan'), false);
  assert.equal(pieceAllowed('eastasia', 'buffalo_ea', 1700, 'japan'), false);
  assert.equal(pieceAllowed('eastasia', 'buffalo_ea', 1700, 'china'), true);
  for (const a of ['china', 'korea', 'japan']) {
    assert.equal(isCampYear(a, FARM_FROM[a] - 1), true);
    assert.equal(isCampYear(a, FARM_FROM[a]), false);
  }
  for (const p of Object.keys(PIECE_GATES.eastasia)) assert.ok(p in KIT_DIMS_EA || p in PROP_DIMS_EA, `거름 표의 ${p} 가 세트에 없다`);
});

test('시대·땅마다 소품: 야영에는 가축·수레·장독이 없고, 한국은 장독·돌담, 일본은 통, 중국은 물소', () => {
  const has = (year, area, seed = 3029) => { const { dressing } = planAll(seed, env, undefined, PROP_DIMS_EA, 'eastasia', { year, area }); return new Set(dressing.items.map((it) => it.p)); };
  for (const [year, area] of [[-1256, 'japan'], [-29341, 'china'], [-4000, 'korea']]) {
    const s = has(year, area);
    for (const p of ['ox_ea', 'buffalo_ea', 'pig', 'chicken', 'cart_ea', 'jangdok', 'jars_ea', 'taru_ea', 'rice_rack']) assert.ok(!s.has(p), `${year} ${area}: 야영에 ${p}`);
  }
  const kr = has(1700, 'korea'), jp = has(1700, 'japan'), cn = has(1410, 'china');
  assert.ok(kr.has('jangdok') && kr.has('wall_stone_ea') && !kr.has('taru_ea'), '한국 장독·돌담');
  assert.ok(jp.has('taru_ea') && !jp.has('pig') && !jp.has('jangdok'), '일본 통');
  assert.ok(cn.has('buffalo_ea') && cn.has('jars_ea') && !cn.has('jangdok'), '중국 물소·독');
  for (const s of [kr, jp, cn]) for (const p of s) assert.ok(p in PROP_DIMS_EA, `세트에 없는 소품 ${p}`);
});

test('갈래와 무대 세트: 한국·일본은 갈래 glb·사람·물감, 수렵 시대 동아시아 생은 동아시아 야영 (다른 땅은 그대로)', () => {
  assert.equal(flavorOf('eastasia', 'china'), null);
  for (const [area, fl] of Object.entries(EA_FLAVOR_OF)) {
    assert.equal(flavorOf('eastasia', area), fl);
    const F = KIT_SETS.eastasia.flavors[fl];
    assert.ok(F && F.kit === 'eastasia_' + fl && F.people === 'villagers_' + fl && PALETTES[F.palette], `갈래 ${fl}`);
  }
  let forager = 0, other = 0;
  for (let i = 0; i < 6000; i++) {
    const b = drawBirth('EAF-' + i), s = stageOf(b);
    if (s.era !== 'forager') { assert.equal(sceneKitOf(s), builtKit(s.kit)); continue; }
    const own = ['china', 'korea', 'japan'].includes(s.variant);
    if (own) { assert.equal(sceneKitOf(s), 'eastasia', `${b.seed} ${s.variant}`); forager++; } else { assert.equal(sceneKitOf(s), builtKit(s.kit), `${b.seed} ${s.variant}`); other++; }
  }
  assert.ok(forager > 3 && other > 50, `수렵 생 동아시아 ${forager} · 다른 땅 ${other}`);
});

test('동아시아 사람 (갈래마다 시드 4개): 그 갈래 물감·검은 머리, 야영에는 물들이지 않은 빛·수수한 옷만, 대장장이는 모루 앞, 같은 시드는 같은 계획', () => {
  const cases = [[1410, 'china', null, 'eastasia'], [1700, 'korea', 'korea', 'korea'], [1700, 'japan', 'japan', 'japan'], [-1256, 'japan', 'japan', 'eastasia_camp'], [-29341, 'china', null, 'eastasia_camp']];
  for (const h of PALETTES.eastasia.hairs) assert.ok(Math.max(...h) < 0.1, '검정·짙은 갈색 머리만');
  for (const [year, area, fl, palName] of cases) {
    const R = recipeFor('eastasia', { year, area }), P = PALETTES[palName];
    assert.equal(paletteOf('eastasia', fl, R.camp), P, `${year} ${area}: 물감 ${palName}`);
    for (const seed of [1329, 7932, 15851, 542790959]) {
      const plan = () => { const { layout, dressing } = planAll(seed, env, undefined, PROP_DIMS_EA, 'eastasia', { year, area }); return planPeople(vrng(peopleSeed(seed)), 16, { layout, dressing, fieldAt: env.fieldAt, propDims: PROP_DIMS_EA, kit: 'eastasia', flavor: fl, camp: R.camp }); };
      const ppl = plan();
      assert.equal(ppl.length, 16);
      assert.equal(JSON.stringify(ppl), JSON.stringify(plan()), `${year} ${area} 시드 ${seed}: 결정성`);
      for (const p of ppl) {
        assert.ok(P.dyes.some((q) => q.join() === p.palette.prim.join()), `${year} ${area}: 주색 ${p.palette.prim}`);
        if (p.variant !== 'elder') assert.ok(P.hairs.some((q) => q.join() === p.palette.hair.join()), `머리색 ${p.palette.hair}`);
      }
      if (R.camp) {
        assert.ok(!ppl.some((p) => p.action === 'hoe'), '야영에는 괭이질이 없다');
        const bad = { china: ['m_field', 'm_hood', 'f_cloak'], korea: ['m_field', 'm_hood', 'm_tunic', 'elder', 'f_cloak'], japan: ['m_field', 'm_hood', 'm_tunic', 'f_cloak'] }[fl || 'china'];
        for (const p of ppl) assert.ok(!bad.includes(p.variant), `${year} ${area}: 야영에 시대 뚜렷한 옷 ${p.variant}`);
        for (const v of bad) assert.notEqual(campVariant(v, fl), v);
      }
      else { const smith = ppl.find((p) => p.action === 'hammer'); assert.ok(smith && smith.variant === 'm_smith', `${year} ${area} 시드 ${seed}: 대장장이`); }
    }
  }
  const camp = PALETTES.eastasia_camp;
  for (const c of [...camp.dyes, ...camp.plain]) assert.ok(c[0] >= c[1] && c[1] >= c[2], `야영 물감은 흙·가죽 빛 ${c}`);
});

test('동아시아 나무: 종 이름이 겹치지 않고, 섞기 무게의 종이 모두 있다', () => {
  const sps = new Set([...TREES_EA.map((t) => t.sp), ...TREE_GLB_EA.map((t) => t.sp)]);
  assert.equal(sps.size, TREES_EA.length + TREE_GLB_EA.length);
  for (const mix of [KIT_SETS.eastasia.treeMix.monsoon, ...Object.values(KIT_SETS.eastasia.flavors).map((f) => f.treeMix)]) for (const sp of Object.keys(mix)) assert.ok(sps.has(sp), `종 무게의 ${sp}`);
  for (const sp of Object.values(KIT_SETS.eastasia.treeSwap)) assert.ok(sps.has(sp), `나무 짝 ${sp}`);
  for (const seed of [1329, 7932]) {
    const { dressing } = planAll(seed, env, undefined, PROP_DIMS_EA, 'eastasia', { year: 1700, area: 'korea' });
    for (const t of dressing.trees) assert.ok(sps.has(t.sp), `나무 종 ${t.sp}`);
  }
});

// 잉글랜드·남아시아 마을 + 사람 계획 고정: 작업 2-2 전에 잰 해시 (layout+dressing / 사람 16명)
const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16).padStart(8, '0'); };
const strip = (k, v) => (typeof v === 'function' ? undefined : v);
// 마을·사람 계획은 소수점 끝자리가 V8 판(Node 22 ↔ 24)마다 달라, 0.0001 로 반올림해 잰다 (2026-10-21 클라우드 세션, Node 22·24 에서 같은 값).
const r4 = (k, v) => (typeof v === 'number' ? Math.round(v * 1e4) / 1e4 : v);
test('잉글랜드·남아시아 마을과 사람 계획이 작업 2-2 전과 같다 (시드 18개)', () => {
  const EN = { 1329: '3991ea0b/37c2ffaf', 7932: 'c0cdcaee/9b36683c', 15851: 'bd21ba7a/a99a65d4', 542790959: 'a319a1ac/2279b867', 11: '4676b2bc/e5cceeba', 222: '644a71e9/07cd6333' };
  for (const [seed, want] of Object.entries(EN)) {
    const { layout, dressing } = planAll(+seed, env, undefined, PROP_DIMS, 'england');
    const ppl = planPeople(vrng(peopleSeed(+seed)), 16, { layout, dressing, fieldAt: env.fieldAt, propDims: PROP_DIMS, kit: 'england' });
    assert.equal(fnv(JSON.stringify({ layout, dressing }, r4)) + '/' + fnv(JSON.stringify(ppl, r4)), want, `잉글랜드 시드 ${seed}`);
  }
  const SA = {
    '1304india': ['eb05e4b9/1c9d4fa9', 'a9be822b/8f54ab5d', 'b1f1a043/89bd233e'],
    '-900indus': ['42cc2d95/ef86e7fa', '7313ff97/14df630d', 'd2ab78c0/7a4c0b08'],
    '1500indonesia': ['fbb04a53/e7257972', 'f0a113f1/f0d130d8', '3d767a8b/7f9bec38'],
    '200lanka': ['1580bc2f/2f1c520b', '5c9e821e/ffa8e983', '0296a11e/3d560524'],
  };
  for (const [k, wants] of Object.entries(SA)) {
    const year = parseInt(k, 10), area = k.slice(String(year).length);
    [1329, 542790959, 7932].forEach((seed, i) => {
      const { layout, dressing } = planAll(seed, env, undefined, PROP_DIMS_SA, 'southasia', { year, area });
      const ppl = planPeople(vrng(peopleSeed(seed)), 16, { layout, dressing, fieldAt: env.fieldAt, propDims: PROP_DIMS_SA, kit: 'southasia', flavor: area === 'indonesia' ? 'seasia' : null });
      assert.equal(fnv(JSON.stringify({ layout, dressing }, (k2, v) => r4(k2, strip(k2, v)))) + '/' + fnv(JSON.stringify(ppl, r4)), wants[i], `남아시아 ${k} 시드 ${seed}`);
    });
  }
  assert.equal(recipeFor('england', { year: 1329, area: 'britain' }), RECIPES.england);
});
