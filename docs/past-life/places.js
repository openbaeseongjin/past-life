// 지역 7개와 땅 이름표. 비율은 world.js (OWID·HYDE) 를 기준 해 사이 선형 보간 (설계 3장)
// 땅 이름은 지리 이름 + 오늘날 나라 (왕조·나라 이름은 시대가 틀릴 수 있어 쓰지 않는다)
import { YEARS, REGION_SHARE, AREA_SHARE } from './world.js';

export const REGIONS = ['east', 'south', 'west', 'europe', 'africa', 'americas', 'seaoc'];
export const REGION_NAME = {
  east: { ko: '동아시아', en: 'East Asia' },
  south: { ko: '남아시아', en: 'South Asia' },
  west: { ko: '서아시아·북아프리카', en: 'West Asia & N. Africa' },
  europe: { ko: '유럽', en: 'Europe' },
  africa: { ko: '사하라 이남 아프리카', en: 'Sub-Saharan Africa' },
  americas: { ko: '아메리카', en: 'The Americas' },
  seaoc: { ko: '동남아시아·오세아니아', en: 'SE Asia & Oceania' },
};
// coast: 바닷가가 있다 (물에 빠짐·바다 집안·바다 타일). 바다에 닿는 나라가 하나라도 크게 있으면 true · river: 큰 강 (강 타일)
const A = (region, coast, river, ko, en, sko, sen) => ({ region, coast, river, ko, en, short: { ko: sko, en: sen } });
export const AREAS = {
  china: A('east', true, true, '오늘날의 중국 땅', 'what is now China', '중국 땅', 'China'),
  japan: A('east', true, false, '일본 열도', 'the Japanese islands', '일본 열도', 'Japan'),
  korea: A('east', true, true, '한반도', 'the Korean Peninsula', '한반도', 'Korea'),
  mongolia: A('east', false, false, '몽골 초원', 'the Mongolian steppe', '몽골 초원', 'the steppe'),
  india: A('south', true, true, '오늘날의 인도 땅', 'what is now India', '인도 땅', 'India'),
  bengal: A('south', true, true, '갠지스 하구 (오늘날 방글라데시)', 'the Ganges delta (now Bangladesh)', '갠지스 하구', 'the Ganges delta'),
  indus: A('south', true, true, '인더스 강 유역 (오늘날 파키스탄·아프가니스탄)', 'the Indus lands (now Pakistan and Afghanistan)', '인더스 강가', 'the Indus'),
  himalaya: A('south', false, true, '히말라야 기슭 (오늘날 네팔·부탄)', 'the Himalayan foothills (now Nepal and Bhutan)', '히말라야 기슭', 'the foothills'),
  lanka: A('south', true, false, '스리랑카 섬', 'the island of Sri Lanka', '스리랑카', 'Sri Lanka'),
  anatolia: A('west', true, false, '아나톨리아 (오늘날 튀르키예)', 'Anatolia (now Türkiye)', '아나톨리아', 'Anatolia'),
  iran: A('west', true, false, '이란 고원', 'the Iranian plateau', '이란 고원', 'the plateau'),
  nile: A('west', true, true, '나일 강가 (오늘날 이집트·수단)', 'the Nile valley (now Egypt and Sudan)', '나일 강가', 'the Nile'),
  mesopotamia: A('west', true, true, '메소포타미아와 레반트 (오늘날 이라크·시리아 일대)', 'Mesopotamia and the Levant (now Iraq, Syria and nearby)', '메소포타미아', 'Mesopotamia'),
  arabia: A('west', true, false, '아라비아 반도', 'the Arabian Peninsula', '아라비아', 'Arabia'),
  maghreb: A('west', true, false, '북아프리카 해안 (마그레브)', 'the North African coast (the Maghreb)', '마그레브', 'the Maghreb'),
  steppe: A('west', false, true, '중앙아시아 초원과 오아시스', 'the steppes and oases of Central Asia', '중앙아시아', 'Central Asia'),
  east_europe: A('europe', true, true, '동유럽 평원 (오늘날 러시아·우크라이나·폴란드 일대)', 'the East European plain (now Russia, Ukraine, Poland)', '동유럽 평원', 'the eastern plain'),
  france: A('europe', true, true, '오늘날의 프랑스 땅', 'what is now France', '프랑스 땅', 'France'),
  italy: A('europe', true, false, '이탈리아 반도', 'the Italian peninsula', '이탈리아', 'Italy'),
  germany: A('europe', true, true, '독일 땅과 알프스 (오늘날 독일·오스트리아·체코 일대)', 'the German lands and the Alps', '독일 땅', 'the German lands'),
  iberia: A('europe', true, false, '이베리아 반도', 'the Iberian peninsula', '이베리아', 'Iberia'),
  britain: A('europe', true, false, '브리튼 섬과 아일랜드', 'Britain and Ireland', '브리튼', 'Britain'),
  nordic: A('europe', true, false, '북유럽', 'Scandinavia and the north', '북유럽', 'the north'),
  balkans: A('europe', true, true, '발칸 반도와 도나우 강가', 'the Balkans and the Danube', '발칸', 'the Balkans'),
  west_africa: A('africa', true, true, '서아프리카 (오늘날 나이지리아·가나 일대)', 'West Africa (now Nigeria, Ghana and nearby)', '서아프리카', 'West Africa'),
  east_africa: A('africa', true, false, '동아프리카 고원 (오늘날 에티오피아·케냐·탄자니아 일대)', 'the East African highlands', '동아프리카', 'East Africa'),
  congo: A('africa', true, true, '콩고 강 유역', 'the Congo basin', '콩고 강가', 'the Congo'),
  south_africa: A('africa', true, false, '아프리카 남부', 'southern Africa', '아프리카 남부', 'southern Africa'),
  mesoamerica: A('americas', true, false, '메소아메리카 (오늘날 멕시코·중앙아메리카)', 'Mesoamerica (now Mexico and Central America)', '메소아메리카', 'Mesoamerica'),
  andes: A('americas', true, false, '안데스 산지 (오늘날 페루·볼리비아·콜롬비아 일대)', 'the Andes (now Peru, Bolivia, Colombia)', '안데스', 'the Andes'),
  brazil: A('americas', true, true, '오늘날의 브라질 땅', 'what is now Brazil', '브라질 땅', 'Brazil'),
  north_america: A('americas', true, true, '북아메리카', 'North America', '북아메리카', 'North America'),
  la_plata: A('americas', true, true, '라플라타 강 일대 (오늘날 아르헨티나·우루과이)', 'the River Plate (now Argentina and Uruguay)', '라플라타', 'the River Plate'),
  caribbean: A('americas', true, false, '카리브 섬들', 'the Caribbean islands', '카리브', 'the Caribbean'),
  indonesia: A('seaoc', true, false, '인도네시아 섬들', 'the islands of Indonesia', '인도네시아', 'Indonesia'),
  mainland_sea: A('seaoc', true, true, '동남아시아 대륙부 (오늘날 미얀마·타이·베트남 일대)', 'mainland Southeast Asia (now Myanmar, Thailand, Vietnam)', '동남아 대륙', 'the Mekong lands'),
  philippines: A('seaoc', true, false, '필리핀 섬들', 'the Philippine islands', '필리핀', 'the Philippines'),
  malay: A('seaoc', true, false, '말레이 반도', 'the Malay peninsula', '말레이', 'Malaya'),
  australia: A('seaoc', true, false, '오스트레일리아와 뉴질랜드', 'Australia and New Zealand', '오스트레일리아', 'Australia'),
  pacific: A('seaoc', true, false, '뉴기니와 태평양 섬들', 'New Guinea and the Pacific islands', '태평양 섬', 'the islands'),
};

// 기준 해 사이 선형 보간 (범위 밖은 끝 값)
function at(row, year) {
  const y = Math.max(YEARS[0], Math.min(YEARS[YEARS.length - 1], year));
  let i = 0;
  while (i < YEARS.length - 2 && y >= YEARS[i + 1]) i++;
  const f = (y - YEARS[i]) / (YEARS[i + 1] - YEARS[i]);
  return row[i] + (row[i + 1] - row[i]) * f;
}
export const regionShare = (region, year) => at(REGION_SHARE[region], year);
export const areaShare = (region, area, year) => at(AREA_SHARE[region][area], year);

// 오늘날 사람(현생 인류)이 처음 닿은 해 (대략). 기원전 1만 년 비율을 그 앞으로 끌어 쓰면 사람이 없던 땅에서도 태어나서,
// 이 해 전에는 그 지역·땅의 가중치를 0으로 하고 나머지끼리 나눈다. africa·west(북아프리카·레반트)는 처음부터
export const ARRIVE = { south: -60000, seaoc: -55000, east: -50000, europe: -45000, americas: -16000 };
// 지역 안에서 더 늦게 닿은 땅. west 는 북아프리카(나일·마그레브)만 처음부터 열고, 레반트·메소포타미아·아라비아·이란은 −60000,
// 아나톨리아·중앙아시아는 더 늦은 −45000. 그 밖에 일본 열도, 빙하가 물러난 뒤의 브리튼·북유럽, 카리브 섬들
export const AREA_ARRIVE = { mesopotamia: -60000, arabia: -60000, iran: -60000, anatolia: -45000, steppe: -45000, japan: -38000, britain: -12000, nordic: -11000, caribbean: -4000 };
export const settled = (region, area, year) => year >= (ARRIVE[region] ?? -Infinity) && year >= (AREA_ARRIVE[area] ?? -Infinity);

// 그해 사람 비율대로 지역과 땅을 뽑는다 (사람이 아직 닿지 않은 지역·땅은 빼고)
export function drawPlace(rng, year) {
  const open = (g) => Object.keys(AREA_SHARE[g]).filter((a) => settled(g, a, year));
  const regionW = (g) => {
    if (year < (ARRIVE[g] ?? -Infinity)) return 0;
    const all = Object.keys(AREA_SHARE[g]), ok = open(g);
    if (ok.length === all.length) return regionShare(g, year);
    const sum = (list) => list.reduce((s, a) => s + areaShare(g, a, year), 0);
    return regionShare(g, year) * sum(ok) / sum(all);   // 닿지 않은 땅 몫만큼 지역도 줄인다
  };
  const region = rng.weighted(REGIONS, regionW) || 'africa';
  const areas = open(region);
  const area = rng.weighted(areas, (a) => areaShare(region, a, year)) || areas[0];
  return { region, area };
}
