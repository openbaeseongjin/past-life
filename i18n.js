// 화면 글과 연도 표기 (설계 2장: 한국어·영어)
import { AREAS } from './places.js';
import { householdOf } from './households.js';
import { TRACE_TEXT, KIND_TEXT } from './traces.js';
import { CAUSES } from './deaths.js';
import { FOCUS_NAME, focusStage } from './focus.js';
import { cumBirths } from './births.js';
import { peerAt } from './peers.js';
import { wealthText, holdingsText } from './holdings.js';
import { DISEASES, MEDICINE_NAMES, WAR_NAMES } from './context_data.js';
import { EVENTS } from './events.js';
import { josa, fillTokens } from './tokens.js';
import { contextOf } from './context.js';

// 해 → 글. 0 이하는 기원전 (1 − y)년, 기원전 1만 년보다 옛날은 100년 단위로 반올림하고 「무렵」
export function fmtYear(y, lang) {
  if (y >= 1) return lang === 'ko' ? `${y}년` : `${y}`;
  let b = 1 - y;
  const approx = b > 10000;
  if (approx) b = Math.round(b / 100) * 100;
  const n = b.toLocaleString('en-US', { useGrouping: b >= 10000 });   // 1210 / 63,000
  return lang === 'ko' ? `기원전 ${n}년${approx ? ' 무렵' : ''}` : `${approx ? 'c. ' : ''}${n} BCE`;
}

const ORD = { ko: ['첫째', '둘째', '셋째', '넷째', '다섯째'], en: ['first', 'second', 'third', 'fourth', 'fifth'] };

// 한글 나이 (갈림길·모닥불 머리): 17 → 「열일곱 살」, 20 → 「스무 살」. 100살부터는 숫자
const ONES = ['', '한', '두', '세', '네', '다섯', '여섯', '일곱', '여덟', '아홉'];
const TENS = ['', '열', '스물', '서른', '마흔', '쉰', '예순', '일흔', '여든', '아흔'];
export function ageWord(a, lang) {
  if (lang !== 'ko') return `age ${a}`;
  if (a <= 0) return '갓난아기';
  if (a >= 100) return `${a}살`;
  const tn = Math.floor(a / 10), o = a % 10;
  return `${tn === 2 && o === 0 ? '스무' : TENS[tn]}${ONES[o]} 살`;
}

// 빼기 표시: U+2212 (IBM Plex Sans KR 라틴 묶음에 글자가 있다 — 브라우저에서 글꼴 폭으로 확인, 작업 4 보고). holdings.wealthText 도 같은 글자를 쓴다
export const MINUS = '−';

const STR = {
  ko: {
    title: '한 영혼의 여정', oneIn: '1,170억 분의 1',
    subtitle: '지금까지 태어난 약 1,170억 명 가운데 한 명으로 태어나 한 생을 살아요. 시간은 저절로 흐르고, 중요한 순간에는 당신이 골라요. 다음 판에는 같은 영혼이 다음 시대에 다시 태어나요.',
    born: '태어나기', next: (n) => `다음 생 (영혼의 ${n}번째 생)`, lineage: '영혼 족보', dex: (n) => `전생 도감 (${n}칸)`,
    newSoul: '새 영혼', newSoulSure: '정말 새로 시작할까요? 지금 여정은 지워져요', lang: 'English', soundOn: '소리 켬', soundOff: '소리 끔',
    credit: '자료: PRB 2022 · OWID (HYDE·UN·Riley) · Volk & Atkinson 2013 · 3D: KayKit (CC0). 집안 비율과 사건 위험률은 게임용 어림이에요.',
    everBorn: '지금까지 태어난 사람', age: (a) => `${a}살`, unit: '살',
    birthDoc: '출생 기록', deathDoc: '사망 기록', start: '삶을 시작하기',
    f_era: '시대', f_year: '해', f_place: '땅', f_home: '집안', f_child: '태어난 아이', f_e0: '그때 이 땅의 기대수명', f_u5: '다섯 살 전에 떠날 확률', f_births: '그해 태어난 아기',
    childOf: (o, sex) => `${ORD.ko[o - 1]} ${sex === 'f' ? '딸' : '아들'}`,
    peersTitle: '같은 해 태어난 사람들', peersHint: '이들도 같은 통계를 따라 끝까지 살아요.', lastWords: '앞 생에 남긴 말',
    pause: '멈춤', resume: '계속', skip: '다음 결정까지 »', auto: '자동 결정', exit: '나가기',
    focusTitle: '올해의 초점', focusAuto: '저절로', focusBaby: '여섯 살부터 한 해를 어디에 쓸지 고를 수 있어요. 아기 때는 빠르게 넘겨도 좋아요.',
    focusHint: '언제든 바꿀 수 있어요. 고르지 않으면 가장 급한 쪽으로 저절로 정해져요.',
    journal: '인생 기록', statsTitle: '상태', mapTitle: '인생 지도', mapHint: '한 칸 = 1년 · 진할수록 행복했던 해 · 테두리 = 그때 이 땅의 기대수명',
    stats: { health: '건강', wealth: '재산', family: '가족', happy: '행복' },
    stage: { baby: '아기', child: '어린 시절', teen: '청소년', adult: '어른', middle: '중년', old: '노년' },
    deadAt: (a, c) => `${a}살에 떠남 · ${c}`, male: '남', female: '여',
    decision: '중대 결정', luck: '운에 달림', autoIn: (s) => `잠시 후 「${s}」 쪽으로 넘어가요 · 누르면 멈춰요`, autoOn: '이제부터 결정을 자동으로 맡기기',
    lastYear: (a) => `마지막 해, ${a}살`, diedIn: (place) => `${place}에서 숨을 거뒀어요.`, tapNext: '누르면 넘어가요',
    cause: '사인', outlived: (p) => `그해 이 땅에서 태어난 사람 중 약 ${p}%가 당신보다 오래 살았어요.`,
    happiest: '가장 행복했던 해', topFocus: '가장 오래 쓴 한 해', partner: '함께한 사람', kids: '아이', partnerYes: '있었어요', partnerNo: '없었어요', kidsN: (n) => `${n}명`,
    gained: '다음 생에 지고 갈 흔적', noneGained: '흔적 없이 가볍게 떠났어요',
    peersOut: (n) => `같은 해 태어난 네 사람 가운데 ${n}명이 당신보다 오래 살았어요.`,
    survTitle: '생존 곡선', survHint: '그해 이 땅에서 태어난 사람이 몇 살까지 살아 있었나 (금색 점이 당신)',
    toLife: '이 삶에게 남기는 말 (족보와 다음 생에 남아요)', toLifeEnd: '이 삶에게 남기는 말 (족보에 남아요)', toLifePh: '한 줄이면 충분해요',
    nextBtn: '다음 생으로', toLineage: '영혼 족보 보기', share: '나누기', toTitle: '처음으로', epilogue: '그리고 지금, 당신으로 태어났어요.',
    lineageTitle: '한 영혼의 여정', livesCount: (n) => `${n}번의 생`, dexTitle: '전생 도감', dexHint: '살아 본 시대와 지역', practice: '연습 (시드)',
    nth: (n) => `영혼의 ${n}번째 생`, trace: '앞 생의 흔적', seed: '시드',
    wander: (g) => (g <= 1 ? '영혼은 쉬지 않고 바로 다시 태어났어요.' : `영혼은 ${g.toLocaleString('ko-KR')}년을 떠돌다 다시 태어났어요.`),
    copyText: '글로 복사', copied: '복사했어요', copyFail: '복사가 막혀 있어요. 글을 길게 눌러 복사해 주세요.', imageHint: '그림을 길게 눌러 저장하세요', close: '닫기',
    noVillage: '3D 마을을 그릴 수 없어서 글로만 진행해요.',
    stageWarn: '마을 그림 일부를 불러오지 못했어요 — 이야기는 그대로 이어져요.',
    // 지금(2026)까지 살아 멈춘 생
    presentDoc: '지금도 이어지는 생', presentTitle: (y, a) => `${y}년, ${a}살`, presentLine: '이 생은 지금도 이어지고 있어요.', now: '지금', partnerNow: '있어요',
    reached: (p) => `그해 이 땅에서 태어난 사람 중 약 ${p}%가 이 나이까지 살아요.`, peersAlive: (n) => (n ? `같은 해 태어난 네 사람 가운데 ${n}명도 지금 살아 있어요.` : '같은 해 태어난 네 사람은 모두 먼저 떠났어요.'),
    aliveNow: (a) => `지금 ${a}살`, epiloguePresent: '이 생은 지금도 이어지고 있어요. 같은 해, 같은 하늘 아래에서 — 당신도요.',
    stuck: '진행이 멈췄어요. 다시 불러와 보고, 그래도 안 되면 저장을 지우고 새로 시작해 주세요.', reload: '다시 불러오기', wipe: '저장을 지우고 새로 시작',
    // 화면 다시 기획 (2026-10-20): 구슬 실 · 카드 손패 · 불씨
    lifeN: (n) => `${n}번째 생`, practiceBadge: '연습', birthSky: '1,170억 번의 탄생 가운데',
    birthAgain: (g) => (!(g > 1) ? '쉬지 않고, 다시' : `${g.toLocaleString('ko-KR')}년 뒤, 다시`),
    placeTitle: '이번 생의 자리', tokE0: '평균 수명', tokU5: '첫 고비', carried: '앞 생에서 가져온 것',
    statX: { health: '몸', wealth: '살림', family: '곁', happy: '마음' },
    speedName: { slow: '느림', normal: '보통', fast: '빠름', fastest: '아주 빠름' }, sundial: '해시계',
    skipX: '다음 갈림길까지 ›', autoX: '영혼에게 맡기기', more: '더 보기',
    handTitle: '올해의 패', handBaby: '아직 어려서 패를 들 수 없어요.', handHint: '언제든 바꿀 수 있어요. 고르지 않으면 가장 급한 쪽 패를 저절로 들어요.', handAuto: '저절로',
    scrollTitle: '두루마리', scrollOpen: '펼치기', scrollClose: '접기',
    strandTitle: '구슬 실', strandAria: (n, best) => `구슬 ${n}알, 가장 빛난 해 ${best}살`, peersX: '동갑내기',
    crossTitle: (title) => `갈림길 · ${title}`, crossAuto: (s) => `잠시 뒤 「${s}」 길로 가요 · 누르면 멈춰요`, luckX: '운에 맡김',
    // 모닥불: 기억 구슬 고르기 + 앞 생의 메아리 (2026-10-20, 통계 줄·질문·적는 칸을 바꿨다)
    campTitle: (a) => `${ageWord(a, 'ko')}의 모닥불`, campHint: '하나를 고르면 실과 염주에 큰 구슬로 꿰어져요',
    campEchoHint: '푸른 구슬을 고르면 앞 생의 흔적이 짙어져요', campAuto: (s) => `잠시 뒤 「${s}」 구슬이 꿰어져요 · 누르면 멈춰요`,
    memBead: '기억 구슬', echoBead: '앞 생의 메아리', rosaryAria: (n, m) => `영혼의 염주 · 생 ${n}가닥 · 기억 구슬 ${m}알`,
    traceDeepened: (name) => `앞 생의 흔적이 짙어졌어요 · ${name}`, traceLevel: (n) => `짙기 ${n}/3`,
    flameTitle: '불씨가 떠나요', flameLine: (a, cause) => `${ageWord(a, 'ko')} · ${cause}`,
    knotTitle: '매듭', untiedTitle: '매듭짓지 않은 실', brightest: '가장 빛난 구슬', whyEnded: '떠난 까닭', stillGoing: '지금도 이어지는 중',
    hundredTitle: '백 가닥', hundredCap: (n) => `백 명 가운데 ${n}명보다 오래 살았어요`, hundredCapNow: (n) => `백 명 가운데 ${n}명이 이 나이까지 살아요`,
    gainedX: '얻은 흔적', noteNext: '다음 생에 보내는 쪽지', noteEnd: '쪽지 (염주에 남아요)',
    toBeads: '영혼의 염주 보기', beadsTitle: '영혼의 염주', beadsSoFar: '지금까지의 염주', journeyOn: '여정은 아직 이어지고 있어요.',
    keepLiving: '이어서 살기', settings: '설정',
    // 시뮬 2.0 수치 판 · 시대의 바람 · 구체적인 효과 (sim2 설계 2·3.3·5장)
    statN: { health: '건강', wealth: '재산', family: '곁', happy: '마음' },
    attrN: { charm: '친화력', luck: '행운', know: '지식', skill: '손재주' },
    boardTitle: '수치 판', attrsTitle: '능력치', statusX: '신분', boundX: '묶임',
    boundHint: '땅이나 주인에 묶여 마음대로 떠나거나 일을 바꾸기 어려워요', literate: '글 앎', illiterate: '글 모름',
    statusStep: (up, n) => `신분 ${['', '한', '두', '세', '네'][n] || n} 계단 ${up ? '위' : '아래'}`, aLittle: '조금',
    healthWords: ['위태로움', '허약함', '보통', '튼튼함', '아주 튼튼함'], heartWords: ['지쳐 있음', '울적함', '담담함', '즐거움', '아주 즐거움'],
    agoWords: ['올해', '지난해', '두 해 전', '세 해 전'],
    sickDown: (when, title) => `${when} 「${title}」 뒤 몸이 축남`, sickUp: (when, title) => `${when} 「${title}」 뒤 기운을 되찾음`,
    goingRound: (d) => `${d}${josa(d, '이')} 도는 중`, sickHard: (when) => `${when} 몸이 많이 축남`, endemicLand: (d) => `${d}${josa(d, '이')} 도는 고장`,
    kidsWord: (n) => `아이 ${['없음', '하나', '둘', '셋', '넷', '다섯', '여섯', '일곱', '여덟', '아홉', '열'][n] || n + '명'}`,
    partnerX: '짝 있음', aloneX: '혼자 지냄', kinBaby: '엄마 품',
    neighborWords: ['이웃과 서먹함', '이웃과 데면데면', '이웃과 두루 지냄', '이웃 품앗이에 늘 불려 감'],
    windTitle: '시대의 바람', windHint: '누르면 이 해 세상 형편을 펼쳐요',
    windRisk: (now, usual) => `올해 죽을 확률 약 ${now} (평소 ${usual})`, under1: '1% 미만', windRiskUp: '죽을 위험이 커짐', windShut: (mk) => `${mk}${josa(mk, '이')} 닫힘`, windHunger: '먹을 것이 모자람',
    warLevel: ['평화로운 편', '국경 다툼', '전쟁 중', '땅이 전장'],
    windPriceJump: '곡식값이 뜀', windPriceUp: '물가가 오름', windPriceDown: '물가가 내림', windWageUp: '품삯이 오름', windWageDown: '품삯이 내림',
    windCommon: (d) => `${d}${josa(d, '이')} 흔함`, windTech: (x) => `${x}의 시대`,
    calm: { harvest: '{crop:을} 거두는 철', market: '{market}에 가는 날', feast: '{feast:을} 기다리는 철', beast: '{beast} 떼를 따라가는 철', school: '{school}에 아이를 보내는 아침' },
    ctxNow: '올해의 일', ctxWar: '전쟁', ctxDisease: '질병·의술', ctxTech: '기술', ctxEcon: '경제', ctxStatus: '신분제', ctxLearn: '배움',
    ctxDz: (list, med) => `${list}${josa(list, '이')} 흔함 — 의술은 ${med}`, ctxNoDz: '크게 도는 병 없음', ctxEconX: (p, w) => `물가 ×${p} · 품삯 ×${w}`, ctxEconSame: '물가·품삯 여느 해와 같음',
    ctxYou: (s, bound) => `당신은 ${s}${bound ? ' (묶임)' : ''}`, ctxLit: (p) => (p < 1 ? '글 아는 사람 거의 없음' : `글 아는 사람 약 ${p}%`),
    windClose: '닫기',
    chanceX: (p) => `운에 맡김 ${p}%`, ifWin: '잘되면', ifLose: '안되면',
    lockRead: '글을 알아야 해요', lockKnow: (n) => `지식이 ${n}은 넘어야 해요`, lockKnowMax: '이미 너무 많이 알아요', lockBound: '묶인 몸이라 고를 수 없어요', lockFree: '매인 몸만 고를 수 있는 길이에요',
    lockStatusMin: '신분이 더 높아야 해요', lockStatusMax: '신분이 높아 어울리지 않아요', lockWar: '전쟁 중에만 열리는 길이에요', lockAge: '아직 어려요', lockOld: '이제는 나이가 많아요', lockOther: '지금은 고를 수 없어요',
    // 사망 기록: 「그 시대 이 땅 사람들의 흔한 마지막」 (통계 비교 줄 대신, 설계 5.3)
    commonTitle: '그 시대의 흔한 마지막',
    endPre: (place, dz) => `그 시대 ${place}에서는 아이 때 열병과 배앓이로 떠나는 사람이 많았고, 어른이 되어서도 ${dz}${josa(dz, '이')} 흔한 끝이었어요.`,
    endPreNow: (place, dz) => `지금 ${place}에서는 아이 때 열병과 배앓이로 떠나는 사람이 많고, 어른이 되어서도 ${dz}${josa(dz, '이')} 흔한 끝이에요.`,
    endModern: (place) => `그 시대 ${place} 사람들은 대개 늙어서 심장병이나 암으로 생을 마쳤어요.`,
    endModernNow: (place) => `지금 ${place} 사람들은 대개 늙어서 심장병이나 암으로 생을 마쳐요.`,
    endEpidemic: (e) => `그해에는 ${e}${josa(e, '이')} 돌았어요.`, endWar: '싸움에 나가 돌아오지 못한 사람도 많았어요.',
    endMed: [() => '병이 나면 주술과 약초에 기댔어요.', () => '병이 나면 오래 내려온 경험에 기댔어요.', (h) => `${h}${josa(h, '이')} 있었지만 열병 앞에서는 손쓸 길이 적었어요.`,
      () => '종두가 천연두를 막기 시작했어요.', () => '소독과 세균설이 병의 길을 바꾸고 있었어요.', () => '항생제와 예방주사가 어린 목숨을 지켰어요.'],
    endMedNow: '항생제와 예방주사가 어린 목숨을 지켜요.',
  },
  en: {
    title: "One Soul's Journey", oneIn: 'One in 117 billion',
    subtitle: 'Be born as one of the roughly 117 billion people who have ever lived, and live one life. Time flows on its own; at the big moments, you choose. Next time, the same soul is born again in a later age.',
    born: 'Be born', next: (n) => `Next life (life ${n} of this soul)`, lineage: 'Soul lineage', dex: (n) => `Past-life atlas (${n} cells)`,
    newSoul: 'New soul', newSoulSure: 'Really start over? This journey will be erased', lang: '한국어', soundOn: 'Sound on', soundOff: 'Sound off',
    credit: 'Data: PRB 2022 · OWID (HYDE, UN, Riley) · Volk & Atkinson 2013 · 3D: KayKit (CC0). Household shares and event risks are game estimates.',
    everBorn: 'people ever born', age: (a) => `age ${a}`, unit: 'yrs',
    birthDoc: 'Record of birth', deathDoc: 'Record of death', start: 'Begin this life',
    f_era: 'Age', f_year: 'Year', f_place: 'Land', f_home: 'Household', f_child: 'Child', f_e0: 'Life expectancy here, then', f_u5: 'Chance of dying before five', f_births: 'Babies born that year',
    childOf: (o, sex) => `${ORD.en[o - 1]} ${sex === 'f' ? 'daughter' : 'son'}`,
    peersTitle: 'Born the same year', peersHint: 'Their lives follow the same statistics to the end.', lastWords: 'Words left by your past life',
    pause: 'Pause', resume: 'Play', skip: 'Next decision »', auto: 'Auto-decide', exit: 'Leave',
    focusTitle: "This year's focus", focusAuto: 'Let it be', focusBaby: 'From age six you can choose where each year goes. Feel free to speed through babyhood.',
    focusHint: 'Change it any time. If you do not choose, the most urgent need decides.',
    journal: 'Life record', statsTitle: 'Status', mapTitle: 'Life map', mapHint: 'One cell = one year · darker = happier · outlined = life expectancy here, then',
    stats: { health: 'Health', wealth: 'Wealth', family: 'Family', happy: 'Joy' },
    stage: { baby: 'baby', child: 'childhood', teen: 'youth', adult: 'adult', middle: 'middle age', old: 'old age' },
    deadAt: (a, c) => `died at ${a} · ${c}`, male: 'M', female: 'F',
    decision: 'A big decision', luck: 'Up to luck', autoIn: (s) => `Going with “${s}” in a moment · tap to stop`, autoOn: 'Let decisions be made automatically from now on',
    lastYear: (a) => `The last year, age ${a}`, diedIn: (place) => `You drew your last breath in ${place}.`, tapNext: 'Tap to continue',
    cause: 'Cause', outlived: (p) => `About ${p}% of people born here that year lived longer than you.`,
    happiest: 'Happiest year', topFocus: 'Where most years went', partner: 'A partner', kids: 'Children', partnerYes: 'Yes', partnerNo: 'No', kidsN: (n) => `${n}`,
    gained: 'Traces carried to the next life', noneGained: 'You left lightly, with no traces',
    peersOut: (n) => `Of the four born the same year, ${n} lived longer than you.`,
    survTitle: 'Survival curve', survHint: 'How long people born here that year stayed alive (gold dot: you)',
    toLife: 'Words for this life (kept in the lineage and the next life)', toLifeEnd: 'Words for this life (kept in the lineage)', toLifePh: 'One line is enough',
    nextBtn: 'Next life', toLineage: 'See the lineage', share: 'Share', toTitle: 'Back to start', epilogue: 'And now, you were born as you.',
    lineageTitle: "One Soul's Journey", livesCount: (n) => `${n} ${n === 1 ? 'life' : 'lives'}`, dexTitle: 'Past-life atlas', dexHint: 'Ages and regions you have lived in', practice: 'Practice (seed)',
    nth: (n) => `Life ${n} of this soul`, trace: 'Trace of a past life', seed: 'Seed',
    wander: (g) => (g <= 1 ? 'The soul was born again at once.' : `The soul wandered for ${g.toLocaleString('en-US')} years before being born again.`),
    copyText: 'Copy as text', copied: 'Copied', copyFail: 'Copying is blocked here. Long-press the text to copy it.', imageHint: 'Long-press the image to save it', close: 'Close',
    noVillage: "This device can't draw the 3D village, so the story goes on in text.",
    stageWarn: 'Some of the village art could not load — the story goes on.',
    presentDoc: 'A life still going on', presentTitle: (y, a) => `${y}, age ${a}`, presentLine: 'This life is still going on.', now: 'now', partnerNow: 'Yes',
    reached: (p) => `About ${p}% of people born here that year live to this age.`, peersAlive: (n) => (n ? `Of the four born the same year, ${n} are also alive today.` : 'All four born the same year are gone now.'),
    aliveNow: (a) => `alive today, ${a}`, epiloguePresent: 'This life is still going on. Same year, same sky — and so are you.',
    stuck: 'The game got stuck. Try reloading; if that does not help, clear the save and start fresh.', reload: 'Reload', wipe: 'Clear the save and start fresh',
    // Screen rework (2026-10-20): bead thread, card hand, the flame
    lifeN: (n) => `Life ${n}`, practiceBadge: 'Practice', birthSky: 'One of 117 billion births',
    birthAgain: (g) => (!(g > 1) ? 'Straight back, again' : `${g.toLocaleString('en-US')} years later, again`),
    placeTitle: 'Where you begin', tokE0: 'Typical lifespan', tokU5: 'Past five', carried: 'Carried from before',
    statX: { health: 'Body', wealth: 'Means', family: 'Kin', happy: 'Heart' },
    speedName: { slow: 'Slow', normal: 'Normal', fast: 'Fast', fastest: 'Fastest' }, sundial: 'Sundial',
    skipX: 'To the next crossroads ›', autoX: 'Let the soul choose', more: 'More',
    handTitle: "This year's card", handBaby: 'Too young to hold a card yet.', handHint: 'Change it any time. If you don’t, the most urgent card is played for you.', handAuto: 'Auto',
    scrollTitle: 'The scroll', scrollOpen: 'Open', scrollClose: 'Close',
    strandTitle: 'Bead thread', strandAria: (n, best) => `${n} beads, brightest at ${best}`, peersX: 'Born with you',
    crossTitle: (title) => `Crossroads · ${title}`, crossAuto: (s) => `Taking “${s}” in a moment · tap to stop`, luckX: 'Up to luck',
    campTitle: (a) => `Campfire at ${a}`, campHint: 'Pick one and it is strung as a big bead on your thread and the soul’s beads',
    campEchoHint: 'Pick the blue bead and the trace of your past life grows stronger', campAuto: (s) => `“${s}” will be strung in a moment · tap to stop`,
    memBead: 'Memory bead', echoBead: 'Echo of a past life', rosaryAria: (n, m) => `The soul’s beads · ${n} ${n === 1 ? 'life' : 'lives'} · ${m} memory ${m === 1 ? 'bead' : 'beads'}`,
    traceDeepened: (name) => `A trace of your past life grew stronger · ${name}`, traceLevel: (n) => `strength ${n}/3`,
    flameTitle: 'The flame leaves', flameLine: (a, cause) => `${a} · ${cause}`,
    knotTitle: 'The knot', untiedTitle: 'An untied thread', brightest: 'Brightest bead', whyEnded: 'Why it ended', stillGoing: 'Still going',
    hundredTitle: 'A hundred threads', hundredCap: (n) => `Outlived ${n} of a hundred`, hundredCapNow: (n) => `${n} of a hundred live this long`,
    gainedX: 'Traces gained', noteNext: 'A note to the next life', noteEnd: 'A note (kept on the beads)',
    toBeads: "See the soul's beads", beadsTitle: "The soul's beads", beadsSoFar: 'Beads so far', journeyOn: 'The journey goes on.',
    keepLiving: 'Keep living', settings: 'Settings',
    // Sim 2.0: the numbers board · winds of the age · concrete effects
    statN: { health: 'Health', wealth: 'Wealth', family: 'Kin', happy: 'Heart' },
    attrN: { charm: 'Charm', luck: 'Luck', know: 'Knowledge', skill: 'Skill' },
    boardTitle: 'Your numbers', attrsTitle: 'Abilities', statusX: 'Status', boundX: 'bound',
    boundHint: 'Tied to the land or a master: leaving or changing work is hard', literate: 'can read', illiterate: "can't read",
    statusStep: (up, n) => `Status ${up ? 'up' : 'down'} ${n === 1 ? 'a rung' : `${['', 'one', 'two', 'three', 'four'][n] || n} rungs`}`, aLittle: 'a little',
    healthWords: ['in danger', 'frail', 'fair', 'strong', 'very strong'], heartWords: ['worn out', 'low', 'steady', 'cheerful', 'glowing'],
    agoWords: ['this year', 'last year', 'two years ago', 'three years ago'],
    sickDown: (when, title) => `worn down after “${title}” ${when}`, sickUp: (when, title) => `back on your feet after “${title}” ${when}`,
    goingRound: (d) => `${d} going round`, sickHard: (when) => `badly worn down ${when}`, endemicLand: (d) => `${d} country`,
    kidsWord: (n) => (n ? `${n} ${n === 1 ? 'child' : 'children'}` : 'no children'),
    partnerX: 'partnered', aloneX: 'on your own', kinBaby: "in mother's arms",
    neighborWords: ['awkward with the neighbors', 'polite with the neighbors', 'on good terms with the neighbors', 'always asked to lend a hand'],
    windTitle: 'Winds of the age', windHint: 'Tap for how the world stands this year',
    windRisk: (now, usual) => `about ${now} chance of dying this year (usually ${usual})`, under1: 'under 1%', windRiskUp: 'risk of dying is up', windShut: (mk) => `the ${mk} is shut`, windHunger: 'food is short',
    warLevel: ['mostly at peace', 'border skirmishes', 'at war', 'the land is a battlefield'],
    windPriceJump: 'grain prices soar', windPriceUp: 'prices are up', windPriceDown: 'prices are down', windWageUp: 'wages are up', windWageDown: 'wages are down',
    windCommon: (d) => `common sickness: ${d}`, windTech: (x) => `known here: ${x}`,
    calm: { harvest: 'the {crop} harvest', market: 'a day at the {market}', feast: 'waiting for {feast}', beast: 'following the {beast}', school: 'off to the {school} in the morning' },
    ctxNow: 'This year', ctxWar: 'War', ctxDisease: 'Disease & medicine', ctxTech: 'Technology', ctxEcon: 'Economy', ctxStatus: 'Social order', ctxLearn: 'Learning',
    ctxDz: (list, med) => `common: ${list} — medicine: ${med}`, ctxNoDz: 'no great sickness going round', ctxEconX: (p, w) => `prices ×${p} · wages ×${w}`, ctxEconSame: 'prices and wages as usual',
    ctxYou: (s, bound) => `you: ${s}${bound ? ' (bound)' : ''}`, ctxLit: (p) => (p < 1 ? 'almost no one can read' : `about ${p}% can read`),
    windClose: 'Close',
    chanceX: (p) => `Up to luck ${p}%`, ifWin: 'If it works', ifLose: 'If not',
    lockRead: 'You need to be able to read', lockKnow: (n) => `Needs knowledge over ${n}`, lockKnowMax: 'You already know too much for this', lockBound: "You're bound — this path is closed", lockFree: 'Only for those who are bound',
    lockStatusMin: 'Needs a higher station', lockStatusMax: 'Beneath your station', lockWar: 'Only opens in wartime', lockAge: 'You are too young', lockOld: 'You are too old now', lockOther: 'Not open to you now',
    commonTitle: 'How lives usually ended',
    endPre: (place, dz) => `In ${place} back then, many died as children of fever and stomach sickness, and grown-ups most often ended with ${dz}.`,
    endPreNow: (place, dz) => `In ${place} today, many die as children of fever and stomach sickness, and grown-ups most often end with ${dz}.`,
    endModern: (place) => `In ${place} at that time, most people grew old and died of heart disease or cancer.`,
    endModernNow: (place) => `In ${place} today, most people grow old and die of heart disease or cancer.`,
    endEpidemic: (e) => `That year, ${e.replace(/^The /, 'the ')} was going round.`, endWar: 'Many went off to fight and never came back.',
    endMed: [() => 'Medicine meant charms and herbs.', () => 'Medicine meant what the old folk knew.', (h) => `There was ${/^[aeiou]/i.test(h) ? 'an' : 'a'} ${h}, but against a fever there was little to be done.`,
      () => 'Vaccination was beginning to hold smallpox back.', () => 'Germ theory and clean hands were changing the odds.', () => 'Antibiotics and vaccines kept the young alive.'],
    endMedNow: 'Antibiotics and vaccines keep the young alive.',
  },
};
export const t = (lang, key, ...a) => { const v = STR[lang][key]; return typeof v === 'function' ? v(...a) : v; };

export function birthLine(b, lang) {
  const h = householdOf(b.group, b.household), a = AREAS[b.area];
  if (lang === 'ko') return `${fmtYear(b.year, 'ko')} · ${a.ko} · ${h.ko} ${STR.ko.childOf(b.order, b.sex)}`;
  return `${fmtYear(b.year, 'en')} · ${a.en} · the ${STR.en.childOf(b.order, b.sex)} of ${h.en}`;
}
export const fill = (text, b, lang) => text.replaceAll('{place}', AREAS[b.area].short[lang]);
// 카드·줄·기억 글을 화면에 쓸 때: {place} → 땅 이름, 그다음 {crop}·{coin:을} 같은 자리 → 그 생의 맥락 낱말 (tokens.js fillTokens, 설계 4.1).
// { 가 없는 글은 그대로 (빠른 길). ctx 가 없거나 모르는 자리면 fillTokens 가 그 낱말을 빼고 이어 쓴다 — 날것의 { } 는 내보내지 않는다
export function renderText(text, ctx, b, lang) {
  if (text == null) return '';
  let s = String(text);
  if (!s.includes('{')) return s;
  if (b && AREAS[b.area]) s = fill(s, b, lang);
  return s.includes('{') ? fillTokens(s, ctx, lang).replace(/[{}]/g, '') : s;
}

// ── 시뮬 2.0: 구체적인 효과 (sim2 설계 2.4·5.2) ──
// 영어 홑꼴 바로잡기 (holdings.js 의 one() 이 못 잡는 라틴·북유럽 복수: 1 denarii → 1 denarius). n = 1 일 때만
const ONE_FIX = { denarii: 'denarius', scudi: 'scudo', lire: 'lira', kronor: 'krona', reale: 'real', sole: 'sol', 'réi': 'real', reai: 'real', iugera: 'iugerum',
  'note of banknotes': 'banknote', 'knife money': 'piece of knife money', hacksilver: 'piece of hacksilver' };
const ONE_RE = new RegExp(`(^|[^\\d,.])1 (${Object.keys(ONE_FIX).join('|')})(?![\\p{L}])`, 'gu');
export const fixOne = (s) => String(s).replace(ONE_RE, (m, pre, w) => `${pre}1 ${ONE_FIX[w]}`);
// 살림 한 줄 (holdings.holdingsText + 영어 홑꼴)
export const holdingsLine = (list, lang) => (lang === 'en' ? fixOne(holdingsText(list, 'en')) : holdingsText(list, lang));

// 효과 → 화면 조각 [{ key, sign, text }]: 재산은 그 땅 돈(「은화 +5닢」), 나머지는 「건강 +2」 · 「친화력 +2」 · 「신분 한 단계 위」.
// 소수는 반올림하고 0(반올림해 0 포함)은 뺀다. 얻는 것을 먼저, 잃는 것을 뒤에 (같은 쪽 안에서는 EFFECT_KEYS 차례)
// → [{ key, sign, text, full }]: text 는 카드·칩에 쓰는 짧은 글, full 은 툴팁·읽어 주기용 온전한 글. 영어 재산만 둘이 다르다
//    (「+3 pfennigs of silver pennies」 → 칩은 「+3 pfennigs」, 홑·겹꼴은 holdings 글 그대로). 능력치가 0.5 미만 오르면 「지식 +조금」
export const EFFECT_KEYS = ['health', 'wealth', 'family', 'happy', 'charm', 'luck', 'know', 'skill', 'status'];
const ATTR_KEY = new Set(['charm', 'luck', 'know', 'skill']);
export function effectParts(effects, ctx, lang, household = null) {
  const S = STR[lang] || STR.en, parts = [];
  for (const key of EFFECT_KEYS) {
    const v = Number(effects && effects[key]) || 0;
    if (!v) continue;
    const sign = v > 0 ? '+' : MINUS, n = Math.round(Math.abs(v));
    let text = '';
    if (key === 'wealth' && ctx) text = wealthText(v, ctx, lang, household).replace('−', MINUS);
    else if (!n && ATTR_KEY.has(key) && v > 0) text = `${S.attrN[key]} +${S.aLittle}`;
    else if (!n) continue;
    else if (key === 'status') text = S.statusStep(v > 0, n);
    else text = `${S.statN[key] || S.attrN[key]} ${sign}${n}`;
    if (!text) continue;
    const full = lang === 'en' ? fixOne(text) : text;
    parts.push({ key, sign, text: lang === 'en' && key === 'wealth' ? full.replace(/ of .+$/, '') : full, full });
  }
  return [...parts.filter((p) => p.sign === '+'), ...parts.filter((p) => p.sign !== '+')];
}
export const effectText = (effects, ctx, lang, household = null) => effectParts(effects, ctx, lang, household).map((p) => p.full).join(' · ');

// 수치의 상태 낱말 (설계 2.1): 80↑ · 60↑ · 40↑ · 25↑ · 그 밑
const band5 = (v) => (v >= 80 ? 4 : v >= 60 ? 3 : v >= 40 ? 2 : v >= 25 ? 1 : 0);
export const healthWord = (v, lang) => STR[lang].healthWords[band5(v)];
export const heartWord = (v, lang) => STR[lang].heartWords[band5(v)];

// 건강 줄의 「지금 앓는 것」 (설계 2.1 「최근 사건·카드의 병 이름」): 지난 세 해 안의 인생 기록에서 가장 최근 것.
//   병·부상 표지가 있는 갈림길에서 건강이 3 이상 오르내렸으면(실제로 고른 길·운의 결과) 그 카드 제목을 인용한다:
//     「지난해 「앓아누운 날들」 뒤 몸이 축남」 · 「… 뒤 기운을 되찾음」. 제목은 그 줄이 적힌 해의 맥락으로 채운다
//   표지 (illness): 카드 ill: true · 선택지 risk 'plague' 나 skill 'heal' · 유행병 사건 카드 · 아래 ILL_CARDS
//   표지 (hurt, 내려갈 때만): 다치는 카드 HURT_CARDS · 굶주림 사건 카드
//   표지가 없는 카드는 제목 없이, 6 이상 내려갔을 때만 「지난해 몸이 많이 축남」 (물레방아·텔레비전 같은 제목을 끌어오지 않는다)
//   아직 이어지는 유행병 사건 → 「흑사병이 도는 중」. 아무것도 없고 몸이 허약하면(40 밑) 그 땅의 풍토병 「학질이 도는 고장」. 그 밖에는 ''
// 카드 파일에 ill 표지가 붙기 전까지 쓰는 아이디 목록 (작업 7·8 에서 카드의 ill: true 로 옮긴다)
const ILL_CARDS = new Set(['u.baby.fever', 'u.teen.sick', 'u.middle.ache', 'e.early.adult.pox', 'e.ind.middle.doctor', 't.fear.plague', 'e.for.middle.leg']);
const HURT_CARDS = new Set(['h.sea.storm', 'h.hunt.first', 't.fear.fire', 't.fear.heights', 't.fear.beast']);
const EV = new Map(EVENTS.map((e) => [e.id, e]));
function illTag(card) {
  if (card.ill || ILL_CARDS.has(card.id) || card.choices.some((x) => x.risk === 'plague' || x.skill === 'heal')) return 'ill';
  const e = card.event && EV.get(card.event);
  if (e && (e.kind === 'epidemic' || e.cause === 'plague')) return 'ill';
  if (HURT_CARDS.has(card.id) || (e && e.cause === 'hunger')) return 'hurt';
  return null;
}
export function ailmentLine(life, deck, lang) {
  const S = STR[lang], byId = deck instanceof Map ? deck : new Map((deck || []).map((c) => [c.id, c])), b = life.birth;
  for (let i = life.journal.length - 1; i >= 0; i--) {
    const j = life.journal[i], ago = life.age - j.age;
    if (ago > 3) break;
    if (j.kind === 'decision') {
      const card = byId.get(j.card), c = card && card.choices[j.choice];
      if (!c) continue;
      const log = (life.log || []).find((l) => l.card === j.card && l.age === j.age);
      let h = (c.effects && c.effects.health) || 0;
      if (c.chance) h += ((((log && log.ok) ? c.chance.win : c.chance.lose) || {}).effects || {}).health || 0;
      const tag = illTag(card);
      if (tag && (h <= -3 || (h >= 3 && tag === 'ill'))) {
        const title = renderText(card.title[lang], contextOf(Number.isFinite(j.year) ? j.year : b.year + j.age, b.area, b.household), b, lang);
        return (h < 0 ? S.sickDown : S.sickUp)(S.agoWords[ago], title);
      }
      if (!tag && h <= -6) return S.sickHard(S.agoWords[ago]);
    } else if (j.kind === 'event' && j.event) {
      const e = EV.get(j.event);
      if (e && e.kind === 'epidemic' && e.hazard > 0 && life.year <= e.to) {
        const d = e.disease && e.disease[0] && DISEASES[e.disease[0]];
        return S.goingRound(d ? d[lang] : e[lang]);
      }
    }
  }
  const ctx = life.ctx ? life.ctx() : null;
  if (ctx && life.stats && life.stats.health < 40) {
    const d = ctx.disease.endemic.map((id) => DISEASES[id]).filter(Boolean)[0];
    if (d) return S.endemicLand(d[lang]);
  }
  return '';
}

// 곁 줄: 짝·아이 수와 이웃 한 줄 (이웃은 친화력으로). 어린 아이는 「둘째 딸」
export function kinLine(life, lang) {
  const S = STR[lang], b = life.birth, charm = life.attrs ? life.attrs.charm : 50;
  const nb = S.neighborWords[charm >= 75 ? 3 : charm >= 55 ? 2 : charm >= 35 ? 1 : 0];
  if (life.age < 3) return `${S.childOf(b.order, b.sex)} · ${S.kinBaby}`;
  const parts = [];
  if (life.flags && life.flags.married) parts.push(S.partnerX, S.kidsWord(life.kids || 0));
  else if (life.age < 16) parts.push(S.childOf(b.order, b.sex));
  else { parts.push(S.aloneX); if (life.kids) parts.push(S.kidsWord(life.kids)); }
  return [...parts, nb].join(' · ');
}

// 잠긴 선택지의 까닭 (choice.when 가운데 맞지 않는 첫 조건). life 의 능력치·신분·나이로 본다
export function lockReason(when, life, lang) {
  const S = STR[lang], w = when || {}, a = life.attrs || {}, st = life.status || {}, ctx = life.ctx ? life.ctx() : null;
  if (w.minKnow != null && !(a.know >= w.minKnow)) return w.minKnow >= 60 ? S.lockRead : S.lockKnow(w.minKnow);
  if (w.maxKnow != null && !(a.know <= w.maxKnow)) return S.lockKnowMax;
  if (w.bound === false && st.bound) return S.lockBound;
  if (w.bound === true && !st.bound) return S.lockFree;
  if (w.minStatus != null && !(st.rank >= w.minStatus)) return S.lockStatusMin;
  if (w.maxStatus != null && !(st.rank <= w.maxStatus)) return S.lockStatusMax;
  if (w.war != null && !(ctx && ctx.war.level >= w.war)) return S.lockWar;
  if (w.minAge != null && life.age < w.minAge) return S.lockAge;
  if (w.maxAge != null && life.age > w.maxAge) return S.lockOld;
  return S.lockOther;
}

// ── 시대의 바람 띠 (설계 3.3): eraWind(ctx, lang, { year, area, base }) → { head, sub, calm } ──
//   head: 「1347년 · 브리튼 · 흑사병」 — 그해 가장 센 사건(위험률 → 종류 차례), 없으면 전쟁(수준 2 이상), 그것도 없으면 그 땅·시대의 평소 모습
//   sub : 수치 영향 — 「올해 죽을 확률 약 10% (평소 1%) · 장터가 닫힘 · 품삯이 오름」.
//         base 는 그 사람의 올해 바탕 위험률(생명표 × 건강 배율, life.js 죽음 굴림과 같은 항). 평소 = 1 − e^(−base), 올해 = 1 − e^(−(base + 사건 위험률)).
//         1% 밑은 「1% 미만」. 둘이 같게 보이면 쓰지 않는다. base 가 없으면 「죽을 위험이 커짐」. 사건이 없는 해는 전쟁 수준 · 흔한 병 · 그 시대 물건
const KIND_RANK = { epidemic: 0, war: 1, famine: 2, institution: 3, trade: 4, tech: 5 };
export function windEvents(ctx) {
  return ((ctx && ctx.events) || []).map((id) => EV.get(id)).filter(Boolean)
    .sort((a, b) => (b.hazard || 0) - (a.hazard || 0) || (KIND_RANK[a.kind] ?? 9) - (KIND_RANK[b.kind] ?? 9));
}
// 병 차례: 그해 사건이 몰고 온 유행병 먼저, 그다음 풍토병
const dzOrder = (ctx) => [...new Set([...windEvents(ctx).flatMap((e) => [].concat(e.disease || [])), ...ctx.disease.endemic])].filter((id) => ctx.disease.endemic.includes(id) || DISEASES[id]);
export const pctText = (p, lang) => (p < 0.01 ? STR[lang].under1 : `${Math.round(p * 100)}%`);
const xText = (x) => String(Math.round(x * 100) / 100);
function calmLine(ctx, lang, year) {
  const C = STR[lang].calm;
  const list = ctx.group === 'forager' ? [C.beast, C.feast, C.market] : ctx.group === 'modern' ? [C.market, C.feast, C.school] : [C.harvest, C.market, C.feast];
  const y = Number.isFinite(year) ? Math.floor(year) : 0;
  return fillTokens(list[((y % list.length) + list.length) % list.length], ctx, lang);   // 조사·영어 관사는 tokens.js 가
}
export function eraWind(ctx, lang, { year, area, base = null } = {}) {
  const S = STR[lang], evs = windEvents(ctx), top = evs[0], lv = ctx.war.level;
  const place = AREAS[area] ? AREAS[area].short[lang] : '';
  const main = top ? top[lang] : lv >= 2 ? ctx.war.name[lang] : calmLine(ctx, lang, year);
  const head = [Number.isFinite(year) ? fmtYear(year, lang) : '', place, main].filter(Boolean).join(' · ');
  const sub = [], extra = evs.reduce((t, e) => t + (e.hazard > 0 ? e.hazard : 0), 0);
  if (extra > 0) {
    if (base > 0) {
      const now = pctText(1 - Math.exp(-(base + extra)), lang), usual = pctText(1 - Math.exp(-base), lang);
      if (now !== usual) sub.push(S.windRisk(now, usual));
    } else sub.push(S.windRiskUp);
  }
  if (evs.some((e) => e.kind === 'epidemic' && e.hazard > 0)) sub.push(S.windShut(ctx.words.market[lang]));
  if (evs.some((e) => e.kind === 'famine')) sub.push(S.windHunger);
  if (lv >= 2) sub.push(S.warLevel[lv]);   // 전쟁 중 · 땅이 전장 은 앞에, 국경 다툼은 값·품삯 뒤에
  const { price, wage } = ctx.econ;
  if (price >= 1.45) sub.push(S.windPriceJump); else if (price >= 1.1) sub.push(S.windPriceUp); else if (price <= 0.9) sub.push(S.windPriceDown);
  if (wage >= 1.1) sub.push(S.windWageUp); else if (wage <= 0.9) sub.push(S.windWageDown);
  if (lv === 1) sub.push(S.warLevel[1]);
  if (sub.length < 2) {   // 조용한 해: 평화 · 흔한 병 · 그 시대 물건으로 채운다
    if (!lv) sub.push(S.warLevel[0]);
    const dz = dzOrder(ctx).map((id) => DISEASES[id]).filter(Boolean)[0];
    if (dz) sub.push(S.windCommon(dz[lang]));
    const item = ctx.tech.items && ctx.tech.items[0];
    if (item && sub.length < 3) sub.push(S.windTech(item[lang]));
  }
  return { head, sub: sub.slice(0, 4).join(' · '), calm: extra <= 0 && lv < 2 };   // calm: 위험한 사건도 큰 전쟁도 없는 해 (금 밀랍)
}

// 띠를 누르면 펼치는 그해 맥락 카드: [{ key, label, text }] — 올해의 일 · 전쟁 · 질병·의술 · 기술 · 경제 · 신분제 · 배움
export function eraCard(ctx, lang, { status = null } = {}) {
  const S = STR[lang], rows = [], evs = windEvents(ctx), lv = ctx.war.level;
  if (evs.length) rows.push(['now', S.ctxNow, evs.slice(0, 3).map((e) => e[lang]).join(' · ')]);
  const wname = ctx.war.name[lang], lword = S.warLevel[lv];
  rows.push(['war', S.ctxWar, wname === WAR_NAMES[lv][lang] || wname === lword ? lword : `${wname} · ${lword}`]);
  const dz = dzOrder(ctx).map((id) => DISEASES[id]).filter(Boolean).slice(0, 4).map((d) => d[lang]);
  const med = MEDICINE_NAMES[ctx.disease.medicine] ? MEDICINE_NAMES[ctx.disease.medicine][lang] : '';
  rows.push(['disease', S.ctxDisease, dz.length ? S.ctxDz(dz.join(' · '), med) : `${S.ctxNoDz} — ${med}`]);
  rows.push(['tech', S.ctxTech, (ctx.tech.items || []).map((x) => x[lang]).join(' · ')]);
  const { price, wage } = ctx.econ;
  rows.push(['econ', S.ctxEcon, price === 1 && wage === 1 ? S.ctxEconSame : S.ctxEconX(xText(price), xText(wage))]);
  const sys = ctx.status.system ? ctx.status.system[lang] : '';
  rows.push(['status', S.ctxStatus, [sys, status ? S.ctxYou(status[lang], status.bound) : ''].filter(Boolean).join(' · ')]);
  rows.push(['learn', S.ctxLearn, `${ctx.words.school[lang]} · ${S.ctxLit(Math.round(ctx.literacy * 100))}`]);
  return rows.map(([key, label, text]) => ({ key, label, text }));
}

// 사망 기록의 「그 시대 이 땅 사람들의 흔한 마지막」 한 줄 (설계 5.3: 「…%가 당신보다 오래」 비교 대신).
// ctx 는 그 생이 끝난 해의 맥락. 흔한 사인(현대 전: 아이 때 열병·배앓이 + 그 땅 풍토병, 현대: 늙어서 심장병·암) + 한 문장 (그해 유행병 > 전쟁 > 의술)
export function commonEnd(ctx, lang, { area, present = false, cause = null } = {}) {
  const S = STR[lang], place = AREAS[area] ? AREAS[area].short[lang] : '';
  if (ctx.group === 'modern') return `${(present ? S.endModernNow : S.endModern)(place)} ${present ? S.endMedNow : S.endMed[5]()}`.trim();
  const names = ctx.disease.endemic.map((id) => DISEASES[id]).filter(Boolean).slice(0, 2).map((d) => d[lang]);
  const dz = names.length ? names.join(lang === 'ko' ? (josa(names[0], '이나') === '이나' ? '이나 ' : '나 ') : ' or ') : (lang === 'ko' ? '폐병' : 'lung disease');
  const first = (present ? S.endPreNow : S.endPre)(place, dz);
  const ep = windEvents(ctx).find((e) => e.kind === 'epidemic' && e.hazard > 0);
  const m = Math.max(0, Math.min(4, ctx.disease.medicine));
  const second = ep ? S.endEpidemic(ep[lang]) : ctx.war.level >= 2 || cause === 'war' ? S.endWar : S.endMed[m](ctx.words.healer[lang]);
  return `${first} ${second}`;
}
export function traceText(tr, lang) {
  const i = lang === 'ko' ? 0 : 1;
  const s = `${KIND_TEXT[tr.kind][i]} · ${TRACE_TEXT[tr.kind][tr.key][i]}`;
  return tr.who ? `${s} (${tr.who[lang]})` : s;
}
// 흔적 이름만 (「손재주」, 'clever hands'). key 는 traceKey 꼴 'talent:craft'
export function traceName(key, lang) {
  const [kind, k] = String(key || '').split(':'), row = TRACE_TEXT[kind] && TRACE_TEXT[kind][k];
  return row ? row[lang === 'ko' ? 0 : 1] : '';
}
export const deathLine = (d, lang) => CAUSES[d.cause][lang][d.line % 2];
// 생의 길이 「1987년 – 2064년」, 지금까지 살아 멈춘 생은 「1987년 – 지금」
export const spanText = (b, d, lang) => `${fmtYear(b.year, lang)} – ${d.present ? STR[lang].now : fmtYear(d.year, lang)}`;
// 족보 한 줄의 끝: 「31살 · 열병」, 지금까지 살아 멈춘 생은 「1987년 – 지금」
export const lifeEnd = (x, lang) => (x.death.present ? spanText(x.birth, x.death, lang) : `${STR[lang].age(x.death.age)} · ${CAUSES[x.death.cause].name[lang]}`);
// 여정 끝 글: 마지막 생이 지금까지 이어지면 「이 생은 지금도 …」
export function epilogueText(soul, lang) {
  const last = soul.lives[soul.lives.length - 1];
  return last && last.death.present ? STR[lang].epiloguePresent : STR[lang].epilogue;
}
export const causeName = (c, lang) => CAUSES[c].name[lang];
export const focusName = (id, age, lang) => FOCUS_NAME[id][focusStage(age)][lang];
// 효과 힌트: 「재산+ 건강−」
export const effectHint = (eff, lang) => Object.entries(eff || {}).filter(([, v]) => v).map(([k, v]) => `${STR[lang].stats[k]}${v > 0 ? '+' : '−'}`).join(' ');
export function choiceHint(c, lang) {
  if (!c.chance) return effectHint(c.effects, lang);
  const h = effectHint(c.chance.win.effects, lang);
  return `${STR[lang].luck}${h ? ' · ' + h : ''}`;
}
export function fmtBig(n, lang) {
  if (lang === 'ko') return n >= 1e8 ? `약 ${(n / 1e8).toFixed(1)}억 명` : n >= 1e4 ? `약 ${Math.round(n / 1e4).toLocaleString('ko-KR')}만 명` : `약 ${Math.round(n).toLocaleString('ko-KR')}명`;
  return n >= 1e6 ? `about ${(n / 1e6).toFixed(1)} million` : n >= 1e3 ? `about ${Math.round(n / 1e3).toLocaleString('en-US')} thousand` : `about ${Math.round(n)}`;
}
export const birthsThatYear = (y) => cumBirths(y + 1) - cumBirths(y);
// 같은 해 태어난 사람 한 줄: age 가 null 이면 출생 기록용
export function peerLine(p, age, lang) {
  const a = AREAS[p.birth.area].short[lang], s = p.birth.sex === 'f' ? STR[lang].female : STR[lang].male;
  if (age == null) return `${a} · ${s} · ${householdOf(p.birth.group, p.birth.household)[lang]}`;
  const st = peerAt(p, age);
  if (st.present) return `${a} · ${s}: ${STR[lang].aliveNow(st.age)}`;
  return `${a} · ${s}: ${st.alive ? STR[lang].stage[st.stage] : STR[lang].deadAt(st.death.age, causeName(st.death.cause, lang))}`;
}
// 받침에 따라 조사
const jong = (w) => { const c = w.charCodeAt(w.length - 1); return c >= 0xac00 && c <= 0xd7a3 ? (c - 0xac00) % 28 : 0; };
const ro = (w) => w + (jong(w) === 0 || jong(w) === 8 ? '로' : '으로');   // ㄹ 받침은 「로」
const iga = (w) => w + (jong(w) ? '이' : '가');
const ieot = (w) => (jong(w) ? '이었어요' : '였어요');   // 「일」이었어요 · 「배우기」였어요
// 기억 구슬 글의 맥락: 그 구슬을 꿴 해 (나이가 없으면 태어난 해). 자리 글({crop} …)을 그 생의 땅·집안 낱말로 채운다
export const memCtx = (b, m) => contextOf(b.year + (m && Number.isInteger(m.age) ? m.age : 0), b.area, b.household);
// 사망 기록의 부고 글. 모닥불에서 꿴 기억 구슬이 있으면 마지막 기억을 끝에서 두 번째 줄에 (epitaphs.js 는 그대로)
export function obituary(life, sum, lang) {
  const b = life.birth, d = life.death, area = AREAS[b.area], h = householdOf(b.group, b.household);
  const talent = Object.entries(life.skills || {}).filter(([, n]) => n >= 3).sort((x, y) => y[1] - x[1])[0];
  const top = Object.entries(life.focusYears || {}).sort((x, y) => y[1] - x[1])[0];
  const mems = (sum && sum.memories) || life.memories || [], last = mems[mems.length - 1];
  const memText = last && last.text && typeof last.text[lang] === 'string' && last.text[lang] ? renderText(last.text[lang], memCtx(b, last), b, lang).replace(/[.。]$/, '') : '';
  const s = [];
  if (lang === 'ko') {
    s.push(`${fmtYear(b.year, 'ko')} ${area.short.ko}의 ${h.ko} ${ro(STR.ko.childOf(b.order, b.sex))} 태어났어요.`);
    if (life.flags.literate) s.push('글을 배웠어요.');
    if (life.flags.moved) s.push('고향을 떠나 살았어요.');
    if (sum.married) s.push(d.present ? '한 사람과 삶을 함께하고 있어요.' : '한 사람과 삶을 함께했어요.');
    if (sum.kids) s.push(d.present ? `아이 ${sum.kids}명을 두었어요.` : `아이 ${sum.kids}명을 키웠어요.`);
    if (top && d.age >= 20) { const f = focusName(top[0], 30, 'ko'); s.push(`한 해를 가장 많이 쓴 곳은 「${f}」${ieot(f)}.`); }
    if (talent) s.push(`${iga(TRACE_TEXT.talent[talent[0]][0])} 남달랐어요.`);
    if (memText) s.push(`모닥불 곁에서 마지막으로 꿴 기억은 이랬어요. 「${memText}」`);
    if (d.present) s.push(`${fmtYear(d.year, 'ko')}, ${d.age}살. 이 생은 지금도 이어지고 있어요.`);
    else s.push(d.age === 0 ? '첫돌을 넘기지 못하고 세상을 떠났어요.' : `${d.age}살에 ${ro(causeName(d.cause, 'ko'))} 세상을 떠났어요.`);
  } else {
    s.push(`Born in ${fmtYear(b.year, 'en')} in ${area.en}, the ${STR.en.childOf(b.order, b.sex)} of ${h.en}.`);
    if (life.flags.literate) s.push('You learned to read.');
    if (life.flags.moved) s.push('You left home.');
    if (sum.married) s.push(d.present ? 'You share your life with someone.' : 'You shared a life with someone.');
    if (sum.kids) s.push(`${d.present ? 'You have' : 'You raised'} ${sum.kids} ${sum.kids === 1 ? 'child' : 'children'}.`);
    if (top && d.age >= 20) s.push(`Most of your years went to “${focusName(top[0], 30, 'en')}”.`);
    if (talent) s.push(`You had ${TRACE_TEXT.talent[talent[0]][1]}.`);
    if (memText) s.push(`The last memory you strung by the fire: “${/[.!?]$/.test(memText) ? memText : memText + '.'}”`);
    if (d.present) s.push(`In ${fmtYear(d.year, 'en')} you are ${d.age}, and this life is still going on.`);
    else s.push(d.age === 0 ? 'You did not reach your first birthday.' : `You died at ${d.age}. Cause: ${causeName(d.cause, 'en')}.`);
  }
  return s.join(' ');
}
