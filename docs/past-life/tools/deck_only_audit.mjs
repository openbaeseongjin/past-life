// tools/deck_only_audit.mjs
import { DECK } from '../deck.js';
import { LINES } from '../lines.js';

console.log('=== DECK (일반 덱 카드 340장) 전수 정합성 감사 ===\n');

// 1. 바다 / 어선 관련 카드인데 coast 조건이 누락된 카드
console.log('--- [1. 해안(Coast) 매칭 점검] ---');
for (const c of DECK) {
  const text = (c.text?.ko || '') + ' ' + (c.text?.en || '');
  const w = c.when || {};
  // 직접 배를 타고 바다로 나가거나 어부/선원 관련인 경우
  const seaRegex = /바다로 나가는 배|무역선에서 선원|그물을 던져|물고기를 낚|배를 타고 먼|고래를 잡|어선|포구에서 배|항해/i;
  if (seaRegex.test(text)) {
    const hasCoast = w.coast === true || (w.tags && (w.tags.includes('fish') || w.tags.includes('sail')));
    if (!hasCoast) {
      console.log(`[Sea Issue] ${c.id}: ${c.text.ko}`);
      console.log(`  when: ${JSON.stringify(w)}\n`);
    }
  }
}

// 2. 야영지(camp)/선사시대에 나올 수 있는데 농경, 화폐, 문자, 관청, 서당, 성당 등이 나오는 카드
console.log('--- [2. 선사 야영지(Camp) 및 시대 착오 점검] ---');
for (const c of DECK) {
  const text = (c.text?.ko || '') + ' ' + (c.text?.en || '');
  const w = c.when || {};
  const canCamp = (!w.setting || [].concat(w.setting).includes('camp')) &&
                  (!w.eraGroups || w.eraGroups.includes('forager')) &&
                  (!w.minYear || w.minYear < -3000);
  if (canCamp) {
    const anachronisms = [/은화|동전|엽전|금화/, /과거시험|서당|향교/, /성당|교회|미사|신부님/, /모루|대장간|풀무/, /공장|기차|신문/];
    for (const reg of anachronisms) {
      if (reg.test(text)) {
        console.log(`[Camp/Era Issue] ${c.id}: ${c.text.ko}`);
        console.log(`  when: ${JSON.stringify(w)}\n`);
        break;
      }
    }
  }
}

// 3. 신분/계급(Household & Bound & Status) 논리 점검
console.log('--- [3. 신분/계급(Household & Bound) 매칭 점검] ---');
for (const c of DECK) {
  const text = (c.text?.ko || '') + ' ' + (c.text?.en || '');
  const w = c.when || {};
  // 노비/하인/농노의 굴레 서사
  if (/종문서|상전|주인어른|노비 문서|면천|농노/i.test(text)) {
    if (w.bound !== true && (!w.tags || !w.tags.includes('serve'))) {
      console.log(`[Serve/Bound Issue] ${c.id}: ${c.text.ko}`);
      console.log(`  when: ${JSON.stringify(w)}\n`);
    }
  }
  // 귀족/지주 전용 서사
  if (/소작농들에게|소작료를 받|영지를 다스리는|가문의 영지|하인을 부리/i.test(text)) {
    if ((!w.tags || !w.tags.includes('elite')) && (w.minStatus == null || w.minStatus < 4)) {
      console.log(`[Elite/Noble Issue] ${c.id}: ${c.text.ko}`);
      console.log(`  when: ${JSON.stringify(w)}\n`);
    }
  }
}

// 4. 성별(Sex) 매칭 점검
console.log('--- [4. 성별(Sex) 매칭 점검] ---');
for (const c of DECK) {
  const text = (c.text?.ko || '') + ' ' + (c.text?.en || '');
  const w = c.when || {};
  if (/산고 끝에 아이를|진통이 시작되어|배가 불러오고 입덧/i.test(text)) {
    if (w.sex !== 'f') {
      console.log(`[Sex Issue - Female] ${c.id}: ${c.text.ko}`);
      console.log(`  when: ${JSON.stringify(w)}\n`);
    }
  }
  if (/군대에 징집되어|군역에 끌려가/i.test(text)) {
    if (w.sex !== 'm') {
      console.log(`[Sex Issue - Male] ${c.id}: ${c.text.ko}`);
      console.log(`  when: ${JSON.stringify(w)}\n`);
    }
  }
}

// 5. 3D 씬의 장소(Setting)와 카드의 장소 불일치
// 예: setting: 'estate' (대저택) 에서만 살림을 하는 하인/귀족 카드, 또는
//     setting: 'village' (농촌 마을) 전용 카드
console.log('--- [5. 장소(Setting: village / estate / camp) 매칭 점검] ---');
for (const c of DECK) {
  const text = (c.text?.ko || '') + ' ' + (c.text?.en || '');
  const w = c.when || {};
  // 대저택 하녀/하인이나 대청마루 서재인데 마을 농가에서 나오는 경우
  if (/대저택의|영주의 저택|장원의 안채/i.test(text)) {
    if (!w.setting || ![].concat(w.setting).includes('estate')) {
      console.log(`[Setting Issue - Estate] ${c.id}: ${c.text.ko}`);
      console.log(`  when: ${JSON.stringify(w)}\n`);
    }
  }
  // 선사시대 매머드/움집/사냥 무리인데 camp가 아닌 경우
  if (/매머드|움집|돌도끼로 사냥/i.test(text)) {
    if (!w.setting || ![].concat(w.setting).includes('camp')) {
      console.log(`[Setting Issue - Camp] ${c.id}: ${c.text.ko}`);
      console.log(`  when: ${JSON.stringify(w)}\n`);
    }
  }
}
