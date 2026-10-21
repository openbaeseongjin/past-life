# 시뮬 2.0 + 모닥불 기억 구슬 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 「한 영혼의 여정」을 다음과 같이 바꾼다. 모닥불을 우리만의 「기억 구슬 + 앞 생의 메아리」로 바꾼다. 수치를 구체적으로 보인다(살림·능력치·신분). 시대의 바람(전쟁·질병·의술·기술·경제·신분제)을 넣는다. 땅·시대마다 다른 레파토리를 만든다.

**Architecture:**
- 순수 모듈 넷(`context.js`·`holdings.js`·`status.js`·`tokens.js`, three 없음)이 해·땅·집안에서 맥락을 계산한다. 엔진(`life.js`·`focus.js`·`cards.js`)은 그 맥락으로 능력치·신분·조건·문구를 정한다.
- 내용(사건 100개, 고유 카드 묶음, 자리 글)은 데이터 파일에 두고, 시험이 범위와 목표 수치를 잰다.
- 화면(`ui.js`·`i18n.js`·`index.html`)은 수치 판·시대의 바람 띠·구체적인 효과를 그린다.

**Tech Stack:** 바닐라 ES 모듈, node:test(`npm test`), three.js 0.160 무대(`realscene.js`, 이 계획에서는 모닥불 구슬만 조금)

## Global Constraints

- 설계:
  - `docs/superpowers/specs/2026-10-20-past-life-sim2-design.md`(이 계획의 기준)
  - `docs/superpowers/specs/2026-10-20-past-life-identity-design.md` 3.5(모닥불), 4.4(효과 표시)
- 생명표 맞춤은 바뀌지 않는다. 죽음 굴림은 지금처럼 `yearHazard × healthMul(health) + 사건 hazard`이고, 능력치·신분·의술은 죽음 굴림에 들어가지 않는다. 지금의 생명표·여정 시험이 그대로 통과해야 한다.
- 결정성: 모든 새 굴림은 `sub(seed, …)`에서 나온다. 같은 시드면 같은 생이다.
- 한국어·영어 짝이 다 있어야 한다. 말투는 「담담하지만 위트」다. 실재 인물 이름은 쓰지 않는다. 역사 사실은 `docs/past-life/CONTENT-SOURCES.md`에 한 줄씩 출처를 남긴다. 위험률은 「게임용 어림」이다.
- 우리 모듈 import는 한 줄 `import { a } from './x.js';` 꼴이다. 파일은 UTF-8·LF다.
- git이 없다. 커밋하지 않는다. 셸에서 프로젝트 하위 폴더로 `cd`해 머무르지 않는다(`( cd … && … )`).
- 화면 확인은 Playwright MCP로 1600×900에서 한다. 스크린샷은 `D:/Users/admin/Desktop/indigame/.playwright-mcp/s2_<작업>_*.png`이다. 서버는 `python D:/Users/admin/Desktop/indigame/docs/past-life/tools/serve.py 8780`이고, 끝나면 멈춘다.
- 사용자의 FC ONLINE(`fczf.exe`)과 D:/vcpf GAMA(java) 작업은 절대 끄지 않는다. 바쁘면 성능 측정은 「pending」으로 둔다.

---

### Task 1: 모닥불 「기억 구슬 + 앞 생의 메아리」

**Files:**
- Create: `docs/past-life/memory.js`, `docs/past-life/test/memory.test.mjs`
- Modify: `docs/past-life/life.js`, `docs/past-life/traces.js`, `docs/past-life/ui.js`, `docs/past-life/i18n.js`, `docs/past-life/main.js`, `docs/past-life/strand.js`, `docs/past-life/index.html`

**Interfaces:**
- Produces:
  - `memoryCandidates(life, prevLife|null) → [{ id, kind: 'life'|'echo', age, year, text: {ko,en}, icon }]`: 0~3개, 결정적이다.
  - `pickMemory(life, cand)`: `life.memories`에 넣고, echo면 `life.traceBoost[traceKey] += 1`
  - `traces.js`의 `chanceBonus`·`riskPenalty`는 `boost`를 받아 크기를 키운다(boost 1당 ×1.5, 최대 ×2.5)
  - `ui.pause(life, { prev })` → `{ pick: id|null }`. 몇 초 뒤 자동으로 가장 최근 것을 고른다.
  - `strand.drawThread`·`drawRosary`: `memories` 나이의 구슬을 1.6배로 그린다.

- [ ] **Step 1: 후보 고르기 시험**
  - `test/memory.test.mjs`에 다음을 쓴다.
    - (a) 후보는 지난 멈춤 뒤 일지(kind가 kin·event·line·card 결정)에서만 나온다.
    - (b) 서로 다른 kind를 먼저 고른다.
    - (c) 같은 시드면 같은 후보가 나온다.
    - (d) prev가 있고 흔적이 있으면 3번째가 echo다.
    - (e) 첫 생이면 echo가 없다.
    - (f) 일지가 비면 0개다(모닥불은 조용히 지나간다).
- [ ] **Step 2: `memory.js` 구현**
  - 일지 항목을 점수로 고른다. kin·event·card 결정은 3, line은 1이고, 같은 kind가 이미 뽑혔으면 −2다.
  - echo 글은 흔적 종류(fear·talent·dream·bond) × 앞 생 집안 태그로 정한다. 표는 20줄 이상이고 ko/en 짝이다.
    - 예: talent:sea + 이번 생이 바다를 처음 봄 → 「처음 본 바다가 낯설지 않았다」
    - 뒤에 「앞 생의 메아리 · {앞 생 땅}의 {앞 생 집안}」을 붙인다.
- [ ] **Step 3: 엔진 연결**
  - `life.js` 멈춤(`type: 'pause'`)은 그대로 두고, `life.memories = []`와 `life.traceBoost = {}`를 만든다.
  - `summarize`에 memories를 넣는다. 묘비 글귀는 memories가 있으면 마지막 기억을 쓴다(`epitaphs.js`는 고치지 않는다. `obituary` 쪽에서 덧붙인다).
- [ ] **Step 4: 화면**
  - 모닥불 판은 시안 `docs/concept-images/29-past-life-memory-beads/s8a·s8b`를 따른다.
    - 제목 「○○ 살의 모닥불」
    - 구슬 버튼 셋: 아이콘, 한 줄, 「해 · 나이」. echo는 푸른 버튼이다.
    - 아래에 「하나를 고르면 실과 염주에 큰 구슬로 꿰어져요」
  - 통계 줄·질문·글 칸·「다음부터 건너뛰기」를 지운다. `PAUSE_Q`는 쓰지 않는다.
  - 자동 진행(`robot`)과 8초 무응답은 가장 최근 것을 고른다.
  - 3D 무대는 `setCampfire(true, ghost)` 그대로 둔다. 구슬 3D는 이 작업 범위가 아니다.
- [ ] **Step 5: 확인**
  - `npm test`가 다 통과한다.
  - 첫 생·둘째 생의 모닥불 스크린샷(`s2_t1_first.png`, `s2_t1_echo.png`)을 찍는다.
  - 염주에서 큰 구슬이 보이는 스크린샷(`s2_t1_rosary.png`)을 찍는다.
  - 콘솔 오류 0.

### Task 2: 맥락 엔진 (`context.js`, `context_data.js`, `tokens.js`)

**Files:**
- Create: `docs/past-life/context.js`, `docs/past-life/context_data.js`, `docs/past-life/tokens.js`, `docs/past-life/test/context.test.mjs`, `docs/past-life/test/tokens.test.mjs`, `docs/past-life/CONTENT-SOURCES.md`
- Modify: `docs/past-life/lands.js` (문화권 표를 `context_data.js`의 `ZONE_OF`에서 가져오게)

**Interfaces:**
- Produces:
  - `ZONE_OF: { [area]: 'europe'|'southasia'|'eastasia'|'mudbrick'|'africa'|'americas'|'seaoc'|'steppe' }` (40개 땅)
  - `contextOf(year, area, household) → { zone, group, era, words, status, goods, disease, war, tech, econ, school, literacy, events }` (설계 3.1 모양 그대로)
  - `fillTokens(text, ctx, lang) → string`: `{crop}`·`{crop:을}` 등. 조사는 을/를·이/가·은/는·와/과·으로/로
  - `WORD_KEYS = ['crop','staple','coin','coinUnit','land','landUnit','beast','home','holy','ruler','feast','cloth','market','healer','school']`

- [ ] **Step 1: 시험 먼저**
  - `context.test.mjs`
    - 40개 땅 × 6개 묶음(대표 해: -9000, 300, 1200, 1650, 1900, 2000) × 그 묶음의 집안마다 `contextOf`의 모든 필드가 있다. `words`의 모든 키가 ko/en 비지 않은 글이다. `status.ranks[household]`가 `{ ko, en, rank: 1..5, bound: bool }`이다. `goods`에 그 집안 품목이 2개 이상이다. `disease.medicine`·`tech.level`·`war.level`이 범위 안이다.
    - 의술 수준이 연대 기준을 지킨다. 1796년 전은 ≤2, 1870 뒤는 ≥4(유럽), 1945 뒤는 5(모든 땅).
    - 사건 수정: 1347~1351 europe에서 `econ.wage > 1`, 흑사병 질병이 들어가 있다.
  - `tokens.test.mjs`
    - 조사 맞춤: 쌀 → 「쌀을」, 밀 → 「밀을」, 보리 → 「보리를」, 「은화로」·「돈으로」·「쌀로」(ㄹ 받침은 로).
    - 모든 땅 × 묶음 맥락으로 `WORD_KEYS` 자리를 채운 뒤 `{`가 남지 않는다.
- [ ] **Step 2: `context_data.js` 표 쓰기**
  - 문화권 8 × 묶음 6 = 48칸 기본값, 그리고 땅 덮어쓰기 17개 이상: china, india, korea, japan, bengal, indus, mesoamerica, andes, west_africa, nile, anatolia, britain, france, germany, italy, east_europe, north_america.
  - 칸마다 words(ko/en), status ranks(집안마다), goods(값·단위), disease.endemic, medicine, tech.level+items, war 기본 수준, school, literacy를 쓴다.
  - 사실은 `CONTENT-SOURCES.md`에 칸 단위로 한 줄씩 적는다(예: 「조선 양천제 — 위키백과 '양천제'」).
  - 확인이 안 되는 것은 넓은 표현으로 쓴다.
- [ ] **Step 3: `context.js`**
  - 기본값 → 땅 덮어쓰기 → 그해 활성 사건(events.js의 `war`·`econ`·`disease`) 순으로 합친다.
  - 결과는 (year, area, household) 열쇠로 캐시한다.
- [ ] **Step 4: `tokens.js`** — 받침 판정(유니코드 한글 음절 `(code-0xAC00)%28`), ㄹ 받침 「로」 규칙, 영어는 그대로.
- [ ] **Step 5: `npm test`가 다 통과하는지 확인한다.**

### Task 3: 능력치·신분·살림 엔진

**Files:**
- Create: `docs/past-life/status.js`, `docs/past-life/holdings.js`, `docs/past-life/test/attrs.test.mjs`, `docs/past-life/test/holdings.test.mjs`
- Modify: `docs/past-life/life.js`, `docs/past-life/focus.js`, `docs/past-life/cards.js`, `docs/past-life/traces.js`

**Interfaces:**
- Consumes: `contextOf`(Task 2)
- Produces:
  - `life.attrs = { luck, charm, know, skill }`(0~100), `life.status = { id, rank, ko, en, bound }`, `life.ctx()`(그해 맥락)
  - 카드 효과 키는 기존 넷에 `luck`·`charm`·`know`·`skill`·`status`(±1 단계)를 더한다.
  - `when` 조건에 `minKnow`·`maxKnow`·`minStatus`·`maxStatus`·`bound`·`war`(최소 수준)·`setting`·`zones`를 더한다.
  - `holdingsOf(wealth, ctx, household) → [{ id, n, unit:{ko,en}, name:{ko,en} }]`, `wealthToUnits(delta, ctx) → { n, unit:{ko,en} }`
  - `statusOf(birth, ctx)`, `shiftStatus(life, d)`
  - 운에 맡기는 확률은 `p + (luck − 50) / 250 + chanceBonus`, 0.05~0.95다.

- [ ] **Step 1: 시험 먼저**
  - `attrs.test.mjs`
    - 시작 능력치 범위: 행운 20~80, 친화력 25~75, 지식 5~20(+집안·시대), 손재주 20~60.
    - 재능 흔적 +8, 인연 friend 친화력 +5.
    - 「배우기」 10해에 지식이 맥락 `school`에 비례해 오른다.
    - 확률 보정은 ±0.2 안이다.
    - 0~100을 넘지 않는다.
    - **생명표 맞춤 시험이 그대로 통과한다**(능력치를 아무리 바꿔도 같은 시드의 사망 나이가 같다. 건강이 같을 때).
  - `holdings.test.mjs`: 결정적이다. 재산 0→100에서 총값이 줄지 않는다. 집안별 품목(농사 → 땅 먼저, 유목 → 가축 먼저, 사무 → 돈). 재산 ≤10은 「거의 없음」 표기다. `wealthToUnits(4, 1347 britain)`의 단위는 은화다.
- [ ] **Step 2: `status.js`·`holdings.js` 구현** (설계 2.3·2.4)
- [ ] **Step 3: `life.js`**
  - `createLife`에서 attrs와 status를 정한다(`sub(seed,'attrs')`).
  - `endYear`에서 초점 성장(설계 2.2 표)을 더한다. 「일」의 재산 증가는 `× econ.wage × (0.8 + skill/250)`, 곁 증가와 `kinYear` 확률은 `× (0.8 + charm/250)`이다.
  - `choose`에서 새 효과 키를 처리하고, 확률 보정을 넣는다.
  - `ctxOf`에 attrs·status·zone·setting·war를 더한다.
- [ ] **Step 4: `cards.js`** — `eligible`에 새 조건을 더한다. 기존 조건의 뜻은 바꾸지 않는다.
- [ ] **Step 5: `npm test`가 다 통과하는지 확인한다.**

### Task 4: 수치 판·시대의 바람 띠·구체적인 효과 (화면)

**Files:**
- Modify: `docs/past-life/ui.js`, `docs/past-life/i18n.js`, `docs/past-life/index.html`, `docs/past-life/main.js`, `docs/past-life/life.js`(첫돌 통계 줄 바꾸기)

**Interfaces:**
- Consumes: `life.attrs`, `life.status`, `holdingsOf`, `wealthToUnits`, `contextOf`
- Produces:
  - `effectParts(effects, ctx, lang) → [{ key, sign, text }]`: 재산은 돈 단위, 나머지는 「건강 +2」
  - `eraWind(ctx, lang) → { head, sub }`: 설계 3.3 띠 두 줄

- [ ] **Step 1: 시험** — `effectParts`(재산 → 「은화 +4닢」, 소수 없음, 0은 뺌), `eraWind`(흑사병 해·평소 해 둘 다)를 `test/i18n.test.mjs`에 더한다.
- [ ] **Step 2: 왼쪽 수치 판**(설계 5.1, 시안 s9)
  - 줄 여섯: 건강·재산·곁·마음(숫자·막대·구체 한 줄), 능력치 한 줄, 신분.
  - 바뀌면 숫자가 빛나고 +·−가 떠오른다(reduced-motion이면 없음).
- [ ] **Step 3: 위 띠** — 시대의 바람. 누르면 그해 맥락 카드(전쟁·질병·의술·기술·경제·신분제 한 줄씩)를 연다.
- [ ] **Step 4: 효과 표시**
  - 올해의 패와 갈림길 선택지는 `effectParts`로 그린다.
  - 운에 맡김은 「운에 맡김 62%」(행운·흔적 반영 확률)로 그린다.
- [ ] **Step 5: 통계 줄 빼기**(설계 5.3)
  - 첫돌 줄을 그 땅·시대 첫돌 풍습 한 줄로 바꾼다. `context_data.js`에 문화권별 `firstYear` ko/en을 둔다.
  - 사망 기록의 「같은 해 태어난 …% 오래」 줄을 「그 시대 이 땅 사람들의 흔한 마지막」 한 줄로 바꾼다. 백 가닥 그림은 그대로 둔다.
- [ ] **Step 6: 확인**
  - 1600×900 스크린샷: 1347 잉글랜드, 1651 조선, 1500 베냉을 찍는다(`?seed=`로 찾는다).
  - `npm test`가 다 통과하고, 콘솔 오류 0.

### Task 5: 실제 사건 100개 이상

**Files:**
- Modify: `docs/past-life/events.js`, `docs/past-life/cards_event.js`, `docs/past-life/CONTENT-SOURCES.md`
- Test: `docs/past-life/test/events.test.mjs` (있으면 더하고, 없으면 만든다)

- [ ] **Step 1: 시험**
  - 사건 ≥100, 카드가 붙은 사건 ≥50이다.
  - 기간 `from < to`, 지역·땅 이름이 바르다.
  - 문화권마다 ≥8개, southasia·eastasia는 ≥15개다.
  - `war`·`econ`·`disease` 값이 범위 안이다.
  - 모든 사건이 `CONTENT-SOURCES.md`에 id로 나온다.
  - ko/en 짝이 다 있다.
- [ ] **Step 2: 사건 쓰기**
  - 문화권별로 전쟁·역병·기근·제도 변화·기술 전파·교역을 고르게 쓴다.
  - 예: 아소카의 불교 전파, 굽타 시대 수학, 델리 술탄국, 무굴 통일, 벵골 기근, 당 안사의 난, 송 인쇄·화약, 몽골 침입, 원·명 교체, 조선 건국·훈민정음·병자호란·대동법·경신대기근, 일본 전국시대, 아바스 바그다드, 십자군, 오스만 콘스탄티노플, 말리 만사의 순례, 베냉 포르투갈 교역, 아스테카 테노치티틀란, 잉카 도로, 감자·옥수수 전파, 노예무역, 아편전쟁, 세포이 항쟁, 분할, 녹색 혁명.
- [ ] **Step 3: `npm test`가 다 통과하는지 확인한다.**

### Task 6: 공통 카드·줄 말 바꿔 끼우기

**Files:**
- Modify: `docs/past-life/cards_life.js`, `docs/past-life/cards_era.js`, `docs/past-life/lines.js`, `docs/past-life/ui.js`(글 그릴 때 `fillTokens`)
- Test: `docs/past-life/test/tokens.test.mjs`(덱 전체 채우기 시험 추가)

- [ ] **Step 1: 시험** — 덱의 모든 카드·줄 글을 모든 땅 × 묶음 맥락으로 채운 뒤 `{`가 남지 않는다. 자리가 있는 카드는 「말 바꿈」 표시(`card.tokens = true`)로 계산한다.
- [ ] **Step 2: 바꾸기**
  - 공통 카드 67장·공통 줄 66개를 하나씩 본다.
  - 땅·시대 말이 들어갈 자리는 자리 글로 바꾼다.
  - 모든 시대에 어울리지 않으면 시대 조건을 붙인다.
- [ ] **Step 3: `npm test`가 다 통과하는지 확인한다.**

### Task 7: 고유 카드 묶음 16개

**Files:**
- Create: `docs/past-life/cards_local.js`, `docs/past-life/lines_local.js`, `docs/past-life/test/repertoire.test.mjs`
- Modify: `docs/past-life/deck.js`, `docs/past-life/lines.js`(LOCAL을 이어 붙임), `docs/past-life/CONTENT-SOURCES.md`

- [ ] **Step 1: 시험**(설계 4.4 목표 수치, 시드 2,000, 자동 결정)
  - 공통 카드 비율 ≤ 20%
  - 다른 문화권·500년 넘게 떨어진 두 생의 겹침 ≤ 8%
  - 조건·말 바꿈이 있는 줄 ≥ 70%
  - 16개 조합 각각의 카드·줄 수가 설계 4.2 표 이상
- [ ] **Step 2: 쓰기**
  - 설계 4.2 표대로 쓴다.
  - 조합마다 시대를 고르게 나누고, 선택지 효과에 능력치·신분을 쓴다.
  - 큰 집 묶음은 귀족 쪽과 하인 쪽을 함께 둔다.
- [ ] **Step 3: 측정이 목표에 못 미치면 가중치나 조건을 다듬는다. 그 뒤 `npm test`가 다 통과하는지 확인한다.**

### Task 8: 한 생 돌려 보기와 다듬기

- [ ] 서로 다른 생 여섯(남아시아 마을·동아시아 큰 집·유럽 마을·아메리카 마을·서아시아 유목·아프리카 마을)을 `?auto=1`로 끝까지 돌린다. 각 생의 일지와 스크린샷을 남긴다(`s2_t8_*.png`).
- [ ] 같은 문구 반복, 어색한 조사, 시대에 안 맞는 물건을 찾아 고친다.
- [ ] `npm test`가 다 통과하고, 콘솔 오류 0.
