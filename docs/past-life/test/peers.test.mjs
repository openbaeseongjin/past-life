// 같은 해 태어난 네 사람 (설계 12장)
import test from 'node:test';
import assert from 'node:assert/strict';
import { makePeers, peerAt } from '../peers.js';
import { drawBirth } from '../birth.js';

test('같은 해, 시드마다 같고, 저마다 끝까지 산다', () => {
  const b = drawBirth('PEER-1');
  const a = makePeers(b), c = makePeers(b);
  assert.equal(a.length, 4);
  assert.deepEqual(a, c);
  for (const p of a) { assert.equal(p.birth.year, b.year); assert.ok(p.death.age >= 0); }
  assert.notEqual(a[0].birth.seed, a[1].birth.seed);
});

test('peerAt: 그 나이에 살아 있으면 단계, 아니면 죽음', () => {
  const p = { death: { age: 10, cause: 'fever' } };
  assert.deepEqual(peerAt(p, 5), { alive: true, stage: 'child' });
  assert.equal(peerAt(p, 30).alive, false);
  // 지금(2026)까지 살아 멈춘 사람은 그 나이를 넘겨도 살아 있다
  const q = { death: { age: 39, year: 2026, cause: null, line: 0, present: true } };
  assert.deepEqual(peerAt(q, 20), { alive: true, stage: 'adult' });
  assert.deepEqual(peerAt(q, 999), { alive: true, present: true, age: 39 });
});
