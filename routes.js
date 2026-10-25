// 초다양성 인생 및 직업 루트 엔진 (Life Route & Career Progression System)
// 플레이어의 선택에 따라 12대 생애 궤적과 연속 서사 체인을 생성하고 관리합니다.

export const ROUTES = {
  artisan: { id: 'artisan', icon: '🔨', ko: '장인의 길', en: 'Artisan’s Path', attr: 'skill', talent: 'craft' },
  merchant: { id: 'merchant', icon: '💰', ko: '상업의 길', en: 'Merchant’s Path', attr: 'charm', talent: 'trade' },
  voyager: { id: 'voyager', icon: '🌊', ko: '바다의 길', en: 'Voyager’s Path', attr: 'skill', talent: 'sea' },
  scholar: { id: 'scholar', icon: '📜', ko: '학문의 길', en: 'Scholar’s Path', attr: 'know', talent: 'letters' },
  healer: { id: 'healer', icon: '🌿', ko: '치유의 길', en: 'Healer’s Path', attr: 'know', talent: 'heal' },
  statesman: { id: 'statesman', icon: '⚖️', ko: '통치의 길', en: 'Statesman’s Path', attr: 'status', talent: 'letters' },
  warrior: { id: 'warrior', icon: '⚔️', ko: '무예의 길', en: 'Warrior’s Path', attr: 'health', talent: 'fight' },
  seeker: { id: 'seeker', icon: '🕯️', ko: '구도의 길', en: 'Seeker’s Path', attr: 'happy', talent: 'music' },
  rebel: { id: 'rebel', icon: '🔥', ko: '저항의 길', en: 'Rebel’s Path', attr: 'charm', talent: 'fight' },
  artist: { id: 'artist', icon: '🎭', ko: '풍류의 길', en: 'Artist’s Path', attr: 'charm', talent: 'music' },
  homesteader: { id: 'homesteader', icon: '🌾', ko: '대지의 길', en: 'Homesteader’s Path', attr: 'family', talent: 'farm' },
  freespirit: { id: 'freespirit', icon: '🌲', ko: '자유인의 길', en: 'Free-Spirit’s Path', attr: 'happy', talent: 'beast' }
};

export const ROUTE_STEPS = {
  artisan: [
    { ko: '수습 도제', en: 'Apprentice' },
    { ko: '공방 장인', en: 'Journeyman Maker' },
    { ko: '길드 명장', en: 'Master Craftsman' },
    { ko: '전설의 장인', en: 'Legendary Artisan' }
  ],
  merchant: [
    { ko: '장터 보부상', en: 'Peddler' },
    { ko: '원정 상인', en: 'Caravan Trader' },
    { ko: '대상단의 거상', en: 'Grand Merchant' },
    { ko: '황금의 명망가', en: 'Renowned Benefactor' }
  ],
  voyager: [
    { ko: '갑판 수습선원', en: 'Deckhand' },
    { ko: '원양 조타수', en: 'Deep-Sea Helmsman' },
    { ko: '선단 선장', en: 'Voyage Captain' },
    { ko: '바다의 전설', en: 'Legend of the Seas' }
  ],
  scholar: [
    { ko: '신전 필경사', en: 'Scribe Novice' },
    { ko: '관청 서기', en: 'Town Registrar' },
    { ko: '원로 사상가', en: 'Eminent Scholar' },
    { ko: '역사의 편찬자', en: 'Grand Chronicler' }
  ],
  healer: [
    { ko: '약초 채집꾼', en: 'Herbal Gatherer' },
    { ko: '마을 산파·의원', en: 'Village Practitioner' },
    { ko: '자애로운 명의', en: 'Master Healer' },
    { ko: '의서의 스승', en: 'Venerable Physician' }
  ],
  statesman: [
    { ko: '관아 말단 서리', en: 'Junior Magistrate' },
    { ko: '재판관·집사', en: 'Judge & Steward' },
    { ko: '지역의 호족', en: 'High Commissioner' },
    { ko: '가문의 거목', en: 'Venerable Statesman' }
  ],
  warrior: [
    { ko: '신병·자경대원', en: 'Militiaman' },
    { ko: '전선의 용사', en: 'Veteran Guard' },
    { ko: '수비대장', en: 'Garrison Commander' },
    { ko: '노병의 수호자', en: 'Legendary Guardian' }
  ],
  seeker: [
    { ko: '사원 출가자', en: 'Temple Acolyte' },
    { ko: '침묵의 수도승', en: 'Cloistered Monk' },
    { ko: '영적 지도자', en: 'Spiritual Guide' },
    { ko: '해탈의 성자', en: 'Enlightened Seeker' }
  ],
  rebel: [
    { ko: '각성한 이방인', en: 'Awakened Soul' },
    { ko: '산채의 의적', en: 'Righteous Outlaw' },
    { ko: '민중의 지도자', en: 'Rebel Tribune' },
    { ko: '자유의 불씨', en: 'Beacon of Freedom' }
  ],
  artist: [
    { ko: '유랑 광대', en: 'Strolling Troubadour' },
    { ko: '저잣거리 예인', en: 'Market Performer' },
    { ko: '궁정의 거장', en: 'Court Virtuoso' },
    { ko: '불멸의 가객', en: 'Immortal Bard' }
  ],
  homesteader: [
    { ko: '젊은 농군', en: 'Young Farmer' },
    { ko: '두레의 기둥', en: 'Homestead Leader' },
    { ko: '마을의 어른', en: 'Village Elder' },
    { ko: '고향의 수호목', en: 'Venerable Patriarch' }
  ],
  freespirit: [
    { ko: '숲속 방랑자', en: 'Forest Wanderer' },
    { ko: '야생의 사냥꾼', en: 'Wilderness Hunter' },
    { ko: '산골 은둔자', en: 'Mountain Hermit' },
    { ko: '자연의 현자', en: 'Spirit of the Wild' }
  ]
};

// 두 궤적이 만났을 때 열리는 독창적 하이브리드 칭호
export const HYBRID_TITLES = {
  'healer+seeker': { ko: '성스러운 치료사', en: 'Saintly Healer' },
  'seeker+healer': { ko: '성스러운 치료사', en: 'Saintly Healer' },
  'merchant+voyager': { ko: '대양의 거상', en: 'Merchant Captain' },
  'voyager+merchant': { ko: '대양의 거상', en: 'Merchant Captain' },
  'artist+freespirit': { ko: '바람의 음유시인', en: 'Wandering Bard' },
  'freespirit+artist': { ko: '바람의 음유시인', en: 'Wandering Bard' },
  'warrior+rebel': { ko: '녹림의 의적', en: 'Righteous Outlaw' },
  'rebel+warrior': { ko: '녹림의 의적', en: 'Righteous Outlaw' },
  'scholar+artisan': { ko: '천재 발명가', en: 'Master Inventor' },
  'artisan+scholar': { ko: '천재 발명가', en: 'Master Inventor' },
  'homesteader+healer': { ko: '약초 농부', en: 'Herbal Elder' },
  'healer+homesteader': { ko: '약초 농부', en: 'Herbal Elder' },
  'scholar+statesman': { ko: '경세가', en: 'Philosopher Statesman' },
  'statesman+scholar': { ko: '경세가', en: 'Philosopher Statesman' },
  'warrior+seeker': { ko: '성전 기사', en: 'Paladin Seeker' },
  'seeker+warrior': { ko: '성전 기사', en: 'Paladin Seeker' }
};

// 현재 생의 루트 배지 정보
export function getRouteBadge(life, lang = 'ko') {
  if (!life || !life.route) return null;
  const { id, step = 1, secondary = null } = life.route;
  const route = ROUTES[id];
  if (!route) return null;

  const stepIdx = Math.max(0, Math.min(3, step - 1));
  const stepName = (ROUTE_STEPS[id] && ROUTE_STEPS[id][stepIdx]) ? ROUTE_STEPS[id][stepIdx][lang] : '';

  let title = stepName;
  if (secondary && HYBRID_TITLES[`${id}+${secondary}`]) {
    title = HYBRID_TITLES[`${id}+${secondary}`][lang];
  }

  return {
    id,
    icon: route.icon,
    routeName: route[lang],
    step,
    stepName,
    title,
    fullTitle: `${route.icon} [${route[lang]}: ${title}]`
  };
}

// 플레이어 선택으로 생애 루트 진입 및 진화
export function setLifeRoute(life, routeParam) {
  if (!life || !routeParam) return;
  const id = typeof routeParam === 'string' ? routeParam : routeParam.id;
  const step = (typeof routeParam === 'object' && routeParam.step) ? routeParam.step : 1;
  if (!ROUTES[id]) return;

  const prev = life.route;
  if (!prev) {
    life.route = {
      id,
      step,
      secondary: null,
      pivoted: false,
      history: [{ age: life.age, year: life.year, id, step }]
    };
  } else if (prev.id === id) {
    prev.step = Math.max(prev.step, step);
    prev.history.push({ age: life.age, year: life.year, id, step: prev.step });
  } else {
    // 인생 2막 진로 전환 (Career Pivot)
    prev.secondary = prev.id;
    prev.id = id;
    prev.step = step;
    prev.pivoted = true;
    prev.history.push({ age: life.age, year: life.year, id, step, pivotFrom: prev.secondary });
  }

  // 플래그 동기화
  if (!life.flags) life.flags = {};
  life.flags[`route:${id}`] = true;
  life.flags.hasRoute = true;
}

// 루트에 따른 후속 카드 가중치 배수 계산
export function routeWeightBonus(card, route) {
  if (!card || !route || !card.route) return 1;
  if (card.route !== route.id) return 1;

  const targetStep = card.routeStep || 1;
  if (targetStep === route.step + 1) return 5; // 다음 단계 카드: 5배 폭발적 부스트
  if (targetStep === route.step) return 3;     // 동등 단계 카드: 3배 부스트
  return 2;
}

// 사망 기록 서류(Obituary)에 남길 평생의 직업적 족적
export function careerSummary(life, lang = 'ko') {
  if (!life) return null;
  const badge = getRouteBadge(life, lang);
  if (!badge) {
    return lang === 'ko'
      ? '한평생 소박하게 땅과 가족을 지키며 살았습니다.'
      : 'Lived a humble life tending to the land and family.';
  }

  const { id, step, title, icon } = badge;
  if (lang === 'ko') {
    if (step >= 3) {
      return `${icon} ${title}로서 일생을 바쳐 큰 족적을 남기고 후학들의 존경을 받았습니다.`;
    } else if (step === 2) {
      return `${icon} 굳은 의지로 자신만의 길을 개척한 ${title}로 살았습니다.`;
    }
    return `${icon} ${title}의 길에 첫발을 딛고 성실히 삶을 일궜습니다.`;
  } else {
    if (step >= 3) {
      return `${icon} Dedicated a lifetime as a ${title}, leaving an enduring legacy.`;
    } else if (step === 2) {
      return `${icon} Walked an independent path as a steadfast ${title}.`;
    }
    return `${icon} Began the journey as a dedicated ${title}.`;
  }
}
