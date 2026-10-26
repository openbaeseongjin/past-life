import test from 'node:test';
import assert from 'node:assert/strict';
import { ESTATE_SLOTS, ESTATE_CATALOG, canBuyEstate, buyEstate, getEstatePropName, getInspectMessage } from '../estate.js';
import { createSound } from '../sound.js';
import { drawBirth } from '../birth.js';
import { createLife } from '../life.js';
import { createDynasty, prepareSuccessor } from '../dynasty.js';

test('ESTATE_SLOTS 및 ESTATE_CATALOG 무결성 검증', () => {
  assert.equal(ESTATE_SLOTS.length, 4);
  assert.deepEqual(ESTATE_SLOTS, ['livestock', 'transport', 'household', 'prestige']);

  for (const slot of ESTATE_SLOTS) {
    const catalog = ESTATE_CATALOG[slot];
    assert.ok(catalog, `Catalog for slot ${slot} must exist`);
    assert.equal(catalog.length, 3, `Slot ${slot} must have 3 tiers`);

    catalog.forEach((item, idx) => {
      assert.equal(item.tier, idx + 1);
      assert.ok(item.cost > 0, `Cost must be > 0 for tier ${item.tier}`);
      assert.ok(item.name.ko && item.name.en, `Name must be i18n for tier ${item.tier}`);
      assert.ok(item.desc.ko && item.desc.en, `Desc must be i18n for tier ${item.tier}`);
      assert.ok(item.propByKit.eastasia, `East Asia prop required for ${slot} t${item.tier}`);
      assert.ok(item.propByKit.england, `England prop required for ${slot} t${item.tier}`);
      assert.ok(typeof item.bonus === 'object');
    });
  }
});

test('canBuyEstate 구매 가능 여부 및 순차 승급 제약 검증', () => {
  const dummyLife = {
    stats: { wealth: 30, family: 50, happy: 50, health: 50 },
    estate: { livestock: 0, transport: 0, household: 0, prestige: 0 },
  };

  // 1. 재산 충분, 1티어 구매 가능 (인자 2개 또는 3개 모두 지원)
  assert.equal(canBuyEstate(dummyLife, 'livestock'), true);
  assert.equal(canBuyEstate(dummyLife, 'livestock', 1), true);

  // 2. 재산 부족 시 구매 불가 (비용 10인데 재산 5)
  dummyLife.stats.wealth = 5;
  assert.equal(canBuyEstate(dummyLife, 'livestock'), false);

  // 3. 순차 승급: 0티어에서 바로 2티어 건너뛰기 불가
  dummyLife.stats.wealth = 100;
  assert.equal(canBuyEstate(dummyLife, 'livestock', 2), false);

  // 1티어 달성 시 2티어 구매 가능
  dummyLife.estate.livestock = 1;
  assert.equal(canBuyEstate(dummyLife, 'livestock'), true);
  assert.equal(canBuyEstate(dummyLife, 'livestock', 2), true);

  // 2티어 달성 시 3티어 구매 가능
  dummyLife.estate.livestock = 2;
  assert.equal(canBuyEstate(dummyLife, 'livestock'), true);
  assert.equal(canBuyEstate(dummyLife, 'livestock', 3), true);

  // 3티어는 최고 티어이므로 추가 구매 불가
  dummyLife.estate.livestock = 3;
  assert.equal(canBuyEstate(dummyLife, 'livestock'), false);
});

test('buyEstate 재산 차감, 스탯 보너스 반영, 티어 갱신 검증', () => {
  const life = {
    stats: { wealth: 50, family: 50, happy: 50, health: 50, skill: 30 },
    attrs: { skill: 30, charm: 30 },
    estate: { livestock: 0, transport: 0, household: 0, prestige: 0 },
  };

  const res = buyEstate(life, 'household');
  assert.equal(res.ok, true);
  assert.equal(res.slot, 'household');
  assert.equal(res.tier, 1);
  assert.equal(life.estate.household, 1);
  assert.equal(life.stats.wealth, 50 - res.cost);
  // household t1 gives health +2, happy +2
  assert.equal(life.stats.health, 52);
  assert.equal(life.stats.happy, 52);

  // 2티어 장독대 승급
  const res2 = buyEstate(life, 'household');
  assert.equal(res2.ok, true);
  assert.equal(res2.tier, 2);
  assert.equal(life.estate.household, 2);
  // household t2 gives family +5, health +5
  assert.equal(life.stats.family, 55);
  assert.equal(life.stats.health, 57);
});

test('getEstatePropName 문화권 프롭 매핑 및 폴백 검증', () => {
  // livestock t1: chicken in england, duck_ea in eastasia
  assert.equal(getEstatePropName('livestock', 1, 'eastasia'), 'duck_ea');
  assert.equal(getEstatePropName('livestock', 1, 'england'), 'chicken');
  assert.equal(getEstatePropName('livestock', 3, 'eastasia'), 'ox_ea');
  assert.equal(getEstatePropName('livestock', 3, 'england'), 'cow');

  // 없는 문화권일 경우 폴백 매핑
  assert.ok(getEstatePropName('livestock', 1, 'unknown'));

  // 0티어는 프롭 없음
  assert.equal(getEstatePropName('livestock', 0, 'eastasia'), null);
});

test('가문 후계자 마당 살림(Estate) 상속 및 독립 복제 검증', () => {
  const birth = drawBirth('ESTATE-SUCCESSION-TEST');
  const parentLife = createLife({ birth, quiet: true });
  parentLife.stats.wealth = 80;
  parentLife.estate = { livestock: 2, transport: 1, household: 3, prestige: 1 };
  const dynasty = createDynasty(parentLife, 'ESTATE-DYNASTY-TEST');

  const res = prepareSuccessor({ parentLife, dynasty });
  assert.ok(res.birth.estate, 'Successor must inherit estate');
  assert.deepEqual(res.birth.estate, { livestock: 2, transport: 1, household: 3, prestige: 1 });

  // 상속 후 후계자의 살림이 확장되어도 선대의 살림 객체는 오염되지 않음 (Deep clone)
  res.birth.estate.livestock = 3;
  assert.equal(parentLife.estate.livestock, 2);

  // 후계자의 생애 생성 시 상속된 estate 정상 적용
  const heirLife = createLife({ birth: res.birth, quiet: true });
  assert.deepEqual(heirLife.estate, { livestock: 3, transport: 1, household: 3, prestige: 1 });
});

test('getInspectMessage 마당 살림 둘러보기 감성 텍스트 검증', () => {
  for (const slot of ESTATE_SLOTS) {
    for (let t = 1; t <= 3; t++) {
      const msgKo = getInspectMessage(slot, t, 'ko');
      const msgEn = getInspectMessage(slot, t, 'en');
      assert.ok(msgKo && msgKo.length >= 10, `${slot} t${t} ko text`);
      assert.ok(msgEn && msgEn.length >= 10, `${slot} t${t} en text`);
      assert.ok(msgKo.includes('('), 'Must contain stat bonus hint');
    }
  }
});

test('패키지 4: createSound 절차적 사운드 신시사이징(scroll, coin, brush) API 안정성 검증', () => {
  const soundDisabled = createSound(() => false);
  assert.doesNotThrow(() => {
    soundDisabled.chime();
    soundDisabled.tick();
    soundDisabled.bell();
    soundDisabled.scroll();
    soundDisabled.coin();
    soundDisabled.brush();
  });

  const soundEnabled = createSound(() => true);
  assert.doesNotThrow(() => {
    soundEnabled.chime();
    soundEnabled.tick();
    soundEnabled.bell();
    soundEnabled.scroll();
    soundEnabled.coin();
    soundEnabled.brush();
  });
});
