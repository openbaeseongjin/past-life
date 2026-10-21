# 한 영혼의 여정 (전생 시뮬레이션)

지금까지 태어난 약 1,170억 명 가운데 한 명으로 태어나 한 생을 산다. 판이 이어지면 같은 영혼이 다음 시대에 다시 태어난다.
설계: `../superpowers/specs/2026-10-19-past-life-design.md` · 계획: `../superpowers/plans/2026-10-19-past-life.md`

- 시험: `npm test`
- 개발 서버: `python tools/serve.py 8780` → http://127.0.0.1:8780/ (`?seed=문자열` 같은 탄생, `?auto=1` 자동 진행, `?fast=1` 연출 생략)
- 공유 한 파일: `python build_share.py` → `../../전생시뮬_공유/플레이/pastlife-play.html` (카톡·폰, file:// 에서 열림, 3 MB 이하) + `../share/pastlife-play-artifact.html` (웹 링크용). 모듈과 `assets/hex.glb` 를 한 파일에 담고 three.js 와 글꼴만 인터넷에서 받는다
- 출처: `CREDITS.md`
