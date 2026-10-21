// 땅·자리 고유 카드 묶음 (시뮬 2.0 설계 4.2): 남아시아 (문화권 southasia = india · bengal · indus · himalaya · lanka)
//   마을 (farm) 11 · 큰 집 (elite 앞마당 + serve 뒤뜰) 7 · 거리 (craft · trade · shop · pro · office) 5 · 야영지 (herd · band) 4
// 모든 카드는 when.zones + when.setting 에 시대(eraGroups 나 minYear·maxYear)를 단다. 출생 비율(고대 59% · 중세 26% · 근세 9% …)대로
//   고대·중세 카드를 많이 두고, 근세·근대·현대에도 하나씩은 닿게 한다.
// 시대 갈래 (CONTENT-SOURCES-local-sa.md): 기원전 1200년 무렵 전 씨족·마을 → 부족과 라자 → 기원전 1000년부터 바르나 → 300년부터 바르나와 자티.
//   스리랑카는 가문·신분으로만 쓴다. 고통스러운 제도(불가촉 차별 · 빚에 매인 몸 · 흉년)는 그 자리에 선 사람의 눈으로, 담담하게.
// 자리 글은 tokens.js 규칙대로: 한국어 조사는 {x:을} 꼴, 영어 {feast} 앞에 the 를 쓰지 않는다, a/an 뒤에 자리를 두지 않는다.
//   자리가 있는 카드는 tokens.js 시험의 대표 해(-9000 · 300 · 1200 · 1650 · 1900 · 2000) 가운데 하나에는 나와야 한다
const Z = ['southasia'];

export const LOCAL_CARDS_SA = [
  // ── 남아시아 마을 (farm) ───────────────────────────────────────
  // 첫 머리 깎기(문단·추다카라나): 정수리에 한 줌(시카)을 남긴다. 힌두 풍습이라 인도 평원·히말라야만
  { id: 'loc.sa.village.shave', stage: 'baby', when: { zones: Z, setting: 'village', areas: ['india', 'himalaya'], minYear: -800 },
    title: { ko: '첫 머리 깎는 날', en: 'The first haircut' },
    text: { ko: '날을 받아 처음으로 머리를 깎는대요. 정수리에 한 줌만 남기고 다 민대요. 온 식구가 둘러앉았어요.', en: 'An auspicious day has been chosen for your first haircut. Everything goes except one tuft at the crown, and the whole family has gathered round.' },
    choices: [
      { text: { ko: '꼼짝 않고 앉는다', en: 'Sit perfectly still' }, effects: { family: 5 },
        result: { ko: '칼날이 도는 내내 숨도 안 쉬었어요. 할머니가 장하다며 단것을 쥐여 줬어요.', en: 'You barely breathed while the blade went round. Your grandmother pressed a sweet into your hand for being so brave.' } },
      { text: { ko: '버둥대며 운다', en: 'Wriggle and howl' }, effects: { happy: 3, family: -2 },
        result: { ko: '머리가 삐뚤빼뚤해졌어요. 그 머리로 한 해를 다녔고, 아무도 잊지 않았어요.', en: 'Your head came out lopsided. You wore it that way for a year, and nobody ever forgot.' } },
    ] },
  // 소똥 땔감: 신석기부터 소를 친 땅이면 어느 시대에나
  { id: 'loc.sa.village.dung', stage: 'child', tokens: true, when: { zones: Z, setting: 'village', minYear: -5000 },
    title: { ko: '소똥 땔감', en: 'Dung for the fire' },
    text: { ko: '어머니가 소똥에 짚을 섞어 둥글넓적하게 빚어요. {home} 벽에 척척 붙여 말리면 몇 달 땔감이래요. 이제 당신 차례예요.', en: 'Your mother mixes cow dung with straw and pats it into flat rounds. Slapped onto the wall of the {home} to dry, they will feed the fire for months. Now it is your turn.' },
    choices: [
      { text: { ko: '동그랗게 잘 빚는다', en: 'Make them nice and round' }, effects: { family: 3, skill: 3 },
        result: { ko: '손바닥 자국까지 고르게 찍혔어요. 어머니가 당신 것을 맨 위에 붙였어요.', en: 'Even your handprints came out neat. Your mother stuck yours up at the very top.' } },
      { text: { ko: '동생에게 던진다', en: 'Throw one at your sibling' }, effects: { happy: 6, family: -4 },
        result: { ko: '정확히 맞았어요. 그날 저녁엔 한참을 혼자 씻었어요.', en: 'A direct hit. You spent a long time scrubbing that evening, and nobody helped.' } },
    ] },
  // 탁발: 불교가 퍼진 기원전 5세기부터 인도 불교가 기운 12세기 무렵까지 (스리랑카는 그 뒤로도 이어지지만 한 조건으로 묶는다)
  { id: 'loc.sa.village.alms', stage: 'child', when: { zones: Z, setting: 'village', areas: ['india', 'bengal', 'himalaya', 'lanka'], minYear: -450, maxYear: 1200 },
    title: { ko: '발우를 든 스님', en: 'The monk with the bowl' },
    text: { ko: '아침마다 누런 가사를 입은 스님이 말없이 발우를 들고 문 앞에 서요. 오늘은 어머니가 주걱을 당신에게 맡겼어요.', en: 'Every morning a monk in ochre robes stands silently at the door, holding out his bowl. Today your mother hands the ladle to you.' },
    choices: [
      { text: { ko: '밥을 듬뿍 담는다', en: 'Heap in the rice' }, effects: { happy: 4, luck: 2 },
        result: { ko: '스님이 고개를 살짝 숙였어요. 그날은 왠지 하루 종일 운이 좋을 것 같았어요.', en: 'The monk bowed his head slightly. All day you had a feeling your luck had turned.' } },
      { text: { ko: '반 주걱만 담는다', en: 'Give just half a ladle' }, effects: { family: -2 },
        result: { ko: '어머니가 주걱을 도로 가져갔어요. 스님은 아무 말 없이 기다렸어요.', en: 'Your mother took the ladle back. The monk waited without a word.' } },
      { text: { ko: '스님을 따라가 본다', en: 'Follow the monk' }, effects: { know: 4, family: -3 },
        result: { ko: '절까지 따라가 스님들 외는 소리를 들었어요. 뜻은 몰라도 가락이 귀에 붙었어요.', en: 'You followed him all the way to the monastery and listened to the chanting. You missed the meaning but caught the tune.' } },
    ] },
  // 우물가 차별: 불가촉으로 몰린 집은 마을 우물에 손대지 못했다. 1950년 헌법 17조가 불가촉을 없앴다. 아이의 눈으로, 담담하게
  { id: 'loc.sa.village.well', stage: 'child', when: { zones: Z, setting: 'village', areas: ['india', 'bengal', 'himalaya'], minYear: 300, maxYear: 1949 },
    title: { ko: '우물가에서 기다리는 아이', en: 'The girl waiting at the well' },
    text: { ko: '마을 끝에 사는 아이가 빈 항아리를 들고 우물가에 서 있어요. 그 집 사람은 우물에 손대면 안 된대요. 누가 길어 주길 기다려요.', en: 'A girl from the far edge of the village stands by the well with an empty pot. Her family may not touch the well, they say. She is waiting for someone to draw water for her.' },
    choices: [
      { text: { ko: '물을 길어 준다', en: 'Draw water for her' }, effects: { happy: 4, family: -3, charm: 2 },
        result: { ko: '항아리를 채워 줬어요. 어른들 눈총을 받았지만, 그 아이가 웃는 걸 처음 봤어요.', en: 'You filled her pot. The grown-ups glared, but it was the first time you had ever seen her smile.' } },
      { text: { ko: '못 본 척 지나간다', en: 'Pretend not to see' }, effects: { family: 2, happy: -3 },
        result: { ko: '그냥 지나쳤어요. 저녁 내내 그 빈 항아리가 눈에 밟혔어요.', en: 'You walked on by. All evening you kept seeing that empty pot.' } },
      { text: { ko: '어른에게 까닭을 묻는다', en: 'Ask a grown-up why' }, effects: { know: 3 },
        result: { ko: '원래 그렇다는 대답만 들었어요. 그 대답이 이상하다는 건 한참 뒤에야 알았어요.', en: 'The only answer was that this is how things are. It was years before you saw how strange that answer was.' } },
    ] },
  // 리그베다 시대: 소가 곧 재산이고, 싸움을 뜻하는 옛말(가비슈티)이 「소를 찾아 나서기」다. 부족과 라자의 때라 자리 글 없이
  { id: 'loc.sa.village.raid', stage: 'teen', when: { zones: Z, setting: 'village', areas: ['india', 'indus'], minYear: -1500, maxYear: -600 },
    title: { ko: '소를 찾아서', en: 'In search of cows' },
    text: { ko: '이웃 부족이 밤새 소 떼를 몰아 갔어요. 어른들이 활시위를 매요. 이곳에선 싸움을 「소를 찾아 나서기」라고 불러요.', en: 'A neighboring tribe drove off the herd in the night. The men are stringing their bows. Here, the word for battle means “searching for cows.”' },
    // 잠길 수 있는 선택(when)은 첫째 자리에 두지 않는다 (몇몇 시험이 choose(life, 0)으로 덱을 돈다)
    choices: [
      { text: { ko: '남아서 송아지를 지킨다', en: 'Stay and guard the calves' }, effects: { family: 4 },
        result: { ko: '남은 송아지들 곁에서 밤을 새웠어요. 아무도 안 왔지만, 아무도 안 잤어요.', en: 'You sat up all night with the calves that were left. Nobody came. Nobody slept, either.' } },
      { text: { ko: '따라나선다', en: 'Go with them' }, when: { minAge: 15 }, risk: 'war', skill: 'fight',
        chance: { p: 0.55,
          win: { effects: { wealth: 8, happy: 5 }, result: { ko: '소를 되찾고 덤으로 몇 마리 더 몰고 왔어요. 그날 밤 노래에 당신 이름도 들어갔어요.', en: 'You got the herd back, plus a few extra. That night your name made it into the song.' } },
          lose: { effects: { health: -10 }, result: { ko: '화살이 팔을 스쳤어요. 소는 못 찾았고, 흉터는 오래 남았어요.', en: 'An arrow grazed your arm. The cows stayed lost; the scar stayed for good.' } } } },
    ] },
  // 혼례와 혼수: 시대·땅마다 이름과 꼴은 달라도 딸을 보내는 집의 짐은 무거웠다 (넓은 표현). 한 지붕 아래 사는 대가족이라 사촌의 혼수도 다 같이 마련한다
  { id: 'loc.sa.village.dowry', stage: ['teen', 'adult'], when: { zones: Z, setting: 'village', minYear: -500 },
    title: { ko: '사촌의 혼례', en: 'A cousin’s wedding' },
    text: { ko: '한 지붕 아래 사는 사촌의 혼처가 정해졌어요. 신랑 집에 보낼 혼수 목록이 길어요. 큰아버지가 밤마다 손가락으로 셈을 해요.', en: 'A match has been made for the cousin who shares your roof. The list of gifts for the groom’s family is long. Every night your uncle counts on his fingers.' },
    choices: [
      { text: { ko: '빚을 내서라도 한다', en: 'Borrow if we must' }, effects: { wealth: -12, family: 6 },
        result: { ko: '잔치는 사흘 갔어요. 빚은 그보다 훨씬 오래갔어요.', en: 'The feast lasted three days. The debt lasted a great deal longer.' } },
      { text: { ko: '형편대로 한다', en: 'Do what we can afford' }, effects: { wealth: -4, family: 2, happy: -2 },
        result: { ko: '소박하게 치렀어요. 신랑 집 고모가 한동안 입을 삐죽였어요.', en: 'A modest affair. The groom’s aunt pursed her lips about it for quite a while.' } },
      { text: { ko: '노래로 잔치를 채운다', en: 'Fill the feast with songs' }, skill: 'music', effects: { happy: 4, charm: 3 },
        result: { ko: '밤새 노래를 불렀어요. 다들 혼수 이야기는 잊고 당신 노래만 기억했어요.', en: 'You sang all night. Everyone forgot about the gifts and remembered only your songs.' } },
    ] },
  // 뱀에 물림: 몬순 철 시골의 오랜 위험 (1886년 영국령 인도 집계 2만 2천여 명)
  { id: 'loc.sa.village.snake', stage: ['adult', 'middle'], ill: true, tokens: true, when: { zones: Z, setting: 'village', minYear: -5000 },
    title: { ko: '발목을 문 뱀', en: 'Snakebite' },
    text: { ko: '몬순 비가 그친 저녁, 풀숲을 밟다가 발목이 따끔했어요. 뱀이 미끄러져 사라져요. 발목이 벌써 부어올라요.', en: 'On an evening after the monsoon rain, you step into the long grass and feel a sting at your ankle. A snake slides away. The ankle is already swelling.' },
    choices: [
      { text: { ko: '{healer}에게 달려간다', en: 'Run to the {healer}' },
        chance: { p: 0.65,
          win: { effects: { health: 3 }, result: { ko: '상처를 째고 약을 붙인 뒤 밤새 지켜봤어요. 아침에 부기가 빠졌어요.', en: 'The wound was cut, dressed and watched all night. By morning the swelling had gone down.' } },
          lose: { effects: { health: -12 }, result: { ko: '열이 사흘 갔어요. 살았지만 그 다리는 한동안 남의 다리 같았어요.', en: 'The fever lasted three days. You lived, but for a long time that leg felt like someone else’s.' } } } },
      { text: { ko: '꽉 묶고 누워 있는다', en: 'Bind it tight and lie still' },
        chance: { p: 0.5,
          win: { effects: { happy: 2 }, result: { ko: '독 없는 뱀이었나 봐요. 사흘 동안 괜히 겁만 먹었어요.', en: 'It must have been a harmless one. You spent three days terrified for nothing.' } },
          lose: { effects: { health: -15 }, result: { ko: '다리가 시커멓게 부었어요. 한 철을 꼬박 누워 지냈어요.', en: 'The leg swelled up black. You spent the whole season flat on your back.' } } } },
    ] },
  // 마을 대금업자: 이자는 추수 때 곡식으로. 장부를 읽을 줄 알면 덜 속는다 (선택지 minKnow 60 = 글을 안다)
  { id: 'loc.sa.village.lender', stage: ['adult', 'middle'], tokens: true, when: { zones: Z, setting: 'village', minYear: -300, maxYear: 1949, minAge: 20 },
    title: { ko: '대금업자의 장부', en: 'The moneylender’s ledger' },
    text: { ko: '씨앗 살 {coin:이} 모자라요. 마을 대금업자가 붉은 장부를 펼치며 웃어요. 이자는 추수 때 곡식으로 받겠대요.', en: 'You are short of {coin} for seed. The village moneylender opens his red ledger with a smile. The interest, he says, can be paid in grain at harvest.' },
    choices: [
      { text: { ko: '장부에 이름을 올린다', en: 'Have your name put in the book' },
        chance: { p: 0.6,
          win: { effects: { wealth: 8 }, result: { ko: '풍년이 들어 추수 때 다 갚았어요. 대금업자가 조금 서운해했어요.', en: 'A good harvest, and you paid it all off. The moneylender looked faintly disappointed.' } },
          lose: { effects: { wealth: -10, happy: -4 }, result: { ko: '흉년이었어요. 이자가 이자를 낳아 장부의 당신 줄이 자꾸 길어졌어요.', en: 'A bad year. Interest bred interest, and your line in the ledger kept growing.' } } } },
      { text: { ko: '장부를 직접 읽어 본다', en: 'Read the ledger yourself' }, when: { minKnow: 25 }, effects: { wealth: 4, know: 2 },
        result: { ko: '이자 칸에 숫자가 하나 더 붙어 있었어요. 짚어 주자 대금업자가 헛기침을 했어요.', en: 'There was an extra digit in the interest column. When you pointed it out, the moneylender cleared his throat.' } },
      { text: { ko: '은붙이를 팔아 메운다', en: 'Sell the family silver' }, effects: { wealth: 3, happy: -4 },
        result: { ko: '할머니의 은팔찌를 팔았어요. 빚은 없었지만 손목 하나가 허전했어요.', en: 'You sold your grandmother’s silver bangle. No debt, but somebody’s wrist looked bare.' } },
    ] },
  // 땅의 몫: 옛 법전은 왕의 몫을 소출의 6분의 1로 적었다. 술탄·무굴·동인도회사·총독 아래에서도 관리는 들판을 재러 왔다 ({ruler})
  { id: 'loc.sa.village.revenue', stage: 'middle', tokens: true, when: { zones: Z, setting: 'village', eraGroups: ['ancient', 'medieval', 'early', 'industrial'], minYear: -300 },
    title: { ko: '몫을 매기러 온 관리', en: 'The assessor' },
    text: { ko: '{ruler}의 관리가 서기를 데리고 들판을 둘러봐요. 올해 {crop} 소출에서 나라 몫을 얼마로 매길지 정한대요.', en: 'The {ruler}’s official has come with a clerk to walk the fields. He will decide how much of this year’s {crop} belongs to the state.' },
    choices: [
      { text: { ko: '몇 자루를 숨긴다', en: 'Hide a few sacks' },
        chance: { p: 0.5,
          win: { effects: { wealth: 8 }, result: { ko: '관리는 곳간 뒤를 보지 않았어요. 그해 겨울은 넉넉했어요.', en: 'The official never looked behind the granary. That winter was a comfortable one.' } },
          lose: { effects: { wealth: -10, happy: -5 }, result: { ko: '서기의 눈은 매서웠어요. 숨긴 것까지 다 내고 벌금도 물었어요.', en: 'The clerk had sharp eyes. You handed over the hidden sacks and paid a fine on top.' } } } },
      { text: { ko: '촌장과 함께 사정한다', en: 'Plead alongside the headman' }, effects: { wealth: -3, charm: 2 },
        result: { ko: '흉년 이야기를 길게 했어요. 관리는 하품을 했지만 조금 깎아 줬어요.', en: 'You told a long tale of hardship. The official yawned, but knocked a little off.' } },
      { text: { ko: '군말 없이 낸다', en: 'Pay without a word' }, effects: { wealth: -6, family: 2 },
        result: { ko: '다 내고 나니 곳간이 휑했어요. 그래도 밤에 다리 뻗고 잤어요.', en: 'The granary looked bare afterwards. Still, you slept soundly.' } },
    ] },
  // 순례: 이름난 성지(티르타 · 절 · 성자의 무덤)까지 걸어서. 글을 알면 길에서 본 것을 적어 온다 (선택지 minKnow 60)
  { id: 'loc.sa.village.pilgrim', stage: ['middle', 'old'], tokens: true, when: { zones: Z, setting: 'village', minYear: -500 },
    title: { ko: '먼 성지로', en: 'To the distant shrine' },
    text: { ko: '평생 벼르던 순례를 떠날 때가 됐나 봐요. 이름난 {holy}까지는 걸어서 한 달 길이래요. 이웃 몇이 같이 가재요.', en: 'Perhaps it is finally time for the pilgrimage you have put off all your life. The famous {holy} is a month away on foot, and a few neighbors want to come along.' },
    choices: [
      { text: { ko: '길을 떠난다', en: 'Set out' }, fulfill: 'travel', effects: { happy: 8, health: -4, wealth: -5 },
        result: { ko: '발바닥이 다 갈라졌어요. 그래도 돌아오는 내내 얼굴이 환했어요.', en: 'Your soles cracked to pieces. Your face shone the whole way home.' } },
      { text: { ko: '마음으로만 다녀온다', en: 'Make the journey in spirit' }, effects: { happy: 2, health: 2 },
        result: { ko: '집 앞 나무 아래서 성지 쪽으로 절을 했어요. 다리는 편했고 마음은 반쯤 편했어요.', en: 'You bowed towards the shrine from under the tree by your door. Your legs were grateful; your heart, only half.' } },
      { text: { ko: '가서 순례기를 적는다', en: 'Go, and write it all down' }, when: { minKnow: 25 }, fulfill: 'travel', effects: { happy: 6, know: 3, wealth: -5 },
        result: { ko: '길에서 본 것을 적어 왔어요. 그 글은 마을에서 여러 번 소리 내어 읽혔어요.', en: 'You wrote down what you saw along the way. The pages were read aloud in the village many times.' } },
    ] },
  // 하라파 시대 (기원전 2600~1900): 돌 저울추는 어느 도시에서나 같은 무게였다 (2배씩 느는 체계). 목화도 이때 이미 길렀다
  { id: 'loc.sa.village.weights', stage: ['adult', 'middle'], when: { zones: Z, setting: 'village', areas: ['indus', 'india'], minYear: -2600, maxYear: -1900 },
    title: { ko: '똑같은 저울추', en: 'Matching weights' },
    text: { ko: '도시에서 온 상인이 반들반들한 돌 추로 당신 목화를 달아요. 이 추는 어느 도시에 가도 무게가 같대요.', en: 'A trader from the city weighs your cotton against a polished stone cube. He says weights like it are the same in every city.' },
    choices: [
      { text: { ko: '그 말을 믿는다', en: 'Take his word for it' }, effects: { wealth: 4 },
        result: { ko: '값을 받고 돌아왔어요. 집에 와서 셈해 보니 꽤 공평했어요.', en: 'You took the price and went home. When you worked it out later, it was fair enough.' } },
      { text: { ko: '우리 추로 다시 단다', en: 'Weigh it again on ours' },
        chance: { p: 0.5,
          win: { effects: { wealth: 6, know: 2 }, result: { ko: '두 추가 꼭 맞았어요. 상인이 웃으며 추 하나를 팔겠대요.', en: 'The two weights matched exactly. The trader laughed and offered to sell you one.' } },
          lose: { effects: { wealth: -3, know: 3 }, result: { ko: '우리 추가 가벼웠어요. 몇 해 동안 손해를 본 셈이었어요.', en: 'Your weight was the light one. You had been short-changing yourself for years.' } } } },
    ] },

  // ── 남아시아 큰 집: 앞마당 (elite) ↔ 뒤뜰 (serve). 같은 집의 두 쪽 ───────────────
  // 앞마당: 스승에게 배우기 ({school} = 구루의 집 · 파트샬라 · 막타브). 셋째 선택이 뒤뜰 카드 「문 뒤에서 듣는 글」과 짝
  { id: 'loc.sa.estate.guru', stage: 'child', tokens: true, when: { zones: Z, setting: 'estate', tags: ['elite'], minYear: -800, maxYear: 1800 },
    title: { ko: '스승 앞에서', en: 'Before the teacher' },
    text: { ko: '이제 날마다 {school:으로} 배우러 가요. 첫날, 스승이 소리 내어 외는 구절을 한 자도 틀리지 말고 따라 하래요.', en: 'Every day now you go to learn at the {school}. On the first day the teacher recites a verse and tells you to repeat it without a single slip.' },
    choices: [
      { text: { ko: '틀림없이 외운다', en: 'Get every syllable right' }, skill: 'letters', effects: { know: 6, happy: -2 },
        result: { ko: '백 번을 외웠어요. 꿈에서도 외웠어요.', en: 'You said it a hundred times. Then you said it in your sleep.' } },
      { text: { ko: '창밖 코끼리를 본다', en: 'Watch the elephant outside' }, effects: { happy: 5, know: 1 },
        result: { ko: '코끼리가 귀를 몇 번 펄럭였는지는 정확히 외웠어요.', en: 'You did memorize exactly how many times the elephant flapped its ears.' } },
      { text: { ko: '하인 아이에게 들려준다', en: 'Teach it to the servant’s child' }, effects: { charm: 3, family: -2 },
        result: { ko: '부엌 뒤에서 둘이 같이 외웠어요. 들키고 나서 둘 다 혼났어요.', en: 'The two of you recited it together behind the kitchen. When you were caught, you were both scolded.' } },
    ] },
  // 뒤뜰: 주인집 아이의 공부를 문 뒤에서 듣기
  { id: 'loc.sa.estate.door', stage: 'child', when: { zones: Z, setting: 'estate', tags: ['serve'], minYear: -800, maxYear: 1947 },
    title: { ko: '문 뒤에서 듣는 글', en: 'Lessons through the door' },
    text: { ko: '주인집 아이의 공부 시간이에요. 당신은 마당을 쓸다 말고 문 뒤에 서 있어요. 스승의 목소리가 새어 나와요.', en: 'It is lesson time for the master’s child. You have stopped sweeping and are standing behind the door. The teacher’s voice drifts out.' },
    choices: [
      { text: { ko: '숨죽이고 듣는다', en: 'Listen, holding your breath' },
        chance: { p: 0.6,
          win: { effects: { know: 5, happy: 3 }, result: { ko: '몇 구절을 통째로 외웠어요. 아무도 몰랐어요. 그게 더 좋았어요.', en: 'You learned whole verses by heart. Nobody knew. That made it even better.' } },
          lose: { effects: { know: 2, family: -5 }, result: { ko: '빗자루 소리가 멈춘 걸 집사가 알아챘어요. 그날 저녁밥은 없었어요.', en: 'The steward noticed the sweeping had stopped. There was no supper for you that night.' } } } },
      { text: { ko: '마당을 마저 쓴다', en: 'Finish the sweeping' }, effects: { family: 3, skill: 2 },
        result: { ko: '마당은 반짝였어요. 머릿속은 조금 허전했어요.', en: 'The courtyard gleamed. Your head felt a little empty.' } },
    ] },
  // 앞마당: 통치자의 궁정에 문안. 글을 알면 시를 지어 바친다 (선택지 minKnow 60). 동인도회사 전까지 ({ruler})
  { id: 'loc.sa.estate.court', stage: ['adult', 'middle'], tokens: true, when: { zones: Z, setting: 'estate', tags: ['elite'], minYear: -600, maxYear: 1757, minAge: 20 },
    title: { ko: '궁정에 문안', en: 'Paying court' },
    text: { ko: '{ruler}의 궁정에 문안드리러 가요. 다들 선물을 들고 줄을 섰어요. 차례가 오면 무언가 바쳐야 해요.', en: 'You go to pay your respects at the court of the {ruler}. Everyone is lined up with gifts. When your turn comes, you must offer something.' },
    choices: [
      { text: { ko: '값진 선물을 바친다', en: 'Offer a costly gift' }, effects: { wealth: -10 },
        chance: { p: 0.5,
          win: { effects: { wealth: 8, happy: 3 }, result: { ko: '{ruler:이} 고개를 끄덕였어요. 이듬해 세금 걷는 마을이 하나 늘었어요.', en: 'The {ruler} nodded. The next year one more village paid its dues to you.' } },
          lose: { effects: { happy: -4 }, result: { ko: '옆 사람 선물이 더 컸어요. 아무도 당신 선물을 기억하지 못했어요.', en: 'The man beside you brought a bigger gift. Nobody remembered yours.' } } } },
      { text: { ko: '시를 지어 바친다', en: 'Offer a poem of your own' }, when: { minKnow: 25 }, skill: 'letters', effects: { happy: 5, charm: 4 },
        result: { ko: '궁정이 조용해졌다가 웃음이 터졌어요. 좋은 뜻의 웃음이었어요, 아마도.', en: 'The court fell silent, then burst out laughing. The good kind of laughter, probably.' } },
      { text: { ko: '줄 맨 뒤에 선다', en: 'Hang back at the end of the line' }, effects: { happy: 1 },
        result: { ko: '해 질 때까지 기다리다 그냥 돌아왔어요. 선물은 그대로 남았어요.', en: 'You waited until sundown and went home. At least you still had the gift.' } },
    ] },
  // 뒤뜰: 잔칫날 부엌 ({feast} = 수확 축제 · 디왈리 · 이드 · 웨삭)
  { id: 'loc.sa.estate.kitchen', stage: ['teen', 'adult'], tokens: true, when: { zones: Z, setting: 'estate', tags: ['serve'], minYear: -1000, maxYear: 1947 },
    title: { ko: '잔칫날 부엌', en: 'The kitchen on a feast day' },
    text: { ko: '{feast} 날이에요. 앞마당엔 손님이 가득하고, 뒤뜰 부엌에선 당신이 사흘째 불을 지펴요. 단과자 한 쟁반이 눈앞에 있어요.', en: 'It is {feast}. The front courtyard is full of guests, and back in the kitchen you have tended the fires for three days. A tray of sweets sits right in front of you.' },
    choices: [
      { text: { ko: '하나 슬쩍한다', en: 'Slip one into your sleeve' },
        chance: { p: 0.6,
          win: { effects: { happy: 6 }, result: { ko: '막내 동생과 반씩 나눠 먹었어요. 세상에서 제일 단 반쪽이었어요.', en: 'You split it with your youngest sibling. It was the sweetest half of anything, ever.' } },
          lose: { effects: { family: -6, happy: -3 }, result: { ko: '요리사에게 들켰어요. 한 달 동안 냄비는 다 당신 몫이었어요.', en: 'The cook caught you. For a month every pot was yours to scrub.' } } } },
      { text: { ko: '손대지 않는다', en: 'Leave them be' }, effects: { family: 3 },
        result: { ko: '잔치가 끝나고 남은 것을 나눠 받았어요. 식었지만 떳떳했어요.', en: 'When the feast was over, you got a share of the leftovers. Cold, but honestly come by.' } },
    ] },
  // 뒤뜰: 빚에 매인 몸 (1976년 법이 없앴으나 오래 이어졌다). 매인 몸이면 떠나는 선택이 잠긴다 (선택지 bound: false)
  { id: 'loc.sa.estate.bond', stage: ['adult', 'middle'], when: { zones: Z, setting: 'estate', tags: ['serve'], eraGroups: ['ancient', 'medieval', 'early', 'industrial'], minYear: -600 },
    title: { ko: '줄지 않는 빚', en: 'The debt that never shrinks' },
    text: { ko: '아버지가 오래전에 진 빚 때문에 당신도 이 집에 매여 있어요. 문서엔 아버지의 표시가 있고, 빚은 줄지 않아요.', en: 'Because of a debt your father took on long ago, you too are bound to this house. His mark is on the bond, and the debt never seems to shrink.' },
    choices: [
      { text: { ko: '묵묵히 갚아 나간다', en: 'Keep working it off' }, effects: { wealth: 2, happy: -4, skill: 2 },
        result: { ko: '해마다 조금씩 갚았어요. 해마다 이자가 조금씩 더 붙었어요.', en: 'Every year you paid off a little. Every year a little more interest appeared.' } },
      { text: { ko: '이 집을 떠난다', en: 'Leave this house' }, when: { bound: false }, effects: { happy: 6, wealth: -6, family: -4 },
        result: { ko: '보따리 하나 들고 대문을 나섰어요. 뒤돌아보지 않았어요.', en: 'You walked out of the gate with a single bundle. You did not look back.' } },
      { text: { ko: '안주인에게 사정한다', en: 'Plead with the lady of the house' },
        chance: { p: 0.35,
          win: { effects: { happy: 8, status: 1 }, result: { ko: '안주인이 문서를 불 속에 넣었어요. 당신은 한참 그 불을 바라봤어요.', en: 'She put the bond into the fire. You stood watching it burn for a long while.' } },
          lose: { effects: { happy: -3 }, result: { ko: '따뜻한 말만 들었어요. 문서는 그대로 상자 속에 있었어요.', en: 'You got kind words. The bond stayed in its box.' } } } },
    ] },
  // 앞마당: 1793년 영구 정액제의 「해 질 녘 법」. 정한 날 해 지기 전까지 땅세를 못 내면 영지가 경매로 넘어갔다
  { id: 'loc.sa.estate.sunset', stage: ['adult', 'middle'], when: { zones: Z, setting: 'estate', tags: ['elite'], areas: ['bengal', 'india'], minYear: 1793, maxYear: 1947, minAge: 25 },
    title: { ko: '해 지기 전에', en: 'Before sunset' },
    text: { ko: '흉년인데 관청에 낼 땅세는 그대로예요. 정한 날 해 지기 전까지 못 내면 영지가 경매에 넘어가요. 소작인들은 낼 게 없대요.', en: 'The harvest failed, but the revenue owed to the government has not changed. Unpaid by sunset on the fixed day, the estate goes to auction. The tenants say they have nothing.' },
    choices: [
      { text: { ko: '소작인을 쥐어짠다', en: 'Squeeze the tenants' }, effects: { wealth: 6, family: -6, happy: -4 },
        result: { ko: '세금은 해 지기 전에 냈어요. 그해 마을에선 아무도 당신 집 쪽을 보지 않았어요.', en: 'The revenue was paid before sunset. That year nobody in the village would look towards your house.' } },
      { text: { ko: '땅 일부를 판다', en: 'Sell part of the land' }, effects: { wealth: -10, family: 3, happy: -2 },
        result: { ko: '강 건너 땅을 팔아 메웠어요. 소작인들이 조용히 고개를 숙였어요.', en: 'You sold the land across the river to cover it. The tenants quietly bowed their heads.' } },
      { text: { ko: '운에 맡기고 기다린다', en: 'Wait and hope' },
        chance: { p: 0.4,
          win: { effects: { happy: 4 }, result: { ko: '마감 사흘 전, 묵은 빚을 갚겠다는 사람이 나타났어요. 숨을 크게 쉬었어요.', en: 'Three days before the deadline, an old debtor turned up to pay. You breathed out at last.' } },
          lose: { effects: { wealth: -15, status: -1 }, result: { ko: '해가 졌어요. 이튿날 영지 이름 옆에 낯선 사람 이름이 적혔어요.', en: 'The sun went down. The next day a stranger’s name was written beside the estate’s.' } } } },
    ] },
  // 앞마당 (하라파): 집안 도장 새기기. 외뿔 짐승이 가장 흔한 그림이고 코뿔소·코끼리·황소도 있다
  { id: 'loc.sa.estate.seal', stage: ['teen', 'adult'], when: { zones: Z, setting: 'estate', tags: ['elite'], areas: ['indus', 'india'], minYear: -2600, maxYear: -1900 },
    title: { ko: '집안 도장', en: 'The family seal' },
    text: { ko: '짐 꾸러미를 봉할 도장을 새로 새겨요. 장인이 무슨 짐승을 새길지 물어요. 도장은 먼 도시까지 집안 이름 대신 가요.', en: 'A new seal is being carved to mark the family’s bundles of goods. The carver asks which animal to put on it. The seal will travel to distant cities in place of your name.' },
    choices: [
      { text: { ko: '외뿔 짐승', en: 'The one-horned beast' }, effects: { wealth: 5 },
        result: { ko: '다들 쓰는 그림이라 어디서나 알아봤어요. 장사가 순조로웠어요.', en: 'Everyone used that one, so everyone recognized it. Business went smoothly.' } },
      { text: { ko: '코뿔소', en: 'A rhinoceros' }, effects: { happy: 4, charm: 2 },
        result: { ko: '남다른 도장이라 다들 한 번 더 들여다봤어요. 당신은 그게 좋았어요.', en: 'It was an unusual seal, and people looked twice. You liked that.' } },
      { text: { ko: '코끼리', en: 'An elephant' }, effects: { happy: 2, luck: 2 },
        result: { ko: '코끼리는 길한 짐승이래요. 그해 짐은 한 번도 길에서 잃지 않았어요.', en: 'Elephants are lucky, they say. That year not one bundle went missing on the road.' } },
    ] },

  // ── 남아시아 거리 (craft · trade · shop · pro · office) ─────────────────
  // 하라파 구슬: 홍옥수 긴 구슬은 양쪽에서 뚫어 가운데서 만나게 했다 (찬후다로·로탈·돌라비라에서 송곳이 나온다)
  { id: 'loc.sa.street.beads', stage: ['child', 'teen'], when: { zones: Z, setting: 'street', tags: ['craft'], areas: ['indus', 'india'], minYear: -2600, maxYear: -1700 },
    title: { ko: '구슬 구멍', en: 'Drilling the bead' },
    text: { ko: '손가락만 한 붉은 홍옥수 구슬에 구멍을 뚫는 일을 배워요. 양쪽에서 조금씩 뚫어 가운데서 만나야 한대요. 오래 걸린대요.', en: 'You are learning to drill a finger-long bead of red carnelian. You bore in a little from each end, and the holes must meet in the middle. It takes a long time.' },
    choices: [
      { text: { ko: '끈기 있게 돌린다', en: 'Keep the drill turning' }, skill: 'craft',
        chance: { p: 0.55,
          win: { effects: { skill: 6, wealth: 3 }, result: { ko: '두 구멍이 가운데서 딱 만났어요. 스승이 구슬을 해에 비춰 보고 고개를 끄덕였어요.', en: 'The two holes met dead in the middle. Your master held the bead up to the sun and nodded.' } },
          lose: { effects: { skill: 3, happy: -3 }, result: { ko: '마지막 날 구슬이 쩍 갈라졌어요. 스승이 말없이 새 돌을 건넸어요.', en: 'On the last day the bead cracked in two. Your master silently handed you a new stone.' } } } },
      { text: { ko: '조개 구슬부터 한다', en: 'Start with shell beads' }, effects: { skill: 2, happy: 2 },
        result: { ko: '조개 구슬을 한 바구니 꿰었어요. 홍옥수는 내년에 하기로 했어요.', en: 'You strung a whole basket of shell beads. Carnelian could wait until next year.' } },
    ] },
  // 같은 일을 하는 집들의 조합 (슈레니): 서로 돕고, 남이 맡긴 돈도 굴렸다 (2세기 나시크 비문). 글을 알면 장부를 맡는다
  { id: 'loc.sa.street.guild', stage: ['teen', 'adult'], when: { zones: Z, setting: 'street', minYear: -600, maxYear: 1800 },
    title: { ko: '조합에 들까', en: 'Join the guild?' },
    text: { ko: '같은 일을 하는 집들의 조합이 당신을 받아 주겠대요. 회비를 내야 하지만, 흉년엔 서로 돕고 남이 맡긴 돈도 굴려 준대요.', en: 'The guild of families in your trade has offered to take you in. There are dues, but members help each other in lean years, and the guild even invests money others leave with it.' },
    choices: [
      { text: { ko: '회비를 내고 든다', en: 'Pay the dues and join' }, effects: { wealth: -6, family: 5, charm: 2 },
        result: { ko: '조합 명부에 당신 이름이 올랐어요. 길에서 인사하는 사람이 늘었어요.', en: 'Your name went into the guild’s register. More people greeted you in the street.' } },
      { text: { ko: '혼자 꾸려 간다', en: 'Stay on your own' }, effects: { wealth: 3, happy: 2 },
        result: { ko: '회비는 아꼈어요. 흉년이 오기 전까지는 그게 맞는 셈 같았어요.', en: 'You saved the dues. Until the lean year came, that looked like good sums.' } },
      { text: { ko: '조합 장부를 맡는다', en: 'Keep the guild’s books' }, when: { minKnow: 25 }, skill: 'trade', effects: { wealth: 4, know: 3 },
        result: { ko: '글 아는 사람이 귀했어요. 금세 조합의 셈을 다 맡게 됐어요.', en: 'People who could read were scarce. Before long you were doing all the guild’s accounts.' } },
    ] },
  // 북쪽 큰길 (웃타라파타 → 그랜드 트렁크 로드): 갠지스 어귀에서 서북쪽 산 너머까지 ({market})
  { id: 'loc.sa.street.road', stage: ['adult', 'middle'], tokens: true, when: { zones: Z, setting: 'street', areas: ['india', 'indus', 'bengal'], minYear: -500, maxYear: 1850, minAge: 18 },
    title: { ko: '북쪽 큰길', en: 'The great northern road' },
    text: { ko: '소달구지 행렬이 강어귀에서 서북쪽 산 너머까지 이어진 큰길로 떠난대요. 짐을 싣고 가면 먼 곳에서 값을 몇 곱절 받는대요.', en: 'A train of ox carts is setting off along the great road that runs from the river mouths to the northwestern mountains. Goods carried that far fetch several times the price.' },
    choices: [
      { text: { ko: '짐을 싣고 따라간다', en: 'Load up and go along' }, fulfill: 'travel',
        chance: { p: 0.55,
          win: { effects: { wealth: 12, happy: 4 }, result: { ko: '석 달 만에 돌아왔어요. 짐은 가벼워졌고 주머니는 무거워졌어요.', en: 'You came back three months later. The load was lighter; the purse was heavier.' } },
          lose: { effects: { wealth: -10, health: -4 }, result: { ko: '고갯길에서 도적 떼를 만났어요. 몸만 겨우 돌아왔어요.', en: 'Bandits caught the caravan at a pass. You barely made it home with the clothes on your back.' } } } },
      { text: { ko: '동네 {market}에서 판다', en: 'Sell at the local {market}' }, effects: { wealth: 4 },
        result: { ko: '값은 덜 받았어요. 대신 밤마다 제 잠자리에서 잤어요.', en: 'You got less for it. But you slept in your own bed every night.' } },
    ] },
  // 바다 건너 공장 천: 1853년 철길 뒤로 싼 기계 천이 시골 장터까지 닿아 손베틀 집들이 어려워졌다
  { id: 'loc.sa.street.millcloth', stage: ['adult', 'middle'], when: { zones: Z, setting: 'street', tags: ['craft'], areas: ['india', 'bengal', 'indus'], minYear: 1855, maxYear: 1947 },
    title: { ko: '기계로 짠 천', en: 'Machine-made cloth' },
    text: { ko: '바다 건너 공장에서 짠 천이 기차로 실려 와 장터에 쌓였어요. 당신 베틀 천보다 훨씬 싸요. 손님들이 그쪽으로 몰려요.', en: 'Cloth woven in factories across the sea has come in by rail and is piled up in the market. It is far cheaper than what comes off your loom, and the customers are drifting over.' },
    choices: [
      { text: { ko: '더 고운 천을 짠다', en: 'Weave something finer' }, skill: 'craft',
        chance: { p: 0.45,
          win: { effects: { wealth: 6, skill: 4 }, result: { ko: '기계가 못 내는 무늬를 짰어요. 혼례 손님들이 당신 천만 찾았어요.', en: 'You wove patterns no machine could manage. Wedding parties asked for your cloth by name.' } },
          lose: { effects: { wealth: -6, happy: -4 }, result: { ko: '공은 들였지만 그 값을 쳐 주는 사람이 드물었어요.', en: 'You put in the work, but few would pay what it was worth.' } } } },
      { text: { ko: '공장 실로 바꿔 짠다', en: 'Switch to mill-spun yarn' }, effects: { wealth: 3, happy: -1 },
        result: { ko: '실은 싸고 고왔어요. 베틀 소리가 그대로라 조금 위안이 됐어요.', en: 'The yarn was cheap and even. At least the loom still sounded the same.' } },
      { text: { ko: '베틀을 접는다', en: 'Fold up the loom' }, effects: { wealth: 2, happy: -6 },
        result: { ko: '베틀을 처마 밑에 세워 뒀어요. 그 앞을 지날 때면 발이 느려졌어요.', en: 'You stood the loom under the eaves. Whenever you passed it, your feet slowed down.' } },
    ] },
  // 현대 도시의 도시락통 (뭄바이 도시락 배달은 1890년부터, 틀리는 일이 드물기로 이름났다)
  { id: 'loc.sa.street.tiffin', stage: ['adult', 'middle'], when: { zones: Z, setting: 'street', areas: ['india'], minYear: 1950 },
    title: { ko: '바뀐 도시락', en: 'The wrong tiffin' },
    text: { ko: '절대 안 바뀐다던 배달 도시락통을 열었더니 남의 집 반찬이에요. 맨 아래 칸에 쪽지가 있어요. 「오늘은 일찍 와요.」', en: 'You open the delivered lunch tin, the kind that famously never goes astray, and find someone else’s food. In the bottom tier is a note: “Come home early today.”' },
    choices: [
      { text: { ko: '맛있게 먹는다', en: 'Eat it anyway' }, effects: { happy: 5 },
        result: { ko: '남의 집 반찬이 꽤 훌륭했어요. 당신 도시락을 받은 사람도 그랬기를 바랐어요.', en: 'The stranger’s cooking was excellent. You hoped whoever got yours felt the same.' } },
      { text: { ko: '배달꾼을 찾아 나선다', en: 'Track down the delivery man' }, effects: { charm: 3, happy: 2 },
        result: { ko: '역 앞에서 배달꾼을 찾아 바꿔 왔어요. 그 뒤로 가끔 그와 차를 마셨어요.', en: 'You found him outside the station and swapped them back. After that, the two of you took tea now and then.' } },
    ] },

  // ── 남아시아 야영지 (herd: 고대 목축 · band: 수렵 무리) ─────────────────
  // 수렵 무리: 벼랑 벌집의 꿀 따기 (빔베트카 바위 그림의 꿀 따는 장면)
  { id: 'loc.sa.camp.honey', stage: ['teen', 'adult'], ill: true, when: { zones: Z, setting: 'camp', eraGroups: ['forager'] },
    title: { ko: '벼랑의 벌집', en: 'The hive on the cliff' },
    text: { ko: '벼랑 중턱에 커다란 벌집이 매달렸어요. 연기로 벌을 쫓고 덩굴 사다리로 올라가야 해요. 무리의 어른이 당신을 쳐다봐요.', en: 'A huge honeycomb hangs halfway up the cliff. Someone must smoke out the bees and climb the vine ladder. The band’s elder is looking at you.' },
    choices: [
      { text: { ko: '덩굴을 타고 오른다', en: 'Climb the vines' }, risk: 'heights',
        chance: { p: 0.6,
          win: { effects: { happy: 6, family: 5 }, result: { ko: '꿀이 손목까지 흘렀어요. 그날 밤엔 다들 당신 이름을 불렀어요.', en: 'Honey ran down to your wrists. That night everyone was calling your name.' } },
          lose: { effects: { health: -10 }, result: { ko: '벌에 쏘이고 덩굴에서 미끄러졌어요. 얼굴이 사흘 동안 남의 얼굴이었어요.', en: 'You got stung and slipped off the vines. For three days your face belonged to someone else.' } } } },
      { text: { ko: '아래서 연기를 피운다', en: 'Tend the smoke below' }, effects: { family: 3 },
        result: { ko: '연기에 눈물이 줄줄 났어요. 꿀은 조금, 칭찬은 많이 받았어요.', en: 'The smoke made your eyes stream. You got a little honey and a lot of praise.' } },
    ] },
  // 수렵 무리: 마후아 꽃은 봄 새벽에 떨어지고, 곰도 그 꽃을 노린다 (중부 인도 숲)
  { id: 'loc.sa.camp.mahua', stage: 'child', when: { zones: Z, setting: 'camp', eraGroups: ['forager'], areas: ['india', 'bengal'] },
    title: { ko: '꽃이 떨어지는 새벽', en: 'The dawn of falling flowers' },
    text: { ko: '마후아 꽃이 밤새 우수수 떨어졌대요. 사슴과 곰이 다 먹기 전에 새벽부터 바구니를 들고 나가야 해요.', en: 'The mahua flowers fell all night. You have to be out with a basket at dawn, before the deer and the bears eat them all.' },
    choices: [
      { text: { ko: '일찍 일어난다', en: 'Get up early' }, effects: { family: 4, health: 2 },
        result: { ko: '바구니가 금세 찼어요. 달큰한 냄새가 하루 종일 손에 배어 있었어요.', en: 'Your basket filled up fast. The sweet smell stayed on your hands all day.' } },
      { text: { ko: '주우면서 먹는다', en: 'Eat as you gather' }, effects: { happy: 6, family: -2 },
        result: { ko: '바구니보다 배가 먼저 찼어요. 다들 웃었지만, 바구니를 보고는 덜 웃었어요.', en: 'Your belly filled before your basket did. Everyone laughed, though less once they saw the basket.' } },
    ] },
  // 목축 (고대): 건기에 먼 강가 풀밭으로 떼를 몰고 간다 ({beast} = 소)
  { id: 'loc.sa.camp.pasture', stage: ['teen', 'adult'], tokens: true, when: { zones: Z, setting: 'camp', eraGroups: ['ancient'], tags: ['herd'] },
    title: { ko: '마른 철의 풀밭', en: 'Grass in the dry season' },
    text: { ko: '건기라 가까운 풀밭이 바닥났어요. 사흘 걸어가야 하는 강가 풀밭으로 {beast} 떼를 몰고 가야 해요. 그 길엔 표범이 산대요.', en: 'It is the dry season and the nearby grazing is gone. The {beast} must be driven three days to the grass by the river, and leopards live along that road.' },
    choices: [
      { text: { ko: '떼를 몰고 간다', en: 'Drive the herd out' }, risk: 'beast',
        chance: { p: 0.6,
          win: { effects: { wealth: 8, happy: 3 }, result: { ko: '{beast:이} 강가에서 살이 올랐어요. 돌아오는 길엔 발걸음이 가벼웠어요.', en: 'The {beast} fattened up by the river. The walk home felt light.' } },
          lose: { effects: { wealth: -8, health: -4 }, result: { ko: '밤에 표범이 새끼 한 마리를 물어 갔어요. 남은 떼를 세고 또 셌어요.', en: 'In the night a leopard took one of the young. You counted the rest of the herd again and again.' } } } },
      { text: { ko: '나뭇가지를 쳐서 먹인다', en: 'Lop branches for fodder' }, effects: { wealth: -2, family: 2, health: 2 },
        result: { ko: '나뭇잎으로 버텼어요. 떼는 야위었지만 다 무사했어요.', en: 'You got by on leaves. The herd grew thin, but every one survived.' } },
    ] },
  // 데칸 신석기 잿더미 (기원전 3000~1200 무렵): 쌓인 소똥 더미를 태운 자리. 무엇을 위한 불이었는지는 넓은 표현으로
  { id: 'loc.sa.camp.ashmound', stage: ['adult', 'middle'], when: { zones: Z, setting: 'camp', eraGroups: ['ancient'], tags: ['herd'], areas: ['india'], minYear: -3000, maxYear: -1200 },
    title: { ko: '잿더미 언덕', en: 'The ash mound' },
    text: { ko: '여러 해 쌓인 소똥 더미에 불을 놓는 날이에요. 불길이 밤하늘까지 치솟고, 다들 소 떼를 몰고 불 곁으로 나와요.', en: 'Today the dung heap of many years is set alight. The flames leap into the night sky, and everyone drives the cattle out to the fire.' },
    choices: [
      { text: { ko: '소 떼를 몰고 돈다', en: 'Lead the cattle round' }, effects: { family: 5, happy: 4 },
        result: { ko: '연기 냄새가 며칠이나 머리카락에 배었어요. 그해 송아지가 유난히 많이 났어요.', en: 'The smoke stayed in your hair for days. That year an unusual number of calves were born.' } },
      { text: { ko: '불티를 구경한다', en: 'Watch the sparks fly' }, effects: { happy: 5, luck: 2 },
        result: { ko: '불티가 별처럼 흩어졌어요. 늙어서도 그 밤 이야기를 했어요.', en: 'The sparks scattered like stars. You were still telling people about that night when you were old.' } },
    ] },
];
