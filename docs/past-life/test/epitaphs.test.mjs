// 묘비 한 줄 (화면 다시 기획 4.3)
import test from 'node:test';
import assert from 'node:assert/strict';
import { EPITAPHS, epitaphGroup, epitaphOf } from '../epitaphs.js';

const GROUPS = ['baby', 'child', 'present', 'work', 'learn', 'family', 'body', 'rest'];
const life = (age, present = false, seed = 'E-1') => ({ birth: { seed }, age, death: { age, present } });

test('8묶음 × 3줄, 한·영 길이, 숫자 없음', () => {
  assert.deepEqual(Object.keys(EPITAPHS).sort(), GROUPS.slice().sort());
  for (const g of GROUPS) {
    assert.equal(EPITAPHS[g].length, 3, g);
    for (const e of EPITAPHS[g]) {
      assert.ok(e.ko && e.ko.length <= 40, `${g} ko ${e.ko}`);
      assert.ok(e.en && e.en.length <= 80, `${g} en ${e.en}`);
      assert.ok(!/\d/.test(e.ko + e.en), `${g} 숫자`);
      assert.ok(!e.ko.includes('당신'), `${g} 당신`);
    }
  }
});

test('묶음 고르기: 아기 < 5 ≤ 아이 < 15, 지금 멈춤, 그 밖은 가장 오래 든 패', () => {
  assert.equal(epitaphGroup(life(0), { topFocus: null }), 'baby');
  assert.equal(epitaphGroup(life(4), { topFocus: 'rest' }), 'baby');
  assert.equal(epitaphGroup(life(5), { topFocus: 'rest' }), 'child');
  assert.equal(epitaphGroup(life(14), { topFocus: 'work' }), 'child');
  assert.equal(epitaphGroup(life(3, true), { topFocus: null }), 'present');
  assert.equal(epitaphGroup(life(42, true), { topFocus: 'work' }), 'present');
  assert.equal(epitaphGroup(life(15), { topFocus: 'learn' }), 'learn');
  assert.equal(epitaphGroup(life(70), { topFocus: 'family' }), 'family');
  assert.equal(epitaphGroup(life(70), { topFocus: null }), 'work');
});

test('epitaphOf: 같은 시드면 같은 줄, 그 묶음 안의 줄, 말에 맞게', () => {
  const a = epitaphOf(life(60, false, 'E-7'), { topFocus: 'body' }, 'ko');
  assert.equal(a, epitaphOf(life(60, false, 'E-7'), { topFocus: 'body' }, 'ko'));
  assert.ok(EPITAPHS.body.some((e) => e.ko === a));
  const b = epitaphOf(life(60, false, 'E-7'), { topFocus: 'body' }, 'en');
  assert.ok(EPITAPHS.body.some((e) => e.en === b));
});
