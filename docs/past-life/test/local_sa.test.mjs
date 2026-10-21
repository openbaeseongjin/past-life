// 작업 7 남아시아 고유 묶음 (시뮬 2.0 설계 4.2): cards_local_sa.js · lines_local_sa.js
//   조합마다 수(표 이상) · 문화권+자리+시대 조건 · 한·영 · 자리 글이 나올 수 있는 모든 맥락에서 다 채워짐 · id · 실재 인물 이름 없음 ·
//   첫 선택은 잠기지 않음 · 선택지 조건 · 병 표지 · 큰 집 앞마당/뒤뜰 · 시대 퍼짐 · 실제 생에서 보임(남아시아만)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_CARDS_SA } from '../cards_local_sa.js';
import { LOCAL_LINES_SA } from '../lines_local_sa.js';
import { DECK } from '../deck.js';
import { LINES } from '../lines.js';
import { AREAS } from '../places.js';
import { HOUSEHOLDS, beforeFarming } from '../households.js';
import { groupOf, eraOf } from '../births.js';
import { contextOf } from '../context.js';
import { ZONE_OF } from '../context_data.js';
import { condOk, eligible, STAGES } from '../cards.js';
import { settingOf } from '../lands.js';
import { fillTokens, hasWordTokens, leftoverBraces } from '../tokens.js';
import { FEARS, TALENTS, DREAMS } from '../traces.js';
import { drawBirth } from '../birth.js';
import { createLife, advance, choose, autoChoice } from '../life.js';

const CARDS = LOCAL_CARDS_SA, LNS = LOCAL_LINES_SA;
const SA_AREAS = Object.keys(ZONE_OF).filter((a) => ZONE_OF[a] === 'southasia');
// 설계 4.2 표: 카드 / 줄
const WANT = { village: [10, 12], estate: [6, 8], street: [5, 6], camp: [4, 6] };
const ERA_KEYS = ['eraGroups', 'eras', 'minYear', 'maxYear'];
const LIFE_ONLY = ['sex', 'flags', 'notFlags', 'trace', 'minAge', 'maxAge', 'stat', 'minKnow', 'maxKnow', 'minStatus', 'maxStatus', 'bound', 'war'];
const geoOf = (w) => Object.fromEntries(Object.entries(w || {}).filter(([k]) => !LIFE_ONLY.includes(k)));
const LIM = { ko: { text: 90, choice: 18, result: 70, title: 16 }, en: { text: 180, choice: 40, result: 150, title: 40 } };
const AGE = { baby: 3, child: 9, teen: 16, adult: 30, middle: 50, old: 70 };

function piecesOf(c) {
  const out = [];
  const add = (where, o) => { if (o) out.push([where, o]); };
  add('title', c.title); add('text', c.text);
  (c.choices || []).forEach((ch, i) => {
    add(`choice${i}`, ch.text);
    if (ch.chance) { add(`choice${i}.win`, ch.chance.win.result); add(`choice${i}.lose`, ch.chance.lose.result); } else add(`choice${i}.result`, ch.result);
  });
  return out;
}

// 남아시아 땅 × 해(50년 간격 + 카드 경계 해) × 그 묶음 집안(농사 전 땅이면 무리도)의 조건 맥락
function saContexts() {
  const years = new Set();
  for (let y = -10000; y <= 2025; y += 50) years.add(y);
  for (const c of [...CARDS, ...LNS]) for (const k of ['minYear', 'maxYear']) if (c.when[k] != null) years.add(c.when[k]);
  const out = [];
  for (const area of SA_AREAS) for (const year of years) {
    const g = groupOf(year), hs = [...HOUSEHOLDS[g]];
    if (g !== 'forager' && beforeFarming(area, year)) hs.push(HOUSEHOLDS.forager[0]);
    for (const h of hs) {
      const group = h.id === 'band' ? 'forager' : g, world = contextOf(year, area, h.id);
      const gate = { year, era: eraOf(year).id, group, region: AREAS[area].region, area, coast: !!AREAS[area].coast, tags: h.tags, zone: world.zone, setting: settingOf(h.id, group) };
      out.push({ year, area, h: h.id, world, gate });
    }
  }
  return out;
}
const CTX = saContexts();

test('조합마다 카드·줄 수가 설계 4.2 표 이상, id 는 하나뿐이고 loc.sa. · l.loc.sa. 로 시작한다', () => {
  for (const [set, [nc, nl]] of Object.entries(WANT)) {
    const c = CARDS.filter((x) => x.when.setting === set).length, l = LNS.filter((x) => x.when.setting === set).length;
    assert.ok(c >= nc, `${set} 카드 ${c} < ${nc}`);
    assert.ok(l >= nl, `${set} 줄 ${l} < ${nl}`);
    for (const x of CARDS.filter((y) => y.when.setting === set)) assert.ok(x.id.startsWith(`loc.sa.${set}.`), x.id);
  }
  for (const l of LNS) assert.ok(l.id.startsWith('l.loc.sa.'), l.id);
  const ids = [...CARDS, ...LNS].map((c) => c.id), all = [...DECK, ...LINES].map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.equal(all.filter((x) => x === id).length, 1, `덱에서 ${id} 가 하나뿐`);
  // deck.js · lines.js 에 이어 붙었다
  for (const c of CARDS) assert.ok(DECK.includes(c), c.id);
  for (const l of LNS) assert.ok(LINES.includes(l), l.id);
});

test('모든 카드·줄이 문화권 southasia + 자리 하나 + 시대 조건을 단다', () => {
  for (const c of [...CARDS, ...LNS]) {
    assert.deepEqual(c.when.zones, ['southasia'], c.id);
    assert.ok(Object.keys(WANT).includes(c.when.setting), `${c.id} setting ${c.when.setting}`);
    assert.ok(ERA_KEYS.some((k) => c.when[k] != null), `${c.id} 시대 조건`);
    if (c.when.areas) for (const a of c.when.areas) assert.ok(SA_AREAS.includes(a), `${c.id} 땅 ${a}`);
  }
});

test('한·영 글이 다 있고 길이 제한을 지킨다, 효과·흔적 키가 바르다', () => {
  for (const c of CARDS) {
    for (const [where, o] of piecesOf(c)) for (const lang of ['ko', 'en']) {
      assert.ok(typeof o[lang] === 'string' && o[lang].length > 0, `${c.id} ${where} ${lang}`);
      const kind = where === 'title' ? 'title' : where === 'text' ? 'text' : /\./.test(where) ? 'result' : 'choice';
      assert.ok(o[lang].length <= LIM[lang][kind], `${c.id} ${where} ${lang} ${o[lang].length}자`);
    }
    assert.ok(c.choices.length >= 2 && c.choices.length <= 3, c.id);
    for (const ch of c.choices) {
      if (ch.skill) assert.ok(TALENTS.includes(ch.skill), `${c.id} skill ${ch.skill}`);
      if (ch.risk) assert.ok(FEARS.includes(ch.risk), `${c.id} risk ${ch.risk}`);
      if (ch.fulfill) assert.ok(DREAMS.includes(ch.fulfill), `${c.id} fulfill ${ch.fulfill}`);
    }
  }
  for (const l of LNS) {
    assert.ok(!l.choices && l.text.ko && l.text.en, l.id);
    assert.ok(l.text.ko.length <= 60 && l.text.en.length <= 120, `${l.id} ${l.text.ko.length}/${l.text.en.length}`);
  }
});

test('자리 글: 나올 수 있는 남아시아 모든 맥락(땅 × 50년 간격 해 × 집안)에서 다 채워지고, 카드·줄마다 나올 맥락이 있다', () => {
  assert.ok(CTX.length > 1000, String(CTX.length));
  let filled = 0;
  for (const c of [...CARDS, ...LNS]) {
    const pieces = c.choices ? piecesOf(c) : [['text', c.text]];
    for (const [where, o] of pieces) for (const lang of ['ko', 'en']) assert.ok(!leftoverBraces(o[lang]), `${c.id} ${where} ${lang}`);
    const has = pieces.some(([, o]) => hasWordTokens(o.ko) || hasWordTokens(o.en));
    assert.equal(!!c.tokens, has, `${c.id} tokens 표시`);
    const geo = geoOf(c.when), at = CTX.filter((x) => condOk(geo, x.gate));
    assert.ok(at.length > 0, `${c.id}: 나올 맥락이 없다`);
    if (!has) continue;
    for (const x of at) for (const [where, o] of pieces) for (const lang of ['ko', 'en']) {
      const s = fillTokens(o[lang], x.world, lang, true);
      assert.ok(!/[{}]/.test(s), `${c.id} ${where} ${lang} ${x.area} ${x.year} ${x.h}: ${s}`);
      assert.ok(!/\bthe the\b/i.test(s), `${c.id} ${where}: ${s}`);
      filled++;
    }
  }
  assert.ok(filled > 500, String(filled));
});

test('카드마다 실제 맥락(나이·능력치·신분 포함)에서 고를 수 있고, 첫 선택은 잠기지 않는다', () => {
  for (const c of CARDS) {
    assert.ok(!c.choices[0].when, `${c.id}: 첫 선택에 조건 (choose(life, 0) 으로 도는 시험이 멈춘다)`);
    const stages = [].concat(c.stage);
    let ok = false;
    for (const x of CTX) {
      if (ok) break;
      if (!condOk(geoOf(c.when), x.gate)) continue;
      for (const stage of stages) {
        const age = Math.max(AGE[stage], c.when.minAge || 0);
        const rank = x.world.status.ranks[x.h] || { rank: 2, bound: false };
        const ctx = { ...x.gate, stage, age, sex: 'f', flags: {}, traces: [], dream: null, stats: { health: 50, wealth: 50, family: 50, happy: 50 }, seen: [], attrs: { luck: 50, charm: 50, know: 10, skill: 40 }, status: rank, war: x.world.war.level };
        if (eligible(c, ctx)) { ok = true; break; }
      }
    }
    assert.ok(ok, `${c.id}: 어떤 맥락에서도 나오지 않는다`);
  }
});

test('선택지 조건(글 · 나이 · 매인 몸)이 셋 넘게 있고, 병·다침 카드에는 ill 표지가 있다', () => {
  const gated = CARDS.flatMap((c) => c.choices.filter((ch) => ch.when).map((ch) => [c.id, ch.when]));
  assert.ok(gated.length >= 3, String(gated.length));
  assert.ok(gated.filter(([, w]) => w.minKnow >= 20).length >= 2, '글을 알아야 하는 선택 둘 이상');   // 문턱은 25 안팎 (작업 7 검토)
  assert.ok(gated.some(([, w]) => w.bound === false), '매인 몸이면 잠기는 선택');
  for (const c of CARDS) if (c.choices.some((ch) => ch.skill === 'heal' || ch.risk === 'plague')) assert.ok(c.ill, `${c.id} ill`);
  assert.ok(CARDS.filter((c) => c.ill).length >= 2);
  for (const id of ['loc.sa.village.snake', 'loc.sa.camp.honey']) assert.ok(CARDS.find((c) => c.id === id).ill, id);
});

test('큰 집: 앞마당(elite)과 뒤뜰(serve)이 카드·줄 모두 둘 이상씩', () => {
  const side = (list, t) => list.filter((c) => c.when.setting === 'estate' && c.when.tags && c.when.tags.includes(t)).length;
  for (const t of ['elite', 'serve']) {
    assert.ok(side(CARDS, t) >= 2, `카드 ${t}`);
    assert.ok(side(LNS, t) >= 2, `줄 ${t}`);
  }
});

test('시대 퍼짐: 마을 카드는 고대·중세·근세·근대·현대에 다 닿고, 조합마다 고대(또는 수렵) 카드가 있다', () => {
  const reach = (c, g) => CTX.some((x) => x.gate.group === g && condOk(geoOf(c.when), x.gate));
  for (const g of ['ancient', 'medieval', 'early', 'industrial', 'modern']) assert.ok(CARDS.some((c) => c.when.setting === 'village' && reach(c, g)), `마을 ${g}`);
  for (const set of Object.keys(WANT)) assert.ok(CARDS.some((c) => c.when.setting === set && (reach(c, 'ancient') || reach(c, 'forager'))), `${set} 고대`);
  // 출생 비율대로: 고대·중세에 닿는 카드가 마을 카드의 절반을 넘는다
  const vil = CARDS.filter((c) => c.when.setting === 'village');
  assert.ok(vil.filter((c) => reach(c, 'ancient') || reach(c, 'medieval')).length > vil.length / 2);
});

// 실재 인물 이름 (events.test.mjs 의 금지 표 + 남아시아 인물)
const NAMES_EN = ['Ashoka', 'Asoka', 'Akbar', 'Babur', 'Aurangzeb', 'Humayun', 'Shah Jahan', 'Jahangir', 'Sher Shah', 'Chandragupta', 'Bindusara', 'Kanishka', 'Harsha', 'Samudragupta',
  'Gautama', 'Siddhartha', 'Mahavira', 'Kautilya', 'Chanakya', 'Aryabhata', 'Kalidasa', 'Kabir', 'Tulsidas', 'Mirabai', 'Nanak', 'Shivaji', 'Tipu', 'Ranjit Singh', 'Clive', 'Hastings',
  'Cornwallis', 'Dalhousie', 'Bentinck', 'Macaulay', 'Victoria', 'Gandhi', 'Nehru', 'Jinnah', 'Ambedkar', 'Tagore', 'Bose', 'Patel', 'Mahmud', 'Timur', 'Tamerlane', 'Alexander', 'Mahinda',
  'Devanampiya', 'Dutugamunu', 'Parakramabahu', 'Prithvi Narayan', 'Muhammad', 'Bachche'];
const NAMES_KO = ['아소카', '아크바르', '바부르', '아우랑제브', '후마윤', '샤 자한', '자한기르', '셰르 샤', '찬드라굽타', '빈두사라', '카니슈카', '하르샤', '사무드라굽타', '고타마', '싯다르타',
  '마하비라', '카우틸랴', '차나키야', '아리아바타', '칼리다사', '카비르', '툴시다스', '미라바이', '나나크', '시바지', '티푸', '란지트 싱', '클라이브', '헤이스팅스', '콘월리스', '빅토리아',
  '간디', '네루', '진나', '암베드카르', '타고르', '마흐무드', '티무르', '알렉산드로스', '마힌다', '두투가무누', '파라크라마바후', '프리트비', '무함마드'];
const hitsName = (s) => NAMES_EN.some((n) => new RegExp(`(^|[^A-Za-z])${n}([^A-Za-z]|$)`).test(s)) || NAMES_KO.some((n) => s.includes(n));
test('실재 인물 이름이 없다 (통치자는 칭호만)', () => {
  assert.ok(hitsName('the reign of Akbar') && hitsName('간디의 행진') && !hitsName('Bosentown') && !hitsName('진흙'));
  const texts = [];
  const walk = (v) => { if (typeof v === 'string') texts.push(v); else if (v && typeof v === 'object') for (const x of Object.values(v)) walk(x); };
  for (const c of CARDS) walk({ title: c.title, text: c.text, choices: c.choices });
  for (const l of LNS) walk(l.text);
  assert.deepEqual(texts.filter(hitsName), []);
});

test('실제 생 (자동 결정): 남아시아 생에서 고유 카드·줄이 보이고, 다른 문화권 생에서는 안 보인다', () => {
  let sa = 0, cards = 0, local = 0, lines = 0, localLines = 0, other = 0, leak = 0;
  const settings = new Set();
  for (let i = 0; (sa < 250 || other < 150) && i < 4000; i++) {
    const b = drawBirth('LSA-' + i), isSA = ZONE_OF[b.area] === 'southasia';
    if (isSA ? sa >= 250 : other >= 150) continue;
    if (isSA) sa++; else other++;
    const life = createLife({ birth: b, quiet: true });
    for (;;) {
      const ev = advance(life, DECK, { lines: LINES });
      if (ev.type === 'death') break;
      if (ev.type === 'card') {
        const mine = ev.card.id.startsWith('loc.sa.');
        if (isSA) { cards++; if (mine) { local++; settings.add(ev.card.when.setting); } } else if (mine) leak++;
        choose(life, autoChoice(life, ev.card));
      }
    }
    const ml = life.linesSeen.filter((id) => id.startsWith('l.loc.sa.')).length;
    if (isSA) { lines += life.linesSeen.length; localLines += ml; } else leak += ml;
  }
  assert.equal(leak, 0, '남아시아 밖 생에 남아시아 고유 카드·줄');
  assert.ok(local / cards >= 0.1, `고유 카드 ${local}/${cards}`);
  assert.ok(localLines / lines >= 0.05, `고유 줄 ${localLines}/${lines}`);
  for (const s of ['village', 'estate', 'street', 'camp']) assert.ok(settings.has(s), `${s} 카드가 실제 생에서 보인다`);
});
