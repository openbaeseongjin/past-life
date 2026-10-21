// 말 바꿔 끼우기 (설계 4.1): {key}·{key:조사} 채우기, 받침 판정, 모든 땅·묶음 맥락에서 빈 자리가 남지 않는다
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AREAS } from '../places.js';
import { HOUSEHOLDS, beforeFarming } from '../households.js';
import { groupOf, eraOf } from '../births.js';
import { contextOf } from '../context.js';
import { WORD_KEYS, JOSA_FORMS, fillTokens, josa, finalOf, checkTokens, feastEn, hasWordTokens, leftoverBraces } from '../tokens.js';
import { DECK } from '../deck.js';
import { LINES } from '../lines.js';
import { condOk } from '../cards.js';
import { settingOf } from '../lands.js';

const ctxOf = (words) => ({ words: Object.fromEntries(Object.entries(words).map(([k, [ko, en]]) => [k, { ko, en }])) });
const fill = (text, words, lang = 'ko') => fillTokens(text, ctxOf(words), lang, true);

test('WORD_KEYS 는 설계의 15개다', () => {
  assert.deepEqual(WORD_KEYS, ['crop', 'staple', 'coin', 'coinUnit', 'land', 'landUnit', 'beast', 'home', 'holy', 'ruler', 'feast', 'cloth', 'market', 'healer', 'school']);
});

test('조사 맞춤: 을/를 · ㄹ 받침의 로', () => {
  assert.equal(fill('{crop:을} 거뒀다', { crop: ['쌀', 'rice'] }), '쌀을 거뒀다');
  assert.equal(fill('{crop:을} 거뒀다', { crop: ['밀', 'wheat'] }), '밀을 거뒀다');
  assert.equal(fill('{crop:을} 거뒀다', { crop: ['보리', 'barley'] }), '보리를 거뒀다');
  assert.equal(fill('{crop:를} 거뒀다', { crop: ['쌀', 'rice'] }), '쌀을 거뒀다', '짝의 어느 쪽을 써도 된다');
  assert.equal(fill('{coin:으로} 샀다', { coin: ['은화', 'silver coins'] }), '은화로 샀다');
  assert.equal(fill('{coin:으로} 샀다', { coin: ['돈', 'money'] }), '돈으로 샀다');
  assert.equal(fill('{crop:로} 바꿨다', { crop: ['쌀', 'rice'] }), '쌀로 바꿨다', 'ㄹ 받침은 로');
  assert.equal(fill('{crop:으로} 바꿨다', { crop: ['밀', 'wheat'] }), '밀로 바꿨다');
});

test('조사 맞춤: 이/가 · 은/는 · 와/과 와 그 밖의 짝', () => {
  const w = (k) => ({ beast: [k, 'x'] });
  assert.equal(fill('{beast:이} 울었다', w('소')), '소가 울었다');
  assert.equal(fill('{beast:가} 울었다', w('말')), '말이 울었다');
  assert.equal(fill('{beast:은}', w('양')), '양은');
  assert.equal(fill('{beast:는}', w('물소')), '물소는');
  assert.equal(fill('{beast:와}', w('염소')), '염소와');
  assert.equal(fill('{beast:과}', w('라마')), '라마와');
  assert.equal(fill('{beast:와}', w('칠면조')), '칠면조와');
  assert.equal(fill('{beast:와}', w('붉은사슴')), '붉은사슴과');
  assert.equal(fill('{beast:이나}', w('말')), '말이나');
  assert.equal(fill('{beast:이에요}', w('소')), '소예요');
  assert.equal(fill('{beast:예요}', w('양')), '양이에요');
  assert.equal(josa('엽전', '로'), '으로');
  assert.equal(josa('카카오 콩', '를'), '을');
  assert.equal(josa('3', '을'), '을');
  assert.equal(josa('2', '을'), '를');
  assert.equal(josa('7', '으로'), '로');
  assert.equal(finalOf('쌀'), 8);
  assert.equal(finalOf('보리'), 0);
  assert.equal(finalOf('은화」'), 0);
  for (const f of JOSA_FORMS) assert.ok(josa('쌀', f) && josa('보리', f), f);
});

test('영어는 그대로 넣고 조사는 버린다. {Key} 는 문장 첫머리 대문자', () => {
  const words = { crop: ['쌀', 'rice'], ruler: ['임금', 'king'] };
  assert.equal(fill('They harvested the {crop:을}.', words, 'en'), 'They harvested the rice.');
  assert.equal(fill("{Ruler}'s men came for the {crop}.", words, 'en'), "King's men came for the rice.");
  assert.equal(fill('{Ruler:이} 왔다', words, 'ko'), '임금이 왔다', '한국어는 대문자 자리도 그대로');
});

test('모르는 자리: 시험(strict)에서는 던지고, 평소에는 낱말을 빼고 { 를 내보내지 않는다', () => {
  const words = { crop: ['쌀', 'rice'] };
  assert.throws(() => fill('{dragon}을 봤다', words));
  assert.throws(() => fill('{crop:에게}', words));
  assert.throws(() => fill('{crop 을 거뒀다', words));
  assert.throws(() => fillTokens('{coin}', ctxOf(words), 'ko', true), '맥락에 없는 낱말');
  const soft = (t) => fillTokens(t, ctxOf(words), 'ko');
  assert.equal(soft('{dragon}을 봤다'), '을 봤다');
  assert.equal(soft('{crop 을 거뒀다'), 'crop 을 거뒀다');
  assert.equal(soft('끝}'), '끝');
  assert.equal(soft('{crop:에게}'), '쌀에게');
  assert.equal(fillTokens('{crop}', null, 'ko'), '');
  assert.equal(fillTokens(null, ctxOf(words), 'ko'), '');
  assert.deepEqual(checkTokens('{crop:을} {dragon} {coin:에게} {Ruler}'), ['dragon', 'coin:에게']);
});

test('모든 땅 × 묶음 맥락으로 WORD_KEYS 자리를 다 채우면 { } 가 남지 않는다 (조사 모든 꼴 포함)', () => {
  const ko = WORD_KEYS.map((k) => JOSA_FORMS.map((j) => `{${k}:${j}}`).join(' ') + ` {${k}}`).join(' / ');
  const en = WORD_KEYS.map((k) => `{${k}} {${k[0].toUpperCase() + k.slice(1)}} {${k}:을}`).join(' / ');
  const years = [-9000, -3000, 300, 900, 1200, 1400, 1520, 1650, 1780, 1840, 1900, 1940, 1960, 2000, 2020];
  let n = 0;
  for (const area of Object.keys(AREAS)) for (const year of years) for (const h of HOUSEHOLDS[groupOf(year)]) {
    const ctx = contextOf(year, area, h.id);
    const k = fillTokens(ko, ctx, 'ko', true), e = fillTokens(en, ctx, 'en', true);
    assert.ok(!/[{}]/.test(k) && !/[{}]/.test(e), `${area} ${year}`);
    for (const key of WORD_KEYS) {
      assert.ok(k.includes(ctx.words[key].ko), `${area} ${year} ${key}`);
      assert.ok(e.includes(ctx.words[key].en), `${area} ${year} ${key}`);
    }
    n++;
  }
  assert.ok(n > 3000, `${n}개 맥락`);
});

// ── 덱 전체 채우기 (sim2 Task 6, 설계 4.1·4.4) ─────────────────────────
// 카드·줄 글(제목·본문·노트·선택지·결과·줄)을 모든 땅 × 묶음 대표 해 × 그 묶음 집안(농사 전 땅이면 무리도) 맥락으로 채운다.
// 그 카드가 땅·시대·집안 조건으로 나올 수 있는 맥락만 본다 (나이·성별·깃발·흔적·능력치처럼 한 생 안에서 바뀌는 조건은 빼고 condOk 로).
// 채운 뒤 한국어·영어 어디에도 { } 가 남지 않는다. 자리가 있는 카드·줄은 tokens: true 로 표시하고, 표시가 있으면 자리가 있다
const REP_YEARS = [-9000, 300, 1200, 1650, 1900, 2000];
const LIFE_ONLY = ['sex', 'flags', 'notFlags', 'trace', 'minAge', 'maxAge', 'stat', 'minKnow', 'maxKnow', 'minStatus', 'maxStatus', 'bound', 'war'];
const geoOf = (w) => Object.fromEntries(Object.entries(w || {}).filter(([k]) => !LIFE_ONLY.includes(k)));
// 카드·줄의 글 조각 [어디, {ko, en}]. 인연 이름(bond.who)은 다음 생으로 넘어가므로 따로 본다
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
const hasTokens = (c) => piecesOf(c).some(([, o]) => hasWordTokens(o.ko) || hasWordTokens(o.en));
// 맥락 목록: (해, 땅, 집안, cards.js condOk 가 보는 맥락)
function contexts() {
  const out = [];
  for (const area of Object.keys(AREAS)) for (const year of REP_YEARS) {
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

test('덱의 모든 카드·줄 글을 나올 수 있는 모든 땅 × 묶음 × 집안 맥락으로 채우면 { } 가 남지 않는다', () => {
  const ctxs = contexts();
  assert.ok(ctxs.length > 1000, `${ctxs.length}개 맥락`);
  let filled = 0;
  for (const c of [...DECK, ...LINES]) {
    const pieces = piecesOf(c);
    for (const [where, o] of pieces) for (const lang of ['ko', 'en']) assert.ok(!leftoverBraces(o[lang]), `${c.id} ${where} ${lang} 모르는 자리: ${o[lang]}`);
    const open = pieces.filter(([, o]) => /[{}]/.test(o.ko + o.en));
    if (!open.length) continue;
    const geo = geoOf(c.when);
    let seen = 0;
    for (const x of ctxs) {
      if (!condOk(geo, x.gate)) continue;
      seen++;
      for (const [where, o] of open) for (const lang of ['ko', 'en']) {
        const s = fillTokens(o[lang].replaceAll('{place}', '땅'), x.world, lang, true);
        assert.ok(!/[{}]/.test(s), `${c.id} ${where} ${lang} ${x.area} ${x.year} ${x.h}: ${s}`);
        filled++;
      }
    }
    assert.ok(seen > 0 || c.event, `${c.id}: 나올 맥락이 하나도 없다`);
  }
  assert.ok(filled > 0, '채운 글이 없다');
});

test('자리가 있는 카드·줄은 tokens: true, 표시가 있으면 자리가 있다. 인연 이름에는 자리를 쓰지 않는다', () => {
  for (const c of [...DECK, ...LINES]) {
    assert.equal(!!c.tokens, hasTokens(c), `${c.id} tokens 표시`);
    for (const ch of c.choices || []) if (ch.bond) assert.ok(!/[{}]/.test(ch.bond.who.ko + ch.bond.who.en), `${c.id} 인연 이름에 자리`);
  }
});

test('누구나 카드·줄(땅·시대·집안 조건 없음) 가운데 60% 넘게 말 바꿈이나 조건이 붙었다', () => {
  // 누구나·흔적 카드(u.·t.)와 누구나 줄(l.u.) 가운데 말 바꿈(tokens)이나 시대 조건이 붙은 것의 비율.
  // 설계 4.4 의 「보인 카드 가운데 공통 20% 이하」 단정은 고유 묶음과 함께 Task 7 이 둔다
  const GATE = ['areas', 'regions', 'eras', 'eraGroups', 'minYear', 'maxYear', 'tags', 'zones', 'setting'];
  const plain = (c) => !c.event && !GATE.some((k) => c.when && c.when[k] != null);
  const was = (c) => /^(u|t|l\.u)\./.test(c.id);
  for (const [name, list] of [['카드', DECK], ['줄', LINES]]) {
    const pool = list.filter(was), done = pool.filter((c) => c.tokens || !plain(c));
    assert.ok(done.length / pool.length >= 0.6, `${name} ${done.length}/${pool.length} (60% 밑이면 말 바꿈을 늘린다)`);
  }
});

// ── 영어 관사·낱말 규칙 (sim2 Task 6 수정 1차) ─────────────────────────
test('영어 {feast}: 일반 명사에만 the, 이름과 the 로 시작하는 이름은 그대로. {Feast} 는 문장 첫머리 대문자', () => {
  assert.equal(feastEn('hunt feast'), 'the hunt feast');
  assert.equal(feastEn('festival of the gods'), 'the festival of the gods');
  assert.equal(feastEn('Diwali'), 'Diwali');
  assert.equal(feastEn('New Year Festival'), 'New Year Festival');
  assert.equal(feastEn('the Fourth of July'), 'the Fourth of July');
  const w = (en) => ({ feast: ['명절', en] });
  assert.equal(fill('Around {feast}, …', w('hunt feast'), 'en'), 'Around the hunt feast, …');
  assert.equal(fill('{Feast} came round.', w('hunt feast'), 'en'), 'The hunt feast came round.');
  assert.equal(fill('{Feast} came round.', w('the Fourth of July'), 'en'), 'The Fourth of July came round.');
  assert.equal(fill('louder than {feast}', w('Christmas'), 'en'), 'louder than Christmas');
  assert.equal(fill('{feast}보다', w('hunt feast'), 'ko'), '명절보다', '한국어에는 관사가 없다');
});

test('낱말 표: 모든 땅 × 해 맥락에서 feast·ruler·school 영어 낱말이 규칙을 지킨다', () => {
  const years = [-9000, -5000, -2000, -500, 300, 700, 1000, 1200, 1400, 1520, 1650, 1780, 1820, 1860, 1900, 1930, 1946, 1960, 1990, 2020];
  const seen = { feast: new Set(), ruler: new Set(), school: new Set() };
  for (const area of Object.keys(AREAS)) for (const year of years) for (const h of [...HOUSEHOLDS[groupOf(year)], HOUSEHOLDS.forager[0]]) {
    const ctx = contextOf(year, area, h.id);
    for (const k of Object.keys(seen)) seen[k].add(ctx.words[k].en);
    const f = fillTokens('Around {feast}. {Feast}.', ctx, 'en', true);
    assert.ok(!/\bthe the\b/i.test(f), `${area} ${year} feast: ${f}`);
  }
  for (const w of seen.feast) assert.ok(/^(the |[A-Z])/.test(w) || /^[a-z]/.test(w), `feast ${w}`);
  // ruler: 템플릿이 the 를 붙이므로 관사 없음, 동사 일치를 위해 복수 금지 (머리 낱말로 본다: council of elders 는 council. Congress 는 단수 집합 명사)
  for (const w of seen.ruler) {
    assert.ok(!/^the /i.test(w), `ruler 에 관사: ${w}`);
    assert.ok(!/s$/.test(w.split(' of ')[0]) || ['Congress'].includes(w), `ruler 가 복수처럼 끝난다: ${w}`);
  }
  // school: 배우는 「자리」여야 한다 (to/at the {school})
  for (const w of seen.school) assert.ok(!/tales$/.test(w), `school 이 자리가 아니다: ${w}`);
});

test('카드·줄 글: 영어 {feast} 앞에 the 를 쓰지 않는다, a/an 뒤에 자리를 쓰지 않는다, 한국어 자리 뒤에 맨 조사를 붙이지 않는다', () => {
  const BARE = /\{[A-Za-z]+\}(?:은|는|이|가|을|를|과|와|으로|로|이나|나|이랑|랑|이라|라|이라고|라고|이에요|예요)(?![가-힣])/;
  for (const c of [...DECK, ...LINES]) for (const [where, o] of piecesOf(c)) {
    assert.ok(!/\bthe \{feast/i.test(o.en), `${c.id} ${where}: the {feast}`);
    assert.ok(!/\b(a|an) \{/i.test(o.en), `${c.id} ${where}: a/an {…}`);
    assert.ok(!BARE.test(o.ko), `${c.id} ${where}: 맨 조사 ${o.ko}`);
  }
});

test('밭·짐승 낱말({crop}·{land}·{landUnit}·{beast})은 산업·현대의 농사 안 짓는 집안에게 나올 수 있는 글에 쓰지 않는다', () => {
  // contextOf 의 words 는 땅·해만 본다: 회사원·공장 집안도 그 땅의 밭 작물을 받으므로 「Carry the corn」 같은 글이 된다
  const FARMISH = /\{(crop|land|landUnit|beast)(?::[^{}]*)?\}/i;
  const town = contexts().filter((x) => ['industrial', 'modern'].includes(x.gate.group) && !['farm', 'herd', 'band'].includes(x.h));
  assert.ok(town.length > 100, String(town.length));
  for (const c of [...DECK, ...LINES]) {
    const bad = piecesOf(c).filter(([, o]) => FARMISH.test(o.ko + o.en));
    if (!bad.length) continue;
    const geo = geoOf(c.when), hit = town.find((x) => condOk(geo, x.gate));
    assert.ok(!hit, `${c.id} ${bad[0][0]}: ${hit && `${hit.area} ${hit.year} ${hit.h}`}`);
  }
});
