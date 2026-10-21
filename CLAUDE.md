# 「한 영혼의 여정」 개발 가지 (dev) — 클라우드 세션 규칙

이 저장소의 `dev` 가지는 개발 원본이다. `main` 가지는 GitHub Pages로 나가는 플레이용 빌드다(https://openbaeseongjin.github.io/past-life/).
먼저 `HANDOFF.md`를 읽고 이어서 한다.

## 반드시 지킬 것 (사용자 선호)
- **모든 답과 상태 글은 한국어로** 쓴다.
- **주간 사용량 95%에서 멈춘다.** 사용량은 볼 수 없으니, 무거운 작업(여러 에이전트, 큰 구현)을 시작하기 전에 지금 몇 %인지 사용자에게 묻는다. 95%면 새 작업을 띄우지 않고 진행 기록만 남긴다.
  - 단, claude.ai/code 클라우드 세션은 클라우드 크레딧이 남아 있는 동안 주간 사용량과 상관없이 계속 진행한다(크레딧이 다 떨어지면 멈춤).
- 밖으로 나가는 일은 먼저 묻는다: `main` 가지에 올리기(= 공개 사이트 갱신), 새 저장소, 외부 서비스. `dev` 가지에 커밋하는 것은 작업을 잃지 않기 위한 것이라 해도 되지만, 커밋하기 전에 한 줄로 알린다.
- 커밋 글: `[종류] 한국어 요약`, 끝에 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- 사용자의 이메일은 신원 확인용일 뿐 어디에도 보내지 않는다. 결제·가입·로그인은 사용자가 한다.
- 계획·장면은 도형 스케치가 아니라 실제 그림으로 보여 준다.

## 내용 규칙
- 자산은 CC0·MIT·공개 영역만. Hunyuan3D(한국 제외 라이선스)·Mixamo·Sketchfab 유료/로그인 자산은 쓰지 않는다. 새 자산은 `docs/past-life/assets/real/SOURCES.md`에 적는다.
- 카드·글: 해요체, 「담담하지만 위트」, 한국어·영어 짝. 실재 인물 이름 금지(시험이 막는다). 아픈 제도(노예·카스트·노비·식민·전쟁)는 그 자리 사람의 눈으로 담담하게, 웃음거리로 쓰지 않는다. 역사 사실은 `CONTENT-SOURCES*.md`에 출처를 한 줄씩.
- 생명표 맞춤(죽음 굴림 = 생명표 × 건강 배율 + 사건 위험률)은 바꾸지 않는다. 능력치·신분·의술은 죽음 굴림에 넣지 않는다.
- 모든 무작위는 출생 시드에서(`sub(seed, …)`). 같은 시드 = 같은 생.
- 0번 선택지에는 `when`을 달지 않는다(자동 경로가 잠긴 선택지에서 끝없이 돈다).

## 실행
- 시험: `cd docs/past-life && npm test` (Node 20+, 설치할 것 없음). 시험 수는 `docs/sdd-ledgers/cloud-session.md` 의 마지막 기록을 본다.
- 글 훑기: `cd docs/past-life && node tools/sweep.mjs 2400 --out 보고서.md` (2,400생의 화면 글 ko/en 을 검사, 흠 0 이어야 한다).
- 화면: `python docs/past-life/tools/serve.py 8780` → `http://localhost:8780/index.html?seed=T4-21` (`&auto=1` 저절로, `&q=normal` 보통 화질). 3D는 three.js 0.160·ez-tree를 jsDelivr에서 받는다.
- 클라우드에는 Blender와 GPU가 없다: 새 3D 세트(Blender 빌드)·fps 측정은 사용자 PC에서 한다. 여기서는 시뮬·카드·화면·시험을 한다.

## 공개 사이트 갱신 (사용자에게 먼저 묻는다)
`main` 가지 뿌리에 런타임 파일만 둔다: `docs/past-life/*.js`, `index.html`, `CONTENT-SOURCES*.md`, `assets/hex.glb`, `assets/geo/*.json`, `assets/real/{people,tex,SOURCES.md}`, `assets/real/kits/*.glb`·`*.json` (미리보기·시험·도구 제외), `.nojekyll`, `README.md`(공개용, `docs/past-life/tools/pages/README.md`). 커밋 `[deploy] …` 뒤 push하면 Pages가 1~2분 안에 새로 짓는다.
- 모으기: `cd docs/past-life && node tools/build_pages.mjs [폴더] --clean` → 기본 `_site/`(저장소 뿌리, git 에서 뺌)에 위 파일만 모은다. main.js 에서 닿는 모듈·코드에 적힌 자산이 다 있는지, 시험 화면·도구가 섞이지 않았는지 확인하고, 하나라도 어긋나면 멈춘다.
- 올리기 (사용자가 허락한 뒤에만): main 가지를 따로 받은 폴더(예: `git worktree add ../pages main`)에 `_site/` 내용을 덮어쓰고(main 에만 있는 옛 파일은 지운다) `[deploy] …` 커밋 → push. 올리기 전 `_site` 를 `python -m http.server` 로 띄워 한 생을 돌려 본다.
