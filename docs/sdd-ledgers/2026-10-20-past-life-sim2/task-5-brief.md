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

