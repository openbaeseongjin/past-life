// 집안 표: 시대 묶음마다 (게임용 어림, 사료 아님 — 설계 3장). tags 는 카드 조건·사인에, wealth 는 시작 재산에 쓴다
import { FARM_FROM } from './context_data.js';

export const GROUPS = ['forager', 'ancient', 'medieval', 'early', 'industrial', 'modern'];
const H = (id, w, tags, wealth, ko, en, coast = false) => ({ id, w, tags, wealth, ko, en, coast });
export const HOUSEHOLDS = {
  forager: [H('band', 100, ['hunt'], 40, '사냥하고 채집하는 무리', 'a band of hunter-gatherers')],
  ancient: [
    H('farm', 60, ['farm'], 35, '농사짓는 집', 'a farming family'),
    H('herd', 10, ['herd'], 35, '가축 치는 집', 'a herding family'),
    H('fish', 6, ['sea'], 35, '고기잡이 집', 'a fishing family', true),
    H('craft', 8, ['craft'], 45, '장인의 집', "a craftworker's family"),
    H('serve', 10, ['serve'], 15, '남의 집 일을 하는 집', 'a family of servants'),
    H('elite', 6, ['elite'], 75, '사제와 귀족의 집', 'a family of priests and nobles'),
  ],
  medieval: [
    H('farm', 66, ['farm'], 35, '농사짓는 집', 'a farming family'),
    H('fish', 5, ['sea'], 35, '고기잡이 집', 'a fishing family', true),
    H('craft', 9, ['craft'], 45, '장인의 집', "a craftworker's family"),
    H('trade', 4, ['trade'], 55, '장사하는 집', 'a merchant family'),
    H('serve', 11, ['serve'], 15, '농노나 하인의 집', 'a family of serfs or servants'),
    H('elite', 5, ['elite'], 75, '영주나 관리의 집', 'a family of lords or officials'),
  ],
  early: [
    H('farm', 62, ['farm'], 35, '농사짓는 집', 'a farming family'),
    H('sail', 6, ['sea'], 40, '뱃사람 집', 'a seafaring family', true),
    H('craft', 10, ['craft'], 45, '장인의 집', "a craftworker's family"),
    H('trade', 7, ['trade'], 55, '장사하는 집', 'a merchant family'),
    H('serve', 9, ['serve'], 15, '남의 집 일을 하는 집', 'a family of servants'),
    H('elite', 6, ['elite'], 75, '지주나 귀족의 집', 'a family of landlords or nobles'),
  ],
  industrial: [
    H('farm', 48, ['farm'], 35, '농사짓는 집', 'a farming family'),
    H('factory', 16, ['factory'], 30, '공장 다니는 집', 'a factory family'),
    H('craft', 10, ['craft'], 45, '장인의 집', "a craftworker's family"),
    H('trade', 9, ['trade'], 55, '장사하는 집', 'a merchant family'),
    H('sail', 5, ['sea'], 40, '뱃사람 집', 'a seafaring family', true),
    H('serve', 7, ['serve'], 20, '남의 집 일을 하는 집', 'a family of servants'),
    H('elite', 5, ['elite'], 75, '부유한 집', 'a wealthy family'),
  ],
  modern: [
    H('farm', 25, ['farm'], 35, '농사짓는 집', 'a farming family'),
    H('factory', 20, ['factory'], 40, '공장 다니는 집', 'a factory family'),
    H('office', 25, ['office'], 50, '회사 다니는 집', 'an office-working family'),
    H('shop', 15, ['trade'], 50, '가게 하는 집', 'a shopkeeping family'),
    H('sail', 5, ['sea'], 45, '배 타는 집', 'a seafaring family', true),
    H('pro', 10, ['office', 'elite'], 65, '의사·교사 같은 전문직 집', 'a family of doctors or teachers'),
  ],
};
// 수렵 무리(band)는 농사 전 땅이면 고대·중세·근세 묶음에도 태어난다 (beforeFarming) → 어느 묶음에서 찾아도 무리를 돌려준다
export const householdOf = (group, id) => (HOUSEHOLDS[group] || []).find((h) => h.id === id) || (id === 'band' ? HOUSEHOLDS.forager[0] : undefined);
// 바닷가가 없는 땅이면 바다 집안을 빼고 뽑는다
export const drawHousehold = (rng, group, area) => rng.weighted(HOUSEHOLDS[group].filter((h) => !h.coast || area.coast), (h) => h.w);
// 농사·목축이 아직 그 땅에 닿지 않은 해 (context_data.js FARM_FROM, 예: 1788년 전 오스트레일리아 · 1580년 전 라플라타 · 기원전 900년 전 일본).
// 이때 태어나면 그해 묶음이 고대·중세·근세라도 사냥하고 채집하는 무리다 (birth.js). 해·땅 뽑기는 그대로
export const beforeFarming = (area, year) => year < (FARM_FROM[area] ?? -Infinity);
export const drawSex = (rng) => (rng.next() < 0.512 ? 'm' : 'f');   // 출생 성비 약 105:100
export const drawOrder = (rng) => rng.weighted([1, 2, 3, 4, 5], (n) => [35, 28, 18, 11, 8][n - 1]);
