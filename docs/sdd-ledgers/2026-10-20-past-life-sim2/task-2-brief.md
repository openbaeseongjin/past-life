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

