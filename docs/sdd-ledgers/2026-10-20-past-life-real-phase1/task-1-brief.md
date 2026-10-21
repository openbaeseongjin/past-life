### Task 1: 중세 잉글랜드 건물 세트 (Blender)

**Files:**
- Create: `tools/blender/kit_common.py`, `tools/blender/kit_england.py`
- Create: `docs/past-life/assets/real/kits/england.glb`, `docs/past-life/assets/real/kits/preview/england_*.png`
- Modify: `docs/past-life/realscene.js`(코드 건물 대신 세트 사용), `docs/past-life/assets/real/SOURCES.md`

**Interfaces:**
- Produces:
  - `england.glb` 안의 노드 이름(그대로 쓴다):
    - `cottage_a`, `cottage_b`, `cottage_c`(초가 오두막 변형)
    - `house_jetty`(2층, 위층이 튀어나온 목골조)
    - `longhouse`, `barn`, `smithy`(앞이 트인 일터, 화덕 자리 `smithy_forge` 빈 노드)
    - `church`(네모 탑 + 본당 + 현관), `mill`(물레방아 `mill_wheel` 따로 돌릴 수 있게)
    - `well`, `market_stall`
  - 노드마다 바닥 중심이 원점이고 단위는 미터다.
  - `realscene.js`: `loadKit(url) → Promise<{ pieces: Map<name, Object3D> }>`(같은 세트를 다시 부르면 캐시)

- [ ] **Step 1: 공통 도구 `kit_common.py`**
  - CC0 PBR 텍스처(이미 `docs/past-life/assets/real/tex/`에 있는 것 + 필요하면 Poly Haven·ambientCG에서 1K 더 받기)로 Principled 재료를 만든다. 재료 이름은 `stone_rubble`, `plaster_lime`, `timber_dark`, `thatch`, `slate`, `planks`, `cobble`, `wattle`.
  - Cycles AO를 정점 색 또는 두 번째 UV 라이트맵에 굽는다(three.js `aoMap`으로 쓸 수 있게).
  - glTF 내보내기 다음에 gltf-transform으로 meshopt 압축을 하고 텍스처를 1K로 맞춘다.
  - 미리보기 렌더(Eevee, 1280×720, 3/4 시점)를 만든다.

- [ ] **Step 2: 건물 스크립트 `kit_england.py`** (참고 그림: `m2-living-real.png`)
  - 비례: 오두막 5~7 m × 4~5 m, 벽 높이 2.4~2.8 m, 지붕 경사 45~55°.
  - 진짜 기하로 만든다:
    - 초가 두께 30~40 cm, 처마가 벽 밖으로 40~60 cm, 용마루가 살짝 처진 곡선
    - 목골조 기둥·보·가새가 벽면에서 2~4 cm 튀어나오게
    - 창틀·덧문·문틀, 굴뚝, 낮은 돌 기단
  - 변형: 별채를 덧댄 집, 지붕창 하나, 기울어진 헛간 문.
  - 교회: 성곽 모양 꼭대기(총안)를 단 네모 탑, 슬레이트 지붕 본당, 뾰족 창, 현관. 물레방앗간에는 바퀴를 따로 둔다.
  - 삼각형은 모두 합쳐 25만 개 이하, glb는 8 MB 이하.

- [ ] **Step 3: 내보내기와 미리보기**
  - Run: `"C:/Program Files/Blender Foundation/Blender 4.2/blender.exe" --background --python D:/Users/admin/Desktop/indigame/tools/blender/kit_england.py`
  - Expected: `england.glb`와 미리보기 그림이 생긴다. 같은 명령을 다시 돌려도 같은 결과다.

- [ ] **Step 4: `realscene.js`에서 세트 쓰기**
  - 코드로 만든 건물을 세트 조각으로 바꾼다. 배치 규칙(골짜기·길·강가)은 그대로 쓰되, 조각 고르기·회전·약간의 크기 변주는 시드로 정한다.
  - 대장간 화덕 불빛은 `smithy_forge`, 물레방아 회전은 `mill_wheel`에 붙인다.

- [ ] **Step 5: 확인**
  - `look-real.html`에서 아침 전경·골목 눈높이·해질녘 대장간 세 장을 찍는다(`p1_t1_*.png`). 바뀌기 전 `real_*.png`와 나란히 놓은 그림도 남긴다.
  - 골목 눈높이에서 「상자 + 지붕」으로 보이지 않아야 한다.
  - 콘솔 오류 0, 60 fps 이상.
  - `( cd D:/Users/admin/Desktop/indigame/docs/past-life && npm test )` → 100개 통과.

---

