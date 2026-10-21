// 탄생: 해(출생 수) → 지역·땅(그해 인구) → 집안·성별·형제 순서 (설계 3장)
import { sub } from './rng.js';
import { drawYear, eraOf, groupOf } from './births.js';
import { AREAS, drawPlace } from './places.js';
import { drawHousehold, drawSex, drawOrder, householdOf, beforeFarming, HERD_GROUPS, HERD_SHARE } from './households.js';

export function birthAt(seed, year) {
  const { region, area } = drawPlace(sub(seed, 'place'), year);
  const group = groupOf(year);
  // 농사가 아직 닿지 않은 땅이면 수렵 무리 (묶음은 그해 것 그대로: 생명표·시대 이름은 해를 따른다)
  let h = beforeFarming(area, year) ? householdOf('forager', 'band') : drawHousehold(sub(seed, 'home'), group, AREAS[area]);
  if (h.id === 'farm' && HERD_GROUPS.includes(group) && sub(seed, 'herd').next() < (HERD_SHARE[area] || 0)) h = householdOf(group, 'herd');
  return { seed, year, era: eraOf(year).id, group, region, area, household: h.id, tags: [...h.tags], wealth: h.wealth,
           sex: drawSex(sub(seed, 'sex')), order: drawOrder(sub(seed, 'order')) };
}

// after 해 다음부터 태어난 사람 가운데 하나. 남은 사람이 없으면 null
export function drawBirth(seed, after = -Infinity) {
  const year = drawYear(sub(seed, 'year'), after);
  return year === null ? null : birthAt(seed, year);
}
