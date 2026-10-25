// tools/comprehensive_semantic_audit.mjs
import { LIFE_CARDS } from '../cards_life.js';
import { ERA_CARDS } from '../cards_era.js';
import { TRACE_CARDS } from '../cards_trace.js';
import { LOCAL_CARDS_SA } from '../cards_local_sa.js';
import { LOCAL_CARDS_EA } from '../cards_local_ea.js';
import { LOCAL_CARDS_EU } from '../cards_local_eu.js';
import { LOCAL_CARDS_AM } from '../cards_local_am.js';

const decks = [
  { name: 'LIFE_CARDS', cards: LIFE_CARDS },
  { name: 'ERA_CARDS', cards: ERA_CARDS },
  { name: 'TRACE_CARDS', cards: TRACE_CARDS },
  { name: 'LOCAL_CARDS_SA', cards: LOCAL_CARDS_SA },
  { name: 'LOCAL_CARDS_EA', cards: LOCAL_CARDS_EA },
  { name: 'LOCAL_CARDS_EU', cards: LOCAL_CARDS_EU },
  { name: 'LOCAL_CARDS_AM', cards: LOCAL_CARDS_AM },
];

console.log('=== 카드 덱별 세부 정밀 감사 ===\n');

for (const group of decks) {
  console.log(`\n### ${group.name} (${group.cards.length}장)`);
  for (const c of group.cards) {
    const textKo = c.text?.ko || '';
    const textEn = c.text?.en || '';
    const w = c.when || {};

    // 1. 내륙 지역에 바다 이야기
    if (/바다|그물|어선|항해|선원|조개|갯벌|고래/.test(textKo)) {
      if (!w.coast && (!w.tags || (!w.tags.includes('fish') && !w.tags.includes('sail')))) {
        console.log(`[해안 미지정] ${c.id}: ${textKo.slice(0, 60)} | when: ${JSON.stringify(w)}`);
      }
    }

    // 2. 농노/하인 굴레인데 신분 미지정
    if (/노비|농노|종문서|상전|매인 몸|면천/.test(textKo)) {
      if (w.bound !== true && (!w.tags || !w.tags.includes('serve'))) {
        console.log(`[신분 미지정-하인] ${c.id}: ${textKo.slice(0, 60)} | when: ${JSON.stringify(w)}`);
      }
    }

    // 3. 지주/귀족 특권인데 신분 미지정
    if (/소작료를|영지를 다스리는|가문의 저택|귀족 연회/.test(textKo)) {
      if ((!w.tags || !w.tags.includes('elite')) && w.minStatus == null) {
        console.log(`[신분 미지정-귀족] ${c.id}: ${textKo.slice(0, 60)} | when: ${JSON.stringify(w)}`);
      }
    }

    // 4. 서당/과거/사원/교회 등 특정 문화/종교 전용 표현인데 문화권/지역 미지정 (토큰 치환 안된 경우)
    if (/과거시험|천자문|서당|향교/.test(textKo) && !w.zones && !w.areas && !w.regions) {
      console.log(`[문화권 미지정-유교] ${c.id}: ${textKo.slice(0, 60)} | when: ${JSON.stringify(w)}`);
    }
    if (/성당|신부님|수녀|미사/.test(textKo) && !w.zones && !w.areas && !w.regions && !JSON.stringify(c.text).includes('{church}')) {
      console.log(`[문화권 미지정-기독교] ${c.id}: ${textKo.slice(0, 60)} | when: ${JSON.stringify(w)}`);
    }
    if (/사찰|목탁|스님/.test(textKo) && !w.zones && !w.areas && !w.regions && !JSON.stringify(c.text).includes('{temple}')) {
      console.log(`[문화권 미지정-불교] ${c.id}: ${textKo.slice(0, 60)} | when: ${JSON.stringify(w)}`);
    }

    // 5. 대장간/모루 등 전문 직종인데 craft 태그나 도제 조건 없는 경우
    if (/모루에서 쇠를|풀무질|대장간에서 망치|쇠를 달구어/.test(textKo)) {
      if (!w.tags || (!w.tags.includes('craft') && !w.tags.includes('factory'))) {
        console.log(`[직종 미지정-대장간] ${c.id}: ${textKo.slice(0, 60)} | when: ${JSON.stringify(w)}`);
      }
    }

    // 6. 상업/장사 전문인데 trade/shop 태그 없는 경우
    if (/가게 문을 열고|가게를 차리|물건을 떼어다 파는|상단을 꾸려/.test(textKo)) {
      if (!w.tags || (!w.tags.includes('trade') && !w.tags.includes('shop'))) {
        console.log(`[직종 미지정-상업] ${c.id}: ${textKo.slice(0, 60)} | when: ${JSON.stringify(w)}`);
      }
    }
  }
}
