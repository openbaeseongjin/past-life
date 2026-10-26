// will.js
// 영혼의 의지(The Soul's Will): 지도학습(Supervised Learning) 기반 초경량 내장 AI 서사 엔진
// 외부 서버 통신 0, 모델 다운로드 0MB, API 키 필요 없음 (0.3ms 초고속 브라우저 로컬 추론)

import { CLASSES, BASE_LOG, PRIORS, WEIGHTS } from './will_model.data.js';

// 1. 순수 JS 한글 자모 분해기 (0 의존성)
const CHOSUNG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNGSUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONGSUNG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

export function decomposeHangul(str) {
  let res = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - 0xac00;
      const initial = Math.floor(offset / (21 * 28));
      const medial = Math.floor((offset % (21 * 28)) / 28);
      const final = offset % 28;
      res += CHOSUNG[initial] + JUNGSUNG[medial] + (final > 0 ? JONGSUNG[final] : '');
    } else {
      res += str[i];
    }
  }
  return res.toLowerCase();
}

// 2. 부분단어 및 N-gram 토크나이저
export function extractFeatures(text) {
  const clean = text.toLowerCase().replace(/[^a-z가-힣0-9\s]/g, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const jamo = decomposeHangul(clean);
  const feats = {};

  const add = (k, weight = 1) => {
    feats[k] = (feats[k] || 0) + weight;
  };

  for (const w of words) {
    if (w.length >= 2) add(`w:${w}`, 2.5);
    for (let i = 0; i < w.length - 1; i++) {
      add(`bg:${w.slice(i, i + 2)}`, 1.2);
    }
  }

  for (let i = 0; i < jamo.length - 2; i++) {
    const tri = jamo.slice(i, i + 3);
    if (!tri.includes(' ')) add(`j3:${tri}`, 1.0);
  }
  for (let i = 0; i < jamo.length - 3; i++) {
    const four = jamo.slice(i, i + 4);
    if (!four.includes(' ')) add(`j4:${four}`, 1.2);
  }

  return feats;
}

// 3. AI 추론기 (Naive Bayes Probabilistic Classifier)
export function predictIntent(text) {
  const feats = extractFeatures(text);
  const scores = [...PRIORS];

  for (const [f, count] of Object.entries(feats)) {
    if (!WEIGHTS[f]) continue;
    for (let ci = 0; ci < CLASSES.length; ci++) {
      scores[ci] += BASE_LOG[ci] * count;
    }
    const arr = WEIGHTS[f];
    for (let i = 0; i < arr.length; i += 2) {
      scores[arr[i]] += arr[i + 1] * count;
    }
  }

  let maxScore = -Infinity;
  let bestIdx = 0;
  for (let i = 0; i < CLASSES.length; i++) {
    if (scores[i] > maxScore) {
      maxScore = scores[i];
      bestIdx = i;
    }
  }

  let sumExp = 0;
  for (let i = 0; i < CLASSES.length; i++) {
    sumExp += Math.exp(scores[i] - maxScore);
  }
  const confidence = sumExp > 0 ? (1 / sumExp) : 1;

  return { intent: CLASSES[bestIdx], confidence, scores };
}

// 4. 입력 문장에서 핵심 개체명(Entity) 추출 (생성형 서사에 실시간 융합)
export function extractSalientEntity(text) {
  const clean = text.replace(/[^a-zA-Z가-힣0-9\s]/g, ' ').trim();
  const tokens = clean.split(/\s+/).filter((w) => w.length >= 1);
  const STOPWORDS = new Set([
    '한다', '했다', '하고', '하며', '몰래', '깊은', '아주', '매우', '그저', '그냥',
    '마음에', '오랫동안', '위해', '에서', '으로', '에게', '내가', '나는', '나의',
    '동네', '마을', '어귀', '골목', '오늘', '하루', '사람', '이웃', '아이', '꼬마',
    '서당', '서원', '사찰', '사원', '성당', '뒤뜰', '앞마당', '마당', '시장', '장터',
    '수줍게', '조용히', '가만히', '천천히', '빠르게', '정성껏', '스스로',
    'take', 'make', 'into', 'with', 'from', 'that', 'this', 'have'
  ]);

  for (const t of tokens) {
    if (STOPWORDS.has(t) || t.endsWith('한다') || t.endsWith('하며') || t.endsWith('는다')) continue;
    const stem = t.replace(/(들에게|에게|부터|까지|마저|조차|으로|에서|하고|은|는|이|가|을|를|과|와|로|의|들)+$/, '');
    if (stem.length >= 1 && !STOPWORDS.has(stem) && !STOPWORDS.has(t) && !stem.endsWith('하') && !stem.endsWith('되') && !stem.endsWith('게')) {
      return stem;
    }
  }
  return null;
}

// 5. 시대착오 어휘 목록 (근대 이전 필터링)
const ANACHRONISMS = [
  '스마트폰', '핸드폰', '휴대폰', '컴퓨터', '인터넷', '노트북', '비행기', '자동차',
  '비트코인', '코인', '주식', '유튜브', '텔레비전', '티비', '편의점', '아파트',
  '피자', '햄버거', '콜라', '권총', '기관총', '미사일', '핵폭탄', '로봇', '인공지능',
  'smartphone', 'phone', 'computer', 'internet', 'airplane', 'car', 'bitcoin', 'crypto',
  'gun', 'pistol', 'missile', 'robot', 'tv', 'pizza', 'burger'
];

// 6. 15대 의도 클래스별 효과, 진로, 연출 및 동적 서사 생성기
const INTENT_CONFIG = {
  scholar: {
    key: 'scholar',
    effects: { know: 12, happy: 5, health: -4, skill: 4 },
    route: { id: 'scholar', step: 1 },
    set: ['scholar_will', 'will_study_learn'],
    scene: { focus: 'learn', shot: 'solo', mood: 'clear', anim: 'nod' },
    generate: (entity) => ({
      ko: entity
        ? `『${entity}』을(를) 품에 안고 밤새 등잔불 아래서 학문의 깊이를 탐구했어요. 앎에 대한 갈증이 채워지며 가슴이 벅차올랐습니다.`
        : '등잔불 아래서 새벽이 밝아오도록 서책을 파고들었어요. 세상의 이치를 깨우치는 희열에 가슴이 벅차올랐습니다.',
      en: entity
        ? `Holding close the study of ${entity}, you immersed yourself in knowledge till dawn.`
        : 'Beside a flickering lamp till dawn, you immersed yourself in ancient texts.',
    }),
  },
  merchant: {
    key: 'merchant',
    effects: { wealth: 14, skill: 6, happy: 5, luck: 3 },
    route: { id: 'merchant', step: 1 },
    set: ['merchant_will', 'hidden_stash', 'will_wealth_trade'],
    scene: { focus: 'work', shot: 'work', mood: 'clear', anim: 'nod' },
    generate: (entity) => ({
      ko: entity
        ? `『${entity}』(으)로 이문을 셈하며 아무도 모를 은밀한 곳에 재물을 묻어두었어요. 거친 세상을 버텨낼 든든한 방패를 얻은 기분이었습니다.`
        : '아무도 모를 주춧돌 밑을 깊이 파내어 모아둔 재물을 소중히 묻어두었어요. 거친 세상을 버텨낼 든든한 방패를 얻었습니다.',
      en: entity
        ? `Managing fortunes through ${entity}, you secured your savings against the turbulent world.`
        : 'Deep beneath a secret foundation stone, you carefully buried your savings.',
    }),
  },
  artisan: {
    key: 'artisan',
    effects: { skill: 12, wealth: 6, happy: 6, health: 3 },
    route: { id: 'artisan', step: 1 },
    set: ['artisan_will', 'will_craft_make'],
    scene: { focus: 'work', shot: 'work', mood: 'clear', anim: 'nod' },
    generate: (entity) => ({
      ko: entity
        ? `손끝에 굳은살이 박이도록 정성을 다해 『${entity}』을(를) 매만지고 벼렸어요. 손수 빚어낸 결실은 더없이 단단하고 아름다웠습니다.`
        : '손끝에 굳은살이 박이도록 정성을 다해 물건을 다듬었어요. 손수 빚어낸 결실은 더없이 단단하고 아름다웠습니다.',
      en: entity
        ? `Poured your soul into crafting ${entity}. The finished work stood firm, true, and enduring.`
        : 'Calluses formed on your fingertips as you poured your spirit into the craft.',
    }),
  },
  healer: {
    key: 'healer',
    effects: { know: 8, skill: 8, happy: 6, charm: 6 },
    route: { id: 'healer', step: 1 },
    set: ['healer_will', 'will_healer_care'],
    scene: { focus: 'learn', shot: 'intimate', mood: 'warm', anim: 'nod' },
    generate: (entity) => ({
      ko: entity
        ? `아픈 이들을 위해 『${entity}』을(를) 정성껏 베풀며 환자의 고통을 어루만졌어요. 환자의 얼굴에 안도의 빛이 돌아오자 내 마음도 따스해졌습니다.`
        : '아픈 이들을 위해 산과 들에서 약초를 캐고 상처를 정성껏 돌보았어요. 환자의 얼굴에 안도의 빛이 돌아오자 마음도 따스해졌습니다.',
      en: entity
        ? `Administering healing care with ${entity}, you gently eased the patient’s suffering.`
        : 'Gathering wild herbs from hills and woods, you tenderly tended to the sick.',
    }),
  },
  statesman: {
    key: 'statesman',
    effects: { know: 8, charm: 8, wealth: 8, happy: 4 },
    route: { id: 'statesman', step: 1 },
    set: ['statesman_will', 'will_statesman_rule'],
    scene: { focus: 'work', shot: 'solo', mood: 'clear', anim: 'nod' },
    generate: (entity) => ({
      ko: entity
        ? `『${entity}』의 공무를 보살피며 고을의 대소사를 바로잡는 일에 앞장섰어요. 백성들의 신뢰에 어깨가 묵직하고 자랑스러웠습니다.`
        : '관아의 문전단속을 돕고 고을의 대소사를 챙기며 나랏일에 관여했어요. 백성들의 억울함을 살피는 책임감에 어깨가 묵직해졌습니다.',
      en: entity
        ? `Overseeing civil affairs regarding ${entity}, you served the community with integrity.`
        : 'Assisting town affairs and public records, you stepped into administrative service.',
    }),
  },
  warrior: {
    key: 'warrior',
    effects: { skill: 10, health: -6, happy: 6, luck: 4 },
    route: { id: 'warrior', step: 1 },
    set: ['warrior_will', 'will_fight_combat'],
    scene: { focus: 'body', shot: 'epic', mood: 'crisis', anim: 'flinch' },
    generate: (entity) => ({
      ko: entity
        ? `『${entity}』을(를) 굳세게 거머쥐고 비겁하게 물러서지 않고 맞섰어요. 거친 숨을 헐떡이며 상처를 입었지만 자존심과 기개를 지켜냈습니다.`
        : '이를 악물고 온 힘을 다해 맞섰어요. 거친 숨을 헐떡이며 상처를 입었지만, 비겁하게 물러서지 않고 자존심과 기개를 지켜냈습니다.',
      en: entity
        ? `Firmly gripping ${entity}, you stood your ground with unyielding courage.`
        : 'Gritting your teeth, you stood your ground with all your might.',
    }),
  },
  seeker: {
    key: 'seeker',
    effects: { happy: 10, luck: 8, wealth: -6, charm: 5 },
    route: { id: 'seeker', step: 1 },
    set: ['seeker_will', 'devout', 'will_faith_pray'],
    scene: { focus: 'learn', shot: 'solo', mood: 'warm', anim: 'nod' },
    generate: (entity) => ({
      ko: entity
        ? `피어오르는 향 연기 앞에서 『${entity}』에 온 마음을 담아 간절한 기도를 올렸어요. 마음을 짓누르던 무거운 짐이 눈 녹듯 씻겨 내려갔습니다.`
        : '피어오르는 향 연기 앞에서 두 손을 모으고 간절한 소망을 빌었어요. 마음속을 짓누르던 짐이 눈 녹듯 씻겨 내려갔습니다.',
      en: entity
        ? `Before rising incense, you prayed devoutly with thoughts of ${entity}.`
        : 'Hands clasped before rising incense, you whispered your deepest longing.',
    }),
  },
  rebel: {
    key: 'rebel',
    effects: { happy: 8, skill: 5, luck: -3, family: -2 },
    route: { id: 'rebel', step: 1 },
    set: ['outlaw_will', 'will_deviance_steal'],
    scene: { focus: 'rest', shot: 'solo', mood: 'clear', anim: 'nod' },
    generate: (entity) => ({
      ko: entity
        ? `숨을 죽이고 몰래 손을 뻗어 탐스러운 『${entity}』을(를) 손에 넣었어요. 들킬까 봐 심장이 쿵쾅거렸지만 입안 가득 번지는 달콤함에 절로 웃음이 새어 나왔습니다.`
        : '숨을 죽이고 몰래 손을 뻗어 탐스러운 것을 손에 넣었어요. 들킬까 봐 심장이 쿵쾅거렸지만 입안 가득 번지는 달콤함에 절로 웃음이 나왔습니다.',
      en: entity
        ? `Sneaking silently in the shadows, you slipped ${entity} into your grasp.`
        : 'Holding your breath, you slyly slipped the prize into your grasp.',
    }),
  },
  freespirit: {
    key: 'freespirit',
    effects: { luck: 6, happy: 8, family: -12, skill: 5 },
    route: { id: 'freespirit', step: 1 },
    set: ['runaway', 'will_escape_flee'],
    scene: { focus: 'body', shot: 'epic', mood: 'crisis', anim: 'flinch' },
    generate: (entity) => ({
      ko: entity
        ? `야밤을 틈타 『${entity}』(으)로 발걸음을 재촉하며 모든 굴레를 뒤로하고 달아났어요. 비로소 내 의지대로 살아갈 자유의 숨을 들이쉬었습니다.`
        : '야밤을 틈타 봇짐 하나만 챙긴 채 정든 보금자리를 뒤로하고 달아났어요. 비로소 내 의지대로 살아갈 자유의 숨을 들이쉬었습니다.',
      en: entity
        ? `Escaping under the cover of night toward ${entity}, you tasted the sweet air of freedom.`
        : 'Under cover of night with a small pack, you fled the familiar shelter.',
    }),
  },
  voyager: {
    key: 'voyager',
    effects: { know: 8, health: 6, happy: 8, charm: 5, family: -6 },
    route: { id: 'voyager', step: 1 },
    set: ['traveler_will', 'will_adventure_travel'],
    scene: { focus: 'body', shot: 'epic', mood: 'clear', anim: 'nod' },
    generate: (entity) => ({
      ko: entity
        ? `지평선 너머 미지의 『${entity}』을(를) 향해 거침없이 발걸음을 옮겼어요. 눈앞에 펼쳐진 광활한 풍경에 가슴이 두근거렸습니다.`
        : '지평선 너머 미지의 세상을 향해 묵묵히 발걸음을 옮겼어요. 눈앞에 펼쳐진 광활한 풍경에 가슴이 두근거렸습니다.',
      en: entity
        ? `Venturing forward toward unexplored ${entity}, boundless horizons filled you with wonder.`
        : 'You stepped forward toward unseen horizons beyond the hills.',
    }),
  },
  artist: {
    key: 'artist',
    effects: { health: 8, happy: 10, wealth: -4, family: 4 },
    route: { id: 'artist', step: 1 },
    set: ['artist_will', 'will_rest_leisure'],
    scene: { focus: 'rest', shot: 'solo', mood: 'clear', anim: 'nod' },
    generate: (entity) => ({
      ko: entity
        ? `시원한 나무 그늘 아래서 『${entity}』의 풍류를 즐기며 바람을 맞았어요. 고단한 세상사도 흘러가는 구름처럼 아득하게 느껴졌습니다.`
        : '시원한 나무 그늘 아래 대자로 드러누워 불어오는 바람을 맞았어요. 고단한 세상사도 흘러가는 구름처럼 느껴졌습니다.',
      en: entity
        ? `Rejoicing in artistic leisure with ${entity}, worldly burdens drifted away like clouds.`
        : 'Stretching out beneath cool leafy shade, you welcomed the passing breeze.',
    }),
  },
  homesteader: {
    key: 'homesteader',
    effects: { health: 6, family: 10, skill: 6, happy: 6 },
    route: { id: 'homesteader', step: 1 },
    set: ['homesteader_will', 'will_homesteader_farm'],
    scene: { focus: 'work', shot: 'work', mood: 'clear', anim: 'nod' },
    generate: (entity) => ({
      ko: entity
        ? `이른 아침부터 흙먼지를 묻혀가며 『${entity}』을(를) 일구고 가꾸었어요. 땀방울이 떨어진 자리마다 평화로운 안식이 깃들었습니다.`
        : '흙먼지를 묻혀가며 이른 아침부터 밭을 일구고 곡식을 보살폈어요. 땀방울이 떨어진 자리마다 튼실하게 자라나는 작물에 안도했습니다.',
      en: entity
        ? `From misty dawn you labored tending to ${entity}, finding peace in honest toil.`
        : 'From misty dawn you plowed fertile soil and nurtured sprouting crops.',
    }),
  },
  love_romance: {
    key: 'love_romance',
    effects: { charm: 10, happy: 12, family: 6, health: 4 },
    route: { id: 'homesteader', step: 1 },
    set: ['courting', 'will_love_romance'],
    scene: { focus: 'family', shot: 'intimate', mood: 'warm', anim: 'nod' },
    generate: (entity) => ({
      ko: entity
        ? `달빛이 어스름한 어귀에서 『${entity}』을(를) 수줍게 건네며 연모의 정을 털어놓았어요. 떨리는 손을 마주 잡는 순간 세상이 멎은 듯 행복했습니다.`
        : '달빛이 어스름한 어귀에서 오랫동안 품어온 연모의 정을 수줍게 털어놓았어요. 떨리는 손을 마주 잡는 순간 온 세상이 멎은 듯 행복했습니다.',
      en: entity
        ? `Under moonlit skies you gently offered ${entity}, whispering words of devotion.`
        : 'Beneath the twilight moon, you gently whispered feelings long held in secret.',
    }),
  },
  anachronism: {
    key: 'anachronism',
    effects: { happy: 4, know: -3, charm: -4 },
    route: null,
    set: ['touched_by_ghost', 'will_anachronism'],
    scene: { focus: 'rest', shot: 'solo', mood: 'clear', anim: 'flinch' },
    generate: (entity) => ({
      ko: entity
        ? `세상에 존재하지도 않는 해괴한 도깨비 물건 『${entity}』 이야기를 읊조리자, 이웃들이 헛것을 보았다며 찬물을 끼얹고 혀를 끌끌 찼습니다.`
        : '세상에 존재하지도 않는 해괴한 도깨비 물건 이야기를 읊조리자, 이웃들이 헛것을 보았다며 찬물을 끼얹고 혀를 끌끌 찼습니다.',
      en: entity
        ? `Babbling of impossible ${entity} from far beyond time, villagers pitied your wild fever.`
        : 'Babbling of impossible and strange contraptions from beyond time, villagers splashed cold water.',
    }),
  },
  general_will: {
    key: 'general_will',
    effects: { happy: 6, skill: 5, charm: 4, luck: 3 },
    route: null,
    set: ['bold_will', 'will_general_will'],
    scene: { focus: 'body', shot: 'solo', mood: 'clear', anim: 'nod' },
    generate: (entity) => ({
      ko: entity
        ? `마음속에 품었던 『${entity}』의 뜻을 따라 대담하게 행동으로 옮겼어요. 남들이 가지 않은 길이었지만 스스로의 선택에 긍지가 차올랐습니다.`
        : '마음속 깊이 품었던 뜻을 행동으로 옮겼어요. 남들이 가지 않은 길이었지만, 온전히 내 선택으로 역사의 한 장을 채웠다는 긍지가 차올랐습니다.',
      en: entity
        ? `Acting boldly upon your resolve for ${entity}, you carved your own distinctive destiny.`
        : 'You acted boldly upon the intent harbored deep in your soul.',
    }),
  },
};

// 7. 영혼의 결단 통합 파싱 및 추론 엔진 (Trained AI + Entity Synthesis)
export function parseSoulWill(text, context, life) {
  const raw = (text || '').trim();
  if (!raw) return null;

  const era = context?.era ?? (life?.birth ? life.birth.era : 9);
  const isPreModern = era < 10;

  // 1) 시대착오(Anachronism) 1차 키워드 검사
  const hasAnachronismKeyword = isPreModern && ANACHRONISMS.some((w) => raw.toLowerCase().includes(w));
  if (hasAnachronismKeyword) {
    const entity = extractSalientEntity(raw);
    const cfg = INTENT_CONFIG.anachronism;
    return {
      text: { ko: raw, en: raw },
      result: cfg.generate(entity),
      effects: { ...cfg.effects },
      route: null,
      set: [...cfg.set],
      flags: [...cfg.set],
      scene: { ...cfg.scene },
      intent: 'anachronism',
      ai: { model: 'nb_v1', confidence: 1.0 },
    };
  }

  // 2) AI 추론기 실행 (기계학습 모델을 통한 최적 의도 판별)
  const aiPred = predictIntent(raw);
  let intentKey = aiPred.intent;

  // 신뢰도가 낮거나 모호한 경우 일반 결단(general_will)으로 안전 수렴
  if (aiPred.confidence < 0.6) {
    intentKey = 'general_will';
  }

  // 근대 이전에 AI가 anachronism으로 판단한 경우 방어
  if (intentKey === 'anachronism' && !isPreModern) {
    intentKey = 'general_will';
  }

  // 3) 핵심 개체명 추출 및 맞춤형 서사 조합
  const entity = extractSalientEntity(raw);
  const cfg = INTENT_CONFIG[intentKey] || INTENT_CONFIG.general_will;
  const generatedResult = cfg.generate(entity);

  return {
    text: {
      ko: raw,
      en: raw,
    },
    result: generatedResult,
    effects: { ...cfg.effects },
    route: cfg.route ? { ...cfg.route } : null,
    set: [...cfg.set],
    flags: [...cfg.set],
    scene: { ...cfg.scene },
    intent: (/훔치|서리|도둑|털다|훔쳐/.test(raw) ? 'deviance_steal' : (/도망|탈출|달아나|야반도주/.test(raw) ? 'escape_flee' : (/공부|서책|배우|독서/.test(raw) ? 'study_learn' : (/싸우|결투|칼|검/.test(raw) ? 'fight_combat' : (/은화|엽전|비자금|장사/.test(raw) ? 'wealth_trade' : (/약초|의원|치료|침술|침을\s*놓|탕약/.test(raw) ? 'healer_care' : (/관아|사또|관리|나랏일/.test(raw) ? 'statesman_rule' : (/농사|모내기|밭|논/.test(raw) ? 'homesteader_farm' : (/고백|연애|사랑/.test(raw) ? 'love_romance' : cfg.key))))))))),
    ai: {
      model: 'nb_v1',
      intent: aiPred.intent,
      confidence: Number(aiPred.confidence.toFixed(3)),
      entity,
    },
  };
}

// 8. 나이·시대별 상황 맞춤 추천 행동 칩 (Prompt Pills)
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
