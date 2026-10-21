// 카드 고르기 (설계 5장)
import test from 'node:test';
import assert from 'node:assert/strict';
import { stageOf, slotAges, SLOTS, eligible, pickCard } from '../cards.js';
import { createRng } from '../rng.js';

const T = { ko: '글', en: 'text' };
const C2 = [{ text: T, result: T }, { text: T, result: T }];
const card = (id, stage, when, extra = {}) => ({ id, stage, when, text: T, choices: C2, ...extra });
const ctx = (over = {}) => ({ stage: 'child', age: 9, year: 1100, era: 7, group: 'medieval', region: 'europe', area: 'france', coast: true, tags: ['farm'], sex: 'f', flags: {}, traces: [], dream: null, stats: { health: 50, wealth: 50, family: 50, happy: 50 }, seen: [], ...over });

test('stageOf', () => {
  assert.deepEqual([0, 4, 5, 12, 13, 19, 20, 39, 40, 59, 60, 90].map(stageOf), ['baby', 'baby', 'child', 'child', 'teen', 'teen', 'adult', 'adult', 'middle', 'middle', 'old', 'old']);
});

test('slotAges: 13칸, 시드마다 같고, 겹치지 않는다', () => {
  const a = slotAges('S1');
  assert.equal(a.length, 13);
  assert.deepEqual(a, slotAges('S1'));
  assert.equal(new Set(a).size, 13);
  a.forEach((x, i) => assert.ok(Math.abs(x - SLOTS[i]) <= 1, `${i}:${x}`));
});

test('eligible: 단계·묶음·지역·집안·바닷가·성별·플래그·흔적·나이·수치·이미 본 카드', () => {
  assert.ok(eligible(card('a', 'child'), ctx()));
  assert.ok(!eligible(card('a', 'teen'), ctx()));
  assert.ok(eligible(card('a', ['teen', 'child']), ctx()));
  assert.ok(!eligible(card('a', 'child', { eraGroups: ['ancient'] }), ctx()));
  assert.ok(!eligible(card('a', 'child', { regions: ['east'] }), ctx()));
  assert.ok(!eligible(card('a', 'child', { areas: ['korea'] }), ctx()));
  assert.ok(!eligible(card('a', 'child', { tags: ['sea'] }), ctx()));
  assert.ok(!eligible(card('a', 'child', { coast: true }), ctx({ coast: false })));
  assert.ok(!eligible(card('a', 'child', { sex: 'm' }), ctx()));
  assert.ok(!eligible(card('a', 'child', { flags: ['married'] }), ctx()));
  assert.ok(eligible(card('a', 'child', { flags: ['married'] }), ctx({ flags: { married: true } })));
  assert.ok(!eligible(card('a', 'child', { notFlags: ['married'] }), ctx({ flags: { married: true } })));
  assert.ok(!eligible(card('a', 'child', { trace: 'fear:sea' }), ctx()));
  assert.ok(eligible(card('a', 'child', { trace: 'fear:sea' }), ctx({ traces: [{ kind: 'fear', key: 'sea' }] })));
  assert.ok(!eligible(card('a', 'child', { minAge: 10 }), ctx()));
  assert.ok(!eligible(card('a', 'child', { stat: { wealth: [60, 100] } }), ctx()));
  assert.ok(!eligible(card('a', 'child'), ctx({ seen: ['a'] })));
  assert.ok(!eligible(card('a', 'child', undefined, { event: 'blackdeath' }), ctx()));
  // 맞는 조건은 통과한다
  assert.ok(eligible(card('a', 'child', { eras: [7] }), ctx()));
  assert.ok(!eligible(card('a', 'child', { eras: [3] }), ctx()));
  assert.ok(eligible(card('a', 'child', { regions: ['europe'], areas: ['france'], tags: ['farm'], sex: 'f', coast: true }), ctx()));
  assert.ok(!eligible(card('a', 'child', { maxAge: 8 }), ctx()));
  assert.ok(eligible(card('a', 'child', { minAge: 9, maxAge: 9 }), ctx()));
  assert.ok(eligible(card('a', 'child', { stat: { wealth: [50, 50] } }), ctx()));
  // 해 조건 (ctx.year 1100)
  assert.ok(!eligible(card('a', 'child', { minYear: 1101 }), ctx()));
  assert.ok(!eligible(card('a', 'child', { maxYear: 1099 }), ctx()));
  assert.ok(eligible(card('a', 'child', { minYear: 1100, maxYear: 1100 }), ctx()));
});

test('pickCard: 맞는 카드만, 시대·지역·집안이 정해진 카드는 두 배 자주, 없으면 null', () => {
  const deck = [card('plain', 'child'), card('med', 'child', { eraGroups: ['medieval'] }), card('teen', 'teen')];
  const r = createRng('pick');
  let med = 0;
  for (let i = 0; i < 6000; i++) { const c = pickCard(deck, ctx(), r); assert.notEqual(c.id, 'teen'); if (c.id === 'med') med++; }
  assert.ok(Math.abs(med / 6000 - 2 / 3) < 0.03, String(med / 6000));
  assert.equal(pickCard(deck, ctx({ stage: 'old' }), r), null);
  // 흔적 카드는 세 배, weight 는 그대로 곱한다
  const deck2 = [card('plain', 'child'), card('tr', 'child', { trace: 'fear:sea' })];
  const tctx = ctx({ traces: [{ kind: 'fear', key: 'sea' }] });
  let tr = 0;
  for (let i = 0; i < 6000; i++) if (pickCard(deck2, tctx, r).id === 'tr') tr++;
  assert.ok(Math.abs(tr / 6000 - 0.75) < 0.03, String(tr / 6000));
  const deck3 = [card('plain', 'child'), card('heavy', 'child', undefined, { weight: 3 })];
  let hv = 0;
  for (let i = 0; i < 6000; i++) if (pickCard(deck3, ctx(), r).id === 'heavy') hv++;
  assert.ok(Math.abs(hv / 6000 - 0.75) < 0.03, String(hv / 6000));
});
