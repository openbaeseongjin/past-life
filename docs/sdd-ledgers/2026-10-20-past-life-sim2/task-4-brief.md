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

