// 태어난 땅 → 무대 (lands.js, three 없는 순수 모듈): 40개 땅이 모두 정해진 이름으로 이어지고, 같은 출생이면 같은 무대가 나온다.
// 시대는 엔진의 출생 묶음(birth.group)과 같아야 한다 (집안도 같은 묶음에서 뽑히므로 {시대, 자리}가 어긋나지 않게)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AREAS } from '../places.js';
import { HOUSEHOLDS } from '../households.js';
import { drawBirth } from '../birth.js';
import { groupOf } from '../births.js';
import { stageOf, stageSeed, kitOf, eraOf, builtKit, morphologyOf, MORPHOLOGIES, LANDS, KITS, ERAS, SETTINGS, HOUSEHOLD_SETTING, AREA_STAGE, LAND_LOOK, BUILT_KITS } from '../lands.js';

test('40개 땅마다 땅 모습·세트가 정해진 이름이고, 표에 없는 땅이나 남는 땅이 없다', () => {
  assert.equal(Object.keys(AREAS).length, 40);
  assert.deepEqual(Object.keys(AREA_STAGE).sort(), Object.keys(AREAS).sort());
  for (const [area, [land, kit, later = []]] of Object.entries(AREA_STAGE)) {
    assert.ok(LANDS.includes(land), `${area}: 땅 모습 ${land}`);
    assert.ok(KITS.includes(kit), `${area}: 세트 ${kit}`);
    let prev = -Infinity;
    for (const [y, k] of later) { assert.ok(KITS.includes(k) && y > prev, `${area}: 세트 바꿈 ${y} ${k}`); prev = y; }
  }
  for (const land of LANDS) assert.ok(Object.values(AREA_STAGE).some((r) => r[0] === land), `${land} 를 쓰는 땅이 없다`);
  for (const land of LANDS) assert.ok(LAND_LOOK[land], `${land} 의 땅 모습 값`);
  assert.deepEqual(ERAS, ['forager', 'ancient', 'medieval', 'early', 'industrial', 'modern']);
});

test('모든 땅·여러 해에서 stageOf 가 정해진 이름(세트·땅·시대·자리·변형)을 돌려주고, 시대는 groupOf 와 같다', () => {
  const years = [-60000, -9000, -8001, -8000, -5000, -2000, -500, 1, 300, 599, 600, 1189, 1329, 1499, 1500, 1650, 1799, 1800, 1900, 1949, 1950, 2000];
  for (const area of Object.keys(AREAS)) for (const year of years) for (const household of ['farm', 'elite', 'band']) {
    const s = stageOf({ seed: 'x', year, area, household });
    assert.ok(KITS.includes(s.kit), `${area} ${year}: ${s.kit}`);
    assert.ok(LANDS.includes(s.land), `${area} ${year}: ${s.land}`);
    assert.equal(s.era, groupOf(year), `${area} ${year}: 시대`);
    assert.ok(SETTINGS.includes(s.setting), `${area} ${year}: ${s.setting}`);
    assert.equal(typeof s.variant, 'string');
    if (year >= 1950) assert.equal(s.kit, 'modern');
    if (year < -8000) { assert.equal(s.era, 'forager'); assert.equal(s.kit, 'steppe'); assert.equal(s.setting, 'camp'); }
    assert.ok(BUILT_KITS.includes(builtKit(s.kit)), '지금 지은 세트로 대신 그린다');
  }
  assert.deepEqual(stageOf({ seed: 'a', year: 1189, area: 'britain', household: 'farm', group: 'medieval' }), { kit: 'england', land: 'temperate', era: 'medieval', setting: 'village', variant: 'britain' });
  assert.equal(stageOf({ seed: 'a', year: 1304, area: 'india', household: 'farm' }).land, 'monsoon');
  assert.equal(stageOf({ seed: 'a', year: 1304, area: 'india', household: 'farm' }).kit, 'southasia');
  assert.equal(stageOf({ seed: 'a', year: 1410, area: 'china', household: 'farm' }).kit, 'eastasia');
  assert.equal(stageOf({ seed: 'a', year: 900, area: 'nile', household: 'farm' }).kit, 'mudbrick');
  assert.equal(stageOf({ seed: 'a', year: -3054, area: 'west_africa', household: 'fish' }).setting, 'shore');   // 옛 판에서 수렵 세트·물가로 어긋나던 출생
  assert.equal(stageOf({ seed: 'a', year: -3054, area: 'west_africa', household: 'fish' }).kit, 'africa');
  assert.equal(kitOf('britain', 1850), 'earlymodern');
  assert.equal(kitOf('north_america', 1200), 'steppe');
  assert.equal(kitOf('north_america', 1700), 'england');
  assert.equal(kitOf('mongolia', 1200), 'steppe');
  assert.equal(eraOf({ year: -5000 }), 'ancient');
  assert.equal(eraOf({ year: 1000, group: 'medieval' }), 'medieval');
  for (const b of [null, {}, { area: 'atlantis', year: 1000 }]) { const s = stageOf(b); assert.equal(s.kit, 'england'); assert.equal(s.land, 'temperate'); }
});

test('엔진이 뽑은 출생 3,000개: 시대 = birth.group, 수렵 시대는 늘 야영지(camp·steppe 세트), 자리는 집안 표대로', () => {
  let forager = 0;
  for (let i = 0; i < 3000; i++) {
    const b = drawBirth('ERA-' + i), s = stageOf(b);
    assert.equal(s.era, b.group, `${b.seed} ${b.area} ${b.year}`);
    if (b.group === 'forager') { forager++; assert.equal(s.setting, 'camp', `${b.seed} 수렵인데 ${s.setting}`); assert.equal(s.kit, 'steppe'); }
    else assert.equal(s.setting, HOUSEHOLD_SETTING[b.household], `${b.seed} ${b.household}`);
    if (b.group === 'modern') assert.equal(s.kit, 'modern');
  }
  assert.ok(forager > 0, '수렵 시대 출생이 시험에 들어 있다');
});

test('households.js 의 모든 집안이 여섯 자리 가운데 하나로 이어진다', () => {
  const ids = new Set(Object.values(HOUSEHOLDS).flat().map((h) => h.id));
  assert.deepEqual([...ids].sort(), Object.keys(HOUSEHOLD_SETTING).sort());
  for (const id of ids) assert.ok(SETTINGS.includes(HOUSEHOLD_SETTING[id]), `${id} → ${HOUSEHOLD_SETTING[id]}`);
  for (const s of SETTINGS) assert.ok(Object.values(HOUSEHOLD_SETTING).includes(s), `${s} 를 쓰는 집안이 없다`);
  assert.equal(HOUSEHOLD_SETTING.serve, 'estate');
  assert.equal(stageOf({ seed: 'a', year: 1500, area: 'britain', household: 'nobody' }).setting, 'village');
});

test('같은 출생이면 같은 무대·같은 무대 시드, 다른 시드면 무대 시드가 달라진다', () => {
  const seen = new Set();
  for (let i = 0; i < 400; i++) {
    const b = drawBirth('LANDS-' + i), b2 = drawBirth('LANDS-' + i);
    assert.deepEqual(stageOf(b), stageOf(b2));
    assert.equal(stageSeed(b), stageSeed(b2));
    const s = stageSeed(b);
    assert.ok(Number.isInteger(s) && s > 0 && s < 2 ** 32, `무대 시드 ${s}`);
    seen.add(s);
  }
  assert.ok(seen.size > 395, '무대 시드가 거의 겹치지 않는다');
  assert.equal(stageSeed({ seed: 'T4-151' }), stageSeed({ seed: 'T4-151', year: 1 }));   // 시드만 본다
});

test('morphologyOf: 문화권·시대·장소에 따라 5대 마을 구조 프로필을 올바르게 판별한다', () => {
  assert.equal(morphologyOf({ kit: 'eastasia', era: 'early', setting: 'village' }), 'eastasia');
  assert.equal(morphologyOf({ kit: 'eastasia', era: 'forager', setting: 'camp' }), 'steppe');
  assert.equal(morphologyOf({ kit: 'mudbrick', era: 'ancient', setting: 'village' }), 'mudbrick');
  assert.equal(morphologyOf({ kit: 'southasia', era: 'medieval', setting: 'village' }), 'southasia');
  assert.equal(morphologyOf({ kit: 'england', era: 'medieval', setting: 'village' }), 'england');
  assert.equal(morphologyOf({ kit: 'steppe', era: 'medieval', setting: 'camp' }), 'steppe');
  assert.equal(morphologyOf(null), 'england');
  assert.deepEqual(MORPHOLOGIES, ['england', 'eastasia', 'mudbrick', 'southasia', 'steppe']);
});
