// 생명표 (설계 4장): Siler 두 기준 모양을 보간해 목표 e0 에 맞춘다
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRE, MOD, E0, lifeStats, shapeFor, healthMul, deathChance, survivalTo, survivalCurve } from '../lifetable.js';
import { REGIONS } from '../places.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} ${a} ≠ ${b} ±${tol}`);

test('PRE: 첫돌 전 27%, 15세 전 46%, e0 28.5 (Volk & Atkinson 2013, Riley 1770)', () => {
  const s = lifeStats(PRE);
  near(s.q1, 0.27, 0.005); near(s.q15, 0.46, 0.005); near(s.e0, 28.5, 0.1);
});

test('MOD: 첫돌 전 0.4%, 15세 전 0.7%, e0 80', () => {
  const s = lifeStats(MOD);
  near(s.q1, 0.004, 0.001); near(s.q15, 0.007, 0.001); near(s.e0, 80, 0.1);
});

test('모든 시대·지역 e0 가 목표 ±0.5', () => {
  for (let era = 1; era <= 12; era++) for (const r of REGIONS) near(lifeStats(shapeFor(era, r)).e0, E0[era][REGIONS.indexOf(r)], 0.5, `${era} ${r}`);
});

test('현대 유럽 아이는 거의 다 열다섯을 넘긴다', () => {
  assert.ok(lifeStats(shapeFor(12, 'europe')).q15 < 0.04);
});

test('건강 배율: 50 이면 1, 0.6~2.0 (설계 12장)', () => {
  near(healthMul(50), 1, 1e-9);
  assert.equal(healthMul(100), 0.6);
  assert.equal(healthMul(0), 2.0);
});

test('survivalTo: 0살은 1, PRE 는 15살까지 54%', () => {
  assert.equal(survivalTo(PRE, 0), 1);
  near(survivalTo(PRE, 15), 0.54, 0.005);
  assert.equal(survivalCurve(PRE, 100).length, 101);
});

test('건강이 낮으면 죽을 확률이 높고, 생존 곡선은 내려가기만 한다', () => {
  assert.ok(deathChance({ age: 40, era: 8, region: 'europe', health: 20 }) > deathChance({ age: 40, era: 8, region: 'europe', health: 80 }));
  const S = survivalCurve(shapeFor(8, 'europe'), 100);
  for (let a = 1; a < S.length; a++) assert.ok(S[a] <= S[a - 1], String(a));
});

test('deathChance: 119세는 1, 사건 위험률을 더한다', () => {
  assert.equal(deathChance({ age: 119, era: 12, region: 'europe' }), 1);
  const a = deathChance({ age: 30, era: 8, region: 'europe' }), b = deathChance({ age: 30, era: 8, region: 'europe', extra: 0.1 });
  assert.ok(b > a + 0.08);
});
