// 작업 2-1 수정 1차: 남아시아 세트의 시대·땅 갈래 (I-2) + 시험 보강 (M-4)
//   - 출생 2,000개(남아시아 세트를 쓰는 생)로 마을을 짜 보아, 600년 전·스리랑카·동남아에는 나가라 사원(temple_small)이 없고
//     인더스는 600~999년에만, 기원전 300년 전에는 두 층 읍내 집이 없다. 소달구지는 바퀴 해(남아시아 −2600, 동남아 −500) 전에 없다.
//   - 남아시아 마을 결정성, 잉글랜드 계획 고정(해시), BUILT_KITS ↔ KIT_SETS·RECIPES, 동남아 사람 물감
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { makeEnv, planVillage, planAll, recipeFor, recipeOf, flavorOf, pieceAllowed, RECIPES, SA_FLAVOR_OF, rng as vrng } from '../villageplan.js';
import { KIT_SETS, PROP_DIMS, PROP_DIMS_SA } from '../kitdata.js';
import { BUILT_KITS, stageOf, stageSeed, builtKit } from '../lands.js';
import { drawBirth } from '../birth.js';
import { planPeople, peopleSeed, PALETTES, paletteOf } from '../peopleplan.js';

const env = makeEnv();
const SEA = new Set(Object.keys(SA_FLAVOR_OF));
const saBirths = (n, tag = 'G-') => {
  const out = [];
  for (let i = 0; out.length < n && i < n * 20; i++) {
    const b = drawBirth(tag + i), s = stageOf(b);
    if (builtKit(s.kit) === 'southasia') out.push({ b, s });
  }
  return out;
};

test('출생 2,000개 (남아시아 세트): 600년 전·스리랑카·동남아에는 나가라 사원이 없고, 인더스는 600~999년만, 기원전 300년 전에는 읍내 집이 없다', () => {
  const births = saBirths(2000);
  assert.equal(births.length, 2000);
  let temples = 0, shrines = 0, ancient = 0, sea = 0;
  for (const { b, s } of births) {
    const area = s.variant, y = b.year;
    const layout = planVillage(stageSeed(b), env, recipeFor('southasia', { year: y, area }));
    const placed = [...layout.fixed.map((f) => f.piece), ...layout.houses.map((h) => h.piece), ...layout.farms.map((h) => h.piece)];
    const hasTemple = placed.includes('temple_small');
    const may = y >= 600 && area !== 'lanka' && !SEA.has(area) && (area !== 'indus' || y < 1000);
    assert.equal(hasTemple, may, `${b.seed} ${y} ${area}: 사원 ${hasTemple}`);
    if (!hasTemple) assert.equal(layout.fixed.find((f) => f.role === 'church').piece, 'shrine_tree', '사원 자리는 신당');
    if (y < -300) assert.ok(!placed.includes('house_town'), `${b.seed} ${y}: 기원전 300년 전 읍내 집`);
    temples += hasTemple; shrines += !hasTemple; ancient += y < 600; sea += SEA.has(area);
  }
  assert.ok(temples > 100 && shrines > 100 && ancient > 500 && sea > 20, `표본이 고르다: 사원 ${temples} 신당 ${shrines} 고대 ${ancient} 동남아 ${sea}`);
});

test('소달구지는 바퀴 해 전에 없고 그 뒤에는 있다 (남아시아 −2600, 동남아 −500), 사원 대신 신당이면 보리수가 선다', () => {
  const cases = [[-4000, 'india', false], [-2000, 'india', true], [-1500, 'mainland_sea', false], [200, 'indonesia', true], [1304, 'india', true]];
  for (const [year, area, carts] of cases) {
    for (const seed of [1329, 7932]) {
      const { layout, dressing } = planAll(seed, env, undefined, PROP_DIMS_SA, 'southasia', { year, area });
      assert.equal(dressing.items.some((it) => it.p === 'cart_bullock'), carts, `${year} ${area} 시드 ${seed}: 소달구지`);
      if (layout.fixed.find((f) => f.role === 'church').piece === 'shrine_tree') {
        const T = RECIPES.southasia.sites.temple;
        assert.ok(dressing.trees.some((t) => t.sp === 'peepal' && Math.hypot(t.x - T.x, t.z - T.z) < 0.01), `${year} ${area}: 신당 보리수`);
      }
    }
  }
  assert.equal(pieceAllowed('southasia', 'cart_bullock', -2600, 'india'), true);
  assert.equal(pieceAllowed('southasia', 'cart_bullock', -2601, 'india'), false);
  assert.equal(pieceAllowed('southasia', 'temple_small', 999, 'indus'), true);
  assert.equal(pieceAllowed('southasia', 'temple_small', 1000, 'indus'), false);
});

test('거를 것이 없으면 요리법은 원래 객체 그대로 (중세 인도·잉글랜드 계획이 수정 전과 같다), 같은 시드는 같은 마을', () => {
  assert.equal(recipeFor('southasia', { year: 1304, area: 'india' }), RECIPES.southasia);
  assert.equal(recipeFor('england', { year: 1329, area: 'britain' }), RECIPES.england);
  assert.equal(recipeFor('southasia', { year: -500, area: 'india' }), recipeFor('southasia', { year: -400, area: 'bengal' }), '같은 거름은 같은 요리법 객체');
  for (const ctx of [{ year: 1304, area: 'india' }, { year: -900, area: 'indus' }, { year: 1500, area: 'indonesia' }]) {
    for (const seed of [1329, 542790959]) {
      const a = JSON.stringify(planAll(seed, env, undefined, PROP_DIMS_SA, 'southasia', ctx), (k, v) => (typeof v === 'function' ? undefined : v));
      const b = JSON.stringify(planAll(seed, env, undefined, PROP_DIMS_SA, 'southasia', ctx), (k, v) => (typeof v === 'function' ? undefined : v));
      assert.equal(a, b, `${JSON.stringify(ctx)} 시드 ${seed}: 결정성`);
    }
  }
});

// 잉글랜드 마을 계획을 고정한다 (단계 B·수정 1차 전후로 같음을 확인한 값). 작업 2·3 이 잉글랜드 계획을 바꾸면 여기서 알린다.
const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16).padStart(8, '0'); };
test('잉글랜드 마을 계획 고정 (시드 4개, layout + dressing 해시)', () => {
  const want = { 1329: 'ad711b09', 7932: 'e003aead', 15851: 'd18ef368', 542790959: 'd35d808c' };
  for (const [seed, h] of Object.entries(want)) {
    const { layout, dressing } = planAll(+seed, env, undefined, PROP_DIMS, 'england');
    assert.equal(fnv(JSON.stringify({ layout, dressing })), h, `시드 ${seed}`);
  }
});

test('BUILT_KITS 의 세트마다 KIT_SETS·RECIPES·사람 glb 가 있고, 갈래 사람 glb 도 있다', () => {
  for (const k of BUILT_KITS) {
    assert.ok(KIT_SETS[k], `KIT_SETS.${k}`);
    assert.ok(RECIPES[k] && recipeOf(k) === RECIPES[k], `RECIPES.${k}`);
    assert.ok(RECIPES[k].activity && RECIPES[k].activity.bed && RECIPES[k].activity.seat, `RECIPES.${k}.activity`);
    for (const f of [KIT_SETS[k].kit, KIT_SETS[k].props, KIT_SETS[k].trees].filter(Boolean)) assert.ok(fs.existsSync(new URL(`../assets/real/kits/${f}.glb`, import.meta.url)), `${f}.glb`);
    const ppl = [KIT_SETS[k].people, ...Object.values(KIT_SETS[k].flavors || {}).map((f) => f.people)];
    for (const p of ppl) assert.ok(fs.existsSync(new URL(`../assets/real/people/${p}.glb`, import.meta.url)), `${p}.glb`);
    for (const f of Object.values(KIT_SETS[k].flavors || {})) assert.ok(PALETTES[f.palette], `물감 ${f.palette}`);
  }
  for (const a of SEA) assert.equal(flavorOf('southasia', a), 'seasia');
  assert.equal(flavorOf('southasia', 'india'), null);
  assert.equal(flavorOf('england', 'indonesia'), null);
});

test('동남아 갈래 사람: 동남아 물감만, 남아시아 세트 활동(아궁이·끈 침상)은 그대로', () => {
  const P = paletteOf('southasia', 'seasia');
  assert.equal(P, PALETTES.seasia);
  for (const seed of [1329, 7932]) {
    const { layout, dressing } = planAll(seed, env, undefined, PROP_DIMS_SA, 'southasia', { year: 1500, area: 'indonesia' });
    const ppl = planPeople(vrng(peopleSeed(seed)), 16, { layout, dressing, fieldAt: env.fieldAt, propDims: PROP_DIMS_SA, kit: 'southasia', flavor: 'seasia' });
    for (const p of ppl) assert.ok(P.dyes.some((q) => q.join() === p.palette.prim.join()), '주색은 동남아 물감');
  }
});
