## Global Constraints

- 설계: `docs/superpowers/specs/2026-10-20-past-life-real-world-design.md`(3장·7장 1단계). HUD·이름 사전은 `docs/superpowers/specs/2026-10-20-past-life-identity-design.md`.
- PC 전용. 1600×900에서 RTX 2060급 60 fps 이상(후처리 켠 「높음」 기준). 폰 배치는 만들지 않는다.
- 재료·모델·코드 출처는 CC0·MIT·공개 영역만 쓴다. 새로 받은 것은 `docs/past-life/assets/real/SOURCES.md`에 적는다(이름, URL, 라이선스). Hunyuan3D(한국 제외 라이선스)·Mixamo·Sketchfab 유료/로그인 자산은 쓰지 않는다.
- 엔진 파일(`life.js`, `cards*.js`, `lines.js`, `events.js`, `deaths.js`, `traces.js`, `birth*.js`, `world.js`, `places.js`, `households.js`, `lifetable.js`, `focus.js`, `peers.js`, `rng.js`, `soul.js`, `beads.js`, `epitaphs.js`)은 고치지 않는다. `npm test` 100개가 계속 통과해야 한다.
- 결정성: 마을 배치·소품 흩뿌리기·사람 고르기는 출생 시드(`birth.seed`)에서 나온 난수로 정한다. 같은 시드면 같은 마을이 나온다.
- Blender 스크립트는 `tools/blender/`에 두고, 같은 스크립트를 다시 돌리면 같은 glTF가 나와야 한다. 결과물은 `docs/past-life/assets/real/kits/`(glb)와 `docs/past-life/assets/real/kits/preview/`(Blender 미리보기 그림)에 둔다.
- Blender 사용자 설정을 덮어쓰지 않는다(`--factory-startup`와 `save_userpref`를 함께 쓰지 않는다).
- 모듈 import: 우리 모듈끼리는 한 줄 `import { a } from './x.js';` 꼴이다. three addons와 ez-tree는 importmap 이름으로 부른다(공유 빌드는 3단계에서 여러 파일 빌드로 바꾼다).
- git이 없다. 커밋하지 않는다(`git init` 금지). 셸에서 프로젝트 하위 폴더로 `cd`해 머무르지 않는다(훅이 `.omc/`를 만든다). 절대 경로나 `( cd … && … )`를 쓴다.
- 화면 확인은 Playwright MCP로 한다.
  - 스크린샷은 `D:/Users/admin/Desktop/indigame/.playwright-mcp/`에 `p1_<작업>_*.png`로 둔다.
  - 서버는 `python D:/Users/admin/Desktop/indigame/docs/past-life/tools/serve.py 8780`(뒤에서 돌리고 끝나면 멈춤)다.
  - 목표 그림과 나란히 놓은 비교 그림을 남긴다.
- 파일은 UTF-8, LF.

