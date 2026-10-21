// 여러 생 훑기 (sim2 작업 8): 영혼마다 생을 이어 자동으로 끝까지 돌리고, 화면에 나오는 글을 한국어·영어로 그려 흠을 찾는다.
//   node tools/sweep.mjs [생 수=2400] [--out 보고서.md] [--seed 접두]
// 그리는 글: 출생 줄 · 갈림길 카드(제목·본문·선택지·결과·효과 조각) · 두루마리 줄(작은 일·사건·곁·첫돌·메아리·지금) · 모닥불 후보 ·
//   시대 띠·맥락 카드 · 곁 줄·병 줄 · 부고 · 묘비 · 죽음 줄 · 흔한 마지막
// 보는 흠 (CHECKS): 남은 중괄호·undefined · 한국어 조사 (맥락 낱말·땅·집안 이름 뒤) · 영어 관사·복수·띄어쓰기 · 글 속 시대 착오 낱말 ·
//   한 생 안의 같은 글 · 나이·성별·집안에 안 맞는 말 · 너무 자주 나오는 카드·줄
// 시험(test/sweep.test.mjs)은 같은 함수를 적은 생 수로 돌려 규칙이 되는 흠이 0 인지 본다.
import { drawBirth } from '../birth.js';
import { createLife, advance, choose, autoChoice, summarize, openChoices, PRESENT } from '../life.js';
import { newSoul, finishLife } from '../soul.js';
import { memoryCandidates, seeMemories, pickMemory, latestMemory } from '../memory.js';
import { DECK } from '../deck.js';
import { LINES } from '../lines.js';
import { AREAS } from '../places.js';
import { householdOf, HOUSEHOLDS } from '../households.js';
import { CAUSES } from '../deaths.js';
import { contextOf, clearContextCache } from '../context.js';
import { WORD_KEYS, josa } from '../tokens.js';
import { epitaphOf } from '../epitaphs.js';
import { yearHazard, shapeFor, healthMul } from '../lifetable.js';
import { eraOf } from '../births.js';
import {
  renderText, birthLine, effectText, eraWind, eraCard, kinLine, ailmentLine, obituary, deathLine, commonEnd, memCtx, lockReason, holdingsLine,
} from '../i18n.js';
import { holdingsOf } from '../holdings.js';

const ctxAt = (life, year) => contextOf(Number.isFinite(year) ? year : life.year, life.birth.area, life.birth.household);

// ── 한 생 돌리기: 화면에 나오는 글을 [{ src, kind, lang, text, age, year }] 로 모은다 ──
export function runLife(life, { prev = null } = {}) {
  const out = [], b = life.birth;
  const put = (src, kind, ko, en, extra = {}) => {
    if (ko != null) out.push({ src, kind, lang: 'ko', text: ko, age: life.age, year: life.year, ...extra });
    if (en != null) out.push({ src, kind, lang: 'en', text: en, age: life.age, year: life.year, ...extra });
  };
  const R = (t, lang, ctx = life.ctx()) => renderText(t, ctx, b, lang);
  const both = (src, kind, obj, ctx, extra) => obj && put(src, kind, R(obj.ko, 'ko', ctx), R(obj.en, 'en', ctx), extra);
  put('birth', 'birth', birthLine(b, 'ko'), birthLine(b, 'en'));
  const cards = [];
  let lastDecade = null;
  for (let guard = 0; guard < 2000; guard++) {
    const ev = advance(life, DECK, { lines: LINES, yearly: true });
    const dec = Math.floor(life.year / 10);
    if (dec !== lastDecade) {   // 시대 띠·맥락 카드는 열 해에 한 번만 그린다 (같은 글이 많다)
      lastDecade = dec;
      const ctx = life.ctx(), base = yearHazard(shapeFor(eraOf(life.year).id, b.region), life.age) * healthMul(life.stats.health);
      for (const lang of ['ko', 'en']) {
        const w = eraWind(ctx, lang, { year: life.year, area: b.area, base });
        out.push({ src: 'wind', kind: 'ui', lang, text: `${w.head} · ${w.sub}`, age: life.age, year: life.year });
        for (const r of eraCard(ctx, lang, { status: life.status })) out.push({ src: `windCard.${r.key}`, kind: 'ui', lang, text: r.text, age: life.age, year: life.year });
        out.push({ src: 'kin', kind: 'ui', lang, text: kinLine(life, lang), age: life.age, year: life.year });
        const ail = ailmentLine(life, DECK, lang);
        if (ail) out.push({ src: 'ailment', kind: 'ui', lang, text: ail, age: life.age, year: life.year });
        out.push({ src: 'holdings', kind: 'ui', lang, text: holdingsLine(holdingsOf(life.stats.wealth, ctx, b.household), lang), age: life.age, year: life.year });
      }
    }
    if (ev.type === 'death') break;
    if (ev.type === 'card') {
      const card = ev.card, ctx = life.ctx(), open = openChoices(life, card);
      cards.push({ id: card.id, age: life.age, year: life.year });
      both(card.id, 'card.title', card.title, ctx, { card: card.id });
      both(card.id, 'card.text', card.text, ctx, { card: card.id });
      card.choices.forEach((c, i) => {
        both(card.id, 'choice', c.text, ctx, { card: card.id });
        if (!open[i] && c.when) put(card.id, 'lock', lockReason(c.when, life, 'ko'), lockReason(c.when, life, 'en'), { card: card.id });
        for (const fx of [c.effects, c.chance && c.chance.win.effects, c.chance && c.chance.lose.effects]) {
          if (fx) put(card.id, 'effect', effectText(fx, ctx, 'ko', b.household), effectText(fx, ctx, 'en', b.household), { card: card.id });
        }
        if (c.result) both(card.id, 'result', c.result, ctx, { card: card.id });
        if (c.chance) { both(card.id, 'result', c.chance.win.result, ctx, { card: card.id }); both(card.id, 'result', c.chance.lose.result, ctx, { card: card.id }); }
      });
      choose(life, autoChoice(life, card));
      continue;
    }
    if (ev.type === 'pause') {
      const cands = memoryCandidates(life, prev);
      seeMemories(life, cands);
      for (const c of cands) put(c.kind === 'echo' ? `echo:${c.line || c.trace}` : 'memory', c.kind === 'echo' ? 'echo' : 'memory', renderText(c.text.ko, memCtx(b, c), b, 'ko'), renderText(c.text.en, memCtx(b, c), b, 'en'));
      // 자동: 메아리가 있으면 메아리를 꿴다 (흔적이 짙어지는 길도 지나가 보게), 없으면 가장 최근 일
      const pick = cands.find((c) => c.kind === 'echo') || latestMemory(cands);
      if (pick) pickMemory(life, pick);
    }
  }
  // 두루마리: 줄마다 그 줄이 적힌 해의 맥락으로 (ui.js jText 와 같다)
  life.journal.forEach((j, i) => {
    if (j.kind === 'birth' || j.kind === 'death') return;
    if (!j.text) return;
    const ctx = ctxAt(life, j.year);
    out.push({ src: j.kind === 'line' ? lineIdOf(life, i) : j.kind, kind: `journal.${j.kind}`, lang: 'ko', text: renderText(j.text.ko, ctx, b, 'ko'), age: j.age, year: j.year, j: i });
    out.push({ src: j.kind === 'line' ? lineIdOf(life, i) : j.kind, kind: `journal.${j.kind}`, lang: 'en', text: renderText(j.text.en, ctx, b, 'en'), age: j.age, year: j.year, j: i });
  });
  const sum = summarize(life, DECK), d = life.death, endCtx = ctxAt(life, d.year);
  for (const lang of ['ko', 'en']) {
    out.push({ src: 'obituary', kind: 'end', lang, text: obituary(life, sum, lang), age: d.age, year: d.year });
    out.push({ src: 'epitaph', kind: 'end', lang, text: epitaphOf(life, sum, lang), age: d.age, year: d.year });
    if (!d.present) out.push({ src: `death.${d.cause}`, kind: 'end', lang, text: deathLine(d, lang), age: d.age, year: d.year });
    out.push({ src: 'commonEnd', kind: 'end', lang, text: commonEnd(endCtx, lang, { area: b.area, present: !!d.present, cause: d.cause }), age: d.age, year: d.year });
  }
  return { texts: out, cards, sum };
}
// 일지의 i 번째 작은 일 줄의 id (life.linesSeen 은 줄이 나온 차례)
function lineIdOf(life, i) {
  let n = 0;
  for (let k = 0; k < i; k++) if (life.journal[k].kind === 'line') n++;
  return life.linesSeen[n] || 'line';
}

// ── 영혼 여럿: 생 n 개를 모은다 ──
export function runMany(n, { tag = 'SW' } = {}) {
  const lives = [];
  for (let s = 0; lives.length < n; s++) {
    const soul = newSoul(`${tag}${s}`);
    let prev = null;
    while (soul.next && !soul.ended && lives.length < n) {
      const life = createLife({ birth: soul.next, traces: soul.traces, avoid: prev && prev.lines ? prev.lines : [] });
      const r = runLife(life, { prev });
      lives.push({ life, ...r });
      finishLife(soul, life, { memories: life.memories, lines: life.linesSeen.slice() });
      prev = soul.lives[soul.lives.length - 1];
      if (soul.lives.length > 12) break;
    }
  }
  clearContextCache();
  return lives;
}

// ── 흠 찾기 ──
// 한국어 조사: 맥락 낱말·땅·집안·사인 이름 바로 뒤의 조사 (받침과 안 맞으면 흠). 조사 뒤는 띄어쓰기·문장부호·끝이어야 한다
const JOSA_CHECK = ['을', '를', '이', '가', '은', '는', '과', '와', '으로', '로', '이에요', '예요', '이나', '나', '이랑', '랑', '이라고', '라고'];
let NOUNS = null;
function nouns() {
  if (NOUNS) return NOUNS;
  const s = new Set();
  for (const a of Object.values(AREAS)) { s.add(a.ko); s.add(a.short.ko); }
  for (const g of Object.values(HOUSEHOLDS)) for (const h of g) s.add(h.ko);
  for (const c of Object.values(CAUSES)) s.add(c.name.ko);
  NOUNS = s;
  return s;
}
export function koNouns(lives) {   // 그 생들이 실제로 쓴 맥락 낱말까지 더한다
  const s = new Set(nouns());
  for (const { life } of lives) {
    for (let y = life.birth.year; y <= life.death.year; y += 5) {
      const w = ctxAt(life, y).words;
      for (const k of WORD_KEYS) if (w[k] && w[k].ko) s.add(w[k].ko);
    }
  }
  clearContextCache();
  return [...s].filter((w) => w && w.length >= 1 && /[가-힣]$/.test(w)).sort((a, b) => b.length - a.length);
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function josaErrors(text, nounList) {
  const bad = [];
  for (const w of nounList) {
    let at = text.indexOf(w);
    while (at >= 0) {
      const before = at === 0 ? ' ' : text[at - 1];
      const rest = text.slice(at + w.length);
      // 낱말 앞도 경계여야 한다 (「보리쌀」 안의 「쌀」은 보지 않는다): 띄어쓰기·문장부호·따옴표
      if (/[\s(「『"'“‘·,]/.test(before)) {
        // 한 글자 낱말(쌀·소·난 …) 뒤의 로·나·라·랑은 다른 낱말의 일부일 때가 많아(난로·소나무) 보지 않는다
        for (const j of [...JOSA_CHECK].sort((a, b) => b.length - a.length).filter((x) => w.length > 1 || !/^(으?로|이?나|이?라|이?랑|이?라고)$/.test(x))) {
          if (rest.startsWith(j) && /^([\s.,!?…」』"'”’)·]|$)/.test(rest.slice(j.length))) {
            const want = josa(w, j);
            if (want && want !== j) bad.push(['조사', `${w}${j} → ${w}${want}`]);
            break;
          }
        }
      }
      at = text.indexOf(w, at + 1);
    }
  }
  return bad;
}
// 영어
const A_OK = /^(one|once|uni|use|usu|uto|eu|ewe|u\b|ubiq|ufo|ural)/i;   // a 를 쓰는 모음 글자
const AN_OK = /^(hour|honest|honou?r|heir|herb)/i;                      // an 을 쓰는 자음 글자
export function enErrors(text) {
  const bad = [];
  for (const m of text.matchAll(/\b([Aa]n?|[Tt]he) (a|an|the)\b/g)) bad.push(['겹친 관사', m[0]]);
  for (const m of text.matchAll(/(?<![\w’'-])a ([aeiou][\w’'-]*)/gi)) if (!A_OK.test(m[1])) bad.push(['a + 모음', m[0]]);
  for (const m of text.matchAll(/(?<![\w’'-])an ([b-df-hj-np-tv-z][\w’'-]*)/gi)) if (!AN_OK.test(m[1])) bad.push(['an + 자음', m[0]]);
  for (const m of text.matchAll(/(?<![\d,.])1 (denarii|scudi|lire|kronor|pennies|shillings|coins|cowries|cows|sheep?s|goats|acres|fields|boats|tools|beads|rupees|yen|wen|drachmae|obols|dinars|dirhams)\b/g)) {
    if (!['yen', 'wen'].includes(m[1])) bad.push(['1 + 복수', m[0]]);
  }
  for (const m of text.matchAll(/\b([2-9]|\d{2,}) (penny|shilling|coin|cowrie|denarius|scudo|krona|acre|field|boat|bead|rupee|drachma|obol|dinar|dirham|cow|goat)\b(?!['’-]|\s+[a-z])/g)) bad.push(['복수 + 홑꼴', m[0]]);
  for (const m of text.matchAll(/\b[a-z]+(oes|ams|uts|ns|ers|eds|ers|ats) (harvest|season|crop)\b/g)) bad.push(['복수 명사 + harvest', m[0]]);
  if (/ {2,}/.test(text)) bad.push('겹친 띄어쓰기');
  if (/ [.,!?;:]/.test(text)) bad.push('문장부호 앞 띄어쓰기');
  if (/[.!?] [a-z]/.test(text.replace(/\b(e\.g|i\.e|etc|vs|St|Mr|Mrs|Dr)\. [a-z]/g, ''))) bad.push('문장 첫 글자 소문자');
  if (/[가-힣]/.test(text)) bad.push('영어 글에 한글');
  if (/\.\.(?!\.)/.test(text)) bad.push('마침표 둘');
  return bad;
}
export function koErrors(text) {
  const bad = [];
  if (/ {2,}/.test(text)) bad.push('겹친 띄어쓰기');
  if (/ [.,!?]/.test(text)) bad.push('문장부호 앞 띄어쓰기');
  if (/[a-zA-Z]{3,}/.test(text.replace(/\b(CD|TV|PC|DDT|AIDS|HIV|IMF|KTX|SNS)\b/g, ''))) bad.push('한국어 글에 영어 낱말');
  if (/(을를|를을|은는|는은|과와|와과)(?=[\s.,!?]|$)/.test(text)) bad.push('겹친 조사');
  if (/\.\.(?!\.)/.test(text)) bad.push('마침표 둘');
  return bad;
}
export const braceErrors = (text) => {
  const bad = [];
  if (/[{}]/.test(text)) bad.push('남은 중괄호');
  if (/\b(undefined|null|NaN)\b|\[object /.test(text)) bad.push('undefined·null·NaN');
  if (!String(text).trim()) bad.push('빈 글');
  return bad;
};

// 글 속 시대 착오: 낱말이 그 해 앞(그 땅에 닿기 전)에 나오면 흠. regions/areas 로 그 땅을 좁힌다 (없으면 모든 땅)
// 맥락 낱말 표(context.test ANACHRONISM)는 데이터만 본다. 이것은 카드·줄 글에 손으로 쓴 말을 본다
const AMERICAS = ['americas'];
const notAm = (r) => r !== 'americas';
export const TEXT_ANACHRONISM = [
  { ko: /감자/, en: /\bpotato/i, before: 1570, where: notAm, why: '감자 (아메리카 밖은 1570 무렵부터)' },
  { ko: /옥수수/, en: /\b(maize|corn on the cob|cornmeal)\b/i, before: 1520, where: notAm, why: '옥수수 (아메리카 밖은 1520 무렵부터)' },
  { ko: /고추/, en: /\bchil(i|li|e) pepper/i, before: 1540, where: notAm, why: '고추 (아메리카 밖은 1540 무렵부터)' },
  { ko: /담배/, en: /\b(tobacco|cigarette|cigar)/i, before: 1560, where: notAm, why: '담배 (아메리카 밖은 1560 무렵부터)' },
  { ko: /담배/, en: /\b(cigarette)/i, before: 1830, why: '궐련 (1830 무렵부터)' },
  { ko: /토마토/, en: /\btomato/i, before: 1550, where: notAm, why: '토마토' },
  { ko: /카카오|초콜릿/, en: /\b(chocolate|cacao)\b/i, before: 1550, where: notAm, why: '초콜릿·카카오' },
  { ko: /커피/, en: /\bcoffee\b/i, before: 1450, why: '커피 (1450 무렵 예멘부터)' },
  { ko: /커피/, en: /\bcoffee\b/i, before: 1650, where: (r, a) => (r === 'europe' && a !== 'balkans') || r === 'americas' || r === 'east', why: '커피 (유럽·아메리카·동아시아는 1650 무렵부터)' },
  { ko: /커피/, en: /\bcoffee\b/i, before: 1555, where: (r, a) => ['balkans', 'anatolia', 'iran', 'mesopotamia'].includes(a), why: '커피 (오스만·페르시아는 1555 무렵부터)' },
  { ko: /설탕/, en: /\bsugar\b/i, before: 1100, where: (r) => r === 'europe', why: '설탕 (유럽은 1100 무렵부터)' },
  { ko: /(?<![가-힣])(총|화승총|소총|권총|대포|화약)(?![가-힣]*(채|명|각))/, en: /\b(musket|rifle|pistol|cannon|gunpowder|gunshot)/i, before: 1300, where: (r) => r !== 'east', why: '총·대포·화약 (1300 무렵부터)' },
  { ko: /(?<![가-힣])(총|화승총|소총|권총|대포|화약)(?![가-힣]*(채|명|각))/, en: /\b(musket|rifle|pistol|cannon|gunpowder|gunshot)/i, before: 900, where: (r) => r === 'east', why: '화약 (동아시아는 900 무렵부터)' },
  { ko: /기차|철도|기찻길/, en: /\b(trains?(?! of)|railway|railroad|locomotive)\b/i, before: 1830, why: '기차 (1830 무렵부터)' },
  { ko: /증기선|(?<![가-힣])기선/, en: /\bsteamship|steamer\b/i, before: 1815, why: '증기선' },
  { ko: /라디오/, en: /\bradio\b/i, before: 1920, why: '라디오 (1920 무렵부터)' },
  { ko: /텔레비전|티브이|TV/, en: /\b(television|TV)\b/, before: 1950, why: '텔레비전 (1950 무렵부터)' },
  { ko: /전화/, en: /\b(telephone|phone call|phone)\b/i, before: 1880, why: '전화 (1880 무렵부터)' },
  { ko: /휴대폰|휴대전화|스마트폰/, en: /\b(mobile phone|cell ?phone|smartphone)/i, before: 1990, why: '휴대 전화 (1990 무렵부터)' },
  { ko: /인터넷|이메일/, en: /\b(internet|e-?mail|online)\b/i, before: 1985, why: '인터넷 (1985 무렵부터)' },
  { ko: /컴퓨터/, en: /\bcomputer/i, before: 1960, why: '컴퓨터' },
  { ko: /자전거/, en: /\bbicycle|\bbike\b/i, before: 1870, why: '자전거 (1870 무렵부터)' },
  { ko: /자동차|트럭|버스(?!럭)/, en: /\b(car|truck|bus|automobile|motorcar)s?\b/i, before: 1900, why: '자동차 (1900 무렵부터)' },
  { ko: /오토바이/, en: /\bmotorbike|motorcycle/i, before: 1910, why: '오토바이' },
  { ko: /비행기/, en: /\b(airplane|aeroplane|plane ticket|aircraft)/i, before: 1915, why: '비행기' },
  { ko: /사진/, en: /\b(photograph|photo)\b/i, before: 1840, why: '사진 (1840 무렵부터)' },
  { ko: /전기|전등|전구/, en: /\b(electricity|electric|light ?bulb)\b/i, before: 1880, why: '전기 (1880 무렵부터)' },
  { ko: /성냥/, en: /\bmatch(es|box|stick)\b/i, before: 1830, why: '성냥 (1830 무렵부터)' },
  { ko: /신문/, en: /\bnewspaper/i, before: 1610, why: '신문 (1610 무렵부터)' },
  { ko: /안경/, en: /\b(spectacles|eyeglasses|glasses)\b/i, before: 1300, why: '안경 (1300 무렵부터)' },
  { ko: /시계/, en: /\b(clock|wristwatch|pocket ?watch)\b/i, before: 1300, why: '시계 (1300 무렵부터)' },
  { ko: /(?<![가-힣])종이(?![가-힣]*배| (아니|울))/, en: /\bpaper\b/i, before: -100, why: '종이 (기원전 100 무렵 중국부터)' },
  { ko: /(?<![가-힣])종이(?! (아니|울))/, en: /\bpaper\b/i, before: 1100, where: (r) => r === 'europe' || r === 'africa', why: '종이 (유럽·아프리카는 1100 무렵부터)' },
  { ko: /(?<![가-힣])종이(?! (아니|울))/, en: /\bpaper\b/i, before: 1500, where: (r) => r === 'americas' || r === 'seaoc', why: '종이 (아메리카·오세아니아는 1500 무렵부터, 아마테 나무껍질 종이 제외)' },
  { ko: /인쇄|책을 찍/, en: /\b(printed|printing|printing press)\b/i, before: 700, why: '인쇄' },
  { ko: /백신|예방 주사|주사/, en: /\b(vaccine|vaccinat|injection|syringe)/i, before: 1800, why: '주사·백신 (1800 무렵부터)' },
  { ko: /병원/, en: /\bhospital\b/i, before: 300, why: '병원' },
  { ko: /(?<!설탕 )공장/, en: /\bfactory|factories\b/i, before: 1760, why: '공장 (1760 무렵부터)' },
  { ko: /(?<![가-힣])말(을|이|에|과|와|도|은|들)? (타|등|위|탄)/, en: /\b(on horseback|rode a horse|ride a horse|riding a horse)\b/i, before: 1550, where: (r) => r === 'americas', why: '말 타기 (아메리카는 1550 무렵부터)' },
  { ko: /동전|주화/, en: /\bcoins?\b/i, before: -650, why: '동전 (기원전 650 무렵부터)' },
  { ko: /(?<![가-힣])쇠(?!붙이|고기|비름)|철(?:로 만든|제)/, en: /\b(iron)\b/i, before: -1200, why: '쇠 (기원전 1200 무렵부터)' },
  { ko: /유리창/, en: /\b(window ?pane|glass window)/i, before: 1600, why: '유리창' },
  { ko: /학교(?!같)/, en: /\bschool\b/i, before: -3300, why: '학교 (기원전 3300 전에는 없다)' },
  { ko: /축구/, en: /\bfootball|soccer\b/i, before: 1863, why: '축구' },
  { ko: /크리켓/, en: /\bcricket\b(?! (chirp|sang|sing))/i, before: 1720, why: '크리켓' },
];
export function anachronisms(t, birth) {
  const r = birth.region, bad = [];
  for (const rule of TEXT_ANACHRONISM) {
    if (t.year >= rule.before) continue;
    if (rule.where && !rule.where(r, birth.area)) continue;
    const re = t.lang === 'ko' ? rule.ko : rule.en;
    if (re && re.test(t.text)) bad.push(rule.why);
  }
  return bad;
}

// 나이·성별·집안에 안 맞는 말 (사람이 읽을 후보: 규칙으로 못 박기 어려운 것은 보고서에만)
export const FIT_RULES = [
  { id: 'wife-of-woman', test: (t, b) => b.sex === 'f' && ((t.lang === 'ko' && /당신의? 아내|아내를 맞|(?<![가-힣])장가/.test(t.text)) || (t.lang === 'en' && /\byour wife\b|took a wife/i.test(t.text))), why: '여자 생에 「당신 아내」·장가' },
  { id: 'husband-of-man', test: (t, b) => b.sex === 'm' && ((t.lang === 'ko' && /당신의? 남편|시집(을|가)|시댁/.test(t.text)) || (t.lang === 'en' && /\byour husband\b|your in-laws' house/i.test(t.text))), why: '남자 생에 「당신 남편」·시집' },
  { id: 'pregnant-man', test: (t, b) => b.sex === 'm' && ((t.lang === 'ko' && /(당신이|배 속의 아이|아이를 가졌|입덧|해산)/.test(t.text) && /입덧|아이를 가졌어요|해산|배가 불러/.test(t.text)) || (t.lang === 'en' && /\byou were pregnant|you gave birth|your belly grew/i.test(t.text))), why: '남자 생에 임신·출산' },
  { id: 'child-married', test: (t) => t.age < 13 && /^(card|choice|result|journal)/.test(t.kind) && ((t.lang === 'ko' && /당신의? (아내|남편|짝)|당신 아이/.test(t.text)) || (t.lang === 'en' && /\byour (wife|husband|spouse|partner)\b|your (own )?(child|children|kids)\b/i.test(t.text))), why: '열세 살 전에 짝·자기 아이' },
  { id: 'old-parents', test: (t) => t.age >= 75 && /^(card|journal)/.test(t.kind) && ((t.lang === 'ko' && /(어머니|아버지|부모님)(가|께서|이|는) /.test(t.text) && /(살아|꾸중|부르|시키)/.test(t.text)) || (t.lang === 'en' && /\byour (mother|father|parents) (scolds|calls|tells|says|sends)/i.test(t.text))), why: '일흔다섯 넘어 부모가 시킨다' },
  { id: 'band-farm', test: (t, b) => b.household === 'band' && /^(card|choice|result|journal\.line)/.test(t.kind) && ((t.lang === 'ko' && /(?<![가-힣])(밭|논|쟁기|김매|추수|모내기|품삯|가게|세금|돈)(?![다았았는던며고](?![가-힣]*[을를이가에]))(?![가-힣]*(쥐|벌레))/.test(t.text)) || (t.lang === 'en' && /\b(plough|plow|ploughed|field work|harvest(ed)? the|rice paddy|wages|shop|taxes|tax collector|money)\b/i.test(t.text))), why: '수렵 무리 생에 농사·돈·세금 말' },
  { id: 'no-kids-yet', test: (t, b, life, at) => at && at.kids === 0 && /^(card|choice|result|journal\.line)/.test(t.kind) && t.age >= 13 && ((t.lang === 'ko' && /(당신의? 아이들|당신 아이(?!였|일|때)|손주)/.test(t.text)) || (t.lang === 'en' && /\b(your (own )?(children|kids)|your (eldest|youngest) (son|daughter|child)|grandchild)/i.test(t.text))), why: '아이가 없는데 「당신 아이」' },
  { id: 'unmarried-spouse', test: (t, b, life, at) => at && !at.married && /^(card|choice|result|journal\.line)/.test(t.kind) && ((t.lang === 'ko' && /당신의? (아내|남편|짝)(이|가|은|는|과|와|을|를)/.test(t.text)) || (t.lang === 'en' && /\byour (wife|husband|spouse|partner)\b/i.test(t.text))), why: '혼인 안 했는데 「당신 짝」' },
];

// 그 해(나이)의 혼인·아이 (일지 kin 줄·결정에서 다시 짓는다): 맞음 검사용
function kinAt(life) {
  const m = new Map();
  let married = false, kids = 0;
  const marks = [];
  life.journal.forEach((j) => {
    if (j.kind === 'kin' && j.kin === 'wed') marks.push([j.age, 'wed']);
    if (j.kind === 'kin' && (j.kin === 'first' || j.kin === 'more')) marks.push([j.age, 'kid']);
  });
  for (const l of life.log) {
    const card = DECK.find((c) => c.id === l.card), c = card && card.choices[l.choice];
    if (c && (c.set || []).includes('married')) marks.push([l.age, 'wed']);
    if (c && c.kids) marks.push([l.age, 'kid', c.kids]);
  }
  marks.sort((a, b) => a[0] - b[0]);
  let k = 0;
  for (let a = 0; a <= (life.death ? life.death.age : life.age); a++) {
    while (k < marks.length && marks[k][0] <= a) { if (marks[k][1] === 'wed') married = true; else kids += marks[k][2] || 1; k++; }
    m.set(a, { married, kids });
  }
  return m;
}

// 모든 흠: [{ rule, why, text, src, lang, seed, year, area, household, sex, age }]
export function findFlaws(lives, { nounList = null } = {}) {
  const N = nounList || koNouns(lives), flaws = [];
  for (const { life, texts } of lives) {
    const b = life.birth, at = kinAt(life);
    const add = (rule, w, t) => flaws.push({ rule, why: Array.isArray(w) ? w[0] : w, detail: Array.isArray(w) ? w[1] : null, text: t.text, src: t.src, kind: t.kind, lang: t.lang, seed: b.seed, year: t.year, area: b.area, household: b.household, sex: b.sex, age: t.age });
    const seenText = new Map();
    for (const t of texts) {
      for (const w of braceErrors(t.text)) add('brace', w, t);
      if (t.lang === 'ko') { for (const w of josaErrors(t.text, N)) add('josa', w, t); for (const w of koErrors(t.text)) add('ko', w, t); }
      else for (const w of enErrors(t.text)) add('en', w, t);
      for (const w of anachronisms(t, b)) add('anachronism', w, t);
      for (const r of FIT_RULES) if (r.test(t, b, life, at.get(t.age))) add(`fit:${r.id}`, r.why, t);
      // 한 생 안의 반복: 두루마리 줄(작은 일·사건·곁·메아리)과 갈림길 본문이 같은 글로 두 번
      if (/^journal\.(line|event|echo|stat)|^card\.text$/.test(t.kind)) {
        const k = `${t.lang}|${t.text}`;
        if (seenText.has(k) && seenText.get(k) !== t.j) add('repeat', '한 생 안에서 같은 글이 두 번', t);
        else seenText.set(k, t.j);
      }
    }
  }
  return flaws;
}

// 너무 자주 나오는 카드·줄: 생마다 한 번으로 센 비율 (그 카드가 나올 수 있는 단계까지 산 생만 분모)
export function frequency(lives) {
  const card = new Map(), line = new Map(), echo = new Map();
  const bump = (m, k) => m.set(k, (m.get(k) || 0) + 1);
  for (const { life, cards, texts } of lives) {
    for (const id of new Set(cards.map((c) => c.id))) bump(card, id);
    for (const id of new Set(life.linesSeen)) bump(line, id);
    for (const id of new Set(texts.filter((t) => t.kind === 'echo' && t.lang === 'ko').map((t) => t.src))) bump(echo, id);
  }
  const n = lives.length, adults = lives.filter((l) => l.life.death.age >= 20).length;
  const top = (m, d) => [...m].map(([id, c]) => ({ id, n: c, share: c / d })).sort((a, b) => b.n - a.n);
  return { n, adults, cards: top(card, n), lines: top(line, n), echoes: top(echo, n) };
}

// ── 보고서 ──
function report(lives, flaws, freq) {
  const by = new Map();
  for (const f of flaws) { const k = `${f.rule} · ${f.why}`; if (!by.has(k)) by.set(k, []); by.get(k).push(f); }
  const L = [];
  const zones = {};
  for (const { life } of lives) { const r = life.birth.region; zones[r] = (zones[r] || 0) + 1; }
  L.push(`# 여러 생 훑기 보고서`, '', `- 생 ${lives.length}개 (영혼마다 이어서, 자동 결정) · 글 ${lives.reduce((s, l) => s + l.texts.length, 0).toLocaleString()}줄`,
    `- 땅별 생: ${Object.entries(zones).map(([k, v]) => `${k} ${v}`).join(' · ')}`, `- 흠 ${flaws.length}건 (${by.size}갈래)`, '');
  L.push('## 흠 (갈래별, 서로 다른 글 예시 6개까지)', '');
  for (const [k, list] of [...by].sort((a, b) => b[1].length - a[1].length)) {
    const uniq = new Map();
    for (const f of list) { const u = `${f.src}|${f.text}`; if (!uniq.has(u)) uniq.set(u, f); }
    L.push(`### ${k} — ${list.length}건, 서로 다른 글 ${uniq.size}개`);
    for (const f of [...uniq.values()].slice(0, 6)) L.push(`- \`${f.src}\` (${f.kind}, ${f.lang}, ${f.year} ${f.area} ${f.household} ${f.sex} ${f.age}살, ${f.seed})${f.detail ? ` 「${f.detail}」` : ''}: ${f.text.slice(0, 220)}`);
    L.push('');
  }
  L.push('## 자주 나오는 카드 (생마다 한 번, 위 15)', '', '| 카드 | 생 | 비율 |', '|---|---|---|');
  for (const c of freq.cards.slice(0, 15)) L.push(`| ${c.id} | ${c.n} | ${(c.share * 100).toFixed(1)}% |`);
  L.push('', '## 자주 나오는 작은 일 줄 (위 15)', '', '| 줄 | 생 | 비율 |', '|---|---|---|');
  for (const c of freq.lines.slice(0, 15)) L.push(`| ${c.id} | ${c.n} | ${(c.share * 100).toFixed(1)}% |`);
  L.push('', '## 자주 나오는 메아리 줄 (위 10)', '', '| 줄 | 생 | 비율 |', '|---|---|---|');
  for (const c of freq.echoes.slice(0, 10)) L.push(`| ${c.id} | ${c.n} | ${(c.share * 100).toFixed(1)}% |`);
  return L.join('\n') + '\n';
}

// 명령줄
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const args = process.argv.slice(2);
  const n = parseInt(args.find((a) => /^\d+$/.test(a)) || '2400', 10);
  const oi = args.indexOf('--out'), out = oi >= 0 ? args[oi + 1] : null;
  const si = args.indexOf('--seed'), tag = si >= 0 ? args[si + 1] : 'SW';
  const t0 = Date.now();
  const lives = runMany(n, { tag });
  const flaws = findFlaws(lives), freq = frequency(lives);
  const md = report(lives, flaws, freq);
  if (out) { const fs = await import('node:fs'); fs.writeFileSync(out, md); console.log(`보고서: ${out}`); } else console.log(md);
  console.error(`생 ${lives.length}개 · 흠 ${flaws.length}건 · ${((Date.now() - t0) / 1000).toFixed(1)}초`);
}
