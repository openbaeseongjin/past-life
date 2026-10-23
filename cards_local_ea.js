// 땅·자리 고유 카드 묶음 (시뮬 2.0 설계 4.2): 동아시아 (중국·한반도·일본). 작업 7 EA
// 묶음: 동아시아 마을(village) · 동아시아 거리(street) · 동아시아 큰 집(estate, 귀족 쪽 + 하인 쪽)
// 모든 카드는 when.zones ['eastasia'] + setting + 해(minYear·maxYear) + 땅(areas)으로 묶는다. 출처는 CONTENT-SOURCES-local-ea.md
// 그 땅·시대의 낱말을 바로 쓰므로 말 바꿈 자리({crop} …)는 쓰지 않는다 (tokens 표시 없음)
// 고통스러운 제도(전족·노비·부역·집단 농장)는 그 자리에 선 사람의 눈으로 담담하게 쓴다
const EA = ['eastasia'];
const V = (areas, minYear, maxYear, more = {}) => ({ zones: EA, setting: 'village', areas, minYear, maxYear, ...more });
const S = (areas, minYear, maxYear, more = {}) => ({ zones: EA, setting: 'street', areas, minYear, maxYear, ...more });
const E = (areas, minYear, maxYear, more = {}) => ({ zones: EA, setting: 'estate', areas, minYear, maxYear, ...more });

export const LOCAL_CARDS_EA = [
  // ══ 동아시아 마을 ══════════════════════════════════════════════
  // ── 중국 ──
  // 신석기 북중국: 기장을 땅 구덩이에 갈무리 (츠산 저장 구덩이)
  { id: 'loc.ea.village.millet_pit', stage: ['child', 'teen'], when: V(['china'], -7000, -1500),
    title: { ko: '기장 구덩이', en: 'The millet pit' },
    text: { ko: '거둔 기장을 땅에 판 구덩이에 붓고 겨울을 나요. 구덩이 벽에 바를 진흙을 이겨 오라는 심부름이 떨어졌어요.', en: 'The harvested millet goes into pits dug in the ground to last the winter. You have been sent to knead clay for plastering the pit walls.' },
    choices: [
      { text: { ko: '꼼꼼히 바른다', en: 'Plaster it carefully' }, skill: 'craft', effects: { family: 3, skill: 3 },
        result: { ko: '틈 하나 없이 발랐어요. 봄에 구덩이를 열자 기장이 보송보송했어요.', en: 'Not a crack anywhere. When the pit was opened in spring, the millet was bone dry.' } },
      { text: { ko: '대충 바르고 논다', en: 'Slap it on and run off' },
        chance: { p: 0.5,
          win: { effects: { happy: 4 }, result: { ko: '아무도 몰랐어요. 쥐들도 몰랐던 모양이에요.', en: 'Nobody noticed. Apparently neither did the mice.' } },
          lose: { effects: { family: -4, wealth: -3 }, result: { ko: '봄에 열어 보니 쥐가 먼저 다녀갔어요. 어른들 눈길이 따가웠어요.', en: 'In spring, the mice had been there first. The grown-ups’ looks stung.' } } } },
    ] },
  // 고대 중국: 집집이 한 사람씩 한 달 부역 (성벽·둑). 돈으로 사람을 사서 보내기도 했다
  { id: 'loc.ea.village.corvee', stage: ['adult', 'middle'], when: V(['china'], -700, 599),
    title: { ko: '부역 차례', en: 'Your turn for corvée' },
    text: { ko: '현에서 사람이 와서 올해 부역 차례래요. 북쪽 성벽을 쌓는 데 집집이 한 사람씩 한 달을 내야 한대요.', en: 'A man from the county office says it is your household’s turn for labor service. Each family must send one person for a month to build the northern walls.' },
    choices: [
      { text: { ko: '직접 간다', en: 'Go yourself' },
        chance: { p: 0.75,
          win: { effects: { health: -3, charm: 2 }, result: { ko: '흙을 다지며 한 달을 보냈어요. 같은 줄에 선 사람들과 사투리를 바꿔 배웠어요.', en: 'You spent the month tamping earth. You traded dialect words with the men in your line.' } },
          lose: { effects: { health: -12 }, result: { ko: '돌아오는 길에 앓아누웠어요. 성벽은 높아졌고 당신은 야위었어요.', en: 'You fell ill on the way home. The wall got taller; you got thinner.' } } } },
      { text: { ko: '돈 주고 대신 보낸다', en: 'Pay someone to go instead' }, effects: { wealth: -10 },
        result: { ko: '이웃 마을 젊은이가 대신 갔어요. 품삯이 아까웠지만 허리는 멀쩡했어요.', en: 'A young man from the next village went in your place. You begrudged the fee, but your back was spared.' } },
      { text: { ko: '산으로 숨는다', en: 'Hide in the hills' },
        chance: { p: 0.4,
          win: { effects: { happy: 3 }, result: { ko: '관리는 다른 집부터 들렀어요. 그해는 그렇게 넘어갔어요.', en: 'The officer went to other houses first. That year passed you by.' } },
          lose: { effects: { wealth: -8, family: -4 }, result: { ko: '마을 어른이 당신 이름을 댔어요. 벌금에 이웃들 눈총까지 받았어요.', en: 'The village elder gave your name. You paid a fine, and the neighbors’ glares besides.' } } } },
    ] },
  // 주: 「옛 법도」로 전하는 정전(井田) — 여덟 집이 가운데 공전을 함께 갈아 바치고, 그 뒤에야 제 밭을 간다 (맹자가 전한 이상, 상앙 변법 무렵 사라짐)
  { id: 'loc.ea.village.well_field', stage: ['adult', 'middle'], when: V(['china'], -1046, -350),
    title: { ko: '가운데 밭 먼저', en: 'The middle field first' },
    text: { ko: '옛 법도대로 여덟 집이 가운데 밭을 함께 갈아 영주께 바쳐요. 그 밭이 끝나야 제 밭에 손을 댈 수 있어요. 비가 머지않았어요.', en: 'By the old custom, eight households plow the middle field together for the lord. Only when it is done may anyone touch their own. Rain is not far off.' },
    choices: [
      { text: { ko: '가운데 밭부터 간다', en: 'Plow the middle field first' }, skill: 'farm', effects: { family: 4, wealth: -2 },
        result: { ko: '가운데 밭이 먼저 끝났어요. 제 밭 이랑은 빗속에서 마저 탔어요.', en: 'The middle field was finished first. You cut your own furrows in the rain.' } },
      { text: { ko: '새벽에 몰래 제 밭부터', en: 'Sneak out to your own at dawn' },
        chance: { p: 0.5,
          win: { effects: { wealth: 5 }, result: { ko: '이슬 젖은 새벽에 제 밭을 다 갈았어요. 아무도 몰랐어요.', en: 'You plowed your own plot in the dewy dawn. No one knew.' } },
          lose: { effects: { family: -5, wealth: -2 }, result: { ko: '마을 어른에게 들켰어요. 벌로 가운데 밭 거름을 혼자 날랐어요.', en: 'A village elder caught you. As punishment, you hauled manure for the middle field alone.' } } } },
    ] },
  // 중세~근대 남중국 벼농사: 발로 밟는 용골차(사각 날개 사슬 펌프)로 논에 물을 퍼 올린다
  { id: 'loc.ea.village.pump', stage: ['teen', 'adult', 'middle'], when: V(['china'], 600, 1949),
    title: { ko: '용골차 밟기', en: 'Treading the dragon’s spine' },
    text: { ko: '가뭄에 논물이 말라 가요. 용골차를 밤새 밟아 개울물을 퍼 올려야 해요. 나무 날개가 용의 등뼈처럼 돌아가요.', en: 'Drought is drying out the paddies. Someone must tread the chain pump all night to lift creek water into the fields. Its wooden paddles turn like a dragon’s spine.' },
    choices: [
      { text: { ko: '밤새 밟는다', en: 'Tread all night' }, skill: 'farm', effects: { health: -5, wealth: 6 },
        result: { ko: '새벽에 논에 물이 찰랑였어요. 종아리는 사흘 동안 말을 안 들었어요.', en: 'By dawn the paddy was brimming. Your calves refused to obey you for three days.' } },
      { text: { ko: '이웃과 번갈아 밟는다', en: 'Take turns with the neighbors' }, effects: { family: 5, wealth: 3, charm: 2 },
        result: { ko: '노래를 부르며 번갈아 밟았어요. 물도 오르고 정도 올랐어요.', en: 'You took turns, singing as you went. The water rose, and so did the goodwill.' } },
    ] },
  // 과거 (수 605 ~ 청 1905 폐지). 문중이 돈을 모아 영리한 아이 하나를 공부시키기도 했다. 시험은 남자만 볼 수 있었다
  { id: 'loc.ea.village.exam', stage: 'teen', when: V(['china'], 605, 1904, { sex: 'm' }),
    title: { ko: '과거를 볼 아이', en: 'The clan’s scholar' },
    text: { ko: '문중이 돈을 모아 글공부할 아이를 하나 뽑았는데, 그게 당신이에요. 현에서 치르는 첫 시험이 다가와요.', en: 'The clan pooled its money to put one boy to his books, and that boy is you. The first county examination is coming.' },
    choices: [
      { text: { ko: '한 해 더 외운다', en: 'Memorize for another year' }, skill: 'letters', effects: { know: 6, happy: -3 },
        result: { ko: '경전을 거꾸로도 외우게 됐어요. 꿈에서도 글자가 줄을 섰어요.', en: 'You could recite the classics backward. Even in dreams, the characters stood in rows.' } },
      { text: { ko: '시험장에 들어간다', en: 'Sit the examination' }, when: { minKnow: 25 }, skill: 'letters',
        chance: { p: 0.35,
          win: { effects: { status: 1, know: 5, happy: 8 }, result: { ko: '방에 당신 이름이 붙었어요. 문중 어른들이 사당에 고하러 갔어요.', en: 'Your name went up on the posted list. The clan elders went to tell the ancestors.' } },
          lose: { effects: { happy: -6, know: 3 }, result: { ko: '이름은 없었어요. 다음 시험을 기다리라는 말만 들었어요.', en: 'Your name was not there. All you heard was: wait for the next one.' } } } },
      { text: { ko: '귀동냥으로 덤빈다', en: 'Try your luck anyway' },
        chance: { p: 0.08,
          win: { effects: { status: 1, happy: 10 }, result: { ko: '어찌 된 일인지 붙었어요. 문중 어른들이 서로 얼굴만 쳐다봤어요.', en: 'Somehow, you passed. The clan elders just stared at one another.' } },
          lose: { effects: { happy: -4 }, result: { ko: '답안지 절반이 비었어요. 그래도 시험장 구경은 잘했어요.', en: 'Half your answer sheet was blank. You did get a good look at the exam hall.' } } } },
    ] },
  // 전족 (송 무렵 상류층에서 시작 ~ 1912 금지, 시골에서는 1930년대까지). 딸의 발을 천으로 싸매 작게 만드는 풍습
  //   시골 농가 딸까지 퍼진 것은 명 무렵 뒤라 마을 판은 1450년부터 (검토 Minor 4)
  { id: 'loc.ea.village.footbinding', stage: 'child', ill: true, when: V(['china'], 1450, 1930, { sex: 'f' }),
    title: { ko: '발을 싸매는 날', en: 'The day of the bindings' },
    text: { ko: '어머니가 긴 천을 꺼냈어요. 발이 작아야 좋은 집에 시집간다며 당신 발을 싸매기 시작해요.', en: 'Your mother has brought out the long strips of cloth. Small feet will mean a good marriage, she says, and she begins to bind yours.' },
    choices: [
      { text: { ko: '이를 악물고 견딘다', en: 'Grit your teeth and bear it' }, effects: { health: -8, family: 4 },
        result: { ko: '밤마다 발이 욱신거렸어요. 어머니도 등을 돌리고 울었어요.', en: 'Your feet throbbed every night. Your mother cried too, with her back turned.' } },
      { text: { ko: '밤에 몰래 천을 늦춘다', en: 'Loosen the cloth at night' },
        chance: { p: 0.5,
          win: { effects: { health: -2, happy: 3 }, result: { ko: '어머니는 알면서도 모른 척했어요. 발은 조금 덜 작게 자랐어요.', en: 'Your mother knew and pretended not to. Your feet grew a little less small.' } },
          lose: { effects: { health: -5, family: -3 }, result: { ko: '들켜서 천이 더 단단히 감겼어요. 그 뒤로는 천을 건드리지 않았어요.', en: 'You were caught and bound tighter. After that you left the cloth alone.' } } } },
    ] },
  // 인민공사 (1958~1983): 생산대가 날마다 노동 점수(공분)를 적고, 가을에 점수대로 곡식을 나눈다. 호구에 묶여 도시로 갈 수 없다
  { id: 'loc.ea.village.workpoints', stage: ['adult', 'middle'], when: V(['china'], 1958, 1983),
    title: { ko: '노동 점수', en: 'Work points' },
    text: { ko: '인민공사 생산대가 오늘 일한 점수를 장부에 적어요. 점수가 곧 가을에 받을 곡식이에요. 대장이 당신 이름을 불러요.', en: 'The commune’s production team is entering today’s work points in the ledger. Points mean grain at harvest. The team leader calls your name.' },
    choices: [
      { text: { ko: '온종일 허리를 굽힌다', en: 'Bend your back all day' }, effects: { wealth: 5, health: -4 },
        result: { ko: '점수를 가득 받았어요. 저녁엔 젓가락 들 힘도 없었어요.', en: 'You earned full points. At supper you could barely lift your chopsticks.' } },
      { text: { ko: '적당히 힘을 아낀다', en: 'Pace yourself' }, effects: { health: 2, wealth: 1 },
        result: { ko: '다들 비슷하게 했어요. 장부의 점수도 다들 비슷했어요.', en: 'Everyone worked about the same. So did everyone’s points in the ledger.' } },
      { text: { ko: '도시 공장으로 간다', en: 'Leave for a city factory' }, when: { bound: false }, set: ['moved'], effects: { family: -6, wealth: 6 },
        result: { ko: '도시 호적을 얻어 떠났어요. 마을 사람들은 오래 부러워했어요.', en: 'You got a city registration and left. The village envied you for a long time.' } },
    ] },

  // ── 한반도 ──
  // 청동기: 족장 무덤(고인돌)의 덮개돌을 온 마을이 밧줄과 통나무로 옮긴다
  { id: 'loc.ea.village.dolmen', stage: ['teen', 'adult', 'middle'], when: V(['korea'], -1000, -300),
    title: { ko: '고인돌 돌 끌기', en: 'Hauling the dolmen stone' },
    text: { ko: '족장 무덤에 덮을 큰 돌을 옮긴대요. 온 마을이 밧줄을 잡고, 돌 밑에 통나무를 굴려 넣어요.', en: 'The great capstone for the chief’s tomb is to be moved. The whole village takes hold of the ropes and rolls logs under the stone.' },
    choices: [
      { text: { ko: '앞줄에서 당긴다', en: 'Pull in the front line' },
        chance: { p: 0.7,
          win: { effects: { family: 5, charm: 2 }, result: { ko: '돌이 한 뼘씩 움직일 때마다 함성이 터졌어요.', en: 'Every time the stone moved a hand’s width, a cheer went up.' } },
          lose: { effects: { health: -8 }, result: { ko: '통나무가 미끄러져 발등을 찧었어요. 돌은 결국 제자리에 올라갔어요.', en: 'A log slipped and crushed your foot. The stone reached its place all the same.' } } } },
      { text: { ko: '물과 밥을 나른다', en: 'Carry water and food' }, effects: { family: 3, happy: 3 },
        result: { ko: '밧줄 잡은 사람들이 당신 이름을 불렀어요. 물이 그렇게 반가운 줄 처음 알았대요.', en: 'The rope-pullers called your name. They had never been so glad to see water, they said.' } },
    ] },
  // 조선 서당: 천자문을 떼면 책거리(책씻이)로 떡을 해 와 나눠 먹는다
  { id: 'loc.ea.village.seodang', stage: 'child', when: V(['korea'], 1450, 1910, { sex: 'm' }),   // 조선 서당은 사내아이 몫 (검토 I2)
    title: { ko: '책거리', en: 'Finishing the book' },
    text: { ko: '서당에서 천자문을 다 뗐어요. 어머니가 떡을 쪄 와서 책거리를 한대요. 훈장님이 마지막으로 외워 보래요.', en: 'You have finished the Thousand Character Classic at the village school. Your mother is bringing steamed rice cakes to celebrate. The teacher asks you to recite it one last time.' },
    choices: [
      { text: { ko: '끝까지 외운다', en: 'Recite it to the end' }, skill: 'letters', effects: { know: 5, happy: 4 },
        result: { ko: '「하늘 천 따 지」부터 끝까지 막힘이 없었어요. 떡이 더 달았어요.', en: 'From the first “heaven and earth” to the very last line, without a stumble. The rice cakes tasted sweeter.' } },
      { text: { ko: '떡부터 먹는다', en: 'Eat the rice cakes first' }, effects: { happy: 5, family: 2 },
        result: { ko: '훈장님이 헛기침하는 사이에 떡이 반은 사라졌어요.', en: 'While the teacher was clearing his throat, half the rice cakes vanished.' } },
      { text: { ko: '동생에게 가르쳐 준다', en: 'Teach your little sibling' }, when: { minKnow: 30 }, effects: { charm: 3, family: 4 },
        result: { ko: '동생이 「하늘 천」을 따라 했어요. 당신도 조금 훈장이 된 기분이었어요.', en: 'Your sibling repeated “heaven” after you. You felt a little like a teacher yourself.' } },
    ] },
  // 조선 보릿고개(맥령): 묵은 곡식이 떨어지고 보리가 아직 안 익은 봄. 관아 환곡은 봄에 빌려주고 가을에 이자를 붙여 받는다 (환곡은 1894년까지). 그 뒤는 barley_loan
  { id: 'loc.ea.village.barley_hill', stage: ['adult', 'middle', 'old'], when: V(['korea'], 1392, 1894),
    title: { ko: '보릿고개', en: 'The barley hump' },
    text: { ko: '묵은 곡식은 떨어졌고 보리는 아직 파래요. 관아에서 봄에 곡식을 빌려주고 가을에 이자를 붙여 받는대요.', en: 'Last year’s grain is gone and the barley is still green. The county office lends grain in spring, to be repaid with interest at harvest.' },
    choices: [
      { text: { ko: '관아 곡식을 빌린다', en: 'Borrow from the office' }, effects: { health: 3, wealth: -6 },
        result: { ko: '보리가 익을 때까지 버텼어요. 가을에 갚을 몫이 생각보다 많았어요.', en: 'You held out until the barley ripened. The autumn repayment was more than you expected.' } },
      { text: { ko: '나물과 송기로 버틴다', en: 'Live on greens and pine bark' }, skill: 'farm',
        chance: { p: 0.6,
          win: { effects: { health: -3, wealth: 2 }, result: { ko: '쑥과 소나무 속껍질로 죽을 쑤었어요. 빚 없이 여름을 맞았어요.', en: 'You made gruel from mugwort and inner pine bark. You reached summer owing nothing.' } },
          lose: { effects: { health: -10 }, result: { ko: '얼굴이 붓고 기운이 빠졌어요. 보리 베는 날에야 겨우 일어났어요.', en: 'Your face swelled and your strength drained away. You only got up on the day the barley was cut.' } } } },
      { text: { ko: '이웃과 나눠 먹는다', en: 'Share with the neighbors' }, effects: { family: 6, health: -2, charm: 2 },
        result: { ko: '두 집이 한 솥을 끓였어요. 배는 고팠어도 덜 외로웠어요.', en: 'Two households shared one pot. Still hungry, but less alone.' } },
    ] },
  // 20세기 보릿고개 (1895~1969): 환곡이 사라진 뒤 봄 양식은 장리쌀(봄에 꾸고 가을에 반을 더 얹어 갚는 빚)과 초근목피로 버텼다. 1960년대까지 가장 크게 기억된다 (검토 Minor 3)
  { id: 'loc.ea.village.barley_loan', stage: ['adult', 'middle', 'old'], when: V(['korea'], 1895, 1969),
    title: { ko: '장리쌀', en: 'Rice at half again' },
    text: { ko: '보리는 아직 파랗고 쌀독은 바닥이 보여요. 부잣집에서 장리쌀을 꿔 준대요. 봄에 한 말을 꾸면 가을에 한 말 반을 갚는 셈이에요.', en: 'The barley is still green and you can see the bottom of the rice jar. A rich household will lend rice: borrow one measure in spring, repay one and a half at harvest.' },
    choices: [
      { text: { ko: '장리쌀을 꾼다', en: 'Borrow the rice' }, effects: { health: 3, wealth: -7 },
        result: { ko: '보리 벨 때까지 버텼어요. 가을 타작 마당에서 반 말이 더 나갔어요.', en: 'You held out until the barley was cut. At threshing time, half as much again went out the gate.' } },
      { text: { ko: '쑥과 송기로 버틴다', en: 'Live on mugwort and pine bark' }, skill: 'farm',
        chance: { p: 0.6,
          win: { effects: { health: -3, wealth: 2 }, result: { ko: '쑥버무리와 송기떡으로 봄을 났어요. 빚 없이 여름을 맞았어요.', en: 'You got through spring on mugwort cakes and pine-bark rice cakes, and reached summer owing nothing.' } },
          lose: { effects: { health: -10 }, result: { ko: '얼굴이 누렇게 부었어요. 보리 베는 날에야 겨우 기운을 차렸어요.', en: 'Your face swelled and yellowed. Only on the day the barley was cut did your strength come back.' } } } },
      { text: { ko: '품을 팔러 나간다', en: 'Hire yourself out' },
        chance: { p: 0.5,
          win: { effects: { wealth: 4, family: -2 }, result: { ko: '읍내 공사판에서 품을 팔아 보리쌀 한 자루를 사 왔어요.', en: 'You hired out on a building site in town and came home with a sack of barley.' } },
          lose: { effects: { health: -5, happy: -3 }, result: { ko: '일거리는 없고 발만 부르텄어요. 빈 자루로 돌아왔어요.', en: 'There was no work, only blisters. You came home with an empty sack.' } } } },
    ] },
  // 조선 마마(천연두): 「손님」·「마마」로 높여 불렀다. 종두는 1880년 무렵 들어와 1895년 종두 규칙 뒤 차츰 퍼졌지만 시골까지는 오래 걸렸다
  //   그래서 마을 판은 1910년까지 (그 뒤로도 1950년대까지 유행이 있었다: 검토 Minor 12)
  { id: 'loc.ea.village.smallpox', stage: ['baby', 'child'], ill: true, when: V(['korea'], 1400, 1910),
    title: { ko: '손님이 오셨대요', en: 'The guest has come' },
    text: { ko: '열이 오르고 몸에 붉은 점이 돋았어요. 어른들은 마마를 「손님」이라 높여 부르며 잘 모셔 보내야 한대요.', en: 'A fever rises and red spots break out on your skin. The grown-ups call smallpox “the honored guest” and say it must be served politely and sent on its way.' },
    choices: [
      { text: { ko: '누워서 손님을 모신다', en: 'Lie still and host the guest' },
        chance: { p: 0.65,
          win: { effects: { health: 4 }, result: { ko: '열이 내리고 딱지가 앉았어요. 손님은 얽은 자국 몇 개만 남기고 떠났어요.', en: 'The fever broke and scabs formed. The guest left behind only a few pockmarks.' } },
          lose: { effects: { health: -15, charm: -3 }, result: { ko: '손님은 오래 머물렀어요. 살아남았지만 얼굴에 자국이 깊게 남았어요.', en: 'The guest stayed a long time. You survived, but the marks it left ran deep.' } } } },
      { text: { ko: '무당이 손님을 배웅한다', en: 'The shaman sends the guest off' }, effects: { wealth: -4 },
        chance: { p: 0.6,
          win: { effects: { health: 3, happy: 3 }, result: { ko: '징과 장구 소리 속에 손님을 배웅했어요. 사흘 뒤 열이 내렸어요.', en: 'Amid gongs and drums, the guest was seen off. Three days later the fever broke.' } },
          lose: { effects: { health: -12 }, result: { ko: '굿이 끝나도 열은 오래 갔어요. 가까스로 살아남았어요.', en: 'The fever lasted long after the rite. You only just pulled through.' } } } },
    ] },
  // 1970년대 새마을 운동: 마을마다 시멘트를 나눠 주고 초가지붕을 슬레이트·함석으로 바꿨다
  { id: 'loc.ea.village.saemaul', stage: ['adult', 'middle', 'old'], when: V(['korea'], 1970, 1979),
    title: { ko: '지붕을 바꾸는 해', en: 'The year of new roofs' },
    text: { ko: '새마을 사업으로 마을에 시멘트가 들어왔어요. 초가지붕을 걷고 슬레이트를 올리재요. 해마다 이엉 엮을 일이 없어진대요.', en: 'Cement has arrived for the New Village project. Everyone is to strip off the thatch and put up slate. No more weaving new thatch every year, they say.' },
    choices: [
      { text: { ko: '앞장서서 지붕을 바꾼다', en: 'Be the first to re-roof' }, effects: { wealth: -5, happy: 4, charm: 2 },
        result: { ko: '마을에서 제일 먼저 회색 지붕이 올라갔어요. 군청에서 사진도 찍어 갔어요.', en: 'Yours was the first grey roof in the village. Someone from the county office came to take a photo.' } },
      { text: { ko: '초가를 조금 더 둔다', en: 'Keep the thatch a while' }, effects: { wealth: 2, family: -2 },
        result: { ko: '여름엔 초가가 더 시원했어요. 이장님은 볼 때마다 한숨을 쉬었어요.', en: 'Thatch was cooler in summer. The village head sighed every time he passed.' } },
      { text: { ko: '마을 길 넓히기에 나간다', en: 'Join the road-widening crew' }, effects: { family: 5, health: -3 },
        result: { ko: '경운기가 지나갈 만큼 길이 넓어졌어요. 새벽 확성기 노래는 좀 시끄러웠어요.', en: 'The lane got wide enough for a power tiller. The loudspeaker songs at dawn were a bit much.' } },
    ] },

  // ── 일본 ──
  // 야요이: 바다 건너 들어온 논벼 농사. 조몬 때부터의 도토리 채집과 함께
  { id: 'loc.ea.village.yayoi_rice', stage: ['teen', 'adult', 'middle'], when: V(['japan'], -900, 250),
    title: { ko: '물을 댄 논', en: 'A flooded field' },
    text: { ko: '바다 건너온 사람들이 논에 물을 대 벼를 키우는 법을 알려 줬어요. 할머니는 아직도 도토리 줍는 게 낫대요.', en: 'People from across the sea have shown the village how to flood a field and grow rice. Grandmother still says gathering acorns is better.' },
    choices: [
      { text: { ko: '논을 일군다', en: 'Break ground for a paddy' }, skill: 'farm', effects: { wealth: 5, health: -3 },
        result: { ko: '처음 거둔 쌀은 한 줌이었어요. 다들 그 한 줌을 오래 들여다봤어요.', en: 'The first rice harvest filled one cupped hand. Everyone stared at it a long time.' } },
      { text: { ko: '할머니와 도토리를 줍는다', en: 'Gather acorns with Grandmother' }, effects: { family: 5, happy: 2 },
        result: { ko: '도토리 떫은맛을 물에 우려내는 법을 배웠어요. 할머니는 의기양양했어요.', en: 'You learned to soak the bitterness out of acorns. Grandmother was triumphant.' } },
    ] },
  // 가마쿠라·무로마치: 장원 영주(도읍의 귀족·절)와 무사 관리인 지토가 저마다 연공을 받아 갔다
  { id: 'loc.ea.village.shoen', stage: ['adult', 'middle'], when: V(['japan'], 1185, 1467),
    title: { ko: '두 주인의 연공', en: 'Rent for two masters' },
    text: { ko: '장원의 도읍 주인에게 연공을 바치는데, 새로 온 무사 관리인 지토도 제 몫을 내래요. 쌀은 한 섬인데 손은 둘이에요.', en: 'Your rice rent goes to the estate’s lord in the capital, but the new warrior steward wants his share too. One bale of rice, two outstretched hands.' },
    choices: [
      { text: { ko: '둘 다 바친다', en: 'Pay them both' }, effects: { wealth: -8, family: 2 },
        result: { ko: '곳간이 텅 비었어요. 그래도 칼 찬 사람과 다툴 일은 없었어요.', en: 'The storehouse was emptied. At least there was no quarrel with men who carried swords.' } },
      { text: { ko: '마을이 함께 호소한다', en: 'Petition as a village' },
        chance: { p: 0.45,
          win: { effects: { wealth: 4, family: 4 }, result: { ko: '도읍 주인이 지토를 나무라는 문서를 보냈대요. 그해는 숨을 돌렸어요.', en: 'The lord in the capital sent a letter rebuking the steward. That year you could breathe.' } },
          lose: { effects: { wealth: -5, happy: -3 }, result: { ko: '호소문은 길을 잃었어요. 지토의 눈길만 차가워졌어요.', en: 'The petition got lost along the way. The steward only looked at you more coldly.' } } } },
    ] },
  // 에도: 다섯 집 묶음(고닌구미)이 세금·죄를 함께 책임졌다
  { id: 'loc.ea.village.goningumi', stage: ['adult', 'middle', 'old'], when: V(['japan'], 1640, 1867),
    title: { ko: '다섯 집 묶음', en: 'The five-household group' },
    text: { ko: '옆집이 올해 연공을 다 못 냈어요. 다섯 집이 한 묶음이라 모자란 몫은 나머지 집이 메워야 한대요.', en: 'The house next door could not pay its full rice tax this year. The five households answer as one, so the rest must make up the shortfall.' },
    choices: [
      { text: { ko: '모자란 몫을 나눠 낸다', en: 'Share the shortfall' }, effects: { wealth: -6, family: 6, charm: 2 },
        result: { ko: '쌀을 몇 되씩 모아 냈어요. 이듬해 모내기 날, 옆집이 제일 먼저 와 줬어요.', en: 'Each house gave a few measures of rice. Next planting day, the neighbors were the first to show up.' } },
      { text: { ko: '촌장에게 따진다', en: 'Complain to the headman' }, effects: { wealth: -2, family: -5 },
        result: { ko: '촌장은 「다섯 집은 다섯 손가락」이라고만 했어요. 결국 내긴 냈어요.', en: 'The headman only said, “Five houses, five fingers.” You paid in the end anyway.' } },
    ] },

  // ══ 동아시아 거리 ══════════════════════════════════════════════
  // 상·주 청동기 공방: 여러 조각의 흙 거푸집에 녹인 청동을 붓는다
  { id: 'loc.ea.street.bronze', stage: ['teen', 'adult', 'middle'], when: S(['china'], -1600, -221),
    title: { ko: '거푸집에 붓는 청동', en: 'Pouring the bronze' },
    text: { ko: '흙 거푸집 여러 조각을 맞춰 묶고 녹인 청동을 부을 차례예요. 제사에 쓸 솥이라 금 하나 가도 안 된대요.', en: 'The clay mold pieces are fitted and bound, and it is time to pour the molten bronze. It is a vessel for the ancestral rites, so not a single crack is allowed.' },
    choices: [
      { text: { ko: '단숨에 붓는다', en: 'Pour in one go' }, skill: 'craft',
        chance: { p: 0.6,
          win: { effects: { wealth: 6, skill: 3 }, result: { ko: '식혀서 흙을 깨자 무늬가 또렷했어요. 공방 우두머리가 고개를 끄덕였어요.', en: 'When it cooled and the clay was broken away, the patterns were crisp. The workshop master nodded.' } },
          lose: { effects: { wealth: -5, happy: -3 }, result: { ko: '한쪽에 기포가 생겼어요. 그 솥은 다시 녹이는 도가니로 갔어요.', en: 'Bubbles formed on one side. That vessel went back into the melting pot.' } } } },
      { text: { ko: '거푸집을 한 번 더 데운다', en: 'Warm the mold once more' }, effects: { skill: 2, wealth: 2 },
        result: { ko: '시간은 더 걸렸지만 실패는 없었어요. 느린 사람이 오래 남는 공방이었어요.', en: 'It took longer, but nothing failed. In that workshop, the slow ones lasted.' } },
    ] },
  // 한의 소금·쇠 전매 (기원전 117 ~ 신나라 끝 23년; 후한 초부터 군현에 맡겨 느슨해졌고 88년에 정식으로 풀었다): 관영 철 작업장이 농기구를 만들었고,
  //   비싸고 무디다는 원성이 있었다 (염철론). 「나라가 도맡은」 때만 받는다 (검토 Minor 1)
  { id: 'loc.ea.street.iron_office', stage: ['teen', 'adult', 'middle'], when: S(['china'], -117, 23),
    title: { ko: '나라의 쇠', en: 'The state’s iron' },
    text: { ko: '나라가 소금과 쇠를 도맡은 뒤로 대장간 불도 관청 허락을 받아야 해요. 관영 철 작업장에서 사람을 뽑는대요.', en: 'Since the state took over salt and iron, even a smithy’s fire needs official leave. The government ironworks is taking on hands.' },
    choices: [
      { text: { ko: '관영 작업장에 들어간다', en: 'Join the state ironworks' }, skill: 'craft', effects: { wealth: 4, happy: -2, skill: 2 },
        result: { ko: '쇳물 다루는 솜씨는 늘었어요. 만든 보습이 비싸고 무디다는 원성도 함께 들었어요.', en: 'You got better at handling molten iron. You also heard farmers grumble that the state plowshares were dear and dull.' } },
      { text: { ko: '몰래 호미를 벼려 판다', en: 'Forge hoes on the sly' },
        chance: { p: 0.45,
          win: { effects: { wealth: 7 }, result: { ko: '이웃 농부들이 몰래 사 갔어요. 당신 호미가 더 잘 든대요.', en: 'Neighboring farmers bought them on the quiet. Your hoes cut better, they said.' } },
          lose: { effects: { wealth: -8, happy: -4 }, result: { ko: '관리에게 들켜 풀무를 빼앗겼어요.', en: 'An official caught you and took away your bellows.' } } } },
    ] },
  // 당 장안 서시: 소그드 등 서쪽 상인(호상)의 가게·술집이 모였고 서쪽 향료·물건이 들어왔다. 장사를 정하는 일이라 어른 단계만 (검토 Minor 8)
  { id: 'loc.ea.street.west_market', stage: ['adult', 'middle'], when: S(['china'], 618, 907),
    title: { ko: '서시의 먼 나라 상인', en: 'The Western Market traders' },
    text: { ko: '서시 장터에 서쪽 먼 나라 상인이 향료 자루를 풀었어요. 비단과 바꾸재요. 냄새만으로도 머리가 핑 돌아요.', en: 'At the Western Market, a trader from the far west has opened his sacks of spices. He wants silk in exchange. The smell alone makes your head spin.' },
    choices: [
      { text: { ko: '비단과 바꾼다', en: 'Trade silk for spice' }, skill: 'trade',
        chance: { p: 0.5,
          win: { effects: { wealth: 8, charm: 2 }, result: { ko: '향료는 부잣집에 세 배 값에 팔렸어요. 상인과 다음 철에 또 보기로 했어요.', en: 'The spices sold to rich households at triple the price. You and the trader agreed to meet again next season.' } },
          lose: { effects: { wealth: -6 }, result: { ko: '자루 바닥에는 톱밥이 반이었어요. 상인은 이미 낙타와 떠났어요.', en: 'The bottom half of the sack was sawdust. The trader had already left with his camels.' } } } },
      { text: { ko: '그의 술집에서 이야기만 듣는다', en: 'Just listen to him at his tavern' }, dream: 'travel', effects: { happy: 4, wealth: -1 },
        result: { ko: '모래바다와 눈 덮인 고개 이야기를 밤새 들었어요. 낯선 술맛이 오래 남았어요.', en: 'All night you heard of seas of sand and snowbound passes. The strange taste of the wine lingered.' } },
    ] },
  // 송 교자(1024 관청 발행)부터 원·명 초 지폐까지: 무거운 동전 대신 종이 돈. 값이 떨어지기도 했다
  { id: 'loc.ea.street.paper_money', stage: ['adult', 'middle'], when: S(['china'], 1024, 1450),
    title: { ko: '종이 돈', en: 'Paper money' },
    text: { ko: '손님이 무거운 동전 꾸러미 대신 관청 도장이 찍힌 종이 돈을 내밀어요. 값은 같대요. 정말 같을까요?', en: 'Instead of heavy strings of coins, a customer holds out paper money stamped with the government seal. Same value, he says. Is it really?' },
    choices: [
      { text: { ko: '종이 돈을 받는다', en: 'Take the paper' }, skill: 'trade',
        chance: { p: 0.6,
          win: { effects: { wealth: 6, happy: 2 }, result: { ko: '종이 몇 장이 주머니에 쏙 들어갔어요. 짐꾼 삯이 굳었어요.', en: 'A few sheets slipped right into your purse. You saved on porters.' } },
          lose: { effects: { wealth: -6 }, result: { ko: '해가 바뀌자 종이 돈 값이 떨어졌어요. 그 손님 얼굴이 자꾸 떠올랐어요.', en: 'By the new year the paper had lost value. That customer’s face kept coming back to you.' } } } },
      { text: { ko: '동전만 받는다', en: 'Coins only' }, effects: { wealth: 2, charm: -2 },
        result: { ko: '손님은 투덜대며 동전을 세어 줬어요. 무거웠지만 든든했어요.', en: 'The customer grumbled and counted out coins. Heavy, but reassuring.' } },
    ] },
  // 고려 소(所): 나라에 바칠 자기·종이·쇠 같은 물건을 만들던 마을. 주민은 다른 고을로 옮길 수 없고 부담이 무거웠다
  { id: 'loc.ea.street.so_celadon', stage: ['teen', 'adult', 'middle'], when: S(['korea'], 950, 1350, { tags: ['craft'] }),   // 소(所) 장인 집만 (검토 I3)
    title: { ko: '소 마을의 청자', en: 'Celadon for the court' },
    text: { ko: '우리 마을은 나라에 청자를 바치는 「소」라서 다른 고을로 옮겨 살 수 없대요. 올해 바칠 몫이 또 늘었어요.', en: 'Your village is a “so,” a district bound to make celadon for the state, and its people may not move away. This year’s quota has gone up again.' },
    choices: [
      { text: { ko: '비색을 내려고 애쓴다', en: 'Chase the perfect jade-green' }, skill: 'craft',
        chance: { p: 0.5,
          win: { effects: { skill: 3, happy: 5 }, result: { ko: '잔 하나가 비 갠 하늘빛으로 나왔어요. 도읍으로 실려 갔어요. 이름은 따라가지 않았어요.', en: 'One cup came out the color of the sky after rain. It was shipped to the capital. Your name did not go with it.' } },
          lose: { effects: { wealth: -4, happy: -2 }, result: { ko: '빛깔이 탁했어요. 깨뜨려서 가마 뒤에 묻었어요.', en: 'The color was muddy. You broke it and buried the shards behind the kiln.' } } } },
      { text: { ko: '정해진 몫만 맞춘다', en: 'Just meet the quota' }, effects: { wealth: 3, health: 2 },
        result: { ko: '몫은 채웠어요. 관리는 숫자만 세고 갔어요.', en: 'You met the quota. The official counted the pieces and left.' } },
    ] },
  // 가마쿠라~전국 일본의 자(座): 절·신사의 보호를 받고 공물을 바치는 대신 장사 독점권을 가진 동업 조직 (오야마자키 기름 자)
  { id: 'loc.ea.street.za_guild', stage: ['adult', 'middle'], when: S(['japan'], 1200, 1570),
    title: { ko: '기름 장수의 자', en: 'The oil sellers’ za' },
    text: { ko: '이 고을에서 등잔 기름을 팔려면 신사의 보호를 받는 「자」에 들어야 한대요. 들어가면 해마다 공물을 바쳐야 해요.', en: 'To sell lamp oil in this town, you must join the za, a guild under a shrine’s protection. Members owe it tribute every year.' },
    choices: [
      { text: { ko: '자에 든다', en: 'Join the za' }, effects: { wealth: 4, family: 2 },
        result: { ko: '공물은 아까웠어요. 대신 아무도 당신 좌판을 걷어차지 않았어요.', en: 'The tribute stung. In return, nobody kicked over your stall.' } },
      { text: { ko: '골목에서 몰래 판다', en: 'Sell on the quiet' }, skill: 'trade',
        chance: { p: 0.45,
          win: { effects: { wealth: 7 }, result: { ko: '골목 끝에서 몰래 팔았어요. 값은 쌌고 손님은 많았어요.', en: 'You sold from the end of an alley. Your price was low and your customers many.' } },
          lose: { effects: { wealth: -6, happy: -3 }, result: { ko: '자 사람들이 기름통을 엎었어요. 골목에 기름 냄새가 오래 남았어요.', en: 'The guildsmen tipped over your oil jars. The alley smelled of oil for a long time.' } } } },
    ] },
  // 조선 후기 옹기장이: 산비탈 긴 가마에 장독을 쟁여 며칠 밤낮 굽는다 (유약 옹기는 17세기 무렵부터)
  { id: 'loc.ea.street.onggi', stage: ['teen', 'adult', 'middle'], when: S(['korea'], 1600, 1950, { tags: ['craft'] }),   // 옹기 굽는 장인 집만 (검토 I3)
    title: { ko: '옹기 가마', en: 'The onggi kiln' },
    text: { ko: '산비탈 긴 가마에 장독 수십 개를 쟁였어요. 며칠 밤낮 불을 지켜야 해요. 불 조절을 누가 맡을지 정해야 해요.', en: 'Dozens of soy crocks are stacked in the long kiln on the hillside. The fire must be tended for days and nights. Someone has to take charge of the flame.' },
    choices: [
      { text: { ko: '불을 맡는다', en: 'Take charge of the fire' }, skill: 'craft',
        chance: { p: 0.55,
          win: { effects: { wealth: 8, skill: 3 }, result: { ko: '두드리면 맑은 소리가 나는 독이 나왔어요. 장날 첫 손님이 두 개를 사 갔어요.', en: 'The crocks came out ringing clear when tapped. The first customer on market day bought two.' } },
          lose: { effects: { wealth: -6, health: -3 }, result: { ko: '불이 너무 셌어요. 독 여러 개가 주저앉았어요.', en: 'The fire ran too hot. Several crocks slumped.' } } } },
      { text: { ko: '땔감을 나른다', en: 'Haul firewood' }, effects: { health: -2, family: 4, skill: 1 },
        result: { ko: '밤새 장작을 날랐어요. 가마 앞에서 다 같이 밤을 구워 먹었어요.', en: 'You hauled wood all night, then roasted chestnuts with the others at the kiln mouth.' } },
    ] },
  // 에도 데라코야: 서민 아이들이 읽기·쓰기·주판을 배우던 글방 (1872 학제 전)
  { id: 'loc.ea.street.terakoya', stage: 'child', when: S(['japan'], 1650, 1872),
    title: { ko: '데라코야의 아침', en: 'Morning at the terakoya' },
    text: { ko: '데라코야 선생님이 오늘은 주판을 가르친대요. 옆자리 아이는 벌써 붓을 거꾸로 들고 놀아요.', en: 'The terakoya teacher is doing the abacus today. The child next to you is already playing with a brush held upside down.' },
    choices: [
      { text: { ko: '주판알을 튕긴다', en: 'Flick the abacus beads' }, skill: 'trade', effects: { know: 3, skill: 2 },
        result: { ko: '셈이 빨라졌어요. 가게 어른들이 거스름돈 셈을 맡기기 시작했어요.', en: 'Your sums got quick. The shopkeepers started trusting you with the change.' } },
      { text: { ko: '글씨 연습을 한다', en: 'Practice calligraphy' }, skill: 'letters', effects: { know: 5 },
        result: { ko: '같은 글자를 백 번 썼어요. 백 번째 글자는 조금 예뻤어요.', en: 'You wrote the same character a hundred times. The hundredth was a little pretty.' } },
      { text: { ko: '옆자리와 장난친다', en: 'Fool around with your neighbor' }, effects: { happy: 5, know: -2 },
        bond: { kind: 'friend', who: { ko: '데라코야 짝꿍', en: 'your terakoya deskmate' } },
        result: { ko: '둘 다 벌을 섰어요. 벌을 서면서도 킥킥댔어요.', en: 'You both had to stand in punishment. You giggled the whole time.' } },
    ] },
  // 조약항 (1843 상하이 개항 ~): 서양 상사와 중국 상인 사이를 잇는 매판, 피진 영어
  { id: 'loc.ea.street.treaty_port', stage: ['teen', 'adult'], when: S(['china'], 1843, 1943),
    title: { ko: '양행의 일자리', en: 'A job at the foreign firm' },
    text: { ko: '항구 조계의 서양 상사가 통역 겸 심부름꾼을 구한대요. 서양 말 몇 마디면 품삯이 두 배래요.', en: 'A Western trading house in the port concession wants an interpreter and errand runner. A few words of the foreigners’ tongue, they say, and the pay doubles.' },
    choices: [
      { text: { ko: '귀동냥 말로 덤빈다', en: 'Wing it in pidgin' }, skill: 'trade',
        chance: { p: 0.5,
          win: { effects: { wealth: 6, charm: 2 }, result: { ko: '「캔 두」와 「찹찹」으로 하루를 버텼어요. 품삯은 진짜였어요.', en: 'You got through the day on “can do” and “chop chop.” The wages were real.' } },
          lose: { effects: { happy: -4 }, result: { ko: '말이 엇갈려 짐이 엉뚱한 배에 실렸어요. 그날로 쫓겨났어요.', en: 'A mix-up sent the cargo onto the wrong ship. You were let go that day.' } } } },
      { text: { ko: '밤마다 말을 배운다', en: 'Study the language at night' }, skill: 'letters', effects: { know: 4, wealth: 3, health: -2 },
        result: { ko: '등잔 밑에서 낯선 글자를 외웠어요. 매판 어른이 당신을 다시 봤어요.', en: 'You memorized the strange letters by lamplight. The comprador took a second look at you.' } },
      { text: { ko: '동향 회관에 남는다', en: 'Stay with the old guild' }, effects: { family: 4, wealth: 2 },
        result: { ko: '회관의 차는 여전히 쌌어요. 바깥세상은 빨리 변했어요.', en: 'Tea at the guild hall was as cheap as ever. The world outside changed fast.' } },
    ] },
  // 개혁 개방 뒤 개체호(1980년대~): 일곱 명까지만 고용할 수 있다는 규정과 「여덟 명이면 자본가」라는 말
  { id: 'loc.ea.street.getihu', stage: ['adult', 'middle'], when: S(['china'], 1980, 1997),
    title: { ko: '여덟 번째 일손', en: 'The eighth hire' },
    text: { ko: '개체호로 연 국숫집이 잘돼요. 일손을 더 들이고 싶은데, 여덟 명부터는 「자본가」라는 말이 돌아요.', en: 'The noodle shop you opened as a getihu, a household business, is doing well. You want more help, but word is that from the eighth hire on, you count as a “capitalist.”' },
    choices: [
      { text: { ko: '일곱 명까지만 둔다', en: 'Stop at seven' }, effects: { wealth: 4, happy: 2 },
        result: { ko: '일곱 명이 여덟 명 몫을 했어요. 다들 조금씩 더 바빴어요.', en: 'Seven people did the work of eight. Everyone was a little busier.' } },
      { text: { ko: '여덟 번째를 들인다', en: 'Hire the eighth' }, skill: 'trade',
        chance: { p: 0.6,
          win: { effects: { wealth: 10 }, result: { ko: '아무 일도 없었어요. 시절이 정말 바뀐 모양이었어요.', en: 'Nothing happened. The times really had changed, it seemed.' } },
          lose: { effects: { wealth: -6, happy: -4 }, result: { ko: '구청 사람이 와서 장부를 오래 들여다봤어요. 한동안 가게 문을 일찍 닫았어요.', en: 'A district official came and studied your books for a long time. You closed early for a while after that.' } } } },
    ] },
  // 1970년대 끝 ~ 한국 아파트 청약·추첨 분양 (1977~78 청약 규칙)
  { id: 'loc.ea.street.apartment', stage: ['adult', 'middle'], when: S(['korea'], 1978, 2010),
    title: { ko: '아파트 추첨', en: 'The apartment lottery' },
    text: { ko: '새로 짓는 아파트 분양에 청약을 넣었어요. 추첨 날, 강당에 모인 사람들이 숨을 죽여요.', en: 'You have applied for a unit in a new apartment complex. On lottery day, the crowd in the hall holds its breath.' },
    choices: [
      { text: { ko: '번호를 끝까지 듣는다', en: 'Listen to every number' },
        chance: { p: 0.3,
          win: { effects: { wealth: 12, happy: 8 }, result: { ko: '당신 번호가 불렸어요. 이제 전세 걱정 없는 내 집이었어요.', en: 'Your number was called. A home of your own, and no more worrying about the lease.' } },
          lose: { effects: { happy: -4 }, result: { ko: '옆 사람이 환호했어요. 당신은 다음 분양 공고를 오려 두었어요.', en: 'The person beside you cheered. You clipped the next sales notice from the paper.' } } } },
      { text: { ko: '전세로 더 버틴다', en: 'Stay on a lease a while longer' }, effects: { wealth: 3, family: -2 },
        result: { ko: '이삿짐을 또 쌌어요. 짐 싸는 솜씨만 늘었어요.', en: 'You packed up to move yet again. Only your packing got better.' } },
    ] },

  // ══ 동아시아 큰 집 (귀족 쪽 · 하인 쪽) ═══════════════════════════
  // 서주~춘추: 신분에 따라 늘어놓는 솥(정)의 수가 정해져 있었다 (대부 다섯, 제후 일곱). 넘치게 늘어놓는 일이 늘었다
  { id: 'loc.ea.estate.ding', stage: ['adult', 'middle', 'old'], when: E(['china'], -950, -256, { tags: ['elite'] }),
    title: { ko: '솥은 다섯 개까지', en: 'Five cauldrons, no more' },
    text: { ko: '제사 날이에요. 집안 서열대로라면 청동 솥을 다섯 개만 늘어놓아야 하는데, 어른들은 일곱 개를 놓고 싶어 해요.', en: 'It is a sacrifice day. By your family’s rank, only five bronze cauldrons may be set out, but the elders would like seven.' },
    choices: [
      { text: { ko: '법도대로 다섯 개', en: 'Five, by the rules' }, effects: { family: 3, happy: -2 },
        result: { ko: '제사는 조용히 끝났어요. 이웃 집안의 솥이 몇 개였는지는 다들 세어 봤어요.', en: 'The rites passed quietly. Everyone did count the neighboring clan’s cauldrons, though.' } },
      { text: { ko: '슬쩍 일곱 개', en: 'Quietly set out seven' },
        chance: { p: 0.5,
          win: { effects: { happy: 5, charm: 2 }, result: { ko: '손님들이 감탄했어요. 아무도 따지지 않았어요. 세상이 그렇게 바뀌어 가고 있었어요.', en: 'The guests were impressed. Nobody objected. That was the way the world was going.' } },
          lose: { effects: { family: -5, happy: -3 }, result: { ko: '종가에서 사람을 보내 꾸짖었어요. 솥 두 개는 한동안 창고에서 나오지 못했어요.', en: 'The senior house sent a man to scold you. Two cauldrons stayed in the storeroom for a long while.' } } } },
    ] },
  // 한: 귀족 집 연회의 옻칠 잔에는 「술을 드시라」·「음식을 드시라」 같은 글이 적혀 있었다 (마왕퇴). 하인 쪽
  { id: 'loc.ea.estate.lacquer_cup', stage: ['child', 'teen', 'adult'], when: E(['china'], -206, 220, { tags: ['serve'] }),
    title: { ko: '칠 잔의 글씨', en: 'Words on the lacquer cups' },
    text: { ko: '주인댁 잔치에 쓸 옻칠 잔을 닦아요. 잔마다 붉은 글씨가 있는데, 「술을 드시라」는 뜻이래요.', en: 'You are polishing lacquer cups for the master’s banquet. Each one bears painted characters which, you are told, mean “Please drink.”' },
    choices: [
      { text: { ko: '정성껏 닦기만 한다', en: 'Just polish them well' }, effects: { family: 3, wealth: 2 },
        result: { ko: '잔이 거울처럼 빛났어요. 집사가 처음으로 당신 이름을 불렀어요.', en: 'The cups shone like mirrors. The steward called you by name for the first time.' } },
      { text: { ko: '글씨대로 한 모금', en: 'Do as the cup says' }, when: { minAge: 13 },
        chance: { p: 0.55,
          win: { effects: { happy: 6 }, result: { ko: '「드시라」고 쓰여 있으니 마셨어요. 아무도 못 봤어요.', en: 'It said “please drink,” so you did. Nobody saw.' } },
          lose: { effects: { family: -5, health: -3 }, result: { ko: '집사에게 들켰어요. 글씨는 당신한테 한 말이 아니었대요.', en: 'The steward caught you. The cup, it turned out, had not been talking to you.' } } } },
    ] },
  // 후한 끝~남북조: 난리를 피한 농민이 호족 장원의 예속민(객·전객)이 되었다. 진은 법으로 그 수를 줄이려 했다. 하인 쪽
  { id: 'loc.ea.estate.dependents', stage: ['teen', 'adult', 'middle'], when: E(['china'], 184, 589, { tags: ['serve'] }),
    title: { ko: '호족의 장원', en: 'The great clan’s manor' },
    text: { ko: '난리를 피해 호족 장원에 몸을 맡긴 지 몇 해예요. 밭을 갈아 주인 몫을 바치고, 도적이 오면 창을 들어요.', en: 'Years ago your family fled the fighting and put itself under a great clan’s manor. You till its fields, hand over the master’s share, and take up a spear when bandits come.' },
    choices: [
      { text: { ko: '장원 담 안에 남는다', en: 'Stay within the walls' }, effects: { health: 3, happy: -3 },
        result: { ko: '담 안은 배고파도 안전했어요. 주인 얼굴은 설에나 한 번 봤어요.', en: 'Inside the walls you were hungry but safe. You saw the master’s face about once a year, at New Year.' } },
      { text: { ko: '창 쓰는 법을 익힌다', en: 'Learn the spear' }, skill: 'fight', effects: { health: -3, skill: 2, family: 2 },
        result: { ko: '도적 떼를 두 번 막아 냈어요. 주인이 술 한 동이를 내렸어요.', en: 'You helped beat off bandits twice. The master sent down a jar of wine.' } },
      { text: { ko: '나라 호적에 다시 오른다', en: 'Re-register with the state' },
        chance: { p: 0.35,
          win: { effects: { status: 1, wealth: -4 }, result: { ko: '현의 호적에 이름을 올렸어요. 세금은 무거워도 내 밭이었어요.', en: 'Your name went onto the county register. The taxes were heavy, but the field was yours.' } },
          lose: { effects: { family: -5 }, result: { ko: '장원에서 문서를 내주지 않았어요. 담은 생각보다 높았어요.', en: 'The manor would not release your papers. The walls were higher than you thought.' } } } },
    ] },
  // 위진남북조 구품중정제: 중정관이 집안과 평판으로 아홉 품을 매겼고, 「상품에 한미한 집안 없다」는 말이 돌았다. 청담이 유행했다
  { id: 'loc.ea.estate.nine_rank', stage: ['teen', 'adult'], when: E(['china'], 220, 589, { tags: ['elite'], sex: 'm' }),
    title: { ko: '아홉 품의 평가', en: 'Graded in nine ranks' },
    text: { ko: '중정관이 고을 젊은이들에게 아홉 등급 품을 매긴대요. 이름난 집안이라 높은 품은 거의 정해졌다는 말이 돌아요.', en: 'The commandery arbiter is grading the young men into nine ranks. Your family is so eminent, people say, that a high grade is all but settled.' },
    choices: [
      { text: { ko: '이름값에 기댄다', en: 'Lean on the family name' }, effects: { wealth: 4, happy: 2 },
        result: { ko: '높은 품이 나왔어요. 아무도 놀라지 않았고, 아무것도 시험하지 않았어요.', en: 'A high grade came through. No one was surprised, and no one tested anything.' } },
      { text: { ko: '청담 모임에서 이름을 낸다', en: 'Shine at the salons' }, effects: { charm: 3, know: 2 },
        result: { ko: '노장 이야기로 밤을 새웠어요. 말 잘하는 사람으로 소문이 났어요.', en: 'You talked Laozi and Zhuangzi through the night. Word spread that you were a fine talker.' } },
      { text: { ko: '가난한 벗을 천거한다', en: 'Recommend a poor friend' },
        chance: { p: 0.3,
          win: { effects: { charm: 3, happy: 5 }, result: { ko: '벗이 뜻밖에 중간 품을 받았어요. 집안 어른들은 혀를 찼어요.', en: 'Your friend unexpectedly got a middle grade. The family elders clicked their tongues.' } },
          lose: { effects: { family: -3 }, result: { ko: '「한미한 집안」이라며 낮은 품이 나왔어요. 벗은 웃어넘겼어요.', en: '“A humble family,” they said, and gave a low grade. Your friend laughed it off.' } } } },
    ] },
  // 당·송: 높은 관리의 아들은 과거 없이 낮은 벼슬을 받을 수 있었다 (음보·은음). 과거 급제자를 더 알아주는 바람. 벼슬을 받는 일이라 어른 단계만 (검토 Minor 8)
  { id: 'loc.ea.estate.yin', stage: ['adult'], when: E(['china'], 618, 1367, { tags: ['elite'], sex: 'm' }),
    title: { ko: '아버지 덕의 벼슬', en: 'A post by father’s grace' },
    text: { ko: '아버지 벼슬 덕에 시험 없이 작은 관직을 받을 수 있대요. 그래도 사람들은 과거 급제를 더 알아준대요.', en: 'Thanks to your father’s rank, you can receive a minor post without sitting the exams. Still, people think more of those who passed.' },
    choices: [
      { text: { ko: '그냥 받는다', en: 'Just accept it' }, effects: { wealth: 5, happy: -2 },
        result: { ko: '벼슬은 받았어요. 잔치 자리에서 「몇 등으로 붙었소?」라는 질문만 피했어요.', en: 'You got the post. At banquets you just dodged the question, “And where did you place?”' } },
      { text: { ko: '과거를 보겠다고 한다', en: 'Insist on the exams' }, skill: 'letters',
        chance: { p: 0.3,
          win: { effects: { know: 5, happy: 8, charm: 2 }, result: { ko: '급제자 명단에 이름이 올랐어요. 아버지가 처음으로 당신 앞에서 웃었어요.', en: 'Your name made the list. For the first time, your father smiled in front of you.' } },
          lose: { effects: { happy: -6, know: 3 }, result: { ko: '떨어졌어요. 결국 아버지 덕의 벼슬을 받았고, 아무도 놀라지 않았어요.', en: 'You failed. In the end you took the post by your father’s grace, and no one was surprised.' } } } },
    ] },
  // 명·청 회피제: 관리는 고향 성에서 일할 수 없다. 사투리를 모르는 수령은 그 고을 향신에게 기댔다
  { id: 'loc.ea.estate.avoidance', stage: ['adult', 'middle'], when: E(['china'], 1368, 1904, { tags: ['elite'] }),
    title: { ko: '고향만 빼고', en: 'Anywhere but home' },
    text: { ko: '집안에 벼슬자리가 났는데 법에 따라 고향 성에서는 일할 수 없대요. 발령지는 말도 안 통하는 먼 고을이에요.', en: 'An official post has come to the family, but by law no one may serve in his home province. The posting is a far-off county where you cannot even follow the dialect.' },
    choices: [
      { text: { ko: '식구를 다 데려간다', en: 'Take the whole household' }, effects: { family: 5, wealth: -6 },
        result: { ko: '짐수레가 열 대였어요. 아이들은 금세 그 고을 사투리를 배웠어요.', en: 'It took ten carts. The children picked up the local dialect in no time.' } },
      { text: { ko: '고향 집을 지킨다', en: 'Stay to keep the home' }, effects: { wealth: 4, family: -6 },
        result: { ko: '편지만 오갔어요. 고향 마당의 달은 그 고을 달과 같았대요.', en: 'Only letters went back and forth. The moon over home, the letters said, was the same moon out there.' } },
      { text: { ko: '향신들 말을 귀담아듣는다', en: 'Heed the local gentry' }, effects: { charm: 3, wealth: 3, happy: -2 },
        result: { ko: '고을 일은 향신들이 다 알았어요. 도장 찍는 자리부터 먼저 익혔어요.', en: 'The local gentry knew everything about the county. First of all, you learned where to put the seal.' } },
    ] },
  // 신라 골품제: 육두품은 아찬(17관등의 여섯째)까지만 오를 수 있었다. 당나라 유학이 길이 되기도 했다
  //   땅 갈래가 한반도 전체라 신라가 한반도를 아우른 668년부터, 글의 「당나라 배」에 맞춰 당이 망한 907년까지 (검토 Minor 2)
  { id: 'loc.ea.estate.headrank', stage: ['teen', 'adult'], when: E(['korea'], 668, 907, { tags: ['elite'] }),
    title: { ko: '육두품의 천장', en: 'The head-rank ceiling' },
    text: { ko: '집안이 육두품이라 아무리 공부해도 아찬 위로는 못 오른대요. 당나라로 공부하러 가는 배가 곧 떠나요.', en: 'Your family is of head-rank six, so however hard you study, you can rise no higher than the sixth grade. A ship carrying students to Tang leaves soon.' },
    choices: [
      { text: { ko: '당나라 배에 오른다', en: 'Board the ship for Tang' }, risk: 'sea', fulfill: 'travel',
        chance: { p: 0.6,
          win: { effects: { know: 8, happy: 5 }, result: { ko: '장안의 글방에서 이름을 알렸어요. 돌아와서도 벼슬은 아찬까지였지만요.', en: 'You made a name in the academies of Chang’an. Back home, your rank still stopped at the sixth grade.' } },
          lose: { effects: { health: -8, know: 3 }, result: { ko: '거친 바다를 건너고 반년을 앓았어요. 배운 것은 남았어요.', en: 'After the rough crossing you were ill for half a year. What you learned stayed with you.' } } } },
      { text: { ko: '고향에서 글을 가르친다', en: 'Teach at home' }, effects: { charm: 3, family: 4 },
        result: { ko: '제자들이 늘었어요. 진골 집 아이들도 몰래 배우러 왔어요.', en: 'Your students grew in number. Even true-bone children slipped in to learn.' } },
      { text: { ko: '절에 들어간다', en: 'Enter a temple' }, effects: { happy: 5, wealth: -3 },
        result: { ko: '산문 안에서는 골품을 묻지 않았어요. 적어도 겉으로는요.', en: 'Inside the temple gate, no one asked about bone rank. Not openly, at least.' } },
    ] },
  // 조선 전기 분재기: 어버이 삼년상 뒤 남매가 모여 재산 나눔 문서(화회문기)를 썼다. 경국대전은 아들딸 고루 나누고 제사 받드는 몫을 더 얹게 했다.
  //   17세기 후반부터 맏아들 몫이 커지고 딸 몫이 줄었다. 한반도 귀족 쪽 936~1700 빈자리를 채운다 (검토 Minor 11)
  { id: 'loc.ea.estate.inheritance', stage: ['adult', 'middle'], when: E(['korea'], 1450, 1680, { tags: ['elite'] }),
    title: { ko: '남매의 분재기', en: 'Dividing the estate' },
    text: { ko: '어버이 삼년상을 마치고 남매가 모여 재산 나눌 문서를 써요. 논밭은 아들딸 고루 나누는 게 법도래요. 제사 몫은 따로 떼어요.', en: 'Mourning over, the siblings gather to write up the division of the estate. By law, sons and daughters share the fields equally, with a portion set aside for the rites.' },
    choices: [
      { text: { ko: '법도대로 고루 나눈다', en: 'Divide it equally, by law' }, effects: { family: 4, wealth: 2 },
        result: { ko: '논 한 뙈기까지 셈해 고루 나눴어요. 시집간 딸들도 제 몫 문서를 받아 갔어요.', en: 'Down to the last paddy, it was split evenly. Even the married daughters went home with their shares in writing.' } },
      { text: { ko: '제사 몫을 더 얹자고 한다', en: 'Ask more for the rites' },
        chance: { p: 0.5,
          win: { effects: { wealth: 5, family: -2 }, result: { ko: '제사 모실 몫이라며 논 한 자리를 더 받았어요. 다들 고개는 끄덕였어요.', en: 'For the sake of the rites, one more field came your way. Everyone nodded, more or less.' } },
          lose: { effects: { family: -5 }, result: { ko: '「법도대로」라는 말이 세 번 나왔어요. 몫은 그대로였고 술상만 식었어요.', en: '“By the law” came up three times. The shares stayed as they were; only the wine went cold.' } } } },
      { text: { ko: '문서를 직접 쓴다', en: 'Write the document yourself' }, when: { minKnow: 25 }, effects: { know: 2, charm: 2 },
        result: { ko: '붓을 들어 한 자 한 자 적었어요. 남매가 돌아가며 이름 밑에 수결을 두었어요.', en: 'You took up the brush and wrote it out stroke by stroke. One by one, the siblings signed beneath their names.' } },
    ] },
  // 조선 노비 속량: 곡식이나 베를 바치고 노비 문서에서 이름을 빼던 일 (세습 노비제 폐지 1886 전). 하인 쪽
  { id: 'loc.ea.estate.nobi_freedom', stage: ['adult', 'middle', 'old'], when: E(['korea'], 1500, 1885, { tags: ['serve'], bound: true }),
    title: { ko: '속량', en: 'Buying freedom' },
    text: { ko: '흉년이라 주인댁에 곡식이 급하대요. 곡식을 바치면 노비 문서에서 이름을 빼 주겠대요.', en: 'It is a bad year and the master’s house is short of grain. Hand over grain, they say, and your name will come off the slave register.' },
    choices: [
      { text: { ko: '모아 둔 곡식을 바친다', en: 'Hand over your saved grain' }, effects: { wealth: -10 },
        chance: { p: 0.6,
          win: { effects: { status: 1, happy: 10 }, result: { ko: '문서에서 이름이 지워졌어요. 처음으로 온전히 내 것인 하루를 살았어요.', en: 'Your name was struck from the register. For the first time, you lived a day that was wholly your own.' } },
          lose: { effects: { happy: -6 }, result: { ko: '곡식은 받았는데 문서는 「나중에」래요. 나중은 오지 않았어요.', en: 'They took the grain, but the paper would come “later.” Later never came.' } } } },
      { text: { ko: '식구 몫으로 남긴다', en: 'Keep it for the family' }, effects: { family: 5, wealth: 2 },
        result: { ko: '곡식 자루를 숨겨 두었어요. 식구들 배는 덜 곯았어요.', en: 'You hid the sack away. The family went hungry less often.' } },
    ] },
  // 조선 후기 몰락 양반: 여러 대 벼슬이 끊겨도 양반의 체면을 지키려 했다
  { id: 'loc.ea.estate.fallen_yangban', stage: ['adult', 'middle', 'old'], when: E(['korea'], 1700, 1894, { tags: ['elite'] }),
    title: { ko: '가난한 양반', en: 'A threadbare yangban' },
    text: { ko: '벼슬이 끊긴 지 삼대째라 쌀독이 비었어요. 그래도 양반은 손에 흙을 묻히면 안 된다는 말이 집안에 돌아요.', en: 'Three generations without an office, and the rice jar is empty. Still, the family holds that a yangban must never dirty a hand with soil.' },
    choices: [
      { text: { ko: '체면을 지킨다', en: 'Keep up appearances' }, effects: { wealth: -5, happy: -3 },
        result: { ko: '굶어도 갓은 반듯했어요. 이웃들은 존경 반 걱정 반으로 봤어요.', en: 'Hungry or not, the household’s hats sat straight. The neighbors looked on with half respect, half worry.' } },
      { text: { ko: '몰래 짚신을 삼아 판다', en: 'Make straw sandals on the quiet' }, skill: 'craft', effects: { wealth: 6, happy: 2 },
        result: { ko: '밤마다 짚신을 삼았어요. 장터 사람들은 누가 삼았는지 모르는 척해 줬어요.', en: 'You plaited straw sandals every night. At the market, people kindly pretended not to know who made them.' } },
      { text: { ko: '글 가르치고 쌀을 받는다', en: 'Teach letters for rice' }, when: { minKnow: 25 }, effects: { wealth: 4, charm: 3 },
        result: { ko: '마을 서당 훈장 자리를 얻었어요. 쌀자루는 작아도 체면은 컸어요.', en: 'You became the village schoolmaster. A small sack of rice, a large measure of dignity.' } },
    ] },
  // 가마쿠라~전국: 무사 집의 하인은 싸움터까지 짐을 지고 따라갔다. 하인 쪽
  { id: 'loc.ea.estate.genin', stage: ['teen', 'adult'], when: E(['japan'], 1185, 1590, { tags: ['serve'] }),
    title: { ko: '주인의 갑옷 궤짝', en: 'The master’s armor chest' },
    text: { ko: '주인 무사가 싸움터로 떠나요. 갑옷 궤짝과 쌀자루를 지고 따라갈 하인이 필요하대요.', en: 'Your master, a warrior, is leaving for battle. He needs a servant to carry the armor chest and the rice sacks.' },
    choices: [
      { text: { ko: '짐을 지고 따라간다', en: 'Shoulder the load and follow' }, risk: 'war',
        chance: { p: 0.6,
          win: { effects: { wealth: 5, family: 3 }, result: { ko: '주인이 공을 세웠어요. 짐꾼에게도 삼베 한 필이 내려왔어요.', en: 'Your master won honors. Even the porter got a bolt of hemp cloth.' } },
          lose: { effects: { health: -12 }, result: { ko: '진흙길에서 발을 다쳤어요. 갑옷 궤짝은 무사했어요.', en: 'You hurt your foot on the muddy road. The armor chest was fine.' } } } },
      { text: { ko: '집 지키기를 자청한다', en: 'Offer to guard the house' }, effects: { family: 4, happy: -2 },
        result: { ko: '빈집을 지키며 마님 잔소리를 들었어요. 싸움터보다는 나았어요.', en: 'You minded the empty house and the mistress’s scolding. Better than a battlefield.' } },
    ] },
  // 에도 무사: 쌀로 받는 녹봉이 모자라 쌀 중개상(후다사시)에게 다음 녹미를 담보로 빌렸다. 가난한 무사 집은 우산 붙이기 같은 부업을 했다
  { id: 'loc.ea.estate.stipend', stage: ['adult', 'middle'], when: E(['japan'], 1650, 1867, { tags: ['elite'] }),
    title: { ko: '내년 녹미를 미리', en: 'Next year’s rice, today' },
    text: { ko: '녹봉으로 받는 쌀이 해마다 모자라요. 쌀 중개상이 내년 녹미를 담보로 돈을 빌려주겠대요.', en: 'The rice stipend falls short every year. The rice broker offers a loan against next year’s stipend.' },
    choices: [
      { text: { ko: '빌려 쓴다', en: 'Borrow' }, effects: { wealth: 8, happy: -2 },
        result: { ko: '올해는 체면을 지켰어요. 내년 쌀은 벌써 남의 것이었어요.', en: 'You kept up appearances this year. Next year’s rice already belonged to someone else.' } },
      { text: { ko: '부업으로 우산을 붙인다', en: 'Paste umbrellas on the side' }, skill: 'craft', effects: { wealth: 5, happy: -1 },
        result: { ko: '온 식구가 기름종이를 발랐어요. 옆집 무사 집도 뭔가를 붙이고 있었어요.', en: 'The whole household brushed oil paper. The samurai house next door was gluing something too.' } },
      { text: { ko: '살림을 줄인다', en: 'Cut back' }, effects: { wealth: 3, family: -3 },
        result: { ko: '하인을 하나 줄이고 반찬을 하나 줄였어요. 칼은 줄이지 않았어요.', en: 'One servant fewer, one side dish fewer. The swords stayed.' } },
    ] },
  // ── 큰 집 보강 (검토 Minor 11): 중국 하인 쪽 589년 뒤, 일본 귀족 쪽 1185~1650, 일본 하인 쪽 1590~1867 ──
  // 당 현경 2년(657) 칙: 노비·부곡·객녀를 양인으로 풀 때는 가장이 손수 쓰고 맏아들 아래가 이어 서명한 뒤 관에 신고했다. 하인 쪽
  { id: 'loc.ea.estate.fangliang', stage: ['adult', 'middle', 'old'], when: E(['china'], 657, 907, { tags: ['serve'], bound: true }),
    title: { ko: '손수 쓴 문서', en: 'A letter in his own hand' },
    text: { ko: '늙은 주인이 병석에서 몇 사람을 양인으로 풀어 주겠대요. 주인이 손수 쓰고 아들들이 이름을 잇대어 적어야 한대요.', en: 'The old master, sick in bed, means to free a few of you into commoner status. He must write it in his own hand, and his sons must sign beneath.' },
    choices: [
      { text: { ko: '곁에서 먹을 갈아 드린다', en: 'Grind his ink at the bedside' },
        chance: { p: 0.5,
          win: { effects: { status: 1, happy: 10 }, result: { ko: '문서 끝에 당신 이름도 있었어요. 관아에 신고하던 날, 걸음이 이상하게 가벼웠어요.', en: 'Your name was on the paper too. The day it was filed at the county office, your steps felt strangely light.' } },
          lose: { effects: { happy: -6 }, result: { ko: '맏아들이 붓을 들지 않았어요. 문서는 서랍에 들어갔고, 서랍은 잠겼어요.', en: 'The eldest son never picked up the brush. The paper went into a drawer, and the drawer was locked.' } } } },
      { text: { ko: '젊은 사람에게 양보한다', en: 'Let a younger one go first' }, effects: { family: 4, happy: -2 },
        result: { ko: '당신 몫을 부엌 아이에게 넘겼어요. 아이는 대문을 나서며 세 번 돌아봤어요.', en: 'You gave your place to the kitchen girl. Three times she looked back on her way out the gate.' } },
    ] },
  // 송: 1062년 가우칙이 고용된 남녀 하인을 「인력」·「여사」라 불렀다. 고용은 햇수와 품삯을 적은 문서로 했고, 기한이 차면 주종 관계가 끝났다. 하인 쪽
  { id: 'loc.ea.estate.hired_term', stage: ['adult', 'middle'], when: E(['china'], 1062, 1279, { tags: ['serve'] }),
    title: { ko: '햇수를 적는 문서', en: 'Years on paper' },
    text: { ko: '새 주인댁과 고용 문서를 써요. 몇 해 일하고 품삯은 얼마인지 적고, 기한이 차면 서로 남남이래요.', en: 'You are drawing up a hiring contract with a new household: how many years, and for what wage. When the term is up, you owe each other nothing.' },
    choices: [
      { text: { ko: '짧게 세 해만', en: 'Just three years' }, effects: { wealth: 3, happy: 2 },
        result: { ko: '세 해는 금방 갔어요. 문서를 돌려받던 날 주인댁 개가 따라 나왔어요.', en: 'Three years went fast. The day you got the contract back, the household dog followed you out.' } },
      { text: { ko: '길게 쓰고 품삯을 올린다', en: 'Sign longer for more pay' }, effects: { wealth: 7, happy: -3 },
        result: { ko: '품삯은 넉넉했어요. 남은 해를 손가락으로 세는 버릇이 생겼어요.', en: 'The wages were good. You got into the habit of counting the remaining years on your fingers.' } },
      { text: { ko: '품삯을 덜 받고 글을 배운다', en: 'Take less pay, learn to read' }, effects: { wealth: -3, know: 3 },
        result: { ko: '주인댁 글방 귀퉁이에서 귀동냥을 했어요. 장부 정도는 읽게 됐어요.', en: 'From a corner of the household schoolroom you picked up what you could. Soon you could read a ledger.' } },
    ] },
  // 명·청: 팔려 온 하인은 집안이 몸값을 치르고 되사 나갈 수 있었다(속신). 1910년 칙과 새 형률로 사람 매매가 금지되었다. 하인 쪽
  { id: 'loc.ea.estate.redeem', stage: ['teen', 'adult'], when: E(['china'], 1644, 1909, { tags: ['serve'] }),
    title: { ko: '몸값', en: 'Buying you back' },
    text: { ko: '바깥 식구들이 몸값을 모아 당신을 되사 가겠대요. 주인댁에선 여기선 굶지는 않는데 왜 나가냐고 해요.', en: 'Your family outside has saved enough to buy you back. The household asks why you would leave a place where at least nobody goes hungry.' },
    choices: [
      { text: { ko: '식구들 곁으로 간다', en: 'Go home to your family' },
        chance: { p: 0.6,
          win: { effects: { status: 1, happy: 8, wealth: -4 }, result: { ko: '돌려받은 문서를 아궁이에 넣었어요. 집 밥은 묽었지만 내 밥이었어요.', en: 'You got the paper back and fed it to the stove. The food at home was thin, but it was yours.' } },
          lose: { effects: { happy: -5, family: 3 }, result: { ko: '주인댁이 값을 올렸어요. 식구들은 한 해만 더 모으겠다고 했어요.', en: 'The household raised the price. Your family said they would save for one more year.' } } } },
      { text: { ko: '남겠다고 한다', en: 'Say you will stay' }, effects: { wealth: 4, family: -4 },
        result: { ko: '식구들은 말없이 돈 꾸러미를 도로 싸 갔어요. 그날 밤 부엌이 유난히 조용했어요.', en: 'Without a word, your family wrapped the money up again. The kitchen was unusually quiet that night.' } },
    ] },
  // 가마쿠라: 지토와 장원 영주가 연공을 두고 다투면 지토우케(해마다 정한 연공을 바치는 청부)나 시타지추분(땅을 둘로 나눔)으로 화해했다. 귀족 쪽
  { id: 'loc.ea.estate.shitaji', stage: ['adult', 'middle'], when: E(['japan'], 1221, 1333, { tags: ['elite'] }),
    title: { ko: '땅을 반으로', en: 'Split down the middle' },
    text: { ko: '집안이 지토로 있는 장원에서 도읍의 영주 쪽과 또 연공 다툼이 났어요. 막부 재판까지 가면 몇 해가 걸린대요.', en: 'On the estate where your family is the warrior steward, another rice-tax quarrel has flared with the proprietor in the capital. A shogunate lawsuit could take years.' },
    choices: [
      { text: { ko: '해마다 정한 만큼만 바친다', en: 'Pay a fixed sum each year' }, effects: { wealth: 3, family: 2 },
        result: { ko: '정한 연공만 바치고 장원 일은 집안이 도맡았어요. 흉년엔 그 정한 만큼이 무거웠어요.', en: 'You paid the agreed amount and ran the estate yourselves. In lean years, that agreed amount weighed heavily.' } },
      { text: { ko: '땅을 반으로 나누자고 한다', en: 'Propose splitting the land' }, effects: { wealth: 5, happy: 2 },
        result: { ko: '장원 그림 한가운데 붉은 선이 그어졌어요. 선 이쪽은 온전히 집안 땅이었어요.', en: 'A red line was drawn down the middle of the estate map. Everything on your side of it belonged wholly to the family.' } },
      { text: { ko: '가마쿠라에 소송을 건다', en: 'Take it to court in Kamakura' },
        chance: { p: 0.4,
          win: { effects: { wealth: 8, happy: 4 }, result: { ko: '판결문이 왔어요. 길고 어려운 글 끝에 「지토 쪽이 옳다」가 있었어요.', en: 'The ruling arrived. At the end of a long, difficult text: “The steward is in the right.”' } },
          lose: { effects: { wealth: -6, happy: -4 }, result: { ko: '세 해 동안 가마쿠라를 오갔어요. 판결은 영주 쪽이었고, 여비 장부만 두꺼워졌어요.', en: 'Three years of trips to Kamakura. The ruling went to the proprietor; only the travel ledger got thicker.' } } } },
    ] },
  // 무로마치~전국: 국인 영주들은 이웃끼리 잇키 계약을 맺거나 큰 다이묘에 붙었다. 맹세문(기쇼몬)은 신사 부적(우오호인) 뒷면에 썼고, 동맹에 인질이 따르기도 했다. 귀족 쪽
  { id: 'loc.ea.estate.kishomon', stage: ['adult', 'middle'], when: E(['japan'], 1467, 1590, { tags: ['elite'] }),
    title: { ko: '부적 뒷면의 맹세', en: 'An oath on a talisman' },
    text: { ko: '이웃 큰 다이묘가 손을 내밀어요. 맹세문을 신사 부적 뒷면에 써서 보내고, 집안 아이 하나를 인질로 보내래요.', en: 'A powerful neighboring warlord offers an alliance. Write your oath on the back of a shrine talisman, he says, and send one of the family’s children as a hostage.' },
    choices: [
      { text: { ko: '이웃 영주들과 맹세를 맺는다', en: 'Swear a league with local lords' }, effects: { family: 3, wealth: -2 },
        result: { ko: '여러 집안 이름을 둥글게 돌려 적었어요. 누가 맨 위인지 아무도 몰랐어요.', en: 'Every house signed in a ring, so no name sat on top. Nobody could say who was in charge.' } },
      { text: { ko: '맹세하고 인질을 보낸다', en: 'Swear, and send a hostage' }, effects: { wealth: 5, family: -6 },
        result: { ko: '집안 아이가 큰 성으로 떠났어요. 편지에는 글씨가 날마다 는다고 적혀 있었어요.', en: 'A child of the house left for the great castle. The letters said the child’s handwriting improved every day.' } },
      { text: { ko: '아무 편도 들지 않는다', en: 'Side with no one' },
        chance: { p: 0.35,
          win: { effects: { happy: 5, wealth: 2 }, result: { ko: '양쪽 다 당신 집안을 잊어버렸어요. 그게 가장 큰 복이었어요.', en: 'Both sides forgot your family existed. That was the greatest blessing of all.' } },
          lose: { effects: { wealth: -8, family: -3 }, result: { ko: '이듬해 양쪽 군세가 번갈아 당신 땅을 지나갔어요.', en: 'The next year, both armies took turns marching across your land.' } } } },
    ] },
  // 16세기 말 무사와 농민이 갈리고(병농분리), 1615년 일국일성령으로 영지마다 성 하나만 남겼다. 가신은 성 아래 마을로 옮겨 녹을 받았고, 땅에 남은 집은 마을 우두머리가 되기도 했다. 귀족 쪽
  { id: 'loc.ea.estate.castle_town', stage: ['adult', 'middle'], when: E(['japan'], 1590, 1650, { tags: ['elite'] }),
    title: { ko: '성은 하나만', en: 'One castle per domain' },
    text: { ko: '영지에 성은 하나만 남긴대요. 집안 작은 성은 헐리고, 무사로 남으려면 성 아래 마을로 옮겨 녹을 받으래요.', en: 'Only one castle may stand in the domain. The family’s little fort is coming down, and to stay samurai you must move to the castle town and live on a stipend.' },
    choices: [
      { text: { ko: '성 아래 마을로 옮긴다', en: 'Move to the castle town' }, effects: { wealth: -3, family: 2 },
        result: { ko: '대대로 갈던 논은 남의 손에 넘어갔어요. 대신 녹미 장부에 이름이 올랐어요.', en: 'The paddies your family had worked for generations went to others. In return, your name went on the stipend ledger.' } },
      { text: { ko: '땅에 남아 농사를 짓는다', en: 'Stay on the land and farm' }, skill: 'farm', effects: { status: -1, family: 4, wealth: 3 },
        result: { ko: '칼을 내려놓고 마을 우두머리가 됐어요. 논물 소리가 녹미보다 미더웠어요.', en: 'You laid down the sword and became the village headman. The sound of paddy water felt more reliable than any stipend.' } },
    ] },
  // 1635년 참근교대가 제도가 되었다. 에도의 인숙(구치이레)이 무가 봉공인(주겐 등)을 주선하고 보증을 서 수수료를 받았다. 행렬 인원은 석고에 따라 정해져 사람을 사서 채웠다. 하인 쪽
  { id: 'loc.ea.estate.procession', stage: ['teen', 'adult'], when: E(['japan'], 1635, 1862, { tags: ['serve'], sex: 'm' }),
    title: { ko: '행렬의 창잡이', en: 'A spear in the procession' },
    text: { ko: '인숙 주인이 다이묘 행렬에 설 사람을 구한대요. 창을 메고 걷기만 하면 한 철 품삯을 준대요.', en: 'The hiring broker is looking for men to march in a lord’s procession. Just shoulder a spear and walk, and you earn a season’s wages.' },
    choices: [
      { text: { ko: '창을 메고 따라간다', en: 'Shoulder the spear and go' },
        chance: { p: 0.65,
          win: { effects: { wealth: 6, happy: 2 }, result: { ko: '길가 사람들이 비켜서 고개를 숙였어요. 그 인사가 당신 몫은 아니었어요.', en: 'Along the road people stepped aside and bowed their heads. The bows were not meant for you.' } },
          lose: { effects: { health: -8 }, result: { ko: '고갯길에서 발목을 삐었어요. 행렬은 기다려 주지 않았어요.', en: 'You twisted an ankle on a mountain pass. The procession did not wait.' } } } },
      { text: { ko: '주인댁 일을 계속한다', en: 'Stay on at your household' }, effects: { family: 3, wealth: 2 },
        result: { ko: '익숙한 부엌에 남았어요. 행렬 이야기는 다녀온 사람들한테 들었어요.', en: 'You stayed in the kitchen you knew. You heard about the procession from the ones who went.' } },
    ] },
  // 데가와리: 한 해·반 해 계약 봉공인이 바뀌는 날. 1669년 막부령으로 2월 2일·8월 2일에서 3월 5일·9월 5일로 옮겼다. 하인 쪽
  { id: 'loc.ea.estate.degawari', stage: ['teen', 'adult', 'middle'], when: E(['japan'], 1669, 1867, { tags: ['serve'] }),
    title: { ko: '3월 5일', en: 'Changeover day' },
    text: { ko: '데가와리 날이에요. 봉공 기한이 끝나 이 집에 한 해 더 있을지, 다른 집으로 옮길지 정해야 해요.', en: 'It is changeover day, when servants’ terms run out. Stay with this household another year, or move on to another?' },
    choices: [
      { text: { ko: '한 해 더 있는다', en: 'Stay one more year' }, effects: { family: 3, wealth: 2 },
        result: { ko: '주인댁이 새 옷 한 벌을 얹어 줬어요. 아는 부엌이 제일 편했어요.', en: 'The household threw in a new set of clothes. A kitchen you know is the easiest kind.' } },
      { text: { ko: '품삯 많은 집으로 옮긴다', en: 'Move to a better-paying house' },
        chance: { p: 0.5,
          win: { effects: { wealth: 7, happy: 2 }, result: { ko: '새 집은 품삯도 밥도 넉넉했어요. 옆집 하인들과도 금세 친해졌어요.', en: 'The new house was generous with both wages and rice. You were soon friends with the servants next door.' } },
          lose: { effects: { happy: -5, wealth: 2 }, result: { ko: '품삯은 많은데 마님 잔소리가 품삯보다 많았어요.', en: 'Better wages, but the mistress’s scolding outweighed them.' } } } },
      { text: { ko: '고향 마을로 돌아간다', en: 'Go back to your home village' }, effects: { family: 5, wealth: -3 },
        result: { ko: '모은 돈을 들고 고향에 갔어요. 어머니가 손을 오래 잡고 놓지 않았어요.', en: 'You went home with your savings. Your mother held your hand for a long time and would not let go.' } },
    ] },
  // 에도 큰 가게: 열 살 무렵 심부름꾼(데치·고조)으로 들어와 17~18세에 원복하면 데다이가 되어 품삯과 하오리를 받았다. 그 사이 3~4할이 그만뒀다. 하인 쪽
  { id: 'loc.ea.estate.detchi', stage: ['teen', 'adult'], when: E(['japan'], 1690, 1867, { tags: ['serve'], sex: 'm', maxAge: 25 }),
    title: { ko: '앞머리를 미는 날', en: 'Shaving the forelock' },
    text: { ko: '열 살에 들어온 큰 가게에서 곧 원복을 해요. 그러면 심부름꾼에서 데다이가 되어 품삯을 받는대요.', en: 'You came to this great shop at ten. Soon you come of age, rising from errand boy to clerk, with wages at last.' },
    choices: [
      { text: { ko: '버텨서 데다이가 된다', en: 'Stick it out and make clerk' }, effects: { wealth: 5, skill: 2 },
        result: { ko: '처음 받은 하오리를 입고 가게 앞을 쓸었어요. 비질은 그대로였어요.', en: 'You swept the shopfront in your first haori jacket. The sweeping, at least, had not changed.' } },
      { text: { ko: '고향으로 돌아간다', en: 'Go back home' }, effects: { family: 4, wealth: -2 },
        result: { ko: '같이 들어온 셋 가운데 둘이 먼저 떠났어요. 당신이 셋째였어요.', en: 'Of the three boys who started with you, two had already left. You were the third.' } },
      { text: { ko: '밤마다 주판을 익힌다', en: 'Drill the abacus every night' }, skill: 'trade', effects: { skill: 3, health: -2 },
        result: { ko: '주판알 소리가 꿈에서도 났어요. 번토가 장부 한 권을 맡겼어요.', en: 'You heard abacus beads clicking even in your dreams. The head clerk trusted you with a ledger.' } },
    ] },
];
