// cardscene.js
// 카드와 3D 장면·인물 행동의 논리적 정합성 연동 모듈
// 카드가 다루는 서사(농사, 대장간, 상업, 학문, 종교, 가족, 질병, 여행 등)에 맞추어
// 3D 무대의 인물 위치(spot), 동작(action), 곁 사람(mates), 포커스(focus),
// 카메라 쇼트(shot), 손 소품(handProp), 대기 무드(mood)를 저사양 0비용으로 결정한다.

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

// ── [저사양 특화] 카드 서사 맞춤형 4대 카메라 쇼트 ──
// 'intimate' (친밀·가족·혼례·아이) : 2.5m 거리 3/4 정면 투샷
// 'epic'     (전쟁·기근·역병·재앙) : 32m 고도 상공 하이앵글 와이드 (원경 조망)
// 'solo'     (학문·과거·성찰·기도) : 2.2m 처마/나무 밑 로우앵글 클로즈업
// 'work'     (농사·대장간·장터·일) : 4.5m 일터 워크스테이션 스테이징
export function cardShotOf(card) {
  if (!card) return 'work';
  const id = card.id || '';
  const textKo = card.text?.ko || '';
  const textEn = card.text?.en || '';
  const titleKo = card.title?.ko || '';
  const full = `${id} ${titleKo} ${textKo} ${textEn}`.toLowerCase();

  // 1. 위기 / 전쟁 / 역병 / 기근 / 대재앙 -> epic 하이앵글
  if (/war|soldier|battle|conscription|plague|famine|flood|drought|tempest|bandit|ruin|전쟁|징집|군대|피란|달아나|역병|흑사병|기근|가뭄|홍수|난리|도적|수탈|불길|폐허/.test(full)) {
    return 'epic';
  }

  // 2. 가족 / 혼인 / 출생 / 아이 / 사랑 / 우정 -> intimate 투샷
  if (/marry|wedding|birth|baby|child|kin|family|friend|lover|sibling|elder|grandkids|혼례|혼인|출생|첫아이|아기|아이|식구|가족|짝을|사랑|동무|형제|자매|부모|할머니|손주|옛이야기/.test(full)) {
    return 'intimate';
  }

  // 3. 학문 / 서당 / 사원 / 과거 / 성찰 / 질병 -> solo 클로즈업
  if (/exam|learn|book|scroll|scriptorium|temple|shrine|church|monastery|pray|monk|priest|alone|solitude|sick|fever|wound|hospital|과거|시험|서당|사원|사찰|절|성당|수도원|경전|글공부|천자문|스승|도서관|지식|책|홀로|고독|열병|앓아|요양/.test(full)) {
    return 'solo';
  }

  return 'work';
}

// ── [저사양 특화] 초경량 인물 손 소품 (0 다운로드, 기본 도형 기반) ──
// 'book'     : 서책 / 두루마리 (학문, 과거, 서당, 경전, scholar)
// 'hoe'      : 나무 괭이 / 낫 (농사, 논밭, 모내기, 수확, homesteader)
// 'pack'     : 봇짐 / 광주리 (상업, 장터, 무역, 여행, 피란, healer, voyager)
// 'staff'    : 나무 지팡이 (노년기 60세~, 유랑, freespirit)
// 'pray'     : 합장 (사찰, 성당, 수도원, 기도, 시주, seeker)
// 'sword'    : 도검 / 칼자루 (무예, 결투, 호위, warrior)
// 'hammer'   : 대장간 망치 (대장간, 공방, 수공예, artisan)
// 'flute'    : 대나무 피리 (풍류, 가락, 판소리, artist)
// 'pouch'    : 돈주머니 (장사, 엽전, 은화, merchant)
// 'dagger'   : 비수 / 단검 (일탈, 서리, 의적, rebel)
// 'spyglass' : 원양 망원경 (항해, 탐험, voyager)
export function cardHandPropOf(card, { age = 20, route = null } = {}) {
  const routeProp = (r) => {
    if (!r) return null;
    const rid = r.id || r;
    if (rid === 'warrior') return 'sword';
    if (rid === 'scholar') return 'book';
    if (rid === 'artisan') return 'hammer';
    if (rid === 'healer') return 'pack';
    if (rid === 'seeker') return 'pray';
    if (rid === 'artist') return 'flute';
    if (rid === 'homesteader') return 'hoe';
    if (rid === 'merchant') return 'pouch';
    if (rid === 'voyager') return 'spyglass';
    if (rid === 'rebel') return 'dagger';
    if (rid === 'freespirit') return 'staff';
    return null;
  };

  if (!card) {
    return routeProp(route) || (age >= 60 ? 'staff' : null);
  }
  const id = card.id || '';
  const textKo = card.text?.ko || '';
  const textEn = card.text?.en || '';
  const titleKo = card.title?.ko || '';
  const full = `${id} ${titleKo} ${textKo} ${textEn}`.toLowerCase();

  // 1. 학문 / 서책 / 두루마리
  if (/exam|learn|book|scroll|scriptorium|read|write|study|과거|시험|서책|책|두루마리|서당|글공부|천자문|사서삼경|경전|성경|도서관/.test(full)) {
    return 'book';
  }

  // 2. 신앙 / 기도 / 사원 / 불공 / 시주
  if (/temple|shrine|church|monastery|pray|monk|priest|offering|vow|사원|사찰|절|성당|수도원|기도|불공|시주|공덕|예배|제사|합장/.test(full)) {
    return 'pray';
  }

  // 3. 무예 / 검술 / 결투 / 칼 / 창
  if (/sword|blade|dagger|spear|duel|fight|warrior|칼|검|단검|창|무예|결투|싸움|수비대|자경단/.test(full)) {
    return 'sword';
  }

  // 4. 대장간 / 망치 / 공방 / 쇠
  if (/forge|smith|anvil|hammer|대장간|풀무|모루|망치|쇠두드리|벼리/.test(full)) {
    return 'hammer';
  }

  // 5. 풍류 / 악기 / 피리 / 거문고 / 노래
  if (/flute|music|song|bard|zither|피리|대금|가야금|거문고|노래|판소리|풍류/.test(full)) {
    return 'flute';
  }

  // 6. 상업 / 장터 / 봇짐 / 보따리 / 여행
  if (/market|trade|merchant|shop|caravan|baggage|pack|travel|journey|flee|장터|시장|상인|좌판|봇짐|보따리|광주리|무역|행상|피란|길을 떠나/.test(full)) {
    return 'pack';
  }

  // 7. 농경 / 밭일 / 괭이 / 낫 / 수확
  if (/farm|paddy|harvest|wheat|rice|crop|plow|field|weed|밭|논|모내기|벼|밀|보리|수확|김매기|괭이|낫|쟁기/.test(full)) {
    return 'hoe';
  }

  // 8. 노년기 기본 지팡이
  if (age >= 60 || /지팡이|노인|지팡|staff|cane/.test(full)) {
    return 'staff';
  }

  // 9. 카드 고유 매칭이 없을 때 진로 루트 기본 소품으로 폴백
  return routeProp(route);
}

// ── [저사양 특화] 카드 서사별 0비용 대기 조명 틴트 (Ambient Color Shift) ──
// 'warm'   : 혼례 / 축제 / 사랑 / 잔치 / 기쁨 (온화한 황금빛)
// 'crisis' : 전쟁 / 역병 / 기근 / 대재앙 (차가운 잿빛)
// 'clear'  : 평온한 일상 (자연광)
export function cardMoodOf(card) {
  if (!card) return 'clear';
  const id = card.id || '';
  const textKo = card.text?.ko || '';
  const textEn = card.text?.en || '';
  const titleKo = card.title?.ko || '';
  const full = `${id} ${titleKo} ${textKo} ${textEn}`.toLowerCase();

  if (/war|plague|famine|flood|drought|crisis|bandit|전쟁|역병|기근|가뭄|난리|홍수|도적|수탈|흑사병|열병/.test(full)) {
    return 'crisis';
  }
  if (/marry|wedding|festival|birth|feast|love|joy|혼례|혼인|축제|잔치|첫아이|아기|사랑|경사|풍년|급제/.test(full)) {
    return 'warm';
  }
  return 'clear';
}
