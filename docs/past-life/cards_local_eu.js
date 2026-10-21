// 땅·자리 고유 카드 묶음 (시뮬 2.0 설계 4.2, 작업 7 · 유럽 + 서아시아·북아프리카 몫)
//   유럽 마을 (europe · village) · 유럽 거리 (street) · 유럽 큰 집 (estate, 귀족 쪽 + 하인 쪽)
//   서아시아·북아프리카 마을 (mudbrick · village) · 서아시아 야영지 (mudbrick·steppe · camp, 수렵 무리와 가축 치는 집)
// 모든 카드는 when.zones + when.setting 에 시대(eraGroups 나 minYear·maxYear)를 단다. 출생의 77%가 1500년 전이라 고대·중세 카드를 많이 둔다.
// 역사 사실의 출처는 CONTENT-SOURCES-local-eu.md 에 한 줄씩. 실재 인물 이름은 쓰지 않는다 (통치자는 칭호만)
// 영어 글은 자리 앞에 a/an 을 쓰지 않고 {feast} 앞에 the 를 쓰지 않는다. 한국어 자리 뒤 조사는 {key:을} 꼴로
const EU = ['europe'];
const MB = ['mudbrick'];
const CAMP = ['mudbrick', 'steppe'];
// 로마 속주가 된 땅 (브리튼은 기원후 43년부터라 로마 카드는 50년부터 연다)
const ROMAN = ['italy', 'france', 'iberia', 'balkans', 'britain'];
// 이슬람 시대 마을: 아나톨리아는 1071년 뒤에야 바뀌어 따로 둔다 (티마르 카드)
const ISLAMIC = ['mesopotamia', 'nile', 'iran', 'arabia', 'maghreb'];
// 낙타를 치던 땅 (단봉낙타는 기원전 10세기 무렵부터 널리, 쌍봉낙타는 중앙아시아)
const CAMEL = ['arabia', 'mesopotamia', 'nile', 'iran', 'steppe', 'mongolia'];

export const LOCAL_CARDS_EU = [
  // ── 유럽 마을 (europe · village) ─────────────────────────────────
  // 신석기 첫 농부들: 간 돌도끼로 숲을 베고 밑동을 태워 밭을 연다
  { id: 'loc.eu.village.axe', stage: ['child', 'teen'], when: { zones: EU, setting: 'village', eraGroups: ['ancient'], maxYear: -2200 },
    title: { ko: '숲을 여는 날', en: 'Opening up the forest' },
    text: { ko: '어른들이 간 돌도끼로 숲의 나무를 베고, 남은 밑동에 불을 놓아 새 밭을 만들어요.', en: 'The grown-ups are felling trees with polished stone axes and burning the stumps to make a new field.' },
    choices: [
      { text: { ko: '잔가지를 나른다', en: 'Haul the brushwood' }, effects: { health: -2, family: 4 },
        result: { ko: '하루 종일 가지를 날랐어요. 저녁엔 연기 냄새가 머리카락에서 빠지지 않았어요.', en: 'You hauled branches all day. By evening, the smell of smoke would not leave your hair.' } },
      { text: { ko: '도토리를 줍는다', en: 'Gather acorns instead' }, effects: { happy: 4, wealth: 2 },
        result: { ko: '쓰러진 참나무 밑에 도토리가 잔뜩이었어요. 숲은 마지막까지 뭔가를 줬어요.', en: 'The fallen oak was covered in acorns. Even at the end, the forest was still giving.' } },
      { text: { ko: '도끼 가는 법을 배운다', en: 'Learn to grind an axe' }, skill: 'craft', effects: { skill: 2 },
        result: { ko: '모래와 물로 돌을 며칠이나 갈았어요. 도끼날보다 손바닥이 먼저 반들반들해졌어요.', en: 'You ground the stone with sand and water for days. Your palms got smooth before the blade did.' } },
    ] },
  // 청동기 끝 무렵부터 철기 시대까지 언덕 위 성채 (로마 이전)
  { id: 'loc.eu.village.hillfort', stage: ['adult', 'middle'], when: { zones: EU, setting: 'village', eraGroups: ['ancient'], minYear: -1100, maxYear: -50 },
    title: { ko: '언덕 위 성채', en: 'The fort on the hill' },
    text: { ko: '언덕 위 흙 성벽이 무너져 가요. 족장이 집집마다 일손을 내래요. 난리가 나면 모두 거기로 올라가거든요.', en: 'The earth rampart on the hill is crumbling. The chieftain wants a pair of hands from every house. When trouble comes, everyone climbs up there.' },
    choices: [
      { text: { ko: '흙을 져 나른다', en: 'Carry earth up the hill' }, effects: { health: -5, family: 6 },
        result: { ko: '한 철 내내 바구니로 흙을 날랐어요. 그 성벽에는 당신 몫의 흙도 한 켜 들어갔어요.', en: 'You carried baskets of earth all season. One layer of that rampart is yours.' } },
      { text: { ko: '밭일이 먼저다', en: 'The fields come first' },
        chance: { p: 0.6,
          win: { effects: { wealth: 6 }, result: { ko: '밭은 잘 여물었고, 그해엔 아무도 쳐들어오지 않았어요.', en: 'The crops did well, and nobody attacked that year.' } },
          lose: { effects: { wealth: -4, family: -6 }, result: { ko: '그해 가을 약탈꾼이 왔어요. 성벽 위 사람들이 당신 쪽을 보며 아무 말도 하지 않았어요.', en: 'Raiders came that autumn. The people on the rampart looked your way and said nothing.' } } } },
    ] },
  // 로마 속주의 돌 깐 길 (길가 역참·이정표)
  { id: 'loc.eu.village.road', stage: ['adult', 'middle'], tokens: true, when: { zones: EU, setting: 'village', areas: ROMAN, minYear: 50, maxYear: 400 },
    title: { ko: '돌로 깐 길', en: 'The paved road' },
    text: { ko: '마을 옆으로 돌을 깐 곧은 길이 났어요. 군인과 상인과 나랏일 수레가 날마다 지나가요.', en: 'A straight stone-paved road now runs past the village. Soldiers, traders and official carts go by every day.' },
    choices: [
      { text: { ko: '길가에서 {staple:을} 판다', en: 'Sell {staple} by the road' }, effects: { wealth: 6, charm: 2 },
        result: { ko: '지나가는 사람마다 값을 깎았어요. 그래도 저녁마다 {coin:이} 몇 닢씩 남았어요.', en: 'Every traveler haggled. Still, a few {coin} were left over each evening.' } },
      { text: { ko: '{market}까지 가 본다', en: 'Follow it to the {market}' }, effects: { happy: 5 },
        result: { ko: '반나절 만에 닿았어요. 길이 곧으니 생각도 조금 곧아지는 것 같았어요.', en: 'You got there in half a day. On a road that straight, even your thoughts seemed to straighten out.' } },
      { text: { ko: '군인들을 피한다', en: 'Keep clear of the soldiers' }, effects: { family: 3 },
        result: { ko: '군인들이 지나갈 때마다 집 안에 있었어요. 닭 한 마리 잃지 않았어요.', en: 'You stayed indoors whenever soldiers passed. You did not lose a single hen.' } },
    ] },
  // 열린 밭: 길쭉한 띠로 나눈 밭, 이웃 고랑 넘보기는 장원 법정의 단골 사건
  { id: 'loc.eu.village.strips', stage: ['adult', 'middle'], when: { zones: EU, setting: 'village', areas: ['britain', 'france', 'germany', 'east_europe', 'nordic'], minYear: 900, maxYear: 1700 },
    title: { ko: '한 고랑', en: 'One furrow over' },
    text: { ko: '마을 밭은 길쭉한 띠로 나뉘어 있어요. 올봄 옆 띠 주인이 당신 띠로 한 고랑을 넘겨 갈았어요.', en: 'The village fields are split into long strips. This spring, your neighbor plowed one furrow over into your strip.' },
    choices: [
      { text: { ko: '영주 법정에 알린다', en: 'Take it to the lord’s court' },
        chance: { p: 0.6,
          win: { effects: { wealth: 4, happy: 3 }, result: { ko: '마을 어른들이 경계 말뚝을 다시 박았어요. 이웃은 벌금을 냈고, 당신 고랑은 돌아왔어요.', en: 'The village elders re-set the boundary stakes. Your neighbor paid a fine, and your furrow came back.' } },
          lose: { effects: { family: -5 }, result: { ko: '판정하러 나온 어른 절반이 그 이웃의 사촌이었어요. 고랑도 이웃도 둘 다 잃은 기분이었어요.', en: 'Half the elders who judged it were his cousins. It felt like losing the furrow and the neighbor both.' } } } },
      { text: { ko: '밤에 도로 갈아 놓는다', en: 'Plow it back at night' }, effects: { wealth: 2, family: -3 },
        result: { ko: '이튿날 아침 고랑은 원래 자리에 있었어요. 이웃은 하늘만 쳐다봤어요.', en: 'Next morning the furrow was back where it belonged. The neighbor just looked at the sky.' } },
      { text: { ko: '한 고랑쯤 눈감아 준다', en: 'Let one furrow go' }, effects: { family: 5, wealth: -2 },
        result: { ko: '그냥 뒀어요. 가을에 그 이웃이 집에서 빚은 술 한 단지를 들고 왔어요.', en: 'You let it go. That autumn, the neighbor turned up with a jug of home brew.' } },
    ] },
  // 십일조: 밭에 세운 곡식 단 열에 하나를 교회가 가져간다
  { id: 'loc.eu.village.tithe', stage: ['adult', 'middle'], tokens: true, when: { zones: EU, setting: 'village', areas: ['britain', 'france', 'germany', 'italy'], minYear: 1100, maxYear: 1789 },
    title: { ko: '열 단에 한 단', en: 'One sheaf in ten' },
    text: { ko: '거둔 곡식 단을 밭에 세워 두면 {holy}에서 사람이 와서 열 단마다 한 단씩 가져가요. 십일조예요.', en: 'The sheaves stand in the field until a man from the {holy} comes to take every tenth one. It is the tithe.' },
    choices: [
      { text: { ko: '굵은 단을 내준다', en: 'Give a good fat sheaf' }, effects: { wealth: -4, happy: 4 },
        result: { ko: '굵은 단을 골라 세웠어요. 마음이 꼭 그 단만큼 가벼워졌어요.', en: 'You stood out a fat sheaf for them. Your heart felt about that much lighter.' } },
      { text: { ko: '가는 단을 골라 둔다', en: 'Set out the thin ones' },
        chance: { p: 0.5,
          win: { effects: { wealth: 4 }, result: { ko: '거둬 가는 사람은 단을 세기만 하고 무게는 보지 않았어요.', en: 'The collector counted the sheaves but never weighed them.' } },
          lose: { effects: { wealth: -6, family: -3 }, result: { ko: '그 사람이 단을 하나하나 들어 봤어요. 결국 두 단을 더 냈고, 소문은 공짜로 났어요.', en: 'He lifted every sheaf. You ended up giving two more, and the gossip came free.' } } } },
    ] },
  // 흑사병 뒤 일손이 귀해져 품삯이 오르고, 법은 옛 삯을 지키라 했다 (흑사병 자체는 사건 카드가 맡는다)
  { id: 'loc.eu.village.wages', stage: ['adult', 'middle'], when: { zones: EU, setting: 'village', areas: ['britain', 'france', 'germany', 'italy', 'iberia', 'nordic'], minYear: 1351, maxYear: 1450 },
    title: { ko: '귀해진 일손', en: 'Hands are scarce' },
    text: { ko: '큰 역병이 지나간 뒤로 일손이 귀해요. 옆 고을 지주는 품삯을 두 배로 준대요. 법은 옛 삯만 받으라지만요.', en: 'Since the great plague passed, workers are scarce. A landholder in the next district offers double wages, though the law says to take only the old rate.' },
    choices: [
      { text: { ko: '옆 고을로 간다', en: 'Go and work there' },
        chance: { p: 0.65,
          win: { effects: { wealth: 10, happy: 3 }, result: { ko: '두 배 삯으로 한 철을 일했어요. 아무도 옛 삯 이야기를 꺼내지 않았어요.', en: 'You worked a season at double pay. Nobody mentioned the old rate.' } },
          lose: { effects: { wealth: -6, happy: -3 }, result: { ko: '나라 관리들이 돌며 삯을 더 받은 사람 이름을 적었어요. 번 돈 절반이 벌금으로 나갔어요.', en: 'Officials came around and wrote down everyone paid too much. Half your earnings went in fines.' } } } },
      { text: { ko: '남아서 조건을 따진다', en: 'Stay and bargain' }, effects: { wealth: 5, family: 2 },
        result: { ko: '영주의 관리인은 얼굴을 찡그리더니, 결국 빵 한 덩이와 삯 몇 푼을 더 얹었어요.', en: 'The lord’s steward scowled, then added a loaf and a few more pennies.' } },
    ] },
  // 맥각 중독 (「거룩한 불」, 성인의 이름을 딴 병명은 실재 인물 이름이라 쓰지 않는다): 젖은 해의 호밀빵. 수도회 병원은 깨끗한 빵을 먹였다
  { id: 'loc.eu.village.fire', stage: ['adult', 'middle', 'old'], ill: true, tokens: true, when: { zones: EU, setting: 'village', areas: ['france', 'germany'], minYear: 900, maxYear: 1750 },   // 수도회 병원이 있던 프랑스·독일 땅만 (검토 m9)
    title: { ko: '거룩한 불', en: 'The holy fire' },
    text: { ko: '비 많던 해의 호밀빵을 먹은 뒤로 손발이 불에 덴 듯 화끈거려요. 사람들은 「거룩한 불」이라 불러요.', en: 'Since eating bread from the wet year’s rye, your hands and feet burn as if scorched. People call it the holy fire.' },
    choices: [
      { text: { ko: '수도원 병원에 간다', en: 'Go to the monks’ hospital' }, effects: { health: 6, wealth: -5 },
        result: { ko: '수도사들이 깨끗한 빵을 먹이고 성인께 기도해 줬어요. 몇 주 만에 불이 잦아들었어요.', en: 'The monks fed you clean bread and prayed to the saint. In a few weeks the fire died down.' } },
      { text: { ko: '{healer:을} 부른다', en: 'Send for the {healer}' }, effects: { health: 2, wealth: -2 },
        result: { ko: '{healer:이} 쓴 약초 물을 주고 갔어요. 조금 나았고, 조금 남았어요.', en: 'The {healer} left you some bitter herb water. It helped a little, and a little stayed.' } },
      { text: { ko: '그 빵을 계속 먹는다', en: 'Keep eating that bread' }, effects: { health: -10, wealth: 3 },
        result: { ko: '버릴 곡식이 없었어요. 화끈거림은 겨울 내내 이어졌어요.', en: 'There was no grain to spare. The burning went on all winter.' } },
    ] },
  // 인클로저: 공유지에 산울타리 (잉글랜드·덴마크·스웨덴·독일 땅)
  { id: 'loc.eu.village.hedge', stage: ['adult', 'middle'], when: { zones: EU, setting: 'village', areas: ['britain', 'germany', 'nordic'], minYear: 1600, maxYear: 1870 },
    title: { ko: '공유지에 울타리', en: 'Hedges around the common' },
    text: { ko: '마을 공유지에 산울타리와 말뚝이 둘러졌어요. 거기서 풀을 뜯던 우리 소는 이제 갈 데가 없어요.', en: 'Hedges and stakes now ring the village common. The cow that grazed there has nowhere to go.' },
    choices: [
      { text: { ko: '밤에 말뚝을 뽑는다', en: 'Pull up the stakes by night' },
        chance: { p: 0.4,
          win: { effects: { happy: 6, family: 5 }, result: { ko: '이웃들과 함께 말뚝을 뽑았어요. 한동안 소들이 다시 거기서 풀을 뜯었어요.', en: 'You and the neighbors pulled up the stakes. For a while the cows grazed there again.' } },
          lose: { effects: { wealth: -8, happy: -4 }, result: { ko: '지주의 사람들이 기다리고 있었어요. 벌금을 물었고, 이튿날 울타리는 더 높아졌어요.', en: 'The landlord’s men were waiting. You paid a fine, and the next day the hedge was higher.' } } } },
      { text: { ko: '소 팔고 품을 판다', en: 'Sell the cow, hire out' }, effects: { wealth: 4, happy: -5 },
        result: { ko: '소 판 돈은 금방 바닥났어요. 대신 남의 밭에서 날품을 팔았어요.', en: 'The money from the cow ran out fast. You took day work in other people’s fields instead.' } },
      { text: { ko: '읍내로 떠난다', en: 'Leave for the town' }, set: ['moved'], fulfill: 'city', effects: { family: -5, happy: 3 },
        result: { ko: '보따리 하나 들고 길을 나섰어요. 굴뚝 연기가 보이는 쪽으로요.', en: 'You set out with one bundle, heading toward the chimney smoke.' } },
    ] },
  // 동유럽 집단농장 (1930~1966년 작업일 셈, 집 뒤 텃밭)
  { id: 'loc.eu.village.kolkhoz', stage: ['adult', 'middle'], when: { zones: EU, setting: 'village', areas: ['east_europe'], minYear: 1930, maxYear: 1966 },
    title: { ko: '작업일 표시', en: 'Workday marks' },
    text: { ko: '밭이 모두 모여 하나의 집단농장이 됐어요. 일한 날마다 장부에 작업일 표시가 붙고, 가을에 그만큼 곡식을 나눠 받아요.', en: 'All the fields have been merged into one collective farm. Each day worked earns a mark in the ledger, and in autumn the grain is shared out by the marks.' },
    choices: [
      { text: { ko: '집단 밭에서 일한다', en: 'Work the collective fields' }, effects: { wealth: 3, family: 3 },
        result: { ko: '작업일 표시는 착실히 늘었어요. 가을에 받은 곡식은 표시만큼 늘지 않았어요.', en: 'Your marks in the ledger piled up. The grain you got in autumn did not pile up as fast.' } },
      { text: { ko: '텃밭에 공을 들인다', en: 'Put work into the house plot' },
        chance: { p: 0.6,
          win: { effects: { wealth: 7, health: 2 }, result: { ko: '집 뒤 작은 텃밭에서 감자와 오이가 쏟아졌어요. 식구들은 그걸로 겨울을 났어요.', en: 'The little plot behind the house overflowed with potatoes and cucumbers. That got the family through winter.' } },
          lose: { effects: { wealth: -5, happy: -4 }, result: { ko: '작업일이 모자란다며 작업반장이 텃밭을 줄이겠대요. 그해는 집단 밭에서 살다시피 했어요.', en: 'The brigade leader said your workdays fell short and threatened to cut your plot. You all but lived in the collective fields that year.' } } } },
    ] },

  // ── 유럽 거리 (europe · street) ──────────────────────────────────
  // 철기 시대: 흙 화로(블루머리)에서 꺼낸 쇳덩이를 두드려 찌꺼기를 뺀다
  { id: 'loc.eu.street.bloom', stage: ['teen', 'adult'], when: { zones: EU, setting: 'street', eraGroups: ['ancient'], minYear: -800 },
    title: { ko: '쇳덩이 두드리기', en: 'Beating the bloom' },
    text: { ko: '흙 화로에서 막 꺼낸 쇳덩이가 벌겋게 달아 있어요. 식기 전에 두드려 찌꺼기를 빼야 쓸 만한 쇠가 돼요.', en: 'The bloom just pulled from the clay furnace is glowing red. It must be hammered before it cools, to beat out the slag and leave good iron.' },
    choices: [
      { text: { ko: '힘껏 두드린다', en: 'Hammer it hard' }, skill: 'craft',
        chance: { p: 0.55,
          win: { effects: { wealth: 8, skill: 2 }, result: { ko: '불똥이 사방으로 튀었고, 쇠는 단단하게 뭉쳤어요. 그걸로 칼 두 자루가 나왔어요.', en: 'Sparks flew everywhere, and the iron came together solid. It made two blades.' } },
          lose: { effects: { wealth: -4, health: -3 }, result: { ko: '쇳덩이가 두 쪽으로 갈라졌어요. 대장장이는 한숨을 쉬고 숯을 더 넣었어요.', en: 'The bloom split in two. The smith sighed and added more charcoal.' } } } },
      { text: { ko: '풀무질을 맡는다', en: 'Work the bellows' }, effects: { happy: 2, family: 3 },
        result: { ko: '하루 종일 풀무를 밟았어요. 다리가 대장장이 팔만큼 굵어지는 것 같았어요.', en: 'You pumped the bellows all day. Your legs felt like they were turning into the smith’s arms.' } },
    ] },
  // 중세 도시: 길드와 시의 검사관이 무게와 솜씨를 살핀다 (빵·에일 법정 가격과 같은 무렵)
  { id: 'loc.eu.street.assize', stage: ['adult', 'middle'], when: { zones: EU, setting: 'street', areas: ['britain', 'france', 'germany', 'italy', 'iberia', 'nordic', 'east_europe'], minYear: 1150, maxYear: 1600 },
    title: { ko: '길드 검사', en: 'The guild inspection' },
    text: { ko: '내일 길드 검사관이 가게마다 돌며 무게와 솜씨를 살핀대요. 이번에 만든 것들은 조금씩 모자라요.', en: 'Tomorrow the guild inspectors go around every shop checking weights and workmanship. Your latest batch is a little short.' },
    choices: [
      { text: { ko: '밤새 다시 만든다', en: 'Remake it overnight' }, effects: { health: -4, wealth: -3, skill: 2 },
        result: { ko: '밤새 다시 만들었어요. 검사관은 고개를 끄덕이고 다음 가게로 갔어요.', en: 'You redid it all night. The inspector nodded and moved on to the next shop.' } },
      { text: { ko: '그냥 내놓는다', en: 'Sell it as it is' },
        chance: { p: 0.5,
          win: { effects: { wealth: 5 }, result: { ko: '검사관은 맨 위의 것만 보고 갔어요. 운이 좋았어요. 이번만은요.', en: 'The inspector only checked the top of the pile. You were lucky. This time.' } },
          lose: { effects: { wealth: -8, happy: -5 }, result: { ko: '벌금을 물었고, 장날 광장에서 이름이 불렸어요. 한동안 손님들이 물건을 두 번씩 들어 봤어요.', en: 'You paid a fine, and your name was read out in the square on market day. For a while, customers weighed everything twice.' } } } },
    ] },
  // 중세 도시가 영주·왕에게서 헌장(자치 특권)을 돈 주고 사던 일
  { id: 'loc.eu.street.charter', stage: ['adult', 'middle'], when: { zones: EU, setting: 'street', areas: ['britain', 'france', 'germany', 'italy', 'iberia', 'nordic', 'east_europe'], minYear: 1100, maxYear: 1500 },
    title: { ko: '도시 헌장', en: 'The town charter' },
    text: { ko: '읍내 사람들이 돈을 모아 영주에게서 헌장을 사려 해요. 그러면 세금도 법도 읍내가 정한대요. 집집마다 몫을 내래요.', en: 'The townsfolk are pooling money to buy a charter from the lord. With it, the town would set its own dues and rules. Every household is asked for a share.' },
    choices: [
      { text: { ko: '몫을 낸다', en: 'Pay your share' }, effects: { wealth: -6, family: 4, happy: 3 },
        result: { ko: '헌장이 읍내 궤짝에 들어갔어요. 장날 통행세가 줄었고, 낸 사람 명단 어딘가에 당신 이름도 있었어요.', en: 'The charter went into the town chest. Market tolls fell, and your name was somewhere on the list of givers.' } },
      { text: { ko: '남들 몫에 기댄다', en: 'Let the others pay' }, effects: { wealth: 2, family: -4 },
        result: { ko: '헌장은 결국 샀대요. 회의 때마다 누군가 당신 쪽을 슬쩍 봤어요.', en: 'They bought the charter anyway. At every meeting, someone glanced your way.' } },
    ] },
  // 떠돌이 직인 (독일 땅의 발츠, 프랑스의 콩파뇽 일주): 장인이 되기 전 몇 해를 떠돈다
  { id: 'loc.eu.street.wander', stage: ['teen', 'adult'], when: { zones: EU, setting: 'street', tags: ['craft'], areas: ['germany', 'france', 'nordic', 'east_europe'], minYear: 1450, maxYear: 1900, maxAge: 30 },
    title: { ko: '떠돌이 직인', en: 'The journeyman’s road' },
    text: { ko: '도제를 마치면 몇 해 동안 이 도시 저 도시를 떠돌며 남의 공방에서 일해야 해요. 그래야 장인 시험을 볼 수 있대요.', en: 'Once your apprenticeship is done, custom says you wander for a few years, working in other towns’ workshops. Only then can you try for master.' },
    choices: [
      { text: { ko: '길을 떠난다', en: 'Take to the road' }, fulfill: 'travel', effects: { skill: 3, family: -4, happy: 5 },
        result: { ko: '세 해 하고 하루를 떠돌았어요. 도시마다 망치 잡는 법이 조금씩 달랐어요.', en: 'You wandered three years and a day. Every town held a hammer a little differently.' } },
      { text: { ko: '고향 공방에 남는다', en: 'Stay in the home workshop' }, effects: { wealth: 4, family: 4 },
        result: { ko: '남아서 일했어요. 장인 자리는 늦어졌지만, 어머니 밥은 날마다 먹었어요.', en: 'You stayed and worked. Mastership came later, but you ate your mother’s cooking every day.' } },
    ] },
  // 19세기 뒤 큰 도시의 백화점: 값을 써 붙이고 흥정하지 않는다. 작은 가게와 장인의 손님이 준다
  { id: 'loc.eu.street.store', stage: ['adult', 'middle'], when: { zones: EU, setting: 'street', tags: ['trade', 'craft'], minYear: 1860, maxYear: 1950 },
    title: { ko: '큰 백화점', en: 'The department store' },
    text: { ko: '큰길에 층마다 물건이 가득한 백화점이 들어섰어요. 값을 써 붙여 놓고 흥정도 안 한대요. 우리 가게 손님이 줄었어요.', en: 'A department store has opened on the main street, every floor full of goods, prices marked and no haggling. Your shop has fewer customers.' },
    choices: [
      { text: { ko: '단골을 붙잡는다', en: 'Keep the regulars close' }, effects: { wealth: -2, charm: 2, family: 3 },
        result: { ko: '이름을 불러 주고 외상도 받아 줬어요. 백화점은 그 손님들 이름을 몰랐어요.', en: 'You greeted them by name and let them buy on credit. The store never knew their names.' } },
      { text: { ko: '백화점 점원이 된다', en: 'Take a job at the store' }, effects: { wealth: 5, happy: -4 },
        result: { ko: '하루 종일 서서 웃었어요. 월급은 꼬박꼬박 나왔고, 다리도 꼬박꼬박 부었어요.', en: 'You stood and smiled all day. The wages came regularly, and so did the swollen feet.' } },
      { text: { ko: '한 가지만 판다', en: 'Specialize in one thing' },
        chance: { p: 0.5,
          win: { effects: { wealth: 8 }, result: { ko: '한 가지 물건만 파고들었어요. 그것만큼은 백화점보다 잘 알았고, 손님이 다시 왔어요.', en: 'You put everything into one line of goods. You knew it better than the store did, and customers came back.' } },
          lose: { effects: { wealth: -6 }, result: { ko: '하필 그 물건이 유행에서 밀려났어요.', en: 'Of course, that one thing went out of fashion.' } } } },
    ] },
  // 전후 유럽 도시의 집 모자람과 아파트 대기 명단 (동서 모두)
  { id: 'loc.eu.street.flat', stage: ['adult', 'middle'], when: { zones: EU, setting: 'street', minYear: 1950, maxYear: 1990 },
    title: { ko: '집 기다리기', en: 'Waiting for a flat' },
    text: { ko: '도시에 집이 모자라요. 새 아파트를 받으려면 대기 명단에 이름을 올리고 몇 해를 기다려야 해요.', en: 'The city is short of homes. To get a new flat you put your name on the waiting list and wait for years.' },
    choices: [
      { text: { ko: '명단에 올리고 기다린다', en: 'Sign up and wait' },
        chance: { p: 0.6,
          win: { effects: { happy: 6, family: 4 }, result: { ko: '몇 해 만에 열쇠를 받았어요. 더운물이 처음 나온 날, 식구 모두 수도꼭지 앞에 모였어요.', en: 'After years, the keys came. The day the hot water first ran, the whole family gathered around the tap.' } },
          lose: { effects: { happy: -5 }, result: { ko: '명단은 도무지 줄지 않았어요. 앞사람이 어째서인지 자꾸 늘었어요.', en: 'The list never seemed to shrink. Somehow the people ahead of you kept multiplying.' } } } },
      { text: { ko: '셋방에 산다', en: 'Rent a cramped room' }, effects: { wealth: -4, family: -2 },
        result: { ko: '부엌 하나를 세 집이 같이 썼어요. 냄새만 맡아도 이웃 저녁상을 다 알았어요.', en: 'Three families shared one kitchen. You knew every neighbor’s supper by the smell.' } },
    ] },
  // 동유럽 계획 경제의 줄 서기와 아는 사람 통하기
  { id: 'loc.eu.street.queue', stage: ['adult', 'middle'], when: { zones: EU, setting: 'street', areas: ['east_europe'], minYear: 1955, maxYear: 1991 },
    title: { ko: '줄 끝에서', en: 'At the end of the queue' },
    text: { ko: '국영 상점 앞에 줄이 길게 섰어요. 뭘 파는지는 아무도 모르지만, 일단 서고 봐요.', en: 'A long queue has formed outside the state store. Nobody knows what is on sale, but you join it first and ask later.' },
    choices: [
      { text: { ko: '끝까지 선다', en: 'Stand to the end' }, effects: { wealth: 3, happy: -3 },
        result: { ko: '세 시간 만에 차례가 왔어요. 남은 건 치수가 안 맞는 구두 한 켤레였어요. 일단 샀어요.', en: 'Your turn came after three hours. All that was left was one pair of shoes in the wrong size. You bought them anyway.' } },
      { text: { ko: '아는 사람을 통한다', en: 'Go through someone you know' },
        chance: { p: 0.6,
          win: { effects: { wealth: 5, charm: 1 }, result: { ko: '친구의 처남의 이웃이 뒷문을 열어 줬어요. 값은 초콜릿 한 상자였어요.', en: 'A friend’s brother-in-law’s neighbor opened the back door. It cost a box of chocolates.' } },
          lose: { effects: { family: -4 }, result: { ko: '그 아는 사람은 생각만큼 당신을 알지 않았어요.', en: 'That someone turned out to know you less well than you had thought.' } } } },
    ] },

  // ── 유럽 큰 집 (europe · estate): 앞마당(귀족)과 뒤뜰(하인) ─────────
  // 하인 쪽 · 로마의 집안 노예: 허락받고 모은 돈(페쿨리움)으로 자유를 산다. 해방되면 펠트 모자를 쓴다
  { id: 'loc.eu.estate.peculium', stage: ['adult', 'middle'], when: { zones: EU, setting: 'estate', tags: ['serve'], areas: ['italy', 'iberia', 'france', 'balkans'], minYear: -200, maxYear: 450 },
    title: { ko: '모아 둔 돈', en: 'The savings pouch' },
    text: { ko: '몇 해 동안 주인 허락을 받아 모은 돈이 꽤 돼요. 주인에게 내밀면 자유를 살 수 있을지도 몰라요.', en: 'Over the years, with the master’s leave, you have saved a fair sum of your own. Offered to the master, it might buy your freedom.' },
    choices: [
      { text: { ko: '몸값으로 내민다', en: 'Offer it for your freedom' },
        chance: { p: 0.6,
          win: { effects: { wealth: -12, happy: 10, status: 1 }, result: { ko: '주인이 고개를 끄덕였어요. 이튿날 당신은 해방된 사람의 펠트 모자를 쓰고 같은 문을 나섰어요.', en: 'The master nodded. The next day you walked out of the same door wearing the freed slave’s felt cap.' } },
          lose: { effects: { happy: -6 }, result: { ko: '주인은 돈을 세어 보더니 「조금만 더」라고 했어요. 그 조금은 몇 해였어요.', en: 'The master counted it and said, “A little more.” The little turned out to be years.' } } } },
      { text: { ko: '더 모은다', en: 'Keep saving' }, effects: { wealth: 4 },
        result: { ko: '주머니가 조금 더 무거워졌어요. 기다림도 그만큼 무거워졌어요.', en: 'The pouch got a little heavier. So did the waiting.' } },
      { text: { ko: '주인 장부를 맡는다', en: 'Take over the master’s ledgers' }, when: { minKnow: 25 }, effects: { wealth: 6, know: 2, family: 2 },
        result: { ko: '주인 장부를 맡았어요. 셈이 맞아떨어질 때마다 자유가 한 줄씩 가까워지는 것 같았어요.', en: 'You took over the master’s accounts. Each time the sums balanced, freedom felt one line closer.' } },
    ] },
  // 귀족 쪽 · 로마 이전 청동기·철기 족장 집: 따르는 전사들에게 금붙이를 나눠 주는 잔치
  { id: 'loc.eu.estate.gifts', stage: ['adult', 'middle'], when: { zones: EU, setting: 'estate', tags: ['elite'], eraGroups: ['ancient'], areas: ['britain', 'france', 'germany', 'iberia', 'east_europe', 'balkans', 'nordic'], minYear: -1200, maxYear: -50 },
    title: { ko: '족장의 선물', en: 'The chieftain’s gifts' },
    text: { ko: '잔치 날, 집안을 따르는 전사들에게 선물을 나눠 줘야 해요. 금붙이를 후하게 줄수록 따르는 사람이 는대요.', en: 'On feast day, the household hands out gifts to the warriors who follow it. The more generous the gold, the more followers, people say.' },
    choices: [
      { text: { ko: '금붙이를 후하게 준다', en: 'Give the gold generously' }, effects: { wealth: -10, family: 6, charm: 2 },
        result: { ko: '금 목걸이가 전사들 목에 걸렸어요. 그해 겨울, 당신 집 화덕 곁엔 빈자리가 없었어요.', en: 'Gold rings went around the warriors’ necks. That winter there was no empty seat by your hearth.' } },
      { text: { ko: '아껴서 나눈다', en: 'Give sparingly' }, effects: { wealth: 4, family: -5 },
        result: { ko: '곳간은 지켰어요. 봄이 오자 전사 몇이 옆 골짜기 족장 집으로 옮겨 갔어요.', en: 'You kept the storehouse full. In spring a few warriors moved to the chieftain in the next valley.' } },
    ] },
  // 귀족 쪽 · 장원 법정: 영주 집안이 소작인의 일을 판결한다
  { id: 'loc.eu.estate.court', stage: ['adult', 'middle'], when: { zones: EU, setting: 'estate', tags: ['elite'], areas: ['britain', 'france', 'germany', 'italy', 'iberia', 'nordic', 'east_europe'], minYear: 900, maxYear: 1700 },
    title: { ko: '장원 법정', en: 'The manor court' },
    text: { ko: '오늘 장원 법정에서 당신이 판결을 내려요. 소작인의 돼지가 영주 밀밭을 망쳤는데, 그 집은 벌금 낼 돈이 없대요.', en: 'Today you sit in judgment at the manor court. A tenant’s pig has ruined the lord’s wheat, and the family has no money for the fine.' },
    choices: [
      { text: { ko: '법대로 물린다', en: 'Fine them by the book' }, effects: { wealth: 5, family: -4 },
        result: { ko: '벌금은 곡식으로 받았어요. 그 집 아이들이 법정 밖에서 당신을 오래 쳐다봤어요.', en: 'The fine was taken in grain. Their children stared at you a long time outside the court.' } },
      { text: { ko: '일로 갚게 한다', en: 'Let them work it off' }, effects: { wealth: 2, charm: 2 },
        result: { ko: '그 집 아들이 사흘 동안 영주 밭 울타리를 고쳤어요. 돼지도 그 뒤로 얌전해졌어요.', en: 'Their son mended the lord’s fences for three days. The pig behaved after that, too.' } },
      { text: { ko: '용서한다', en: 'Pardon them' }, effects: { family: 5, happy: 3, wealth: -2 },
        result: { ko: '용서해 줬어요. 관리인은 장부에 한숨을 적었고, 마을엔 당신 이야기가 돌았어요.', en: 'You let it go. The steward wrote a sigh into the ledger, and the village talked about you for weeks.' } },
    ] },
  // 하인 쪽 · 중세 농노: 주에 며칠은 영주 직영지 부역. 읍내로 달아나 한 해 하고 하루를 버티면 자유라는 말
  { id: 'loc.eu.estate.weekwork', stage: ['teen', 'adult'], when: { zones: EU, setting: 'estate', tags: ['serve'], areas: ['britain', 'france', 'germany'], minYear: 800, maxYear: 1500 },   // 주 단위 부역이 무거웠던 서유럽 장원 땅만 (검토 m9)
    title: { ko: '주에 사흘', en: 'Three days a week' },
    text: { ko: '주에 사흘은 영주 밭을 갈아요. 내 밭은 남은 날과 해 질 녘 몫이에요. 읍내에서 한 해 하고 하루를 버티면 자유라는 말이 돌아요.', en: 'Three days a week you plow the lord’s land; your own strip gets what is left, and the dusk. In town, they say, a year and a day makes you free.' },
    choices: [
      { text: { ko: '해 질 녘까지 버틴다', en: 'Work on till dusk' }, effects: { health: -5, wealth: 3, family: 3 },
        result: { ko: '영주 밭을 갈고 내 밭까지 갈았어요. 별을 보며 집에 왔어요.', en: 'You plowed the lord’s land, then your own. You walked home under the stars.' } },
      { text: { ko: '읍내로 달아난다', en: 'Run away to the town' }, when: { bound: true },
        chance: { p: 0.4,
          win: { effects: { status: 1, happy: 6, family: -6 }, result: { ko: '읍내 공방 뒷방에서 한 해 하고 하루를 숨어 살았어요. 그 뒤로 아무도 당신을 데리러 오지 않았어요.', en: 'You lived a year and a day in the back room of a town workshop. After that, nobody came for you.' } },
          lose: { effects: { health: -8, happy: -6 }, result: { ko: '열흘 만에 영주의 사람들이 당신을 찾아냈어요. 돌아와서 남들보다 오래 일했어요.', en: 'Within ten days the lord’s men found you. Back home, you worked longer than anyone.' } } } },
    ] },
  // 귀족 쪽 · 그랜드 투어 (1660~1820년 무렵): 가정교사를 데리고 이탈리아까지
  { id: 'loc.eu.estate.tour', stage: ['teen', 'adult'], when: { zones: EU, setting: 'estate', tags: ['elite'], areas: ['britain', 'france', 'germany', 'nordic', 'east_europe'], minYear: 1660, maxYear: 1820, maxAge: 26 },
    title: { ko: '그랜드 투어', en: 'The Grand Tour' },
    text: { ko: '집안 젊은이는 가정교사를 따라 몇 해 동안 이탈리아까지 돌고 와야 한대요. 옛 유적을 보고 말과 예법을 배워 오는 길이에요.', en: 'Custom says the young of the house must travel for a few years, as far as Italy, with a tutor in tow, to see the ruins and come home with languages and manners.' },
    choices: [
      { text: { ko: '길을 나선다', en: 'Set out' }, fulfill: 'travel', effects: { wealth: -10, know: 3, happy: 6 },
        result: { ko: '로마에서 무너진 기둥을 보고, 나폴리에서 화산을 봤어요. 가정교사는 내내 돈 걱정을 했어요.', en: 'You saw broken columns in Rome and a volcano at Naples. The tutor worried about money the whole way.' } },
      { text: { ko: '영지에 남는다', en: 'Stay on the estate' }, effects: { wealth: 5, family: 3 },
        result: { ko: '남아서 소작료 장부를 배웠어요. 이탈리아는 그림으로만 봤어요.', en: 'You stayed and learned the rent books. Italy you saw only in paintings.' } },
    ] },

  // ── 서아시아·북아프리카 마을 (mudbrick · village) ─────────────────
  // 신석기 아나톨리아: 지붕 구멍으로 드나드는 집, 해마다 다시 바르는 흰 회벽 (차탈회위크)
  { id: 'loc.eu.wvillage.roof', stage: 'child', when: { zones: MB, setting: 'village', areas: ['anatolia'], minYear: -7100, maxYear: -5700 },   // 차탈회위크 연대 (검토 m6)
    title: { ko: '지붕으로 드나드는 집', en: 'In through the roof' },
    text: { ko: '집들이 다닥다닥 붙어 있어서 문 대신 지붕 구멍으로 사다리를 타고 드나들어요. 오늘은 벽에 흰 회칠을 새로 하는 날이에요.', en: 'The houses are packed wall to wall, so everyone comes and goes by ladder through a hole in the roof. Today the walls get a fresh coat of white plaster.' },
    choices: [
      { text: { ko: '회칠을 거든다', en: 'Help with the plaster' }, effects: { family: 4, skill: 1 },
        result: { ko: '손바닥으로 하얀 흙을 펴 발랐어요. 그 벽엔 당신 손자국이 몇 개 숨어 있어요.', en: 'You spread the white clay with your palms. A few of your handprints are hidden in that wall.' } },
      { text: { ko: '벽에 황소를 그린다', en: 'Paint a bull on the wall' }, effects: { happy: 6, family: -2 },
        result: { ko: '붉은 흙으로 뿔 큰 황소를 그렸어요. 어른들은 혼내러 왔다가 한참 들여다봤어요.', en: 'You painted a big-horned bull in red earth. The grown-ups came to scold you and ended up staring at it.' } },
      { text: { ko: '지붕 위로 달아난다', en: 'Escape across the rooftops' }, effects: { happy: 4, health: -2 },
        result: { ko: '지붕에서 지붕으로 뛰어다녔어요. 이 마을에선 지붕이 곧 길이었어요.', en: 'You ran from roof to roof. In this village, the roofs were the streets.' } },
    ] },
  // 물대기 마을의 물 차례 다툼 (메소포타미아 운하부터 이란·마그레브의 물길까지)
  { id: 'loc.eu.wvillage.water', stage: ['adult', 'middle'], tokens: true, when: { zones: MB, setting: 'village', areas: ['mesopotamia', 'iran', 'anatolia', 'maghreb', 'arabia'], minYear: -5500, maxYear: 1900 },
    title: { ko: '물 차례', en: 'Whose turn for water' },
    text: { ko: '오늘은 우리 밭에 물을 댈 차례인데, 윗밭 사람이 물길을 막아 놓았어요. 물이 없으면 {crop:은} 사흘을 못 버텨요.', en: 'It is your turn for the water today, but the man upstream has blocked the channel. Without water the {crop} will not last three days.' },
    choices: [
      { text: { ko: '물길을 터 버린다', en: 'Break open the channel' },
        chance: { p: 0.55,
          win: { effects: { wealth: 6 }, result: { ko: '흙둑을 괭이로 터 버렸어요. 물이 콸콸 내려왔고, 윗밭 사람은 못 본 척했어요.', en: 'You broke the earth dam with a hoe. Water rushed down, and the man upstream pretended not to see.' } },
          lose: { effects: { family: -6, health: -3 }, result: { ko: '윗밭 사람이 괭이를 들고 뛰어왔어요. 둘 다 흙투성이가 되도록 다퉜어요.', en: 'The man upstream came running with his own hoe. You both fought until you were caked in mud.' } } } },
      { text: { ko: '마을 어른께 간다', en: 'Go to the village elders' }, effects: { wealth: 3, family: 3 },
        result: { ko: '어른들이 물 차례를 다시 정해 줬어요. 반나절 늦었지만 물은 왔어요.', en: 'The elders settled the water turns again. The water came half a day late, but it came.' } },
    ] },
  // 수메르의 신전 경제: 일꾼은 달마다 보리를 받고, 서기는 점토판에 적는다
  { id: 'loc.eu.wvillage.ration', stage: ['adult', 'middle'], when: { zones: MB, setting: 'village', areas: ['mesopotamia'], minYear: -3000, maxYear: -1600 },
    title: { ko: '보리 배급', en: 'The barley ration' },
    text: { ko: '신전 창고에서 한 달 치 보리를 나눠 줘요. 서기가 이름을 부르고 점토판에 표시를 눌러요. 오늘 몫이 조금 적어 보여요.', en: 'The temple storehouse is handing out the month’s barley. A scribe calls each name and presses a mark into a clay tablet. Today your share looks a little small.' },
    choices: [
      { text: { ko: '그냥 받는다', en: 'Take it and go' }, effects: { wealth: -2, family: 2 },
        result: { ko: '말없이 자루를 메고 왔어요. 그 달은 빵이 조금 얇았어요.', en: 'You shouldered the sack without a word. The bread was a little thinner that month.' } },
      { text: { ko: '따져 묻는다', en: 'Ask about it' },
        chance: { p: 0.45,
          win: { effects: { wealth: 4 }, result: { ko: '서기가 머리를 긁더니 한 줌을 더 퍼 줬어요.', en: 'The scribe scratched his head and scooped in another handful.' } },
          lose: { effects: { wealth: -2, happy: -4 }, result: { ko: '서기는 점토판을 가리키며 「여기 그렇게 적혀 있다」고만 했어요.', en: 'The scribe just pointed at the tablet: “That is what it says here.”' } } } },
      { text: { ko: '점토판을 직접 읽는다', en: 'Read the tablet yourself' }, when: { minKnow: 25 }, effects: { wealth: 5, know: 2 },
        result: { ko: '빠진 표시 하나를 짚어 냈어요. 서기는 얼굴이 빨개졌고, 그 뒤로 당신 몫은 늘 정확했어요.', en: 'You spotted the missing mark. The scribe went red, and after that your share was always exact.' } },
    ] },
  // 나일 강물 눈금 (나일로미터): 물 높이로 그해 수확과 세금을 가늠했다
  { id: 'loc.eu.wvillage.nilometer', stage: ['adult', 'middle'], when: { zones: MB, setting: 'village', areas: ['nile'], minYear: -2600, maxYear: 1850 },
    title: { ko: '강물 눈금', en: 'The flood mark' },
    text: { ko: '올해 강물이 눈금 계단 낮은 데서 멈췄대요. 밭 절반이 마른 채예요. 곧 세금을 매기는 서기가 와요.', en: 'This year the river stopped low on the measuring steps. Half the fields stayed dry. The scribe who sets the tax is coming soon.' },
    choices: [
      { text: { ko: '마른 밭을 보여 준다', en: 'Show him the dry fields' },
        chance: { p: 0.6,
          win: { effects: { wealth: 4, happy: 3 }, result: { ko: '서기가 갈라진 흙을 밟아 보더니 장부의 숫자를 줄였어요.', en: 'The scribe walked on the cracked earth and lowered the figure in his book.' } },
          lose: { effects: { wealth: -6 }, result: { ko: '서기는 「위에서 정한 숫자」라며 고개를 저었어요. 곳간이 금세 가벼워졌어요.', en: '“The figure comes from above,” said the scribe, shaking his head. The granary got light very fast.' } } } },
      { text: { ko: '물동이를 나른다', en: 'Carry water jars' }, effects: { health: -5, wealth: 3 },
        result: { ko: '강까지 하루에 수십 번을 오갔어요. 밭 한 귀퉁이는 살렸어요.', en: 'You went down to the river dozens of times a day. You saved one corner of the field.' } },
    ] },
  // 카나트: 산기슭에서 땅속 굴로 물을 끌어오는 물길 (이란, 아라비아의 팔라즈)
  { id: 'loc.eu.wvillage.qanat', stage: ['adult', 'middle'], when: { zones: MB, setting: 'village', areas: ['iran', 'arabia'], minYear: -700, maxYear: 1960 },
    title: { ko: '무너진 카나트', en: 'The collapsed qanat' },
    text: { ko: '산 밑에서 마을까지 땅속으로 물을 끌어오는 카나트 굴이 한 군데 무너졌어요. 물줄기가 가늘어졌어요.', en: 'Part of the qanat, the tunnel that carries water underground from the foot of the mountains, has caved in. The flow has dwindled to a trickle.' },
    choices: [
      { text: { ko: '굴 안으로 내려간다', en: 'Go down into the tunnel' },
        chance: { p: 0.7,
          win: { effects: { wealth: 6, family: 4 }, result: { ko: '등잔 하나 들고 기어 들어가 흙을 퍼냈어요. 사흘 뒤 물소리가 다시 커졌어요.', en: 'You crawled in with a single lamp and dug out the earth. Three days later the water was loud again.' } },
          lose: { effects: { health: -8 }, result: { ko: '흙이 또 무너져 다리를 다쳤어요. 굴은 고쳐졌지만, 다리는 한 철이 걸렸어요.', en: 'More earth fell and hurt your leg. The tunnel got fixed; your leg took a season.' } } } },
      { text: { ko: '굴꾼 삯을 보탠다', en: 'Chip in for the diggers' }, effects: { wealth: -5, family: 3 },
        result: { ko: '마을 사람들과 삯을 모아 굴꾼들을 불렀어요. 그들은 말없이 내려가 말없이 고쳤어요.', en: 'You pooled money with the village to hire the qanat diggers. They went down without a word and fixed it without a word.' } },
    ] },
  // 눈병: 모래바람·파리·고인 물. 검은 눈약(콜)은 화장이자 약이었다
  { id: 'loc.eu.wvillage.eyes', stage: ['child', 'adult', 'middle', 'old'], ill: true, tokens: true, when: { zones: MB, setting: 'village', areas: ['nile', 'mesopotamia', 'arabia', 'maghreb', 'iran'], minYear: -3000, maxYear: 1949 },
    title: { ko: '아픈 눈', en: 'Sore eyes' },
    text: { ko: '모래바람이 지나간 뒤로 눈이 빨갛게 붓고 따가워요. 파리가 자꾸 눈가에 앉아요.', en: 'Since the sandstorm passed, your eyes have been red, swollen and stinging. The flies keep settling at the corners.' },
    choices: [
      { text: { ko: '{healer}의 약을 바른다', en: 'Use the {healer}’s salve' }, effects: { health: 5, wealth: -3 },
        result: { ko: '검은 눈약을 눈가에 발랐어요. 따가움이 가라앉았고, 눈매가 꽤 멋져졌어요.', en: 'You lined your eyes with the dark salve. The stinging eased, and your eyes looked rather fine.' } },
      { text: { ko: '어두운 방에서 쉰다', en: 'Rest in a dark room' }, effects: { health: 2, wealth: -2 },
        result: { ko: '며칠을 어두운 방에 누워 있었어요. 눈은 천천히 나았어요.', en: 'You lay in a dark room for days. Your eyes healed slowly.' } },
      { text: { ko: '참고 일한다', en: 'Work through it' }, effects: { health: -7, wealth: 3 },
        result: { ko: '눈을 비비며 일했어요. 한동안 세상이 뿌옇게 보였어요.', en: 'You worked on, rubbing your eyes. For a while the world looked hazy.' } },
    ] },
  // 와크프(기부 재산)가 선생 삯을 대는 글방
  { id: 'loc.eu.wvillage.kuttab', stage: 'child', tokens: true, when: { zones: MB, setting: 'village', areas: ISLAMIC, minYear: 900, maxYear: 1920 },   // 마을 다수가 무슬림이 된 9~10세기부터 (검토 m8)
    title: { ko: '기부로 연 글방', en: 'The endowed school' },
    text: { ko: '어느 부자가 남긴 와크프(기부 재산) 덕에 {school} 선생 삯이 공짜래요. 아침마다 아이들이 모여 글을 외워요.', en: 'Thanks to a waqf, an endowment left by a rich man, the {school} teacher costs nothing. Every morning the children gather to recite.' },
    choices: [
      { text: { ko: '{school}에 다닌다', en: 'Go to the {school}' }, effects: { know: 4, happy: 2 },
        result: { ko: '판자에 글자를 쓰고 지우기를 수백 번 했어요. 어느 날 문 위에 적힌 글이 읽혔어요.', en: 'You wrote letters on a board and wiped them off hundreds of times. One day you could read the words over a door.' } },
      { text: { ko: '양 떼를 돌본다', en: 'Mind the sheep instead' }, effects: { wealth: 3, family: 2 },
        result: { ko: '들판에서 양을 쳤어요. 글은 몰라도 양 한 마리 한 마리 얼굴은 다 알았어요.', en: 'You herded sheep in the fields. You could not read, but you knew every sheep by its face.' } },
    ] },
  // 메카 순례 대상에 끼어 떠나는 마을 어른
  { id: 'loc.eu.wvillage.hajj', stage: ['adult', 'middle', 'old'], when: { zones: MB, setting: 'village', areas: ISLAMIC, minYear: 900, maxYear: 1900 },   // 같은 까닭 (검토 m8)
    title: { ko: '순례 행렬', en: 'The pilgrim caravan' },
    text: { ko: '마을 어른 한 분이 메카로 가는 순례 행렬에 낀대요. 몇 달 걸리는 길이고 돈도 많이 들어요. 같이 가자고 하세요.', en: 'One of the village elders is joining the caravan to Mecca. The journey takes months and costs a great deal. He asks if you will come.' },
    choices: [
      { text: { ko: '함께 떠난다', en: 'Go with him' }, fulfill: 'travel', effects: { wealth: -12, happy: 10, health: -3 },
        result: { ko: '몇 달 만에 닿아 수많은 사람과 함께 기도했어요. 돌아오자 이웃들이 당신을 「하지」라고 불렀어요.', en: 'You arrived after months and prayed among countless others. Back home, the neighbors called you “Hajji.”' } },
      { text: { ko: '여비를 보탠다', en: 'Help with his travel money' }, effects: { wealth: -3, family: 4 },
        result: { ko: '여비에 보태시라고 동전 몇 닢을 쥐여 드렸어요. 어른은 당신 이름도 함께 빌겠다고 했어요.', en: 'You pressed a few coins into his hand for the road. He promised to remember your name in his prayers.' } },
    ] },
  // 오스만의 티마르: 마을 세는 기병(시파히) 몫, 법전에 정한 몫이 있고 카디 법정에 호소할 수 있었다
  { id: 'loc.eu.wvillage.timar', stage: ['adult', 'middle'], when: { zones: MB, setting: 'village', areas: ['anatolia'], minYear: 1370, maxYear: 1700 },
    title: { ko: '시파히의 몫', en: 'The sipahi’s share' },
    text: { ko: '이 마을 세금은 티마르를 받은 기병(시파히)에게 가요. 전쟁이 나면 그가 말 타고 나가고요. 올해 세금을 걷는 그의 관리인이 정해진 것보다 더 달래요.', en: 'This village’s dues go to a sipahi, a cavalryman granted the timar; when war comes, he rides out. This year his agent wants more than the set amount.' },
    choices: [
      { text: { ko: '달라는 대로 낸다', en: 'Pay what he asks' }, effects: { wealth: -7 },
        result: { ko: '곡식 자루를 더 내줬어요. 관리인은 고맙다는 말 대신 장부를 덮었어요.', en: 'You handed over the extra sacks. Instead of thanks, the agent closed his ledger.' } },
      { text: { ko: '카디 법정에 호소한다', en: 'Appeal to the kadi’s court' },
        chance: { p: 0.5,
          win: { effects: { wealth: 4, happy: 4 }, result: { ko: '카디가 법전에 적힌 몫을 읽어 줬어요. 관리인은 정해진 만큼만 가져갔어요.', en: 'The kadi read out the share written in the law register. The agent took only what was due.' } },
          lose: { effects: { wealth: -5, family: -3 }, result: { ko: '재판은 길어졌고, 그사이 관리인 눈길이 따가웠어요. 결국 더 달란 것의 반을 냈어요.', en: 'The case dragged on, and the agent’s glare grew sharp. In the end you paid half the extra.' } } } },
    ] },
  // 석유 시대: 석유 나는 땅의 일자리와 고향으로 부치는 돈 (1970년대에 크게)
  { id: 'loc.eu.wvillage.oil', stage: ['adult', 'middle'], when: { zones: MB, setting: 'village', areas: ISLAMIC, minYear: 1960 },
    title: { ko: '석유 땅의 일자리', en: 'Work in the oil lands' },
    text: { ko: '석유가 솟는 땅에서 일꾼을 구한대요. 몇 해만 일하면 흙벽돌집을 헐고 시멘트 집을 올릴 수 있대요.', en: 'The oil lands are hiring workers. A few years there, they say, and you could knock down the mud-brick house and put up a concrete one.' },
    choices: [
      { text: { ko: '일하러 떠난다', en: 'Go and work there' }, effects: { wealth: 12, family: -8, happy: -2 },
        result: { ko: '몇 해 동안 뜨거운 공사장에서 일했어요. 고향 집 지붕은 당신이 부친 돈으로 올라갔어요.', en: 'You worked for years on scorching building sites. The roof back home went up on the money you sent.' } },
      { text: { ko: '밭을 지킨다', en: 'Stay with the fields' }, effects: { family: 5, wealth: -2 },
        result: { ko: '남아서 밭을 지켰어요. 일손이 귀해져 품삯이 올랐고, 그 덕을 조금 봤어요.', en: 'You stayed with the fields. Hands grew scarce and wages rose, and some of that came your way.' } },
    ] },

  // ── 서아시아 야영지 (mudbrick·steppe · camp): 수렵 무리와 가축 치는 집 ───
  // 수렵 무리 · 붉은 흙을 바른 고둥 껍데기 구슬 (레반트 스쿨, 모로코 타포랄트 8만 2천 년 전)
  { id: 'loc.eu.wcamp.beads', stage: ['child', 'teen'], when: { zones: MB, setting: 'camp', eraGroups: ['forager'], minYear: -100000 },
    title: { ko: '붉은 칠 조개', en: 'Red-ochred shells' },
    text: { ko: '바닷가 무리에게서 얻은 작은 고둥 껍데기에 구멍을 뚫고 붉은 흙을 발라요. 줄에 꿰면 목걸이가 돼요.', en: 'You pierce tiny sea-snail shells traded from a coastal band and rub them with red ochre. Strung on a cord, they make a necklace.' },
    choices: [
      { text: { ko: '내가 건다', en: 'Wear it yourself' }, effects: { happy: 6, charm: 1 },
        result: { ko: '걸을 때마다 껍데기끼리 달그락거렸어요. 다른 무리 아이들이 어디서 났냐고 물었어요.', en: 'It clicked with every step. Children from other bands asked where you got it.' } },
      { text: { ko: '다른 무리 아이에게 준다', en: 'Give it to a child of another band' }, bond: { kind: 'friend', who: { ko: '조개 목걸이를 받은 아이', en: 'the child who got your shell necklace' } }, effects: { family: 4, happy: 2 },
        result: { ko: '그 아이가 답례로 반짝이는 돌 조각을 줬어요. 두 무리가 만날 때마다 둘은 꼭 붙어 다녔어요.', en: 'In return the child gave you a shiny flake of stone. Whenever the two bands met, you two were inseparable.' } },
    ] },
  // 수렵 무리 · 비 오는 시절이 오면 사하라·아라비아의 마른 땅에 호수와 풀밭이 생겼다
  { id: 'loc.eu.wcamp.lake', stage: ['adult', 'middle'], when: { zones: MB, setting: 'camp', eraGroups: ['forager'], areas: ['maghreb', 'nile', 'arabia'], minYear: -13000 },   // 아프리카 습윤기 (검토 m11)
    title: { ko: '사막에 생긴 호수', en: 'A lake in the desert' },
    text: { ko: '비 오는 해가 길게 이어지더니, 남쪽 마른 땅에 호수가 생기고 풀이 돋았대요. 가젤 떼도 그쪽으로 갔대요.', en: 'The rainy years have gone on and on, and word is a lake has appeared in the dry lands to the south, ringed with grass. The gazelles went that way.' },
    choices: [
      { text: { ko: '무리를 이끌고 간다', en: 'Lead the band there' },
        chance: { p: 0.6,
          win: { effects: { wealth: 8, happy: 5 }, result: { ko: '호숫가엔 물고기와 새가 가득했어요. 하마가 물 밖으로 고개를 내밀자 다들 소리를 질렀어요.', en: 'The shore teemed with fish and birds. When a hippo poked its head out of the water, everyone shrieked.' } },
          lose: { effects: { health: -6, wealth: -4 }, result: { ko: '호수는 소문보다 작았고, 길은 멀었어요. 지친 채로 옛 샘으로 돌아왔어요.', en: 'The lake was smaller than the rumor, and the way was long. You came back to the old spring, worn out.' } } } },
      { text: { ko: '아는 샘을 지킨다', en: 'Stay by the spring you know' }, effects: { family: 4 },
        result: { ko: '남았어요. 익숙한 샘물 맛이 그렇게 좋은 줄 처음 알았어요.', en: 'You stayed. You had never noticed how good the old spring tasted.' } },
    ] },
  // 가축 치는 집 · 사막과 초원의 손님 대접 (사흘은 묻지 않고 먹이고 재운다)
  { id: 'loc.eu.wcamp.guest', stage: ['adult', 'middle', 'old'], when: { zones: CAMP, setting: 'camp', tags: ['herd'], eraGroups: ['ancient', 'medieval'] },
    title: { ko: '해 질 녘 손님', en: 'A guest at dusk' },
    text: { ko: '해 질 녘, 낯선 나그네가 천막 앞에 섰어요. 이 땅에선 손님에게 사흘 동안은 어디서 왔는지 묻지 않고 먹이고 재워요.', en: 'At dusk a stranger stands at your tent. In this country a guest is fed and sheltered for three days before anyone asks where he came from.' },
    choices: [
      { text: { ko: '새끼 양을 잡는다', en: 'Slaughter a young lamb' }, effects: { wealth: -6, charm: 2, family: 3 },
        result: { ko: '고기 냄새가 천막에 가득했어요. 나그네는 떠나며 먼 우물 자리를 일러 줬어요.', en: 'The tent filled with the smell of meat. Leaving, the stranger told you where to find a distant well.' } },
      { text: { ko: '젖과 빵을 낸다', en: 'Offer milk and bread' }, effects: { wealth: -1, family: 1 },
        result: { ko: '소박한 상이었지만 나그네는 고맙게 먹었어요. 아무도 흉보지 않았어요.', en: 'A simple meal, but the guest ate gratefully. Nobody thought less of you.' } },
    ] },
  // 가축 치는 집 · 낙타 대상 (단봉낙타는 기원전 10세기 무렵부터 널리)
  { id: 'loc.eu.wcamp.camel', stage: ['teen', 'adult'], when: { zones: CAMP, setting: 'camp', tags: ['herd'], areas: CAMEL, eraGroups: ['ancient', 'medieval'], minYear: -900 },
    title: { ko: '낙타 대상', en: 'The camel caravan' },
    text: { ko: '짐을 잔뜩 실은 낙타 대상이 우물가에 머물러요. 길잡이와 낙타 몇 마리를 빌려 달래요. 삯은 두둑하대요.', en: 'A heavily laden camel caravan has stopped at the well. They want to hire a guide and a few camels. The pay is good, they say.' },
    choices: [
      { text: { ko: '길잡이로 따라간다', en: 'Go along as their guide' }, fulfill: 'travel',
        chance: { p: 0.6,
          win: { effects: { wealth: 10, happy: 4 }, result: { ko: '별을 보고 길을 짚었어요. 대상은 무사히 다음 오아시스에 닿았고, 삯은 약속보다 많았어요.', en: 'You found the way by the stars. The caravan reached the next oasis safely, and the pay was more than promised.' } },
          lose: { effects: { wealth: -6, health: -5 }, result: { ko: '모래바람에 길을 잃고 이틀을 헤맸어요. 낙타 한 마리를 잃고 돌아왔어요.', en: 'A sandstorm lost you the track for two days. You came back one camel short.' } } } },
      { text: { ko: '낙타만 빌려준다', en: 'Hire out the camels only' }, effects: { wealth: 5 },
        result: { ko: '낙타들은 한 달 뒤 홀쭉해진 혹을 하고 돌아왔어요. 삯은 제대로 받았어요.', en: 'The camels came back a month later with shrunken humps. The fee was paid in full.' } },
    ] },
];
