// 가문 성씨, 대물림, 명망 및 도감 시스템 단위 테스트
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateDynastyClan,
  generatePersonName,
  computeLifePrestige,
  computeInheritedWealth,
  getDynastyTier,
  createDynasty,
  prepareSuccessor,
  applyDynastyPerks,
  DYNASTY_TIERS,
} from '../dynasty.js';
import { createLife } from '../life.js';
import { makeStore } from '../soul.js';

test('문화권/지역별 가문 성씨 및 계통 생성', () => {
  const kr = generateDynastyClan('korea', 'east', 'seed-kr');
  assert.ok(kr.ko.includes('씨'), '한국 가문은 본관과 성씨 포함');
  assert.ok(kr.surname && kr.surname.ko, '성씨 객체 존재');

  const eu = generateDynastyClan('france', 'europe', 'seed-eu');
  assert.ok(eu.ko.includes('가문') || eu.en.includes('House') || eu.en.includes('Maison'), '유럽 가문 명칭');

  const jp = generateDynastyClan('japan', 'east', 'seed-jp');
  assert.ok(jp.ko.includes('가문'), '일본 가문 명칭');
});

test('가주 이름 생성 규칙 (동아시아: 성+이름, 서구: 이름+성)', () => {
  const krClan = { area: 'korea', region: 'east', surname: { ko: '박', en: 'Park' } };
  const krName = generatePersonName(krClan, 'm', 'seed-name-1');
  assert.ok(krName.ko.startsWith('박'), `한국 성씨가 앞에 위치 (${krName.ko})`);
  assert.ok(krName.en.endsWith('Park'), `영어 표기에서 성씨가 뒤에 위치 (${krName.en})`);

  const euClan = { area: 'britain', region: 'europe', surname: { ko: '스미스', en: 'Smith' } };
  const euName = generatePersonName(euClan, 'm', 'seed-name-2');
  assert.ok(euName.ko.endsWith('스미스'), `서구 표기는 이름 뒤에 성씨 (${euName.ko})`);
  assert.ok(euName.en.endsWith('Smith'), `영어 표기 성씨 (${euName.en})`);
});

test('생애 지표에 따른 가문 명망(Prestige) 계산', () => {
  const poorShortLife = {
    age: 25,
    stats: { wealth: 30 },
    status: 1,
    route: null,
    kids: 0,
    death: { age: 25, cause: 'fever' },
  };
  const p1 = computeLifePrestige(poorShortLife);
  assert.ok(p1 >= 2, '최소 기본 명망 보장');

  const grandLife = {
    age: 72,
    stats: { wealth: 95 },
    status: 4,
    route: 'artisan',
    kids: 4,
    death: { age: 72, cause: 'old' },
  };
  const p2 = computeLifePrestige(grandLife);
  // 장수(+5) + 거상(+7) + 고위신분(+4) + 가업(+3) + 자식(+4) = 23
  assert.ok(p2 >= 20, `위대한 생애 명망 누적: ${p2}pt`);
});

test('가문 명망 4대 등급 판정', () => {
  assert.equal(getDynastyTier(0).tier, 1, '0pt는 가문의 태동');
  assert.equal(getDynastyTier(8).tier, 1, '8pt는 가문의 태동');
  assert.equal(getDynastyTier(12).tier, 2, '12pt는 향토 유지');
  assert.equal(getDynastyTier(28).tier, 3, '28pt는 명망 높은 세가');
  assert.equal(getDynastyTier(55).tier, 4, '55pt는 천하의 명문가');
});

test('부모 재산 상속 (65% 승계 비율 및 클램프)', () => {
  assert.equal(computeInheritedWealth(100), 65);
  assert.equal(computeInheritedWealth(70), 46);
  assert.equal(computeInheritedWealth(20), 25, '최소 상속 하한선 25');
  assert.equal(computeInheritedWealth(150), 80, '최대 상속 상한선 80');
});

test('가문 창설(Founder) 및 2대 후계자 계승(Successor)', () => {
  const founderLife = {
    birth: {
      seed: 'SEED-TEST-F1',
      year: 1350,
      area: 'korea',
      region: 'east',
      household: 'farm',
      tags: ['farm'],
      wealth: 35,
      sex: 'm',
      order: 1,
    },
    age: 62,
    stats: { wealth: 74 },
    status: 3,
    route: 'artisan',
    kids: 3,
    death: { age: 62, year: 1412, cause: 'old', note: '가업을 온전히 지켰다' },
  };

  const dyn = createDynasty(founderLife, 'SEED-TEST-F1');
  assert.equal(dyn.gen, 1);
  assert.equal(dyn.members.length, 1);
  assert.ok(dyn.prestige >= 10, '창설자 명망 반영');
  assert.equal(dyn.area, 'korea');

  // 2대 후계자 생성
  const succ = prepareSuccessor({ parentLife: founderLife, dynasty: dyn });
  assert.equal(succ.dynasty.gen, 2, '2대 계승');
  assert.equal(succ.dynasty.members.length, 2, '선대 가주 기록 보존');
  assert.ok(succ.birth.year < 1412, '부모 사망 이전 출생');
  assert.ok(succ.birth.year > 1350, '부모 탄생 이후 출생');
  assert.equal(succ.birth.household, 'craft', '장인 가업 반영하여 공방(craft) 승계');
  assert.ok(succ.birth.wealth >= 48, '선대 유산 65% + 가문 특권 반영');
  assert.ok(succ.birth.dynasty, '출생 객체에 가문 메타데이터 첨부');

  // 후계자의 삶 시작 시 가문 특전 적용
  const heirLife = createLife({ birth: succ.birth, traces: [], player: true });
  applyDynastyPerks(heirLife, succ.dynasty);
  assert.equal(heirLife.flags.dynasty_heir, true);
  assert.ok(heirLife.attrs.charm >= 25, '가문 친화력 보너스');
});

test('가문 저장소 (loadDynasty / saveDynasty / loadDynastyDex / saveDynastyDex)', () => {
  const mem = new Map();
  const store = makeStore({
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => mem.set(k, v),
    removeItem: (k) => mem.delete(k),
  });

  assert.equal(store.loadDynasty(), null);
  assert.deepEqual(store.loadDynastyDex(), []);

  const sampleDyn = { id: 'dyn-1', gen: 2, prestige: 22, name: { ko: '밀양 박씨', en: 'Miryang Park' } };
  store.saveDynasty(sampleDyn);
  assert.deepEqual(store.loadDynasty(), sampleDyn);

  const dex = [sampleDyn];
  store.saveDynastyDex(dex);
  assert.deepEqual(store.loadDynastyDex(), dex);
});
