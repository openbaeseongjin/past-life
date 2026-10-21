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

