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

