## Global Constraints

- 설계:
  - `docs/superpowers/specs/2026-10-20-past-life-sim2-design.md`(이 계획의 기준)
  - `docs/superpowers/specs/2026-10-20-past-life-identity-design.md` 3.5(모닥불), 4.4(효과 표시)
- 생명표 맞춤은 바뀌지 않는다. 죽음 굴림은 지금처럼 `yearHazard × healthMul(health) + 사건 hazard`이고, 능력치·신분·의술은 죽음 굴림에 들어가지 않는다. 지금의 생명표·여정 시험이 그대로 통과해야 한다.
- 결정성: 모든 새 굴림은 `sub(seed, …)`에서 나온다. 같은 시드면 같은 생이다.
- 한국어·영어 짝이 다 있어야 한다. 말투는 「담담하지만 위트」다. 실재 인물 이름은 쓰지 않는다. 역사 사실은 `docs/past-life/CONTENT-SOURCES.md`에 한 줄씩 출처를 남긴다. 위험률은 「게임용 어림」이다.
- 우리 모듈 import는 한 줄 `import { a } from './x.js';` 꼴이다. 파일은 UTF-8·LF다.
- git이 없다. 커밋하지 않는다. 셸에서 프로젝트 하위 폴더로 `cd`해 머무르지 않는다(`( cd … && … )`).
- 화면 확인은 Playwright MCP로 1600×900에서 한다. 스크린샷은 `D:/Users/admin/Desktop/indigame/.playwright-mcp/s2_<작업>_*.png`이다. 서버는 `python D:/Users/admin/Desktop/indigame/docs/past-life/tools/serve.py 8780`이고, 끝나면 멈춘다.
- 사용자의 FC ONLINE(`fczf.exe`)과 D:/vcpf GAMA(java) 작업은 절대 끄지 않는다. 바쁘면 성능 측정은 「pending」으로 둔다.

---
