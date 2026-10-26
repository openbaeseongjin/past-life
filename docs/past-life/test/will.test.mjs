import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSoulWill, getWillPresets } from '../will.js';
import { drawBirth } from '../birth.js';
import { createLife, choose } from '../life.js';

test('parseSoulWill 의도별 파싱 및 서사 생성 검증', () => {
  const dummyCtx = { era: 9, lang: 'ko' };

  // 1. 일탈 / 서리
  const resSteal = parseSoulWill('서당 뒤뜰 엿을 몰래 훔쳐 먹는다', dummyCtx);
  assert.equal(resSteal.intent, 'deviance_steal');
  assert.ok(resSteal.result.ko.includes('달콤함'));
  assert.ok(resSteal.effects.happy > 0);
  assert.ok(resSteal.scene.anim === 'nod');

  // 2. 도피 / 탈출
  const resFlee = parseSoulWill('먼 고을로 야반도주한다', dummyCtx);
  assert.equal(resFlee.intent, 'escape_flee');
  assert.ok(resFlee.result.ko.includes('자유'));
  assert.ok(resFlee.effects.family < 0);
  assert.equal(resFlee.scene.shot, 'epic');

  // 3. 학문 / 서책
  const resStudy = parseSoulWill('서책을 밤새워 공부한다', dummyCtx);
  assert.equal(resStudy.intent, 'study_learn');
  assert.ok(resStudy.effects.know >= 10);
  assert.equal(resStudy.scene.focus, 'learn');

  // 4. 재산 / 비자금
  const resWealth = parseSoulWill('주춧돌 밑에 은화를 숨긴다', dummyCtx);
  assert.equal(resWealth.intent, 'wealth_trade');
  assert.ok(resWealth.effects.wealth >= 10);

  // 5. 사랑 / 고백
  const resLove = parseSoulWill('마음에 둔 사람에게 고백한다', dummyCtx);
  assert.equal(resLove.intent, 'love_romance');
  assert.ok(resLove.effects.charm >= 10);
  assert.equal(resLove.scene.focus, 'family');

  // 6. 싸움 / 결투
  const resFight = parseSoulWill('단검을 뽑아 맞서 싸운다', dummyCtx);
  assert.equal(resFight.intent, 'fight_combat');
  assert.ok(resFight.effects.skill >= 10);

  // 7. 일반 미등록 자유 입력 (Fallback)
  const resGeneral = parseSoulWill('나만의 신비로운 길을 개척한다', dummyCtx);
  assert.equal(resGeneral.intent, 'general_will');
  assert.ok(resGeneral.result.ko.length > 10);
  assert.ok(resGeneral.result.en.length > 10);
});

test('parseSoulWill 전근대 시대착오(Anachronism) 방어 검증', () => {
  // 조선/명나라 시대(era 9)에서 스마트폰/비트코인 입력 시
  const preModernCtx = { era: 9, lang: 'ko' };
  const res = parseSoulWill('스마트폰으로 비트코인을 산다', preModernCtx);

  assert.equal(res.intent, 'anachronism');
  assert.ok(res.result.ko.includes('도깨비'));
  assert.ok(res.flags.includes('touched_by_ghost'));
  assert.ok(res.effects.know < 0);
  assert.equal(res.scene.anim, 'flinch');
});

test('getWillPresets 나이별 상황 맞춤 행동 칩 검증', () => {
  // 유년기 (<15)
  const childPresets = getWillPresets({ lang: 'ko' }, { age: 8 });
  assert.ok(childPresets.length >= 3);
  assert.ok(childPresets.some((p) => p.includes('엿') || p.includes('물고기') || p.includes('담벼락')));

  // 청장년기 (15~50)
  const adultPresets = getWillPresets({ lang: 'ko' }, { age: 25 });
  assert.ok(adultPresets.length >= 3);
  assert.ok(adultPresets.some((p) => p.includes('비자금') || p.includes('야반도주') || p.includes('고백')));

  // 노년기 (>=50)
  const oldPresets = getWillPresets({ lang: 'ko' }, { age: 65 });
  assert.ok(oldPresets.length >= 3);
  assert.ok(oldPresets.some((p) => p.includes('후계자') || p.includes('묏자리') || p.includes('술잔')));
});

test('choose(life, customChoice) 영혼의 결단 생애 시스템 통합 검증', () => {
  const birth = drawBirth('TEST-WILL-LIFE');
  const life = createLife({ birth, quiet: true });

  // 가상의 카드 이벤트 대기
  const dummyCard = {
    id: 'test_card',
    title: { ko: '마을의 갈림길', en: 'Crossroads' },
    choices: [
      { text: { ko: '기본 길 1', en: 'Default 1' }, result: { ko: '결과 1', en: 'Result 1' } },
    ],
  };
  life.pending = { card: dummyCard };

  const parsed = parseSoulWill('서당 뒤뜰 엿을 몰래 훔쳐 먹는다', life.ctx(), life);
  const customChoice = {
    text: parsed.text,
    result: parsed.result,
    effects: parsed.effects,
    scene: parsed.scene,
    flags: parsed.flags,
    custom: true,
  };

  const initHappy = life.stats.happy;
  const initSkill = (life.attrs && life.attrs.skill) || 50;

  // 커스텀 초이스 객체로 choose 호출
  const out = choose(life, customChoice);
  assert.ok(out);
  assert.equal(out.ok, true);
  assert.equal(out.result.ko, parsed.result.ko);

  // 스탯 변동 검증
  assert.equal(life.stats.happy, Math.min(100, initHappy + parsed.effects.happy));

  // 일지에 결단 기록 남음 검증
  const lastEntry = life.journal[life.journal.length - 1];
  assert.ok(lastEntry.text.ko.includes('서당 뒤뜰 엿'));
  assert.ok(lastEntry.text.ko.includes('달콤함'));

  // pending 정상 해제
  assert.equal(life.pending, null);
});
