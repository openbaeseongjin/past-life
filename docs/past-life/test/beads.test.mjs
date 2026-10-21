// 구슬 계산 (화면 다시 기획 4.1·4.2)
import test from 'node:test';
import assert from 'node:assert/strict';
import { MOOD_COLORS, moodOf, beadsOf, pips, encodeBeads, decodeBeads, BEADS_RE, hundredThreads } from '../beads.js';
import { shapeFor, survivalTo } from '../lifetable.js';

const fake = (happies, extra = {}) => ({
  history: happies.map((h, a) => ({ age: a, health: 50, wealth: 50, family: 50, happy: h })),
  log: [], journal: [], age: happies.length - 1, death: null, ...extra,
});

test('마음 단계 경계와 색 다섯', () => {
  assert.equal(MOOD_COLORS.length, 5);
  assert.deepEqual([0, 19, 20, 39, 40, 59, 60, 79, 80, 100].map(moodOf), [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
  assert.equal(moodOf(undefined), 2);
});

test('beadsOf: 산 해마다 한 알, 별·금 표시', () => {
  const life = fake([50, 10, 90, 65, 30], { log: [{ age: 2 }], journal: [{ age: 3, kind: 'event' }, { age: 1, kind: 'line' }] });
  const b = beadsOf(life);
  assert.equal(b.length, 5);
  assert.deepEqual(b.map((x) => x.mood), [2, 0, 4, 3, 1]);
  assert.deepEqual(b.map((x) => x.star), [false, false, true, false, false]);
  assert.deepEqual(b.map((x) => x.crack), [false, false, false, true, false]);
  // 죽은 생은 죽은 나이까지 (그 뒤 history 가 없어도)
  const dead = fake([50, 50, 50], { death: { age: 2 } });
  assert.equal(beadsOf(dead).length, 3);
  // 2026년에서 멈춘 생도 그 나이까지
  const now = fake([50, 50, 50, 50], { death: { age: 3, present: true } });
  assert.equal(beadsOf(now).length, 4);
  // 죽은 나이(death.age)가 산 나이(life.age)보다 우선
  assert.equal(beadsOf(fake([50, 50, 50, 50, 50], { death: { age: 1 } })).length, 2);
  // history 가 모자라면 마지막 상태를 쓴다
  assert.deepEqual(beadsOf(fake([10, 90], { death: { age: 4 }, age: 1 })).map((x) => x.mood), [0, 4, 4, 4, 4]);
  // history 가 비었으면 보통 마음(2)
  assert.deepEqual(beadsOf(fake([], { death: { age: 2 } })).map((x) => x.mood), [2, 2, 2]);
});

test('pips: 반 칸 단위 다섯 칸', () => {
  assert.deepEqual(pips(0), [0, 0, 0, 0, 0]);
  assert.deepEqual(pips(5), [0.5, 0, 0, 0, 0]);
  assert.deepEqual(pips(10), [0.5, 0, 0, 0, 0]);
  assert.deepEqual(pips(50), [1, 1, 0.5, 0, 0]);
  assert.deepEqual(pips(95), [1, 1, 1, 1, 1]);
  assert.deepEqual(pips(100), [1, 1, 1, 1, 1]);
  assert.deepEqual(pips(-3), [0, 0, 0, 0, 0]);
  assert.deepEqual(pips(140), [1, 1, 1, 1, 1]);
  assert.deepEqual(pips(NaN), [0, 0, 0, 0, 0]);
});

test('구슬 문자열: 왕복, 별이 금보다 먼저, 옛 글자는 마음 2', () => {
  const b = [
    { age: 0, mood: 0, star: false, crack: false }, { age: 1, mood: 4, star: true, crack: false },
    { age: 2, mood: 2, star: false, crack: true }, { age: 3, mood: 3, star: true, crack: true },
  ];
  const s = encodeBeads(b);
  assert.equal(s, '0eCd');
  assert.ok(BEADS_RE.test(s));
  const back = decodeBeads(s);
  assert.deepEqual(back.slice(0, 3), b.slice(0, 3));
  assert.deepEqual(back[3], { age: 3, mood: 3, star: true, crack: false });
  assert.deepEqual(decodeBeads('z'), [{ age: 0, mood: 2, star: false, crack: false }]);
  assert.deepEqual(decodeBeads(null), []);
  assert.ok(!BEADS_RE.test('01x'));
});

test('백 가닥: 백 개, 같은 시드면 같은 결과, 내 실은 내 나이', () => {
  const sh = shapeFor(3, 'europe');
  const a = hundredThreads(sh, 'S-1', 40), b = hundredThreads(sh, 'S-1', 40);
  assert.deepEqual(a, b);
  assert.equal(a.lengths.length, 100);
  assert.equal(a.lengths[a.mine], 40);
  for (const L of a.lengths) assert.ok(Number.isInteger(L) && L >= 0 && L <= 110, String(L));
  // 시드가 다르면 그리는 순서는 달라지고, 정렬한 길이는 내 실 한 칸(replaced mine thread)만 다르다
  const r1 = hundredThreads(sh, 'S-1', 40), r2 = hundredThreads(sh, 'S-2', 40);
  assert.notDeepEqual(r1.lengths, r2.lengths);
  const asc = (xs) => xs.slice().sort((x, y) => x - y);
  const s1 = asc(r1.lengths), s2 = asc(r2.lengths);
  assert.ok(s1.filter((v, i) => v !== s2[i]).length <= 1);
  // outlived = 내 나이 전에 떠난 사람 수 ≈ (1 − S(나이)) × 100
  for (const age of [0, 1, 5, 30, 60, 85]) {
    const h = hundredThreads(sh, 'S-3', age), want = Math.round((1 - survivalTo(sh, age)) * 100);
    assert.ok(Math.abs(h.outlived - want) <= 2, `${age}: ${h.outlived} vs ${want}`);
    assert.equal(h.outlived + h.reach, 100);
  }
});
