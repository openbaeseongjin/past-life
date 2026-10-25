import test from 'node:test';
import assert from 'node:assert/strict';
import { createLife, advance, choose } from '../life.js';
import { TENACITY_ESCAPES, tenacityEscape } from '../deaths.js';

const BIRTH_PREMODERN = {
  seed: 'TENACITY-TEST',
  year: 1300,
  era: 8,
  group: 'medieval',
  region: 'east',
  area: 'china',
  household: 'farm',
  tags: ['farm'],
  wealth: 35,
  sex: 'm',
  order: 1,
};

test('기본 설정: player=false 는 tenacity=0, player=true 는 기본 tenacity=1', () => {
  const npc = createLife({ birth: BIRTH_PREMODERN, player: false });
  assert.equal(npc.player, false);
  assert.equal(npc.tenacity, 0);

  const hero = createLife({ birth: BIRTH_PREMODERN, player: true });
  assert.equal(hero.player, true);
  assert.equal(hero.tenacity, 1);
});

test('조기 사망 완화: 전근대 0~4세 사망률이 NPC는 약 30~40%이나 플레이어는 3% 미만으로 극적 감소', () => {
  let npcUnder5Deaths = 0;
  let playerUnder5Deaths = 0;
  const N = 500;

  for (let i = 0; i < N; i++) {
    const b = { ...BIRTH_PREMODERN, seed: 'MORT-NPC-' + i };
    const l = createLife({ birth: b, player: false, quiet: true });
    for (;;) {
      const ev = advance(l, [], { yearly: true });
      if (ev.type === 'death') {
        if (l.death.age < 5) npcUnder5Deaths++;
        break;
      }
      if (l.age >= 5) break;
    }
  }

  for (let i = 0; i < N; i++) {
    const b = { ...BIRTH_PREMODERN, seed: 'MORT-HERO-' + i };
    const l = createLife({ birth: b, player: true, quiet: true });
    for (;;) {
      const ev = advance(l, [], { yearly: true });
      if (ev.type === 'death') {
        if (l.death.age < 5) playerUnder5Deaths++;
        break;
      }
      if (l.age >= 5) break;
    }
  }

  const npcRate = npcUnder5Deaths / N;
  const heroRate = playerUnder5Deaths / N;

  // NPC는 Siler 생명표에 따라 유아기 사망률 30% 이상
  assert.ok(npcRate >= 0.28, `NPC under-5 death rate expected >= 0.28, got ${npcRate}`);
  // 플레이어는 완충 및 기사회생으로 0~4세 사망률 3% 미만
  assert.ok(heroRate <= 0.03, `Player under-5 death rate expected <= 0.03, got ${heroRate}`);
});

test('기사회생 발동: 치명적 위기 발생 시 tenacity 차감 후 저널에 기사회생 서사 기록 및 생존 지속', () => {
  let triggered = false;
  // 여러 시드를 돌려 tenacity 가 실제로 소모되는 생을 포착
  for (let i = 0; i < 200; i++) {
    const b = { ...BIRTH_PREMODERN, seed: 'TEN-TRIG-' + i };
    const l = createLife({ birth: b, player: true, quiet: true });
    for (let yr = 0; yr < 30; yr++) {
      const ev = advance(l, [], { yearly: true });
      const tenEntry = l.journal.find((j) => j.kind === 'tenacity');
      if (tenEntry) {
        triggered = true;
        assert.ok(tenEntry.cause, '사인이 기록되어야 함');
        assert.ok(tenEntry.text.ko && tenEntry.text.en, '한/영 텍스트가 존재해야 함');
        assert.equal(l.tenacity, 0, '기본 불씨 1회가 소모되어 0이어야 함');
        assert.ok(l.age >= tenEntry.age, '기사회생 후 나이가 계속 증가해야 함');
        break;
      }
      if (ev.type === 'death') break;
    }
    if (triggered) break;
  }
  assert.ok(triggered, '200회 시뮬레이션 중 최소 1회 이상 기사회생이 실제로 발동해야 함');
});

test('사인별 기사회생 서사(tenacityEscape)가 모두 존재하고 빈 글이 없다', () => {
  const causes = [
    'fever', 'diarrhea', 'hunger', 'weak', 'accident', 'fire', 'plague',
    'drown', 'fall', 'beast', 'war', 'forced', 'childbirth', 'lung',
    'oldage', 'heart', 'stroke', 'cancer', 'traffic'
  ];
  for (const c of causes) {
    const esc = tenacityEscape(c);
    assert.ok(esc.ko && esc.en, `사인 ${c}에 대한 한/영 기사회생 서사가 있어야 함`);
    assert.ok(esc.ko.length <= 65, `한국어 길이 초과 방지: ${esc.ko.length}`);
    assert.ok(esc.en.length <= 130, `영어 길이 초과 방지: ${esc.en.length}`);
  }
  // fallback 검증
  const fb = tenacityEscape('unknown_cosmic_ray');
  assert.ok(fb.ko && fb.en);
});
