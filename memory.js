// 모닥불 기억 구슬 (identity 설계 3.5): 지난 멈춤 뒤 이 생의 일지에서 고른 기억 0~3개 + 앞 생의 메아리 (흔적이 있을 때)
// DOM 없음. 모든 굴림은 sub(seed, age, 'memory') 에서 나온다 (같은 시드 = 같은 후보)
import { sub } from './rng.js';
import { AREAS } from './places.js';
import { householdOf } from './households.js';
import { groupOf, eraOf } from './births.js';
import { traceKey } from './traces.js';

// 점수: 식구 일·사건·갈림길 결정 3, 작은 일 줄 1. 이미 뽑은 kind 는 −2 (같으면 아직 안 뽑은 kind 가 먼저)
export const MEMORY_SCORE = { kin: 3, event: 3, decision: 3, tenacity: 4, line: 1 };
const SAME_KIND = -2;
export const ECHO_KIND = 'echo';

// 메아리 한 줄: 흔적(kind:key) → 줄. when 은 이번 생의 맥락 조건 (하나 또는 배열, 모두 맞아야 한다. 없으면 언제나)
//   coast·inland: 이번 생의 땅에 바닷가가 있나 · modern: 산업·현대 · premodern: 산업 전 (화덕·불씨 같은 말) · settled: 채집 무리가 아니다
//   writing: 글이 있던 때·땅 (흔적 카드 「눈에 익은 글자」와 같은 조건) · young: 5·15살 모닥불 (「처음 …」 글은 어릴 때만)
// 흔적마다 어느 땅·시대·나이에도 고를 줄이 셋 이상 있다 (시험). 말투는 일지와 같은 「-어요」, 끝 마침표는 두루마리에 적을 때 붙인다
export const ECHO_LINES = {
  'fear:sea': [
    { when: 'coast', ko: '파도가 밀려올 때마다 발이 먼저 뒤로 물러났어요', en: 'Every time a wave rolled in, your feet stepped back on their own' },
    { when: 'inland', ko: '깊은 물가에 서면 까닭 없이 숨이 짧아졌어요', en: 'At the edge of deep water, your breath went short for no reason' },
    { ko: '물 건너는 이야기만 나와도 괜히 목이 말랐어요', en: 'Any talk of crossing water left your throat dry' },
    { ko: '개울을 건널 때도 꼭 돌만 골라 디뎠어요', en: 'Even crossing a stream, you only ever stepped on the stones' },
    { ko: '비 오는 밤이면 물소리에 자꾸 잠이 깼어요', en: 'On rainy nights, the sound of water kept waking you' },
  ],
  'fear:fire': [
    { ko: '모닥불이 탁 튈 때마다 몸이 먼저 움찔했어요', en: 'Every time the fire popped, your body flinched before you did' },
    { when: 'premodern', ko: '불씨를 묻을 때는 꼭 두 번씩 살폈어요', en: 'When banking the fire, you always checked it twice' },
    { ko: '연기 냄새가 나면 눈이 먼저 문 쪽을 찾았어요', en: 'At the smell of smoke, your eyes went to the door first' },
    { when: 'premodern', ko: '화덕 앞에는 좀처럼 오래 앉지 못했어요', en: 'You could never sit long by the hearth' },
    { when: 'modern', ko: '난로 문을 열 때마다 몸을 비스듬히 비켰어요', en: 'Opening the stove door, you always leaned away' },
    { when: 'modern', ko: '불을 끄고 나와서도 꼭 한 번 더 돌아가 봤어요', en: 'Even after putting the fire out, you always went back to check once more' },
  ],
  'fear:war': [
    { when: 'modern', ko: '제복 입은 사람이 지나가면 괜히 길을 비켰어요', en: 'When someone in uniform walked by, you stepped aside without knowing why' },
    { ko: '먼 북소리에 이유 없이 가슴이 뛰었어요', en: 'Far-off drums set your heart racing for no reason' },
    { ko: '큰 소리가 나면 늘 누구보다 먼저 몸을 숙였어요', en: 'At any loud bang, you were always the first to duck' },
    { ko: '밤에 개가 짖으면 누구보다 먼저 일어나 앉았어요', en: 'When the dogs barked at night, you were the first to sit up' },
  ],
  'fear:plague': [
    { ko: '누가 기침만 해도 손이 먼저 입을 가렸어요', en: 'If anyone so much as coughed, your hand was already over your mouth' },
    { ko: '앓는 사람이 있는 집 앞을 지날 때면 저절로 숨을 참았어요', en: 'Walking past a house with someone sick inside, you held your breath without meaning to' },
    { ko: '남이 쓴 그릇은 꼭 한 번 더 헹궜어요', en: 'You always rinsed a borrowed bowl one more time' },
  ],
  'fear:hunger': [
    { ko: '그릇에 밥 한 톨 남긴 적이 없었어요', en: 'You never left a single grain in your bowl' },
    { ko: '먹을 것이 넉넉해도 꼭 조금씩 감춰 뒀어요', en: 'Even with plenty to eat, you always tucked a little away' },
    { ko: '먹을 것이 줄어들면 남보다 먼저 잠을 설쳤어요', en: 'When food ran low, you lost sleep before anyone else' },
  ],
  'fear:heights': [
    { when: 'settled', ko: '지붕에만 올라가도 무릎이 먼저 알아챘어요', en: 'Even on a rooftop, your knees noticed before you did' },
    { ko: '높은 나무는 쳐다만 봐도 어질했어요', en: 'Just looking up a tall tree made you dizzy' },
    { ko: '벼랑 길에서는 늘 안쪽으로만 붙어 걸었어요', en: 'On cliff paths you always hugged the inside edge' },
    { ko: '언덕 꼭대기에서도 아래를 내려다보지 못했어요', en: 'Even on a hilltop, you could not bring yourself to look down' },
  ],
  'fear:beast': [
    { ko: '밤짐승 우는 소리에 늘 누구보다 먼저 깼어요', en: 'At the cry of a night animal, you were always the first awake' },
    { ko: '풀숲이 바스락거리면 걸음부터 멈췄어요', en: 'When the grass rustled, your feet stopped first' },
    { ko: '짐승 발자국을 보면 저도 모르게 뒤를 돌아봤어요', en: 'At the sight of animal tracks, you glanced behind you without thinking' },
  ],
  'talent:craft': [
    { when: 'young', ko: '처음 쥔 연장이 손에 꼭 맞았어요', en: 'The first tool you picked up fit your hand exactly' },
    { ko: '망가진 물건은 한참 들여다보면 고칠 길이 보였어요', en: 'Stare at a broken thing long enough and you could see how to fix it' },
    { ko: '남이 무얼 만들면 손가락이 먼저 따라 움직였어요', en: 'Watching someone make something, your fingers moved along' },
    { ko: '매듭 하나도 남보다 단단하고 반듯하게 묶었어요', en: 'Even your knots came out tighter and neater than anyone else’s' },
  ],
  'talent:sea': [
    { when: ['coast', 'young'], ko: '처음 본 바다가 낯설지 않았어요', en: 'The sea did not feel new, even the first time' },
    { when: 'coast', ko: '아무도 안 가르쳐 준 물때를 알고 있었어요', en: 'Nobody taught you the tides, yet you knew them' },
    { when: 'inland', ko: '강물 빛만 보고도 내일 날씨를 맞혔어요', en: 'One look at the river and you could tell tomorrow’s weather' },
    { ko: '물에 뜨는 법은 배운 기억이 없는데 알고 있었어요', en: 'You never remembered learning to float, yet you could' },
    { ko: '바람 냄새만 맡아도 비가 올지 알았어요', en: 'One sniff of the wind and you knew whether rain was coming' },
    { ko: '물가에만 서면 마음이 이상하게 놓였어요', en: 'Standing by the water, you felt oddly at ease' },
  ],
  'talent:letters': [
    { when: ['writing', 'young'], ko: '처음 본 글자가 어쩐지 읽힐 것만 같았어요', en: 'The first letters you saw looked almost readable' },
    { when: 'writing', ko: '한 번 본 글자는 좀처럼 잊히지 않았어요', en: 'A letter seen once was hard to forget' },
    { ko: '한 번 들은 이야기는 토씨 하나 안 틀리고 옮겼어요', en: 'You could repeat a story word for word after hearing it once' },
    { ko: '이야기를 시작하면 다들 하던 일을 멈추고 귀를 기울였어요', en: 'When you told a story, everyone stopped what they were doing to listen' },
    { ko: '노랫말이나 이름은 한 번 들으면 외웠어요', en: 'Song words and names stuck after hearing them once' },
  ],
  'talent:heal': [
    { ko: '풀잎 냄새만 맡아도 어디에 쓰는지 알 것 같았어요', en: 'One sniff of a leaf and you seemed to know what it was for' },
    { ko: '아픈 사람 이마에 손을 얹으면 열이 먼저 느껴졌어요', en: 'With a hand on a sick brow, you could feel the fever before anyone said a word' },
    { ko: '다친 짐승도 품에 안으면 얌전해졌어요', en: 'Even hurt animals went still in your arms' },
    { ko: '상처를 보면 무엇부터 할지 저절로 떠올랐어요', en: 'At the sight of a wound, you knew what to do first' },
  ],
  'talent:music': [
    { ko: '처음 듣는 노래를 끝까지 따라 불렀어요', en: 'You sang along to a song you had never heard, right to the end' },
    { ko: '장단만 들어도 발이 먼저 박자를 맞췄어요', en: 'Hearing a rhythm, your feet found the beat before you did' },
    { ko: '흥얼거리기만 해도 곁에 있던 사람이 조용해졌어요', en: 'Even your humming hushed the people around you' },
    { ko: '피리 소리가 들리면 하던 일을 멈추고 귀를 기울였어요', en: 'When a pipe played, you stopped what you were doing to listen' },
  ],
  'talent:trade': [
    { when: 'modern', ko: '셈을 배우기도 전에 거스름돈이 틀린 걸 알았어요', en: 'Before you could count, you knew when the change was wrong' },
    { ko: '배운 적 없는 셈이 머릿속에서 저절로 맞았어요', en: 'Sums nobody taught you came out right in your head' },
    { ko: '흥정만 시작되면 눈이 반짝였어요', en: 'The moment the haggling began, your eyes lit up' },
    { ko: '물건 값은 한 번 들으면 잊지 않았어요', en: 'Once you heard a price, you never forgot it' },
  ],
  'talent:farm': [
    { ko: '흙을 한 줌 쥐면 비가 언제 올지 알 것 같았어요', en: 'With a handful of soil, you could almost tell when the rain would come' },
    { ko: '씨앗을 손에 쥐면 어디에 묻을지 저절로 알았어요', en: 'Holding a seed, you knew just where it should go' },
    { ko: '시든 모종도 옮겨 심으면 다시 고개를 들었어요', en: 'Even wilted seedlings perked up once you replanted them' },
  ],
  'talent:fight': [
    { ko: '누가 밀치면 주먹이 생각보다 먼저 나갔어요', en: 'When someone shoved you, your fist moved before your thoughts did' },
    { ko: '몸싸움에서는 좀처럼 지지 않았어요', en: 'In a scuffle, you hardly ever lost' },
    { ko: '날아오는 것은 무엇이든 먼저 피했어요', en: 'Whatever came flying at you, you dodged it first' },
  ],
  'dream:sea': [
    { when: 'coast', ko: '떠나는 배를 해가 질 때까지 바라봤어요', en: 'You watched a departing boat until the sun went down' },
    { when: 'inland', ko: '본 적 없는 바다 꿈을 자주 꿨어요', en: 'You often dreamed of a sea you had never seen' },
    { ko: '수평선 이야기만 나오면 가슴이 뛰었어요', en: 'Any talk of the horizon set your heart racing' },
    { ko: '조개껍데기 하나를 오래도록 품에 지니고 다녔어요', en: 'You carried a single seashell with you for years' },
    { ko: '물새가 날아가는 쪽을 자꾸 눈으로 좇았어요', en: 'Your eyes kept following the water birds as they flew off' },
  ],
  'dream:letters': [
    { when: 'writing', ko: '글 읽는 소리가 들리면 발이 저절로 멈췄어요', en: 'Whenever someone read aloud, your feet stopped on their own' },
    { when: 'writing', ko: '남이 쓴 글자를 손가락으로 몰래 따라 그렸어요', en: 'You secretly traced other people’s letters with a finger' },
    { ko: '이야기꾼 곁에 앉으면 해가 지는 줄도 몰랐어요', en: 'Sitting by a storyteller, you never noticed the sun going down' },
    { ko: '들은 이야기를 잊을까 봐 몇 번이고 되뇌었어요', en: 'You repeated stories to yourself so you would not forget them' },
    { ko: '막대기로 땅에 무늬를 그리며 무언가 남기고 싶어 했어요', en: 'You scratched patterns in the dirt with a stick, wanting to leave something behind' },
  ],
  'dream:travel': [
    { ko: '길 끝을 보면 그 너머가 자꾸 궁금했어요', en: 'Whenever you saw the end of a road, you wondered what lay past it' },
    { ko: '떠나는 사람들 뒷모습을 오래 바라봤어요', en: 'You watched travelers leave until they were out of sight' },
    { ko: '먼 데서 온 사람 이야기라면 밤새 들었어요', en: 'You would listen all night to anyone from far away' },
    { ko: '짐을 싸는 꿈을 자주 꿨어요', en: 'You often dreamed of packing for a journey' },
  ],
  'dream:city': [
    { when: 'modern', ko: '큰 도시 이름만 들어도 가슴이 뛰었어요', en: 'Just hearing the name of a big city made your heart race' },
    { ko: '먼 성벽 안 이야기라면 귀를 쫑긋 세웠어요', en: 'Any story about life behind distant city walls had your full attention' },
    { ko: '사람 많은 장터에 가면 이상하게 기운이 났어요', en: 'Crowded markets gave you a strange burst of energy' },
    { ko: '밤에 먼 불빛을 보면 저기엔 누가 사나 궁금했어요', en: 'Seeing distant lights at night, you wondered who lived there' },
  ],
  'dream:music': [
    { ko: '노래하는 사람 곁을 좀처럼 떠나지 못했어요', en: 'You could hardly tear yourself away from anyone singing' },
    { ko: '잔치에서는 늘 노래하는 자리 가까이 앉았어요', en: 'At feasts, you always sat close to the singers' },
    { ko: '혼자 있을 때면 아무도 모르는 노래를 지어 불렀어요', en: 'Alone, you made up songs nobody else knew' },
  ],
  'bond:friend': [
    { ko: '처음 본 얼굴이 오래 알던 사람 같았어요', en: 'A face you had never seen felt like someone you had always known' },
    { ko: '낯선 사람과도 금세 오랜 친구처럼 웃었어요', en: 'You were soon laughing with strangers like old friends' },
    { ko: '누군가를 기다리는 것처럼 문 쪽을 자주 봤어요', en: 'You kept glancing at the door, as if expecting someone' },
  ],
  'bond:rival': [
    { ko: '처음 본 사람인데 이상하게 지고 싶지 않았어요', en: 'You had only just met, and yet you strangely refused to lose to them' },
    { ko: '누가 앞서가면 괜히 걸음이 빨라졌어요', en: 'If anyone walked ahead of you, your pace quickened for no reason' },
    { ko: '낯선 얼굴 하나가 이유 없이 마음에 걸렸어요', en: 'One stranger’s face bothered you for no reason' },
  ],
};
// 흔적 줄을 다 보였을 때: 앞 생의 땅·집안에서 오는 데자뷔 (far: 앞 생과 다른 땅에서만)
export const ECHO_FALLBACK = [
  { far: true, ko: (p) => `${p}의 바람 냄새가 문득 스쳤어요`, en: (p) => `For a moment, the wind smelled like ${p}` },
  { far: true, ko: (p) => `꿈속에서 ${p}의 길을 걷다 깼어요`, en: (p) => `You woke from a dream of walking the roads of ${p}` },
  { ko: (p) => `${p} 이야기만 나오면 귀가 저절로 기울었어요`, en: (p) => `Whenever anyone spoke of ${p}, you leaned in` },
  { ko: (p, h) => `${h}의 저녁 냄새가 꿈에 스쳤어요`, en: (p, h) => `You dreamed of sitting down to supper with ${h}` },
  { ko: (p, h) => `손이 ${h}에서 하던 일을 기억하는 것 같았어요`, en: (p, h) => `Your hands seemed to remember the work of ${h}` },
];
const MODERN = ['industrial', 'modern'];
// 글이 있던 때·땅 (흔적 카드 t.talent.letters 와 같은 조건): 산업·현대는 어디서나, 그 앞은 고대 제국~산업혁명기의 이 땅들
const LETTER_AREAS = ['china', 'japan', 'korea', 'india', 'bengal', 'indus', 'lanka', 'anatolia', 'iran', 'nile', 'mesopotamia', 'arabia', 'maghreb', 'steppe', 'france', 'italy', 'germany', 'iberia', 'britain', 'nordic', 'balkans', 'east_africa', 'mesoamerica', 'mainland_sea'];
export function echoContext(life) {
  const area = AREAS[life.birth.area], group = groupOf(life.year), era = eraOf(life.year).id;
  return {
    coast: !!(area && area.coast), group, young: life.age <= 15,
    writing: MODERN.includes(group) || (era >= 5 && era <= 10 && LETTER_AREAS.includes(life.birth.area)),
  };
}
function whenOk(when, ctx) {
  if (Array.isArray(when)) return when.every((w) => whenOk(w, ctx));
  if (!when) return true;
  if (when === 'coast') return ctx.coast;
  if (when === 'inland') return !ctx.coast;
  if (when === 'modern') return MODERN.includes(ctx.group);
  if (when === 'premodern') return !MODERN.includes(ctx.group);
  if (when === 'settled') return ctx.group !== 'forager';
  if (when === 'writing') return ctx.writing;
  if (when === 'young') return ctx.young;
  return false;
}
// 이 맥락에서 고를 수 있는 줄 (자리 번호 i 는 「보인 줄」 열쇠 key#i 에 쓴다)
export const echoRows = (key, ctx) => (ECHO_LINES[key] || []).map((row, i) => ({ row, id: `${key}#${i}` })).filter((x) => whenOk(x.row.when, ctx));

// 지금 모닥불의 일지 범위 [from, to): 바로 앞 멈춤 표시부터 이번 멈춤 표시까지 (멈춤이 아닐 때 부르면 일지 끝까지)
function windowOf(life) {
  const marks = life.pauseMarks || [], n = marks.length;
  const at = n && marks[n - 1].age === life.age ? n - 1 : n;
  return [at > 0 ? marks[at - 1].j : 0, at < n ? marks[at].j : life.journal.length];
}

// 첫 문장만 (끝 마침표는 뗀다). 너무 짧으면 전체
function clip(s) {
  const t = String(s || '').trim(), m = t.match(/^(.*?[.!?])(\s|$)/);
  const head = m && m[1].length >= 6 ? m[1] : t;
  return head.replace(/[.。]$/, '');
}
const ICON_OF_ABOUT = { wed: 'rings', baby: 'cradle', event: 'flame' };
function iconOf(e) {
  if (e.kind === 'kin') return e.kin === 'wed' ? 'rings' : 'cradle';
  if (e.kind === 'event') return 'flame';
  if (e.kind === 'tenacity') return 'flame';
  if (e.kind === 'decision') return ICON_OF_ABOUT[e.about] || 'sign';
  return 'scroll';
}
function lifeMemory(e, j) {
  const text = e.kind === 'decision'
    ? (e.short && e.short.ko && e.short.en ? { ko: e.short.ko, en: e.short.en } : { ko: e.text.ko.split(' — ')[0], en: e.text.en.split(' — ')[0] })
    : { ko: clip(e.text.ko), en: clip(e.text.en) };
  return { id: `j${j}`, kind: 'life', jkind: e.kind, age: e.age, year: e.year, text, icon: iconOf(e), j };
}

// 메아리가 될 흔적: 앞 생이 남긴 흔적 (앞 생 기록의 gained, 없으면 이번 생이 지고 온 traces). 줄이 있는 것만
function echoTraces(life, prevLife) {
  if (!prevLife) return [];
  const list = Array.isArray(prevLife.gained) ? prevLife.gained : life.traces || [];
  return list.filter((t) => t && ECHO_LINES[traceKey(t)]);
}
function echoFrom(prevLife) {
  const b = prevLife && prevLife.birth, area = b && AREAS[b.area], h = b && householdOf(b.group, b.household);
  if (!area || !h) return { ko: '앞 생의 메아리', en: 'Echo of a past life' };
  return { ko: `앞 생의 메아리 · ${area.short.ko}의 ${h.ko}`, en: `Echo of a past life · ${h.en} in ${area.short.en}` };
}
// 메아리 한 줄 고르기: 이 생에서 이미 보인 줄(life.echoSeen)은 건너뛴다
//   1) 이번 차례 흔적(멈춤마다 돌아가며, 시작 자리는 생마다 시드로)의 안 보인 줄 → 2) 앞 생의 다른 흔적의 안 보인 줄
//   → 3) 앞 생의 땅·집안에서 오는 데자뷔 줄 (짙어지는 흔적은 이번 차례 흔적) → 4) 그것도 다 보였으면 메아리 없음 (null)
function echoMemory(life, prevLife, trs, r) {
  const nth = (life.pauseMarks || []).filter((m) => m.age < life.age).length, seen = new Set(life.echoSeen || []);
  const start = sub(life.birth.seed, 'memory', 'echo').int(trs.length) + nth;
  const order = trs.map((_, i) => trs[(start + i) % trs.length]), ctx = echoContext(life);
  const make = (key, line, ko, en) => ({ id: `echo:${key}`, kind: ECHO_KIND, age: life.age, year: life.year, text: { ko, en }, sub: echoFrom(prevLife), icon: 'ember', trace: key, line });
  for (const tr of order) {
    const key = traceKey(tr), rows = echoRows(key, ctx).filter((x) => !seen.has(x.id));
    if (rows.length) { const x = rows[r.int(rows.length)]; return make(key, x.id, x.row.ko, x.row.en); }
  }
  const pb = prevLife && prevLife.birth, area = pb && AREAS[pb.area], h = pb && householdOf(pb.group, pb.household);
  if (!area || !h) return null;
  const far = pb.area !== life.birth.area;
  const fb = ECHO_FALLBACK.map((f, i) => ({ f, id: `prev#${i}` })).filter((x) => (far || !x.f.far) && !seen.has(x.id));
  if (!fb.length) return null;
  const x = fb[r.int(fb.length)];
  return make(traceKey(order[0]), x.id, x.f.ko(area.short.ko, h.ko), x.f.en(area.short.en, h.en));
}

const cmp = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i]; return 0; };

// 이번 모닥불의 기억 후보 (0~3개, 일지 순서). 앞 생이 있고 흔적이 있으면 마지막이 메아리
// [{ id, kind: 'life'|'echo', age, year, text: {ko,en}, icon, j?(일지 자리), jkind?, sub?(메아리 출처), trace?, line?(메아리 줄 열쇠) }]
// 이 생의 일이 하나도 없으면 [] (모닥불은 조용히 지나간다). 메아리 줄이 다 떨어지면 메아리 없이 이 생의 일 셋
export function memoryCandidates(life, prevLife = null) {
  const [from, to] = windowOf(life);
  const pool = [];
  for (let j = from; j < to; j++) {
    const e = life.journal[j];
    if (e && MEMORY_SCORE[e.kind] != null && e.text && e.text.ko && e.text.en) pool.push({ e, j, taken: false });
  }
  if (!pool.length) return [];
  const r = sub(life.birth.seed, life.age, 'memory');
  for (const p of pool) p.jit = r.next();
  const trs = echoTraces(life, prevLife), echo = trs.length ? echoMemory(life, prevLife, trs, r) : null;
  const want = Math.min(pool.length, echo ? 2 : 3);
  const picked = [], used = new Set();
  while (picked.length < want) {
    let best = null, bk = null;
    for (const p of pool) {
      if (p.taken) continue;
      const fresh = !used.has(p.e.kind), k = [MEMORY_SCORE[p.e.kind] + (fresh ? 0 : SAME_KIND), fresh ? 1 : 0, p.jit];
      if (!best || cmp(k, bk) > 0) { best = p; bk = k; }
    }
    best.taken = true; used.add(best.e.kind); picked.push(best);
  }
  picked.sort((a, b) => a.j - b.j);
  const out = picked.map(({ e, j }) => lifeMemory(e, j));
  if (echo) out.push(echo);
  return out;
}

// 모닥불에 띄운 메아리 줄을 「이 생에서 보인 줄」로 적는다 (고르지 않아도). 다음 모닥불은 다른 줄을 고른다
export function seeMemories(life, cands) {
  if (!life.echoSeen) life.echoSeen = [];
  for (const c of cands || []) if (c.kind === ECHO_KIND && c.line && !life.echoSeen.includes(c.line)) life.echoSeen.push(c.line);
}

// 고르지 않으면 꿰어질 「가장 최근」 기억: 이 생의 일 가운데 일지에서 가장 뒤 (메아리는 지금 일이 아니라 빼고)
export function latestMemory(cands) {
  const own = (cands || []).filter((c) => c.kind !== ECHO_KIND);
  return own.length ? own.reduce((m, c) => (c.j > m.j ? c : m)) : (cands && cands[0]) || null;
}

// 고른 기억을 이 생에 꿴다. 메아리면 그 흔적이 짙어지고 (traceBoost +1), 두루마리에 메아리 줄이 남는다
export function pickMemory(life, cand) {
  if (!cand || !cand.id) return null;
  if (!life.memories) life.memories = [];
  if (!life.traceBoost) life.traceBoost = {};
  const m = { id: cand.id, kind: cand.kind, age: cand.age, year: cand.year, at: life.age, text: { ko: cand.text.ko, en: cand.text.en }, icon: cand.icon };
  if (cand.kind === ECHO_KIND) {
    seeMemories(life, [cand]);
    m.trace = cand.trace; m.sub = cand.sub ? { ko: cand.sub.ko, en: cand.sub.en } : null;
    life.traceBoost[cand.trace] = (life.traceBoost[cand.trace] || 0) + 1;
    const end = (s) => (/[.!?]$/.test(s) ? s : s + '.');
    life.journal.push({ age: life.age, year: life.year, kind: ECHO_KIND, text: { ko: end(cand.text.ko), en: end(cand.text.en) }, trace: cand.trace });
  } else m.j = cand.j;
  life.memories.push(m);
  return m;
}
