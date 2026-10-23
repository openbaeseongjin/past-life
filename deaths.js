// 사인 표와 사인 글 (설계 4장). fear: 다음 생에 남는 두려움 흔적 key
const C = (ko, en, fear, kos, ens) => ({ name: { ko, en }, fear, ko: kos, en: ens });
export const CAUSES = {
  fever: C('열병', 'fever', null,
    ['열병이 사흘 만에 당신을 데려갔어요.', '열이 내리지 않았어요. 그해 그런 사람이 당신 혼자만은 아니었어요.'],
    ['A fever took you in three days.', 'The fever never broke. You were not the only one that year.']),
  diarrhea: C('배앓이', 'a stomach sickness', null,
    ['배앓이가 멈추지 않았어요. 물이 늘 깨끗하지는 않았어요.', '작은 몸이 버티기에는 너무 긴 배앓이였어요.'],
    ['The stomach sickness would not stop. The water was not always clean.', 'It was too long an illness for so small a body.']),
  hunger: C('굶주림', 'hunger', 'hunger',
    ['그해 곡식이 모자랐어요. 당신 몫도.', '굶주림은 조용히 와서 오래 머물렀어요.'],
    ['Food ran short that year. So did your share.', 'Hunger came quietly and stayed a long time.']),
  weak: C('약한 몸', 'a frail body', null,
    ['처음부터 약하게 태어났어요. 짧았지만, 사랑받았어요.', '세상에 오래 머물기에는 몸이 너무 작았어요.'],
    ['You were born frail. A short life, but a loved one.', 'Your body was too small to stay long.']),
  accident: C('사고', 'an accident', null,
    ['아무도 예상하지 못한 사고였어요. 사고란 원래 그래요.', '평범한 하루였어요. 끝만 빼고요.'],
    ['No one saw the accident coming. They never do.', 'It was an ordinary day, except for the end.']),
  fire: C('화재', 'fire', 'fire',
    ['한밤중에 불이 났어요. 지붕은 생각보다 빨리 탔어요.', '불은 금방 번졌고, 당신은 늦게 깼어요.'],
    ['A fire started in the night. The roof burned faster than anyone thought.', 'The fire spread fast; you woke too late.']),
  plague: C('역병', 'an epidemic', 'plague',
    ['역병이 휩쓸고 갔어요. 당신 이름도 그 목록에 올랐어요.', '전염병은 사람을 가리지 않았어요.'],
    ['The epidemic swept through, and your name joined the list.', 'The sickness did not pick and choose.']),
  drown: C('익사', 'drowning', 'sea',
    ['물이 생각보다 차갑고 깊었어요.', '바다는 그날 당신을 돌려보내지 않았어요.'],
    ['The water was colder and deeper than it looked.', 'That day the sea did not give you back.']),
  fall: C('추락', 'a fall', 'heights',
    ['발을 헛디뎠어요. 땅이 너무 빨리 다가왔어요.', '높은 곳에서 떨어졌어요. 순식간이었어요.'],
    ['You missed a step, and the ground came up too fast.', 'You fell from a height. It was over in a moment.']),
  beast: C('짐승의 습격', 'a wild animal', 'beast',
    ['숲에서 마주친 짐승이 당신보다 빨랐어요.', '짐승은 배가 고팠고, 당신은 운이 없었어요.'],
    ['The animal you met in the woods was faster than you.', 'The beast was hungry, and you were unlucky.']),
  war: C('전쟁', 'war', 'war',
    ['전쟁은 당신이 고르지 않은 싸움이었어요.', '군대가 마을을 지나갔어요. 당신은 그 길 위에 있었어요.'],
    ['War was a fight you never chose.', 'An army passed through the village. You were on its road.']),
  // 강제 노역 (사건 사인만: 콩고 자유국의 고무 할당 congo_rubber). 생명표 굴림의 사인표에는 없다
  forced: C('강제 노역', 'forced labour', null,
    ['남의 몫을 채우느라 몸이 먼저 무너졌어요.', '할당량은 사람의 사정을 봐주지 않았어요.'],
    ["Filling someone else's quota, your body gave out first.", 'The quota made no allowance for anyone.']),
  childbirth: C('출산', 'childbirth', null,
    ['아이를 낳다가 숨을 거뒀어요. 흔한 일이었든 드문 일이었든, 슬픔은 같았어요.', '아이를 낳던 날 세상을 떠났어요.'],
    ['You died giving birth. Common or rare in your time, the grief was the same.', 'You died on the day you gave birth.']),
  lung: C('폐병', 'a lung disease', null,
    ['기침이 몇 해 동안 따라다녔어요.', '숨이 조금씩 짧아지다가, 멈췄어요.'],
    ['A cough followed you for years.', 'Your breath grew shorter, then stopped.']),
  oldage: C('노환', 'old age', null,
    ['오래 살았어요. 마지막 날은 조용했어요.', '잠들듯이 갔어요. 누구나 바라는 끝이었어요.'],
    ['You lived long. The last day was quiet.', 'You went as if falling asleep, the ending everyone hopes for.']),
  heart: C('심장병', 'heart disease', null,
    ['심장이 먼저 쉬기로 했어요.', '가슴이 답답하다고 한 그날 밤이었어요.'],
    ['Your heart decided to rest first.', 'It was the night you said your chest felt tight.']),
  stroke: C('뇌졸중', 'a stroke', null,
    ['갑자기 말이 꼬였고, 그게 마지막이었어요.', '그날 아침 일어나지 못했어요.'],
    ['Your words tangled suddenly, and that was all.', 'You did not wake up that morning.']),
  cancer: C('암', 'cancer', null,
    ['오래 앓았어요. 마지막엔 가족이 곁에 있었어요.', '병은 천천히 왔고, 당신은 할 말을 다 했어요.'],
    ['You were ill a long time. Family was there at the end.', 'The illness came slowly; you got to say what you wanted to say.']),
  traffic: C('교통사고', 'a traffic accident', null,
    ['길을 건너던 참이었어요.', '누군가 몹시 서두르고 있었어요.'],
    ['You were crossing the road.', 'Someone was in a great hurry.']),
};

// 나이대 × 시대(현대 / 그 전) 가중치. 사건 사인은 life.js 가 사건 위험률 비율로 따로 고른다
const PREMODERN = {
  infant: { fever: 40, diarrhea: 35, hunger: 10, weak: 10, accident: 3, fire: 2 },
  child: { fever: 35, plague: 15, diarrhea: 10, hunger: 12, accident: 10, drown: 8, fall: 4, beast: 3, fire: 3 },
  adult: { fever: 22, plague: 10, hunger: 10, war: 10, childbirth: 18, accident: 8, drown: 6, fall: 5, beast: 3, fire: 3, lung: 5 },
  old: { oldage: 40, lung: 20, fever: 15, heart: 10, stroke: 6, hunger: 5, fall: 4 },
};
const MODERN = {
  infant: { weak: 45, fever: 30, diarrhea: 15, accident: 10 },
  child: { accident: 25, traffic: 20, drown: 10, fever: 25, cancer: 20 },
  adult: { traffic: 18, accident: 10, cancer: 25, heart: 20, fever: 10, drown: 4, childbirth: 3, war: 5, lung: 5 },
  old: { heart: 30, cancer: 25, stroke: 18, lung: 12, oldage: 15 },
};

export function drawCause(rng, { age, group, sex, tags, coast, married = false, kids = 0 }) {
  const band = age < 5 ? 'infant' : age < 15 ? 'child' : age < 50 ? 'adult' : 'old';
  const table = (group === 'modern' ? MODERN : PREMODERN)[band];
  const w = (id) => {
    if (id === 'drown') return tags.includes('sea') ? table[id] * 2 : coast ? table[id] : 0;   // 바닷가·바다 집안만
    // 출산: 짝이 있거나 아이를 낳아 본 여자만 (그 밖이면 다른 사인끼리 나눈다)
    if (id === 'childbirth') return sex === 'f' && age >= 15 && age < 45 && (married || kids > 0) ? table[id] : 0;
    return table[id];
  };
  return rng.weighted(Object.keys(table), w);
}
