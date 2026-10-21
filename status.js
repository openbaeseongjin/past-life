// 신분 (sim2 설계 2.3): 시대·땅의 신분제(contextOf 의 status) 에서 집안으로 고른다. 드문 카드로 한 계단씩 오르내린다
// life.status = { id, rank, ko, en, bound }
//   id    : 사다리 자리 (그 묶음 신분표의 집안 열쇠). 태어날 때는 그 생의 household, 오르내리면 그 계단의 집안
//   rank  : 1~5 (1 매인 사람 … 5 귀족·지배층) · bound: 땅·주인에 묶임 (떠나기·직업 바꾸기 카드 조건 when.bound)
// 신분은 생명표·죽음 굴림에 들어가지 않는다.
// ctx.status.ranks 는 그 묶음 집안(+ 그 생의 집안)만 담는다 (context.js). 사다리는 그 열쇠들만 훑는다.

const FALLBACK = { ko: '평범한 집', en: 'ordinary household', rank: 2, bound: false };
const pack = (id, r) => ({ id, rank: r.rank, ko: r.ko, en: r.en, bound: !!r.bound });

// 태어날 때의 신분
export function statusOf(birth, ctx) {
  const id = birth.household, r = (ctx && ctx.status && ctx.status.ranks[id]) || FALLBACK;
  return pack(id, r);
}

// 그해 맥락으로 이름·묶임을 고쳐 쓴다 (해가 바뀌어 묶음·기간이 바뀌면: 예 1866년 북아메리카 노예 → 하인).
// 사다리 자리(id)는 그대로. 그해 신분표에 그 자리가 없으면(앞 묶음에서 오른 자리) 그대로 둔다. 조용히 바꾼다 (기록 줄 없음)
export function refreshStatus(life) {
  const ctx = life.ctx ? life.ctx() : null, r = ctx && ctx.status.ranks[life.status.id];
  if (r) life.status = pack(life.status.id, r);
  return life.status;
}

// 한 계단 위아래 (d 계단, 순위 값이 다른 칸만 센다). 같은 순위 칸이 여럿이면 태어난 집안 → 신분표 차례의 첫째.
// 움직였으면 인생 기록에 한 줄 (kind 'status', status.d = 실제로 움직인 계단 수, 부호 있음) 남기고 true, 사다리 끝이면 그대로 false.
// 끝에 닿아 덜 움직였으면(예: d +2 인데 한 계단 위가 끝) 움직인 만큼만 적는다
export function shiftStatus(life, d) {
  const steps = Math.trunc(Number(d) || 0);
  if (!steps) return false;
  const ranks = life.ctx().status.ranks;
  const ladder = Object.keys(ranks).map((id) => pack(id, ranks[id]));
  const levels = [...new Set(ladder.map((x) => x.rank))].sort((a, b) => a - b);
  const from = life.status;
  const higher = levels.filter((v) => v > from.rank), lower = levels.filter((v) => v < from.rank);
  const moved = steps > 0 ? Math.min(steps, higher.length) : -Math.min(-steps, lower.length);
  if (!moved) return false;
  const target = moved > 0 ? higher[moved - 1] : lower[lower.length + moved];
  const at = ladder.filter((x) => x.rank === target);
  const to = at.find((x) => x.id === life.birth.household) || at[0];
  life.status = to;
  const up = moved > 0, n = Math.abs(moved);
  // 실제로 움직인 계단 수로 쓴다 (한 계단 · 두 계단 … / a rung · two rungs …)
  const ko = `${['', '한', '두', '세', '네'][n] || n} 계단`, en = n === 1 ? 'a rung' : `${['', 'one', 'two', 'three', 'four'][n] || n} rungs`;
  life.journal.push({
    age: life.age, year: life.year, kind: 'status', status: { from: from.id, to: to.id, d: moved },
    text: up
      ? { ko: `신분이 ${ko} 올랐어요 (${from.ko} → ${to.ko}). 이웃들의 인사가 조금 길어졌어요.`, en: `You rose ${en} (${from.en} → ${to.en}). The neighbors' greetings got a little longer.` }
      : { ko: `신분이 ${ko} 내려앉았어요 (${from.ko} → ${to.ko}). 그래도 아침은 똑같이 왔어요.`, en: `You slipped ${en} (${from.en} → ${to.en}). The mornings came all the same.` },
  });
  return true;
}
