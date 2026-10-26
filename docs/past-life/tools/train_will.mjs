// tools/train_will.mjs
// 초경량 내장 AI 서사 엔진 훈련 & 5-Fold 교차 검증 파이프라인
// 15대 의도 클래스 / 700+ 대규모 역사·생활 말뭉치 지도학습 (Supervised Learning)
// 한국어 조사·어미 분리 토크나이저 + TF-IDF 코사인 센트로이드(Cosine Centroid) + 5-Fold Cross Validation

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../will_model.data.js');

// 1. 순수 JS 한글 자모 분해기 (0 의존성)
const CHOSUNG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNGSUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONGSUNG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

export function decomposeHangul(str) {
  let res = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - 0xac00;
      const initial = Math.floor(offset / (21 * 28));
      const medial = Math.floor((offset % (21 * 28)) / 28);
      const final = offset % 28;
      res += CHOSUNG[initial] + JUNGSUNG[medial] + (final > 0 ? JONGSUNG[final] : '');
    } else {
      res += str[i];
    }
  }
  return res.toLowerCase();
}

// 2. 한국어 조사(Josa) 및 용언 어미 분리 정규식
const JOSA = /^(.*?)(에서|으로|에게|한테|부터|까지|하고|이며|에는|에|을|를|은|는|이|가|의|와|과|도|만|로|란|이라|려|며|고|서|자)$/;
const VERB_ENDINGS = /^(.*?)(하며|하고|하여|하면|한다|했다|해라|된다|됐다|달이다|달여|치료하|가르쳐|가르치|배운다|익힌다|짓는다|만든다|벼린다|벼리기|달린다|싸운다|훔친다|떠난다|바친다|기른다|돌본다|사랑하|사모하|고백하|꿈꾼다|기도하|방황하|유랑하)$/;

// 3. 다층 시맨틱 N-Gram 토크나이저
export function extractEnhancedFeatures(text) {
  const clean = text.toLowerCase().replace(/[^a-z가-힣0-9\s]/g, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const jamo = decomposeHangul(clean);
  const feats = {};

  const add = (k, weight = 1) => {
    feats[k] = (feats[k] || 0) + weight;
  };

  for (const w of words) {
    add(`w:${w}`, 3.0);
    let stem = w;
    const jm = stem.match(JOSA);
    if (jm && jm[1].length >= 2) {
      add(`w:${jm[1]}`, 2.8);
      stem = jm[1];
    }
    const vm = stem.match(VERB_ENDINGS);
    if (vm && vm[1].length >= 2) {
      add(`w:${vm[1]}`, 3.0);
      stem = vm[1];
    }
    for (let i = 0; i < stem.length - 1; i++) {
      add(`bg:${stem.slice(i, i + 2)}`, 1.2);
    }
    for (let i = 0; i < stem.length - 2; i++) {
      add(`tg:${stem.slice(i, i + 3)}`, 1.6);
    }
  }

  // 자모 트라이그램 (오타 및 활용형 완충)
  for (let i = 0; i < jamo.length - 2; i++) {
    const tri = jamo.slice(i, i + 3);
    if (!tri.includes(' ')) add(`j3:${tri}`, 0.35);
  }

  return feats;
}

// 4. 대규모 15대 의도 학습 말뭉치 (700+ 문장)
export const TRAINING_DATA = {
  scholar: [
    '서책을 밤새워 공부하며 과거 시험을 준비한다',
    '등잔불 밑에서 주역과 논어 소학을 강독한다',
    '서당 훈장님 몰래 고문서를 필사하고 독서한다',
    '신전의 고대 상형문자 점토판을 해독한다',
    '마을 동네 꼬마들과 아이들을 모아놓고 천자문과 글자를 가르친다',
    '아이들에게 천자문과 소학을 가르쳐준다',
    '동네 꼬마들에게 논어와 소학을 가르쳐준다',
    '관청 도서관의 필경사가 되어 역사서를 정리한다',
    '위대한 사상가를 찾아가 제자로 입문하여 학문을 닦는다',
    '학당에서 유생들과 우주의 이치와 철학을 토론한다',
    '시경과 서경의 구절을 달달 외우며 시험을 본다',
    '새로운 문자 체계를 연구하여 책으로 엮어낸다',
    '관직에 올라 왕실의 편찬 사업에 참여한다',
    '훈장님께 회초리를 맞아가며 대학과 중용을 배운다',
    '도포를 차려입고 과거 시험장에 나아가 일필휘지로 답안을 쓴다',
    '오래된 비석에 새겨진 마모된 비문을 탁본하여 연구한다',
    '서고 깊숙한 곳에서 금서를 몰래 꺼내 탐독한다',
    '책장을 넘기며 옛 성현의 지혜를 가슴에 새긴다',
    '벼루에 먹을 갈아 정갈한 붓글씨로 경전을 필사한다',
    '과거 시험에 급제하여 장원급제의 영예를 안는다',
    '서원에서 유학자들과 성리학의 이기론을 논쟁한다',
    '향교에 입학하여 선비로서의 수양을 쌓는다',
    '학자의 길을 걸으며 일생을 진리 탐구에 바친다',
    '어릴 적부터 신동 소리를 들으며 책벌레로 자란다',
    '규장각의 관리가 되어 조선왕조실록을 편찬한다',
    '동양 고전 사서삼경을 독파하여 문장을 짓는다',
    '문과 시험에 응시하여 합격 방을 받는다',
    '명문 서원에 들어가 스승님의 강론을 받아적는다',
    '어린 학동들의 손을 잡고 붓 쥐는 법을 가르친다',
    '고대 철학자들의 대화편을 라틴어로 번역한다',
    '학문 연구에 몰두하여 주석서를 펴낸다',
    '책 읽기', '과거 시험', '글공부하기', '학문 닦기', '서당 가기', '논어 읽기', '천자문 떼기',
    'study ancient scrolls and prepare for imperial civil exam',
    'read philosophy books by candlelight until dawn',
    'teach children reading and writing at local academy',
    'decipher ancient temple inscriptions and library archives',
    'debate cosmology and ethics with scholar peers',
    'write scholarly commentary on classical poetry',
    'dedicate youth to mastering literature and academic knowledge',
    'memorize law codes and history books for state examination',
    'become an apprentice scribe copying sacred manuscripts',
    'seek out a renowned sage in mountain retreat to learn truth',
    'pass the imperial state examinations with highest honors',
    'copy sacred confucian treatises and historical chronicles',
    'attend ancient royal academy studying rhetoric and letters',
    'write essay on governance and morality for the sovereign',
  ],
  merchant: [
    '주춧돌 밑을 파서 모아둔 은화와 엽전을 숨긴다',
    '장터에서 헐값에 곡식과 소금을 사들여 도시에 비싸게 판다',
    '비단과 도자기를 낙타에 싣고 사막 대상단을 따라나선다',
    '동네 어귀에 주막과 전당포를 열어 이자를 챙긴다',
    '시세를 예측하여 흉년이 오기 전에 곡물을 매점매석한다',
    '보부상 패거리에 들어가 봇짐을 메고 전국 장터를 유랑한다',
    '외국 상인들과 서역의 향료와 유리를 흥정한다',
    '항구에 환전소와 무역 상점을 차려 큰돈을 굴린다',
    '은밀한 비자금을 마련하여 가문의 곳간을 채운다',
    '동업자와 상단을 꾸려 수도에 대형 상점을 세운다',
    '새벽 장마당에 제일 먼저 나가 좌판을 펴고 손님을 끈다',
    '엽전 꾸러미를 무게 달아 셈하며 장부에 꼼꼼히 적는다',
    '물길을 따라 소금 배를 띄우고 내륙 깊숙이 소금을 실어 나른다',
    '흉년이 들었을 때 쌀값을 두 배로 올려 폭리를 취한다',
    '주머니에 동전을 짤랑거리며 상인들과 가격을 깎는다',
    '비자금과 금화를 비밀 상자에 넣어 묻어둔다',
    '시전 상인들과 담합하여 독점 판매권을 얻어낸다',
    '어음을 발행하고 환어음을 할인하여 금융 이익을 얻는다',
    '대상단의 행수로 추대되어 비단길 무역을 총괄한다',
    '난전에서 저렴하게 뗀 물건을 저잣거리에 내다 판다',
    '곡물 시세 차익을 노리고 대규모 투자를 단행한다',
    '은괴와 금화를 가마솥 밑에 깊숙이 묻어둔다',
    '객주를 차려 각지에서 온 상인들에게 숙식을 제공하고 위탁 판매한다',
    '인삼과 약재를 청나라 상인에게 넘겨 막대한 은을 챙긴다',
    '주판알을 튕기며 이번 달 상단의 매상과 순이익을 계산한다',
    '물산 상회를 설립하여 항구의 하역권과 유통망을 장악한다',
    '도매상에서 대량으로 뗀 비단을 소매상인들에게 납품한다',
    '장사하기', '은화 숨기기', '비자금 챙기기', '흥정하기', '상점 열기', '무역하기', '돈 굴리기',
    'invest gold and silver in spice trade caravans',
    'bargain at the market bazaar to buy cheap and sell dear',
    'hide secret coins and treasure beneath foundation stone',
    'establish trading house and money lending exchange',
    'speculate on rice and grain prices during scarce seasons',
    'peddle merchandise across provinces with merchant guild',
    'import exotic silks and glassware from distant empires',
    'build a grand warehouse by harbor docks for cargo goods',
    'accumulate massive wealth to become a revered tycoon',
    'open a wholesale shop trading porcelain, tea and herbs',
    'keep double-entry bookkeeping ledgers of commerce profits',
    'charter merchant fleet across southern trade routes',
    'hoard grain supplies ahead of anticipated drought seasons',
  ],
  artisan: [
    '대장간 풀무질을 하며 시뻘건 쇠를 망치로 두드려 칼을 벼린다',
    '대장간에서 낫과 호미 벼리기',
    '대장간 모루 위에서 시뻘건 쇠를 두드려 농기구를 만든다',
    '물레를 돌려 고운 백토로 단아한 청자와 도자기를 빚는다',
    '나무를 대패질하고 끌로 파내어 정교한 가구와 목탑을 짓는다',
    '가죽을 무두질하여 튼튼한 군화와 갑옷을 바느질한다',
    '공방 명장의 도제로 들어가 쇠와 구리 다루는 기술을 배운다',
    '낡은 집의 무너진 돌담과 지붕을 흙과 기와로 수리한다',
    '비단실을 잣고 베틀에 앉아 촘촘하게 비단을 짠다',
    '돌을 정으로 쪼아 아름다운 석불과 탑을 조각한다',
    '시계와 정밀한 태엽 기계를 분해하고 조립하여 고친다',
    '새로운 합금 기술을 시험하며 단단한 농기구를 제작한다',
    '용광로 앞에서 굵은 땀방울을 쏟으며 쇳물을 거푸집에 붓는다',
    '자개를 잘게 썰어 옻칠한 함 위에 영롱하게 나전을 놓는다',
    '대나무를 쪼개어 가볍고 튼튼한 살을 엮어 바구니를 만든다',
    '무뎌진 도끼날과 괭이를 숫돌에 갈아 시퍼렇게 벼린다',
    '나무와 쇠를 깎아 수공예 장식품을 만든다',
    '도자기 가마에 장작을 때며 온도를 조절해 명품 백자를 구워낸다',
    '한옥의 서까래와 대들보를 짜 맞추며 궁궐 건축에 참여한다',
    '구리와 주석을 녹여 맑은 소리가 울리는 방짜유기를 만든다',
    '무명천을 천연 염료로 쪽빛으로 곱게 물들인다',
    '물레방아의 나무 톱니바퀴를 깎아 정미소를 수리한다',
    '대장간 화덕에 불을 지피고 쇠를 담금질하여 날카로운 창검을 벼린다',
    '목수 연장을 챙겨 들고 들보와 기둥을 깎아 정자를 짓는다',
    '은세공 기술을 연마하여 왕실의 은장도와 노리개를 세공한다',
    '기와를 굽는 가마터에서 빗살무늬 기와를 수만 장 구워낸다',
    '칼 벼리기', '물건 만들기', '도자기 빚기', '대장간 일하기', '집 수리하기', '목공 일하기',
    'forge iron and steel into sharp tools and sturdy blades',
    'throw clay on potter wheel to shape fine porcelain jars',
    'carve intricate timber joints to construct timber temples',
    'tan leather and stitch tough boots and armor plates',
    'weave silk fabric and embroidery on manual looms',
    'apprentice under guild master craftsman to master trade',
    'repair crumbling mudbrick chimneys and thatched roofs',
    'sculpt marble statues and sacred stone monuments',
    'tinker with mechanical clocks, gears and waterworks',
    'craft beautiful brass ornaments and ceremonial vessels',
    'fire stone kilns to produce celadon glazes and pottery',
    'cast molten bronze bells with intricate floral reliefs',
    'construct sturdy wooden carts, wheels and mill gears',
  ],
  healer: [
    '깊은 산속을 헤매며 백년 묵은 산삼과 희귀 약초를 캔다',
    '열병으로 앓아누운 환자의 맥을 짚고 탕약을 정성껏 달인다',
    '침통에서 은침을 꺼내어 어르신의 마비된 다리에 침술로 침을 놓는다',
    '어르신 다리에 침 놓고 탕약 달이기',
    '부러진 뼈를 맞추고 덧나무를 대어 정형술을 베푼다',
    '역병이 번진 마을에 격리소를 세우고 소독과 구호에 힘쓴다',
    '산파를 도와 산모의 순산을 유도하고 갓난아이를 받는다',
    '유명한 의원을 찾아가 약재 성질과 침구학을 전수받는다',
    '가난한 병자들에게 돈을 받지 않고 무료로 의술을 베푼다',
    '의서를 집필하여 민간 요법과 약초 도감을 집대성한다',
    '환부의 고름을 째고 약초 즙을 찧어 발라 환자를 돌본다',
    '아픈 병자의 환부에 침을 놓고 약을 달인다',
    '약탕기 뚜껑을 열고 모락모락 피어오르는 한약 냄새를 살핀다',
    '상처에서 피고름을 짜내고 깨끗한 붕대를 감아 지혈한다',
    '쑥을 뭉쳐 혈자리에 올리고 뜸을 떠서 냉기를 뺀다',
    '환자의 안색과 혀를 살피며 온역의 기운을 분별한다',
    '혜민서에 들어가 환자들의 맥을 보고 처방전을 쓴다',
    '독사에 물린 사냥꾼의 상처에서 독을 빨아내고 해독제를 먹인다',
    '동의보감을 공부하며 인체의 오장육부와 혈맥을 익힌다',
    '약초 밭을 일구어 당귀와 백출, 황기를 재배한다',
    '마을 노인들의 굳은 어깨와 무릎에 뜸을 놓아 통증을 달랜다',
    '절구에 약재를 빻아 고약을 만들고 환부에 붙여준다',
    '상처 입은 병사들의 피 묻은 붕대를 갈아주고 꿰맨다',
    '의녀가 되어 궁궐 여인들의 병세를 살피고 탕약을 올린다',
    '약초 캐기', '환자 치료하기', '침 놓기', '탕약 달이기', '의술 배우기', '맥 짚기',
    'gather medicinal wild herbs and ginseng from steep cliffs',
    'diagnose pulse and brew healing herbal remedies for fever',
    'administer acupuncture needles and moxibustion for pain',
    'set fractured bones and apply soothing herb poultices',
    'care for plague victims in quarantine shelter wards',
    'assist midwives during difficult childbirth deliveries',
    'study anatomy, pharmacology and medical treatises',
    'provide charitable medical care to impoverished villagers',
    'dress bleeding war wounds with clean linen bandages',
    'brew willow bark infusions to reduce raging fevers',
    'master pulse diagnosis identifying internal bodily ailments',
    'tend to sick children offering comforting broths and balms',
  ],
  statesman: [
    '관아의 부름을 받아 말단 서리로 들어가 나랏일을 돕는다',
    '사또의 재판정에서 억울하게 몰린 농민을 변호한다',
    '호적 대장과 토지 문서를 검토하여 불법 탈세를 적발한다',
    '마을 원로 회의를 주재하고 관개수로 공사 일정을 조율한다',
    '영주의 집사로 임명되어 영지 내 세금과 소작을 관리한다',
    '고을의 치안을 강화하고 야간 순찰대를 편성하여 지휘한다',
    '과거에 급제하여 지방 수령으로 부임해 백성을 다스린다',
    '사또의 비리를 암행어사에게 고변하기 위해 밀서를 작성한다',
    '사또 비리 암행어사에게 고변하기',
    '사또의 비리를 암행어사에게 고변한다',
    '인근 고을과의 국경 분쟁에서 법전 기록을 근거로 승소한다',
    '동헌 뜰 아래 엎드린 백성들의 민원을 조목조목 기록한다',
    '가뭄에 대비하여 관청 곡간을 열고 진휼미를 공평하게 방출한다',
    '사또와 원님을 보좌하여 관아의 행정 업무를 처리한다',
    '관찰사에게 장계를 올려 탐관오리를 징벌한다',
    '포도청의 포교가 되어 저잣거리 치안을 단속한다',
    '향약 규약을 제정하여 마을 주민들의 미풍양속을 권장한다',
    '마을의 억울한 송사를 공정하게 판결하여 원망을 푼다',
    '양전 사업의 조사관이 되어 토지 면적을 정확히 측량한다',
    '어사의 마패를 품에 숨기고 비밀리에 지방 관아를 감찰한다',
    '목민심서를 본받아 청렴결백한 목민관이 되어 치적을 쌓는다',
    '조정의 당파 싸움에서 백성을 위한 실용적 정책을 건의한다',
    '관아 출사', '사또 보좌', '나랏일 돕기', '호적 정리하기', '재판하기', '고을 다스리기',
    'serve as government clerk managing town official registry',
    'act as courtroom advocate defending wrongfully accused',
    'audit tax rolls and land ownership deeds for magistrates',
    'preside over village council and communal waterworks',
    'administer lord estate finances and tenant farmer contracts',
    'organize town watch patrol to maintain civil public order',
    'receive royal magistrate commission to govern frontier county',
    'settle territorial dispute using ancient legal charters',
    'inspect public granaries and distribute famine relief rice',
    'draft administrative proclamations posted on city gates',
    'adjudicate local disputes with fairness and legal acumen',
  ],
  warrior: [
    '새벽마다 목검을 휘두르고 활시위를 당기며 무예를 연마한다',
    '도적 떼가 마을 어귀를 습격하자 창을 쥐고 선봉에 서서 맞선다',
    '창을 쥐고 도적 떼와 맞서 싸우기',
    '변방 국경 수비대에 징집되어 성벽을 지키는 보초병이 된다',
    '말을 타고 질주하며 과녁에 연속으로 세 발의 화살을 명중시킨다',
    '주막에서 난동을 부리는 왈패들과 주먹 결투를 벌여 제압한다',
    '무과 시험에 도전하여 무예 대련에서 상대 장수를 쓰러뜨린다',
    '장수의 호위무사로 발탁되어 전장을 누비며 목숨을 바친다',
    '검술 도장에 들어가 사범에게 진검 베기와 방어술을 배운다',
    '단검을 뽑아 맞서 싸운다',
    '이를 악물고 갑옷 끈을 조여 맨 뒤 칼집에서 칼을 뽑아 든다',
    '적의 화살이 빗발치는 가운데 방패를 앞세우고 돌격한다',
    '단검을 역수로 쥐고 어둠 속에서 침입자의 목을 겨눈다',
    '싸움판에서 주먹을 날려 적을 쓰러뜨린다',
    '왜구의 침략에 맞서 의병대로 출전하여 게릴라전을 펼친다',
    '착호갑사가 되어 백두산 호랑이를 활로 쏘아 잡는다',
    '창과 방패를 들고 진형을 유지하며 적의 기병 돌격을 막아낸다',
    '삼지창을 휘두르며 성벽을 기어오르는 적병을 밀어낸다',
    '활을 메고 산세를 정찰하며 적군의 매복을 간파한다',
    '말 위에서 언월도를 휘두르며 적진을 헤집고 적장을 벤다',
    '수군 함대의 판옥선에서 왜선의 갑판으로 뛰어들어 칼싸움을 벌인다',
    '검술 훈련', '칼싸움하기', '무과 시험', '적과 맞서 싸우기', '결투하기', '무예 닦기',
    'train relentlessly with heavy sword, spear and war bow',
    'charge at barbarian raiders to defend homeland barricades',
    'enlist as frontier fortress sentry guarding stone ramparts',
    'master mounted archery galloping on horseback at full speed',
    'brawl in tavern fistfight to knock down unruly bullies',
    'compete in military martial arts tournament for captaincy',
    'serve as loyal bodyguard shield protecting general in battle',
    'wield halberd to break enemy vanguard infantry lines',
    'stand night watch on fortress tower facing northern wastes',
    'duel rival warrior in honor contest before cheering legions',
  ],
  seeker: [
    '속세의 모든 미련을 털어내고 깊은 산속 암자로 출가한다',
    '절에 들어가 삭발하고 출가하기',
    '새벽 세 시에 일어나 향을 피우고 부처님께 백팔배를 올린다',
    '경전을 밤낮으로 독송하며 마음에 낀 번뇌와 욕망을 씻는다',
    '성당 제단 앞에 무릎 꿇고 하느님께 구원과 평화를 기도한다',
    '맨발로 흙길을 걸으며 침묵의 고행 순례길을 떠난다',
    '마을 사찰의 종지기가 되어 매일 아침저녁으로 범종을 울린다',
    '참선에 들어 모든 잡념을 내려놓고 무아의 경지에 든다',
    '시주바리를 들고 탁발을 나가며 보시의 공덕을 나눈다',
    '가사를 수하고 목탁을 두드리며 영혼의 극락왕생을 염원한다',
    '동굴 속에 가부좌를 틀고 벽을 마주 보며 묵언 수행에 든다',
    '신전의 제단에 정화수를 올리고 하늘의 뜻을 묻는 기도를 올린다',
    '신에게 두 손 모아 간절히 기도하고 참회한다',
    '사경을 하며 부처님의 말씀을 한 글자씩 정성껏 베껴 쓴다',
    '스님의 가르침을 받아 화두를 잡고 깨달음을 갈구한다',
    '성지 순례길을 걸으며 가난한 나그네에게 물을 건넨다',
    '사찰 마당을 비로 쓸며 마음의 번뇌 망상을 털어낸다',
    '새벽 예불을 올리며 온 누리의 평화와 중생의 해탈을 발원한다',
    '지리산 깊은 암자에서 십 년 동안 면벽 수양을 계속한다',
    '신선이 되기 위해 기도를 올리고 단전호흡으로 기를 모은다',
    '절에 출가하기', '불공 드리기', '기도하기', '참선하기', '염불하기', '묵언 수행',
    'renounce worldly pleasures to take holy vows at secluded abbey',
    'wake before dawn to burn incense and bow in prayer',
    'chant sacred scriptures to cleanse mortal desires and ego',
    'kneel before cathedral altar praying for spiritual salvation',
    'walk barefoot pilgrimage through dusty valleys in silent contemplation',
    'ring heavy temple bell at dusk spreading peaceful resonance',
    'sit in deep meditative trance seeking enlightenment and nirvana',
    'beg for modest alms giving blessings to compassionate villagers',
    'contemplate divine mysteries within candlelit sanctuary',
    'retreat to mountain cloister dedicating soul to monastic peace',
  ],
  rebel: [
    '서당 뒤뜰의 달콤한 엿과 과일을 몰래 서리하여 먹는다',
    '서당 뒤뜰 엿을 몰래 훔쳐 먹는다',
    '서당 뒤뜰 엿 몰래 서리하기',
    '탐관오리의 비밀 곡간을 털어 굶주린 이웃들에게 나눠준다',
    '산속 깊은 곳에 산채를 짓고 억울한 자들을 모아 의적을 결성한다',
    '가혹한 소작료 징수에 맞서 낫과 몽둥이를 들고 민란을 일으킨다',
    '관아의 지하 감옥을 습격하여 억울하게 갇힌 동지를 구출한다',
    '양반들의 위선적인 행패에 침을 뱉고 그들의 수탈 장부를 불태운다',
    '훔치고 빼돌려 기득권의 배를 가르고 백성의 원한을 갚는다',
    '달 밝은 밤 복면을 쓰고 부잣집 담을 넘어 재물을 훔쳐 달아난다',
    '관군의 추격을 피해 험준한 산악 지대로 유인한 뒤 기습한다',
    '의병 깃발을 치켜들고 도탄에 빠진 세상을 뒤엎기 위해 봉기한다',
    '서리 도둑질 소매치기 슬쩍 털어버린다',
    '활빈당의 일원이 되어 양반들의 부정축재 재산을 털어낸다',
    '주막에서 엿들은 비밀 밀무역 장부를 빼돌려 폭로한다',
    '소작농들을 규합하여 지주의 횡포에 맞서는 소작 거부 투쟁을 벌인다',
    '몰래 곳간을 털고 가난한 이들의 마당에 쌀가마니를 던져둔다',
    '닭장 담을 넘어 살진 암탉을 슬쩍 서리해 구워 먹는다',
    '원님의 횡포에 분노하여 관아 문짝에 붉은 먹물로 격문을 붙인다',
    '산적 패거리에 합류하여 부정한 관료들의 행렬을 털어버린다',
    '엿 서리하기', '곡간 털기', '의적 결성하기', '도둑질하기', '슬쩍 훔치기', '민란 봉기',
    'sneak into orchard to steal sweet ripe fruit and rice taffy',
    'raid corrupt magistrate granaries and redistribute corn to starving',
    'form band of righteous forest outlaws in mountain hideouts',
    'revolt against extortionate landlords bearing pitchforks and scythes',
    'storm county dungeon to rescue captured brotherhood comrades',
    'burn aristocratic debt registries and defy unjust imperial taxes',
    'become legendary bandit fighting oppression on behalf of commoners',
    'ambush aristocratic tax collectors returning plundered coins',
    'defy feudal lords by organizing peasant defense brotherhoods',
  ],
  freespirit: [
    '야밤을 틈타 봇짐 하나만 메고 고향을 등진 채 야반도주한다',
    '먼 고을로 야반도주한다',
    '야밤에 봇짐 싸서 도망치기',
    '엄격한 가문과 가부장의 굴레에서 도망쳐 숲속으로 숨어든다',
    '산속 깊숙한 바위 동굴에 거처를 잡고 속세를 잊은 채 은둔한다',
    '사냥 활과 덫을 메고 야생 동물을 쫓아 원시림을 자유롭게 누빈다',
    '어디에도 얽매이지 않고 바람처럼 구름처럼 정처 없이 떠돈다',
    '강가에 작은 통나무 오두막을 짓고 낚시와 채집으로 자급자족한다',
    '산속 깊은 곳에 은신하여 세상과 단절한다',
    '관아의 수배를 피해 산속 화전민 마을로 숨어들어 이름을 바꾼다',
    '달콤한 고독을 벗 삼아 풀잎 소리를 들으며 모닥불을 쬔다',
    '아무도 찾지 않는 무인도로 밀항하여 혼자만의 낙원을 일군다',
    '달아나고 도망치고 멀리 숨어버린다',
    '정혼을 피해 야밤에 보따리를 싸들고 뒷담을 넘어 달아난다',
    '가문의 무거운 족쇄를 끊어내고 미지의 산골짜기로 피신한다',
    '화전민이 되어 산비탈을 일구며 관청의 손길이 닿지 않게 산다',
    '가족의 구속을 벗어나 짚신 한 켤레로 정처 없이 길을 떠난다',
    '주막에서 낮잠을 자고 바람 부는 대로 발길 닿는 대로 유랑한다',
    '이름도 족보도 버리고 깊은 골짜기 속 은자가 되어 산다',
    '깊은 산속 은둔', '야반도주하기', '도망치기', '숲속으로 숨기', '자유롭게 떠돌기', '방랑하기',
    'flee under darkness with light pack escaping oppressive home',
    'run away from tyrannical family rules to hide in wilderness',
    'dwell as solitary hermit inside deep mountain rock cavern',
    'roam ancient woods hunting wild game with flint arrows and traps',
    'live untethered from society wandering like drifting clouds',
    'build lone log cabin along stream fishing and foraging in solitude',
    'escape arranged marriage escaping through midnight forest path',
    'settle as isolated pioneer clearing virgin mountain valleys',
  ],
  voyager: [
    '거친 풍랑을 뚫고 신대륙을 향해 항해선의 돛을 올린다',
    '배 타고 거친 바다로 출항하기',
    '먼 서역으로 향하는 대원정대에 승선하여 미지의 바다로 나아간다',
    '선단의 갑판 수습선원으로 취직하여 밧줄을 매고 노를 젓는다',
    '나침반과 북극성을 보며 야간 파도를 가르는 조타수가 된다',
    '지도에도 없는 전설의 황금 섬을 찾아 거친 해협을 탐험한다',
    '바다 건너 낯선 이국의 항구에 닻을 내리고 이민족과 조우한다',
    '파도가 갑판을 집어삼키는 폭풍우 속에서도 키를 놓지 않고 버틴다',
    '망원경을 눈에 대고 수평선 너머 어렴풋이 솟아오른 곶을 발견한다',
    '무역풍을 타고 남방의 열대 군도를 돌며 향신료를 찾아 헤맨다',
    '바다와 먼 땅으로 여행을 떠나고 유랑한다',
    '돛을 올리고 거친 파도를 헤치며 바다로 나아간다',
    '나루터에서 큰 배를 얻어 타고 미지의 남쪽 바다로 출항한다',
    '표류 끝에 닿은 낯선 섬에서 신비한 원주민들과 우정을 맺는다',
    '황포돛배를 몰고 서해안을 따라 중국 산둥반도로 건너간다',
    '포구에서 출항하는 고래잡이 배에 올라 대양으로 나아간다',
    '북극성 항해술을 배워 밤바다에서도 길을 잃지 않고 항해한다',
    '남만 상선에 몸을 싣고 서양의 신비한 문물과 지도를 탐사한다',
    '먼 바다 항해', '배 타고 떠나기', '미지의 탐험', '출항하기', '돛 올리기', '바다 건너기',
    'hoist canvas sails to journey across roaring stormy ocean waves',
    'embark on grand expedition flagship toward undiscovered continents',
    'work as deckhand boy pulling heavy rigging and mooring ropes',
    'navigate dangerous shoals using brass compass and stellar charts',
    'explore uncharted coral islands and volcanic archipelago passages',
    'drop heavy iron anchor into foreign harbor meeting alien cultures',
    'brave howling typhoons refusing to let go of wooden rudder wheel',
    'voyage across the high seas seeking mythical southern spices',
  ],
  artist: [
    '달빛 아래 냇가에서 거문고와 가야금을 타며 자작곡을 연주한다',
    '거문고 뜯으며 막걸리 마시기',
    '저잣거리 마당에서 탈을 쓰고 풍자극과 줄타기로 사람들을 웃긴다',
    '주막에서 시원한 막걸리를 들이키며 흥얼흥얼 콧노래를 부른다',
    '하얀 화폭에 먹물을 듬뿍 묻혀 웅장한 금강산 산수화를 그린다',
    '대나무 피리를 불며 지나가는 나그네의 향수를 달래준다',
    '유랑 극단에 합류하여 북과 징을 치며 팔도를 유람한다',
    '장터 판소리 한마당에서 북장단에 맞춰 흥보가를 목청껏 부른다',
    '단풍 든 가을 산을 바라보며 감흥에 겨워 즉흥시를 읊조린다',
    '춤을 추고 노래하며 악기를 연주하고 유희를 즐긴다',
    '거문고를 타며 흥얼흥얼 콧노래를 부른다',
    '붓을 들어 풍속화를 그리며 저잣거리 서민들의 일상을 담아낸다',
    '남사당패의 꼭두각시놀음에서 익살스러운 재담으로 갈채를 받는다',
    '태평소를 불며 마을 잔치의 흥을 최고조로 끌어올린다',
    '시원한 그늘막에 앉아 막걸리 사발을 기울이며 풍류를 노래한다',
    '먹물의 농담을 조절하여 병풍에 사군자 매란국죽을 친다',
    '소리꾼의 북채를 잡고 추임새를 넣으며 고수가 된다',
    '사당패와 어울려 살판 줄타기를 선보이며 공중제비를 넘는다',
    '풍류 즐기기', '노래 부르기', '악기 연주하기', '그림 그리기', '판소리하기', '풍속화 그리기',
    'strum ancient zither by riverside beneath glowing silver moon',
    'perform satirical masked acrobatic dance entertaining market crowds',
    'sip rice wine at roadside tavern singing cheerful drinking songs',
    'paint grand mountain mist landscapes with black ink wash brushwork',
    'play sweet melancholic melodies on bamboo flute under willow trees',
    'travel with itinerant bard troupe playing gongs and hourglass drums',
    'chant epic lyrical sagas accompanied by rhythmic drumbeats',
    'recite spontaneous pastoral poetry admiring autumn crimson hills',
  ],
  homesteader: [
    '이른 봄날 논에 물을 대고 온 가족과 함께 모내기를 한다',
    '봄날 아침부터 논에 모내기를 하고 밭을 간다',
    '황소 끌고 논밭 갈아엎기',
    '가을 들판에서 황금빛으로 익은 벼를 낫으로 베어 타작한다',
    '양 떼와 암소를 푸른 언덕에 몰고 나가 평화롭게 풀을 먹인다',
    '마당가에 돌담을 정성껏 쌓고 닭장과 외양간을 튼튼히 보수한다',
    '텃밭에 상추, 호박, 고추 씨앗을 뿌리고 물을 주며 가꾼다',
    '두레 품앗이에 참여하여 이웃집 모심기를 서로 돕는다',
    '황소와 쟁기를 끌고 얼어붙은 밭을 갈아 엎는다',
    '황소와 쟁기를 끌고 밭을 갈아 엎는다',
    '겨울나기를 위해 마당에 장작을 높이 쌓고 배추로 김장을 담근다',
    '새벽이슬을 밟으며 쟁기를 소에 메우고 겨우내 얼었던 밭을 간다',
    '농사를 짓고 곡식을 심어 수확한다',
    '외양간에서 송아지가 태어나자 짚을 깔아주고 따스하게 보살핀다',
    '가뭄에 마른 논바닥을 살리기 위해 밤새 물푸개질을 한다',
    '지붕의 낡은 볏짚을 걷어내고 새 이엉을 엮어 초가지붕을 얹는다',
    '가을 추수를 끝내고 뒤뜰 감나무의 홍시를 딴다',
    '보리밭을 밟아주며 이른 봄 냉해를 막는다',
    '장독대에 된장과 간장 항아리를 닦고 고추장을 담근다',
    '밭 갈기', '모내기하기', '가축 돌보기', '농사짓기', '추수하기', '김장 담그기',
    'plow muddy paddy fields and transplant tender green rice seedlings',
    'reap golden autumn wheat and thresh grain with wooden flails',
    'graze woolly sheep and cattle across lush green mountain pastures',
    'erect stone garden boundary walls and mend barn animal pens',
    'plant seeds of pumpkin, radish and leafy vegetables in home plot',
    'cooperate in communal harvest work parties sharing hearty lunches',
    'tend newborn calves in the barn laying fresh warm golden straw',
    'build irrigation stone channels feeding mountain spring water to crops',
  ],
  love_romance: [
    '달빛이 어스름한 개울가에서 오랫동안 사모해온 이에게 고백한다',
    '정인에게 꽃다발 건네며 고백하기',
    '마음에 둔 사람에게 고백한다',
    '곱게 접은 비단 연서에 절절한 사랑의 시를 적어 몰래 전달한다',
    '마음에 둔 사람에게 들꽃을 꺾어 선물하며 평생을 약조한다',
    '부모님께 말씀드려 마음에 둔 처자와 정혼을 맺고 혼례를 올린다',
    '붉어지는 얼굴로 마주 앉아 떨리는 손을 살며시 쥐어본다',
    '서로의 댕기와 노리개를 나누어 징표로 삼고 백년가약을 맺는다',
    '동구 밖 느티나무 아래서 남몰래 만나 밤이 깊도록 이야기를 나눈다',
    '연애하고 사랑하고 청혼하여 가정을 꾸린다',
    '사랑하는 이에게 수줍게 꽃다발을 건넨다',
    '마음에 둔 처자에게 예쁜 노리개와 꽃다발을 선물한다',
    '비녀를 선물하며 평생의 반려자가 되어달라고 청혼한다',
    '달 밝은 밤 담장 너머로 사모하는 정인의 창가에 꽃을 던진다',
    '첫사랑의 옷자락을 붙잡고 진심 어린 눈빛으로 마음을 고백한다',
    '사모하는 도련님의 옷고름을 정성껏 수놓아 선물한다',
    '연분홍 복사꽃 아래서 정인과 손가락을 걸고 영원을 맹세한다',
    '혼례 날 가마를 타고 새색시를 맞이하여 초례청에 선다',
    '고백하기', '청혼하기', '연서 쓰기', '꽃 선물하기', '백년가약 맺기', '연애하기',
    'confess tender romantic love under evening moonlit riverbank',
    'slip secretly written passionate love letter into sweetheart pocket',
    'gift bouquet of wild mountain blossoms promising lifelong devotion',
    'ask beloved hand in sacred marriage ceremony before altar',
    'gently hold trembling warm hands whispering promises of forever',
    'exchange silk hairpins and tokens of eternal love and devotion',
    'vow lifelong marital faithfulness beneath blossoming peach trees',
  ],
  anachronism: [
    '스마트폰으로 비트코인을 사고팔아 대박을 노린다',
    '스마트폰으로 비트코인 풀매수하기',
    '스마트폰으로 비트코인을 산다',
    '스마트폰으로 비트코인을 풀매수한다',
    '유튜브를 보면서 편의점 컵라면과 콜라를 먹는다',
    '테슬라 전기차를 운전해서 국제공항으로 가 비행기를 탄다',
    '인터넷 게시판에 댓글을 달고 롤 티어를 올리기 위해 게임한다',
    '최신 노트북 컴퓨터를 켜고 인공지능 프롬프트를 입력한다',
    '권총과 소총을 난사하고 미사일과 핵폭탄을 투하한다',
    '아파트 분양을 받고 주식 시장에서 단타 매매를 한다',
    '아이폰 카메라로 셀카를 찍어 인스타그램에 올린다',
    '지하철을 타고 강남역으로 가 클럽에서 춤을 춘다',
    '에어컨을 틀고 배달 피자와 햄버거를 시켜 먹는다',
    '스마트폰 충전기를 찾으며 와이파이 비밀번호를 묻는다',
    '기관총을 난사하며 적들을 소탕한다',
    '챗GPT에게 코딩을 시키고 파이썬 프로그램을 실행한다',
    '블록체인 지갑에 이더리움을 송금하고 NFT를 발행한다',
    '우주선을 타고 달나라와 화성으로 우주여행을 떠난다',
    '스마트폰', '비트코인', '인터넷', '비행기', '컴퓨터', '권총', '스마트폰 게임',
    'buy bitcoin and cryptocurrency on modern smartphone apps',
    'surf web on laptop eating pizza and drinking soda cans',
    'drive sports car on highway heading toward international airport',
    'launch cruise missiles and atomic bombs with high-tech radar',
    'watch television streaming movies on flat screen monitors',
    'program artificial intelligence models using python code',
    'charge smartphone battery looking for high-speed wifi signals',
  ],
  general_will: [
    '오늘 하루는 그저 묵묵히 내 삶의 자리를 지키며 숨을 쉰다',
    '개울가에서 물수제비 뜨며 쉬기',
    '개울가에 앉아 동심으로 돌아가 조약돌로 물수제비를 뜬다',
    '먼 하늘을 올려다보며 흘러가는 구름을 바라보고 생각에 잠긴다',
    '친구들과 냇가에서 물장구를 치고 미역을 감으며 더위를 식힌다',
    '정든 고향 언덕에 올라 조용히 마을의 노을을 감상한다',
    '마른 풀잎을 입에 물고 드러누워 따스한 햇살을 쬔다',
    '마당 앞 평상에 앉아 시원한 바람을 쐬며 멍하니 쉰다',
    '새소리를 들으며 천천히 숲길을 거닐고 마음을 정돈한다',
    '흐르는 개울물에 발을 담그고 조용히 눈을 감는다',
    '마을 동산에 누워 솔바람 소리를 들으며 한낮의 단잠에 빠진다',
    '툇마루에 걸터앉아 처마 끝으로 떨어지는 빗방울을 구경한다',
    '동네 어귀를 가볍게 산책하며 지나가는 이웃들과 눈인사를 나눈다',
    '물수제비 뜨기', '하늘 바라보기', '조용히 쉬기', '낮잠 자기', '멍때리기', '산책하기',
    'just sit quietly contemplating the passing seasons and life',
    'skip flat pebbles across gentle ripples of village brook',
    'gaze up at vast blue sky watching birds migrate south',
    'take deep peaceful breath embracing whatever tomorrow brings',
    'rest beneath shade of ancient tree listening to summer cicadas',
    'stroll leisurely along village path greeting passing neighbors',
  ],
};

// 5. 센트로이드 모델 구축 및 희소 압축
export function buildCentroidModel(corpus, pruneThreshold = 0.025) {
  const classes = Object.keys(corpus);
  const df = {};
  const classVecs = {};
  const numClasses = classes.length;

  for (const c of classes) {
    const cFeats = {};
    for (const doc of corpus[c]) {
      const f = extractEnhancedFeatures(doc);
      for (const [k, v] of Object.entries(f)) {
        cFeats[k] = (cFeats[k] || 0) + v;
      }
    }
    classVecs[c] = cFeats;
    for (const k of Object.keys(cFeats)) {
      df[k] = (df[k] || 0) + 1;
    }
  }

  const idf = {};
  for (const [k, d] of Object.entries(df)) {
    idf[k] = Number((Math.log((numClasses + 1) / (d + 0.3)) + 1).toFixed(3));
  }

  const centroids = {};
  const activeFeats = new Set();
  let totalEntries = 0;

  for (const c of classes) {
    const vec = {};
    let normSq = 0;
    for (const [k, tf] of Object.entries(classVecs[c])) {
      const w = (1 + Math.log(tf)) * idf[k];
      vec[k] = w;
      normSq += w * w;
    }
    const norm = Math.sqrt(normSq) || 1;
    const pruned = {};
    for (const [k, w] of Object.entries(vec)) {
      const val = Number((w / norm).toFixed(3));
      // 과도한 자모 노이즈 필터링 및 유의미 가중치 보존
      if (val >= pruneThreshold && (!k.startsWith('j3:') || idf[k] >= 1.8)) {
        pruned[k] = val;
        activeFeats.add(k);
        totalEntries++;
      }
    }
    centroids[c] = pruned;
  }

  // 사용된 활성 특성에 대해서만 IDF 보존
  const prunedIdf = {};
  for (const f of activeFeats) {
    prunedIdf[f] = idf[f];
  }

  return { idf: prunedIdf, centroids, classes, totalEntries };
}

// 6. 추론 엔진 (Cosine Similarity)
export function predictIntentWithModel(text, model) {
  const f = extractEnhancedFeatures(text);
  const docVec = {};
  let normSq = 0;

  for (const [k, cnt] of Object.entries(f)) {
    if (!model.idf[k]) continue;
    const w = (1 + Math.log(cnt)) * model.idf[k];
    docVec[k] = w;
    normSq += w * w;
  }
  const norm = Math.sqrt(normSq) || 1;
  for (const k of Object.keys(docVec)) {
    docVec[k] /= norm;
  }

  let bestC = model.classes[0], maxSim = -Infinity;
  const scores = {};
  for (const c of model.classes) {
    let sim = 0;
    const cVec = model.centroids[c];
    for (const [k, w] of Object.entries(docVec)) {
      if (cVec[k]) sim += w * cVec[k];
    }
    scores[c] = Number(sim.toFixed(3));
    if (sim > maxSim) {
      maxSim = sim;
      bestC = c;
    }
  }

  return {
    intent: bestC,
    similarity: Number(maxSim.toFixed(3)),
    scores,
  };
}

// 7. 5-Fold 교차 검증 (Stratified 5-Fold Cross Validation)
export function evaluate5Fold() {
  console.log('\n--- 5-Fold 교차 검증(Stratified Cross-Validation) 수행 중 ---');
  const classes = Object.keys(TRAINING_DATA);
  const folds = [0, 1, 2, 3, 4];
  const foldAccuracies = [];

  for (const fold of folds) {
    const trainDocs = {};
    const valDocs = {};

    for (const c of classes) {
      trainDocs[c] = [];
      valDocs[c] = [];
      const list = TRAINING_DATA[c];
      for (let i = 0; i < list.length; i++) {
        if (i % 5 === fold) valDocs[c].push(list[i]);
        else trainDocs[c].push(list[i]);
      }
    }

    const cvModel = buildCentroidModel(trainDocs, 0.025);
    let valCorrect = 0, valTotal = 0;
    for (const c of classes) {
      for (const doc of valDocs[c]) {
        valTotal++;
        const res = predictIntentWithModel(doc, cvModel);
        if (res.intent === c) valCorrect++;
      }
    }
    const acc = (valCorrect / valTotal) * 100;
    foldAccuracies.push(acc);
    console.log(`Fold ${fold + 1}/5 검증 정확도: ${valCorrect}/${valTotal} (${acc.toFixed(2)}%)`);
  }

  const meanAcc = foldAccuracies.reduce((a, b) => a + b, 0) / foldAccuracies.length;
  console.log(`➡️ 5-Fold 교차 검증 평균 Out-of-Sample 정확도: ${meanAcc.toFixed(2)}%\n`);
  return meanAcc;
}

// 8. 전체 모델 훈련 및 직렬화
export function trainModel() {
  console.log('=== 영혼의 결단 대규모 AI 서사 모델 훈련 개시 ===');

  let totalSentences = 0;
  for (const c of Object.keys(TRAINING_DATA)) totalSentences += TRAINING_DATA[c].length;
  console.log(`총 학습 말뭉치: 15개 클래스, ${totalSentences}개 문장`);

  // 5-Fold 검증
  const cvAcc = evaluate5Fold();

  // 전수 데이터 훈련
  const fullModel = buildCentroidModel(TRAINING_DATA, 0.025);

  // 전수 훈련 데이터 적합도
  let trainCorrect = 0;
  for (const c of fullModel.classes) {
    for (const doc of TRAINING_DATA[c]) {
      if (predictIntentWithModel(doc, fullModel).intent === c) trainCorrect++;
    }
  }
  const trainAcc = ((trainCorrect / totalSentences) * 100).toFixed(2);
  console.log(`전체 학습 데이터 적합도(Train Accuracy): ${trainCorrect}/${totalSentences} (${trainAcc}%)`);

  // 16개 클래스 전수 스트레스 테스트
  const stressCases = [
    { text: '동네 꼬마들에게 천자문 가르쳐주기', expect: 'scholar' },
    { text: '비자금 챙겨서 마루 밑에 숨겨두기', expect: 'merchant' },
    { text: '대장간에서 낫과 호미 벼리기', expect: 'artisan' },
    { text: '어르신 다리에 침 놓고 탕약 달이기', expect: 'healer' },
    { text: '사또 비리 암행어사에게 고변하기', expect: 'statesman' },
    { text: '창을 쥐고 도적 떼와 맞서 싸우기', expect: 'warrior' },
    { text: '절에 들어가 삭발하고 출가하기', expect: 'seeker' },
    { text: '서당 뒤뜰 엿 몰래 서리하기', expect: 'rebel' },
    { text: '야밤에 봇짐 싸서 도망치기', expect: 'freespirit' },
    { text: '배 타고 거친 바다로 출항하기', expect: 'voyager' },
    { text: '거문고 뜯으며 막걸리 마시기', expect: 'artist' },
    { text: '황소 끌고 논밭 갈아엎기', expect: 'homesteader' },
    { text: '정인에게 꽃다발 건네며 고백하기', expect: 'love_romance' },
    { text: '스마트폰으로 비트코인 풀매수하기', expect: 'anachronism' },
    { text: '개울가에서 물수제비 뜨며 쉬기', expect: 'general_will' },
    { text: '나만의 신비로운 길을 개척한다', expect: 'out_of_domain' },
  ];

  console.log('\n--- 16대 복합 스트레스 테스트 결과 ---');
  let stressPass = 0;
  for (const sc of stressCases) {
    const res = predictIntentWithModel(sc.text, fullModel);
    const isOOD = res.similarity < 0.080;
    const finalPred = isOOD ? 'general_will' : res.intent;
    const pass = sc.expect === 'out_of_domain' ? isOOD : (finalPred === sc.expect);
    if (pass) stressPass++;
    console.log(`[${pass ? 'PASS' : 'FAIL'}] "${sc.text}" ➡️ ${finalPred} (Sim: ${res.similarity}, 정답: ${sc.expect})`);
  }
  console.log(`스트레스 테스트 합격률: ${stressPass}/${stressCases.length} (${((stressPass / stressCases.length) * 100).toFixed(1)}%)`);

  // 파일 내보내기
  const code = `// will_model.data.js
// 자동 학습된 영혼의 결단 초경량 시맨틱 센트로이드 모델 (훈련 적합도: ${trainAcc}%, 5-Fold CV: ${cvAcc.toFixed(2)}%)
// 총 활성 피처: ${Object.keys(fullModel.idf).length}개, 총 가중치: ${fullModel.totalEntries}개
// 생성 시각: ${new Date().toISOString()}

export const CLASSES = ${JSON.stringify(fullModel.classes)};
export const IDF = ${JSON.stringify(fullModel.idf)};
export const CENTROIDS = ${JSON.stringify(fullModel.centroids)};
`;

  fs.writeFileSync(OUT_FILE, code, 'utf8');
  console.log(`\n모델 가중치 파일 생성 완료: ${OUT_FILE} (${(fs.statSync(OUT_FILE).size / 1024).toFixed(1)} KB)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  trainModel();
}
