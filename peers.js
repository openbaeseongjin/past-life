// 같은 해 태어난 네 사람 (설계 12장): 같은 엔진으로 끝까지 산다 (결정 없음, 초점은 저절로, 잠시 멈춤 없음)
import { birthAt } from './birth.js';
import { createLife, advance } from './life.js';
import { stageOf } from './cards.js';

export function makePeers(birth, n = 4) {
  return Array.from({ length: n }, (_, i) => {
    const b = birthAt(`${birth.seed}|peer${i}`, birth.year);
    const life = createLife({ birth: b, quiet: true });
    while (advance(life, []).type !== 'death');
    return { birth: b, death: life.death };
  });
}

// 나이 age 에 그 사람은. 지금(2026)까지 살아 멈춘 사람은 그 나이를 넘기면 「지금도 살아 있음」(present)
export function peerAt(p, age) {
  if (p.death.present && age >= p.death.age) return { alive: true, present: true, age: p.death.age };
  return p.death.age < age ? { alive: false, death: p.death } : { alive: true, stage: stageOf(age) };
}
