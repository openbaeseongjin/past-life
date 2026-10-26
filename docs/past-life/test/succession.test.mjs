import test from 'node:test';
import assert from 'node:assert/strict';
import { SUCCESSION_CARDS } from '../cards_succession.js';
import { DECK } from '../deck.js';
import { eligible } from '../cards.js';
import { cardFocusOf, cardWorkSpotOf } from '../cardscene.js';

const EFFECT_RANGE = { health: 25, wealth: 25, family: 25, happy: 25, luck: 20, charm: 20, know: 20, skill: 20, status: 1 };
const LIM = {
  ko: { text: 90, choice: 18, result: 70, title: 16 },
  en: { text: 180, choice: 40, result: 150, title: 40 },
};

test('상속 및 유언장 서사 카드 기본 규격 검증', () => {
  assert.equal(SUCCESSION_CARDS.length, 7);
  const ids = SUCCESSION_CARDS.map((c) => c.id);
  assert.equal(new Set(ids).size, 7);

  // DECK 에 모두 포함되어 있는지 확인
  for (const c of SUCCESSION_CARDS) {
    assert.ok(DECK.some((d) => d.id === c.id), `${c.id} missing in DECK`);
  }

  for (const c of SUCCESSION_CARDS) {
    for (const lang of ['ko', 'en']) {
      assert.ok(c.title[lang].length > 0 && c.title[lang].length <= LIM[lang].title, `${c.id} title ${lang}`);
      assert.ok(c.text[lang].length > 0 && c.text[lang].length <= LIM[lang].text, `${c.id} text ${lang}`);
    }
    assert.ok(c.choices.length >= 2 && c.choices.length <= 3, `${c.id} choices length`);

    for (const ch of c.choices) {
      for (const lang of ['ko', 'en']) {
        assert.ok(ch.text[lang].length > 0 && ch.text[lang].length <= LIM[lang].choice, `${c.id} choice text ${lang}`);
        assert.ok(ch.result[lang].length > 0 && ch.result[lang].length <= LIM[lang].result, `${c.id} choice result ${lang}`);
      }
      for (const [k, v] of Object.entries(ch.effects || {})) {
        assert.ok(EFFECT_RANGE[k], `${c.id} invalid effect key ${k}`);
        assert.ok(Number.isFinite(v) && v !== 0 && Math.abs(v) <= EFFECT_RANGE[k], `${c.id} effect out of range ${k}=${v}`);
      }
    }
  }
});

test('상속 카드의 단계별 조건 및 eligibility 동작 검증', () => {
  // 청년기 가업 상속 (c.succession.inherit)
  const ctxPrime = {
    stage: 'adult',
    age: 24,
    year: 1500,
    era: 9,
    group: 'early',
    region: 'east',
    area: 'korea',
    tags: ['craft'],
    sex: 'm',
    flags: {},
    traces: [],
    stats: { health: 50, wealth: 50, family: 50, happy: 50 },
    seen: [],
  };
  const cInherit = SUCCESSION_CARDS.find((c) => c.id === 'c.succession.inherit');
  assert.ok(eligible(cInherit, ctxPrime), 'c.succession.inherit should be eligible in adult stage');

  // 노년기 유언장 (c.succession.will)
  const ctxOld = {
    stage: 'old',
    age: 62,
    year: 1540,
    era: 9,
    group: 'early',
    region: 'east',
    area: 'korea',
    tags: ['craft'],
    sex: 'm',
    flags: {},
    traces: [],
    stats: { health: 40, wealth: 60, family: 50, happy: 50 },
    seen: [],
  };
  const cWill = SUCCESSION_CARDS.find((c) => c.id === 'c.succession.will');
  assert.ok(eligible(cWill, ctxOld), 'c.succession.will should be eligible in old stage');

  // 너무 가난한 노년기에는 유언장 카드가 제외됨 (재산 30 미만)
  const ctxPoorOld = { ...ctxOld, stats: { ...ctxOld.stats, wealth: 15 } };
  assert.ok(!eligible(cWill, ctxPoorOld), 'c.succession.will should not be eligible if too poor');
});

test('유언장 및 만년 공덕 특수 플래그 검증', () => {
  const cWill = SUCCESSION_CARDS.find((c) => c.id === 'c.succession.will');
  const stashChoice = cWill.choices.find((ch) => ch.flags && ch.flags.includes('buried_stash'));
  assert.ok(stashChoice, 'Will card must have buried_stash choice');

  const cEndow = SUCCESSION_CARDS.find((c) => c.id === 'c.succession.endowment');
  const endowChoice = cEndow.choices.find((ch) => ch.flags && ch.flags.includes('karmic_endowment'));
  assert.ok(endowChoice, 'Endowment card must have karmic_endowment choice');
});

test('상속 카드의 3D 장면 포커스(cardFocusOf) 정상 매핑 검증', () => {
  for (const c of SUCCESSION_CARDS) {
    const focus = cardFocusOf(c);
    assert.ok(['family', 'work', 'learn', 'rest', 'body'].includes(focus), `${c.id} focus: ${focus}`);
  }
});

test('마당 살림 및 가업 상속 카드 estate 옵션 검증', () => {
  const cInherit = SUCCESSION_CARDS.find((c) => c.id === 'c.succession.inherit');
  assert.deepEqual(cInherit.choices[0].estate, { slot: 'household', tier: 1 });

  const cHome = SUCCESSION_CARDS.find((c) => c.id === 'c.estate.homestead');
  assert.ok(cHome, 'c.estate.homestead must exist');
  assert.equal(cHome.choices.length, 3);
  assert.deepEqual(cHome.choices[0].estate, { slot: 'livestock', tier: 1 });
  assert.deepEqual(cHome.choices[1].estate, { slot: 'household', tier: 1 });
  assert.deepEqual(cHome.choices[2].estate, { slot: 'transport', tier: 1 });
});
