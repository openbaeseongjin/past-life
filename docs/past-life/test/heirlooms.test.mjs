import test from 'node:test';
import assert from 'node:assert/strict';
import { HEIRLOOMS, HEIRLOOM_LIST, HEIRLOOM_CARDS, computeLegacyWealthBonus, applyHeirloom } from '../heirlooms.js';
import { createLife, advance, choose } from '../life.js';

const BIRTH = {
  seed: 'HEIR-TEST',
  year: 1100,
  era: 7,
  group: 'medieval',
  region: 'east',
  area: 'korea',
  household: 'farm',
  tags: ['farm'],
  wealth: 30,
  sex: 'm',
  order: 1,
};

test('computeLegacyWealthBonus: 최종 재산에 따른 다음 생 불씨 보너스', () => {
  assert.equal(computeLegacyWealthBonus(20), 0);
  assert.equal(computeLegacyWealthBonus(39), 0);
  assert.equal(computeLegacyWealthBonus(40), 1);
  assert.equal(computeLegacyWealthBonus(69), 1);
  assert.equal(computeLegacyWealthBonus(70), 2);
  assert.equal(computeLegacyWealthBonus(89), 2);
  assert.equal(computeLegacyWealthBonus(90), 3);
  assert.equal(computeLegacyWealthBonus(100), 3);
  assert.equal(computeLegacyWealthBonus(undefined), 0);
});

test('applyHeirloom: 4대 가보 보너스가 생애 상태 및 능력치에 정상 적용된다', () => {
  // 1. pouch (전대: 재산 +20)
  const l1 = createLife({ birth: BIRTH, player: true });
  const w0 = l1.stats.wealth;
  applyHeirloom(l1, 'pouch');
  assert.equal(l1.heirloom, 'pouch');
  assert.equal(l1.flags.heirloom_pouch, true);
  assert.equal(l1.stats.wealth, w0 + 20);

  // 2. codex (비전서: 지식 +15)
  const l2 = createLife({ birth: BIRTH, player: true });
  const k0 = l2.attrs.know;
  applyHeirloom(l2, 'codex');
  assert.equal(l2.heirloom, 'codex');
  assert.equal(l2.flags.heirloom_codex, true);
  assert.equal(l2.attrs.know, k0 + 15);

  // 3. tool (도구: 손재주 +15)
  const l3 = createLife({ birth: BIRTH, player: true });
  const s0 = l3.attrs.skill;
  applyHeirloom(l3, 'tool');
  assert.equal(l3.heirloom, 'tool');
  assert.equal(l3.flags.heirloom_tool, true);
  assert.equal(l3.attrs.skill, s0 + 15);

  // 4. token (신표: 친화력 +15)
  const l4 = createLife({ birth: BIRTH, player: true });
  const c0 = l4.attrs.charm;
  applyHeirloom(l4, 'token');
  assert.equal(l4.heirloom, 'token');
  assert.equal(l4.flags.heirloom_token, true);
  assert.equal(l4.attrs.charm, c0 + 15);
});

test('HEIRLOOM_CARDS: 4대 가보 카드의 필수 필드와 조건 정합성 검증', () => {
  assert.equal(HEIRLOOM_CARDS.length, 4);
  const ids = HEIRLOOM_CARDS.map((c) => c.id);
  assert.deepEqual(ids, [
    't.heirloom.pouch',
    't.heirloom.codex',
    't.heirloom.tool',
    't.heirloom.token',
  ]);

  for (const c of HEIRLOOM_CARDS) {
    assert.ok(c.title.ko && c.title.en, `${c.id} title missing`);
    assert.ok(c.text.ko && c.text.en, `${c.id} text missing`);
    assert.ok(c.choices.length === 2, `${c.id} choices must be 2`);
    assert.ok(c.when && c.when.flags, `${c.id} when.flags missing`);
    for (const ch of c.choices) {
      assert.ok(ch.text.ko && ch.text.en, `${c.id} choice text missing`);
      assert.ok(ch.result.ko && ch.result.en, `${c.id} choice result missing`);
      assert.ok(ch.effects, `${c.id} choice effects missing`);
    }
  }
});
