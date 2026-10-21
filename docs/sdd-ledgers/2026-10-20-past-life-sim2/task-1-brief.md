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

