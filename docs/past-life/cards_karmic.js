// cards_karmic.js
// 영혼의 결단 인과율 연쇄 사건(Karmic Consequence Chain) 및 윤회 각인(Rebirth Imprint) 카드 덱
// 플레이어가 직접 입력한 자유 결단과 핵심 개체명(Entity)이 훗날 나비효과 사건으로 발현되고,
// 사망 후 다음 생 유년기의 전생 기억으로 이어지는 시스템

export const KARMIC_CARDS = [
  // 1. 학문(scholar) 인과율 연쇄 카드
  {
    id: 'karmic.echo.scholar',
    stage: ['adult', 'middle'],
    karmic: true,
    when: { flags: ['echo_scholar', 'will_echo_pending'], minAge: 17 },
    weight: 8,
    focus: 'learn',
    title: { ko: '배움의 결실과 부름', en: 'Fruits of Learning' },
    text: {
      ko: '오래전 품었던 학문의 뜻이 결실을 맺었어요. 그동안 쌓은 학식과 문장력이 널리 알려져 관아와 서원에서 천거의 전갈이 당도했습니다.',
      en: 'Memories of studying classical texts bore fruit. Word of your scholarship spread, bringing an official summons from the academy.',
    },
    choices: [
      {
        text: { ko: '관청 서기로 출사한다', en: 'Serve as magistrate scribe' },
        effects: { know: 12, status: 1, wealth: 15, happy: 8 },
        route: { id: 'scholar', step: 2 },
        set: ['will_echo_resolved', 'honored_scholar'],
        unset: ['will_echo_pending'],
        result: {
          ko: '관직의 부름에 나아가 글과 법률을 정리하는 소임을 맡았어요. 학자로서 가문의 위상을 크게 드높였습니다.',
          en: 'Stepping into office to organize edicts and histories, you brought great honor to your lineage.',
        },
      },
      {
        text: { ko: '스스로 저술에 몰두한다', en: 'Author private treatises' },
        effects: { know: 18, happy: 15, health: 5 },
        route: { id: 'scholar', step: 2 },
        set: ['will_echo_resolved', 'sage_author'],
        unset: ['will_echo_pending'],
        result: {
          ko: '세속의 관직 대신 고요한 서재에서 필생의 저서를 집필했어요. 후대 학도들이 가르침을 구하러 줄을 이었습니다.',
          en: 'Choosing secluded scholarship over politics, your completed volumes became cherished across the provinces.',
        },
      },
    ],
  },

  // 2. 상업(merchant) 인과율 연쇄 카드
  {
    id: 'karmic.echo.merchant',
    stage: ['adult', 'middle'],
    karmic: true,
    when: { flags: ['echo_merchant', 'will_echo_pending'], minAge: 17 },
    weight: 8,
    focus: 'work',
    title: { ko: '숨겨둔 밑천과 기회', en: 'The Secret Stash' },
    text: {
      ko: '젊은 날 남몰래 모아두었던 밑천과 비자금이 때마침 빛을 발할 기회가 찾아왔어요. 장마당 시세가 요동치며 대상단이 투자를 제안해왔습니다.',
      en: 'The secret coin hoard you tucked away years ago found its moment. Market swings created a rare opening for mercantile investment.',
    },
    choices: [
      {
        text: { ko: '대상단에 과감히 투자한다', en: 'Invest into merchant caravan' },
        effects: { wealth: 25, charm: 10, happy: 8 },
        route: { id: 'merchant', step: 2 },
        set: ['will_echo_resolved', 'grand_investor'],
        unset: ['will_echo_pending'],
        result: {
          ko: '시세를 꿰뚫어 본 과감한 투자로 막대한 시세 차익을 거두었어요. 가문의 금고에 은화가 가득 찼습니다.',
          en: 'Your bold stroke yielded tenfold profits, establishing your name as a grand investor in the central bazaar.',
        },
      },
      {
        text: { ko: '비밀 곳간에 묻어둔다', en: 'Hide gold in secret vaults' },
        effects: { wealth: 18, happy: 12, family: 10 },
        route: { id: 'merchant', step: 2 },
        set: ['will_echo_resolved', 'steady_trader'],
        unset: ['will_echo_pending'],
        result: {
          ko: '욕심을 부리지 않고 튼튼한 안전자산으로 지켜내어, 어떤 풍파에도 끄떡없는 가문의 기틀을 다졌어요.',
          en: 'Safeguarding the family wealth against misfortune, your household flourished in steady peace.',
        },
      },
    ],
  },

  // 3. 장인(artisan) 인과율 연쇄 카드
  {
    id: 'karmic.echo.artisan',
    stage: ['adult', 'middle'],
    karmic: true,
    when: { flags: ['echo_artisan', 'will_echo_pending'], minAge: 17 },
    weight: 8,
    focus: 'work',
    title: { ko: '담금질한 쇠의 명성', en: 'Renown of the Anvil' },
    text: {
      ko: '풀무질과 쇠두드림으로 정성을 다했던 명품 도구의 소문이 고을 너머까지 자자해졌어요. 호족들이 명작을 주문하며 공방 설립을 제안합니다.',
      en: 'The exceptional blades and pottery forged in your workshop became famous across provinces, drawing royal commissions.',
    },
    choices: [
      {
        text: { ko: '독자적인 공방을 연다', en: 'Open independent workshop' },
        effects: { skill: 15, wealth: 25, happy: 10 },
        route: { id: 'artisan', step: 2 },
        set: ['will_echo_resolved', 'master_artisan'],
        unset: ['will_echo_pending'],
        result: {
          ko: '수많은 제자들을 거느린 공방의 어엿한 도편수가 되었어요. 당신의 손끝에서 탄생한 물건들은 명품으로 인정받았습니다.',
          en: 'You became master of a celebrated guild, training eager apprentices and creating timeless masterworks.',
        },
      },
      {
        text: { ko: '농기구를 보급한다', en: 'Produce useful farm tools' },
        effects: { skill: 12, happy: 16, charm: 12, family: 8 },
        route: { id: 'artisan', step: 2 },
        set: ['will_echo_resolved', 'peoples_craftsman'],
        unset: ['will_echo_pending'],
        result: {
          ko: '이웃 농민들의 수고를 덜어주는 단단한 쟁기와 낫을 보급하여 마을 사람들 모두의 진심 어린 축복을 받았습니다.',
          en: 'Crafting sturdy tools accessible to poor farmers, gratitude and blessings flowed to your hearth.',
        },
      },
    ],
  },

  // 4. 치유(healer) 인과율 연쇄 카드
  {
    id: 'karmic.echo.healer',
    stage: ['adult', 'middle'],
    karmic: true,
    when: { flags: ['echo_healer', 'will_echo_pending'], minAge: 17 },
    weight: 8,
    focus: 'rest',
    title: { ko: '살려낸 생명의 보은', en: 'Repaid Gift of Life' },
    text: {
      ko: '젊은 날 약초와 정성으로 치료해주었던 병자가 오랜 세월을 지나 보은을 위해 찾아왔어요. 희귀한 약재 뿌리와 비전 의서를 건네며 감사를 표합니다.',
      en: 'A traveler whose life you saved with herbs long ago returned to thank you, gifting rare medicinal roots and secret scrolls.',
    },
    choices: [
      {
        text: { ko: '무료 혜민원을 세운다', en: 'Open free village clinic' },
        effects: { know: 12, charm: 18, happy: 16, health: 6 },
        route: { id: 'healer', step: 2 },
        set: ['will_echo_resolved', 'revered_healer'],
        unset: ['will_echo_pending'],
        result: {
          ko: '마을 어귀에 무료 의원을 열어 수많은 아픈 백성들을 구호했어요. 온 고을이 당신을 생명의 은인으로 칭송했습니다.',
          en: 'Opening a healing sanctuary, countless sick found solace, blessing your benevolent name.',
        },
      },
      {
        text: { ko: '비전 명약을 완성한다', en: 'Brew restorative tonic' },
        effects: { know: 16, wealth: 20, skill: 8 },
        route: { id: 'healer', step: 2 },
        set: ['will_echo_resolved', 'physician_scholar'],
        unset: ['will_echo_pending'],
        result: {
          ko: '새로운 탕약 조제법을 담은 의서를 완성하여 수많은 의원들의 필독서로 자리매김시켰습니다.',
          en: 'You compiled a seminal pharmacopeia treatise, forever elevating regional healing arts.',
        },
      },
    ],
  },

  // 5. 통치(statesman) 인과율 연쇄 카드
  {
    id: 'karmic.echo.statesman',
    stage: ['adult', 'middle'],
    karmic: true,
    when: { flags: ['echo_statesman', 'will_echo_pending'], minAge: 17 },
    weight: 8,
    focus: 'learn',
    title: { ko: '감찰 어사의 회답', en: 'The Inspector’s Call' },
    text: {
      ko: '과거 백성을 위해 결단을 내렸던 일의 여파가 마침내 암행어사에게 닿았어요. 어사가 밀서를 보내와 관아 감찰관으로 등용을 제안합니다.',
      en: 'The petition you drafted against corrupt officials finally reached inspectors. A secret mandate arrives offering an official post.',
    },
    choices: [
      {
        text: { ko: '감찰관으로 출사한다', en: 'Accept royal inspector post' },
        effects: { status: 1, know: 12, charm: 12, wealth: 15 },
        route: { id: 'statesman', step: 2 },
        set: ['will_echo_resolved', 'righteous_magistrate'],
        unset: ['will_echo_pending'],
        result: {
          ko: '관아의 부정한 장부를 바로잡아 억울한 농민들의 세금 부담을 덜어주었어요. 청백리로 이름을 떨쳤습니다.',
          en: 'Correcting unjust tax rolls and rooting out graft, commoners praised your incorruptible governance.',
        },
      },
      {
        text: { ko: '마을 원로회에 남는다', en: 'Lead village elders' },
        effects: { happy: 15, family: 14, charm: 14 },
        route: { id: 'statesman', step: 2 },
        set: ['will_echo_resolved', 'village_patriarch'],
        unset: ['will_echo_pending'],
        result: {
          ko: '주민들이 화목하게 상부상조하는 향약을 정착시켜 평화로운 고향을 일구었습니다.',
          en: 'You authored a village pact fostering mutual aid, becoming the beloved guardian of community peace.',
        },
      },
    ],
  },

  // 6. 무예(warrior) 인과율 연쇄 카드
  {
    id: 'karmic.echo.warrior',
    stage: ['adult', 'middle'],
    karmic: true,
    when: { flags: ['echo_warrior', 'will_echo_pending'], minAge: 17 },
    weight: 8,
    focus: 'body',
    title: { ko: '전장의 부름과 선봉', en: 'Call to Arms & Vanguard' },
    text: {
      ko: '도적 떼에 맞서 칼을 뽑아 들었던 담대한 무예의 기개가 널리 퍼졌어요. 국경에 침입한 외적을 막기 위해 관군 수비대에서 선봉장을 청해옵니다.',
      en: 'Tales of your fearlessness against raiders spread to garrison captains, who urgently seek your sword to lead vanguard defenses.',
    },
    choices: [
      {
        text: { ko: '수비대 선봉에 선다', en: 'Lead the border vanguard' },
        effects: { skill: 14, status: 1, happy: 10, health: -4 },
        route: { id: 'warrior', step: 2 },
        set: ['will_echo_resolved', 'veteran_commander'],
        unset: ['will_echo_pending'],
        result: {
          ko: '성벽 앞 전장에서 적병들을 호령하며 대승을 거두었어요. 조정에서 훈장과 무관 벼슬을 내렸습니다.',
          en: 'Standing resolute before enemy lines, your tactical valor repelled the siege and won imperial acclaim.',
        },
      },
      {
        text: { ko: '자경단을 훈련시킨다', en: 'Train the local militia' },
        effects: { skill: 10, family: 16, happy: 14 },
        route: { id: 'warrior', step: 2 },
        set: ['will_echo_resolved', 'homeland_guardian'],
        unset: ['will_echo_pending'],
        result: {
          ko: '마을 청년들에게 무예와 방진을 가르쳐 어떤 침략에도 끄떡없는 철벽 마을을 완성했습니다.',
          en: 'Drilling village youth into a disciplined guard, peace reigned secure over your native hills.',
        },
      },
    ],
  },

  // 7. 구도(seeker) 인과율 연쇄 카드
  {
    id: 'karmic.echo.seeker',
    stage: ['adult', 'middle'],
    karmic: true,
    when: { flags: ['echo_seeker', 'will_echo_pending'], minAge: 17 },
    weight: 8,
    focus: 'learn',
    title: { ko: '깊은 깨달음과 평화', en: 'Enlightened Awakening' },
    text: {
      ko: '세속의 번뇌를 털어내고 새벽마다 올렸던 기도가 마침내 깊은 깨달음의 열매를 맺었어요. 온화한 미소와 영적 평화가 사람들의 마음에 감화를 줍니다.',
      en: 'Years of silent prayer and meditative discipline yielded profound inner stillness, drawing seekers yearning for spiritual counsel.',
    },
    choices: [
      {
        text: { ko: '사찰 주지가 된다', en: 'Lead pilgrims as abbot' },
        effects: { happy: 20, charm: 15, know: 10 },
        route: { id: 'seeker', step: 2 },
        set: ['will_echo_resolved', 'abbot_sage'],
        unset: ['will_echo_pending'],
        result: {
          ko: '사찰의 종을 울리며 찾아오는 수많은 길 잃은 영혼들에게 자비와 평안을 베풀었습니다.',
          en: 'Ringing the great temple bell at dusk, you offered boundless mercy and peace to all who entered.',
        },
      },
      {
        text: { ko: '묵언 순례를 떠난다', en: 'Embark on pilgrimage' },
        effects: { happy: 22, health: 8, luck: 10 },
        route: { id: 'seeker', step: 2 },
        set: ['will_echo_resolved', 'silent_pilgrim'],
        unset: ['will_echo_pending'],
        result: {
          ko: '바람처럼 맑은 영혼으로 산하를 누비며 자연과 합일하는 무아지경의 열반을 맛보았습니다.',
          en: 'Walking barefoot under boundless skies, your soul achieved sublime oneness with the cosmos.',
        },
      },
    ],
  },

  // 8. 일탈/의적(rebel) 인과율 연쇄 카드
  {
    id: 'karmic.echo.rebel',
    stage: ['adult', 'middle'],
    karmic: true,
    when: { flags: ['echo_rebel', 'will_echo_pending'], minAge: 17 },
    weight: 8,
    focus: 'body',
    title: { ko: '의적단의 부름', en: 'The Brotherhood’s Call' },
    text: {
      ko: '어린 날 서당 엿을 서리하고 탐관오리를 골려주던 담대한 배짱을 기억하는 의적 동지들이 찾아왔어요. 억울한 소작농들을 위해 큰일을 도모하자고 청합니다.',
      en: 'Comrades who remembered your bold daylight thefts arrived, asking you to lead a strike against greedy landlords.',
    },
    choices: [
      {
        text: { ko: '의적단 두령이 된다', en: 'Lead outlaw brotherhood' },
        effects: { charm: 18, happy: 15, wealth: 20, luck: -4 },
        route: { id: 'rebel', step: 2 },
        set: ['will_echo_resolved', 'outlaw_chief'],
        unset: ['will_echo_pending'],
        result: {
          ko: '달 밝은 밤 부정한 창고를 털어 가난한 이웃들에게 쌀을 나누어주었어요. 민중의 영웅이 되었습니다.',
          en: 'You plundered illicit grain caches and scattered food across impoverished hamlets, revered as a folk legend.',
        },
      },
      {
        text: { ko: '지주와 담판을 짓는다', en: 'Negotiate fair rents' },
        effects: { know: 12, happy: 14, charm: 14, status: 1 },
        route: { id: 'rebel', step: 2 },
        set: ['will_echo_resolved', 'peasant_tribune'],
        unset: ['will_echo_pending'],
        result: {
          ko: '소작인들의 단결된 힘으로 지주의 횡포를 꺾고 정당한 계약을 쟁취해냈습니다.',
          en: 'Through unified tenant resolve, you forced landlords to sign fair treaties, securing dignity for common folk.',
        },
      },
    ],
  },

  // 9. 연애/사랑(love_romance) 인과율 연쇄 카드
  {
    id: 'karmic.echo.love_romance',
    stage: ['adult', 'middle'],
    karmic: true,
    when: { flags: ['echo_love_romance', 'will_echo_pending'], minAge: 17 },
    weight: 8,
    focus: 'family',
    title: { ko: '달빛 고백의 백년가약', en: 'Vow of Devotion' },
    text: {
      ko: '달빛 어스름한 개울가에서 꽃다발을 건네며 연모의 정을 고백했던 정인과 마침내 결실을 맺을 날이 다가왔어요. 서로의 눈빛 속에서 평생의 반려자가 될 확신을 봅니다.',
      en: 'The sweetheart to whom you offered flowers beneath the moonlit stream now stands beside you, ready to seal lifelong vows.',
    },
    choices: [
      {
        text: { ko: '성대한 혼례를 올린다', en: 'Host joyful wedding feast' },
        effects: { happy: 25, family: 20, charm: 12, wealth: -10 },
        route: { id: 'homesteader', step: 2 },
        set: ['will_echo_resolved', 'married', 'true_love'],
        unset: ['will_echo_pending'],
        result: {
          ko: '풍악이 울리는 초례청에서 맞절을 올렸어요. 온 마을 사람들의 진심 어린 축복 속에 가정을 꾸렸습니다.',
          en: 'Amid cheerful festival flutes you exchanged marital cups, blessed with enduring warmth and faithful joy.',
        },
      },
      {
        text: { ko: '소박한 혼례를 치른다', en: 'Hold quiet modest wedding' },
        effects: { happy: 20, family: 18, health: 6 },
        route: { id: 'homesteader', step: 2 },
        set: ['will_echo_resolved', 'married', 'peaceful_hearth'],
        unset: ['will_echo_pending'],
        result: {
          ko: '소박하지만 따스한 초가삼간에 보금자리를 마련하고 평생의 사랑을 지켜갔습니다.',
          en: 'In a cozy cottage bathed in lantern glow, you shared a harmonious life of deep affection.',
        },
      },
    ],
  },

  // 10. 전생의 기억 각인 (Karmic Awakening) - 다음 생 유년기 각성 카드
  {
    id: 'karmic.reborn.awakening',
    stage: ['child', 'teen'],
    karmic: true,
    when: { trace: 'karmic:vow' },
    weight: 7,
    focus: 'learn',
    title: { ko: '꿈결에 되살아난 뜻', en: 'Awakening of Past Vow' },
    text: {
      ko: '깊은 밤 꿈속에서, 먼 전생에 뜻을 품고 살았던 내 모습이 스쳐 지나갔어요. 가슴 깊은 곳에서 익숙한 울림이 차오릅니다.',
      en: 'In a vivid dream, memories of a past life’s resolution flashed across your soul. An echo stirred within your heart.',
    },
    choices: [
      {
        text: { ko: '전생의 뜻을 품는다', en: 'Honor the ancient vow' },
        effects: { know: 12, skill: 10, happy: 10, luck: 8 },
        set: ['awakened_soul'],
        result: {
          ko: '전생에 닦았던 학문과 재주의 감각이 되살아났어요. 일찍부터 남다른 총명함으로 칭송을 받았습니다.',
          en: 'Instincts cultivated in past lifetimes awakened in your hands, earning early praise for uncanny wisdom.',
        },
      },
      {
        text: { ko: '이번 생의 길을 걷는다', en: 'Forge a fresh path' },
        effects: { luck: 15, happy: 14, charm: 10 },
        set: ['fresh_spirit'],
        result: {
          ko: '과거의 굴레를 털어내고 내 뜻대로 세상에 발을 내디뎠어요. 발걸음마다 새로운 행운이 깃들었습니다.',
          en: 'Unshackled from past karma, you greeted the dawn with a radiant spirit, ready to write a new story.',
        },
      },
    ],
  },
];
