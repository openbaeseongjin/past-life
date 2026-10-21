# 「한 영혼의 여정」 화면 다시 기획 (구슬 실 · 카드 손패 · 불씨) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 레퍼런스(1in8b)에서 그대로 온 화면·이름·그래프 16가지를 걷어 내고, 「한 해 = 구슬, 한 생 = 실, 여정 = 염주」 은유의 웹 게임 화면으로 바꾼다.

**Architecture:** 엔진(시뮬·내용·저장)은 그대로 둔다. 순수 계산은 새 모듈 `beads.js`(구슬·반 칸·백 가닥·구슬 문자열)와 `epitaphs.js`(묘비 한 줄)에 두고 노드 시험을 붙인다. 2D 그림은 `strand.js`에 모은다. 화면은 `index.html`·`ui.js`를 다시 쓰고(밖으로 보이는 함수 이름은 그대로), `village.js`에는 모닥불·불씨·카메라 시선을 더한다.

**Tech Stack:** 바닐라 ES 모듈, three.js 0.160(importmap), 2D Canvas, 인라인 SVG, `node --test`, Playwright MCP(화면 확인).

## Global Constraints

- 설계: `docs/superpowers/specs/2026-10-20-past-life-identity-design.md`가 기준이다. 바탕 설계는 `docs/superpowers/specs/2026-10-19-past-life-design.md`. 코드는 `docs/past-life/`.
- 이름 사전(설계 2장)을 화면 글의 기준으로 삼는다. 레퍼런스 이름 16가지는 화면 글에 남기지 않는다.
  - 한국어: 1,170억 분의 1 · 출생 기록 · 사망 기록 · 인생 지도 · 생존 곡선 · 올해의 초점 · 인생 기록 · 중대 결정 · 다음 결정까지 · 자동 결정 · 잠시 멈춤 · 같은 해 태어난 사람들 · 마지막 해 · 영혼 족보
  - 영어: One in 117 billion · Record of birth · Record of death · Life map · Survival curve · Next decision · Auto-decide
- 엔진 파일(`life.js`, `cards*.js`, `lines.js`, `events.js`, `deaths.js`, `traces.js`, `birth*.js`, `world.js`, `places.js`, `households.js`, `lifetable.js`, `focus.js`, `peers.js`, `rng.js`)은 고치지 않는다. 지금 시험 88개는 계속 통과해야 한다.
- 모듈 import는 한 줄 `import { a, b } from './x.js';` 꼴만 쓴다(three는 `import * as THREE from 'three';`). `build_share.py`가 이 꼴만 묶는다. `test/`·`tools/` 말고 하위 폴더 모듈을 두지 않는다.
- 결정성: 시뮬·구슬·백 가닥·묘비 고르기의 난수는 `sub(seed, …keys)`로 만든다. `Math.random`은 화면 장식(탄생 하늘 반짝임 등)에만 쓴다.
- 모든 화면 글은 ko/en 둘 다. 말투는 담담하지만 위트, 2인칭, 이름 없음.
- 저장 키는 그대로다(`pl.soul.v1`, `pl.dex.v1`, `pl.lang`, `pl.sound`, `pl.pauses`). 읽기·쓰기는 try/catch.
- 색 토큰: 밤 `#121329`, 종이 `#f6efe2`, 잉크 `#1d2140`, 금 `#e2b65e`/`#a8770a`, 흔적 푸름 `#2a6894`. 구슬 다섯 색은 `#5b6d8c` · `#7f8fa6` · `#c9b48a` · `#e7b45a` · `#f2c14e`.
- 글꼴: 제목·카드 글은 Gowun Batang, HUD 글은 IBM Plex Sans KR(지금 index.html의 Google Fonts 링크 그대로). 아이콘은 인라인 SVG로 그리고 이모지는 쓰지 않는다.
- 폰 세로 390×844에서 가로 스크롤이 0이어야 한다(구슬 실 캔버스 안의 옆 밀기만 허용). `prefers-reduced-motion`을 따른다.
- 파일은 UTF-8, LF. git이 없다: 커밋하지 않는다(`git init` 금지).
- 셸에서 `docs/past-life` 등 프로젝트 하위 폴더로 `cd`해 머무르지 않는다(훅이 그 자리에 `.omc/`를 만든다). 절대 경로나 `( cd … && … )` 서브셸을 쓴다.
- 화면 확인:
  - Playwright MCP 스크린샷은 `D:/Users/admin/Desktop/indigame/.playwright-mcp/`에 둔다(이름 머리 `id<작업번호>_`).
  - `browser_run_code_unsafe` 스크립트 파일도 그 폴더에 둔다.
  - 서버는 `python D:/Users/admin/Desktop/indigame/docs/past-life/tools/serve.py 8780`(뒤에서 돌리고, 끝나면 멈춘다).

## File Structure

| 파일 | 책임 | 작업 |
|---|---|---|
| `docs/past-life/beads.js` (새) | 구슬(`beadsOf`), 마음 단계, 반 칸(`pips`), 구슬 문자열(`encodeBeads`/`decodeBeads`/`BEADS_RE`), 백 가닥(`hundredThreads`) | 1 |
| `docs/past-life/test/beads.test.mjs` (새) | 위 시험 | 1 |
| `docs/past-life/epitaphs.js` (새) | 묘비 한 줄 8묶음 × 3줄, `epitaphGroup`, `epitaphOf` | 2 |
| `docs/past-life/test/epitaphs.test.mjs` (새) | 위 시험 | 2 |
| `docs/past-life/i18n.js` | 새 이름 글(더하기), `ageWord`, `effectIcons`; 작업 6에서 옛 글 지우기 | 3, 6 |
| `docs/past-life/soul.js` | `validSoul`이 `beads` 받기 | 3 |
| `docs/past-life/test/i18n.test.mjs`, `test/soul.test.mjs` | 새 시험 더하기 | 3, 6 |
| `docs/past-life/strand.js` (새) | 2D 캔버스 그리기 | 4 |
| `docs/past-life/strand-test.html` (새) | 그림 확인용 쪽(공유 빌드에 안 들어감) | 4 |
| `docs/past-life/village.js` | `setCampfire`, `flameRise`, `setView` | 4 |
| `docs/past-life/index.html`, `ui.js`, `main.js` | 해가 흐르는 화면·갈림길·모닥불 | 5 |
| `docs/past-life/ui.js`, `main.js`, `index.html` | 시작·탄생·불씨·매듭·염주·도감·나누기 | 6 |
| `docs/past-life/build_share.py` | ORDER에 새 모듈 | 7 |
| 문서들 | 레퍼런스 정리·README·AI 기록 | 7 |

---

### Task 1: 구슬 계산 (`beads.js`)

**Files:**
- Create: `docs/past-life/beads.js`
- Test: `docs/past-life/test/beads.test.mjs`

**Interfaces:**
- Consumes: `sub(seed, ...keys)` (rng.js, `.next()`/`.int(n)`), `survivalCurve(shape, max)`·`survivalTo(shape, age)`·`shapeFor(era, region)` (lifetable.js). `life` 모양은 다음과 같다.
  - `history[a]`: 나이 a의 상태(`happy` 포함). 나이 0부터 죽은 나이까지 있다.
  - `log[]`: 갈림길 고름 `{age}`.
  - `journal[]`: `{age, kind}`. kind `event`는 사건 시작 줄이다.
  - `age`
  - `death`: `null`이거나 `{age, present?}`.
- Produces:
  - `MOOD_COLORS: string[5]`
  - `moodOf(happy) → 0..4`
  - `beadsOf(life) → {age, mood, star, crack}[]`
  - `pips(v) → number[5]` (각 0, 0.5, 1)
  - `encodeBeads(beads) → string`
  - `decodeBeads(s) → bead[]`
  - `BEADS_RE: RegExp`
  - `hundredThreads(shape, seed, age) → { lengths: number[100], mine: number, outlived: number, reach: number }`
    - `outlived`: 내 나이보다 짧은 실 수
    - `reach`: 길이가 내 나이 이상인 실 수(내 실 바꾸기 전 기준)

- [ ] **Step 1: 시험 쓰기**

`docs/past-life/test/beads.test.mjs`:
```js
// 구슬 계산 (화면 다시 기획 4.1·4.2)
import test from 'node:test';
import assert from 'node:assert/strict';
import { MOOD_COLORS, moodOf, beadsOf, pips, encodeBeads, decodeBeads, BEADS_RE, hundredThreads } from '../beads.js';
import { shapeFor, survivalTo } from '../lifetable.js';

const fake = (happies, extra = {}) => ({
  history: happies.map((h, a) => ({ age: a, health: 50, wealth: 50, family: 50, happy: h })),
  log: [], journal: [], age: happies.length - 1, death: null, ...extra,
});

test('마음 단계 경계와 색 다섯', () => {
  assert.equal(MOOD_COLORS.length, 5);
  assert.deepEqual([0, 19, 20, 39, 40, 59, 60, 79, 80, 100].map(moodOf), [0, 0, 1, 1, 2, 2, 3, 3, 4, 4]);
});

test('beadsOf: 산 해마다 한 알, 별·금 표시', () => {
  const life = fake([50, 10, 90, 65, 30], { log: [{ age: 2 }], journal: [{ age: 3, kind: 'event' }, { age: 1, kind: 'line' }] });
  const b = beadsOf(life);
  assert.equal(b.length, 5);
  assert.deepEqual(b.map((x) => x.mood), [2, 0, 4, 3, 1]);
  assert.deepEqual(b.map((x) => x.star), [false, false, true, false, false]);
  assert.deepEqual(b.map((x) => x.crack), [false, false, false, true, false]);
  // 죽은 생은 죽은 나이까지 (그 뒤 history 가 없어도)
  const dead = fake([50, 50, 50], { death: { age: 2 } });
  assert.equal(beadsOf(dead).length, 3);
  // 2026년에서 멈춘 생도 그 나이까지
  const now = fake([50, 50, 50, 50], { death: { age: 3, present: true } });
  assert.equal(beadsOf(now).length, 4);
});

test('pips: 반 칸 단위 다섯 칸', () => {
  assert.deepEqual(pips(0), [0, 0, 0, 0, 0]);
  assert.deepEqual(pips(5), [0.5, 0, 0, 0, 0]);
  assert.deepEqual(pips(10), [0.5, 0, 0, 0, 0]);
  assert.deepEqual(pips(50), [1, 1, 0.5, 0, 0]);
  assert.deepEqual(pips(95), [1, 1, 1, 1, 1]);
  assert.deepEqual(pips(100), [1, 1, 1, 1, 1]);
  assert.deepEqual(pips(-3), [0, 0, 0, 0, 0]);
  assert.deepEqual(pips(140), [1, 1, 1, 1, 1]);
});

test('구슬 문자열: 왕복, 별이 금보다 먼저, 옛 글자는 마음 2', () => {
  const b = [
    { age: 0, mood: 0, star: false, crack: false }, { age: 1, mood: 4, star: true, crack: false },
    { age: 2, mood: 2, star: false, crack: true }, { age: 3, mood: 3, star: true, crack: true },
  ];
  const s = encodeBeads(b);
  assert.equal(s, '0eCd');
  assert.ok(BEADS_RE.test(s));
  const back = decodeBeads(s);
  assert.deepEqual(back.slice(0, 3), b.slice(0, 3));
  assert.deepEqual(back[3], { age: 3, mood: 3, star: true, crack: false });
  assert.deepEqual(decodeBeads('z'), [{ age: 0, mood: 2, star: false, crack: false }]);
  assert.deepEqual(decodeBeads(null), []);
  assert.ok(!BEADS_RE.test('01x'));
});

test('백 가닥: 백 개, 같은 시드면 같은 결과, 내 실은 내 나이', () => {
  const sh = shapeFor(3, 'europe');
  const a = hundredThreads(sh, 'S-1', 40), b = hundredThreads(sh, 'S-1', 40);
  assert.deepEqual(a, b);
  assert.equal(a.lengths.length, 100);
  assert.equal(a.lengths[a.mine], 40);
  for (const L of a.lengths) assert.ok(Number.isInteger(L) && L >= 0 && L <= 110, String(L));
  const sorted = hundredThreads(sh, 'S-2', 40).lengths.slice().sort((x, y) => x - y);
  for (let i = 1; i < 100; i++) assert.ok(sorted[i] >= sorted[i - 1]);
  // outlived = 내 나이 전에 떠난 사람 수 ≈ (1 − S(나이)) × 100
  for (const age of [0, 1, 5, 30, 60, 85]) {
    const h = hundredThreads(sh, 'S-3', age), want = Math.round((1 - survivalTo(sh, age)) * 100);
    assert.ok(Math.abs(h.outlived - want) <= 2, `${age}: ${h.outlived} vs ${want}`);
    assert.equal(h.outlived + h.reach, 100);
  }
});
```

- [ ] **Step 2: 실패 확인**

Run: `( cd D:/Users/admin/Desktop/indigame/docs/past-life && node --test test/beads.test.mjs )`
Expected: FAIL (`Cannot find module '../beads.js'`)

- [ ] **Step 3: 구현**

`docs/past-life/beads.js`:
```js
// 구슬 실 계산 (화면 다시 기획 4.1·4.2): 한 해 = 구슬 한 알, 한 생 = 실 한 가닥. DOM·three 없음
import { sub } from './rng.js';
import { survivalCurve } from './lifetable.js';

// 마음 0(흐린 남청) → 4(금)
export const MOOD_COLORS = ['#5b6d8c', '#7f8fa6', '#c9b48a', '#e7b45a', '#f2c14e'];
export const moodOf = (happy) => Math.max(0, Math.min(4, Math.floor(happy / 20)));

// 산 해마다 { age, mood, star(갈림길), crack(사건 시작) }. 0살부터 마지막 나이까지
export function beadsOf(life) {
  const end = life.death ? life.death.age : life.age;
  const stars = new Set(life.log.map((l) => l.age));
  const cracks = new Set(life.journal.filter((j) => j.kind === 'event').map((j) => j.age));
  const out = [];
  for (let a = 0; a <= end; a++) {
    const h = life.history[Math.min(a, life.history.length - 1)];
    out.push({ age: a, mood: moodOf(h ? h.happy : 50), star: stars.has(a), crack: cracks.has(a) });
  }
  return out;
}

// 상태 0~100 → 구슬 다섯 칸 채움 (반 칸 단위)
export const pips = (v) => {
  const n = Math.round(Math.max(0, Math.min(100, v)) / 10) / 2;
  return [0, 1, 2, 3, 4].map((i) => Math.max(0, Math.min(1, n - i)));
};

// 저장용 한 해 한 글자: 마음 0~4 → '0'~'4', 별이면 'a'~'e', 금이면 'A'~'E' (둘 다면 별)
const CH = '01234', ST = 'abcde', CR = 'ABCDE';
export const BEADS_RE = /^[0-4a-eA-E]*$/;
export const encodeBeads = (beads) => beads.map((b) => (b.star ? ST : b.crack ? CR : CH)[b.mood]).join('');
export function decodeBeads(s) {
  return [...String(s || '')].map((c, age) => {
    for (const [set, star, crack] of [[CH, false, false], [ST, true, false], [CR, false, true]]) {
      const i = set.indexOf(c);
      if (i >= 0) return { age, mood: i, star, crack };
    }
    return { age, mood: 2, star: false, crack: false };   // 모르는 글자는 보통 마음
  });
}

// 백 가닥: 그해 그 땅에서 태어난 백 명을 고르게 나눈 죽는 나이. 그리는 순서는 시드로 섞는다
export function hundredThreads(shape, seed, age) {
  const S = survivalCurve(shape, 111);
  const base = Array.from({ length: 100 }, (_, i) => {
    const q = 1 - (i + 0.5) / 100;
    let a = 0;
    while (a < 110 && S[a + 1] > q) a++;
    return a;
  });
  const outlived = base.filter((L) => L < age).length;
  const r = sub(seed, 'hundred');
  const lengths = base.slice();
  for (let i = lengths.length - 1; i > 0; i--) { const j = r.int(i + 1); [lengths[i], lengths[j]] = [lengths[j], lengths[i]]; }
  let mine = 0;
  for (let i = 1; i < 100; i++) if (Math.abs(lengths[i] - age) < Math.abs(lengths[mine] - age)) mine = i;
  lengths[mine] = age;
  return { lengths, mine, outlived, reach: 100 - outlived };
}
```

- [ ] **Step 4: 통과 확인**

Run: `( cd D:/Users/admin/Desktop/indigame/docs/past-life && npm test )`
Expected: PASS, 시험 93개(88 + 5).

---

### Task 2: 묘비 한 줄 (`epitaphs.js`)

**Files:**
- Create: `docs/past-life/epitaphs.js`
- Test: `docs/past-life/test/epitaphs.test.mjs`

**Interfaces:**
- Consumes: `sub` (rng.js, `.pick(arr)`); `life.birth.seed`, `life.death` (`{age, present?}` 또는 null), `life.age`; `summarize()`가 돌려주는 `sum.topFocus` (`'work'|'learn'|'family'|'body'|'rest'|null`).
- Produces: `EPITAPHS: {baby, child, present, work, learn, family, body, rest: {ko,en}[3]}`, `epitaphGroup(life, sum) → string`, `epitaphOf(life, sum, lang) → string`.

- [ ] **Step 1: 시험 쓰기**

`docs/past-life/test/epitaphs.test.mjs`:
```js
// 묘비 한 줄 (화면 다시 기획 4.3)
import test from 'node:test';
import assert from 'node:assert/strict';
import { EPITAPHS, epitaphGroup, epitaphOf } from '../epitaphs.js';

const GROUPS = ['baby', 'child', 'present', 'work', 'learn', 'family', 'body', 'rest'];
const life = (age, present = false, seed = 'E-1') => ({ birth: { seed }, age, death: { age, present } });

test('8묶음 × 3줄, 한·영 길이, 숫자 없음', () => {
  assert.deepEqual(Object.keys(EPITAPHS).sort(), GROUPS.slice().sort());
  for (const g of GROUPS) {
    assert.equal(EPITAPHS[g].length, 3, g);
    for (const e of EPITAPHS[g]) {
      assert.ok(e.ko && e.ko.length <= 40, `${g} ko ${e.ko}`);
      assert.ok(e.en && e.en.length <= 80, `${g} en ${e.en}`);
      assert.ok(!/\d/.test(e.ko + e.en), `${g} 숫자`);
      assert.ok(!e.ko.includes('당신'), `${g} 당신`);
    }
  }
});

test('묶음 고르기: 아기 < 5 ≤ 아이 < 15, 지금 멈춤, 그 밖은 가장 오래 든 패', () => {
  assert.equal(epitaphGroup(life(0), { topFocus: null }), 'baby');
  assert.equal(epitaphGroup(life(4), { topFocus: 'rest' }), 'baby');
  assert.equal(epitaphGroup(life(5), { topFocus: 'rest' }), 'child');
  assert.equal(epitaphGroup(life(14), { topFocus: 'work' }), 'child');
  assert.equal(epitaphGroup(life(3, true), { topFocus: null }), 'present');
  assert.equal(epitaphGroup(life(42, true), { topFocus: 'work' }), 'present');
  assert.equal(epitaphGroup(life(15), { topFocus: 'learn' }), 'learn');
  assert.equal(epitaphGroup(life(70), { topFocus: 'family' }), 'family');
  assert.equal(epitaphGroup(life(70), { topFocus: null }), 'work');
});

test('epitaphOf: 같은 시드면 같은 줄, 그 묶음 안의 줄, 말에 맞게', () => {
  const a = epitaphOf(life(60, false, 'E-7'), { topFocus: 'body' }, 'ko');
  assert.equal(a, epitaphOf(life(60, false, 'E-7'), { topFocus: 'body' }, 'ko'));
  assert.ok(EPITAPHS.body.some((e) => e.ko === a));
  const b = epitaphOf(life(60, false, 'E-7'), { topFocus: 'body' }, 'en');
  assert.ok(EPITAPHS.body.some((e) => e.en === b));
});
```

- [ ] **Step 2: 실패 확인**

Run: `( cd D:/Users/admin/Desktop/indigame/docs/past-life && node --test test/epitaphs.test.mjs )`
Expected: FAIL (`Cannot find module '../epitaphs.js'`)

- [ ] **Step 3: 구현 (글은 그대로 넣는다)**

`docs/past-life/epitaphs.js`:
```js
// 묘비 한 줄 (화면 다시 기획 4.3): 매듭 화면 맨 위. 사인·나이 숫자 없이, 과거형, 「당신」 없이
import { sub } from './rng.js';

const E = (ko, en) => ({ ko, en });
export const EPITAPHS = {
  baby: [
    E('이 세상을 잠깐 둘러보고 갔어요.', 'Took a short look at the world, then left.'),
    E('이름이 불린 날보다 안긴 날이 많았어요.', 'Was held more often than called by name.'),
    E('짧았지만, 누군가의 품이 기억해요.', 'Brief, but someone\u2019s arms remember.'),
  ],
  child: [
    E('뛰어다니다 너무 일찍 멈췄어요.', 'Ran everywhere, and stopped far too soon.'),
    E('어른이 되는 법은 다음 생에 배우기로 했어요.', 'Saved growing up for another life.'),
    E('마을 골목마다 웃음소리를 두고 갔어요.', 'Left laughter in every lane of the village.'),
  ],
  present: [
    E('아직 쓰는 중인 이야기예요.', 'A story still being written.'),
    E('매듭은 아직이에요. 그 실이 오늘도 길어져요.', 'No knot yet. The thread grows longer today.'),
    E('오늘도 구슬 한 알을 꿰는 중이에요.', 'Still threading one more bead today.'),
  ],
  work: [
    E('평생 두 손을 쉬게 두지 않았어요.', 'Worked with both hands, all life long.'),
    E('쉬는 법은 끝내 배우지 못했어요.', 'Never quite learned how to rest.'),
    E('남긴 것 대부분은 손으로 만든 것이었어요.', 'Most of what was left behind was made by hand.'),
  ],
  learn: [
    E('끝까지 무언가를 배우던 사람이었어요.', 'Was still learning something at the very end.'),
    E('궁금한 것이 늘 하나 더 있었어요.', 'There was always one more question.'),
    E('아는 것을 아낌없이 나눠 주었어요.', 'Knew a great deal, and gave it all away.'),
  ],
  family: [
    E('식구들 곁을 끝내 떠나지 않았어요.', 'Never strayed far from family.'),
    E('밥상에 둘러앉은 얼굴들이 가장 큰 재산이었어요.', 'The faces around the table were the real fortune.'),
    E('이웃의 대문이 늘 열려 있던 사람이었어요.', 'Every neighbor\u2019s door was always open.'),
  ],
  body: [
    E('몸을 돌보며 먼 길을 걸었어요.', 'Cared for the body, and walked a long way.'),
    E('마을에서 가장 튼튼한 다리를 가졌어요.', 'Had the sturdiest legs in the village.'),
    E('아침이면 해가 뜨기 전에 일어났어요.', 'Rose before the sun most mornings.'),
  ],
  rest: [
    E('서두르지 않고 살았어요.', 'Lived without hurrying.'),
    E('노래와 낮잠을 아끼지 않았어요.', 'Never skimped on songs or naps.'),
    E('좋은 그늘을 알아보는 눈이 있었어요.', 'Had an eye for a good patch of shade.'),
  ],
};

// 어느 묶음인가: 지금(2026) 멈춤 → present, 다섯 살 전 → baby, 열다섯 살 전 → child, 그 밖은 가장 오래 든 패
export function epitaphGroup(life, sum) {
  const d = life.death;
  if (d && d.present) return 'present';
  const age = d ? d.age : life.age;
  if (age < 5) return 'baby';
  if (age < 15) return 'child';
  return sum && EPITAPHS[sum.topFocus] ? sum.topFocus : 'work';
}

export function epitaphOf(life, sum, lang) {
  const line = sub(life.birth.seed, 'epitaph').pick(EPITAPHS[epitaphGroup(life, sum)]);
  return line[lang] || line.ko;
}
```

- [ ] **Step 4: 통과 확인**

Run: `( cd D:/Users/admin/Desktop/indigame/docs/past-life && npm test )`
Expected: PASS, 시험 96개.

---

### Task 3: 새 이름 글 · `ageWord` · `effectIcons` · 저장에 구슬

**Files:**
- Modify: `docs/past-life/i18n.js` (STR ko·en에 새 열쇠 **더하기**. 옛 열쇠는 작업 6에서 지운다. 함수 `ageWord`, `effectIcons` export)
- Modify: `docs/past-life/soul.js` (`okLife`에 `beads` 조건)
- Test: `docs/past-life/test/i18n.test.mjs`, `docs/past-life/test/soul.test.mjs` (끝에 더하기)

**Interfaces:**
- Consumes: `BEADS_RE` (작업 1).
- Produces:
  - `ageWord(age, lang) → string`: ko는 「열일곱 살」, en은 "age 17"
  - `effectIcons(effects) → {stat, sign, size}[]`
    - stat: health·wealth·family·happy 순
    - sign: `'+'` 또는 `'−'`(U+2212)
    - size: |v| 1~3.9 → 1, 4~7.9 → 2, 8 이상 → 3. 0은 뺀다
  - 아래 표의 STR 열쇠(작업 5·6이 `t(L, key, …)`로 쓴다)
  - `validSoul`: `lives[i].beads`가 없거나, `BEADS_RE`에 맞고 길이 ≤ 121인 문자열이면 통과

- [ ] **Step 1: 시험 쓰기**

`docs/past-life/test/i18n.test.mjs` 끝에 더한다:
```js
import { ageWord, effectIcons, t as tt } from '../i18n.js';

test('ageWord: 한글 나이와 영어', () => {
  assert.deepEqual([1, 2, 10, 17, 20, 21, 30, 51, 99].map((a) => ageWord(a, 'ko')),
    ['한 살', '두 살', '열 살', '열일곱 살', '스무 살', '스물한 살', '서른 살', '쉰한 살', '아흔아홉 살']);
  assert.equal(ageWord(0, 'ko'), '갓난아기');
  assert.equal(ageWord(104, 'ko'), '104살');
  assert.equal(ageWord(17, 'en'), 'age 17');
});

test('effectIcons: 순서·부호·크기, 0은 뺀다', () => {
  assert.deepEqual(effectIcons({ happy: 2, wealth: -5, health: 9, family: 0 }), [
    { stat: 'health', sign: '+', size: 3 }, { stat: 'wealth', sign: '−', size: 2 }, { stat: 'happy', sign: '+', size: 1 },
  ]);
  assert.deepEqual(effectIcons({ health: 1.5 }), [{ stat: 'health', sign: '+', size: 1 }]);
  assert.deepEqual(effectIcons({}), []);
  assert.deepEqual(effectIcons(undefined), []);
});

test('새 이름 글: 한·영 짝', () => {
  for (const k of ['lifeN', 'birthSky', 'placeTitle', 'tokE0', 'tokU5', 'carried', 'speedName', 'skipX', 'autoX', 'more',
    'handTitle', 'handBaby', 'scrollTitle', 'strandTitle', 'peersX', 'crossTitle', 'campTitle', 'campWrite', 'campKeep', 'campOff',
    'campOn', 'flameTitle', 'knotTitle', 'untiedTitle', 'brightest', 'whyEnded', 'stillGoing', 'hundredTitle', 'hundredCap',
    'hundredCapNow', 'gainedX', 'noteNext', 'noteEnd', 'toBeads', 'beadsTitle', 'beadsSoFar', 'journeyOn', 'keepLiving', 'statX']) {
    assert.ok(tt('ko', k) !== undefined && tt('en', k) !== undefined, k);
  }
});
```
(`i18n.test.mjs`에 이미 `import test`·`assert`가 있으면 다시 쓰지 않는다. `t`가 이미 import돼 있으면 `tt` 대신 그것을 쓴다.)

`docs/past-life/test/soul.test.mjs` 끝에 더한다(파일 안에 이미 있는 유효한 영혼 만들기 도우미를 쓴다. 이름이 다르면 그 이름으로 바꾼다):
```js
test('validSoul: 생의 구슬 문자열은 정해진 글자만', () => {
  const s = newSoul('B-1');
  const life = createLife({ birth: s.next, traces: [] });
  while (advance(life, []).type !== 'death');
  finishLife(s, life, { beads: '01234abcdeABCDE' });
  assert.ok(validSoul(JSON.parse(JSON.stringify(s))));
  s.lives[0].beads = '01x';
  assert.ok(!validSoul(JSON.parse(JSON.stringify(s))));
  s.lives[0].beads = '1'.repeat(122);
  assert.ok(!validSoul(JSON.parse(JSON.stringify(s))));
  delete s.lives[0].beads;
  assert.ok(validSoul(JSON.parse(JSON.stringify(s))));
});
```
(`newSoul`, `finishLife`, `validSoul`, `createLife`, `advance`를 파일 위에서 import하지 않았다면 한 줄 import에 더한다.)

- [ ] **Step 2: 실패 확인**

Run: `( cd D:/Users/admin/Desktop/indigame/docs/past-life && npm test )`
Expected: FAIL (`ageWord` 없음 등)

- [ ] **Step 3: `i18n.js`에 함수 더하기**

```js
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

// 효과를 아이콘으로 (글 대신): 몸·살림·곁·마음 순, 크기 1~3
const ICON_STATS = ['health', 'wealth', 'family', 'happy'];
export function effectIcons(effects) {
  const out = [];
  for (const k of ICON_STATS) {
    const v = effects && effects[k];
    if (!v) continue;
    const m = Math.abs(v);
    out.push({ stat: k, sign: v > 0 ? '+' : '\u2212', size: m >= 8 ? 3 : m >= 4 ? 2 : 1 });
  }
  return out;
}
```

- [ ] **Step 4: STR에 새 열쇠 더하기 (글은 그대로)**

`STR.ko`에 더한다:
```js
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
    campTitle: (a) => `${ageWord(a, 'ko')}의 모닥불`, campWrite: '적어 두기', campKeep: '그냥 지나가기',
    campPh: '한 줄 적어 두면 두루마리와 염주에 남아요', campOff: '다음부터 모닥불 건너뛰기', campOn: '모닥불 다시 켜기',
    flameTitle: '불씨가 떠나요', flameLine: (a, cause) => `${ageWord(a, 'ko')} · ${cause}`,
    knotTitle: '매듭', untiedTitle: '매듭짓지 않은 실', brightest: '가장 빛난 구슬', whyEnded: '떠난 까닭', stillGoing: '지금도 이어지는 중',
    hundredTitle: '백 가닥', hundredCap: (n) => `백 명 가운데 ${n}명보다 오래 살았어요`, hundredCapNow: (n) => `백 명 가운데 ${n}명이 이 나이까지 살아요`,
    gainedX: '얻은 흔적', noteNext: '다음 생에 보내는 쪽지', noteEnd: '쪽지 (염주에 남아요)',
    toBeads: '영혼의 염주 보기', beadsTitle: '영혼의 염주', beadsSoFar: '지금까지의 염주', journeyOn: '여정은 아직 이어지고 있어요.',
    keepLiving: '이어서 살기', settings: '설정',
```
`STR.en`에 더한다:
```js
    // Screen rework (2026-10-20): bead thread, card hand, the flame
    lifeN: (n) => `Life ${n}`, practiceBadge: 'Practice', birthSky: 'One of 117 billion births',
    birthAgain: (g) => (!(g > 1) ? 'Straight back, again' : `${g.toLocaleString('en-US')} years later, again`),
    placeTitle: 'Where you begin', tokE0: 'Typical lifespan', tokU5: 'Past five', carried: 'Carried from before',
    statX: { health: 'Body', wealth: 'Means', family: 'Kin', happy: 'Heart' },
    speedName: { slow: 'Slow', normal: 'Normal', fast: 'Fast', fastest: 'Fastest' }, sundial: 'Sundial',
    skipX: 'To the next crossroads ›', autoX: 'Let the soul choose', more: 'More',
    handTitle: "This year's card", handBaby: 'Too young to hold a card yet.', handHint: 'Change it any time. If you don\u2019t, the most urgent card is played for you.', handAuto: 'Auto',
    scrollTitle: 'The scroll', scrollOpen: 'Open', scrollClose: 'Close',
    strandTitle: 'Bead thread', strandAria: (n, best) => `${n} beads, brightest at ${best}`, peersX: 'Born with you',
    crossTitle: (title) => `Crossroads · ${title}`, crossAuto: (s) => `Taking \u201c${s}\u201d in a moment · tap to stop`, luckX: 'Up to luck',
    campTitle: (a) => `Campfire at ${a}`, campWrite: 'Write it down', campKeep: 'Keep going',
    campPh: 'One line is kept in the scroll and on the beads', campOff: 'Skip campfires from now on', campOn: 'Turn campfires back on',
    flameTitle: 'The flame leaves', flameLine: (a, cause) => `${a} · ${cause}`,
    knotTitle: 'The knot', untiedTitle: 'An untied thread', brightest: 'Brightest bead', whyEnded: 'Why it ended', stillGoing: 'Still going',
    hundredTitle: 'A hundred threads', hundredCap: (n) => `Outlived ${n} of a hundred`, hundredCapNow: (n) => `${n} of a hundred live this long`,
    gainedX: 'Traces gained', noteNext: 'A note to the next life', noteEnd: 'A note (kept on the beads)',
    toBeads: "See the soul's beads", beadsTitle: "The soul's beads", beadsSoFar: 'Beads so far', journeyOn: 'The journey goes on.',
    keepLiving: 'Keep living', settings: 'Settings',
```
(`t(lang, key, …args)`가 함수 값이면 부르고, 객체 값이면 그대로 돌려주는지 확인한다. 객체를 돌려주지 않으면 `statX`·`speedName`은 `t(L,'statX')[k]` 대신 STR를 직접 읽는 작은 도우미 `tx(lang, key, sub)`를 더한다.)

- [ ] **Step 5: `soul.js`의 `okLife`에 구슬 조건**

```js
import { BEADS_RE } from './beads.js';
```
그리고 `okLife` 끝의 `&& (l.note == null || typeof l.note === 'string')` 뒤에 더한다:
```js
  && (l.beads == null || (typeof l.beads === 'string' && l.beads.length <= 121 && BEADS_RE.test(l.beads)))
```

- [ ] **Step 6: 통과 확인**

Run: `( cd D:/Users/admin/Desktop/indigame/docs/past-life && npm test )`
Expected: PASS, 시험 100개. 게임은 아직 옛 화면 그대로 돈다(옛 열쇠를 지우지 않았으니).

---

### Task 4: 2D 그림 (`strand.js`) · 3D 마을 더하기

**Files:**
- Create: `docs/past-life/strand.js`, `docs/past-life/strand-test.html`
- Modify: `docs/past-life/village.js`

**Interfaces:**
- Consumes: `MOOD_COLORS`, `decodeBeads` (작업 1); peers `{birth, death:{age, present?}}`.
- Produces (`strand.js`, 모두 순수 그리기 · 반환값은 누르기 판정용 좌표):
  - `fit(cv) → {g, w, h}`: CSS 크기 × 픽셀 비율(최대 2)로 맞추고 지운다
  - `drawThread(cv, {beads, peers, age, fresh, offset}) → {beads: [{x, y, r, age}], peers: [{x1, x2, y, i}], maxOffset}`
    - fresh 0~1: 새 구슬 꿰기 진행
    - offset ≥ 0: 오른쪽 끝에서 앞의 해 쪽으로 민 픽셀
  - `drawKnot(cv, beads, {open}) → void`: 호로 놓인 실 + 금 매듭(또는 열린 끝)
  - `drawHundred(cv, hundred) → void`
  - `drawRosary(cv, lives, {ended}) → [{x, y, i}]`
    - lives: `[{years, beads(string|undefined)}]`
    - 반환: 메달 자리
  - `drawBirthSky(cv, t, {seed}) → {x, y}`: t 0~1이고, 반환은 뽑힌 구슬 자리
- Produces (`village.js` 반환 객체에 더하기):
  - `setCampfire(on, ghost)`
  - `flameRise() → Promise<void>`: fast면 바로 resolve
  - `setView({lift})`: 0~0.3

- [ ] **Step 1: `strand.js` 쓰기**

```js
// 2D 그림 (화면 다시 기획 4.5): 구슬 실 · 동갑내기 실 · 매듭 · 백 가닥 · 염주 · 탄생 하늘
import { MOOD_COLORS, decodeBeads } from './beads.js';

const GOLD = '#e2b65e', THREAD = '#b8904a', PEER = 'rgba(214,206,186,.55)';
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function fit(cv) {
  const r = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth || 1, h = cv.clientHeight || 1;
  const W = Math.round(w * r), H = Math.round(h * r);
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const g = cv.getContext('2d');
  g.setTransform(r, 0, 0, r, 0, 0); g.clearRect(0, 0, w, h);
  return { g, w, h };
}

function shade(hex, k) {   // k<0 어둡게, k>0 밝게
  const n = parseInt(hex.slice(1), 16), f = (c) => clamp(Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k), 0, 255);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
function starPath(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  g.closePath();
}
// 구슬 한 알: 유리알(빛 점 + 테), 별, 금
export function bead(g, x, y, r, b, glow = 0) {
  const c = MOOD_COLORS[b.mood];
  g.save();
  if (glow) { g.shadowColor = GOLD; g.shadowBlur = 14 * glow; }
  const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  gr.addColorStop(0, shade(c, 0.75)); gr.addColorStop(0.45, c); gr.addColorStop(1, shade(c, -0.4));
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.restore();
  g.strokeStyle = 'rgba(40,30,10,.35)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, r, 0, TAU); g.stroke();
  if (b.star) { starPath(g, x, y, r * 0.5); g.fillStyle = '#fff7da'; g.fill(); }
  if (b.crack) {
    g.strokeStyle = 'rgba(45,25,15,.85)'; g.lineWidth = Math.max(1, r * 0.13);
    g.beginPath(); g.moveTo(x - r * 0.55, y - r * 0.25); g.lineTo(x - r * 0.1, y + r * 0.1); g.lineTo(x + r * 0.12, y - r * 0.2); g.lineTo(x + r * 0.55, y + r * 0.3); g.stroke();
  }
}
function knot(g, x, y, s) {   // 작은 금 매듭
  g.strokeStyle = GOLD; g.lineWidth = Math.max(1.2, s * 0.22);
  for (const [dx, dy] of [[-0.5, 0], [0.5, 0], [0, -0.5]]) { g.beginPath(); g.arc(x + dx * s, y + dy * s, s * 0.45, 0, TAU); g.stroke(); }
}

// 해가 흐르는 화면 아래: 동갑내기 실 네 가닥 + 구슬 실. 구슬은 오른쪽 끝(최근)에 맞추고, 넘치면 옆으로 민다
export function drawThread(cv, { beads, peers = [], age, fresh = 1, offset = 0 }) {
  const { g, w, h } = fit(cv);
  const n = beads.length, pad = 16;
  const r = clamp((w - pad * 2) / (Math.max(n, 12) * 2.3), 5, 11), gap = r * 2.3;
  const total = n * gap, maxOffset = Math.max(0, total - (w - pad * 2));
  const off = clamp(offset, 0, maxOffset);
  const xOf = (i) => w - pad - r - (n - 1 - i) * gap + off;
  const y = h - r - 10;
  // 실
  g.strokeStyle = THREAD; g.lineWidth = 2; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
  // 동갑내기: 나와 같이 자라고, 떠난 나이에서 매듭
  const outP = [];
  peers.forEach((p, i) => {
    const py = h - r * 2 - 22 - i * 7, end = Math.min(age, p.death.age);
    const x1 = Math.max(0, xOf(0)), x2 = xOf(Math.min(end, n - 1));
    g.strokeStyle = PEER; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x1, py); g.lineTo(x2, py); g.stroke();
    if (p.death.age < age && !p.death.present) knot(g, x2, py, 4);
    outP.push({ x1, x2, y: py, i });
  });
  // 구슬
  const out = [];
  for (let i = 0; i < n; i++) {
    let x = xOf(i), rr = r;
    if (x < -r || x > w + r) continue;
    if (i === n - 1 && fresh < 1) { x += (1 - fresh) * gap * 1.5; rr = r * (0.4 + 0.6 * fresh); }
    bead(g, x, y, rr, beads[i], i === n - 1 ? 1 : 0);
    out.push({ x, y, r: rr, age: beads[i].age });
  }
  return { beads: out, peers: outP, maxOffset };
}

// 매듭 화면: 호로 놓인 이 생의 구슬과 끝 매듭 (open 이면 열린 끝이 빛난다)
export function drawKnot(cv, beads, { open = false } = {}) {
  const { g, w, h } = fit(cv);
  const P0 = [w * 0.06, h * 0.3], P1 = [w * 0.38, h * 1.02], P2 = [w * 0.86, h * 0.62];
  const q = (t) => [0, 1].map((k) => (1 - t) * (1 - t) * P0[k] + 2 * (1 - t) * t * P1[k] + t * t * P2[k]);
  g.strokeStyle = THREAD; g.lineWidth = 2; g.beginPath();
  for (let i = 0; i <= 60; i++) { const [x, y] = q(i / 60); i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.stroke();
  const n = Math.max(1, beads.length), r = clamp((w * 0.95) / (n * 2.4), 3.5, 12);
  beads.forEach((b, i) => { const [x, y] = q(n === 1 ? 0.95 : 0.04 + (0.9 * i) / (n - 1)); bead(g, x, y, r, b); });
  const [ex, ey] = q(1);
  if (open) { g.save(); g.shadowColor = GOLD; g.shadowBlur = 18; g.fillStyle = '#fff3c8'; g.beginPath(); g.arc(ex, ey, 4, 0, TAU); g.fill(); g.restore(); }
  else { knot(g, ex, ey, 9); g.strokeStyle = GOLD; g.lineWidth = 2; g.beginPath(); g.moveTo(ex, ey + 6); g.lineTo(ex - 6, ey + 26); g.moveTo(ex, ey + 6); g.lineTo(ex + 6, ey + 26); g.stroke(); }
}

// 백 가닥: 위 막대에 매단 실 백 개, 길이 = 산 햇수, 내 실은 금색
export function drawHundred(cv, { lengths, mine }) {
  const { g, w, h } = fit(cv);
  const top = 14, x0 = 12, step = (w - 24) / 99, k = (h - top - 16) / 110;
  g.strokeStyle = THREAD; g.lineWidth = 3; g.beginPath(); g.moveTo(x0 - 6, top); g.lineTo(w - x0 + 6, top); g.stroke();
  lengths.forEach((L, i) => {
    const x = x0 + i * step, y = top + Math.max(2, L * k), me = i === mine;
    g.strokeStyle = me ? GOLD : 'rgba(225,222,240,.5)'; g.lineWidth = me ? 2.2 : 1;
    g.beginPath(); g.moveTo(x, top); g.lineTo(x, y); g.stroke();
    g.fillStyle = me ? GOLD : 'rgba(225,222,240,.7)'; g.beginPath(); g.arc(x, y, me ? 3.4 : 1.6, 0, TAU); g.fill();
  });
}

// 영혼의 염주: 생마다 실 한 가닥(길이 ∝ 산 햇수, 가장 짧아도 6%), 사이에 금 매듭. 메달 자리를 돌려준다
export function drawRosary(cv, lives, { ended = true } = {}) {
  const { g, w, h } = fit(cv);
  const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.38;
  const yrs = lives.map((l) => Math.max(1, l.years + 1)), sum = yrs.reduce((a, b) => a + b, 0) || 1;
  const share = yrs.map((y) => Math.max(0.06, y / sum)), room = ended ? 1 : 0.88, tot = share.reduce((a, b) => a + b, 0);
  let a0 = -Math.PI / 2;
  const medals = [];
  g.strokeStyle = THREAD; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + TAU * room); g.stroke();
  lives.forEach((l, i) => {
    const span = (share[i] / tot) * TAU * room, arc = span * R;
    const bs = l.beads ? decodeBeads(l.beads) : Array.from({ length: yrs[i] }, (_, a) => ({ age: a, mood: 2, star: false, crack: false }));
    const r = clamp(Math.min(R * 0.07, arc / Math.max(4, bs.length) / 2.3), 3, R * 0.07), fitN = Math.max(1, Math.floor(arc / (r * 2.3)));
    for (let k = 0; k < fitN; k++) {
      const b = bs[Math.floor((k * bs.length) / fitN)], a = a0 + (span * (k + 0.5)) / fitN;
      bead(g, cx + Math.cos(a) * R, cy + Math.sin(a) * R, r, b);
    }
    knot(g, cx + Math.cos(a0) * R, cy + Math.sin(a0) * R, 6);
    const am = a0 + span / 2;
    medals.push({ x: cx + Math.cos(am) * (R + R * 0.28), y: cy + Math.sin(am) * (R + R * 0.28), i });
    a0 += span;
  });
  if (!ended) { g.setLineDash([3, 5]); g.strokeStyle = 'rgba(226,182,94,.5)'; g.beginPath(); g.arc(cx, cy, R, a0, -Math.PI / 2 + TAU); g.stroke(); g.setLineDash([]); }
  return medals;
}

// 탄생 하늘: 구슬 빛 수천 개(지금까지의 탄생), 불씨가 내려와 한 알을 고른다. t 0~1
export function drawBirthSky(cv, t, { seed = 1 } = {}) {
  const { g, w, h } = fit(cv);
  const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#0b0c22'); bg.addColorStop(1, '#1b1d44');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  let s = (seed >>> 0) || 1; const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const N = Math.round((w * h) / 260);
  for (let i = 0; i < N; i++) {
    const x = rnd() * w, y = rnd() * h, z = rnd(), tw = 0.5 + 0.5 * Math.sin(t * 6 + i);
    g.fillStyle = `rgba(${z > 0.7 ? '242,193,78' : '200,210,255'},${(0.15 + 0.45 * z) * (0.7 + 0.3 * tw)})`;
    g.beginPath(); g.arc(x, y, 0.4 + z * 1.6, 0, TAU); g.fill();
  }
  const tx = w * 0.5, ty = h * 0.4, k = clamp(t / 0.7, 0, 1), fy = h * 0.04 + (ty - h * 0.04) * (1 - (1 - k) * (1 - k));
  g.save(); g.shadowColor = '#fff'; g.shadowBlur = 16; g.fillStyle = '#f4f6ff';
  g.beginPath(); g.ellipse(tx, fy - 6, 5, 9, 0, 0, TAU); g.fill(); g.restore();
  if (t > 0.7) { const p = clamp((t - 0.7) / 0.3, 0, 1); bead(g, tx, ty + 14, 6 + 10 * p, { mood: 4, star: false, crack: false }, p); }
  return { x: tx, y: ty + 14 };
}
```

- [ ] **Step 2: `strand-test.html` (확인용)**

`docs/past-life/strand-test.html`을 만든다. 파일 안에서 하는 일:
- 밤 배경에 캔버스 다섯 개(구슬 실 800×120, 매듭 600×300, 백 가닥 400×300, 염주 500×500, 탄생 하늘 600×340)를 놓는다.
- `<script type="module">`에서 `beads.js`·`strand.js`·`lifetable.js`를 import한다.
- 가짜 데이터로 그린다:
  - 구슬 60알: 마음은 사인 곡선으로 0~4, 10살마다 별, 23살에 금
  - 동갑내기 넷: 떠난 나이 3·40·70, 그리고 present 하나
  - `hundredThreads(shapeFor(7, 'europe'), 'X', 51)`
  - 염주 4생: years 41·58·0·42, 하나는 beads 없음
  - 탄생 하늘 t=1
- `drawThread`의 `fresh`를 0→1로 1초 동안 움직인다.

- [ ] **Step 3: `village.js`에 더하기**

`createVillage` 안에서 다음 셋을 만든다. 반환 객체에도 넣는다.
- `setCampfire(on, ghost)`
  - 처음 부를 때 `campfire` 그룹을 만든다. 장작 원기둥 셋을 엇갈려 놓고, 불꽃 원뿔 둘을 둔다(`MeshBasicMaterial` 주황 `#ff9a3c`와 노랑 `#ffd36b`, 반투명). 주황 점광원은 강도 2, 거리 6이다.
  - 그룹은 섬 가운데에서 내 사람(`you`)과 가까운 빈 바닥에 놓는다(`you.position` 기준 1.2칸 옆).
  - `ghost`면 푸른 불씨를 더한다. 반투명 `#8fc7ff` 구(반지름 0.18)와 원뿔 몸(높이 0.5)을 겹치고, 불 건너편에 둔다. 매 프레임 위아래로 0.08씩, 3초 주기로 떠오른다.
  - 불꽃은 매 프레임 크기를 `1 + 0.12 * sin(t * 9)`로 흔든다.
  - `on=false`면 그룹을 숨긴다(지우지 않음).
- `flameRise()`
  - `you` 머리 위에서 하얀 발광 방울(반지름 0.12, `#ffffff`, `transparent`)을 만든다.
  - 1.6초 동안 y를 +4 올리면서 투명도 1→0으로 줄인 뒤 지운다.
  - Promise로 돌려준다. `st.fast`이거나 `matchMedia('(prefers-reduced-motion: reduce)').matches`면 바로 resolve한다.
- `setView({ lift = 0 })`: `frame()`의 `camera.lookAt(0, FOCUS_Y, 0)`을 `camera.lookAt(0, FOCUS_Y - lift * FIT_HALF * 1.6, 0)`으로 바꾸고, 카메라 위치의 y도 같은 만큼 내려서 섬이 화면 위쪽에 오게 한다. lift는 0~0.3으로 자른다.
- `setLife`로 마을을 다시 지을 때 모닥불·불씨는 숨긴다. 지오메트리를 지울 때는 지금의 `clear()` 규칙(KayKit이 아닌 것만 dispose)을 따른다.

- [ ] **Step 4: 화면 확인**

1. 서버를 띄우고 `http://127.0.0.1:8780/strand-test.html`을 열어 스크린샷 `id4_strand.png`를 찍는다.
   - 구슬이 유리알처럼 보인다.
   - 별·금이 보인다.
   - 동갑내기 매듭이 떠난 자리에 있다.
   - 백 가닥 가운데 하나가 금색이다.
   - 염주 메달 자리가 고리 바깥에 있다.
   - 콘솔 오류가 0이다.
2. `http://127.0.0.1:8780/village-test.html`(Task 11의 마을 확인 쪽)에서 콘솔로 다음을 불러 각각 스크린샷을 찍는다.
   - `v.setCampfire(true, true)` → `id4_campfire.png`
   - `v.flameRise()` 도중 → `id4_flame.png`
   - `v.setView({lift: 0.2})` → `id4_view.png`
   - 마을 확인 쪽에서 village 객체 이름이 다르면 그 이름을 쓴다.
3. `( cd D:/Users/admin/Desktop/indigame/docs/past-life && npm test )` → 시험 100개가 그대로 통과한다.

---

### Task 5: 해가 흐르는 화면 · 갈림길 · 모닥불

**Files:**
- Modify: `docs/past-life/index.html` (`#app` 부분과 CSS), `docs/past-life/ui.js` (`showApp`, `update`, `decision`, `pause`, 그 도우미), `docs/past-life/main.js` (속도·모닥불)

**Interfaces:**
- Consumes:
  - 작업 1: `beadsOf`, `pips`
  - 작업 3: `ageWord`, `effectIcons`, 새 STR 열쇠
  - 작업 4: `drawThread`, `village.setCampfire`, `village.setView`
  - 지금 있는 것: `focusName`, `FOCI`, `FOCUS_EFFECT`, `focusStage`, `peerLine`, `choiceHint`, `traceText`, `PAUSE_Q`, `survivalTo`, `shapeFor`
- Produces:
  - `ui.update(life, peers, state)`: `state.speed`는 `'slow'|'normal'|'fast'|'fastest'`
  - 핸들러 `speed(id)`에 이 id를 넘긴다
  - `ui.decision`·`ui.pause`의 돌려주는 값은 지금과 같다(`index`, `{note, off}`)

이 작업은 화면 코드라 노드 시험 대신 브라우저 확인으로 닫는다. 아래 규칙을 지키고, 시안 그림 `docs/concept-images/27-past-life-identity/s2-living.png`, `s3-crossroads.png`, `s4-campfire.png`, `s7-phone.png`를 보고 맞춘다(그림 속 마을은 우리 KayKit 마을로 대신한다).

- [ ] **Step 1: `index.html`의 `#app`을 다음 뼈대로 바꾼다 (id는 그대로 쓴다)**

```html
<div id="app" hidden>
  <div class="stage"><canvas id="c"></canvas><p id="no3d" class="no3d" data-t="noVillage" hidden></p></div>
  <header class="hud-who">
    <div class="soulbadge"><svg class="i-flame" aria-hidden="true"><use href="#i-flame"/></svg>
      <span id="lifeN"></span><b id="age">0</b><span data-t="unit"></span><span id="when" class="when"></span></div>
    <ul id="statPips" class="stats" aria-label=""></ul>
  </header>
  <nav class="sundial" aria-label="">
    <button id="bPlay"></button>
    <span id="speeds" class="speeds"><button data-speed="slow"></button><button data-speed="normal"></button><button data-speed="fast"></button><button data-speed="fastest"></button></span>
    <button id="bSkip"></button><button id="bAuto" aria-pressed="false"></button>
    <button id="bMore" aria-expanded="false"></button>
    <div id="moreMenu" class="menu" hidden><button id="bSound"></button><button id="bLang"></button><button id="bExit"></button></div>
  </nav>
  <aside class="scroll" id="scroll"><button id="bScroll" class="handle"><b data-t="scrollTitle"></b></button><ol id="journal" class="journal"></ol></aside>
  <section class="hand"><h3 data-t="handTitle"></h3><div id="focusBox"></div></section>
  <footer class="thread"><canvas id="strand" role="img"></canvas><div id="beadTip" class="tip" hidden></div></footer>
</div>
```
- `<body>` 맨 위에 숨긴 `<svg width="0" height="0" style="position:absolute">`를 두고, 그 안에 `<symbol>` 아이콘을 넣는다.
  - 상태: `i-flame`, `i-heart`(몸), `i-sack`(살림), `i-people`(곁), `i-sun`(마음)
  - 올해의 패: `i-hammer`(일), `i-book`(배움), `i-house`(식구), `i-leaf`(몸), `i-moon`(쉼)
  - 그 밖: `i-sign`(이정표), `i-dial`(해시계)
  - 각 아이콘은 24×24 viewBox에 선 굵기 1.8로 단순하게 그린다.
- 옛 `#idBody`, `#statBars`, `#traceChips`, `#peerList`, `#lifeMap`, `.who .one`(1,170억 분의 1), `#prog` 칸은 지운다.
  - 흔적 칩은 배지 아래 작은 흔적 구슬 줄 `#traceBeads`로 옮긴다.
  - 진행 막대는 지운다(구슬 실이 대신한다).

- [ ] **Step 2: CSS (설계 5장)**

- **토큰:** `:root`에 `--night #121329`, `--paper #f6efe2`, `--ink #1d2140`, `--gold #e2b65e`, `--gold2 #a8770a`, `--trace #2a6894`, `--glass rgba(18,19,41,.55)`를 두고 HUD는 이 토큰만 쓴다.
- **데스크톱(> 900px):**
  - `.stage`는 `position:fixed; inset:0`이다. 캔버스는 부모를 꽉 채운다(마을은 ResizeObserver로 부모를 따른다).
  - HUD는 `position:fixed`이고, 안전 영역을 더한 여백 16px를 둔다.
  - `.hud-who`는 왼쪽 위, `.sundial`은 오른쪽 위에 둔다.
  - `.scroll`은 오른쪽 가운데에 둔다(폭 300px, 최대 높이 50vh, 안에서 스크롤). 종이 질감은 `--paper` 바탕에 옅은 그라데이션, 금테 1px로 낸다.
  - `.hand`는 오른쪽 아래, `.thread` 위에 둔다. 카드 다섯 장은 각 64×88이고, 고른 카드는 `translateY(-10px)`에 금테를 단다.
  - `.thread`는 아래쪽 전체 폭, 높이 120px이다.
- **폰(≤ 900px):** `.stage`를 문서 흐름 안에 `height: 40svh`로 두고, HUD는 차례로 쌓는다. 순서는 위 줄(배지·해시계 단추) → 마을 → 상태 넷(한 줄) → 구슬 실(높이 96px) → 올해의 패(한 줄, 카드 각 너비 18%) → 두루마리 시트(아래 붙음)다.
  - 해시계는 `#bPlay`와 `#bMore`만 보인다. `#bMore`를 누르면 `#moreMenu`가 펼쳐지고, 그 안에 속도 넷·다음 갈림길까지·맡기기·소리·말·나가기가 다 들어간다.
  - 두루마리 시트는 접힌 상태에서 최근 두 줄만 보인다(최대 높이 92px). `#bScroll`로 펼치면 60svh가 된다.
- 가로 스크롤 0. 글자 줄은 `word-break: keep-all`.
- 상태 넷의 각 줄은 `<li data-k="health"><svg><use href="#i-heart"/></svg><span class="lbl">몸</span><i></i><i></i><i></i><i></i><i></i></li>`이다. `<i>`는 반 칸이면 `class="half"`, 한 칸이면 `class="on"`이다.
- 값이 바뀐 해에는 그 줄에 `<em class="delta up|down">＋</em>`를 1초 띄운다. reduced-motion이면 띄우지 않는다.

- [ ] **Step 3: `ui.js` – `showApp`/`update`**

- `showApp(life, peers, state)`
  - 옛 기록·지도를 비운다.
  - `village.setView`는 main이 부른다. 데스크톱 lift는 0.18, 폰은 0이다.
  - 구슬 실 캔버스에 포인터를 단다.
    - 누르거나 가리키면 가장 가까운 구슬(반지름 1.5배 안)의 나이를 찾는다. 그 나이의 `life.journal` 줄들을 `#beadTip`에 띄운다. 첫 줄 머리는 「17살」이다.
    - 옆으로 끌면 `offset`이 바뀐다(`drawThread`의 `maxOffset` 안).
    - 동갑내기 실을 누르면 `peerLine(p, life.age, L)`을 띄운다.
- `update(life, peers, state)`
  - 배지: `lifeN`(연습판은 `practiceBadge`), 나이, `when`(`fmtYear(year) · 땅 짧은 이름`).
  - 상태 넷 반 칸: `pips(life.stats[k])`. 지난번 값과 다르면 ＋/－ 표시.
  - 해시계: 멈춤이면 `bPlay` 글은 `resume`, 아니면 `pause`. 속도 단추 `aria-pressed`, `bAuto` `aria-pressed`, `bSkip`.
  - 올해의 패: 지금의 `focusKey` 규칙(바뀔 때만 다시 그림)을 그대로 지킨다.
    - 여섯 살 전이면 `handBaby` 한 줄만 보인다.
    - 그 뒤에는 카드 다섯 장 + 「저절로」 작은 단추를 보인다. 카드 하나는 아이콘, `focusName(id, age, L)`, `effectIcons(FOCUS_EFFECT[id][stage])`를 작은 아이콘 ＋/－로 담는다.
    - 카드의 `title`·`aria-label`은 `effectHint` 글이다.
  - 두루마리: 지금의 일기 줄 추가 규칙을 그대로 쓴다(최근이 위). 줄 머리는 `${age}살`이다.
    - `decision` 줄 앞에는 작은 별 구슬 `<i class="mk star">`를 단다.
    - `event` 줄 앞에는 금 간 구슬 `<i class="mk crack">`을 단다.
  - 구슬 실: `drawThread($('strand'), { beads: beadsOf(life), peers, age: life.age, fresh, offset })`.
    - `fresh`는 새 해가 들어온 뒤 0.3초 동안 0→1로 `requestAnimationFrame`에서 움직인다(reduced-motion이나 `fast`면 1).
    - 캔버스 `aria-label`은 `strandAria(구슬 수, 가장 빛난 해)`다.
  - 창 크기가 바뀌면 다시 그린다.

- [ ] **Step 4: `ui.js` – 갈림길 `decision(card, life, {badge, autoIndex, auto})`**

- `#modal`에 다음을 담는다: 배경 흐림(`backdrop-filter: blur(3px)` + 어둡게), 가운데 종이 카드.
  - 맨 위 이정표 엠블럼 `i-sign`
  - `ageWord(age, L) · fmtYear(year)`
  - 제목 `crossTitle(카드 제목)`, 본문, 근거 한 줄(있으면 작게)
  - 길 줄 2~3개
    - `<button class="path" data-i>`: 번호 동그라미, 선택지 글, `effectIcons(choice.effects)` 아이콘들
    - 확률 길이면 `luckX` 작은 글
    - 흔적이 맞는 길(`badge && badge.i === i`, 지금 코드의 흔적 표시 규칙 그대로)에는 `<i class="trace-bead" title="흔적 이름">`을 단다
  - 아래 `autoX` 단추(누르면 핸들러 `auto(true)` + 지금 길을 `autoIndex`로 고름)
- 맡긴 상태(`auto`)에서는 카드 테두리를 따라 금빛이 차오르는 3초 기다림을 보인다(`crossAuto` 글). 누르면 멈춘다. 지금 코드의 자동 결정 기다림·멈춤 규칙과 시간은 그대로다.
- 키보드 1·2·3, 고르면 `Promise<index>`.

- [ ] **Step 5: `ui.js` – 모닥불 `pause(life, {peers, prev})`, `main.js` 연결**

- `main.js`:
  - `ui.pause` 앞에서 `village.setPhase('dusk'); village.setCampfire(true, !!prev);`를 부른다.
  - 끝난 뒤 `village.setCampfire(false); village.setPhase(phaseOf(life.age));`를 부른다.
- 판(데스크톱은 화면 오른쪽 세로 가운데, 폰은 아래 시트)에 담는 것:
  - `campTitle(age)`
  - 앞 생 줄(지금의 `prevDead`/`prevAlive`, 첫 생이면 지금의 `pauseStat` 통계 줄)
  - 질문 `PAUSE_Q[age][L]`(크게)
  - `textarea`(placeholder `campPh`)
  - `campWrite`(금색)와 `campKeep`(테두리) 단추, 작은 체크 `campOff`
  - 돌려주는 값은 지금과 같은 `{note, off}`다.
- `main.js` 속도:
  - `YEAR_MS = { slow: 16000, normal: 8000, fast: 3000, fastest: 1000 }`, `S.speed = 'normal'`(처음).
  - 핸들러 `speed(id)`.
  - `showApp` 뒤에 `village.setView({ lift: matchMedia('(min-width: 901px)').matches ? 0.18 : 0 })`를 부르고, 창 크기가 바뀔 때도 다시 부른다.
- 키보드: 스페이스로 멈춤/계속(입력 칸에 포커스가 있을 때는 빼고). 1·2·3은 갈림길에서만 받는다.

- [ ] **Step 6: 확인**

1. `( cd D:/Users/admin/Desktop/indigame/docs/past-life && npm test )` → 시험 100개가 통과한다.
2. 서버를 띄우고 두 크기로 확인해 각각 스크린샷을 찍는다.
   - 1280×800 `?seed=ID5`로 판을 시작한다.
     - 해가 흐르는 화면(서너 살, 열일곱 살쯤): `id5_living.png`
     - 갈림길: `id5_cross.png`
     - 다섯 살 모닥불: `id5_camp.png`
   - 390×844 같은 시드: `id5_phone.png`, `id5_phone_cross.png`, `id5_phone_more.png`(펼친 해시계 메뉴)
   - 영어로 바꿔 한 장: `id5_en.png`
3. `?auto=1&fast=1`로 한 생이 끝까지 가는지 본다. 콘솔 오류는 0이어야 한다(매듭·염주는 작업 6 전이라 옛 화면이어도 된다).
4. 폰 크기에서 `document.documentElement.scrollWidth <= innerWidth`를 확인한다.
5. 브라우저를 닫고 서버를 멈춘다.

---

### Task 6: 시작 · 탄생 · 불씨 · 매듭 · 염주 · 도감 · 나누기 · 옛 이름 지우기

**Files:**
- Modify: `docs/past-life/ui.js` (`title`, `birthIntro`, `birthRecord`, `lastYear`, `deathRecord`, `lineage`, `dex`, `share`/`shareText`/`shareImage`), `docs/past-life/index.html` (CSS·`#intro`), `docs/past-life/main.js`, `docs/past-life/i18n.js` (옛 열쇠 지우기)
- Test: `docs/past-life/test/i18n.test.mjs` (레퍼런스 이름 금지 시험)

**Interfaces:**
- Consumes:
  - 작업 1: `beadsOf`, `encodeBeads`, `hundredThreads`
  - 작업 2: `epitaphOf`
  - 작업 3: 새 STR 열쇠
  - 작업 4: `drawBirthSky`, `drawKnot`, `drawHundred`, `drawRosary`, `village.flameRise`
  - 지금 있는 것: `summarize`, `epilogueText`, `peerLine`, `traceText`, `causeName`, `lifeStats`, `shapeFor`, `survivalTo`, `fmtYear`, `birthLine`
- Produces:
  - `ui.title(opts)`는 지금 액션(`'continue'|'newsoul'|'lineage'|'dex'`)을 그대로 돌려준다
  - `opts.onCampOn` 콜백을 더한다
  - `soul.lives[i].beads`가 저장된다

- [ ] **Step 1: 금지 이름 시험 쓰기**

`docs/past-life/test/i18n.test.mjs` 끝에 더한다:
```js
import { readFileSync } from 'node:fs';

test('화면 글에 레퍼런스 이름이 남지 않는다', () => {
  const BAN = ['1,170억 분의 1', '출생 기록', '사망 기록', '인생 지도', '생존 곡선', '올해의 초점', '인생 기록', '중대 결정',
    '다음 결정까지', '자동 결정', '잠시 멈춤', '같은 해 태어난 사람들', '마지막 해', '영혼 족보',
    'One in 117 billion', 'Record of birth', 'Record of death', 'Life map', 'Survival curve', 'Next decision', 'Auto-decide'];
  const here = new URL('..', import.meta.url);
  for (const f of ['i18n.js', 'ui.js', 'index.html', 'main.js']) {
    const src = readFileSync(new URL(f, here), 'utf8').replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const b of BAN) assert.ok(!src.includes(b), `${f}: ${b}`);
  }
});
```

- [ ] **Step 2: 실패 확인**

Run: `( cd D:/Users/admin/Desktop/indigame/docs/past-life && node --test test/i18n.test.mjs )`
Expected: FAIL (`i18n.js: 1,170억 분의 1` 등)

- [ ] **Step 3: 화면 만들기 (설계 3.1·3.2·3.6~3.10, 시안 s1·s5·s6)**

- **시작 `title`:**
  - `#screen`을 밤 배경으로 하고, 뒤에 `drawBirthSky(t=1)` 캔버스를 깐다. 제목 「한 영혼의 여정」.
  - 단추 순서:
    - 진행 중 영혼이 있으면 `keepLiving`
    - `newSoul`(지금의 두 번 누르기 확인 그대로)
    - 한 생 이상 끝냈으면 `beadsSoFar`(→ `'lineage'`)
    - `dex(n)`
  - 작은 설정 줄: 말·소리. 모닥불을 꺼 두었으면 `campOn`(→ `opts.onCampOn()`; main이 `S.pausesOff=false; store.savePauses(true)`).
  - 부제·출처 글은 지금 것을 쓴다(부제의 「1,170억 명」 문장은 그대로 둬도 된다. 금지 목록은 「1,170억 분의 1」뿐이다).
- **탄생 `birthIntro`:**
  - `#intro` 캔버스에 `drawBirthSky(cv, t, { seed: hash(birth.seed) })`를 2.6초 동안 그린다(`fast`면 바로 t=1). 누르면 건너뛴다.
  - 위 글은 첫 생이면 `birthSky`, 그 뒤면 `birthAgain(gap)`이다. 연습판도 `birthSky`다.
  - `hash`는 rng.js에서 한 줄로 import한다.
- **`birthRecord` → 이번 생의 자리 카드:**
  - 밤 배경 위 종이 카드, 금테. 제목 `placeTitle`.
  - 「1312년 · 잉글랜드」: `fmtYear` · 땅 짧은 이름.
  - 「대장간 집 둘째 딸」: 지금의 집안 이름 + `childOf`.
  - 긴 탄생 줄 `birthLine` 작게.
  - 토큰 둘: 촛불 아이콘 `tokE0` + e0 반올림, 방패 아이콘 `tokU5` + 다섯 살까지 살 확률(`survivalTo(sh, 5)` %).
  - 흔적이 있으면 `carried`와 흔적 구슬(이름 작게).
  - 단추 `born`.
  - 지금 출생 기록에 있던 동갑내기·그해 태어난 아기 수 칸은 빼도 된다(동갑내기는 해가 흐르는 화면의 실로 보인다).
- **`lastYear` → 불씨가 떠나요:**
  - `main.js`가 `ui.lastYear` 앞에 `const rise = life.death.present ? Promise.resolve() : village.flameRise();`를 부르고, `await Promise.all([rise, ui.lastYear(life)])`로 기다린다.
  - 화면은 투명 위 덮개다. 가운데에 `flameTitle`(present면 지금의 `presentLine`), 아래 `flameLine(age, causeName)`(present면 `presentTitle`), 「누르면 넘어가요」.
- **`deathRecord` → 매듭** (돌려주는 값 `{act, note}`와 단추 동작은 지금과 같다):
  - 왼쪽 위
    - `knotTitle`(present면 `untiedTitle`)
    - 「1312 – 1363 · 51살」: 지금 `spanText` + `age`
    - 묘비 한 줄 `epitaphOf(life, sum, L)`(기울인 바탕체)
  - 토큰 넷
    - `brightest`: `ageWord(sum.happiest)`, en은 `age N`
    - `whyEnded`: `causeName`. present면 `stillGoing`
    - `partner`: 지금 글 그대로
    - `kids`: `kidsN`
  - 왼쪽 큰 캔버스는 `drawKnot(cv, beadsOf(life), { open: !!d.present })`다.
  - 오른쪽은 `hundredTitle`과 캔버스 `drawHundred(cv, hundredThreads(sh, b.seed, d.age))`다. 캡션은 `hundredCap(outlived)`, present면 `hundredCapNow(reach)`.
  - 동갑내기는 `peersX` 제목 아래 네 줄 `peerLine(p, 999, L)`이다. present면 지금의 `peersAlive`, 아니면 `peersOut`.
  - 흔적: 쓰는 글은 `gainedX`/`noneGained`이고, 보이는 조건은 지금 규칙 그대로다.
  - 맺음말은 끝난 영혼일 때 `epilogueText`다.
  - 쪽지: 영혼이 있을 때만 보인다. 라벨은 `noteEnd`(끝난 영혼) 또는 `noteNext`이고, `toLifePh`도 쓴다.
  - 단추: `nextBtn` 또는 `toBeads`(끝난 영혼), 그리고 `share`, `toTitle`.
  - 배경은 밤, 종이 카드 없이 HUD 글 색. present도 밤 배경이고, 매듭 대신 열린 끝이다.
- **`lineage` → 영혼의 염주:**
  - 밤 배경, 정사각 캔버스(폭 최대 560px).
  - `drawRosary(cv, soul.lives.map((l) => ({ years: l.death.age, beads: l.beads })), { ended: soul.ended })`가 돌려준 자리에 메달을 놓는다. 메달은 `<button class="medal">`이고 안에 `thumb` 이미지를 둥글게 오린다(없으면 땅 짧은 이름 글자).
  - 메달 옆 작은 글은 「1312」, present면 「1984 – 지금」이다.
  - 가운데 `beadsTitle`, 아래는 끝났으면 `epilogueText(soul, L)`, 아니면 `journeyOn`.
  - 메달을 누르면 작은 카드가 뜬다. 내용은 `nth(i+1)`, 해·땅, 묘비 한 줄(`summarize`가 없으니 그 생의 death·birth로 `epitaphGroup`이 정해지게 `sum`에 `{ topFocus: l.topFocus || null }`를 넘긴다), 쪽지, 떠난 까닭이다.
  - 그래서 `main.js`의 `finishLife` extra에 `topFocus: sum.topFocus`도 함께 넣는다. 저장 검사(`okLife`)는 `topFocus`를 묻지 않으므로 그대로 통과한다.
  - 단추 `toTitle`, `newSoul`(두 번 누르기)는 지금 돌려주는 값 그대로다.
- **`dex` → 구슬 자리:** 칸 모양만 바꾼다. 모은 칸은 그 지역 색 구슬 + 횟수, 빈 칸은 점선 동그라미다. 제목은 `dexTitle` 그대로다.
- **나누기:**
  - `shareText`: 「한 영혼의 여정 · {lifeN} · {fmtYear} {땅} · {나이} · {사인 또는 stillGoing} · {묘비 한 줄}」.
  - `shareImage`(1080×1350): 위에 마을 그림, 가운데 `drawKnot`를 오프스크린 캔버스(900×360)에 그려 붙이고, 아래 글 두 줄.
- **`main.js`:**
  - `finishLife(soul, life, { thumb, beads: encodeBeads(beadsOf(life)), topFocus: sum.topFocus })`. `sum` 계산을 `finishLife` 앞으로 옮긴다.
  - `ui.title`에 `onCampOn`을 넘긴다.
  - 액션 `'continue'`가 들어오면 지금처럼 이어서 산다(지금 코드가 쓰는 액션 이름을 따른다).

- [ ] **Step 4: 옛 열쇠 지우기**

- `i18n.js` STR ko·en에서 더 이상 쓰지 않는 열쇠를 지운다. 적어도 금지 목록 글을 담은 것이다: `oneIn`, `birthDoc`, `deathDoc`, `mapTitle`, `mapHint`, `survTitle`, `survHint`, `focusTitle`, `journal`, `decision`, `skip`, `auto`, `pauseTitle`, `peersTitle`, `lastYear`, `lineage`, `toLineage`, `lineageTitle`, `noteWrite`, `noteKeep`, `pauseOff`, `autoOn`, `autoIn`, `f_*` 칸 이름 중 안 쓰는 것.
- 쓰는 곳이 남았으면 새 열쇠로 바꾼다.
- `grep`으로 `t(L, '<열쇠>')` 쓰임이 0인지 확인한 뒤 지운다.
- 주석 속 옛 이름은 시험이 빼고 보지만, 보이는 글이 아니어도 헷갈리지 않게 새 이름으로 고친다.

- [ ] **Step 5: 확인**

1. `( cd D:/Users/admin/Desktop/indigame/docs/past-life && npm test )` → 시험 101개가 통과한다.
2. 1280×800과 390×844에서 `?seed=ID6`로 판을 시작해 다음을 스크린샷한다.
   - 시작: `id6_title.png`
   - 탄생 하늘: `id6_birth_sky.png`
   - 이번 생의 자리: `id6_place.png`
   - 불씨: `id6_flame.png`
   - 매듭: `id6_knot.png`
   - 폰 매듭: `id6_phone_knot.png`
3. 여정을 끝까지 간다. 「새 영혼」으로 시작해 `?auto=1&fast=1`로 돌리면서, 그 사이 `window.__pl`으로 상태를 본다.
   - 영혼의 염주: `id6_beads.png`
   - 폰 염주: `id6_phone_beads.png`
4. present 끝이 나오는 시드를 찾는다(노드에서 `newSoul` 몇 개를 돌려 찾고 그 영혼 id를 저장에 넣는다). 매듭짓지 않은 실 `id6_untied.png`를 찍는다.
5. 영어 매듭 `id6_knot_en.png`.
6. 콘솔 오류 0. 두 크기 모두 가로 스크롤 0.
7. 페이지 글(`document.body.innerText`)에 금지 이름이 없는지 확인한다.
8. 브라우저를 닫고 서버를 멈춘다.

---

### Task 7: 공유 빌드 · 문서

**Files:**
- Modify: `docs/past-life/build_share.py` (ORDER), `docs/reference-study-1in8b.md`, `docs/past-life/README.md`, `D:/Users/admin/Desktop/indigame/전생시뮬_공유/README.md`, `docs/ai-usage-log.md`
- 다시 만들기: `전생시뮬_공유/플레이/pastlife-play.html`, `docs/share/pastlife-play-artifact.html`

- [ ] **Step 1: ORDER**

`build_share.py`의 ORDER를 다음처럼 바꾼다.
- `'lifetable'` 바로 뒤에 `'beads'`를 넣는다(soul이 beads를 쓴다).
- `'i18n'` 뒤에 `'epitaphs', 'strand'`를 넣는다.
- 빌드의 의존 순서 검사가 통과해야 한다.

- [ ] **Step 2: 빌드와 확인**

Run: `( cd D:/Users/admin/Desktop/indigame/docs/past-life && PYTHONIOENCODING=utf-8 python build_share.py )`
Expected: 두 파일이 생기고 각 3 MB 이하다.

1. 공유 폴더를 서버로 띄우고 `http://127.0.0.1:8781/pastlife-play.html?auto=1&fast=1`에서 영혼 하나가 끝까지 가는지 본다. 콘솔 오류는 0이다.
2. file://로도 한 번 연다(`browser_run_code_unsafe`로 `page.goto('file:///…')`).
3. 스크린샷 `id7_share.png`, `id7_share_phone.png`를 찍는다.

- [ ] **Step 3: 문서**

- `docs/reference-study-1in8b.md` 「가져오는 것」 절 아래에 「2026-10-20 바꾼 모습」 단락을 더한다.
  - 흐름은 두고, 화면·이름·그래프를 구슬 실·카드 손패·불씨로 바꿨다고 쓴다.
  - 이름 사전과 설계 문서 `docs/superpowers/specs/2026-10-20-past-life-identity-design.md` 링크를 단다.
- `docs/past-life/README.md`: 화면 설명을 새 이름으로 고친다(파일 목록에 `beads.js`·`epitaphs.js`·`strand.js`·`strand-test.html`을 더한다).
- `전생시뮬_공유/README.md`의 플레이 줄 내용을 「구슬 실·카드 손패·불씨 화면」으로 고치고, 「마지막」 날짜는 2026-10-20으로 둔다.
- `docs/ai-usage-log.md` 끝에 한 줄 더한다:
  `| 2026-10-20 | 코드 · 글 | Claude (화면 다시 기획: beads.js·epitaphs.js·strand.js·ui.js·index.html, 묘비 한 줄 24줄 한/영) | 「한 영혼의 여정」 레퍼런스 티 벗기기 | 예 (코드·글 AI 작성 공개) |`
- 끝으로 `( cd D:/Users/admin/Desktop/indigame/docs/past-life && npm test )`를 돌린다 → 시험 101개.
