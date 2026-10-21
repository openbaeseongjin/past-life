### Task 3: 옷 입은 사람

**Files:**
- Create: `tools/blender/kit_clothes.py`, `docs/past-life/assets/real/people/villagers.glb`
- Modify: `docs/past-life/realscene.js`, `SOURCES.md`

**Interfaces:**
- Produces:
  - `villagers.glb`: Quaternius Universal Base Characters 몸(남·여)에 옷을 입혀 굽은 변형 8명이다.
    - 남: 튜닉+각반, 튜닉+두건, 대장장이 앞치마
    - 여: 긴 치마+앞치마+머릿수건, 망토
    - 아이 1, 노인 1(굽은 자세는 코드에서 줌)
    - 뼈대는 바탕 몸과 같아서 Universal Animation Library 동작(걷기·서기·이야기·망치질·들기·괭이질)을 그대로 쓴다.
  - `realscene.js`: `spawnPeople(rng, count)`가 시드로 정한 변형·동작·경로로 사람을 둔다.

- [ ] **Step 1: 옷 만들기**
  - Blender에서 몸에 맞춰 옷 메시를 만든다(shrinkwrap + 두께 + 주름 노멀).
  - 재료는 거친 리넨·양모·가죽(CC0 천 텍스처)이고 색은 변주한다.
  - 몸의 가중치를 옷으로 옮긴다(Data Transfer).
  - 옷 밑으로 가려지는 몸 부분은 지워 뚫고 나오지 않게 한다.
- [ ] **Step 2: 동작 확인**
  - 걷기·서기·망치질에서 옷이 몸을 뚫지 않는지 Blender 미리보기 세 장으로 확인한다.
- [ ] **Step 3: 장면에 넣기**
  - 사람 10~20명을 마당·장터·밭·대장간(망치질)에 둔다.
  - 가까운 사람은 메시로, 먼 사람은 수를 줄여 그린다.
- [ ] **Step 4: 확인**
  - 골목 눈높이에서 「마네킹」이 아니라 옷 입은 마을 사람으로 보여야 한다(`p1_t3_street.png`).
  - 60 fps 이상, 오류 0, 시험 100개.

---

