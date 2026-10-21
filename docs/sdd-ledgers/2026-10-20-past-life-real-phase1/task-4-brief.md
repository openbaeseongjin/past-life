### Task 4: 색감·연출 + 게임 무대로 연결

**Files:**
- Modify: `docs/past-life/realscene.js`, `docs/past-life/main.js`, `docs/past-life/index.html`(스크립트 importmap에 addons·ez-tree), `docs/past-life/look-real.html`

**Interfaces:**
- Consumes:
  - 지금 `main.js`가 부르는 마을 API: `createVillage(canvas)` → `{ fast, setKit, setLife(birth), setAge(age, year), setPhase(name), tick(), snapshot(), setCampfire(on, ghost), flameRise(), setView({lift}) }`
  - `phaseOf(age)`(village.js에서 export)
- Produces:
  - `realscene.js`에 `createStage(canvas) → 같은 API`를 둔다. `phaseOf`도 export한다.
  - `main.js`는 `import { createStage as createVillage, phaseOf } from './realscene.js';` 한 줄로 바꾼다. KayKit `loadHex`·`setKit`은 빈 함수로 둔다.

- [ ] **Step 1: 색감·연출**
  - 따뜻한 색 보정(약한 LUT 또는 셰이더 곡선)을 넣는다. 아침·해질녘에는 빛 줄기(가벼운 god-ray 또는 안개 산란 강조)를 쓴다.
  - 주인공 자리에는 은은한 빛(카메라가 바라보는 마을 가운데)을 둔다.
  - 「높음/보통」 화질 단계를 둔다(보통은 AO 끔, 그림자 해상도 반, 먼 나무 단순).
- [ ] **Step 2: API 맞추기**
  - `setPhase(name)`: dawn·morning·noon·afternoon·dusk·night를 해 높이와 시각으로 바꾼다. 바뀔 때는 천천히 넘어간다.
  - `setAge`: 나이에 맞는 내 사람 크기·자세(아이·어른·노인)를 정한다. 시대가 바뀌면 소품을 교체한다(1단계는 잉글랜드 세트 안에서 근세 이후 소품만 조금 바꾼다).
  - `setCampfire(on, ghost)`: 마을 빈터에 실사 모닥불(장작 메시 + 불꽃 입자 + 점광원)을 놓는다. `ghost`면 푸른 반투명 불씨 사람을 둔다.
  - `flameRise()`: 내 사람 위에서 하얀 불씨가 떠올라 사라진다(Promise, fast·reduced-motion이면 바로 끝남).
  - `snapshot()`: 320×180 JPEG를 낸다(염주 메달·나누기 그림용).
  - `setView({lift})`: HUD를 피해 카메라가 보는 점을 내린다.
  - `tick()`: 해가 넘어갈 때 카메라를 조금 돈다.
- [ ] **Step 3: 다른 땅**
  - 1단계에서는 잉글랜드가 아닌 땅도 같은 바탕(지형·하늘)에 잉글랜드 세트를 쓰되, 땅 모습 색(사막은 마른 흙·적은 나무, 논은 물 댄 밭색)만 바꿔 둔다.
  - 2단계에서 세트로 대체한다.
- [ ] **Step 4: 게임에서 확인**
  - `?seed=`로 잉글랜드에 태어나는 시드를 찾는다(노드에서 `drawBirth`를 돌려서).
  - 그 시드로 한 생을 `?auto=1`로 끝까지 돌리면서 다음을 찍는다.
    - 해가 흐르는 화면(아침·한낮·해질녘)
    - 갈림길
    - 모닥불
    - 불씨가 떠오르는 장면
  - 각 장면을 1600×900으로 찍는다(`p1_t4_*.png`). HUD(작업 5)가 실사 무대 위에서 잘 읽히는지 본다.
  - 다른 땅 시드도 하나 확인한다.
  - 60 fps 이상, 콘솔 오류 0, 시험 100개.
  - 마지막으로 목표 그림과 나란히 놓은 비교 그림 `p1_final_compare.png`를 남긴다.
