// 시드 난수 (설계 6장: 같은 시드 + 같은 선택 = 같은 생)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRng, sub, hash, newId } from '../rng.js';

test('같은 시드 = 같은 수열, 다른 용도 = 다른 수열', () => {
  const a = createRng('SEED'), b = createRng('SEED');
  const xs = Array.from({ length: 5 }, () => a.next()), ys = Array.from({ length: 5 }, () => b.next());
  assert.deepEqual(xs, ys);
  assert.notEqual(sub('SEED', 3, 'death').next(), sub('SEED', 3, 'card').next());
  assert.equal(sub('SEED', 3, 'death').next(), sub('SEED', 3, 'death').next());
  assert.equal(hash('abc'), hash('abc'));
});

test('weighted 는 가중치를 따르고, 합이 0이면 null', () => {
  const r = createRng(7);
  let a = 0;
  for (let i = 0; i < 10000; i++) if (r.weighted([{ id: 'a', w: 3 }, { id: 'b', w: 1 }], (x) => x.w).id === 'a') a++;
  assert.ok(Math.abs(a / 10000 - 0.75) < 0.02);
  assert.equal(r.weighted([{ w: 0 }], (x) => x.w), null);
});

test('newId 꼴', () => {
  assert.match(newId(), /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
});
