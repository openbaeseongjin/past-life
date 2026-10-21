## Global Constraints

- 설계: `docs/superpowers/specs/2026-10-20-past-life-real-world-design.md` 3.2(세트·장소 배치·땅별 변형), 3.3(땅 모습), 3.4(사람), 3.5(성능). 사용자 결정 「시뮬 2.0 먼저, 3D 세트는 줄이기」에 따라 이번 범위는 남아시아·동아시아·흙벽돌 세트와 큰 집 장소까지다.
- 같은 스크립트를 다시 돌리면 같은 glb가 나와야 한다. `bpy.ops.mesh.primitive_uv_sphere_add`·`recalc_face_normals`는 쓰지 않는다(`kit_props.py`의 결정적 대체 함수를 쓴다).
- glb는 세트 하나에 삼각형 15만 개 이하, 5 MB 이하다. 옷 입은 사람 변형은 LOD0 약 8천 삼각형이다.
- 1600×900, RTX 2060급에서 「높음」 평균 60 fps 이상이어야 한다. FC ONLINE(`fczf.exe`)·GAMA(java)가 돌면 측정은 「pending」이고, 절대 끄지 않는다.
- 출처는 CC0·MIT·공개 영역만 쓴다. `docs/past-life/assets/real/SOURCES.md`에 적는다. Hunyuan3D·Mixamo·Sketchfab 유료/로그인 자산은 쓰지 않는다.
- 이 계획의 작업은 `main.js`·`ui.js`·`i18n.js`·`index.html`·엔진 파일(`life.js`·`cards*.js`·`lines.js`·`events.js`·`focus.js`·`context*.js` 등)을 고치지 않는다. 시뮬 2.0이 같은 때에 그 파일들을 고친다.
  - 고쳐도 되는 파일: `realscene.js`, `realpeople.js`, `peopleplan.js`, `villageplan.js`, `kitdata.js`, `lands.js`의 무대 쪽(kit→glb 표), `look-real.html`, `tools/blender/*`, `docs/past-life/tools/*`, `assets/real/*`.
- 문화 표현: 실재 종교 시설은 그 시대 일반형(예: 북인도 나가라 양식 사원, 동아시아 목조 사찰)으로만 짓는다. 특정 실존 건물을 복제하지 않는다. 옷은 그 시대 평민·귀족의 일반형이다.
- git이 없다. 커밋하지 않는다. 셸에서 프로젝트 하위 폴더로 `cd`해 머무르지 않는다.
- 스크린샷은 `D:/Users/admin/Desktop/indigame/.playwright-mcp/p2_<작업>_*.png`이다(1600×900, 게임 안 가까운 시점 + 전경).

---
