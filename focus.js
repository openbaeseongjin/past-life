// 올해의 초점 (설계 12장): 여섯 살부터 한 해를 어디에 쓸지. 고르지 않으면 가장 급한 수치 쪽으로 저절로
// 기본(「일」)은 건강을 건드리지 않아 건강 평균이 50에 머문다 → 생명표 맞춤이 깨지지 않는다
export const FOCI = ['work', 'learn', 'family', 'body', 'rest'];
const N = (ko, en) => ({ ko, en });
export const FOCUS_NAME = {
  work: { child: N('집안 돕기', 'Help at home'), grown: N('일', 'Work'), old: N('소일거리', 'Odd jobs') },
  learn: { child: N('배우기', 'Learn'), grown: N('배우기', 'Learn'), old: N('배우기', 'Learn') },
  family: { child: N('친구와 놀기', 'Friends'), grown: N('가족·이웃', 'Family & neighbors'), old: N('손주·이웃', 'Family & neighbors') },
  body: { child: N('뛰어놀기', 'Run around'), grown: N('몸 돌보기', 'Look after yourself'), old: N('몸 돌보기', 'Look after yourself') },
  rest: { child: N('혼자 놀기', 'Daydream'), grown: N('쉬기·놀기', 'Rest & play'), old: N('쉬기', 'Rest') },
};
export const FOCUS_EFFECT = {
  work: { child: { family: 1, happy: -1 }, grown: { wealth: 3, happy: -1 }, old: { wealth: 1 } },
  learn: { child: { happy: -1 }, grown: { happy: -1 }, old: { happy: 1 } },
  family: { child: { happy: 2 }, grown: { family: 3, wealth: -1 }, old: { family: 3 } },
  body: { child: { health: 1.5 }, grown: { health: 2, wealth: -1 }, old: { health: 2, wealth: -1 } },
  rest: { child: { happy: 2 }, grown: { happy: 3, wealth: -1 }, old: { happy: 3 } },
};
export const focusStage = (age) => (age < 13 ? 'child' : age < 60 ? 'grown' : 'old');
// 일로 늘어나는 재주 (집안 태그 → 재능 key)
const WORK_SKILL = { farm: 'farm', herd: 'farm', sea: 'sea', craft: 'craft', trade: 'trade', serve: 'craft', elite: 'letters', hunt: 'fight', factory: 'craft', office: 'letters' };
export const workSkill = (tags) => WORK_SKILL[tags.find((t) => WORK_SKILL[t])] || 'craft';
// 고르지 않았을 때: 가장 급한 쪽
export function autoFocus(stats) {
  if (stats.health < 40) return 'body';
  if (stats.wealth < 30) return 'work';
  if (stats.family < 40) return 'family';
  if (stats.happy < 40) return 'rest';
  return 'work';
}

// ── 능력치 넷 (sim2 설계 2.2): 0~100. 생명표·죽음 굴림에는 절대 닿지 않는다 (몸 health 를 건드리지 않는다) ──
export const ATTRS = ['luck', 'charm', 'know', 'skill'];
// 태어날 때 시드로 고르게 (지식은 여기에 배울 기회 × KNOW_SCHOOL 을 더한다: 집안·시대가 높이면 위로)
export const ATTR_START = { luck: [20, 80], charm: [25, 75], know: [5, 20], skill: [20, 60] };
export const KNOW_SCHOOL = 20;
// 올해의 패가 키우는 능력치의 기본량 (해마다, 여섯 살부터 · 단계 구분 없음). 배우기의 지식은 그해 맥락의 배울 기회(school) 를 곱한다
export const FOCUS_ATTR = { work: { skill: 1.5 }, learn: { know: 2.5 }, family: { charm: 1.5 } };
export const clampAttr = (x) => Math.max(0, Math.min(100, Number.isFinite(x) ? x : 50));
// 실제로 오르는 양은 남은 칸에 비례한다: 기본량 × (100 − 지금 값) / 60 (작업 3 수정 1차, 컨트롤러 결정).
// 값 40 에서 기본량 그대로, 낮으면 조금 빠르고 높으면 느리다. 100 에 닿지 않아 시작값의 차이가 노년까지 남는다
// (자동 결정 생 손재주: 40살 중앙값 89 → 74 · 60살 ≥95 98% → 0%. 늘 가족·이웃 친화력 40살 ≥95 61% → 0%)
export const ATTR_ROOM = 60;
export const attrGain = (base, x) => (base * (100 - clampAttr(x))) / ATTR_ROOM;
// 지식이 이만큼이면 글을 읽는다 (설계 2.2): 생의 flags.literate 를 세운다 (카드 「글을 배우는」 선택과 같은 깃발)
export const KNOW_READ = 60;
// 행운: 운에 맡기는 확률에 더하는 값 (±0.2) · 친화력: 혼인·아이 굴림과 곁이 오르는 양의 배율 · 손재주: 「일」의 재산 배율 (× 그해 품삯)
export const attrShift = (x) => (clampAttr(x) - 50) / 250;
export const luckShift = attrShift;
// 손재주는 장인 재주(choice.skill 'craft')가 걸린 운에 맡기는 선택에도 같은 꼴(±0.2)로 더한다 (설계 2.2 「장인·대장장이 카드의 성공 확률」)
export const CRAFT_SKILLS = ['craft'];
export const charmMul = (charm) => (200 + clampAttr(charm)) / 250;   // = 0.8 + 친화력/250 (정수면 딱 떨어지게)
export const skillMul = (skill) => (200 + clampAttr(skill)) / 250;   // = 0.8 + 손재주/250

// 올해의 패 한 장이 한 해에 주는 것 (life.js endYear 가 더하고, 화면 ui.js 올해의 패가 그대로 보인다 — 식은 여기 하나).
// → { 수치 키: 더할 값, 능력치 키: 자랄 값 }
//   수치: FOCUS_EFFECT 의 값. 오르는 쪽만 배율: 「일」의 재산 × 그해 품삯(ctx.econ.wage) × 손재주 배율, 곁 × 친화력 배율. 내리는 쪽·몸·마음은 그대로 (생명표 맞춤)
//   능력치: FOCUS_ATTR 기본량(배우기의 지식은 × 그해 배울 기회 ctx.school)을 남은 칸에 비례해 (attrGain)
// ctx 는 그해 맥락 (contextOf). 없으면 life.ctx()
export function focusYearEffects(life, focus, ctx = life.ctx()) {
  const st = focusStage(life.age), a = life.attrs || {}, out = {};
  for (const [k, v] of Object.entries(FOCUS_EFFECT[focus][st])) {
    const m = v <= 0 ? 1 : k === 'wealth' && focus === 'work' ? ctx.econ.wage * skillMul(a.skill) : k === 'family' ? charmMul(a.charm) : 1;
    out[k] = v * m;
  }
  for (const [k, v] of Object.entries(FOCUS_ATTR[focus] || {})) out[k] = attrGain(k === 'know' ? v * ctx.school : v, a[k]);
  return out;
}
