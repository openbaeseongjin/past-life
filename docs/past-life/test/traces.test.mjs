// 흔적 (설계 5장): 두려움 > 꿈 > 인연 > 재능, 최대 3개. 뽑기·생명표는 건드리지 않는다
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTraces, traceKey, chanceBonus, riskPenalty, badgeFor, startMods, TRACE_TEXT, FEARS, TALENTS, DREAMS, BONDS } from '../traces.js';

test('우선순위와 최대 3개', () => {
  const life = { death: { cause: 'drown' }, dream: 'letters', fulfilled: [], bond: { kind: 'friend', who: { ko: '단짝', en: 'friend' } }, skills: { craft: 4, trade: 3 } };
  assert.deepEqual(computeTraces(life).map(traceKey), ['fear:sea', 'dream:letters', 'bond:friend']);
  const calm = { death: { cause: 'oldage' }, dream: null, fulfilled: [], bond: null, skills: { craft: 2, music: 5, trade: 3 } };
  assert.deepEqual(computeTraces(calm).map(traceKey), ['talent:music']);
  const done = { death: { cause: 'fever' }, dream: 'sea', fulfilled: ['sea'], bond: null, skills: {} };
  assert.deepEqual(computeTraces(done), []);
});

test('재능은 맞는 선택의 성공 확률 +0.15, 두려움은 맞는 선택에 행복 −8, 재능이 있으면 시작 행복 +5', () => {
  const tr = [{ kind: 'talent', key: 'craft' }, { kind: 'fear', key: 'sea' }];
  assert.equal(chanceBonus({ skill: 'craft' }, tr), 0.15);
  assert.equal(chanceBonus({ skill: 'trade' }, tr), 0);
  assert.equal(riskPenalty({ risk: 'sea' }, tr), -8);
  assert.equal(riskPenalty({ risk: 'fire' }, tr), 0);
  assert.equal(startMods(tr).happy, 5);
  assert.equal(startMods([]).happy, 0);
});

test('badgeFor: 흔적 카드면 그 흔적, 선택의 risk/skill 이 맞으면 그 흔적', () => {
  const tr = [{ kind: 'fear', key: 'sea' }, { kind: 'talent', key: 'craft' }];
  assert.equal(traceKey(badgeFor({ when: { trace: 'fear:sea' }, choices: [] }, tr)), 'fear:sea');
  assert.equal(traceKey(badgeFor({ choices: [{ skill: 'craft' }, {}] }, tr)), 'talent:craft');
  assert.equal(badgeFor({ choices: [{ risk: 'fire' }] }, tr), null);
});

test('흔적 글이 모든 key 에 있다', () => {
  for (const [kind, keys] of [['fear', FEARS], ['talent', TALENTS], ['dream', DREAMS], ['bond', BONDS]]) for (const k of keys) assert.equal(TRACE_TEXT[kind][k].length, 2, `${kind}:${k}`);
});
