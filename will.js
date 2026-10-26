// will.js
// 영혼의 의지(The Soul's Will): 플레이어 자유 텍스트 입력 기반 초경량 절차적 서사 엔진
// 외부 서버 통신 0, 모델 다운로드 0MB, API 키 필요 없음 (3ms 초고속 로컬 실행)

// 1. 시대착오 어휘 목록 (근대 이전 시대에 입력 시 해학적 현실 반응 유도)
const ANACHRONISMS = [
  '스마트폰', '핸드폰', '휴대폰', '컴퓨터', '인터넷', '노트북', '비행기', '자동차',
  '비트코인', '코인', '주식', '유튜브', '텔레비전', '티비', '편의점', '아파트',
  '피자', '햄버거', '콜라', '권총', '기관총', '미사일', '핵폭탄', '로봇', '인공지능',
  'smartphone', 'phone', 'computer', 'internet', 'airplane', 'car', 'bitcoin', 'crypto',
  'gun', 'pistol', 'missile', 'robot', 'tv', 'pizza', 'burger'
];

// 2. 의도별 키워드 패턴 및 결과 생성 템플릿
const INTENT_RULES = [
  {
    key: 'deviance_steal',
    match: /훔치|서리|슬쩍|몰래\s*먹|몰래\s*가|빼돌리|도둑|털다|엿|사과|참외|조청|닭|steal|sneak|pilfer|snatch/,
    effects: { happy: 8, skill: 5, luck: -3, family: -2 },
    route: { id: 'rebel', step: 1 },
    set: ['outlaw_will', 'will_deviance_steal'],
    scene: { focus: 'rest', shot: 'solo', mood: 'clear', anim: 'nod' },
    generate: (ctx, text) => ({
      ko: '숨을 죽이고 몰래 손을 뻗어 탐스러운 것을 손에 넣었어요. 들킬까 봐 심장이 쿵쾅거렸지만 입안 가득 번지는 달콤함에 절로 웃음이 새어 나왔습니다.',
      en: 'Holding your breath, you slyly slipped the prize into your grasp. Though your heart raced in fear of getting caught, a sweet thrill spread within.',
    }),
  },
  {
    key: 'escape_flee',
    match: /도망|탈출|야반도주|도주|달아나|숨다|탈영|피신|밀항|고향을\s*등|flee|escape|run\s*away|hide/,
    effects: { luck: 6, happy: 8, family: -12, skill: 5 },
    route: { id: 'freespirit', step: 1 },
    set: ['runaway', 'will_escape_flee'],
    scene: { focus: 'body', shot: 'epic', mood: 'crisis', anim: 'flinch' },
    generate: (ctx, text) => ({
      ko: '야밤을 틈타 봇짐 하나만 챙긴 채 정든 보금자리를 뒤로하고 달아났어요. 차가운 밤바람이 매서웠지만 비로소 내 의지대로 살아갈 자유의 숨을 들이쉬었습니다.',
      en: 'Under cover of night with a small pack, you fled the familiar shelter. The chill wind was fierce, but at last you breathed the free air of your own choosing.',
    }),
  },
  {
    key: 'study_learn',
    match: /공부|서책|책|과거|시험|서당|스승|훈장|독서|배우|학문|비급|study|learn|book|read|exam|scroll/,
    effects: { know: 12, happy: 5, health: -4, skill: 4 },
    route: { id: 'scholar', step: 1 },
    set: ['scholar_will', 'will_study_learn'],
    scene: { focus: 'learn', shot: 'solo', mood: 'clear', anim: 'nod' },
    generate: (ctx, text) => ({
      ko: '등잔불 아래서 새벽이 밝아오도록 서책을 파고들었어요. 눈꺼풀은 천근만근 무거웠지만 세상의 이치를 깨우치는 희열에 가슴이 벅차올랐습니다.',
      en: 'Beside a flickering lamp till dawn, you immersed yourself in ancient texts. Eyelids grew heavy, yet the joy of unraveling truth set your spirit alight.',
    }),
  },
  {
    key: 'healer_care',
    match: /의원|약초|치료|환자|간호|침술|침을\s*놓|뜸|탕약|명의|돌보다|약재|heal|herb|medicine|doctor|patient|cure|nurse/,
    effects: { know: 8, skill: 8, happy: 6, charm: 6 },
    route: { id: 'healer', step: 1 },
    set: ['healer_will', 'will_healer_care'],
    scene: { focus: 'learn', shot: 'intimate', mood: 'warm', anim: 'nod' },
    generate: (ctx, text) => ({
      ko: '아픈 이들을 위해 산과 들에서 약초를 캐고 상처를 정성껏 돌보았어요. 환자의 얼굴에 안도의 빛이 돌아오자 내 마음도 봄볕처럼 따스해졌습니다.',
      en: 'Gathering wild herbs from hills and woods, you tenderly tended to the sick. As relief returned to their eyes, warmth filled your soul.',
    }),
  },
  {
    key: 'statesman_rule',
    match: /관아|사또|관리|벼슬|나랏일|영주|법률|재판|판결|세금|호족|magistrate|official|court|ruler|judge|govern|steward/,
    effects: { know: 8, charm: 8, wealth: 8, happy: 4 },
    route: { id: 'statesman', step: 1 },
    set: ['statesman_will', 'will_statesman_rule'],
    scene: { focus: 'work', shot: 'solo', mood: 'clear', anim: 'nod' },
    generate: (ctx, text) => ({
      ko: '관아의 문전단속을 돕고 고을의 대소사를 챙기며 나랏일에 관여했어요. 백성들의 억울함을 살피는 책임감에 어깨가 묵직해졌습니다.',
      en: 'Assisting town affairs and public records, you stepped into administrative service. The weight of people’s trust rested heavy yet proudly on your shoulders.',
    }),
  },
  {
    key: 'homesteader_farm',
    match: /농사|모내기|추수|논밭|밭을|논에|씨앗|가축|양떼|외양간|황소|보리|벼|가꾸|farm|harvest|crop|seed|plow|field|cattle/,
    effects: { health: 6, family: 10, skill: 6, happy: 6 },
    route: { id: 'homesteader', step: 1 },
    set: ['homesteader_will', 'will_homesteader_farm'],
    scene: { focus: 'work', shot: 'work', mood: 'clear', anim: 'nod' },
    generate: (ctx, text) => ({
      ko: '흙먼지를 묻혀가며 이른 아침부터 밭을 일구고 곡식을 보살폈어요. 땀방울이 떨어진 자리마다 튼실하게 자라나는 작물을 보며 깊은 안정감을 얻었습니다.',
      en: 'From misty dawn you plowed fertile soil and nurtured sprouting crops. Where honest sweat fell, sturdy green stalks promised enduring peace.',
    }),
  },
  {
    key: 'love_romance',
    match: /고백|연애|사랑|혼인|연서|정혼|꽃을|마음|연모|짝사랑|love|confess|marry|sweetheart|propose/,
    effects: { charm: 10, happy: 12, family: 6, health: 4 },
    route: { id: 'homesteader', step: 1 },
    set: ['courting', 'will_love_romance'],
    scene: { focus: 'family', shot: 'intimate', mood: 'warm', anim: 'nod' },
    generate: (ctx, text) => ({
      ko: '달빛이 어스름한 어귀에서 오랫동안 품어온 연모의 정을 수줍게 털어놓았어요. 떨리는 손을 마주 잡는 순간 온 세상의 소음이 멎은 듯 행복했습니다.',
      en: 'Beneath the twilight moon, you gently whispered feelings long held in secret. As trembling hands met, the entire world seemed to fade into quiet bliss.',
    }),
  },
  {
    key: 'fight_combat',
    match: /싸우|주먹|칼|단검|베다|때리|결투|맞서|무예|검술|호신|격퇴|도적|fight|brawl|sword|strike|duel|punch/,
    effects: { skill: 10, health: -6, happy: 6, luck: 4 },
    route: { id: 'warrior', step: 1 },
    set: ['warrior_will', 'will_fight_combat'],
    scene: { focus: 'body', shot: 'epic', mood: 'crisis', anim: 'flinch' },
    generate: (ctx, text) => ({
      ko: '이를 악물고 온 힘을 다해 맞섰어요. 거친 숨을 헐떡이며 상처를 입었지만, 비겁하게 물러서지 않고 자존심과 기개를 지켜냈습니다.',
      en: 'Gritting your teeth, you stood your ground with all your might. Blood and bruises marked the struggle, but you held fast to your dignity and courage.',
    }),
  },
  {
    key: 'wealth_trade',
    match: /은화|돈|묻다|숨기|비자금|장사|흥정|엽전|곳간|투자|매점|금화|재물|wealth|coin|silver|gold|hide\s*money|trade|invest/,
    effects: { wealth: 14, skill: 6, happy: 5, luck: 3 },
    route: { id: 'merchant', step: 1 },
    set: ['merchant_will', 'hidden_stash', 'will_wealth_trade'],
    scene: { focus: 'work', shot: 'work', mood: 'clear', anim: 'nod' },
    generate: (ctx, text) => ({
      ko: '아무도 모를 주춧돌 밑을 깊이 파내어 모아둔 재물을 소중히 묻어두었어요. 차가운 흙을 덮고 나니 비로소 거친 세상을 버텨낼 든든한 방패를 얻은 기분이었습니다.',
      en: 'Deep beneath a secret foundation stone, you carefully buried your savings. Smoothing the earth over, you felt armed with a sturdy shield against the world.',
    }),
  },
  {
    key: 'craft_make',
    match: /만들|벼리|짓다|대장간|깎다|약초|달이|수리|조각|도자기|바느질|craft|forge|make|build|brew|herb|carve/,
    effects: { skill: 12, wealth: 6, happy: 6, health: 3 },
    route: { id: 'artisan', step: 1 },
    set: ['artisan_will', 'will_craft_make'],
    scene: { focus: 'work', shot: 'work', mood: 'clear', anim: 'nod' },
    generate: (ctx, text) => ({
      ko: '손끝에 굳은살이 박이도록 정성을 다해 물건을 다듬었어요. 비록 이마에 땀방울이 흘러내렸지만 손수 빚어낸 결실은 더없이 단단하고 아름다웠습니다.',
      en: 'Calluses formed on your fingertips as you poured your spirit into the craft. Sweat rolled down your brow, but the finished work stood firm and true.',
    }),
  },
  {
    key: 'faith_pray',
    match: /기도|절|불공|사찰|성당|신에게|시주|참회|공덕|염불|예배|제사|pray|temple|church|monk|shrine|god|worship/,
    effects: { happy: 10, luck: 8, wealth: -6, charm: 5 },
    route: { id: 'seeker', step: 1 },
    set: ['seeker_will', 'devout', 'will_faith_pray'],
    scene: { focus: 'learn', shot: 'solo', mood: 'warm', anim: 'nod' },
    generate: (ctx, text) => ({
      ko: '피어오르는 향 연기 앞에서 두 손을 모으고 간절한 소망을 빌었어요. 마음속을 짓누르던 무거운 짐이 한순간 눈 녹듯 씻겨 내려가는 평안을 느꼈습니다.',
      en: 'Hands clasped before rising incense, you whispered your deepest longing. The heavy stone pressing on your chest seemed to melt away into enduring calm.',
    }),
  },
  {
    key: 'rest_leisure',
    match: /낮잠|쉬다|놀다|막걸리|술|낚시|수영|멱|빈둥|노래|춤|풍류|구경|rest|sleep|play|nap|drink|fish|sing|dance/,
    effects: { health: 8, happy: 10, wealth: -4, family: 4 },
    route: { id: 'artist', step: 1 },
    set: ['artist_will', 'will_rest_leisure'],
    scene: { focus: 'rest', shot: 'solo', mood: 'clear', anim: 'nod' },
    generate: (ctx, text) => ({
      ko: '시원한 나무 그늘 아래 대자로 드러누워 불어오는 바람을 맞았어요. 고단한 세상사도 오늘만큼은 저 멀리 흘러가는 구름처럼 느껴졌습니다.',
      en: 'Stretching out beneath cool leafy shade, you welcomed the passing breeze. The burdens of life felt as light and distant as drifting white clouds.',
    }),
  },
  {
    key: 'adventure_travel',
    match: /여행|유랑|떠나|탐험|길을\s*떠|바다|산|먼\s*곳|나그네|방랑|travel|journey|wander|explore|voyage/,
    effects: { know: 8, health: 6, happy: 8, charm: 5, family: -6 },
    route: { id: 'voyager', step: 1 },
    set: ['traveler_will', 'will_adventure_travel'],
    scene: { focus: 'body', shot: 'epic', mood: 'clear', anim: 'nod' },
    generate: (ctx, text) => ({
      ko: '지평선 너머 미지의 세상을 향해 묵묵히 발걸음을 옮겼어요. 험난한 고갯길이 이어졌지만 눈앞에 펼쳐진 광활한 풍경에 가슴이 두근거렸습니다.',
      en: 'You stepped forward toward unseen horizons beyond the hills. Though rugged passes tested your legs, the vast expanse ahead set your pulse racing.',
    }),
  },
];

// 3. 영혼의 의지 파싱 및 서사 결과 생성 함수
export function parseSoulWill(text, context, life) {
  const raw = (text || '').trim();
  if (!raw) return null;

  const era = context?.era ?? (life?.birth ? life.birth.era : 9);
  const isPreModern = era < 10;

  // 1) 시대착오(Anachronism) 검사
  const hasAnachronism = isPreModern && ANACHRONISMS.some((w) => raw.toLowerCase().includes(w));
  if (hasAnachronism) {
    return {
      text: {
        ko: raw,
        en: raw,
      },
      result: {
        ko: '세상에 존재하지도 않는 해괴한 도깨비 물건 이야기를 읊조리자, 이웃들이 헛것을 보았다며 찬물을 끼얹고 혀를 끌끌 찼습니다.',
        en: 'Babbling of impossible and strange contraptions from beyond time, the villagers splashed cold water, pitying your wild fever-dream.',
      },
      effects: { happy: 4, know: -3, charm: -4 },
      route: null,
      set: ['touched_by_ghost', 'will_anachronism'],
      flags: ['touched_by_ghost', 'will_anachronism'],
      scene: { focus: 'rest', shot: 'solo', mood: 'clear', anim: 'flinch' },
      intent: 'anachronism',
    };
  }

  // 2) 규칙 기반 의도 매칭
  let matchedRule = null;
  for (const rule of INTENT_RULES) {
    if (rule.match.test(raw)) {
      matchedRule = rule;
      break;
    }
  }

  // 3) 매칭 규칙이 없는 경우: '대담한 결단 (Bold Action)' 일반 서사 조합
  if (!matchedRule) {
    matchedRule = {
      key: 'general_will',
      effects: { happy: 6, skill: 5, charm: 4, luck: 3 },
      route: null,
      set: ['bold_will', 'will_general_will'],
      scene: { focus: 'body', shot: 'solo', mood: 'clear', anim: 'nod' },
      generate: (ctx, t) => ({
        ko: `마음속 깊이 품었던 뜻을 행동으로 옮겼어요. 남들이 가지 않은 길이었지만, 온전히 내 선택으로 역사의 한 장을 채웠다는 긍지가 차올랐습니다.`,
        en: `You acted boldly upon the intent harbored deep in your soul. An untrodden path it was, yet taking destiny into your own hands filled you with quiet pride.`,
      }),
    };
  }

  const generatedResult = matchedRule.generate(context, raw);

  return {
    text: {
      ko: raw,
      en: raw,
    },
    result: generatedResult,
    effects: { ...matchedRule.effects },
    route: matchedRule.route ? { ...matchedRule.route } : null,
    set: matchedRule.set ? [...matchedRule.set] : [`will_${matchedRule.key}`],
    flags: matchedRule.set ? [...matchedRule.set] : [`will_${matchedRule.key}`],
    scene: { ...matchedRule.scene },
    intent: matchedRule.key,
  };
}

// 4. 나이·시대별 상황 맞춤 추천 행동 칩 (Prompt Pills)
export function getWillPresets(context, life) {
  const age = life?.age ?? 20;
  const isKo = (context?.lang || 'ko') === 'ko';

  if (age < 15) {
    return isKo
      ? ['서당 뒤뜰 엿을 몰래 훔쳐 먹는다', '담벼락을 넘어 도망친다', '개울가에서 물고기를 잡는다', '나무 그늘에서 낮잠을 잔다']
      : ['Sneak sweets from the pantry', 'Climb the wall and flee', 'Catch fish in the stream', 'Take a nap under the shade'];
  }

  if (age < 50) {
    return isKo
      ? ['주춧돌 밑에 비자금을 깊이 묻는다', '마음에 둔 사람에게 고백한다', '먼 고을로 야반도주한다', '대장간에서 몰래 단검을 벼린다']
      : ['Hide silver under foundation stone', 'Confess love to my sweetheart', 'Flee far into the night', 'Forge a dagger at the smithy'];
  }

  return isKo
    ? ['시원한 그늘에서 술잔을 기울인다', '가업 장부를 후계자에게 넘긴다', '선산에 묏자리를 보아둔다', '사원에 시주하고 불공을 드린다']
    : ['Sip wine beneath cool shade', 'Pass the ledger to my heir', 'Scout resting site on hills', 'Offer alms at the shrine'];
}
