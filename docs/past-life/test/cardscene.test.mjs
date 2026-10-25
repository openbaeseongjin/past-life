// test/cardscene.test.mjs
// 카드와 3D 장면·인물 행동의 논리적 정합성 연동 단위 테스트
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardFocusOf, cardWorkSpotOf } from '../cardscene.js';
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

test('모든 덱 카드(DECK + EVENT_CARDS)에서 cardFocusOf 및 cardWorkSpotOf 가 오류 없이 정합하게 동작', () => {
  const allCards = [...DECK, ...EVENT_CARDS];
  const validFocuses = new Set(['work', 'learn', 'family', 'body', 'rest']);
  const validSpots = new Set(['market', 'forge', 'shore', 'field', null]);

  for (const c of allCards) {
    const f = cardFocusOf(c);
    assert.ok(validFocuses.has(f), `유효하지 않은 포커스 ${f} (카드 ${c.id})`);
    const s = cardWorkSpotOf(c);
    assert.ok(validSpots.has(s), `유효하지 않은 스팟 ${s} (카드 ${c.id})`);
  }
});
