// tools/refine_cardscene.mjs
import { DECK } from '../deck.js';
import { EVENT_CARDS } from '../cards_event.js';

const ALL_CARDS = [...DECK, ...EVENT_CARDS];

export function cardFocusOf(card) {
  if (!card) return 'work';
  // 1. 카드 자체에 명시적 focus 가 있으면 그것을 최우선 사용
  if (card.focus) return card.focus;

  const id = card.id || '';
  const textKo = card.text?.ko || '';
  const textEn = card.text?.en || '';
  const titleKo = card.title?.ko || '';
  const full = `${id} ${titleKo} ${textKo} ${textEn}`.toLowerCase();

  // 2. 질병 / 부상 / 요양 / 피로 -> rest
  if (card.ill || card.hurt || /열병|역병|독감|마마|홍역|상처|골절|앓아누|치료|요양|쑤시고|뻐근|fever|sick|plague|ache|illness|wound|hospital/.test(full)) {
    return 'rest';
  }

  // 3. 가족 / 혼인 / 출생 / 아이 / 부모 / 식구 / 회합 -> family
  // (단, '시장에서 일하는 중에 식구 생각' 같은 복합어 방지)
  if (/marry|wedding|sibling|child\.story|child\.friend|child\.chores|혼례|혼인|첫아이|아기가 태어|식구가|어른들에게 옛이야기|동무|집안일|가족|할머니|부모님|짝을 맺|손주|elder|grandkids|baby\.cry|baby\.word/.test(full)) {
    return 'family';
  }

  // 4. 배움 / 종교 / 철학 / 서당 / 사원 / 성당 / 과거시험 / 스승 / 책 -> learn
  if (/exam|learn|scriptorium|temple|church|monastery|mosque|shrine|서당|과거시험|천자문|성당|사원|사찰|스님|신부님|수도원|경전|글공부|스승|도서관|학교|대학|지식|책을 읽/.test(full)) {
    return 'learn';
  }

  // 5. 신체 / 방황 / 여행 / 길 / 군대 / 징집 / 피란 -> body
  if (/leave|travel|pilgrim|march|war|soldier|conscription|길을 떠나|성지로|순례|징집|군대|피란|달아나|걸어서|유랑|떠돌|무예|달리기|체력/.test(full)) {
    return 'body';
  }

  // 6. 시장 / 장터 / 상업 / 흥정 / 무역 -> work (market spot)
  if (/market|bazaar|trade|shop|merchant|장터|시장|가게|흥정|상인|좌판|은화|비단길|무역/.test(full)) {
    return 'market'; // 세부 워크 스팟
  }

  // 7. 대장간 / 수공업 / 제작 / 모루 -> work (forge spot)
  if (/forge|smith|anvil|craft|대장간|모루|풀무|쇠를 달구|청동|청자|거푸집|베틀/.test(full)) {
    return 'forge'; // 세부 워크 스팟
  }

  // 8. 바다 / 어선 / 그물 / 낚시 -> work (shore spot)
  if (/(?:^|\s)(?:fish|boat|sail|shore|net|harbor)(?:$|\s)|바다|그물|물고기|어선|포구|항해|선원|고기잡이/.test(full)) {
    return 'shore'; // 세부 워크 스팟
  }

  // 9. 농사 / 수확 / 모내기 / 밭 -> work (field spot)
  if (/farm|paddy|plow|harvest|rice|wheat|crop|밭|논|모내기|벼|밀|보리|수확|쟁기/.test(full)) {
    return 'field'; // 세부 워크 스팟
  }

  return 'work';
}

console.log('=== 카드 409장 정밀 포커스 분류 결과 ===');
const counts = {};
for (const c of ALL_CARDS) {
  const f = cardFocusOf(c);
  counts[f] = (counts[f] || 0) + 1;
}
console.log('포커스 분포:', counts);

// 오분류 가능성 있는 샘플 검토
console.log('\n--- 시장(market) 카드 샘플 5개 ---');
ALL_CARDS.filter(c => cardFocusOf(c) === 'market').slice(0, 5).forEach(c => console.log(`  [${c.id}] ${c.text?.ko?.slice(0, 50)}`));

console.log('\n--- 대장간(forge) 카드 샘플 5개 ---');
ALL_CARDS.filter(c => cardFocusOf(c) === 'forge').slice(0, 5).forEach(c => console.log(`  [${c.id}] ${c.text?.ko?.slice(0, 50)}`));

console.log('\n--- 농경(field) 카드 샘플 5개 ---');
ALL_CARDS.filter(c => cardFocusOf(c) === 'field').slice(0, 5).forEach(c => console.log(`  [${c.id}] ${c.text?.ko?.slice(0, 50)}`));

console.log('\n--- 바다/수변(shore) 카드 샘플 5개 ---');
ALL_CARDS.filter(c => cardFocusOf(c) === 'shore').slice(0, 5).forEach(c => console.log(`  [${c.id}] ${c.text?.ko?.slice(0, 50)}`));

console.log('\n--- 배움/사원(learn) 카드 샘플 5개 ---');
ALL_CARDS.filter(c => cardFocusOf(c) === 'learn').slice(0, 5).forEach(c => console.log(`  [${c.id}] ${c.text?.ko?.slice(0, 50)}`));

console.log('\n--- 가족/결혼(family) 카드 샘플 5개 ---');
ALL_CARDS.filter(c => cardFocusOf(c) === 'family').slice(0, 5).forEach(c => console.log(`  [${c.id}] ${c.text?.ko?.slice(0, 50)}`));

console.log('\n--- 질병/휴식(rest) 카드 샘플 5개 ---');
ALL_CARDS.filter(c => cardFocusOf(c) === 'rest').slice(0, 5).forEach(c => console.log(`  [${c.id}] ${c.text?.ko?.slice(0, 50)}`));

console.log('\n--- 길/이동(body) 카드 샘플 5개 ---');
ALL_CARDS.filter(c => cardFocusOf(c) === 'body').slice(0, 5).forEach(c => console.log(`  [${c.id}] ${c.text?.ko?.slice(0, 50)}`));
