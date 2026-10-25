// cardscene.js
// 카드와 3D 장면·인물 행동의 논리적 정합성 연동 모듈
// 카드가 다루는 서사(농사, 대장간, 상업, 학문, 종교, 가족, 질병, 여행 등)에 맞추어
// 3D 무대의 인물 위치(spot), 동작(action), 곁 사람(mates), 포커스(focus)를 결정한다.

export function cardFocusOf(card) {
  if (!card) return 'work';
  if (card.focus) return card.focus;

  const id = card.id || '';
  const textKo = card.text?.ko || '';
  const textEn = card.text?.en || '';
  const titleKo = card.title?.ko || '';
  const full = `${id} ${titleKo} ${textKo} ${textEn}`.toLowerCase();

  // 1. 질병 / 부상 / 요양 / 피로 -> rest
  if (card.ill || /열병|역병|독감|마마|홍역|상처|골절|앓아누|치료|요양|쑤시고|뻐근|흑사병|fever|sick|plague|ache|illness|wound|hospital/.test(full)) {
    return 'rest';
  }

  // 2. 가족 / 혼인 / 출생 / 아이 / 부모 / 식구 / 회합 -> family
  if (/marry|wedding|sibling|child\.story|child\.friend|child\.chores|혼례|혼인|첫아이|아기가 태어|식구가|어른들에게 옛이야기|동무|집안일|가족|할머니|부모님|짝을 맺|손주|elder|grandkids|baby\.cry|baby\.word/.test(full)) {
    return 'family';
  }

  // 3. 배움 / 종교 / 철학 / 서당 / 사원 / 성당 / 과거시험 / 스승 / 책 -> learn
  if (/exam|learn|scriptorium|temple|church|monastery|mosque|shrine|서당|과거시험|천자문|성당|사원|사찰|스님|신부님|수도원|경전|글공부|스승|도서관|학교|대학|지식|책을 읽/.test(full)) {
    return 'learn';
  }

  // 4. 신체 / 방황 / 여행 / 길 / 군대 / 징집 / 피란 -> body
  if (/leave|travel|pilgrim|march|war|soldier|conscription|길을 떠나|성지로|순례|징집|군대|피란|달아나|걸어서|유랑|떠돌|무예|달리기|체력/.test(full)) {
    return 'body';
  }

  return 'work';
}

// 카드의 세부 장소 키워드 ('market' | 'forge' | 'shore' | 'field' | null)
export function cardWorkSpotOf(card) {
  if (!card) return null;
  const id = card.id || '';
  const textKo = card.text?.ko || '';
  const textEn = card.text?.en || '';
  const titleKo = card.title?.ko || '';
  const full = `${id} ${titleKo} ${textKo} ${textEn}`.toLowerCase();

  if (/market|bazaar|trade|shop|merchant|장터|시장|가게|흥정|상인|좌판|은화|비단길|무역/.test(full)) {
    return 'market';
  }
  if (/forge|smith|anvil|craft|대장간|모루|풀무|쇠를 달구|청동|청자|거푸집|베틀/.test(full)) {
    return 'forge';
  }
  if (/(?:^|\s)(?:fish|boat|sail|shore|net|harbor)(?:$|\s)|바다|그물|물고기|어선|포구|항해|선원|고기잡이/.test(full)) {
    return 'shore';
  }
  if (/farm|paddy|plow|harvest|rice|wheat|crop|밭|논|모내기|벼|밀|보리|수확|쟁기/.test(full)) {
    return 'field';
  }
  return null;
}
