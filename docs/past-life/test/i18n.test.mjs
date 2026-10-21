// 화면 글 (설계 12장)
import test from 'node:test';
import assert from 'node:assert/strict';
import { effectHint, choiceHint, fmtBig, obituary, peerLine, t, spanText, lifeEnd, epilogueText, ageWord, effectParts, effectText, eraWind, eraCard, commonEnd, renderText, fixOne, holdingsLine, lockReason, healthWord, heartWord, kinLine, ailmentLine, MINUS } from '../i18n.js';
import { contextOf } from '../context.js';
import { holdingsOf } from '../holdings.js';
import { DECK } from '../deck.js';
import { EVENTS } from '../events.js';

test('효과 힌트와 운', () => {
  assert.equal(effectHint({ wealth: 3, health: -1 }, 'ko'), '재산+ 건강−');
  assert.equal(choiceHint({ chance: { p: 0.5, win: { effects: { happy: 4 } }, lose: {} } }, 'ko'), '운에 달림 · 행복+');
});

test('큰 수', () => {
  assert.equal(fmtBig(123456789, 'ko'), '약 1.2억 명');
  assert.equal(fmtBig(52000, 'ko'), '약 5만 명');
  assert.equal(fmtBig(2500000, 'en'), 'about 2.5 million');
});

test('부고 글: 조사와 사인', () => {
  const life = { birth: { year: -1209, area: 'mesopotamia', group: 'ancient', household: 'farm', order: 2, sex: 'f' }, death: { age: 31, cause: 'fever' }, flags: { literate: true }, skills: { craft: 4 }, focusYears: { work: 20 } };
  const s = obituary(life, { married: true, kids: 2 }, 'ko');
  assert.match(s, /^기원전 1210년 메소포타미아의 농사짓는 집 둘째 딸로 태어났어요\./);
  assert.match(s, /손재주가 남달랐어요/);
  assert.match(s, /31살에 열병으로 세상을 떠났어요\.$/);
  assert.match(obituary(life, { married: false, kids: 0 }, 'en'), /Cause: fever\.$/);
});

test('부고 글: 모닥불에서 꿴 마지막 기억 구슬이 죽음 줄 바로 앞에 (없으면 그대로)', () => {
  const life = { birth: { year: 1300, area: 'britain', group: 'medieval', household: 'farm', order: 1, sex: 'm' }, death: { age: 40, cause: 'fever' }, flags: {}, skills: {}, focusYears: {} };
  const mems = [{ age: 7, kind: 'life', text: { ko: '동생이 태어났어요', en: 'A baby sister was born' } }, { age: 15, kind: 'echo', text: { ko: '처음 본 바다가 낯설지 않았어요', en: 'The sea did not feel new, even the first time' } }];
  const ko = obituary(life, { married: false, kids: 0, memories: mems }, 'ko'), en = obituary(life, { married: false, kids: 0, memories: mems }, 'en');
  assert.match(ko, /모닥불 곁에서 마지막으로 꿴 기억은 이랬어요\. 「처음 본 바다가 낯설지 않았어요」 40살에 열병으로 세상을 떠났어요\.$/);
  assert.match(en, /The last memory you strung by the fire: “The sea did not feel new, even the first time\.” You died at 40\. Cause: fever\.$/);
  assert.ok(!/모닥불/.test(obituary(life, { married: false, kids: 0, memories: [] }, 'ko')));
  assert.ok(!/fire/.test(obituary(life, { married: false, kids: 0 }, 'en')));
});

test('모닥불 글: 옛 멈춤 화면(통계 줄·질문·적는 칸·건너뛰기) 글이 없고 새 글은 한·영 짝', () => {
  for (const k of ['pauseTitle', 'pauseStat', 'prevDead', 'prevAlive', 'noteWrite', 'noteKeep', 'notePh', 'pauseOff', 'campWrite', 'campKeep', 'campPh', 'campOff', 'campOn']) {
    assert.equal(t('ko', k), undefined, k); assert.equal(t('en', k), undefined, k);
  }
  assert.equal(t('ko', 'campTitle', 15), '열다섯 살의 모닥불');
  assert.equal(t('ko', 'campHint'), '하나를 고르면 실과 염주에 큰 구슬로 꿰어져요');
  for (const k of ['campHint', 'campEchoHint', 'memBead', 'echoBead']) assert.ok(typeof t('ko', k) === 'string' && typeof t('en', k) === 'string', k);
  assert.match(t('ko', 'campAuto', '첫아이가 태어났어요'), /「첫아이가 태어났어요」/);
  assert.match(t('en', 'rosaryAria', 2, 1), /2 lives · 1 memory bead$/);
});

test('같은 해 태어난 사람 한 줄', () => {
  const p = { birth: { area: 'india', sex: 'f', group: 'modern', household: 'farm' }, death: { age: 10, cause: 'fever' } };
  assert.equal(peerLine(p, 5, 'ko'), '인도 땅 · 여: 어린 시절');
  assert.equal(peerLine(p, 30, 'ko'), '인도 땅 · 여: 10살에 떠남 · 열병');
  assert.equal(peerLine(p, null, 'ko'), '인도 땅 · 여 · 농사짓는 집');
});

test('지금까지 이어지는 생: 족보 줄·여정 끝 글·부고·같은 해 사람 줄에 죽음 말이 없다', () => {
  const birth = { year: 1987, area: 'korea', region: 'east', group: 'modern', household: 'office', order: 1, sex: 'f' };
  const now = { birth, death: { age: 39, year: 2026, cause: null, line: 0, present: true } };
  const dead = { birth, death: { age: 31, year: 2018, cause: 'fever', line: 0 } };
  assert.equal(lifeEnd(now, 'ko'), '1987년 – 지금');
  assert.equal(lifeEnd(now, 'en'), '1987 – now');
  assert.equal(lifeEnd(dead, 'ko'), '31살 · 열병');
  assert.equal(spanText(birth, dead.death, 'en'), '1987 – 2018');
  assert.equal(epilogueText({ lives: [dead, now] }, 'ko'), '이 생은 지금도 이어지고 있어요. 같은 해, 같은 하늘 아래에서 — 당신도요.');
  assert.equal(epilogueText({ lives: [dead, now] }, 'en'), 'This life is still going on. Same year, same sky — and so are you.');
  assert.equal(epilogueText({ lives: [now, dead] }, 'ko'), '그리고 지금, 당신으로 태어났어요.');
  assert.equal(epilogueText({ lives: [dead] }, 'en'), 'And now, you were born as you.');
  const life = { ...now, flags: {}, skills: {}, focusYears: { work: 20 } };
  const ko = obituary(life, { married: true, kids: 2 }, 'ko'), en = obituary(life, { married: false, kids: 1 }, 'en');
  assert.match(ko, /2026년, 39살\. 이 생은 지금도 이어지고 있어요\.$/);
  assert.match(en, /In 2026 you are 39, and this life is still going on\.$/);
  assert.ok(!/떠났|died|Cause/.test(ko + en), ko + en);
  const p = { birth: { area: 'india', sex: 'f', group: 'modern', household: 'farm' }, death: { age: 39, year: 2026, cause: null, line: 0, present: true } };
  assert.equal(peerLine(p, 999, 'ko'), '인도 땅 · 여: 지금 39살');
  assert.equal(peerLine(p, 999, 'en'), 'India · F: alive today, 39');
  assert.equal(peerLine(p, 20, 'ko'), '인도 땅 · 여: 어른');
  assert.equal(t('ko', 'presentDoc'), '지금도 이어지는 생');
  assert.equal(t('en', 'presentDoc'), 'A life still going on');
});

test('ageWord: 한글 나이와 영어', () => {
  assert.deepEqual([1, 2, 10, 17, 20, 21, 30, 51, 99].map((a) => ageWord(a, 'ko')),
    ['한 살', '두 살', '열 살', '열일곱 살', '스무 살', '스물한 살', '서른 살', '쉰한 살', '아흔아홉 살']);
  assert.equal(ageWord(0, 'ko'), '갓난아기');
  assert.equal(ageWord(104, 'ko'), '104살');
  assert.equal(ageWord(17, 'en'), 'age 17');
});

test('새 이름 글: 한·영 짝', () => {
  for (const k of ['lifeN', 'birthSky', 'placeTitle', 'tokE0', 'tokU5', 'carried', 'speedName', 'skipX', 'autoX', 'more',
    'handTitle', 'handBaby', 'scrollTitle', 'strandTitle', 'peersX', 'crossTitle', 'campTitle', 'campHint', 'campEchoHint', 'campAuto',
    'flameTitle', 'knotTitle', 'untiedTitle', 'brightest', 'whyEnded', 'stillGoing', 'hundredTitle', 'hundredCap',
    'hundredCapNow', 'gainedX', 'noteNext', 'noteEnd', 'toBeads', 'beadsTitle', 'beadsSoFar', 'journeyOn', 'keepLiving', 'statX']) {
    assert.ok(t('ko', k) !== undefined && t('en', k) !== undefined, k);
  }
});

// ── 시뮬 2.0 (작업 4): 구체적인 효과 · 시대의 바람 띠 · 흔한 마지막 · 자리 글 ──
const SERF = contextOf(1347, 'britain', 'serve');

test('effectParts: 재산은 그 땅 돈 (은화 +5닢), 나머지는 「건강 +2」, 소수 없음, 0은 뺀다', () => {
  assert.equal(MINUS, '−');
  assert.deepEqual(effectParts({ wealth: 4, happy: -1 }, SERF, 'ko', 'serve'), [
    { key: 'wealth', sign: '+', text: '은화 +5닢', full: '은화 +5닢' }, { key: 'happy', sign: MINUS, text: `마음 ${MINUS}1`, full: `마음 ${MINUS}1` },
  ]);
  // 반올림해 0 이 되는 것·0 은 뺀다. 소수점은 보이지 않는다
  assert.deepEqual(effectParts({ health: 1.5, family: 0.3, know: 2.6, luck: 0 }, SERF, 'ko').map((p) => p.text), ['건강 +2', '지식 +3']);
  // 얻는 것 먼저, 잃는 것 뒤에 (시안 s9 「친화력 +2 · 은화 −1닢」)
  assert.deepEqual(effectParts({ happy: -1, charm: 2, wealth: -1 }, SERF, 'ko', 'serve').map((p) => p.text), ['친화력 +2', `은화 ${MINUS}1닢`, `마음 ${MINUS}1`]);
  assert.deepEqual(effectParts({ status: 1, skill: -2.4 }, SERF, 'ko').map((p) => p.text), ['신분 한 계단 위', `손재주 ${MINUS}2`]);   // 기록 줄(status.js)과 같은 「계단」
  assert.equal(effectText({ status: -1, luck: 1 }, SERF, 'en'), 'Luck +1 · Status down a rung');
  // 능력치가 0.5 미만 오르면 빼지 않고 「+조금」 (1347 농노의 배우기: 지식 +0.15 → 이득이 사라지고 손해만 남지 않게). 수치·내림은 그대로 뺀다
  assert.deepEqual(effectParts({ know: 0.15, happy: -1, family: 0.3, luck: -0.2 }, SERF, 'ko').map((p) => p.text), ['지식 +조금', `마음 ${MINUS}1`]);
  assert.equal(effectText({ know: 0.15 }, SERF, 'en'), 'Knowledge +a little');
  assert.equal(effectText({ wealth: 3 }, null, 'ko'), '재산 +3');   // 맥락이 없으면 숫자로
  assert.deepEqual(effectParts({}, SERF, 'ko'), []);
  assert.deepEqual(effectParts(undefined, SERF, 'en'), []);
  const all = { health: 3, wealth: 7, family: -2, happy: 1, charm: 2, luck: -1, know: 4, skill: 2, status: 1 };
  for (const p of effectParts(all, SERF, 'ko', 'serve')) assert.ok(!/\d\.\d/.test(p.text), p.text);
  assert.equal(effectParts(all, SERF, 'en', 'serve').length, 9);
});

test('영어 재산 칩은 돈 이름만 (「+3 pfennigs」), 온전한 글은 full', () => {
  const de = contextOf(1300, 'germany', 'farm');
  const p = effectParts({ wealth: 3 }, de, 'en', 'farm')[0];
  assert.match(p.full, / of /, p.full);
  assert.equal(p.text, p.full.replace(/ of .+$/, ''));
  assert.ok(!/ of /.test(p.text) && p.text.length <= 14, p.text);
  // 모든 땅·해·집안·크기에서 영어 칩 글이 짧다 (카드 84px, 두 줄까지)
  let worst = '';
  for (const a of ['britain', 'germany', 'east_europe', 'china', 'india', 'west_africa', 'andes', 'pacific', 'japan', 'nile'])
    for (let y = -3000; y <= 2020; y += 37) for (const h of ['farm', 'craft', 'serve', 'trade', 'office']) for (const w of [-1, 1, 3, 7]) {
      const q = effectParts({ wealth: w }, contextOf(y, a, h), 'en', h)[0];
      if (q && q.text.length > worst.length) worst = q.text;
    }
  assert.ok(worst.length <= 22, worst);
  assert.equal(effectParts({ wealth: 3 }, de, 'ko', 'farm')[0].text, effectParts({ wealth: 3 }, de, 'ko', 'farm')[0].full);   // 한국어는 같다
});

test('영어 홑꼴: 1 denarii → 1 denarius (n = 1 일 때만)', () => {
  assert.equal(effectText({ wealth: 1 }, contextOf(100, 'italy', 'farm'), 'en', 'farm'), '+1 denarius');
  assert.equal(fixOne('+1 sole · 11 lire · 2 scudi · 1 réi · −1 kronor'), '+1 sol · 11 lire · 2 scudi · 1 real · −1 krona');
  const list = holdingsOf(30, contextOf(1347, 'britain', 'farm'), 'farm');
  assert.ok(holdingsLine(list, 'en').length > 0 && !/\{|undefined|NaN/.test(holdingsLine(list, 'ko')));
});

test('eraWind: 흑사병 해 — 해 · 땅 · 사건, 둘째 줄은 죽을 위험 배율 · 장터가 닫힘 · 품삯', () => {
  const c = contextOf(1348, 'britain', 'serve');
  const ko = eraWind(c, 'ko', { year: 1348, area: 'britain', base: 0.02 }), en = eraWind(c, 'en', { year: 1348, area: 'britain', base: 0.02 });
  assert.equal(ko.head, '1348년 · 브리튼 · 흑사병');
  assert.equal(en.head, '1348 · Britain · The Black Death');
  // 절대 확률: 올해 = 1 − e^(−(base + 사건)), 평소 = 1 − e^(−base) (검토 I-2: ×N 은 건강·나이에 따라 거꾸로 움직여 뺐다)
  const extra = c.events.map((id) => EVENTS.find((e) => e.id === id)).reduce((t, e) => t + Math.max(0, e.hazard), 0);
  const pc = (p) => `${Math.round(p * 100)}%`;
  assert.equal(ko.sub.split(' · ')[0], `올해 죽을 확률 약 ${pc(1 - Math.exp(-(0.02 + extra)))} (평소 ${pc(1 - Math.exp(-0.02))})`);
  assert.match(ko.sub, /^올해 죽을 확률 약 \d+% \(평소 2%\) · 장터가 닫힘/);
  assert.match(ko.sub, /품삯이 오름/);
  assert.match(en.sub, /^about \d+% chance of dying this year \(usually 2%\) · the market is shut/);
  assert.equal(ko.calm, false);
  assert.match(eraWind(c, 'ko', { year: 1348, area: 'britain', base: 0.004 }).sub, /\(평소 1% 미만\)/);
  assert.match(eraWind(c, 'en', { year: 1348, area: 'britain', base: 0.004 }).sub, /\(usually under 1%\)/);
  // 몸이 약할수록(바탕 위험이 클수록) 올해 확률도 크다 — 예전 ×N 처럼 거꾸로 가지 않는다
  const now = (base) => Number(eraWind(c, 'ko', { year: 1348, area: 'britain', base }).sub.match(/약 (\d+)%/)[1]);
  assert.ok(now(0.006) < now(0.02) && now(0.02) < now(0.2));
  assert.match(eraWind(c, 'ko', { year: 1348, area: 'britain' }).sub, /^죽을 위험이 커짐/);   // base 없이
});

test('eraWind: 평소 해 — 사건이 없으면 그 땅·시대의 평소 모습 한 줄', () => {
  const c = contextOf(1100, 'india', 'farm');
  assert.equal(c.events.length, 0);
  for (const lang of ['ko', 'en']) {
    const w = eraWind(c, lang, { year: 1100, area: 'india', base: 0.02 });
    assert.equal(w.calm, true);
    assert.ok(w.head.startsWith(lang === 'ko' ? '1100년 · 인도 땅 · ' : '1100 · India · '), w.head);
    assert.ok(w.head.split(' · ')[2].length > 3 && !/[{}]|undefined/.test(w.head + w.sub), w.head + ' / ' + w.sub);
    assert.ok(!/죽을 위험|risk/.test(w.sub), w.sub);
    assert.ok(w.sub.split(' · ').length >= 2, w.sub);
  }
  // 평소 모습은 tokens.js 자리 글로 채운다 (조사·영어 관사는 tokens.js 몫): 1100 인도는 명절 줄
  const feast = eraWind(contextOf(1100, 'india', 'farm'), 'ko', { year: 1100, area: 'india' }).head;
  assert.ok(feast.endsWith('기다리는 철') && feast.includes(contextOf(1100, 'india', 'farm').words.feast.ko), feast);
  // 해마다 평소 모습이 돌아가며 바뀐다 (결정적)
  const heads = [1100, 1101, 1102].map((y) => eraWind(contextOf(y, 'india', 'farm'), 'ko', { year: y, area: 'india' }).head);
  assert.equal(new Set(heads).size, 3);
  assert.deepEqual(heads, [1100, 1101, 1102].map((y) => eraWind(contextOf(y, 'india', 'farm'), 'ko', { year: y, area: 'india' }).head));
});

test('eraCard: 그해 맥락 한 줄씩 (전쟁 · 질병·의술 · 기술 · 경제 · 신분제 · 배움), 한·영', () => {
  const c = contextOf(1348, 'britain', 'serve'), st = { ko: '농노', en: 'serf', bound: true };
  const ko = eraCard(c, 'ko', { status: st }), en = eraCard(c, 'en', { status: st });
  assert.deepEqual(ko.map((r) => r.key), ['now', 'war', 'disease', 'tech', 'econ', 'status', 'learn']);
  assert.deepEqual(en.map((r) => r.key), ko.map((r) => r.key));
  const row = (k) => ko.find((r) => r.key === k).text;
  assert.match(row('now'), /흑사병/);
  assert.match(row('disease'), /^흑사병/);   // 그해 유행병이 맨 앞
  assert.match(row('disease'), /체계 의학/);
  assert.match(row('econ'), /물가 ×1\.2 · 품삯 ×1\.3/);
  assert.match(row('status'), /봉건제 · 당신은 농노 \(묶임\)/);
  for (const r of [...ko, ...en]) assert.ok(r.label && r.text && !/[{}]|undefined|NaN/.test(r.text), JSON.stringify(r));
  assert.ok(!eraCard(contextOf(1100, 'india', 'farm'), 'ko').some((r) => r.key === 'now'));
});

test('commonEnd: 「…%가 당신보다 오래」 대신 그 시대 이 땅의 흔한 마지막 (사인 경향 · 유행병 · 전쟁 · 의술)', () => {
  const plague = commonEnd(contextOf(1349, 'britain', 'serve'), 'ko', { area: 'britain' });
  assert.match(plague, /^그 시대 브리튼에서는 아이 때 열병과 배앓이로/);
  assert.match(plague, /흑사병이 돌았어요\.$/);
  assert.match(commonEnd(contextOf(1630, 'germany', 'farm'), 'ko', { area: 'germany' }), /싸움에 나가 돌아오지 못한/);
  // 전쟁으로 떠난 생이면 둘째 문장도 전쟁 쪽 (검토 Minor 14)
  assert.match(commonEnd(contextOf(1377, 'britain', 'serve'), 'ko', { area: 'britain', cause: 'war' }), /싸움에 나가 돌아오지 못한/);
  assert.match(commonEnd(contextOf(1377, 'britain', 'serve'), 'ko', { area: 'britain', cause: 'fever' }), /약초꾼/);
  assert.match(commonEnd(contextOf(1100, 'india', 'farm'), 'ko', { area: 'india' }), /바이디야가 있었지만/);
  assert.match(commonEnd(contextOf(1990, 'korea', 'office'), 'ko', { area: 'korea' }), /심장병이나 암으로 생을 마쳤어요/);
  assert.match(commonEnd(contextOf(2026, 'korea', 'office'), 'ko', { area: 'korea', present: true }), /^지금 한반도 사람들은 .* 마쳐요\./);
  assert.match(commonEnd(contextOf(1349, 'britain', 'serve'), 'en', { area: 'britain' }), /^In Britain back then, .* the Black Death was going round\.$/);
  for (const y of [-20000, -3000, 500, 1500, 1800, 1900, 2000]) for (const a of ['china', 'india', 'west_africa', 'britain', 'andes', 'australia']) for (const l of ['ko', 'en']) {
    const s = commonEnd(contextOf(y, a, 'farm'), l, { area: a });
    assert.ok(s.length > 20 && !/%|[{}]|undefined/.test(s), `${y} ${a} ${s}`);
  }
});

test('수치 판 글: 상태 낱말 · 곁 줄 · 앓은 일 · 잠긴 길의 까닭', () => {
  assert.deepEqual([90, 72, 50, 30, 10].map((v) => healthWord(v, 'ko')), ['아주 튼튼함', '튼튼함', '보통', '허약함', '위태로움']);
  assert.equal(heartWord(45, 'en'), 'steady');
  const b = { year: 1340, area: 'britain', region: 'europe', group: 'medieval', household: 'farm', order: 2, sex: 'f', seed: 'x' };
  assert.equal(kinLine({ birth: b, age: 30, flags: { married: true }, kids: 2, attrs: { charm: 64 } }, 'ko'), '짝 있음 · 아이 둘 · 이웃과 두루 지냄');
  assert.equal(kinLine({ birth: b, age: 9, flags: {}, kids: 0, attrs: { charm: 20 } }, 'ko'), '둘째 딸 · 이웃과 서먹함');
  assert.equal(kinLine({ birth: b, age: 30, flags: { married: true }, kids: 1, attrs: { charm: 80 } }, 'en'), 'partnered · 1 child · always asked to lend a hand');
  // 앓은 일: 지난해 갈림길 「앓아누운 날들」에서 참고 일했다 (건강 −8)
  const card = DECK.find((c) => c.id === 'u.teen.sick'), i = card.choices.findIndex((c) => c.effects.health < 0);
  const sick = { birth: b, age: 17, year: 1357, journal: [{ age: 16, year: 1356, kind: 'decision', card: card.id, choice: i }], log: [{ age: 16, card: card.id, choice: i }] };
  assert.equal(ailmentLine(sick, DECK, 'ko'), '지난해 「앓아누운 날들」 뒤 몸이 축남');
  assert.equal(ailmentLine({ ...sick, age: 21 }, DECK, 'ko'), '');   // 세 해가 넘으면 잊는다
  // 병·부상 표지가 없는 카드는 제목을 끌어오지 않는다 (검토 I-1: 「「물레방아」 뒤 기운을 되찾음」)
  const hp = (e) => (e && e.health) || 0;
  const at = (id, pick) => { const cd = DECK.find((c) => c.id === id), k = cd.choices.findIndex(pick); return { birth: b, age: 31, year: 1371, stats: { health: 55 }, journal: [{ age: 30, year: 1370, kind: 'decision', card: id, choice: k }], log: [{ age: 30, card: id, choice: k }] }; };
  assert.equal(ailmentLine(at('e.med.adult.mill', (c) => hp(c.effects) > 0), DECK, 'ko'), '');
  assert.equal(ailmentLine(at('e.med.adult.mill', (c) => hp(c.effects) < 0), DECK, 'ko'), '');   // −4: 제목 없이도 문턱(−6) 밑
  assert.equal(ailmentLine(at('e.anc.adult.levy', (c) => hp(c.effects) <= -6), DECK, 'ko'), '지난해 몸이 많이 축남');   // 큰 내림은 제목 없이
  assert.equal(ailmentLine(at('h.sea.storm', (c) => hp(c.effects) <= -3 || (c.chance && hp(c.chance.lose.effects) <= -3)), DECK, 'ko').includes('「폭풍 오는 날」'), true);   // 다친 일은 내릴 때 인용
  assert.equal(ailmentLine(at('e.for.middle.leg', (c) => hp(c.effects) > 0), DECK, 'ko'), '지난해 「다친 다리」 뒤 기운을 되찾음');
  // 덱 전체: 표지 없는 카드의 제목은 어떤 길에서도 인용되지 않는다
  for (const cd of DECK) cd.choices.forEach((ch, k) => {
    const line = ailmentLine({ birth: b, age: 31, year: 1371, stats: { health: 55 }, journal: [{ age: 30, year: 1370, kind: 'decision', card: cd.id, choice: k }], log: [{ age: 30, card: cd.id, choice: k, ok: true }] }, DECK, 'ko');
    if (line.includes('「')) assert.ok(cd.ill || cd.event || /fever|sick|ache|pox|doctor|plague|leg|storm|hunt\.first|fire|heights|beast/.test(cd.id), `${cd.id}: ${line}`);
  });
  // 아무 일 없고 몸이 허약하면 그 땅의 풍토병
  const weak = { birth: b, age: 31, year: 1371, stats: { health: 30 }, journal: [], log: [], ctx: () => contextOf(1371, 'britain', 'farm') };
  assert.match(ailmentLine(weak, DECK, 'ko'), /도는 고장$/);
  assert.equal(ailmentLine({ ...weak, stats: { health: 60 } }, DECK, 'ko'), '');
  assert.equal(ailmentLine({ birth: b, age: 6, year: 1348, journal: [{ age: 5, year: 1347, kind: 'event', event: 'blackdeath' }], log: [] }, DECK, 'ko'), '흑사병이 도는 중');
  const life = { age: 20, attrs: { know: 20 }, status: { rank: 1, bound: true } };
  assert.equal(lockReason({ minKnow: 60 }, life, 'ko'), '글을 알아야 해요');
  assert.equal(lockReason({ bound: false }, life, 'ko'), '묶인 몸이라 고를 수 없어요');
  assert.equal(lockReason({ minStatus: 3 }, life, 'en'), 'Needs a higher station');
});

test('renderText: {place} 와 {crop:을} 자리를 그 생의 맥락으로, { 없는 글은 그대로, 날것의 { } 는 없다', () => {
  const b = { year: 1651, area: 'korea', household: 'farm' }, c = contextOf(1651, 'korea', 'farm');
  assert.equal(renderText('{crop:을} 거두고 {place}에 남았어요', c, b, 'ko'), '쌀을 거두고 한반도에 남았어요');
  assert.equal(renderText('The {crop} came in', c, b, 'en'), 'The rice came in');
  const plain = '평범한 하루였어요.';
  assert.equal(renderText(plain, c, b, 'ko'), plain);
  assert.equal(renderText('{zzz} 이상한 {crop', c, b, 'ko').includes('{'), false);
  assert.equal(renderText('{crop}', null, b, 'ko').includes('{'), false);
  assert.equal(renderText(null, c, b, 'ko'), '');
});
