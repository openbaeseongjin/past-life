// tools/test_card_scene_mapping.mjs
// 모든 카드가 논리적으로 올바른 3D 씬 장소/행동으로 매핑되는지 전수 검증

import { DECK } from '../deck.js';
import { EVENT_CARDS } from '../cards_event.js';

const ALL_CARDS = [...DECK, ...EVENT_CARDS];

// 카드에 어울리는 씬 액션/장소 추론 함수
export function inferCardScene(card) {
  if (!card) return null;
  const id = card.id || '';
  const text = (card.text?.ko || '') + ' ' + (card.text?.en || '');
  const title = (card.title?.ko || '') + ' ' + (card.title?.en || '');
  const full = id + ' ' + title + ' ' + text;
  const w = card.when || {};

  // 1. 질병 / 부상 / 요양 (rest)
  if (card.ill || card.hurt || /열병|역병|앓아누|치료|요양|골절|상처|독감|앓|fever|sick|plague|ache|illness|wound/i.test(full)) {
    return { key: 'rest', focus: 'rest', action: 'sit', reason: '질병/부상/요양' };
  }

  // 2. 가족 / 혼인 / 출산 / 이야기 / 아이들 (family)
  if (/marry|wedding|sibling|baby|child\.story|child\.friend|child\.chores|혼례|혼인|아내|남편|첫아이|식구|어른들에게 이야기|동무|집안일|가족|할머니|부모님|짝|손주|elder|grand/i.test(full)) {
    return { key: 'family', focus: 'family', action: 'talk', reason: '가족/혼인/아이/이야기' };
  }

  // 3. 학문 / 종교 / 서당 / 사원 / 성당 / 과거 / 책 (learn)
  if (/exam|learn|scriptorium|temple|church|monastery|mosque|shrine|서당|과거시험|천자문|성당|사원|절|스님|신부|수도원|경전|글공부|스승|책을 읽|도서관|학교|대학/i.test(full)) {
    return { key: 'learn', focus: 'learn', action: 'talk', reason: '학문/종교/서당/사원/성당' };
  }

  // 4. 시장 / 상업 / 장터 / 흥정 / 상점 / 좌판 (market)
  if (/market|bazaar|trade|shop|merchant|장터|시장|가게|흥정|상인|좌판|은화로 사|손님|비단길|무역/i.test(full)) {
    return { key: 'market', focus: 'work', action: 'talk', reason: '시장/상업/장터' };
  }

  // 5. 대장간 / 수공업 / 도예 / 제작 (forge)
  if (/forge|smith|anvil|iron|bronze|celadon|pottery|craft|대장간|모루|풀무|쇠를 달구|청동|청자|도자기|거푸집|베틀|방적/i.test(full)) {
    return { key: 'forge', focus: 'work', action: 'kneel', reason: '대장간/수공업/제작' };
  }

  // 6. 바다 / 어업 / 포구 / 배 (shore)
  if (/shore|fish|sail|boat|sea|net|harbor|바다|그물|물고기|어선|포구|항해|선원|고기잡이/i.test(full)) {
    return { key: 'shore', focus: 'work', action: 'kneel', reason: '바다/어업/포구' };
  }

  // 7. 여행 / 길 / 이동 / 방황 / 군대 징집 (lane)
  if (/leave|travel|pilgrim|march|war|soldier|conscription|길을 떠나|성지로|순례|징집|군대|피란|달아나|걸어서|유랑|떠돌/i.test(full)) {
    return { key: 'lane', focus: 'body', action: 'walk', reason: '길/여행/순례/군대/이동' };
  }

  // 8. 농사 / 수확 / 모내기 / 밭 (field)
  if (/farm|paddy|plow|harvest|rice|wheat|crop|밭|논|모내기|벼|밀|보리|수확|쟁기|가뭄|소작/i.test(full)) {
    return { key: 'field', focus: 'work', action: 'hoe', reason: '농경/들판/수확' };
  }

  // 기본값: 카드의 기본 포커스(work)
  return { key: 'default', focus: 'work', action: 'talk', reason: '일반/기본' };
}

console.log('=== 카드 409장 씬 매핑 전수 검사 ===\n');

const stats = {};
for (const c of ALL_CARDS) {
  const mapping = inferCardScene(c);
  stats[mapping.key] = (stats[mapping.key] || 0) + 1;
}

console.log('매핑 분포:', stats);
console.log('\n샘플 매핑 결과:');
for (const c of ALL_CARDS.slice(0, 25)) {
  const m = inferCardScene(c);
  console.log(`- [${c.id}] -> key: ${m.key.padEnd(8)} focus: ${m.focus.padEnd(7)} action: ${m.action.padEnd(5)} (${m.reason}) | ${c.text?.ko?.slice(0, 45)}`);
}
