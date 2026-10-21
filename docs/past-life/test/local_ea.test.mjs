// 땅·자리 고유 묶음 EA (sim2 설계 4.2, 작업 7): 동아시아 마을 · 동아시아 거리 · 동아시아 큰 집 (귀족 쪽 + 하인 쪽)
// 조합마다 카드·줄 수, 문화권·자리·시대·땅 조건, 한·영과 길이, 효과 키, 선택지 조건, 자리 글 채우기, id, 실재 인물 이름, 실제 생에서 나오는지
import test from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_CARDS_EA } from '../cards_local_ea.js';
import { LOCAL_LINES_EA } from '../lines_local_ea.js';
import { DECK } from '../deck.js';
import { LINES } from '../lines.js';
import { condOk, eligible, STAGES } from '../cards.js';
import { AREAS } from '../places.js';
import { HOUSEHOLDS, beforeFarming } from '../households.js';
import { groupOf, eraOf } from '../births.js';
import { contextOf } from '../context.js';
import { settingOf } from '../lands.js';
import { ZONE_OF } from '../context_data.js';
import { fillTokens, hasWordTokens, leftoverBraces } from '../tokens.js';
import { TALENTS, FEARS, DREAMS, BONDS } from '../traces.js';
import { drawBirth } from '../birth.js';
import { createLife, advance, choose, autoChoice } from '../life.js';

// 설계 4.2 표 (이 작성자 몫): 자리 → [카드, 줄]
const TABLE = { village: [10, 12], street: [5, 6], estate: [5, 6] };
const EA_AREAS = Object.keys(ZONE_OF).filter((a) => ZONE_OF[a] === 'eastasia');
const LIFE_ONLY = ['sex', 'flags', 'notFlags', 'trace', 'minAge', 'maxAge', 'stat', 'minKnow', 'maxKnow', 'minStatus', 'maxStatus', 'bound', 'war'];
const geoOf = (w) => Object.fromEntries(Object.entries(w || {}).filter(([k]) => !LIFE_ONLY.includes(k)));
const AGE = { baby: 3, child: 9, teen: 16, adult: 30, middle: 50, old: 70 };
const stagesOf = (c) => [].concat(c.stage);
const CARDS = LOCAL_CARDS_EA, LINES_EA = LOCAL_LINES_EA, ALL = [...CARDS, ...LINES_EA];
const EFFECT_RANGE = { health: 25, wealth: 25, family: 25, happy: 25, luck: 20, charm: 20, know: 20, skill: 20, status: 1 };
const LIM = { ko: { text: 90, choice: 18, result: 70, title: 16 }, en: { text: 180, choice: 40, result: 150, title: 40 } };

// 카드·줄의 글 조각 [어디, {ko, en}]
function piecesOf(c) {
  const out = [];
  const add = (where, o) => { if (o) out.push([where, o]); };
  add('title', c.title); add('text', c.text); add('note', c.note);
  (c.choices || []).forEach((ch, i) => {
    add(`choice${i}`, ch.text);
    if (ch.chance) { add(`choice${i}.win`, ch.chance.win.result); add(`choice${i}.lose`, ch.chance.lose.result); } else add(`choice${i}.result`, ch.result);
  });
  return out;
}

// 카드·줄이 나올 수 있는 (해, 땅, 집안) 맥락: 그 카드의 해 범위를 10년마다 + 끝 해, 그 땅들, 그해 묶음의 집안(농사 전이면 무리도)
function gatesFor(c) {
  const w = c.when, out = [];
  const lo = Math.max(w.minYear ?? -9000, -9000), hi = Math.min(w.maxYear ?? 2026, 2026);
  const years = new Set([lo, hi]);
  for (let y = Math.ceil(lo / 10) * 10; y <= hi; y += 10) years.add(y);
  for (const area of w.areas || EA_AREAS) for (const year of years) {
    const g = groupOf(year), hs = [...HOUSEHOLDS[g]];
    if (g !== 'forager' && beforeFarming(area, year)) hs.push(HOUSEHOLDS.forager[0]);
    for (const h of hs) {
      const group = h.id === 'band' ? 'forager' : g, world = contextOf(year, area, h.id);
      const gate = { year, era: eraOf(year).id, group, region: AREAS[area].region, area, coast: !!AREAS[area].coast, tags: h.tags, zone: world.zone, setting: settingOf(h.id, group) };
      if (condOk(geoOf(w), gate)) out.push({ year, area, h: h.id, world, gate });
    }
  }
  return out;
}

test('EA: 조합마다 카드·줄 수가 설계 4.2 표 이상이고, 덱·줄 목록에 들어 있다', () => {
  for (const [setting, [nc, nl]] of Object.entries(TABLE)) {
    const c = CARDS.filter((x) => x.when.setting === setting).length, l = LINES_EA.filter((x) => x.when.setting === setting).length;
    assert.ok(c >= nc, `동아시아 ${setting} 카드 ${c} < ${nc}`);
    assert.ok(l >= nl, `동아시아 ${setting} 줄 ${l} < ${nl}`);
  }
  const deck = new Set(DECK.map((c) => c.id)), lines = new Set(LINES.map((l) => l.id));
  for (const c of CARDS) assert.ok(deck.has(c.id), `${c.id} 가 DECK 에 없다`);
  for (const l of LINES_EA) assert.ok(lines.has(l.id), `${l.id} 가 LINES 에 없다`);
});

test('EA: id 꼴과 겹침 없음', () => {
  for (const c of CARDS) assert.match(c.id, new RegExp(`^loc\\.ea\\.${c.when.setting}\\.[a-z_]+$`), c.id);
  for (const l of LINES_EA) assert.match(l.id, /^l\.loc\.ea\.[a-z_]+$/, l.id);
  const ids = ALL.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length, '이 묶음 안 겹침');
  const deckIds = DECK.map((c) => c.id), lineIds = LINES.map((l) => l.id);
  for (const id of ids) assert.equal(deckIds.filter((x) => x === id).length + lineIds.filter((x) => x === id).length, 1, `${id} 가 덱·줄 전체에서 겹친다`);
});

test('EA: 모든 카드·줄이 문화권·자리·시대·땅으로 묶였다', () => {
  for (const c of ALL) {
    const w = c.when;
    assert.ok(w, `${c.id} when`);
    assert.deepEqual(w.zones, ['eastasia'], `${c.id} zones`);
    assert.ok(Object.keys(TABLE).includes(w.setting), `${c.id} setting ${w.setting}`);
    assert.ok(w.eraGroups || w.minYear != null || w.maxYear != null, `${c.id} 시대 조건`);
    if (w.minYear != null && w.maxYear != null) assert.ok(w.minYear <= w.maxYear, `${c.id} 해 범위`);
    assert.ok(Array.isArray(w.areas) && w.areas.length && w.areas.every((a) => EA_AREAS.includes(a)), `${c.id} areas`);
    for (const s of stagesOf(c)) assert.ok(STAGES.includes(s), `${c.id} stage ${s}`);
    if (w.tags) assert.ok(w.setting === 'estate' || w.tags.every((t) => ['craft', 'trade'].includes(t)), `${c.id}: tags 는 큰 집의 귀족·하인 쪽, 또는 거리의 장인·상인 집을 가를 때만`);
  }
});

test('EA: 마을은 중국이 가장 많고 한반도·일본도 3장 이상, 큰 집은 귀족 쪽과 하인 쪽이 땅마다 함께', () => {
  const village = CARDS.filter((c) => c.when.setting === 'village');
  const n = (a) => village.filter((c) => c.when.areas.includes(a)).length;
  assert.ok(n('china') > n('korea') && n('china') > n('japan'), `중국 ${n('china')} 한반도 ${n('korea')} 일본 ${n('japan')}`);
  assert.ok(n('korea') >= 3 && n('japan') >= 3, `한반도 ${n('korea')} 일본 ${n('japan')}`);
  const estate = CARDS.filter((c) => c.when.setting === 'estate');
  for (const a of EA_AREAS) for (const side of ['elite', 'serve']) {
    assert.ok(estate.some((c) => c.when.areas.includes(a) && c.when.tags && c.when.tags.includes(side)), `${a} 큰 집 ${side} 쪽 카드`);
  }
  const estateLines = LINES_EA.filter((l) => l.when.setting === 'estate');
  for (const side of ['elite', 'serve']) assert.ok(estateLines.filter((l) => l.when.tags && l.when.tags.includes(side)).length >= 2, `큰 집 ${side} 쪽 줄`);
});

test('EA: 조합마다 시대를 나눠 두고, 1500년 전(출생의 77%)에 카드가 가장 많다', () => {
  const groupsOf = (c) => {
    const lo = Math.max(c.when.minYear ?? -8000, -7999), hi = Math.min(c.when.maxYear ?? 2026, 2026), out = new Set();
    for (let y = lo; y <= hi; y += 25) out.add(groupOf(y));
    out.add(groupOf(hi));
    return out;
  };
  for (const setting of Object.keys(TABLE)) {
    const cards = CARDS.filter((c) => c.when.setting === setting);
    const covered = new Set(cards.flatMap((c) => [...groupsOf(c)]));
    assert.ok(covered.size >= 4, `${setting}: 묶음 ${[...covered]}`);
    const early = cards.filter((c) => (c.when.minYear ?? -8000) < 1500).length;
    assert.ok(early * 2 >= cards.length, `${setting}: 1500년 전에 시작하는 카드 ${early}/${cards.length}`);
  }
});

test('EA: 한·영과 길이, 선택지 수, 효과 키, 재능·두려움, 병 카드 표시', () => {
  const chk = (o, kind, id) => {
    for (const l of ['ko', 'en']) {
      assert.ok(o && typeof o[l] === 'string' && o[l].trim().length > 0, `${id} ${kind} ${l}`);
      assert.ok(o[l].length <= LIM[l][kind], `${id} ${kind} ${l} ${o[l].length}자`);
    }
  };
  for (const c of CARDS) {
    chk(c.title, 'title', c.id); chk(c.text, 'text', c.id);
    assert.ok(c.choices.length >= 2 && c.choices.length <= 3, c.id);
    for (const ch of c.choices) {
      chk(ch.text, 'choice', c.id);
      if (ch.chance) { assert.ok(ch.chance.p > 0 && ch.chance.p < 1, c.id); chk(ch.chance.win.result, 'result', c.id); chk(ch.chance.lose.result, 'result', c.id); }
      else chk(ch.result, 'result', c.id);
      for (const e of [ch.effects, ch.chance && ch.chance.win.effects, ch.chance && ch.chance.lose.effects]) for (const [k, v] of Object.entries(e || {})) {
        assert.ok(EFFECT_RANGE[k] && Number.isFinite(v) && v !== 0 && Math.abs(v) <= EFFECT_RANGE[k] && (k !== 'status' || Number.isInteger(v)), `${c.id} ${k} ${v}`);
      }
      if (ch.skill) assert.ok(TALENTS.includes(ch.skill), `${c.id} skill ${ch.skill}`);
      if (ch.risk) assert.ok(FEARS.includes(ch.risk), `${c.id} risk ${ch.risk}`);
      for (const k of [ch.dream, ch.fulfill].filter(Boolean)) assert.ok(DREAMS.includes(k), `${c.id} dream ${k}`);
      if (ch.bond) assert.ok(BONDS.includes(ch.bond.kind) && ch.bond.who.ko && ch.bond.who.en, c.id);
    }
    // 병·다침 카드는 ill 표시, 표시가 있으면 건강이 깎일 수 있다
    if (c.ill) assert.ok(c.choices.some((ch) => [ch.effects, ch.chance && ch.chance.lose.effects].some((e) => e && e.health < 0)), `${c.id} ill 인데 건강이 안 깎인다`);
  }
  assert.ok(CARDS.filter((c) => c.ill).length >= 2, '병·다침 카드 (ill: true)');
  for (const l of LINES_EA) {
    assert.ok(!l.choices && !l.event, l.id);
    assert.ok(l.text.ko && l.text.ko.length <= 60, `${l.id} ko ${l.text.ko.length}자`);
    assert.ok(l.text.en && l.text.en.length <= 120, `${l.id} en ${l.text.en.length}자`);
  }
  // 새 효과 키(능력치·신분)는 아껴 쓴다: 선택지의 절반 아래
  const outcomes = CARDS.flatMap((c) => c.choices.flatMap((ch) => (ch.chance ? [ch.chance.win.effects, ch.chance.lose.effects] : [ch.effects]).map((e) => ({ ...(ch.effects || {}), ...(e || {}) }))));
  const withNew = outcomes.filter((e) => ['luck', 'charm', 'know', 'skill', 'status'].some((k) => e[k]));
  assert.ok(withNew.length > 0 && withNew.length * 2 < outcomes.length, `능력치·신분 효과 ${withNew.length}/${outcomes.length}`);
  assert.ok(outcomes.some((e) => e.status > 0), '신분이 오르는 드문 길 (급제·속량)');
});

test('EA: 선택지 조건(choice.when)은 2개 넘게 쓰고, 조건 없는 선택지가 늘 하나는 있다', () => {
  const gated = CARDS.flatMap((c) => c.choices.filter((ch) => ch.when).map((ch) => [c.id, ch.when]));
  assert.ok(gated.length >= 2, `선택지 조건 ${gated.length}`);
  assert.ok(gated.some(([, w]) => w.minKnow >= 20), '「글을 알아야 해요」 선택지');   // 문턱은 25 안팎 (작업 7 검토: 전근대 지식은 25~34)
  for (const c of CARDS) assert.ok(c.choices.some((ch) => !ch.when), `${c.id}: 언제나 열린 선택지가 없다`);
  // 첫 선택지(0번)는 조건 없이 늘 열려 있다: 0번 길만 고르는 시험·도구(memory.test 등)가 잠긴 길에서 멈추지 않게
  for (const c of CARDS) assert.ok(!c.choices[0].when, `${c.id}: 0번 선택지에 조건이 있다`);
  // 어른 몫의 일(술 한 모금 등)은 아이 단계에서 잠긴다
  const sip = CARDS.find((c) => c.id === 'loc.ea.estate.lacquer_cup');
  assert.ok(sip.choices.some((ch) => ch.when && ch.when.minAge >= 13), '아이에게는 술 선택지를 잠근다');
});

test('EA: 카드·줄마다 나올 맥락이 있고, 그 맥락에서 자리 글이 { } 없이 채워진다', () => {
  for (const c of ALL) {
    const gates = gatesFor(c);
    assert.ok(gates.length > 0, `${c.id}: 나올 맥락이 하나도 없다`);
    const pieces = piecesOf(c);
    for (const [where, o] of pieces) for (const lang of ['ko', 'en']) assert.ok(!leftoverBraces(o[lang]), `${c.id} ${where} ${lang} 모르는 자리`);
    assert.equal(!!c.tokens, pieces.some(([, o]) => hasWordTokens(o.ko) || hasWordTokens(o.en)), `${c.id} tokens 표시`);
    for (const x of gates) for (const [where, o] of pieces) for (const lang of ['ko', 'en']) {
      const s = fillTokens(o[lang].replaceAll('{place}', '땅'), x.world, lang, true);
      assert.ok(!/[{}]/.test(s), `${c.id} ${where} ${lang} ${x.area} ${x.year} ${x.h}: ${s}`);
    }
    // 한 생의 맥락으로도 실제로 고를 수 있다 (나이·성별·신분·지식을 카드에 맞춰)
    const w = c.when, x = gates[0];
    const ok = stagesOf(c).some((stage) => eligible(c, {
      ...x.gate, stage, age: Math.max(AGE[stage], w.minAge ?? 0), sex: w.sex || 'f', flags: {}, traces: [], dream: null,
      stats: { health: 50, wealth: 50, family: 50, happy: 50 }, seen: [], attrs: { luck: 50, charm: 50, know: 70, skill: 50 },
      status: { rank: 2, bound: w.bound ?? false }, war: 0,
    }));
    assert.ok(ok, `${c.id}: 한 생 맥락에서 고를 수 없다`);
  }
});

test('EA: 다른 문화권·다른 자리에서는 나오지 않는다', () => {
  for (const c of ALL) {
    const gate = { ...gatesFor(c)[0].gate };
    for (const [k, v] of [['zone', 'steppe'], ['zone', 'southasia'], ['setting', 'camp'], ['setting', 'shore'], ['setting', 'factory']]) {
      assert.ok(!condOk(geoOf(c.when), { ...gate, [k]: v }), `${c.id} ${k}=${v} 에서 나온다`);
    }
    assert.ok(!condOk(geoOf(c.when), { ...gate, area: 'mongolia', zone: 'steppe' }), `${c.id}: 몽골(초원)은 이 묶음이 아니다`);
  }
});

// 실재 인물 이름은 쓰지 않는다 (설계 4.3). events.test.mjs 의 금지 표 + 동아시아 인물 몇
const NAMES_EN = ['Ashoka', 'Genghis', 'Chinggis', 'Temujin', 'Kublai', 'Hongwu', 'Zhu Yuanzhang', 'Zheng He', 'Zhang Qian', 'Bi Sheng', 'An Lushan', 'Sejong', 'Yi Sun-sin',
  'Hideyoshi', 'Nobunaga', 'Ieyasu', 'Mao', 'Qin Shi Huang', 'Hong Taiji', 'Wiman', 'Injo', 'Yi Seong-gye', 'Taejo', 'Kangxi', 'Qianlong', 'Yongle', 'Lin Zexu', 'Toyotomi',
  'Oda Nobunaga', 'Confucius', 'Mencius', 'Deng', 'Choe Chi-won', 'Fan Zhongyan', 'Wang Bao', 'Saigo', 'Meiji Emperor', 'Park Chung', 'Cixi', 'Sun Yat-sen', 'Yuan Shikai'];
const NAMES_KO = ['칭기즈', '테무친', '쿠빌라이', '주원장', '홍무제', '정화의', '장건', '안녹산', '세종', '이순신', '히데요시', '노부나가', '이에야스', '마오쩌둥',
  '이성계', '인조', '진시황', '정화 함대', '정화가', '징기스칸', '홍타이지', '위만', '태조', '강희제', '건륭제', '영락제', '임칙서', '도요토미',
  '공자', '맹자', '덩샤오핑', '최치원', '범중엄', '왕포', '사이고', '박정희', '서태후', '쑨원', '위안스카이', '설계두'];
const hitsName = (s) => NAMES_EN.some((n) => new RegExp(`(^|[^A-Za-z])${n}([^A-Za-z]|$)`).test(s)) || NAMES_KO.some((n) => s.includes(n));
test('EA: 실재 인물 이름이 글에 없다', () => {
  assert.ok(hitsName('the reign of Sejong') && hitsName('최치원이 당에서') && !hitsName('무사히 돌아왔어요') && !hitsName('Mild Maoist-era'));
  const texts = [];
  const walk = (v) => { if (typeof v === 'string') texts.push(v); else if (v && typeof v === 'object') for (const x of Object.values(v)) walk(x); };
  for (const c of ALL) walk({ title: c.title, text: c.text, note: c.note, choices: c.choices });
  assert.deepEqual(texts.filter(hitsName), []);
});

test('EA: 실제 동아시아 생(시드 1,500, 자동 결정)에서 고유 카드·줄이 나오고, 다른 땅 생에서는 안 나온다', () => {
  const seenCards = new Set(), seenLines = new Set();
  let eaLives = 0, eaHit = 0, leak = 0;
  for (let i = 0; i < 1500; i++) {
    const b = drawBirth(`LOC-EA-${i}`);
    const ea = ZONE_OF[b.area] === 'eastasia';
    if (!ea && i % 5) continue;   // 다른 땅 생은 다섯에 하나만 돌려 새는지 본다
    const life = createLife({ birth: b, quiet: true });
    let hit = false;
    for (;;) {
      const ev = advance(life, DECK, { lines: LINES });
      if (ev.type === 'death') break;
      if (ev.type === 'pause') continue;
      if (ev.card.id.startsWith('loc.ea.')) { if (ea) { seenCards.add(ev.card.id); hit = true; } else leak++; }
      choose(life, autoChoice(life, ev.card));
    }
    for (const id of life.linesSeen) if (id.startsWith('l.loc.ea.')) { if (ea) seenLines.add(id); else leak++; }
    if (ea) { eaLives++; eaHit += hit; }
  }
  assert.equal(leak, 0, '동아시아 밖의 생에서 동아시아 고유 카드·줄이 나왔다');
  assert.ok(eaLives > 200, `동아시아 생 ${eaLives}`);
  assert.ok(seenCards.size >= 8 && seenLines.size >= 8, `나온 고유 카드 ${seenCards.size}종, 줄 ${seenLines.size}종`);
  assert.ok(eaHit / eaLives >= 0.15, `고유 카드를 하나라도 본 동아시아 생 ${eaHit}/${eaLives}`);
});
