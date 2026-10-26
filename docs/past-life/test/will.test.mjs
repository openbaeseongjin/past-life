import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSoulWill, getWillPresets } from '../will.js';
import { drawBirth } from '../birth.js';
import { createLife, choose } from '../life.js';
import { computeTraces } from '../traces.js';
import { cardHandPropOf } from '../cardscene.js';

test('parseSoulWill 의도별 파싱 및 서사 생성 검증', () => {
  const dummyCtx = { era: 9, lang: 'ko' };

  // 1. 일탈 / 서리
  const resSteal = parseSoulWill('서당 뒤뜰 엿을 몰래 훔쳐 먹는다', dummyCtx);
  assert.equal(resSteal.intent, 'deviance_steal');
  assert.ok(resSteal.result.ko.includes('달콤함'));
  assert.ok(resSteal.effects.happy > 0);
  assert.equal(resSteal.route?.id, 'rebel');
  assert.ok(resSteal.scene.anim === 'nod');

  // 2. 도피 / 탈출
  const resFlee = parseSoulWill('먼 고을로 야반도주한다', dummyCtx);
  assert.equal(resFlee.intent, 'escape_flee');
  assert.ok(resFlee.result.ko.includes('자유'));
  assert.ok(resFlee.effects.family < 0);
  assert.equal(resFlee.route?.id, 'freespirit');
  assert.equal(resFlee.scene.shot, 'epic');

  // 3. 학문 / 서책
  const resStudy = parseSoulWill('서책을 밤새워 공부한다', dummyCtx);
  assert.equal(resStudy.intent, 'study_learn');
  assert.ok(resStudy.effects.know >= 10);
  assert.equal(resStudy.route?.id, 'scholar');
  assert.equal(resStudy.scene.focus, 'learn');

  // 4. 재산 / 비자금
  const resWealth = parseSoulWill('주춧돌 밑에 은화를 숨긴다', dummyCtx);
  assert.equal(resWealth.intent, 'wealth_trade');
  assert.ok(resWealth.effects.wealth >= 10);
  assert.equal(resWealth.route?.id, 'merchant');

  // 5. 치유 / 약초
  const resHeal = parseSoulWill('아픈 이들을 위해 깊은 산에서 약초를 캐어 달인다', dummyCtx);
  assert.equal(resHeal.intent, 'healer_care');
  assert.equal(resHeal.route?.id, 'healer');
  assert.ok(resHeal.effects.know > 0);

  // 6. 관청 / 통치
  const resGov = parseSoulWill('관아의 부름을 받아 나랏일을 돕는다', dummyCtx);
  assert.equal(resGov.intent, 'statesman_rule');
  assert.equal(resGov.route?.id, 'statesman');

  // 7. 농경 / 대지
  const resFarm = parseSoulWill('봄날 아침부터 논에 모내기를 하고 밭을 간다', dummyCtx);
  assert.equal(resFarm.intent, 'homesteader_farm');
  assert.equal(resFarm.route?.id, 'homesteader');

  // 8. 사랑 / 고백
  const resLove = parseSoulWill('마음에 둔 사람에게 고백한다', dummyCtx);
  assert.equal(resLove.intent, 'love_romance');
  assert.ok(resLove.effects.charm >= 10);
  assert.equal(resLove.scene.focus, 'family');

  // 9. 싸움 / 결투
  const resFight = parseSoulWill('단검을 뽑아 맞서 싸운다', dummyCtx);
  assert.equal(resFight.intent, 'fight_combat');
  assert.ok(resFight.effects.skill >= 10);
  assert.equal(resFight.route?.id, 'warrior');

  // 10. 일반 미등록 자유 입력 (Fallback)
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
    route: parsed.route,
    set: parsed.set,
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

  // 루트(Route) 및 플래그(Flags) 직결 검증
  assert.ok(life.route);
  assert.equal(life.route.id, 'rebel');
  assert.equal(life.flags['route:rebel'], true);
  assert.equal(life.flags.outlaw_will, true);

  // 일지에 결단 기록 남음 검증
  const lastEntry = life.journal[life.journal.length - 1];
  assert.ok(lastEntry.text.ko.includes('서당 뒤뜰 엿'));
  assert.ok(lastEntry.text.ko.includes('달콤함'));

  // pending 정상 해제
  assert.equal(life.pending, null);

  // 진로 전환 (Career Pivot) 2차 결단 검증: 반란자 -> 학자의 길로 피벗
  life.pending = { card: dummyCard };
  const parsedPivot = parseSoulWill('서책을 밤새워 공부하며 과거를 본다', life.ctx(), life);
  const pivotChoice = {
    text: parsedPivot.text,
    result: parsedPivot.result,
    effects: parsedPivot.effects,
    route: parsedPivot.route,
    set: parsedPivot.set,
    scene: parsedPivot.scene,
    flags: parsedPivot.flags,
    custom: true,
  };
  choose(life, pivotChoice);
  assert.equal(life.route.id, 'scholar');
  assert.equal(life.route.secondary, 'rebel');
  assert.equal(life.route.pivoted, true);
  assert.equal(life.flags['route:scholar'], true);
});

test('학습된 AI 추론기(Trained Model) 및 동적 개체명 생성(Entity Synthesis) 검증', () => {
  const dummyCtx = { era: 9, lang: 'ko' };

  // 복합 자연어 1: 학문 + 동적 개체명(논어)
  const res1 = parseSoulWill('동네 꼬마들에게 논어와 소학을 가르쳐준다', dummyCtx);
  assert.equal(res1.route?.id, 'scholar');
  assert.ok(res1.ai);
  assert.ok(res1.ai.confidence > 0.8);
  assert.ok(res1.result.ko.includes('논어'));

  // 복합 자연어 2: 통치 + 사또의 비리
  const res2 = parseSoulWill('사또의 비리를 암행어사에게 고변한다', dummyCtx);
  assert.equal(res2.route?.id, 'statesman');
  assert.ok(res2.result.ko.includes('사또'));

  // 복합 자연어 3: 치유 + 약
  const res3 = parseSoulWill('아픈 병자의 환부에 침을 놓고 약을 달인다', dummyCtx);
  assert.equal(res3.route?.id, 'healer');
  assert.ok(res3.ai.confidence > 0.8);

  // 복합 자연어 4: 연애 + 꽃다발
  const res4 = parseSoulWill('사랑하는 이에게 수줍게 꽃다발을 건넨다', dummyCtx);
  assert.equal(res4.route?.id, 'homesteader');
  assert.ok(res4.result.ko.includes('꽃다발'));
});

test('패키지 1: AI 인과율 연쇄 사건 및 다음 생 윤회 각인(Karmic Trace) 검증', () => {
  const birth = drawBirth('KARMIC-TEST-SEED');
  const life = createLife({ birth, quiet: true });

  const dummyCard = {
    id: 'test_card_echo',
    title: { ko: '청년의 결단', en: 'Youth Decision' },
    choices: [{ text: { ko: '기본', en: 'Base' }, result: { ko: '결과', en: 'Result' } }],
  };
  life.pending = { card: dummyCard };

  // 1. 유저 자유 결단 수행
  const parsed = parseSoulWill('동네 서당에서 밤새 논어를 필사하며 학문의 뜻을 세운다', life.ctx(), life);
  const customChoice = {
    text: parsed.text,
    result: parsed.result,
    effects: parsed.effects,
    route: parsed.route,
    set: parsed.set,
    scene: parsed.scene,
    flags: parsed.flags,
    ai: parsed.ai,
    custom: true,
  };
  choose(life, customChoice);

  // 2. 인과율 기록 및 플래그 세팅 검증
  assert.ok(life.willEcho);
  assert.equal(life.willEcho.routeId, 'scholar');
  assert.equal(life.flags.will_echo_pending, true);
  assert.equal(life.flags.echo_scholar, true);
  assert.ok(life.willEcho.entity.includes('논어') || life.willEcho.entity.length > 0);

  // 3. 사망 후 윤회 흔적 추출 (Karmic Trace) 검증
  life.death = { age: 65, year: life.year + 45 };
  const traces = computeTraces(life);
  assert.ok(traces.some((t) => t.kind === 'karmic' && t.key === 'vow'));
  const vowTrace = traces.find((t) => t.key === 'vow');
  assert.ok(vowTrace.vow.includes('논어') || vowTrace.vow.length > 0);
});

test('패키지 2: 12대 진로 맞춤형 초경량 3D 손 소품(Hand Props) 매핑 검증', () => {
  assert.equal(cardHandPropOf(null, { route: 'warrior' }), 'sword');
  assert.equal(cardHandPropOf(null, { route: { id: 'artisan' } }), 'hammer');
  assert.equal(cardHandPropOf(null, { route: 'artist' }), 'flute');
  assert.equal(cardHandPropOf(null, { route: 'merchant' }), 'pouch');
  assert.equal(cardHandPropOf(null, { route: 'rebel' }), 'dagger');
  assert.equal(cardHandPropOf(null, { route: 'voyager' }), 'spyglass');
  assert.equal(cardHandPropOf(null, { route: 'scholar' }), 'book');
  assert.equal(cardHandPropOf(null, { route: 'homesteader' }), 'hoe');
  assert.equal(cardHandPropOf(null, { route: 'healer' }), 'pack');
  assert.equal(cardHandPropOf(null, { route: 'seeker' }), 'pray');
  assert.equal(cardHandPropOf(null, { route: 'freespirit' }), 'staff');
  assert.equal(cardHandPropOf(null, { age: 72 }), 'staff');
});
