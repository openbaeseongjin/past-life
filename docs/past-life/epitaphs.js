// 묘비 한 줄 (화면 다시 기획 4.3): 매듭 화면 맨 위. 사인·나이 숫자 없이, 과거형, 「당신」 없이
import { sub } from './rng.js';

const E = (ko, en) => ({ ko, en });
export const EPITAPHS = {
  baby: [
    E('이 세상을 잠깐 둘러보고 갔어요.', 'Took a short look at the world, then left.'),
    E('이름이 불린 날보다 안긴 날이 많았어요.', 'Was held more often than called by name.'),
    E('짧았지만, 누군가의 품이 기억해요.', 'Brief, but someone’s arms remember.'),
  ],
  child: [
    E('뛰어다니다 너무 일찍 멈췄어요.', 'Ran everywhere, and stopped far too soon.'),
    E('어른이 되는 법은 다음 생에 배우기로 했어요.', 'Saved growing up for another life.'),
    E('마을 골목마다 웃음소리를 두고 갔어요.', 'Left laughter in every lane of the village.'),
  ],
  present: [
    E('아직 쓰는 중인 이야기예요.', 'A story still being written.'),
    E('매듭은 아직이에요. 그 실이 오늘도 길어져요.', 'No knot yet. The thread grows longer today.'),
    E('오늘도 구슬 한 알을 꿰는 중이에요.', 'Still threading one more bead today.'),
  ],
  work: [
    E('평생 두 손을 쉬게 두지 않았어요.', 'Worked with both hands, all life long.'),
    E('쉬는 법은 끝내 배우지 못했어요.', 'Never quite learned how to rest.'),
    E('남긴 것 대부분은 손으로 만든 것이었어요.', 'Most of what was left behind was made by hand.'),
  ],
  learn: [
    E('끝까지 무언가를 배우던 사람이었어요.', 'Was still learning something at the very end.'),
    E('궁금한 것이 늘 하나 더 있었어요.', 'There was always one more question.'),
    E('아는 것을 아낌없이 나눠 주었어요.', 'Knew a great deal, and gave it all away.'),
  ],
  family: [
    E('식구들 곁을 끝내 떠나지 않았어요.', 'Never strayed far from family.'),
    E('밥상에 둘러앉은 얼굴들이 가장 큰 재산이었어요.', 'The faces around the table were the real fortune.'),
    E('이웃의 대문이 늘 열려 있던 사람이었어요.', 'Every neighbor’s door was always open.'),
  ],
  body: [
    E('몸을 돌보며 먼 길을 걸었어요.', 'Cared for the body, and walked a long way.'),
    E('마을에서 가장 튼튼한 다리를 가졌어요.', 'Had the sturdiest legs in the village.'),
    E('아침이면 해가 뜨기 전에 일어났어요.', 'Rose before the sun most mornings.'),
  ],
  rest: [
    E('서두르지 않고 살았어요.', 'Lived without hurrying.'),
    E('노래와 낮잠을 아끼지 않았어요.', 'Never skimped on songs or naps.'),
    E('좋은 그늘을 알아보는 눈이 있었어요.', 'Had an eye for a good patch of shade.'),
  ],
};

// 어느 묶음인가: 지금(2026) 멈춤 → present, 다섯 살 전 → baby, 열다섯 살 전 → child, 그 밖은 가장 오래 든 패
export function epitaphGroup(life, sum) {
  const d = life.death;
  if (d && d.present) return 'present';
  const age = d ? d.age : life.age;
  if (age < 5) return 'baby';
  if (age < 15) return 'child';
  return sum && EPITAPHS[sum.topFocus] ? sum.topFocus : 'work';
}

export function epitaphOf(life, sum, lang) {
  const line = sub(life.birth.seed, 'epitaph').pick(EPITAPHS[epitaphGroup(life, sum)]);
  return line[lang] || line.ko;
}
