// 지역·땅·집안·탄생 (설계 3장)
import test from 'node:test';
import assert from 'node:assert/strict';
import { AREA_SHARE } from '../world.js';
import { REGIONS, AREAS, regionShare, drawPlace, ARRIVE, AREA_ARRIVE, settled } from '../places.js';
import { GROUPS, HOUSEHOLDS, drawHousehold, householdOf } from '../households.js';
import { drawBirth } from '../birth.js';
import { createRng } from '../rng.js';

test('지역 비율은 해마다 합 1, 검증값과 맞다', () => {
  for (const y of [-50000, -3000, 1, 1347, 1600, 1900, 2010]) {
    const s = REGIONS.reduce((a, g) => a + regionShare(g, y), 0);
    assert.ok(Math.abs(s - 1) < 1e-3, `${y}: ${s}`);
  }
  assert.ok(Math.abs(regionShare('east', 0) - 0.254) < 0.002);
  assert.ok(Math.abs(regionShare('south', 0) - 0.365) < 0.002);
  assert.ok(Math.abs(regionShare('europe', 0) - 0.135) < 0.002);
  assert.ok(Math.abs(regionShare('americas', 1600) - 0.020) < 0.002);
});

test('땅 이름표가 자료와 하나하나 맞다', () => {
  let n = 0;
  for (const g of REGIONS) for (const a of Object.keys(AREA_SHARE[g])) {
    n++;
    assert.ok(AREAS[a], a);
    assert.equal(AREAS[a].region, g, a);
    assert.ok(AREAS[a].ko && AREAS[a].en && AREAS[a].short.ko && AREAS[a].short.en, a);
  }
  assert.equal(Object.keys(AREAS).length, n);
});

test('drawPlace 는 그해 비율을 따른다 (1년 동아시아 약 25%)', () => {
  const r = createRng('place');
  let east = 0;
  for (let i = 0; i < 20000; i++) if (drawPlace(r, 0).region === 'east') east++;
  assert.ok(Math.abs(east / 20000 - 0.254) < 0.015);
});

test('집안 표: 묶음마다 있고, 바닷가 없는 땅에서는 바다 집안이 안 나온다', () => {
  for (const g of GROUPS) assert.ok(HOUSEHOLDS[g].length >= 1, g);
  const r = createRng('home');
  for (let i = 0; i < 2000; i++) assert.ok(!drawHousehold(r, 'medieval', AREAS.mongolia).tags.includes('sea'));
  assert.equal(householdOf('ancient', 'farm').ko, '농사짓는 집');
});

test('drawBirth: 같은 시드 = 같은 탄생, 필드가 다 있다', () => {
  const a = drawBirth('TEST-0001'), b = drawBirth('TEST-0001');
  assert.deepEqual(a, b);
  for (const k of ['seed', 'year', 'era', 'group', 'region', 'area', 'household', 'tags', 'wealth', 'sex', 'order']) assert.ok(k in a, k);
  assert.ok(['m', 'f'].includes(a.sex));
  assert.ok(a.order >= 1 && a.order <= 5);
  assert.equal(AREAS[a.area].region, a.region);
});

test('drawBirth(after): 다음 생은 앞 생이 죽은 뒤, 남은 사람이 없으면 null', () => {
  for (let i = 0; i < 200; i++) assert.ok(drawBirth('S-' + i, 1500).year > 1500);
  assert.equal(drawBirth('S-x', 2022), null);
});

test('사람이 닿기 전의 지역·땅에서는 태어나지 않는다 (2만 번), 시대 비율은 그대로', () => {
  const n = 20000;
  let anc = 0, mod = 0, early = 0;
  for (let i = 0; i < n; i++) {
    const b = drawBirth('ARR-' + i);
    if (b.year < (ARRIVE[b.region] ?? -Infinity)) assert.fail(`${b.year} ${b.region}`);
    if (b.year < (AREA_ARRIVE[b.area] ?? -Infinity)) assert.fail(`${b.year} ${b.area}`);
    // −60000 전에는 아프리카와 북아프리카(나일·마그레브)뿐
    if (b.year < -60000) { early++; assert.ok(b.region === 'africa' || ['nile', 'maghreb'].includes(b.area), `${b.year} ${b.region} ${b.area}`); }
    if (b.year >= -8000 && b.year < 1) anc++;
    if (b.year >= 1950) mod++;
  }
  assert.ok(early > 0);
  assert.ok(Math.abs(anc / n - 0.3933) < 0.015, `기원전 8000~기원후 1: ${anc / n}`);
  assert.ok(Math.abs(mod / n - 0.0779) < 0.015, `1950 이후: ${mod / n}`);
  // 정해진 해에 바로 뽑아도 같다
  const r = createRng('arrive');
  for (const y of [-150000, -58000, -47000, -40000, -20000, -11500, -5000]) for (let i = 0; i < 2000; i++) {
    const { region, area } = drawPlace(r, y);
    assert.ok(settled(region, area, y) && AREAS[area].region === region, `${y} ${region} ${area}`);
  }
});

test('출생 성비는 약 105:100', () => {
  let m = 0;
  for (let i = 0; i < 20000; i++) if (drawBirth('sex-' + i).sex === 'm') m++;
  assert.ok(Math.abs(m / 20000 - 0.512) < 0.012, String(m / 20000));
});
