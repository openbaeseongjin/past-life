// 태어난 땅 → 무대 (설계 3.2 마을 세트 · 3.3 땅 모습). three 없는 순수 모듈 (Node 시험: test/lands.test.mjs)
// stageOf(birth) → { kit, land, era, setting, variant }
//   land   : 땅 모습 여섯 가지 (temperate 들판 · dry 사막·마른 땅 · monsoon 논 · steppe 초원 · cold 추운 북쪽 · tropical 열대 숲·바닷가)
//   kit    : 그 땅·시대에 맞는 마을 세트 이름 (england · mudbrick · eastasia · southasia · africa · steppe · earlymodern · modern)
//   era    : 엔진의 시대 묶음 그대로 (birth.group, 없으면 births.js groupOf(year)): forager · ancient · medieval · early · industrial · modern
//   setting: 집안이 사는 자리 (village 농사 마을 · camp 야영지 · street 거리 · estate 큰 집 · shore 바닷가 · factory 공장 동네). 수렵 시대(forager)는 늘 camp
//   variant: 같은 세트 안의 지붕·벽·옷 물감 차이를 고를 열쇠 (지금은 땅 이름 그대로)
// 시대는 엔진과 같은 값만 쓴다: 집안(households.js)도 같은 묶음에서 뽑히므로 {era, setting} 이 서로 어긋나지 않는다.
//   수렵 시대 → 야영지 세트(steppe) + camp, 1950년부터(modern) → modern 세트, 그 사이는 땅의 문화 세트(+ 시대별 바꿈).
// 지은 세트(BUILT_KITS): england(1단계), southasia(2단계 작업 1), eastasia(2단계 작업 2), mudbrick(2단계 작업 3). 무대(realscene.js)는 없는 세트를 england 로 대신 쓰고, 땅 모습(LAND_LOOK)만 바꾼다.
// 2단계에서 setting 은 문화 세트 위의 배치 요리법으로 짓는다 (수수한 집·읍내 집·큰 집 + 천막을 어떻게 늘어놓을지).
// stageSeed(birth) → 마을 배치·꾸미기·사람 고르기에 쓰는 32비트 정수 (출생 시드 문자열에서, 결정적)
import { AREAS } from './places.js';
import { hash } from './rng.js';
import { groupOf } from './births.js';

export const LANDS = ['temperate', 'dry', 'monsoon', 'steppe', 'cold', 'tropical'];
export const KITS = ['england', 'mudbrick', 'eastasia', 'southasia', 'africa', 'steppe', 'earlymodern', 'modern'];
export const ERAS = ['forager', 'ancient', 'medieval', 'early', 'industrial', 'modern'];   // births.js groupOf 의 묶음과 같은 이름
export const SETTINGS = ['village', 'camp', 'street', 'estate', 'shore', 'factory'];
export const BUILT_KITS = ['england', 'southasia', 'eastasia', 'mudbrick'];

// 집안(households.js 의 id) → 사는 자리. serve 는 큰 집의 하인이라 estate
export const HOUSEHOLD_SETTING = {
  farm: 'village', band: 'camp', herd: 'camp', craft: 'street', trade: 'street', shop: 'street', pro: 'street', office: 'street',
  elite: 'estate', serve: 'estate', fish: 'shore', sail: 'shore', factory: 'factory',
};
export const settingOf = (household, era) => (era === 'forager' ? 'camp' : HOUSEHOLD_SETTING[household] || 'village');

// 땅마다 [땅 모습, 문화 세트, 시대별 세트 바꿈 [[해, 세트], …]]
//   세트 바꿈은 「그 해부터」다. 수렵 시대는 steppe(야영지), 1950년부터는 modern (kitOf).
//   유럽은 1800년부터 근세·산업 세트(벽돌·굴뚝), 식민 이후 아메리카·오스트레일리아는 그 시기의 가장 가까운 세트.
//   아메리카 원주민·오스트레일리아 원주민·초원 유목 땅은 문화 세트가 steppe(천막·야영지 세트)다.
const EU = [[1800, 'earlymodern']];
export const AREA_STAGE = {
  // 동아시아
  china: ['monsoon', 'eastasia'],
  japan: ['monsoon', 'eastasia'],
  korea: ['monsoon', 'eastasia'],
  mongolia: ['steppe', 'steppe'],                           // 유목: 초원 천막 세트
  // 남아시아
  india: ['monsoon', 'southasia'],
  bengal: ['monsoon', 'southasia'],
  indus: ['dry', 'southasia'],
  himalaya: ['monsoon', 'southasia'],
  lanka: ['tropical', 'southasia'],
  // 서아시아·북아프리카
  anatolia: ['dry', 'mudbrick'],
  iran: ['dry', 'mudbrick'],
  nile: ['dry', 'mudbrick'],
  mesopotamia: ['dry', 'mudbrick'],
  arabia: ['dry', 'mudbrick'],
  maghreb: ['dry', 'mudbrick'],
  steppe: ['steppe', 'steppe', [[-4000, 'mudbrick']]],     // 중앙아시아: 기원전 4000년부터 오아시스 마을
  // 유럽
  east_europe: ['cold', 'england', EU],
  france: ['temperate', 'england', EU],
  italy: ['temperate', 'england', EU],
  germany: ['temperate', 'england', EU],
  iberia: ['dry', 'england', EU],
  britain: ['temperate', 'england', EU],
  nordic: ['cold', 'england', EU],
  balkans: ['temperate', 'england', EU],
  // 사하라 이남 아프리카
  west_africa: ['tropical', 'africa'],
  east_africa: ['steppe', 'africa'],
  congo: ['tropical', 'africa'],
  south_africa: ['steppe', 'africa'],
  // 아메리카
  mesoamerica: ['tropical', 'mudbrick'],
  andes: ['cold', 'mudbrick'],
  brazil: ['tropical', 'africa', [[1550, 'mudbrick'], [1850, 'earlymodern']]],
  north_america: ['temperate', 'steppe', [[1650, 'england'], [1800, 'earlymodern']]],
  la_plata: ['steppe', 'steppe', [[1600, 'mudbrick'], [1850, 'earlymodern']]],
  caribbean: ['tropical', 'africa', [[1500, 'mudbrick'], [1850, 'earlymodern']]],
  // 동남아시아·오세아니아
  //   동남아 4곳은 남아시아 세트를 빌려 쓴다 (건물·나무·논은 같다). 다만 나가라 사원은 두지 않고(villageplan.js PIECE_GATES → 신당),
  //   사람은 갈래 seasia (villagers_seasia.glb: 사롱·머리 수건·짧은 웃옷, 터번·사리 없음 — kitdata.js KIT_SETS.southasia.flavors). 고대 생도 같은 표가 거른다.
  indonesia: ['monsoon', 'southasia'],
  mainland_sea: ['monsoon', 'southasia'],
  philippines: ['monsoon', 'southasia'],
  malay: ['tropical', 'southasia'],
  australia: ['dry', 'steppe', [[1790, 'earlymodern']]],
  pacific: ['tropical', 'africa'],
};

// 시대 묶음: 엔진이 출생에 붙인 group 을 그대로 (없으면 그 해의 groupOf)
export const eraOf = (birth) => (birth && ERAS.includes(birth.group) ? birth.group : groupOf(birth && Number.isFinite(birth.year) ? birth.year : 1329));

// 그 땅·그 해(·그 시대)의 세트
export function kitOf(area, year, era = groupOf(year)) {
  if (era === 'forager') return 'steppe';
  if (era === 'modern') return 'modern';
  const row = AREA_STAGE[area];
  if (!row) return 'england';
  let kit = row[1];
  for (const [y, k] of row[2] || []) if (year >= y) kit = k;
  return kit;
}

// 출생 → 무대. 모르는 땅은 들판 + 잉글랜드 세트
export function stageOf(birth) {
  const area = birth && AREAS[birth.area] ? birth.area : null;
  const year = birth && Number.isFinite(birth.year) ? birth.year : 1329;
  const era = eraOf(birth), setting = settingOf(birth && birth.household, era);
  if (!area) return { kit: kitOf(null, year, era), land: 'temperate', era, setting, variant: 'britain' };
  return { kit: kitOf(area, year, era), land: AREA_STAGE[area][0], era, setting, variant: area };
}

// 지금 지은 세트로 그리기: 아직 없는 세트는 england 로 (2단계에서 세트가 늘면 BUILT_KITS 에 더한다)
export const builtKit = (kit) => (BUILT_KITS.includes(kit) ? kit : 'england');
// 무대가 그릴 세트 (작업 2-2): 지은 세트면 그대로. 수렵 시대(forager) 생인데 그 땅의 문화 세트가 야영을 그릴 수 있으면(CAMP_KITS) 그 세트로
//   (동아시아 세트는 농사 전 해에 움집·야영 화덕만 짓는다 — villageplan.js recipeFor). 나머지는 builtKit 그대로 (england 대신 쓰기).
export const CAMP_KITS = ['eastasia'];
export function sceneKitOf(stage) {
  const k = builtKit(stage.kit);
  if (k === stage.kit || stage.era !== 'forager') return k;
  const own = AREA_STAGE[stage.variant] && AREA_STAGE[stage.variant][1];
  return CAMP_KITS.includes(own) ? own : k;
}

// 출생 시드(문자열) → 무대 시드 (32비트 정수, 0 이 아님)
export function stageSeed(birth) {
  const s = birth && birth.seed != null ? String(birth.seed) : '1329';
  return hash(s + '|stage') || 1329;
}

// ── 땅 모습 (realscene.js 가 잉글랜드 바탕 PRESETS 위에 덮는 값) ──
// grass·wheat: 풀·밭 색 곱 (RGB) · soil: 흙 색 곱 · dry: 풀을 마른 풀로 섞는 양 · bare: 맨흙 얼룩 양 · paddy: 밭에 물을 대어 논으로 (1 = 논)
// trees: 나무 수 배수 · mix: 나무 종 무게 (잉글랜드 세트의 종 이름: oak·ash·willow·birch·hawthorn·apple) · leaf: 잎 색 곱
// hedges: 산울타리 남기는 비율 · tufts·flowers: 풀포기·들꽃 수 배수 · tuft: 풀포기 색 곱
// sky: 하늘 습도 (탁도·레일리·미 산란) · fog: 안개 짙기 · clouds: 구름 문턱(클수록 구름이 적다) · maxElev: 한낮 해 높이(°, 위도)
export const LAND_LOOK = {
  temperate: {},
  dry: {
    grass: [0.98, 0.86, 0.56], wheat: [1.36, 1.12, 0.64], soil: [1.22, 1.02, 0.8], dry: 0.78, bare: 0.5,
    trees: 0.28, mix: { hawthorn: 3, apple: 3, oak: 1 }, leaf: [1.0, 0.94, 0.74], hedges: 0.3, hedge: [0.2, 0.19, 0.1],
    tufts: 0.45, flowers: 0.15, tuft: [1.18, 1.0, 0.66],
    sky: { turbidity: 3.8, rayleigh: 1.25, mie: 0.006, mieG: 0.8 }, fog: 0.00034, clouds: 0.74, maxElev: 72,
  },
  monsoon: {
    grass: [0.6, 0.98, 0.44], wheat: [1.0, 1.1, 0.6], paddy: 1, soil: [0.95, 0.92, 0.88],
    trees: 1.1, mix: { willow: 2, ash: 1.5, apple: 1.5, birch: 1, oak: 1 }, leaf: [0.9, 1.06, 0.84], hedges: 0.25,
    tufts: 1.15, flowers: 0.6, tuft: [0.92, 1.05, 0.85],
    sky: { turbidity: 5.5, rayleigh: 2.4, mie: 0.008, mieG: 0.84 }, fog: 0.0005, clouds: 0.46, maxElev: 74,
  },
  steppe: {
    grass: [0.92, 0.92, 0.56], wheat: [1.3, 1.15, 0.7], soil: [1.1, 1.0, 0.86], dry: 0.55, bare: 0.18,
    trees: 0.1, mix: { birch: 2, hawthorn: 2 }, hedges: 0.08, hedge: [0.16, 0.17, 0.09],
    tufts: 0.85, flowers: 0.5, tuft: [1.12, 1.06, 0.72],
    sky: { turbidity: 2.0, rayleigh: 1.6, mie: 0.0025, mieG: 0.8 }, fog: 0.0002, clouds: 0.6, maxElev: 62,
  },
  cold: {
    grass: [0.6, 0.8, 0.52], wheat: [1.16, 1.0, 0.64], soil: [0.92, 0.9, 0.88], dry: 0.18,
    trees: 1.0, mix: { birch: 4, ash: 1, oak: 0.5, hawthorn: 0.5 }, leaf: [0.82, 0.95, 0.86], hedge: [0.08, 0.12, 0.06],
    tufts: 0.8, flowers: 0.35, tuft: [0.9, 0.98, 0.9],
    sky: { turbidity: 1.8, rayleigh: 2.2, mie: 0.0022, mieG: 0.8 }, fog: 0.00024, clouds: 0.5, maxElev: 42,
  },
  tropical: {
    grass: [0.54, 0.98, 0.42], wheat: [1.05, 1.18, 0.52], soil: [1.12, 0.86, 0.7],
    trees: 1.25, mix: { oak: 3, ash: 2, willow: 1.5, apple: 1 }, leaf: [0.78, 1.08, 0.72], hedges: 0.6, hedge: [0.07, 0.15, 0.04],
    tufts: 1.25, flowers: 1.0, tuft: [0.85, 1.08, 0.8],
    sky: { turbidity: 6.5, rayleigh: 2.6, mie: 0.009, mieG: 0.86 }, fog: 0.0006, clouds: 0.44, maxElev: 80,
  },
};
