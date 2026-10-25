// tools/deep_audit_cards.mjs
import { DECK } from '../deck.js';
import { EVENT_CARDS } from '../cards_event.js';
import { LINES } from '../lines.js';

const ALL_CARDS = [...DECK, ...EVENT_CARDS];

console.log('--- 정밀 카드 매칭 분석 ---');

// 1. 바다/어선 관련 카드인데 coast: true 가 없는 카드들 전수 조사
console.log('\n[1. 해안/바다(Coast) 매칭 점검]');
for (const c of ALL_CARDS) {
  const ko = c.text?.ko || '';
  const en = c.text?.en || '';
  const text = ko + ' ' + en;
  const w = c.when || {};

  // 직접 배를 타거나 고기잡이/어선/포구 등 바다가 필수적인 경우
  const directSea = /그물을 던져|물고기를 낚|바다로 나가는 배|무역선에서 선원|카누 몇 척이 아무도 가 보지 않은 동쪽 바다로|노예를 사 가는 배들이 해안|배를 타고 먼|고래를 잡|어선|포구에서 배/i.test(text);
  if (directSea) {
    const ok = w.coast === true || (w.tags && (w.tags.includes('fish') || w.tags.includes('sail')));
    if (!ok) {
      console.log(`- Sea Mismatch: [${c.id}] coast=${w.coast}, tags=${w.tags}`);
      console.log(`  ko: ${ko}`);
    }
  }
}

// 2. 야영지(camp)/수렵시대인데 후대 문명(철기, 화폐, 문자, 관청, 서당, 성당)이 나오는 카드
console.log('\n[2. 선사 야영지(Camp) 및 시대 매칭 점검]');
for (const c of ALL_CARDS) {
  const ko = c.text?.ko || '';
  const en = c.text?.en || '';
  const text = ko + ' ' + en;
  const w = c.when || {};

  // camp나 forager에서 뜰 수 있는 카드인지
  const canCamp = (!w.setting || [].concat(w.setting).includes('camp')) &&
                  (!w.eraGroups || w.eraGroups.includes('forager')) &&
                  (!w.minYear || w.minYear < -3000);
  
  if (canCamp) {
    // 화폐, 관청, 과거, 철기, 성당 등
    const anachronisticInCamp = /관청|동전|은화|금화|과거시험|성당|사원|서당|모루|대장간|책을 읽|글을 써|공장|기차/i.test(text);
    if (anachronisticInCamp) {
      console.log(`- Camp Anachronism: [${c.id}] eraGroups=${w.eraGroups}, minYear=${w.minYear}, setting=${w.setting}`);
      console.log(`  ko: ${ko}`);
    }
  }
}

// 3. 신분(Household & Bound & Status) 매칭 점검
console.log('\n[3. 신분/계급(Status & Bound) 매칭 점검]');
for (const c of ALL_CARDS) {
  const ko = c.text?.ko || '';
  const en = c.text?.en || '';
  const text = ko + ' ' + en;
  const w = c.when || {};

  // 노비/농노/하인 매인 몸 전용 내용
  const slaveSpecific = /종문서를|상전에게|주인어른이 매질|노비 문서를|몸값을 치르고 면천|농노 신세/i.test(text);
  if (slaveSpecific) {
    if (w.bound !== true && (!w.tags || !w.tags.includes('serve'))) {
      console.log(`- Slave Mismatch: [${c.id}] bound=${w.bound}, tags=${w.tags}`);
      console.log(`  ko: ${ko}`);
    }
  }

  // 지주/영주/귀족 전용 내용
  const nobleSpecific = /소작농들에게 소작료를|영지를 다스리는 영주|가문의 영지를|하인을 새로 들이|소작인들이 소작료를/i.test(text);
  if (nobleSpecific) {
    if ((!w.tags || !w.tags.includes('elite')) && (w.minStatus == null || w.minStatus < 4)) {
      console.log(`- Noble Mismatch: [${c.id}] minStatus=${w.minStatus}, tags=${w.tags}`);
      console.log(`  ko: ${ko}`);
    }
  }
}

// 4. 성별(Sex) 전용 사건 점검
console.log('\n[4. 성별(Sex) 매칭 점검]');
for (const c of ALL_CARDS) {
  const ko = c.text?.ko || '';
  const en = c.text?.en || '';
  const text = ko + ' ' + en;
  const w = c.when || {};

  // 본인이 직접 겪는 임신/출산/산고
  const femaleOnly = /산고 끝에 아이를|진통이 시작되어|배가 불러오고 입덧/i.test(text);
  if (femaleOnly && w.sex !== 'f') {
    console.log(`- Female Mismatch: [${c.id}] sex=${w.sex}`);
    console.log(`  ko: ${ko}`);
  }

  // 남성 전용 군대 징집/징발
  const maleOnly = /군대에 징집되어 창을 잡|군역에 끌려가/i.test(text);
  if (maleOnly && w.sex !== 'm') {
    console.log(`- Male Mismatch: [${c.id}] sex=${w.sex}`);
    console.log(`  ko: ${ko}`);
  }
}
