// 땅·자리 고유 카드 묶음 (시뮬 2.0 설계 4.2, 작업 7 AM): 아메리카 마을 8 · 아프리카 마을 5 · 아프리카 야영지 4 · 동남아·오세아니아 마을 4
// 모든 카드는 when.zones(문화권 하나) + when.setting(사는 자리) + 시대 조건(eraGroups 또는 minYear·maxYear)을 갖는다 (test/local_am.test.mjs).
// 출생 비율대로 1500년 전 생(고대·중세)에 무게를 둔다. 아메리카 마을은 메소아메리카가 절반, 브라질·안데스가 그다음이다.
// 아프리카 야영지는 대부분 −8000 전 수렵 무리(cards.js 맥락 group 'forager')이고, 가축 치는 집(herd)은 고대·중세 묶음이다.
// 고통스러운 제도(빚종·식민지 작물·아시엔다)는 그 자리에 선 사람의 눈으로 담담하게 쓴다. 실재 인물 이름은 쓰지 않는다.
// 선택지 조건(choice.when)은 0번 선택지에 달지 않는다 (시험·자동 결정이 0번을 고를 때 막히지 않게).
// 사실 출처: CONTENT-SOURCES-local-am.md
const AMV = (o = {}) => ({ zones: ['americas'], setting: 'village', ...o });
const AFV = (o = {}) => ({ zones: ['africa'], setting: 'village', ...o });
const AFC = (o = {}) => ({ zones: ['africa'], setting: 'camp', ...o });
const SEV = (o = {}) => ({ zones: ['seaoc'], setting: 'village', ...o });

export const LOCAL_CARDS_AM = [
  // ── 아메리카 마을 (8) ─────────────────────────────────────────
  // 밀파: 옥수수·콩·호박을 한 구덩이에 (메소아메리카, 1500년 전)
  { id: 'loc.am.amvil.milpa', stage: 'child', tokens: true, when: AMV({ areas: ['mesoamerica'], eraGroups: ['ancient', 'medieval'] }),
    title: { ko: '세 자매 밭', en: 'The three sisters' },
    text: { ko: '{land}에 옥수수와 콩, 호박을 한 구덩이에 같이 심어요. 콩은 옥수숫대를 타고, 호박잎은 땅을 덮어요. 씨앗 바구니는 당신 몫이에요.', en: 'Maize, beans and squash go into the same hole in the {land}. The beans climb the maize; the squash leaves shade the soil. The seed basket is yours.' },
    choices: [
      { text: { ko: '셋씩 꼭꼭 심는다', en: 'Plant them three by three' }, skill: 'farm', effects: { family: 4, happy: 2 },
        result: { ko: '어른들 하던 대로 심었어요. 여름이 되자 콩 덩굴이 옥수숫대를 감고 올라갔어요.', en: 'You planted the way the grown-ups did. By summer the bean vines were winding up the maize stalks.' } },
      { text: { ko: '콩을 몇 알 먹는다', en: 'Eat a few of the beans' }, effects: { happy: 5, family: -3 },
        result: { ko: '날콩은 아무 맛도 없었어요. 그해 그 구덩이에서만 콩이 안 났어요.', en: 'Raw beans tasted of nothing. That year, one hole alone grew no beans.' } },
    ] },
  // 고무공 놀이: 구기장은 작은 마을에도 있었다 (기원전 1400년 무렵부터)
  { id: 'loc.am.amvil.ballgame', stage: 'teen', tokens: true, when: AMV({ areas: ['mesoamerica'], eraGroups: ['ancient', 'medieval'], minYear: -1400 }),
    title: { ko: '고무공 놀이', en: 'The rubber ball game' },
    text: { ko: '마을 구기장에서 공놀이가 열려요. 손은 못 쓰고 엉덩이로만 쳐야 해요. 고무공은 돌처럼 무거워요.', en: 'There is a ball game at the village court. No hands allowed, only hips. The rubber ball is as heavy as a stone.' },
    choices: [
      { text: { ko: '선수로 나선다', en: 'Step onto the court' },
        chance: { p: 0.5,
          win: { effects: { charm: 3, happy: 6 }, result: { ko: '엉덩이로 공을 받아넘겼어요. 그날 저녁 당신 이름이 여러 번 불렸어요.', en: 'You sent the ball back with a twist of the hip. Your name came up a lot that evening.' } },
          lose: { effects: { health: -5, happy: -2 }, result: { ko: '공이 옆구리에 맞았어요. 멍이 공만 하게 들었어요.', en: 'The ball caught you in the ribs. The bruise was the size of the ball.' } } } },
      { text: { ko: '구경하며 내기를 건다', en: 'Watch and place a bet' },
        chance: { p: 0.5,
          win: { effects: { wealth: 5 }, result: { ko: '건 쪽이 이겼어요. {coin:을} 두 배로 받아 왔어요.', en: 'Your side won. You came home with twice the {coin}.' } },
          lose: { effects: { wealth: -5 }, result: { ko: '건 쪽이 졌어요. {coin:은} 남의 주머니로 갔어요.', en: 'Your side lost. The {coin} went home in someone else’s pouch.' } } } },
    ] },
  // 카카오 콩 돈 (250~1520): 속을 파내고 흙을 채운 가짜가 돌았다
  { id: 'loc.am.amvil.cacao', stage: ['adult', 'middle'], tokens: true, when: AMV({ areas: ['mesoamerica'], minYear: 250, maxYear: 1520 }),
    title: { ko: '가짜 카카오 콩', en: 'Counterfeit cacao' },
    text: { ko: '{market}에서 칠면조를 팔고 카카오 콩으로 값을 받았어요. 그런데 몇 알이 너무 가벼워요. 속을 파내고 흙을 채운 가짜가 돈대요.', en: 'You sold a turkey at the {market} and were paid in cacao beans. A few feel too light. Word is, some people hollow them out and fill them with mud.' },
    choices: [
      { text: { ko: '한 알씩 눌러 본다', en: 'Squeeze every bean' }, skill: 'trade', effects: { wealth: 4 },
        result: { ko: '세 알이 쑥 들어갔어요. 상인은 웃으며 진짜로 바꿔 줬어요. 다음엔 딴 사람한테 해 보겠지요.', en: 'Three beans gave under your thumb. The trader laughed and swapped them for real ones. He would try it on someone else.' } },
      { text: { ko: '그냥 받는다', en: 'Take them as they are' },
        chance: { p: 0.6,
          win: { effects: { wealth: 5, happy: 2 }, result: { ko: '다 진짜였어요. 상인은 당신을 셈이 시원한 사람으로 기억했어요.', en: 'They were all real. The trader remembered you as someone easy to deal with.' } },
          lose: { effects: { wealth: -4 }, result: { ko: '집에 와 깨 보니 네 알이 흙이었어요. 흙으로는 아무것도 못 샀어요.', en: 'At home you cracked them open: four were mud. Mud bought nothing.' } } } },
    ] },
  // 매듭 장부(키푸): 와리(600~1000)부터 잉카까지. 1번 선택지는 지식 40 넘어야 (choice.when)
  { id: 'loc.am.amvil.quipu', stage: ['adult', 'middle'], tokens: true, when: AMV({ areas: ['andes'], minYear: 600, maxYear: 1532 }),
    title: { ko: '매듭 장부', en: 'The knotted record' },
    text: { ko: '매듭 끈을 든 기록하는 이가 마을의 집과 곡식을 세러 왔어요. 끈을 보니 당신 집 몫이 한 매듭 많아요.', en: 'A record-keeper with knotted cords has come to count the village’s households and harvest. By the cords, your family owes one knot too many.' },
    choices: [
      { text: { ko: '아이유 어른께 맡긴다', en: 'Leave it to the ayllu elders' }, effects: { family: 4, wealth: -2 },
        result: { ko: '어른이 잘 말해 주었어요. 대신 다음 해 일손을 한 번 더 보태기로 했어요.', en: 'The elders spoke up for you. In return, you would lend an extra hand next year.' } },
      { text: { ko: '매듭을 직접 읽는다', en: 'Read the knots yourself' }, when: { minKnow: 25 }, skill: 'letters', effects: { wealth: 5, know: 2 },
        result: { ko: '맨 끝 끈의 매듭 하나가 엉뚱한 자리에 있었어요. 기록하는 이가 머쓱하게 다시 묶었어요.', en: 'One knot on the last cord sat in the wrong place. The record-keeper retied it, a little red in the face.' } },
      { text: { ko: '그냥 더 낸다', en: 'Just pay the extra' }, effects: { wealth: -5, happy: 2 },
        result: { ko: '{crop} 한 자루를 더 냈어요. 다투지 않으니 마음은 편했어요.', en: 'You handed over another sack of {crop}. Not arguing had its own comfort.' } },
    ] },
  // 쓴 카사바: 바구니 통(티피티)으로 독 즙을 짜낸다 (브라질·카리브, 1500년 전)
  { id: 'loc.am.amvil.manioc', stage: 'child', tokens: true, when: AMV({ areas: ['brazil', 'caribbean'], eraGroups: ['ancient', 'medieval'] }),
    title: { ko: '독이 든 뿌리', en: 'The poison root' },
    text: { ko: '할머니가 쓴 카사바를 갈아 기다란 바구니 통에 채웠어요. 즙에 독이 있어서 다 짜내야 {staple:을} 구울 수 있대요.', en: 'Grandmother grated the bitter cassava and packed it into a long woven tube. The juice is poison; every drop must be squeezed out before the {staple} can be baked.' },
    choices: [
      { text: { ko: '지렛대에 올라앉는다', en: 'Sit on the lever' }, effects: { family: 4, happy: 2 },
        result: { ko: '당신 몸무게가 딱 알맞대요. 즙이 다 빠질 때까지 꼼짝 않고 앉아 있었어요.', en: 'Your weight was just right, they said. You sat stock-still until the last of the juice had dripped out.' } },
      { text: { ko: '즙을 살짝 맛본다', en: 'Taste a drop of the juice' }, effects: { health: -3, happy: -2 },
        result: { ko: '혀끝만 댔는데 할머니가 손등을 찰싹 때렸어요. 배는 저녁까지 살살 아팠어요.', en: 'You barely touched it with your tongue before Grandmother slapped your hand. Your stomach ached until evening.' } },
    ] },
  // 미시시피 흙 둔덕 고을 (900~1500): 흙을 바구니로 져 날라 둔덕을 높였다. 옥수수 축제와 둔덕 쌓기가 함께였다
  { id: 'loc.am.amvil.mound', stage: ['teen', 'adult'], tokens: true, when: AMV({ areas: ['north_america'], minYear: 900, maxYear: 1500 }),
    title: { ko: '흙 둔덕 쌓기', en: 'Raising the mound' },
    text: { ko: '고을이 큰 흙 둔덕을 한 겹 더 높인대요. 집집마다 흙 바구니를 지고 와야 해요. 옥수수 축제도 코앞이에요.', en: 'The town is raising the great mound by another layer. Every household must carry up baskets of earth. The green corn feast is close, too.' },
    choices: [
      { text: { ko: '바구니를 지고 오른다', en: 'Haul baskets up the slope' }, effects: { health: -3, family: 6 },
        result: { ko: '등이 휘도록 날랐어요. 둔덕은 한 뼘 높아졌고, 사람들은 당신 얼굴을 기억했어요.', en: 'You hauled until your back bowed. The mound rose a hand’s width, and people remembered your face.' } },
      { text: { ko: '잔치 음식을 돕는다', en: 'Help with the feast food' }, effects: { happy: 5 },
        result: { ko: '{staple:을} 큰 솥 가득 쑤었어요. 흙 나르던 사람들이 와서 한 그릇씩 비웠어요.', en: 'You cooked a great pot of {staple}. Everyone who had carried earth came and emptied a bowl.' } },
    ] },
  // 식민지 마을의 교리 학교 (1550~1800)
  { id: 'loc.am.amvil.doctrina', stage: 'child', tokens: true, when: AMV({ areas: ['mesoamerica', 'andes', 'brazil'], minYear: 1550, maxYear: 1800 }),
    title: { ko: '학교 종소리', en: 'The school bell' },
    text: { ko: '신부가 마을 아이들을 {school:으로} 모아 기도문과 글자를 가르친대요. 아버지는 밭에 손이 모자란다고 해요.', en: 'The priest is gathering the village children at the {school} to teach prayers and letters. Your father says he is short of hands in the field.' },
    choices: [
      { text: { ko: '학교에 간다', en: 'Go to the school' }, effects: { know: 4, family: -2 },
        result: { ko: '새 말과 글자를 배웠어요. 집에 오면 할머니가 옛말로 된 노래를 가르쳐 주었어요.', en: 'You learned new words and letters. At home, Grandmother taught you songs in the old language.' } },
      { text: { ko: '밭에 남는다', en: 'Stay in the field' }, skill: 'farm', effects: { family: 3, happy: 2 },
        result: { ko: '아버지 곁에서 밭일을 익혔어요. 셈은 {crop:으로} 배웠어요.', en: 'You learned the fieldwork at your father’s side. You learned to count with {crop}.' } },
    ] },
  // 도시로 (1900~2015): 1번 선택지는 매인 몸(아시엔다의 페온 등)이면 잠긴다 (choice.when bound:false)
  { id: 'loc.am.amvil.city', stage: 'adult', tokens: true, when: AMV({ minYear: 1900, maxYear: 2015 }),
    title: { ko: '도시에서 온 사촌', en: 'The cousin from the city' },
    text: { ko: '도시로 간 사촌이 구두를 신고 돌아왔어요. 거기엔 일자리가 넘친대요. 사촌은 내일 아침 다시 떠나요.', en: 'The cousin who went to the city came back in leather shoes. There’s work everywhere there, he says. He leaves again in the morning.' },
    choices: [
      { text: { ko: '마을에 남는다', en: 'Stay in the village' }, effects: { family: 5 },
        result: { ko: '떠나는 사촌에게 손을 흔들었어요. 저녁상엔 늘 먹던 {staple:이} 올랐어요.', en: 'You waved your cousin off. Supper was the usual {staple}.' } },
      { text: { ko: '사촌을 따라간다', en: 'Go with your cousin' }, when: { bound: false },
        chance: { p: 0.5,
          win: { effects: { wealth: 8, status: 1 }, result: { ko: '변두리에 방 한 칸을 얻었어요. 몇 해 뒤엔 작은 가게도 냈어요.', en: 'You found a room on the edge of town. A few years later you opened a little shop.' } },
          lose: { effects: { wealth: -3, happy: -5 }, result: { ko: '일자리는 사촌 말의 절반쯤이었어요. 구두 대신 굳은살이 생겼어요.', en: 'There was about half the work your cousin had promised. You got calluses instead of shoes.' } } } },
      { text: { ko: '동생을 대신 보낸다', en: 'Send a younger sibling' }, effects: { wealth: 3, family: -3 },
        result: { ko: '동생의 편지와 돈이 가끔 왔어요. 편지는 이웃이 읽어 주었어요.', en: 'Now and then a letter and a little money came from your sibling. A neighbor read the letters out.' } },
    ] },

  // ── 아프리카 마을 (5) ─────────────────────────────────────────
  // 흙 화로에서 쇠를 녹이는 밤 (기원전 500년 무렵 ~ 1500). 사건 「쇠를 녹이는 마을」(괭이 값)과 다른 쪽: 풀무 밟는 아이
  { id: 'loc.am.afvil.smelt', stage: 'teen', when: AFV({ minYear: -500, maxYear: 1499 }),
    title: { ko: '밤샘 풀무', en: 'The all-night bellows' },
    text: { ko: '대장장이가 흙 화로에 쇳돌과 숯을 채웠어요. 밤새 풀무를 밟을 아이가 필요하대요. 불이 식으면 쇠도 안 나와요.', en: 'The smith has packed the clay furnace with ore and charcoal. A youngster is needed to work the bellows all night. If the fire cools, no iron comes out.' },
    choices: [
      { text: { ko: '밤새 풀무를 밟는다', en: 'Pump the bellows all night' }, skill: 'craft',
        chance: { p: 0.6,
          win: { effects: { skill: 3, wealth: 3 }, result: { ko: '새벽에 화로를 깨니 쇳덩이가 나왔어요. 대장장이가 당신 어깨를 두 번 두드렸어요.', en: 'At dawn they broke open the furnace and there was a bloom of iron. The smith clapped you twice on the shoulder.' } },
          lose: { effects: { health: -3, happy: -2 }, result: { ko: '쇳돌이 덜 녹아 찌꺼기뿐이었어요. 대장장이는 숯 탓을 했어요. 당신 탓은 아니었어요.', en: 'The ore barely melted; there was only slag. The smith blamed the charcoal. Not you.' } } } },
      { text: { ko: '잠깐 눈을 붙인다', en: 'Close your eyes for a moment' }, effects: { happy: 3, family: -3 },
        result: { ko: '불이 잠깐 시들었어요. 대장장이는 말없이 다른 아이를 불렀어요.', en: 'The fire sagged for a moment. Without a word, the smith called for another child.' } },
    ] },
  // 그리오: 집안의 조상을 노래로 외는 사람 (말리 제국 무렵부터, 서아프리카)
  { id: 'loc.am.afvil.griot', stage: 'child', tokens: true, when: AFV({ areas: ['west_africa'], minYear: 1230, maxYear: 1900 }),
    title: { ko: '그리오의 노래', en: 'The griot’s song' },
    text: { ko: '혼인 잔치에 그리오가 왔어요. 줄을 뜯으며 이 마을 집안들의 조상을 몇 대씩 줄줄 읊어요.', en: 'A griot has come to the wedding feast. Plucking the strings, the griot reels off the ancestors of every family in the village, generations deep.' },
    choices: [
      { text: { ko: '곁에 앉아 듣는다', en: 'Sit close and listen' }, effects: { know: 3, family: 2 },
        result: { ko: '조상 이름이 열두 대까지 이어졌어요. 당신 집 이름이 나오자 귀가 빨개졌어요.', en: 'The names ran back twelve generations. When your family came up, your ears went red.' } },
      { text: { ko: '{coin:을} 몰래 드린다', en: 'Slip the griot some {coin}' }, effects: { wealth: -3, happy: 5, charm: 2 },
        result: { ko: '그리오가 당신 이름을 노래에 넣었어요. 한 줄뿐이었지만 온 마을이 들었어요.', en: 'The griot worked your name into the song. Only one line, but the whole village heard it.' } },
    ] },
  // 돌아가며 타는 목돈 (에수수, 서아프리카 · 1650년 뒤로만)
  { id: 'loc.am.afvil.esusu', stage: ['adult', 'middle'], tokens: true, when: AFV({ areas: ['west_africa'], minYear: 1650, maxYear: 2015 }),
    title: { ko: '돌아가며 타는 목돈', en: 'The savings circle' },
    text: { ko: '장터 여인들이 계를 모아요. 장날마다 {coin:을} 조금씩 내고, 차례가 오면 한 사람이 다 가져가요. 당신 자리도 있대요.', en: 'The market women run a savings circle. Each market day everyone puts in a few {coin}, and in turn one person takes the lot. There is a place for you.' },
    choices: [
      { text: { ko: '계에 든다', en: 'Join the circle' },
        chance: { p: 0.75,
          win: { effects: { wealth: 8, happy: 2 }, result: { ko: '당신 차례에 목돈으로 염소 두 마리를 샀어요. 장날 인사가 조금 길어졌어요.', en: 'When your turn came you bought two goats with the pot. Market-day greetings got a little longer.' } },
          lose: { effects: { wealth: -5 }, result: { ko: '목돈을 탄 한 사람이 장에 다시 안 나왔어요. 다들 한동안 그 집 앞을 돌아서 다녔어요.', en: 'One member took the pot and never came back to the market. For a while, everyone walked the long way round that house.' } } } },
      { text: { ko: '혼자 항아리에 모은다', en: 'Save alone in a pot' }, effects: { wealth: 3 },
        result: { ko: '조금씩 모았어요. 느렸지만 아무도 도망가지 않았어요.', en: 'You saved bit by bit. Slow, but nobody ran off with it.' } },
    ] },
  // 식민지의 코코아 (서아프리카 1890~1965): 세금은 돈으로
  { id: 'loc.am.afvil.cocoa', stage: ['adult', 'middle'], tokens: true, when: AFV({ areas: ['west_africa'], minYear: 1890, maxYear: 1965 }),
    title: { ko: '코코아나무', en: 'Cocoa trees' },
    text: { ko: '이웃들이 숲을 베고 코코아나무를 심어요. 다섯 해는 지나야 열매가 달린대요. 세금은 돈으로 내야 하고요.', en: 'The neighbors are clearing forest to plant cocoa trees. It takes about five years before they bear. And the tax has to be paid in money.' },
    choices: [
      { text: { ko: '{crop} 밭을 지킨다', en: 'Keep to your {crop}' }, effects: { health: 3, wealth: -2 },
        result: { ko: '먹을 것은 늘 있었어요. 세금 낼 돈은 늘 조금 모자랐어요.', en: 'There was always food. There was never quite enough money for the tax.' } },
      { text: { ko: '코코아나무를 심는다', en: 'Plant cocoa' },
        chance: { p: 0.6,
          win: { effects: { wealth: 10 }, result: { ko: '다섯 해 뒤 첫 열매를 땄어요. 값은 바다 건너에서 정해졌지만, 그래도 돈이었어요.', en: 'Five years on you picked the first pods. The price was set across the sea, but it was money.' } },
          lose: { effects: { wealth: -5, happy: -3 }, result: { ko: '나무가 병들었어요. 그해엔 {staple:을} 사 먹어야 했어요.', en: 'The trees sickened. That year you had to buy your {staple}.' } } } },
    ] },
  // 신붓값 셈: 가축과 천 (사하라 이남 어디나, 현대 전)
  { id: 'loc.am.afvil.bridewealth', stage: 'adult', tokens: true, when: AFV({ eraGroups: ['ancient', 'medieval', 'early', 'industrial'], notFlags: ['married'] }),
    title: { ko: '신붓값 셈', en: 'Counting the bridewealth' },
    text: { ko: '혼인 이야기가 오가요. 두 집안 어른들이 가축 몇 마리와 {cloth} 몇 필을 치를지 밤늦도록 셈을 해요.', en: 'There is talk of a marriage. Late into the night, the elders of both families bargain over how many animals and how much {cloth} will change hands.' },
    choices: [
      { text: { ko: '어른들 셈에 맡긴다', en: 'Leave it to the elders' }, set: ['married'], effects: { family: 10, happy: 3 },
        result: { ko: '셈은 사흘 만에 끝났어요. 두 집안은 그 뒤로 명절마다 그 셈 이야기를 했어요.', en: 'The bargaining took three days. Ever after, both families retold it at every festival.' } },
      { text: { ko: '셈 자리에 끼어든다', en: 'Join the bargaining' }, set: ['married'],
        chance: { p: 0.5,
          win: { effects: { family: 8, charm: 3 }, result: { ko: '당신 말 한마디에 양쪽이 다 웃었어요. 셈은 그 자리에서 끝났어요.', en: 'One remark from you made both sides laugh, and the deal was done on the spot.' } },
          lose: { effects: { family: 4, happy: -4 }, result: { ko: '젊은 사람이 나선다고 한 소리 들었어요. 혼인은 했지만 체면은 한동안 구겨졌어요.', en: 'You were told off for speaking out of turn. The marriage went ahead; your dignity took a while to recover.' } } } },
      { text: { ko: '조금 더 기다린다', en: 'Wait a little longer' }, effects: { wealth: 3, happy: -2 },
        result: { ko: '한두 해 더 모으기로 했어요. 상대 집안은 기다려 주겠다고 했어요. 아마도요.', en: 'You decided to save another year or two. The other family said they would wait. Probably.' } },
    ] },

  // ── 아프리카 야영지 (4): 수렵 무리 셋 + 가축 치는 집 하나 ───────────
  // 꿀길잡이 새: 사람을 벌집으로 데려가고 밀랍을 나눠 받는다
  { id: 'loc.am.afcamp.honeyguide', stage: 'child', when: AFC({ eraGroups: ['forager'] }),
    title: { ko: '꿀길잡이 새', en: 'The honeyguide' },
    text: { ko: '작은 새 한 마리가 짹짹대며 앞서 날다가 자꾸 뒤를 돌아봐요. 어른들 말로는 꿀 있는 데로 데려가는 새래요.', en: 'A small bird chatters, flits ahead and keeps looking back at you. The grown-ups say it leads people to honey.' },
    choices: [
      { text: { ko: '새를 따라간다', en: 'Follow the bird' },
        chance: { p: 0.65,
          win: { effects: { happy: 6, health: 3 }, result: { ko: '나무 구멍에 벌집이 있었어요. 어른들은 밀랍 한 덩이를 새 몫으로 바위에 올려 두었어요.', en: 'There was a hive in a hollow tree. The grown-ups left a lump of wax on a rock as the bird’s share.' } },
          lose: { effects: { health: -3, happy: 2 }, result: { ko: '벌집은 찾았는데 연기가 모자랐어요. 얼굴이 이틀 동안 두 배였어요.', en: 'You found the hive, but the smoke ran short. Your face was twice its size for two days.' } } } },
      { text: { ko: '어른을 부르러 간다', en: 'Run and fetch a grown-up' }, effects: { family: 4 },
        result: { ko: '어른이 휘파람으로 새에게 답했어요. 새와 사람이 서로 말을 하는 것 같았어요.', en: 'The grown-up whistled back at the bird. It was as if bird and person were talking.' } },
    ] },
  // 타조 알껍데기 구슬: 먼 무리와 주고받는 선물 (−50000 뒤, 구슬이 나온 동·남아프리카, 검토 m12)
  { id: 'loc.am.afcamp.beads', stage: 'teen', when: AFC({ eraGroups: ['forager'], minYear: -50000, areas: ['east_africa', 'south_africa'] }),
    title: { ko: '알껍데기 구슬', en: 'Eggshell beads' },
    text: { ko: '타조 알껍데기 조각에 구멍을 뚫고 갈아 구슬을 만들어요. 한 줄을 꿰는 데 여러 날이 걸려요.', en: 'You drill and grind scraps of ostrich eggshell into beads. A single string takes many days.' },
    choices: [
      { text: { ko: '먼 무리 친구에게 보낸다', en: 'Send it to a friend in a far band' }, effects: { charm: 3, family: 4 },
        result: { ko: '몇 해 뒤 가뭄이 들자 그 무리가 물웅덩이를 나눠 줬어요. 구슬 한 줄 값보다 훨씬 컸어요.', en: 'Years later, in a drought, that band shared its waterhole with yours. Worth far more than one string of beads.' } },
      { text: { ko: '제 목에 건다', en: 'Wear it yourself' }, effects: { happy: 5 },
        result: { ko: '목이 반짝였어요. 모닥불 곁에서 몇 번이나 만지작거렸어요.', en: 'Your neck shone. By the fire you kept fingering the beads.' } },
    ] },
  // 곪은 가시 (다침)
  { id: 'loc.am.afcamp.thorn', stage: ['adult', 'middle'], ill: true, tokens: true, when: AFC({ eraGroups: ['forager'] }),
    title: { ko: '곪은 가시', en: 'The festering thorn' },
    text: { ko: '덩이뿌리를 캐다 박힌 가시가 발바닥 깊이 곪았어요. 걸을 때마다 욱신거려요. {healer:이} 돌날로 째 주겠대요.', en: 'A thorn you picked up digging tubers has festered deep in your sole. Every step throbs. The {healer} offers to cut it out with a stone blade.' },
    choices: [
      { text: { ko: '발을 내민다', en: 'Hold out your foot' },
        chance: { p: 0.75,
          win: { effects: { health: 5 }, result: { ko: '가시가 나오자 열도 내렸어요. 사흘 뒤엔 다시 무리를 따라 걸었어요.', en: 'Out came the thorn, and the fever with it. Three days later you were walking with the band again.' } },
          lose: { effects: { health: -8 }, result: { ko: '상처가 덧나 한 달을 절었어요. 무리는 걸음을 늦춰 주었어요.', en: 'The wound turned bad and you limped for a month. The band slowed its pace for you.' } } } },
      { text: { ko: '참고 기다린다', en: 'Grit your teeth and wait' },
        chance: { p: 0.45,
          win: { effects: { health: 3, happy: 2 }, result: { ko: '가시가 저절로 밀려 나왔어요. 다들 운이 좋았다고 했어요.', en: 'The thorn worked its own way out. Everyone said you were lucky.' } },
          lose: { effects: { health: -10 }, result: { ko: '발이 퉁퉁 부어 빈손으로도 걷기 힘들었어요. 결국 돌날 신세를 졌어요.', en: 'Your foot swelled so badly you could barely walk empty-handed. In the end, the stone blade it was.' } } } },
    ] },
  // 가축 치는 집: 내 몫의 송아지 (고대·중세, 소를 치던 땅)
  { id: 'loc.am.afcamp.calf', stage: 'child', when: AFC({ tags: ['herd'], eraGroups: ['ancient', 'medieval'], areas: ['east_africa', 'south_africa', 'west_africa'] }),
    title: { ko: '내 몫의 송아지', en: 'A calf of your own' },
    text: { ko: '할아버지가 갓 난 송아지 한 마리를 당신 몫으로 주었어요. 소 치는 사람들은 소마다 털빛과 뿔 모양으로 이름을 지어요.', en: 'Grandfather has given you a newborn calf of your own. Herders name every animal by its coat and the shape of its horns.' },
    choices: [
      { text: { ko: '털빛대로 이름 짓는다', en: 'Name it for its coat' }, skill: 'farm', effects: { family: 4, happy: 2 },
        result: { ko: '얼룩 이름을 붙였어요. 백 마리 사이에서도 그 송아지는 당신 소리에만 고개를 돌렸어요.', en: 'You gave it a dappled name. Among a hundred head, it turned only at your call.' } },
      { text: { ko: '멋진 이름을 짓는다', en: 'Give it a grand name' }, effects: { happy: 5 },
        result: { ko: '아무도 그 이름으로 부르지 않았어요. 송아지도 대답하지 않았어요.', en: 'Nobody ever used that name. Neither did the calf.' } },
    ] },

  // ── 동남아·오세아니아 마을 (4) ────────────────────────────────
  // 첫 모 심는 날: 정령의 사당에 제물 (고대, 오스트레일리아 빼고)
  { id: 'loc.am.seavil.planting', stage: 'child', tokens: true, when: SEV({ areas: ['mainland_sea', 'indonesia', 'philippines', 'malay'], eraGroups: ['ancient'] }),   // 태평양(뉴기니·섬)은 논이 아니라 빼 둔다 (검토 I1)
    title: { ko: '첫 심는 날', en: 'First planting' },
    text: { ko: '첫 심기를 앞두고 마을 사람들이 {holy}에 제물을 바쳐요. 당신은 {land}에 심을 모종 바구니를 나를 차례예요.', en: 'Before the first planting the village leaves offerings at the {holy}. It is your turn to carry the basket of shoots for the {land}.' },
    choices: [
      { text: { ko: '모종을 나른다', en: 'Carry the shoots' }, skill: 'farm', effects: { family: 4, happy: 2 },
        result: { ko: '허리가 끊어질 것 같았지만 하나도 안 떨어뜨렸어요. 어른들이 당신 몫의 줄을 남겨 줬어요.', en: 'Your back nearly broke, but you didn’t drop a single one. The grown-ups left a row for you to plant yourself.' } },
      { text: { ko: '제물을 살짝 맛본다', en: 'Sneak a taste of the offering' }, effects: { happy: 5, luck: -2 },
        result: { ko: '아무도 못 봤어요. 그해 비가 조금 늦게 오자 당신만 혼자 마음을 졸였어요.', en: 'No one saw. When the rains came a little late that year, you alone fretted about it.' } },
    ] },
  // 큰 사원에 딸린 마을 (700~1500, 동남아 대륙·자와): 쌀·천·일손. 빚을 못 갚으면 빚종 (신분 −1)
  { id: 'loc.am.seavil.temple', stage: ['adult', 'middle'], when: SEV({ areas: ['mainland_sea', 'indonesia'], minYear: 700, maxYear: 1500 }),
    title: { ko: '큰 사원의 몫', en: 'The great temple’s share' },
    text: { ko: '이 마을은 큰 사원에 딸려 있어요. 해마다 쌀과 천, 일손을 바쳐요. 올해는 사원 관리인이 몫을 더 달래요.', en: 'This village belongs to the great temple. Every year it sends rice, cloth and workers. This year the temple steward wants more.' },
    choices: [
      { text: { ko: '쌀을 더 낸다', en: 'Give more rice' }, effects: { wealth: -6, charm: 2 },
        result: { ko: '광이 가벼워졌어요. 대신 사원 잔칫날 앞자리에 앉았어요.', en: 'The storeroom got lighter. In return you sat near the front on the temple’s feast day.' } },
      { text: { ko: '일손으로 갚는다', en: 'Pay in labor' }, effects: { health: -5, wealth: 2 },
        result: { ko: '석 달 동안 사원 돌을 날랐어요. 돌아와 보니 논이 당신을 못 알아볼 뻔했어요.', en: 'You hauled temple stone for three months. When you got back, your own paddy barely recognized you.' } },
      { text: { ko: '귀족에게 빌려 낸다', en: 'Borrow from a noble' },
        chance: { p: 0.55,
          win: { effects: { wealth: 2, happy: 2 }, result: { ko: '다음 해 소출로 다 갚았어요. 비가 제때 와 준 덕이었어요.', en: 'You paid it all back from next year’s harvest, thanks to rains that came on time.' } },
          lose: { effects: { wealth: -4, status: -1 }, result: { ko: '빚을 못 갚아 그 집 빚종이 됐어요. 다 갚을 때까지라고 했어요.', en: 'You couldn’t repay, and became a bondsman in that household until the debt was cleared.' } } } },
    ] },
  // 향신료 상인과 새 신앙 (1300~1620, 향신료가 나고 모이던 섬들의 바닷가. 필리핀은 산지가 아니라 뺀다, 검토 m12). 1번 선택지는 지식 25 넘어야
  { id: 'loc.am.seavil.spice', stage: ['adult', 'middle'], when: SEV({ areas: ['indonesia', 'malay'], minYear: 1300, maxYear: 1620 }),
    title: { ko: '향신료 상인', en: 'The spice traders' },
    text: { ko: '바다 건너 상인들이 향신료를 사러 와 인도 무명으로 값을 쳐요. 몇은 하루 다섯 번 기도하며 항구에 기도처를 지어요.', en: 'Traders from across the sea have come for spices, paying in Indian cotton. Some pray five times a day, and they are building a prayer house by the harbor.' },
    choices: [
      { text: { ko: '무명과 바꾼다', en: 'Trade for the cotton' }, effects: { wealth: 5 },
        result: { ko: '고운 무명을 받았어요. 장날마다 이웃들이 그 천을 만져 보러 왔어요.', en: 'You got fine cotton. Every market day the neighbors came by to feel it.' } },
      { text: { ko: '저울을 직접 따진다', en: 'Check the scales yourself' }, when: { minKnow: 25 }, skill: 'trade', effects: { wealth: 8, know: 2 },
        result: { ko: '상인의 저울추 하나가 가벼웠어요. 그걸 짚은 뒤로 셈이 딱딱 맞았어요.', en: 'One of the trader’s weights was light. After you pointed it out, the sums came out right.' } },
      { text: { ko: '그들의 기도를 지켜본다', en: 'Watch them at prayer' }, effects: { know: 3, happy: 2 },
        result: { ko: '새 신앙은 장삿길을 따라 왔어요. 몇 해 뒤 마을 몇 집도 그 기도를 따라 했어요.', en: 'The new faith came in along the trade routes. A few years later, some village families were praying the same way.' } },
    ] },
  // 식민 정부에 바칠 작물: 자와의 강제 재배 제도 (1830~1870, 커피는 1917년 무렵까지). 다른 동남아 땅에는 이런 제도가 없었다 (검토 I2)
  { id: 'loc.am.seavil.cashcrop', stage: ['adult', 'middle'], when: SEV({ areas: ['indonesia'], minYear: 1830, maxYear: 1917 }),
    title: { ko: '바다 건너 팔 작물', en: 'Crops for export' },
    text: { ko: '관리가 와서 마을 논 한 몫에 커피나 사탕수수, 쪽을 심으라고 해요. 바다 건너 팔 작물이래요.', en: 'An official says part of the village paddies must be planted with coffee, sugarcane or indigo — crops to be sold across the sea.' },
    choices: [
      { text: { ko: '정해진 몫을 내준다', en: 'Hand over the share' }, effects: { wealth: -6, family: 2 },
        result: { ko: '정해진 만큼 심었어요. 그해 밥상이 조금 가벼웠어요.', en: 'You planted what was required. Meals were a little lighter that year.' } },
      { text: { ko: '촌장과 줄여 달라고 한다', en: 'Ask for less, with the headman' },
        chance: { p: 0.4,
          win: { effects: { wealth: 2, charm: 3 }, result: { ko: '관리가 장부를 고쳐 줬어요. 왜인지는 아무도 몰랐어요.', en: 'The official amended the ledger. Nobody ever knew why.' } },
          lose: { effects: { wealth: -8, happy: -4 }, result: { ko: '몫은 그대로였고, 촌장만 눈 밖에 났어요.', en: 'The share stayed the same, and the headman fell out of favor.' } } } },
      { text: { ko: '농장에 품을 팔러 간다', en: 'Go and work on a plantation' }, effects: { wealth: 5, health: -4, family: -3 },
        result: { ko: '농장 품삯으로 몫을 메웠어요. 돈은 생겼고, 집은 멀어졌어요.', en: 'Plantation wages covered the share. There was money now, and home was further away.' } },
    ] },
];
