// 전생의 가보 및 윤회 유산 시스템 (설계: 윤회의 보물고)
export const HEIRLOOMS = {
  pouch: {
    id: 'pouch',
    icon: '🪙',
    name: { ko: '묵직한 전대', en: 'Heavy Coin Pouch' },
    desc: {
      ko: '선대가 숨겨둔 비자금. 시작 재산 +20 및 초기 가계 궁핍 완화',
      en: 'Secret savings from a past life. +20 starting wealth & poverty relief',
    },
    bonus: { wealth: 20 },
  },
  codex: {
    id: 'codex',
    icon: '📜',
    name: { ko: '선대의 비전서', en: 'Ancient Codex' },
    desc: {
      ko: '선대의 지혜가 담긴 낡은 서책. 시작 지식 +15 및 문해력(글 읽기) 조기 습득',
      en: 'An ancient codex of wisdom. +15 starting knowledge & early literacy',
    },
    bonus: { know: 15 },
  },
  tool: {
    id: 'tool',
    icon: '🛠️',
    name: { ko: '명인의 도구', en: "Master's Tool" },
    desc: {
      ko: '손때 묻은 명인의 연장. 시작 손재주 +15 및 노동 시 재산 획득 배율 증가',
      en: "A master craftsman's worn tool. +15 starting skill & wage boost",
    },
    bonus: { skill: 15 },
  },
  token: {
    id: 'token',
    icon: '🏺',
    name: { ko: '가문의 신표', en: 'Ancestral Token' },
    desc: {
      ko: '가문의 위엄이 깃든 옥패. 시작 친화력 +15 및 혼인·인연 기회 증가',
      en: 'A sacred jade token. +15 starting charm & higher marriage chance',
    },
    bonus: { charm: 15 },
  },
};

export const HEIRLOOM_LIST = Object.values(HEIRLOOMS);

export function computeLegacyWealthBonus(finalWealth) {
  const w = Number.isFinite(finalWealth) ? finalWealth : 35;
  if (w >= 90) return 3;
  if (w >= 70) return 2;
  if (w >= 40) return 1;
  return 0;
}

export function applyHeirloom(life, id, extra = {}) {
  const h = HEIRLOOMS[id];
  if (!h) return;
  life.heirloom = id;
  life.flags[`heirloom_${id}`] = true;
  let bonusWealth = h.bonus.wealth || 0;
  if (id === 'pouch' && extra.buriedStash) {
    bonusWealth += 10; // 전생에 사당에 직접 묻어둔 비자금 추가 발굴 (+30 총 보너스)
    life.flags.unearthed_stash = true;
  }
  if (bonusWealth) {
    life.base.wealth = Math.min(100, Math.max(0, life.base.wealth + bonusWealth));
    life.stats.wealth = Math.min(100, Math.max(0, life.stats.wealth + bonusWealth));
  }
  if (h.bonus.know && life.attrs) {
    life.attrs.know = Math.min(100, Math.max(0, life.attrs.know + h.bonus.know));
    if (life.attrs.know >= 60) life.flags.literate = true;
  }
  if (h.bonus.skill && life.attrs) {
    life.attrs.skill = Math.min(100, Math.max(0, life.attrs.skill + h.bonus.skill));
  }
  if (h.bonus.charm && life.attrs) {
    life.attrs.charm = Math.min(100, Math.max(0, life.attrs.charm + h.bonus.charm));
  }
}

// 4대 가보 서사 카드 (청소년기 발현)
export const HEIRLOOM_CARDS = [
  {
    id: 't.heirloom.pouch',
    stage: ['child', 'teen'],
    when: { flags: ['heirloom_pouch'] },
    title: { ko: '바위 밑 은화 전대', en: 'Pouch Under the Stone' },
    text: {
      ko: '어릴 적 꿈에서 본 사당 바위 밑을 파보았어요. 흙 묻은 낡은 전대 속에 은화가 고스란히 들어있었어요.',
      en: 'Digging beneath a mossy stone from your childhood dreams, you uncovered an old coin pouch still filled with silver.',
    },
    choices: [
      {
        text: { ko: '집안 살림에 보탠다', en: 'Share with family' },
        effects: { wealth: 15, family: 12 },
        result: {
          ko: '부모님이 눈물을 글썽이며 고마워했어요. 집안 살림에 큰 숨통이 트였어요.',
          en: 'Your parents teared up with relief. Home felt a little more secure.',
        },
      },
      {
        text: { ko: '나만의 밑천으로 둔다', en: 'Keep as a secret fund' },
        effects: { wealth: 22, happy: 8 },
        result: {
          ko: '아무도 모르는 비밀 종잣돈이 생겼어요. 매사에 발걸음이 든든해졌어요.',
          en: 'A secret seed fund known to none but you. Every step felt a little lighter.',
        },
      },
    ],
  },
  {
    id: 't.heirloom.codex',
    stage: ['child', 'teen'],
    when: { flags: ['heirloom_codex'] },
    title: { ko: '다락방의 옛 비전서', en: 'Ancient Codex in Attic' },
    text: {
      ko: '광 구석에서 낡은 책 한 권을 발견했어요. 처음 보는 글자인데도 어제 읽은 것처럼 뜻이 쏙쏙 들어왔어요.',
      en: 'In a dusty corner of the storeroom, you found an ancient book. Though strange, the words read as if you had written them.',
    },
    choices: [
      {
        text: { ko: '밤새 비전서를 읽는다', en: 'Study it all night' },
        effects: { know: 15, happy: 8 },
        set: ['literate'],
        result: {
          ko: '선대의 지혜가 가슴에 스며들었어요. 글을 읽는 눈이 번쩍 뜨였어요.',
          en: 'Ancient knowledge took root in your mind. The world of letters opened wide.',
        },
      },
      {
        text: { ko: '동무들과 지혜를 나눈다', en: 'Share with friends' },
        effects: { charm: 12, family: 12, know: 6 },
        result: {
          ko: '책 속 지혜를 들려주자 동무들이 눈을 반짝이며 당신 곁으로 모여들었어요.',
          en: 'Sharing its marvels, friends gathered round wide-eyed and eager to listen.',
        },
      },
    ],
  },
  {
    id: 't.heirloom.tool',
    stage: ['child', 'teen'],
    when: { flags: ['heirloom_tool'] },
    title: { ko: '손에 익은 낡은 연장', en: 'A Familiar Old Tool' },
    text: {
      ko: '대장간 구석에 버려진 녹슨 연장을 쥐는 순간, 손가락 마디마디가 능숙하게 움직이기 시작했어요.',
      en: 'Picking up a rusted tool cast aside at the smithy, your fingers moved with natural, practiced ease.',
    },
    choices: [
      {
        text: { ko: '연장을 갈아 일에 쓴다', en: 'Hone the tool for work' },
        effects: { skill: 15, wealth: 10 },
        result: {
          ko: '손에 꼭 맞는 연장 덕에 일손이 배는 빨라졌어요. 어른들이 탄복했어요.',
          en: 'Fitted perfectly to your hand, your work went twice as fast. Elders marveled.',
        },
      },
      {
        text: { ko: '섬세한 장난감을 깎는다', en: 'Carve intricate toys' },
        effects: { skill: 8, charm: 10, happy: 10 },
        result: {
          ko: '연장을 놀려 만든 아름다운 조각이 마을 사람들의 감탄을 자아냈어요.',
          en: 'Delicate carvings crafted by your hand drew wonder and smiles from everyone.',
        },
      },
    ],
  },
  {
    id: 't.heirloom.token',
    stage: ['child', 'teen'],
    when: { flags: ['heirloom_token'] },
    title: { ko: '품속의 신비로운 옥패', en: 'Mysterious Jade Token' },
    text: {
      ko: '개울가에서 주운 낡은 옥패를 닦자 은은한 문양이 드러났어요. 품에 지니자 남들이 당신을 달리 대했어요.',
      en: 'Polishing a worn jade token found by the river, its subtle insignia shone. Strangers treated you with sudden deference.',
    },
    choices: [
      {
        text: { ko: '귀한 손님께 보여준다', en: 'Show to a guest' },
        effects: { status: 1, charm: 10 },
        result: {
          ko: '옥패의 비범함을 알아본 유력한 집안의 눈에 띄어 귀한 연줄이 닿았어요.',
          en: 'A notable house recognized its noble origins, opening rare doors for you.',
        },
      },
      {
        text: { ko: '소중한 짝에게 건넨다', en: 'Give to someone dear' },
        effects: { family: 18, happy: 12, charm: 6 },
        result: {
          ko: '마음을 나눈 사람에게 옥패를 건네자 평생을 함께할 깊은 정이 맺어졌어요.',
          en: 'Giving the token to someone dear, a profound bond was sealed for life.',
        },
      },
    ],
  },
];
