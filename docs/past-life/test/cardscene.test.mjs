// test/cardscene.test.mjs
// 카드와 3D 장면·인물 행동의 논리적 정합성 연동 단위 테스트
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardFocusOf, cardWorkSpotOf, cardShotOf, cardHandPropOf, cardMoodOf } from '../cardscene.js';
import { DECK } from '../deck.js';
import { EVENT_CARDS } from '../cards_event.js';

test('cardFocusOf: 서사에 따른 5대 포커스 매핑', () => {
  // 질병 / 부상 / 요양 -> rest
  assert.equal(cardFocusOf({ id: 'u.baby.fever', ill: true }), 'rest');
  assert.equal(cardFocusOf({ id: 'u.teen.sick', text: { ko: '크게 앓아누웠어요' } }), 'rest');
  assert.equal(cardFocusOf({ id: 'ev.blackdeath', text: { ko: '흑사병이 번져요' } }), 'rest');

  // 가족 / 혼인 / 아이 -> family
  assert.equal(cardFocusOf({ id: 'u.adult.marry', text: { ko: '같이 살자는 사람이 생겼어요' } }), 'family');
  assert.equal(cardFocusOf({ id: 'u.adult.child', text: { ko: '아기가 태어났어요' } }), 'family');
  assert.equal(cardFocusOf({ id: 'u.child.story', text: { ko: '할머니가 옛이야기를 들려줘요' } }), 'family');

  // 배움 / 종교 / 사원 / 성당 / 서당 -> learn
  assert.equal(cardFocusOf({ id: 'u.teen.learn', text: { ko: '기술을 배우라' } }), 'learn');
  assert.equal(cardFocusOf({ id: 'loc.ea.street.exam', text: { ko: '과거시험을 보러' } }), 'learn');
  assert.equal(cardFocusOf({ id: 'loc.sa.village.temple', text: { ko: '사원에서 경전을' } }), 'learn');

  // 길 / 여행 / 군대 / 순례 -> body
  assert.equal(cardFocusOf({ id: 'u.teen.leave', text: { ko: '길을 떠나요' } }), 'body');
  assert.equal(cardFocusOf({ id: 'e.med.teen.pilgrims', text: { ko: '성지로 가는 순례자' } }), 'body');
});

test('cardWorkSpotOf: 일 카드의 세부 일터 장소 매핑', () => {
  assert.equal(cardWorkSpotOf({ text: { ko: '장터에서 물건을 흥정해요' } }), 'market');
  assert.equal(cardWorkSpotOf({ text: { ko: '대장간에서 모루를 두드려요' } }), 'forge');
  assert.equal(cardWorkSpotOf({ text: { ko: '바다로 나가 그물을 던져요' } }), 'shore');
  assert.equal(cardWorkSpotOf({ text: { ko: '논에 모내기를 해요' } }), 'field');
  assert.equal(cardWorkSpotOf({ text: { ko: '그냥 쉬어요' } }), null);
});

test('cardShotOf: 서사 맞춤형 4대 카메라 쇼트 매핑', () => {
  // 1. 위기 / 전쟁 / 역병 / 기근 -> epic 하이앵글 와이드
  assert.equal(cardShotOf({ id: 'ev.war', text: { ko: '전쟁이 터지고 군대가 들이닥쳤다' } }), 'epic');
  assert.equal(cardShotOf({ id: 'ev.plague', text: { ko: '흑사병과 역병이 번져 폐허가 되었다' } }), 'epic');
  assert.equal(cardShotOf({ id: 'ev.famine', text: { ko: '극심한 가뭄과 기근으로 난리가 났다' } }), 'epic');

  // 2. 가족 / 혼인 / 출생 / 아이 -> intimate 친밀 투샷
  assert.equal(cardShotOf({ id: 'u.adult.marry', text: { ko: '혼례를 올리고 짝을 맺었다' } }), 'intimate');
  assert.equal(cardShotOf({ id: 'u.adult.baby', text: { ko: '첫아기가 태어났다' } }), 'intimate');
  assert.equal(cardShotOf({ id: 'u.child.kin', text: { ko: '할머니와 가족들이 모였다' } }), 'intimate');

  // 3. 학문 / 서당 / 사원 / 과거 / 성찰 / 질병 -> solo 로우앵글 클로즈업
  assert.equal(cardShotOf({ id: 'u.learn.exam', text: { ko: '과거 시험을 준비하며 책을 읽는다' } }), 'solo');
  assert.equal(cardShotOf({ id: 'u.temple.pray', text: { ko: '사찰 경내에서 홀로 기도한다' } }), 'solo');
  assert.equal(cardShotOf({ id: 'u.teen.sick', text: { ko: '열병을 앓아 요양한다' } }), 'solo');

  // 4. 일반 일상 / 노동 -> work
  assert.equal(cardShotOf({ id: 'u.farm.work', text: { ko: '아침부터 일터로 향한다' } }), 'work');
  assert.equal(cardShotOf(null), 'work');
});

test('cardHandPropOf: 초경량 손 소품 매핑', () => {
  // 학문 -> book
  assert.equal(cardHandPropOf({ id: 'u.exam', text: { ko: '과거 시험 서책을 펼친다' } }), 'book');
  assert.equal(cardHandPropOf({ id: 'u.script', text: { ko: '서당에서 글공부 경전을 읽는다' } }), 'book');

  // 신앙 / 기도 -> pray
  assert.equal(cardHandPropOf({ id: 'u.pray', text: { ko: '사원에서 합장하고 기도한다' } }), 'pray');

  // 상업 / 여행 / 피란 -> pack
  assert.equal(cardHandPropOf({ id: 'u.trade', text: { ko: '장터 상인에게 봇짐을 진다' } }), 'pack');
  assert.equal(cardHandPropOf({ id: 'u.travel', text: { ko: '길을 떠나 보따리를 챙겼다' } }), 'pack');

  // 농경 -> hoe
  assert.equal(cardHandPropOf({ id: 'u.farm', text: { ko: '밭에서 괭이로 김매기를 한다' } }), 'hoe');
  assert.equal(cardHandPropOf({ id: 'u.harvest', text: { ko: '벼 수확을 서두른다' } }), 'hoe');

  // 노년기 (60세~) -> staff
  assert.equal(cardHandPropOf(null, { age: 65 }), 'staff');
  assert.equal(cardHandPropOf({ id: 'u.rest', text: { ko: '바람을 쐰다' } }, { age: 72 }), 'staff');
  assert.equal(cardHandPropOf({ id: 'u.rest', text: { ko: '바람을 쐰다' } }, { age: 25 }), null);
});

test('cardMoodOf: 카드 테마별 대기 조명 틴트 매핑', () => {
  assert.equal(cardMoodOf({ id: 'ev.war', text: { ko: '전쟁과 역병의 난리' } }), 'crisis');
  assert.equal(cardMoodOf({ id: 'u.marry', text: { ko: '혼례 잔치와 사랑의 기쁨' } }), 'warm');
  assert.equal(cardMoodOf({ id: 'u.normal', text: { ko: '평범한 하루가 지나간다' } }), 'clear');
  assert.equal(cardMoodOf(null), 'clear');
});

test('모든 덱 카드(DECK + EVENT_CARDS)에서 cardFocusOf 및 cardWorkSpotOf 가 오류 없이 정합하게 동작', () => {
  const allCards = [...DECK, ...EVENT_CARDS];
  const validFocuses = new Set(['work', 'learn', 'family', 'body', 'rest']);
  const validSpots = new Set(['market', 'forge', 'shore', 'field', null]);
  const validShots = new Set(['intimate', 'epic', 'solo', 'work']);
  const validProps = new Set(['book', 'hoe', 'pack', 'staff', 'pray', null]);
  const validMoods = new Set(['warm', 'crisis', 'clear']);

  for (const c of allCards) {
    const f = cardFocusOf(c);
    assert.ok(validFocuses.has(f), `유효하지 않은 포커스 ${f} (카드 ${c.id})`);
    const s = cardWorkSpotOf(c);
    assert.ok(validSpots.has(s), `유효하지 않은 스팟 ${s} (카드 ${c.id})`);
    const shot = cardShotOf(c);
    assert.ok(validShots.has(shot), `유효하지 않은 쇼트 ${shot} (카드 ${c.id})`);
    const prop = cardHandPropOf(c);
    assert.ok(validProps.has(prop), `유효하지 않은 소품 ${prop} (카드 ${c.id})`);
    const mood = cardMoodOf(c);
    assert.ok(validMoods.has(mood), `유효하지 않은 무드 ${mood} (카드 ${c.id})`);
  }
});
