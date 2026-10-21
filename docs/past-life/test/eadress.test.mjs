// 동아시아 세트 검토 (클라우드 2026-10-21): 옷이 시대를 가린다 — 조선 전에는 갓·두루마기 없음, 에도 무렵 전에는 넓은 오비·하오리 없음.
// glb 는 그대로 두고 이미 있는 수수한 변형으로 바꿔 입힌다 (peopleplan.js ERA_SWAP · dressVariant). 마을 사람·내 사람·곁 사람 모두
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { makeEnv, planAll, recipeFor, rng as vrng } from '../villageplan.js';
import { PROP_DIMS_EA } from '../kitdata.js';
import { planPeople, peopleSeed, ERA_SWAP, eraVariant, dressVariant, campVariant, GREY_HAIR } from '../peopleplan.js';

const env = makeEnv();
const SEEDS = [1329, 7932, 15851, 542790959, 11, 222, 3, 77];
const people = (year, area, fl) => SEEDS.flatMap((seed) => {
  const R = recipeFor('eastasia', { year, area });
  const { layout, dressing } = planAll(seed, env, undefined, PROP_DIMS_EA, 'eastasia', { year, area });
  return planPeople(vrng(peopleSeed(seed)), 16, { layout, dressing, fieldAt: env.fieldAt, propDims: PROP_DIMS_EA, kit: 'eastasia', flavor: fl, camp: R.camp, year });
});

test('한국: 1392년 전 마을에는 갓·두루마기(m_hood·elder)가 없고, 조선에는 있다', () => {
  for (const year of [400, 1000, 1391]) {
    const v = people(year, 'korea', 'korea').map((p) => p.variant);
    assert.ok(!v.includes('m_hood') && !v.includes('elder'), `${year}: ${[...new Set(v)]}`);
  }
  const v = people(1700, 'korea', 'korea').map((p) => p.variant);
  assert.ok(v.includes('m_hood') || v.includes('elder'), '조선에는 갓 쓴 사람이 있다');
});

test('일본: 1600년 전 마을에는 넓은 오비·하오리(f_cloak·m_hood)가 없고, 에도에는 있다', () => {
  for (const year of [800, 1300, 1599]) {
    const v = people(year, 'japan', 'japan').map((p) => p.variant);
    assert.ok(!v.includes('f_cloak') && !v.includes('m_hood'), `${year}: ${[...new Set(v)]}`);
  }
  const v = people(1750, 'japan', 'japan').map((p) => p.variant);
  assert.ok(v.includes('f_cloak') || v.includes('m_hood'), '에도에는 넓은 오비·하오리가 있다');
});

test('바꿈표: 바꾼 변형도 같은 glb 에 있는 변형 · 중국·다른 세트는 그대로 · 야영 옷이 먼저 · 해가 없으면 그대로 · 흰머리는 그대로', () => {
  const KNOWN = ['m_field', 'm_hood', 'm_tunic', 'm_smith', 'f_apron', 'f_cloak', 'child', 'elder'];
  for (const [fl, rows] of Object.entries(ERA_SWAP)) for (const [, swap] of rows) for (const [a, b] of Object.entries(swap)) { assert.ok(KNOWN.includes(a) && KNOWN.includes(b), `${fl} ${a}→${b}`); assert.ok(!Object.keys(swap).includes(b), '바꾼 것이 다시 바뀌지 않는다'); }
  assert.equal(eraVariant('m_hood', 'korea', 1391), 'm_tunic'); assert.equal(eraVariant('m_hood', 'korea', 1392), 'm_hood');
  assert.equal(eraVariant('f_cloak', 'japan', 1599), 'f_apron'); assert.equal(eraVariant('f_cloak', 'japan', 1600), 'f_cloak');
  assert.equal(eraVariant('m_hood', null, 900), 'm_hood', '중국(갈래 없음)은 그대로');
  assert.equal(eraVariant('m_hood', 'korea', undefined), 'm_hood', '해를 모르면 그대로');
  assert.equal(dressVariant('m_hood', { flavor: 'korea', year: -2000, camp: true }), campVariant('m_hood', 'korea'));
  const old = people(1000, 'korea', 'korea').filter((p) => p.palette.hair === GREY_HAIR);
  assert.ok(old.length > 0, '고려 노인도 흰머리');
});

test('무대(realscene.js)의 내 사람·곁 사람도 같은 바꿈을 쓴다', () => {
  const src = fs.readFileSync(new URL('../realscene.js', import.meta.url), 'utf8');
  assert.ok(/const meVariant = \(b, age\) => dress\(/.test(src), '내 사람');
  assert.ok(/variant: dress\(v, b\)/.test(src), '곁 사람');
  assert.ok(/planPeople\([^)]*year: opts\.era/.test(src), '마을 사람에게 태어난 해');
});
