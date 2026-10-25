// 가문 및 성씨 영속성, 자식 계승, 가문 도감 및 명망 시스템 (설계: 가문 대물림)
import { sub } from './rng.js';
import { eraOf, groupOf } from './births.js';
import { AREAS } from './places.js';
import { getRouteBadge } from './routes.js';

// 문화권/지역별 성씨 및 가문 명칭 데이터
export const DYNASTY_NAMES = {
  korea: {
    clans: [
      { ko: '밀양 박씨', en: 'Miryang Park', surname: { ko: '박', en: 'Park' } },
      { ko: '전주 이씨', en: 'Jeonju Lee', surname: { ko: '이', en: 'Lee' } },
      { ko: '김해 김씨', en: 'Gimhae Kim', surname: { ko: '김', en: 'Kim' } },
      { ko: '경주 최씨', en: 'Gyeongju Choi', surname: { ko: '최', en: 'Choi' } },
      { ko: '달성 서씨', en: 'Dalseong Seo', surname: { ko: '서', en: 'Seo' } },
      { ko: '안동 권씨', en: 'Andong Kwon', surname: { ko: '권', en: 'Kwon' } },
      { ko: '파평 윤씨', en: 'Papyeong Yun', surname: { ko: '윤', en: 'Yun' } },
      { ko: '해주 오씨', en: 'Haeju Oh', surname: { ko: '오', en: 'Oh' } },
      { ko: '진주 강씨', en: 'Jinju Kang', surname: { ko: '강', en: 'Kang' } },
      { ko: '광산 김씨', en: 'Gwangsan Kim', surname: { ko: '김', en: 'Kim' } },
    ],
    names: {
      m: [
        { ko: '도진', en: 'Dojin' }, { ko: '명우', en: 'Myungwoo' }, { ko: '춘삼', en: 'Chunsam' },
        { ko: '진혁', en: 'Jinhyuk' }, { ko: '원석', en: 'Wonseok' }, { ko: '태호', en: 'Taeho' },
        { ko: '성진', en: 'Seongjin' }, { ko: '민재', en: 'Minjae' },
      ],
      f: [
        { ko: '은서', en: 'Eunseo' }, { ko: '소연', en: 'Soyeon' }, { ko: '혜린', en: 'Hyerin' },
        { ko: '지민', en: 'Jimin' }, { ko: '유진', en: 'Yujin' }, { ko: '채원', en: 'Chaewon' },
        { ko: '서현', en: 'Seohyun' }, { ko: '다은', en: 'Daeun' },
      ],
    },
  },
  china: {
    clans: [
      { ko: '장씨 가문', en: 'House of Zhang', surname: { ko: '장', en: 'Zhang' } },
      { ko: '왕씨 가문', en: 'House of Wang', surname: { ko: '왕', en: 'Wang' } },
      { ko: '이씨 가문', en: 'House of Li', surname: { ko: '이', en: 'Li' } },
      { ko: '조씨 가문', en: 'House of Zhao', surname: { ko: '조', en: 'Zhao' } },
      { ko: '유씨 가문', en: 'House of Liu', surname: { ko: '유', en: 'Liu' } },
      { ko: '진씨 가문', en: 'House of Chen', surname: { ko: '진', en: 'Chen' } },
    ],
    names: {
      m: [
        { ko: '웨이', en: 'Wei' }, { ko: '밍', en: 'Ming' }, { ko: '지안', en: 'Jian' },
        { ko: '펑', en: 'Feng' }, { ko: '레이', en: 'Lei' }, { ko: '준', en: 'Jun' },
      ],
      f: [
        { ko: '메이', en: 'Mei' }, { ko: '린', en: 'Lin' }, { ko: '팡', en: 'Fang' },
        { ko: '얀', en: 'Yan' }, { ko: '팅', en: 'Ting' }, { ko: '샤오', en: 'Xiao' },
      ],
    },
  },
  japan: {
    clans: [
      { ko: '후지와라 가문', en: 'Fujiwara Clan', surname: { ko: '후지와라', en: 'Fujiwara' } },
      { ko: '미나모토 가문', en: 'Minamoto Clan', surname: { ko: '미나모토', en: 'Minamoto' } },
      { ko: '타이라 가문', en: 'Taira Clan', surname: { ko: '타이라', en: 'Taira' } },
      { ko: '다테 가문', en: 'Date Clan', surname: { ko: '다테', en: 'Date' } },
      { ko: '사토 가문', en: 'House of Sato', surname: { ko: '사토', en: 'Sato' } },
      { ko: '스즈키 가문', en: 'House of Suzuki', surname: { ko: '스즈키', en: 'Suzuki' } },
    ],
    names: {
      m: [
        { ko: '켄지', en: 'Kenji' }, { ko: '타케시', en: 'Takeshi' }, { ko: '히로시', en: 'Hiroshi' },
        { ko: '카즈키', en: 'Kazuki' }, { ko: '렌', en: 'Ren' }, { ko: '소타', en: 'Sota' },
      ],
      f: [
        { ko: '아키코', en: 'Akiko' }, { ko: '유키', en: 'Yuki' }, { ko: '하나', en: 'Hana' },
        { ko: '레이코', en: 'Reiko' }, { ko: '사쿠라', en: 'Sakura' }, { ko: '아오이', en: 'Aoi' },
      ],
    },
  },
  europe: {
    clans: [
      { ko: '스미스 가문', en: 'House of Smith', surname: { ko: '스미스', en: 'Smith' } },
      { ko: '밀러 가문', en: 'House of Miller', surname: { ko: '밀러', en: 'Miller' } },
      { ko: '베이커 가문', en: 'House of Baker', surname: { ko: '베이커', en: 'Baker' } },
      { ko: '뒤퐁 가문', en: 'Maison Dupont', surname: { ko: '뒤퐁', en: 'Dupont' } },
      { ko: '슈미트 가문', en: 'Haus Schmidt', surname: { ko: '슈미트', en: 'Schmidt' } },
      { ko: '로시 가문', en: 'Casa Rossi', surname: { ko: '로시', en: 'Rossi' } },
    ],
    names: {
      m: [
        { ko: '윌리엄', en: 'William' }, { ko: '토마스', en: 'Thomas' }, { ko: '피에르', en: 'Pierre' },
        { ko: '한스', en: 'Hans' }, { ko: '마르코', en: 'Marco' }, { ko: '루카스', en: 'Lucas' },
      ],
      f: [
        { ko: '엘리자베스', en: 'Elizabeth' }, { ko: '마리', en: 'Marie' }, { ko: '안나', en: 'Anna' },
        { ko: '클라라', en: 'Clara' }, { ko: '엠마', en: 'Emma' }, { ko: '소피아', en: 'Sophia' },
      ],
    },
  },
  south: {
    clans: [
      { ko: '샤르마 가문', en: 'Sharma Family', surname: { ko: '샤르마', en: 'Sharma' } },
      { ko: '파텔 가문', en: 'Patel House', surname: { ko: '파텔', en: 'Patel' } },
      { ko: '굽타 가문', en: 'Gupta Lineage', surname: { ko: '굽타', en: 'Gupta' } },
      { ko: '베르마 가문', en: 'Verma Family', surname: { ko: '베르마', en: 'Verma' } },
      { ko: '싱 가문', en: 'Singh Clan', surname: { ko: '싱', en: 'Singh' } },
    ],
    names: {
      m: [
        { ko: '아라브', en: 'Aarav' }, { ko: '비반', en: 'Vihaan' }, { ko: '아디티아', en: 'Aditya' },
        { ko: '아난드', en: 'Anand' }, { ko: '데브', en: 'Dev' },
      ],
      f: [
        { ko: '아디티', en: 'Aditi' }, { ko: '프리야', en: 'Priya' }, { ko: '디야', en: 'Diya' },
        { ko: '아냐', en: 'Aanya' }, { ko: '푸자', en: 'Pooja' },
      ],
    },
  },
  west: {
    clans: [
      { ko: '알 하심 가문', en: 'Al-Hashimi House', surname: { ko: '알 하심', en: 'Al-Hashimi' } },
      { ko: '알 만수르 가문', en: 'Al-Mansur Lineage', surname: { ko: '알 만수르', en: 'Al-Mansur' } },
      { ko: '알 나자르 가문', en: 'Al-Najjar Family', surname: { ko: '알 나자르', en: 'Al-Najjar' } },
      { ko: '알 카팁 가문', en: 'Al-Khatib House', surname: { ko: '알 카팁', en: 'Al-Khatib' } },
    ],
    names: {
      m: [
        { ko: '타리크', en: 'Tariq' }, { ko: '오마르', en: 'Omar' }, { ko: '하산', en: 'Hassan' },
        { ko: '카림', en: 'Karim' }, { ko: '자이드', en: 'Zayd' },
      ],
      f: [
        { ko: '파티마', en: 'Fatima' }, { ko: '라일라', en: 'Layla' }, { ko: '자이납', en: 'Zaynab' },
        { ko: '마리암', en: 'Maryam' }, { ko: '누르', en: 'Noor' },
      ],
    },
  },
  generic: {
    clans: [
      { ko: '강물 씨족', en: 'River Clan', surname: { ko: '강물', en: 'River' } },
      { ko: '바위 씨족', en: 'Stone Clan', surname: { ko: '바위', en: 'Stone' } },
      { ko: '푸른 숲 씨족', en: 'Forest Clan', surname: { ko: '푸른 숲', en: 'Forest' } },
      { ko: '바람 씨족', en: 'Wind Clan', surname: { ko: '바람', en: 'Wind' } },
    ],
    names: {
      m: [
        { ko: '타호', en: 'Taho' }, { ko: '마테오', en: 'Mateo' }, { ko: '코피', en: 'Kofi' },
        { ko: '치디', en: 'Chidi' }, { ko: '아룬', en: 'Arun' },
      ],
      f: [
        { ko: '아미나', en: 'Amina' }, { ko: '탈리아', en: 'Talia' }, { ko: '마라', en: 'Mara' },
        { ko: '이네스', en: 'Ines' }, { ko: '루나', en: 'Luna' },
      ],
    },
  },
};

// 4대 가문 명망 등급 (Dynasty Prestige Tiers)
export const DYNASTY_TIERS = [
  {
    tier: 1,
    minPrestige: 0,
    title: { ko: '가문의 태동', en: 'Emerging House' },
    motto: { ko: '근검절약과 근면', en: 'Frugality & Diligence' },
    perkDesc: { ko: '시작 재산 +10 (선대 비상금)', en: '+10 Starting Wealth' },
    perks: { startingWealth: 10, startingCharm: 0, startingKnow: 0, startingSkill: 0, statusBoost: 0 },
  },
  {
    tier: 2,
    minPrestige: 10,
    title: { ko: '향토 유지', en: 'Local Renown' },
    motto: { ko: '화목과 신용', en: 'Harmony & Trust' },
    perkDesc: { ko: '시작 재산 +15, 시작 친화력 +8', en: '+15 Wealth, +8 Charm' },
    perks: { startingWealth: 15, startingCharm: 8, startingKnow: 0, startingSkill: 0, statusBoost: 0 },
  },
  {
    tier: 3,
    minPrestige: 25,
    title: { ko: '명망 높은 세가', en: 'Prestigious Lineage' },
    motto: { ko: '학문과 가업 융성', en: 'Scholarly Craft & Prosperity' },
    perkDesc: { ko: '시작 재산 +20, 친화력 +10, 지식 +10, 신분 상승 기회', en: '+20 Wealth, +10 Charm, +10 Know, +1 Status' },
    perks: { startingWealth: 20, startingCharm: 10, startingKnow: 10, startingSkill: 8, statusBoost: 1 },
  },
  {
    tier: 4,
    minPrestige: 50,
    title: { ko: '천하의 명문가', en: 'Great Dynasty' },
    motto: { ko: '만대 번영과 덕망', en: 'Eternal Virtue & Prosperity' },
    perkDesc: { ko: '시작 재산 +30, 모든 능력치 +6, 가문 신표 자동 적용', en: '+30 Wealth, +6 All Stats, Token' },
    perks: { startingWealth: 30, startingCharm: 12, startingKnow: 12, startingSkill: 12, startingHealth: 6, statusBoost: 1 },
  },
];

export function getDynastyTier(prestige) {
  const p = Number.isFinite(prestige) ? prestige : 0;
  for (let i = DYNASTY_TIERS.length - 1; i >= 0; i--) {
    if (p >= DYNASTY_TIERS[i].minPrestige) return DYNASTY_TIERS[i];
  }
  return DYNASTY_TIERS[0];
}

// 지역별 가문 성씨 및 계통 데이터 추출
export function getRegionClanData(area, region) {
  if (DYNASTY_NAMES[area]) return DYNASTY_NAMES[area];
  if (region === 'europe') return DYNASTY_NAMES.europe;
  if (region === 'south') return DYNASTY_NAMES.south;
  if (region === 'west') return DYNASTY_NAMES.west;
  return DYNASTY_NAMES.generic;
}

// 가문 이름 및 성씨 생성
export function generateDynastyClan(area, region, seed) {
  const data = getRegionClanData(area, region);
  const r = sub(seed, 'dyn-clan');
  const clan = r.pick(data.clans);
  return {
    ...clan,
    area,
    region,
  };
}

// 가주 이름 생성 (동아시아: 성 + 이름, 서구: 이름 + 성)
export function generatePersonName(clan, sex, seed, lang = 'ko') {
  const area = clan.area || 'korea';
  const region = clan.region || 'east';
  const data = getRegionClanData(area, region);
  const r = sub(seed, 'person-name');
  const pool = (data.names && data.names[sex]) ? data.names[sex] : DYNASTY_NAMES.generic.names[sex];
  const given = r.pick(pool);
  const isEast = (area === 'korea' || area === 'china' || area === 'japan');

  if (isEast) {
    return {
      ko: `${clan.surname.ko}${given.ko}`,
      en: `${given.en} ${clan.surname.en}`,
      given,
    };
  }
  return {
    ko: `${given.ko} ${clan.surname.ko}`,
    en: `${given.en} ${clan.surname.en}`,
    given,
  };
}

// 한 생애에서 달성한 가문 명망 계산
export function computeLifePrestige(life) {
  if (!life) return 1;
  let p = 0;
  const age = life.death ? life.death.age : (life.age || 0);
  if (age >= 70) p += 5;
  else if (age >= 60) p += 3;
  else if (age >= 50) p += 2;

  const w = life.stats ? life.stats.wealth : (life.wealth || 0);
  if (w >= 90) p += 7;
  else if (w >= 70) p += 4;
  else if (w >= 50) p += 2;

  if (life.status >= 4) p += 4;
  else if (life.status >= 3) p += 2;

  if (life.route) p += 3;
  p += Math.min(4, Math.max(0, life.kids || 0));

  return Math.max(2, p);
}

// 부모 유산 상속 비율 계산 (65% 승계)
export function computeInheritedWealth(parentWealth) {
  const base = Math.round((parentWealth || 35) * 0.65);
  return Math.min(80, Math.max(25, base));
}

// 새 가문 시조(Founder) 등록
export function createDynasty(founderLife, customSeed) {
  const b = founderLife.birth;
  const seed = customSeed || b.seed;
  const clan = generateDynastyClan(b.area, b.region, seed);
  const founderName = generatePersonName(clan, b.sex || 'm', sub(seed, 'founder'));
  const prestige = computeLifePrestige(founderLife);
  const badge = getRouteBadge(founderLife, 'ko') || { ko: '가문의 시조', en: 'Dynasty Founder' };

  const member = {
    gen: 1,
    name: founderName,
    sex: b.sex || 'm',
    birthYear: b.year,
    deathYear: founderLife.death ? founderLife.death.year : founderLife.year,
    age: founderLife.death ? founderLife.death.age : founderLife.age,
    career: badge,
    wealth: Math.round(founderLife.stats ? founderLife.stats.wealth : b.wealth),
    cause: founderLife.death ? founderLife.death.cause : 'peace',
    status: founderLife.status || 2,
    prestigeEarned: prestige,
    note: founderLife.death && founderLife.death.note ? founderLife.death.note : '',
  };

  return {
    id: `dyn-${b.area}-${seed}`,
    name: { ko: clan.ko, en: clan.en },
    surname: clan.surname,
    area: b.area,
    region: b.region,
    gen: 1,
    prestige,
    founder: member,
    members: [member],
  };
}

// 후계자(자식)를 위한 출생 객체 및 가문 갱신
export function prepareSuccessor({ parentLife, dynasty }) {
  const b = parentLife.birth;
  const curGen = dynasty.gen || 1;
  const nextGen = curGen + 1;
  const parentDeathYear = parentLife.death ? parentLife.death.year : parentLife.year;
  const parentAgeAtDeath = parentLife.death ? parentLife.death.age : parentLife.age;

  // 자식의 출생 연도: 부모 25~32세 무렵 낳은 자식으로 정렬 (부모 사망 시 20대 청년으로 가주 계승)
  const kidAgeAtSuccession = Math.max(18, Math.min(30, Math.round(parentAgeAtDeath * 0.45)));
  const birthYear = parentDeathYear - kidAgeAtSuccession;

  // 가문 명망 적립 및 등급 갱신
  const addedPrestige = computeLifePrestige(parentLife);
  const newPrestige = (dynasty.prestige || 0) + addedPrestige;
  const tier = getDynastyTier(newPrestige);

  // 부모의 생애 기록을 가문 족보에 등재
  const parentBadge = getRouteBadge(parentLife, 'ko') || { ko: '가주', en: 'Head of House' };
  const parentMember = {
    gen: curGen,
    name: dynasty.currentHeadName || generatePersonName(dynasty, b.sex || 'm', `${b.seed}-head-${curGen}`),
    sex: b.sex || 'm',
    birthYear: b.year,
    deathYear: parentDeathYear,
    age: parentAgeAtDeath,
    career: parentBadge,
    wealth: Math.round(parentLife.stats ? parentLife.stats.wealth : b.wealth),
    cause: parentLife.death ? parentLife.death.cause : 'oldage',
    status: parentLife.status || 2,
    prestigeEarned: addedPrestige,
    note: parentLife.death && parentLife.death.note ? parentLife.death.note : '',
  };

  // 선대 가업/신분에 맞추어 집안 계승
  let hh = b.household;
  if (parentLife.route === 'merchant') hh = 'shop';
  else if (parentLife.route === 'artisan') hh = 'craft';
  else if (parentLife.route === 'statesman' || parentLife.status >= 4) hh = 'estate';

  const inheritedWealth = computeInheritedWealth(parentLife.stats.wealth);
  const totalWealth = Math.min(95, inheritedWealth + (tier.perks.startingWealth || 0));

  const successorSeed = `${b.seed}-gen${nextGen}`;
  const successorSex = sub(successorSeed, 'sex').next() < 0.5 ? 'm' : 'f';
  const successorName = generatePersonName(dynasty, successorSex, successorSeed);

  const updatedDynasty = {
    ...dynasty,
    gen: nextGen,
    prestige: newPrestige,
    currentHeadName: successorName,
    members: [...(dynasty.members || []), parentMember],
  };

  const successorBirth = {
    seed: successorSeed,
    year: birthYear,
    era: eraOf(birthYear).id,
    group: groupOf(birthYear),
    region: b.region,
    area: b.area,
    household: hh,
    tags: [...b.tags],
    wealth: totalWealth,
    sex: successorSex,
    order: 1, // 장남 또는 장녀
    status: Math.min(5, Math.max(1, (parentLife.status || 2) + (tier.perks.statusBoost || 0))),
    dynasty: updatedDynasty,
  };

  return {
    birth: successorBirth,
    dynasty: updatedDynasty,
    successorName,
    inheritedWealth,
    tier,
  };
}

// 가문 특전 적용 (생애 시작 시 호출)
export function applyDynastyPerks(life, dynasty) {
  if (!dynasty) return;
  const tier = getDynastyTier(dynasty.prestige);
  life.dynasty = dynasty;
  life.flags.dynasty_heir = true;
  life.flags[`dynasty_tier_${tier.tier}`] = true;

  // 시작 스탯 보너스
  if (tier.perks.startingCharm && life.attrs) {
    life.attrs.charm = Math.min(100, life.attrs.charm + tier.perks.startingCharm);
  }
  if (tier.perks.startingKnow && life.attrs) {
    life.attrs.know = Math.min(100, life.attrs.know + tier.perks.startingKnow);
    if (life.attrs.know >= 60) life.flags.literate = true;
  }
  if (tier.perks.startingSkill && life.attrs) {
    life.attrs.skill = Math.min(100, life.attrs.skill + tier.perks.startingSkill);
  }
  if (tier.perks.startingHealth) {
    life.stats.health = Math.min(100, life.stats.health + tier.perks.startingHealth);
  }
}
