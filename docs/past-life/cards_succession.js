// 생애 내 상속과 가업 승계, 유언장 서사 카드 (설계: 상속의 드라마)
const CIVIL_TAGS = ['farm', 'craft', 'trade', 'factory', 'shop', 'office', 'pro', 'elite', 'serve', 'herd', 'sea'];
const CIVIL_ERAS = ['ancient', 'medieval', 'early', 'industrial', 'modern'];

export const SUCCESSION_CARDS = [
  {
    id: 'c.succession.inherit',
    stage: ['teen', 'adult'],
    when: { eraGroups: CIVIL_ERAS, tags: CIVIL_TAGS, minYear: -500, minAge: 17, maxAge: 32 },
    title: { ko: '가업의 무게', en: 'Weight of Legacy' },
    text: {
      ko: '부모님이 낡은 장부와 일터를 물려줄 때가 되었다며 부르셨어요. 평생을 바친 가업이에요.',
      en: 'Your parents called you aside, saying it was time to pass down the ledger and tools of their lifelong craft.',
    },
    choices: [
      {
        text: { ko: '가업을 이어받는다', en: 'Inherit the craft' },
        effects: { wealth: 18, family: 14, skill: 10 },
        result: {
          ko: '부모님의 굳은살 박인 손을 잡았어요. 대를 잇는 발걸음에 집안이 든든해졌어요.',
          en: 'You took your parents’ weathered hands. Carrying on the craft brought security.',
        },
      },
      {
        text: { ko: '나만의 길을 걷는다', en: 'Forge my own path' },
        effects: { happy: 15, wealth: -10, charm: 12 },
        result: {
          ko: '익숙한 보금자리를 떠나 낯선 세상으로 나아갔어요. 두렵지만 가슴이 벅차올랐어요.',
          en: 'Leaving home for unfamiliar lands, your heart swelled with anticipation.',
        },
      },
    ],
  },
  {
    id: 'c.succession.sibling_partition',
    stage: 'adult',
    when: { eraGroups: CIVIL_ERAS, tags: CIVIL_TAGS, minYear: -500, minAge: 20, maxAge: 40 },
    title: { ko: '유산의 갈림길', en: 'Dividing Estate' },
    text: {
      ko: '선대가 남긴 얼마 안 되는 전답과 세간을 두고 형제자매들의 눈치가 엇갈리기 시작했어요.',
      en: 'Over the modest fields and belongings left behind, uneasy glances passed between siblings.',
    },
    choices: [
      {
        text: { ko: '양보하며 우애를 지킨다', en: 'Yield for peace' },
        effects: { family: 18, charm: 12, happy: 8, wealth: -12 },
        result: {
          ko: '조금 손해를 보았지만 가족의 화목을 지켰어요. 형제들이 깊이 고마워했어요.',
          en: 'You conceded your share, preserving family harmony and brotherly love.',
        },
      },
      {
        text: { ko: '정당한 몫을 챙긴다', en: 'Claim my share' },
        effects: { wealth: 20, family: -14, happy: -6 },
        result: {
          ko: '서류와 관습을 앞세워 몫을 챙겼어요. 곳간은 찼지만 명절 발길이 뜸해졌어요.',
          en: 'You secured your portion firmly, though distant coldness settled between kin.',
        },
      },
    ],
  },
  {
    id: 'c.succession.tenant_tenure',
    stage: ['teen', 'adult'],
    when: { eraGroups: ['ancient', 'medieval', 'early', 'industrial'], tags: ['farm', 'serve'], minYear: -500, minAge: 18, maxAge: 35, maxStatus: 3 },
    title: { ko: '물려받은 쟁기', en: 'Inherited Plow' },
    text: {
      ko: '지주에게 바칠 소작료와 낡은 쟁기만이 물려받은 전부였지만, 땅은 여전히 정직했어요.',
      en: 'Only a worn plow and rents owed to the landlord were left, yet the soil remained honest.',
    },
    choices: [
      {
        text: { ko: '묵묵히 땅을 일군다', en: 'Work the soil' },
        effects: { skill: 12, health: 10, wealth: 10, happy: 8 },
        result: {
          ko: '이른 새벽부터 땀방울을 흘리며 일구니, 가을 들판이 작은 보답을 안겨주었어요.',
          en: 'Sweating from dawn till dusk, the autumn harvest offered a modest reward.',
        },
      },
      {
        text: { ko: '저잣거리로 나간다', en: 'Seek city earnings' },
        effects: { wealth: 15, know: 8, family: -8 },
        result: {
          ko: '쟁기를 내려놓고 큰 장터로 향했어요. 거친 일이지만 삯은 쏠쏠했어요.',
          en: 'Leaving the fields for the bustling marketplace, daily earnings came steadily.',
        },
      },
    ],
  },
  {
    id: 'c.succession.will',
    stage: 'old',
    when: { eraGroups: CIVIL_ERAS, tags: CIVIL_TAGS, minYear: -500, minAge: 55, stat: { wealth: [30, 100] } },
    title: { ko: '마지막 유언장', en: 'The Final Will' },
    text: {
      ko: '백발이 성성해진 어느 겨울밤, 다음 세대에게 한평생 일군 가산을 어찌 나눌지 고민했어요.',
      en: 'On a quiet winter night, gray-haired and weary, you sat down to decide the fate of your estate.',
    },
    choices: [
      {
        text: { ko: '가족들에게 고루 나눈다', en: 'Divide among family' },
        effects: { family: 22, happy: 15, wealth: -22 },
        result: {
          ko: '누구 하나 서운함 없이 웃으며 손을 잡았어요. 가슴 깊은 곳이 훈훈해졌어요.',
          en: 'Everyone smiled in relief with no resentment. Your heart felt at peace.',
        },
      },
      {
        text: { ko: '가장 미더운 후계자에게', en: 'Entrust the heir' },
        effects: { wealth: -15, family: 10, skill: 8 },
        result: {
          ko: '가업의 명맥을 이을 사람에게 힘을 실어주었어요. 집안의 기틀이 굳건해졌어요.',
          en: 'You bolstered the heir capable of carrying on the name, securing the foundation.',
        },
      },
      {
        text: { ko: '비자금으로 깊이 묻는다', en: 'Hide a secret fund' },
        effects: { wealth: -10, happy: 10 },
        flags: ['buried_stash'],
        result: {
          ko: '항아리에 은화를 담아 아무도 모를 사당 주춧돌 밑에 묻어두었어요. 후생이 든든해요.',
          en: 'You buried silver coins beneath the shrine foundation stones, securing your next journey.',
        },
      },
    ],
  },
  {
    id: 'c.succession.endowment',
    stage: ['middle', 'old'],
    when: { eraGroups: CIVIL_ERAS, tags: CIVIL_TAGS, minYear: -500, minAge: 50, stat: { wealth: [40, 100] } },
    title: { ko: '만년의 공덕', en: 'Merit and Charity' },
    text: {
      ko: '살아온 날들을 돌아보니 부귀영화도 한 조각 구름 같았어요. 남은 재산을 의미 있게 쓰고 싶어졌어요.',
      en: 'Looking back on a long life, wealth felt like fleeting mist. You wished to leave something lasting.',
    },
    choices: [
      {
        text: { ko: '사원에 시주하여 복을 빈다', en: 'Dedicate alms' },
        effects: { happy: 20, charm: 10, wealth: -22 },
        flags: ['karmic_endowment'],
        result: {
          ko: '향 연기 피어오르는 제단에 정성을 올렸어요. 다음 생으로 가는 발걸음이 가벼워졌어요.',
          en: 'Incense rose as you offered your wealth, easing your spirit for the journey ahead.',
        },
      },
      {
        text: { ko: '굶주린 이웃을 구휼한다', en: 'Aid neighbors' },
        effects: { family: 15, happy: 18, charm: 14, wealth: -20 },
        result: {
          ko: '동네 사람들에게 곡식을 나누어주었어요. 온 마을이 당신의 은덕을 칭송했어요.',
          en: 'You distributed grain to hungry neighbors. The village praised your generosity.',
        },
      },
    ],
  },
  {
    id: 'c.succession.debt_burden',
    stage: ['teen', 'adult'],
    when: { eraGroups: CIVIL_ERAS, tags: CIVIL_TAGS, minYear: -500, minAge: 18, maxAge: 32, stat: { wealth: [0, 45] } },
    title: { ko: '남겨진 부채', en: 'Inherited Debts' },
    text: {
      ko: '부모님이 세상을 떠나자 채주들이 찾아와 낡은 차용증을 들이밀며 빚을 갚으라 독촉했어요.',
      en: 'With your parents gone, creditors arrived at your doorstep brandishing old debt tallies.',
    },
    choices: [
      {
        text: { ko: '정직하게 빚을 갚아나간다', en: 'Work to repay' },
        effects: { skill: 14, wealth: -15, charm: 12, happy: 8 },
        result: {
          ko: '피땀 흘려 빚을 털어내니 채주도 탄복했어요. 비로소 온전한 내 삶이 시작되었어요.',
          en: 'Through sweat and honest toil you cleared the ledger. Your life was finally your own.',
        },
      },
      {
        text: { ko: '먼 고을로 도망친다', en: 'Flee far away' },
        effects: { luck: 12, happy: 10, family: -20 },
        result: {
          ko: '어두운 밤 봇짐을 싸고 고향을 등졌어요. 옛 인연은 끊겼지만 새 숨을 쉬게 되었어요.',
          en: 'Under the cover of night, you fled far away. Severing the past, you breathed free.',
        },
      },
    ],
  },
];
