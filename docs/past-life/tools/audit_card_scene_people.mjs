// tools/audit_card_scene_people.mjs
// 장면(Scene), 카드(Cards), 인물(People)의 논리적 매칭 전수 감사 스크립트

import { DECK } from '../deck.js';
import { EVENT_CARDS } from '../cards_event.js';
import { LINES } from '../lines.js';
import { SETTINGS, HOUSEHOLD_SETTING } from '../lands.js';
import { HOUSEHOLDS } from '../households.js';

const ALL_CARDS = [...DECK, ...EVENT_CARDS];

console.log('=== 장면-카드-인물 논리적 정합성 전수 감사 ===\n');
console.log(`총 검사 대상 카드 수: ${ALL_CARDS.length}장`);
console.log(`총 검사 대상 작은 일 줄(LINES) 수: ${LINES.length}개\n`);

const issues = [];

function checkText(c, regexes) {
  const texts = [c.text?.ko || '', c.text?.en || ''];
  if (c.choices) {
    for (const ch of c.choices) {
      texts.push(ch.text?.ko || '', ch.text?.en || '');
    }
  }
  const full = texts.join(' ');
  return regexes.some(r => r.test(full));
}

// -------------------------------------------------------------
// 1. 바다 / 어촌 매칭 검사
// -------------------------------------------------------------
const SEA_KW = [/바다/, /물고기/, /그물/, /어선/, /포구/, /항해/, /조개/, /조수/, /해안/, /파도/, /선원/, /\bsea\b/i, /\bfish\b/i, /\bboat\b/i, /\bsail\b/i, /\bshore\b/i, /\btide\b/i];
const SEA_EXCEPTIONS = [/바다 건너/, /바다를 건너/, /across the sea/, /over the sea/]; // 비유적 표현 등 제외

for (const c of ALL_CARDS) {
  if (checkText(c, SEA_KW)) {
    const isException = checkText(c, SEA_EXCEPTIONS);
    const hasCoastReq = c.when?.coast === true || (c.when?.tags && (c.when.tags.includes('fish') || c.when.tags.includes('sail')));
    if (!hasCoastReq && !isException) {
      // 바다 관련 내용인데 해안 제한이나 어민/선원 제한이 없는 경우
      issues.push({
        category: '바다/해안(Sea/Coast) 매칭',
        id: c.id,
        stage: c.stage,
        when: c.when,
        textKo: c.text?.ko,
        reason: '바다·어선·그물 관련 내용이 포함되어 있으나 when.coast=true 또는 어민/선원 태그 제한이 없어 내륙 사막/초원에서도 발생 가능'
      });
    }
  }
}

// -------------------------------------------------------------
// 2. 야영지(camp - 선사시대) vs 농경·화폐·대장간·교회 매칭 검사
// -------------------------------------------------------------
// camp 환경은 lands.js에 따르면 기원전 농경 이전(수렵/채집) 야영지
// 농사(모내기, 밭갈이, 쟁기, 수확), 화폐(은화, 동전, 돈), 대장간/쇠질, 교회/성당/사원/서당/과거시험
const AGRI_KW = [/쟁기/, /모내기/, /논에/, /밭을 갈/, /밀을 베/, /수확/, /소작/, /지주/, /plow/, /harvest/, /paddy/];
const MONEY_KW = [/은화/, /동전/, /화폐/, /엽전/, /금화/, /coin/, /money/, /penny/, /denari/];
const FORGE_KW = [/대장간/, /모루/, /쇠를 달구/, /풀무/, /blacksmith/, /anvil/, /forge/];
const TEMPLE_KW = [/교회/, /성당/, /사원/, /절에/, /스님/, /신부님/, /서당/, /pastor/, /church/, /temple/, /monastery/];

for (const c of ALL_CARDS) {
  const w = c.when || {};
  // camp에서 뜰 수 있는 카드인지 확인 (eraGroups에 prehistory/ancient 포함되거나 era/eras 제한이 없거나, setting에 camp 허용)
  const canAppearInCamp = (!w.setting || [].concat(w.setting).includes('camp')) &&
                          (!w.eraGroups || w.eraGroups.includes('forager') || w.eraGroups.includes('ancient')) &&
                          (!w.minYear || w.minYear < -3000);

  if (canAppearInCamp) {
    if (checkText(c, AGRI_KW) && !w.setting && (!w.tags || !w.tags.includes('farm'))) {
      // 농사 관련인데 선사시대 camp에서도 뜰 수 있는지 확인
      if (!w.eras && !w.eraGroups && !w.minYear) {
        issues.push({
          category: '야영지(Camp)/농경 매칭',
          id: c.id,
          when: c.when,
          textKo: c.text?.ko,
          reason: '농경·수확 내용인데 시대나 장소(setting!=camp) 제한이 없어 선사 야영지에서도 트리거 가능'
        });
      }
    }
    if (checkText(c, MONEY_KW) && (!w.eraGroups && !w.eras && !w.minYear)) {
      issues.push({
        category: '화폐/선사시대 매칭',
        id: c.id,
        when: c.when,
        textKo: c.text?.ko,
        reason: '화폐·동전 거래 내용인데 시대(era/minYear) 제한이 없어 화폐 등장 이전 원시 야영지에서도 트리거 가능'
      });
    }
  }
}

// -------------------------------------------------------------
// 3. 대저택(Estate) vs 일반 마을(Village) 매칭 검사
// -------------------------------------------------------------
const ESTATE_SPECIFIC_KW = [/대저택/, /영주의 저택/, /장원/, /안채의 하녀/, /대청마루/, /영지/, /manor/, /mansion/, /estate/];

for (const c of ALL_CARDS) {
  const w = c.when || {};
  if (checkText(c, ESTATE_SPECIFIC_KW)) {
    // 대저택 관련 카드인데 setting: 'estate' 제한이 있는지 확인
    const hasEstateSetting = w.setting && [].concat(w.setting).includes('estate');
    const hasServeOrElite = w.tags && (w.tags.includes('serve') || w.tags.includes('elite'));
    if (!hasEstateSetting && !hasServeOrElite && !w.bound) {
      issues.push({
        category: '대저택(Estate) 매칭',
        id: c.id,
        when: c.when,
        textKo: c.text?.ko,
        reason: '대저택·장원 전용 서사인데 setting: "estate"나 하인/귀족 신분 조건이 없음'
      });
    }
  }
}

// -------------------------------------------------------------
// 4. 종교/문화권(Zone/Region/Area) 매칭 검사
// -------------------------------------------------------------
const CHRISTIAN_KW = [/성당/, /교회/, /십자가/, /미사/, /신부님/, /수도원/, /수녀/, /church/, /priest/, /monk/, /mass/, /cross/];
const BUDDHIST_KW = [/사찰/, /스님/, /염불/, /목탁/, /불상/, /부처/, /temple/, /buddha/];
const ISLAMIC_KW = [/모스크/, /이맘/, /라마단/, /코란/, /알라/, /메카/, /mosque/, /imam/, /ramadan/, /quran/];
const CONFUCIAN_KW = [/서당/, /과거시험/, /천자문/, /향교/, /성균관/, /유학/];

for (const c of ALL_CARDS) {
  const w = c.when || {};
  // 기독교 고유 단어가 있는데 zone/region/area가 유럽 외 다른 곳에도 뜰 수 있는지
  if (checkText(c, CHRISTIAN_KW)) {
    const isGlobal = !w.zones && !w.regions && !w.areas;
    if (isGlobal) {
      // 단, 토큰({church})을 쓰는 경우는 context.js에서 문화권별로 변환되므로 제외
      const rawText = JSON.stringify(c.text);
      if (!rawText.includes('{church}') && !rawText.includes('{faith}')) {
        issues.push({
          category: '문화권/종교(Zone/Religion) 매칭',
          id: c.id,
          when: c.when,
          textKo: c.text?.ko,
          reason: '기독교 고유 표현(성당/교회/신부 등)이 포함되어 있으나 토큰({church}) 치환 없이 전 문화권에 노출됨'
        });
      }
    }
  }
  if (checkText(c, BUDDHIST_KW)) {
    const isGlobal = !w.zones && !w.regions && !w.areas;
    if (isGlobal) {
      const rawText = JSON.stringify(c.text);
      if (!rawText.includes('{temple}') && !rawText.includes('{faith}')) {
        issues.push({
          category: '문화권/종교(Zone/Religion) 매칭',
          id: c.id,
          when: c.when,
          textKo: c.text?.ko,
          reason: '불교 고유 표현이 포함되어 있으나 토큰 치환 없이 전 문화권에 노출됨'
        });
      }
    }
  }
  if (checkText(c, ISLAMIC_KW)) {
    const isGlobal = !w.zones && !w.regions && !w.areas;
    if (isGlobal) {
      issues.push({
        category: '문화권/종교(Zone/Religion) 매칭',
        id: c.id,
        when: c.when,
        textKo: c.text?.ko,
        reason: '이슬람 고유 표현이 포함되어 있으나 지역/문화권 제한 없음'
      });
    }
  }
  if (checkText(c, CONFUCIAN_KW)) {
    const isGlobal = !w.zones && !w.regions && !w.areas;
    if (isGlobal) {
      issues.push({
        category: '문화권/종교(Zone/Religion) 매칭',
        id: c.id,
        when: c.when,
        textKo: c.text?.ko,
        reason: '유교/서당/과거시험 고유 표현이 포함되어 있으나 동아시아 제한 없음'
      });
    }
  }
}

// -------------------------------------------------------------
// 5. 신분/계급(Household/Status/Rank/Bound) 논리 매칭 검사
// -------------------------------------------------------------
const SLAVE_KW = [/노비/, /농노/, /종문서/, /상전/, /매인 몸/, /주인어른/, /serf/, /slave/, /bound/];
const NOBLE_KW = [/소작농을 부리/, /영지를 다스리/, /가문의 영광/, /귀족 연회/, /영주로서/, /양반가/];

for (const c of ALL_CARDS) {
  const w = c.when || {};
  if (checkText(c, SLAVE_KW)) {
    if (w.bound !== true && (!w.tags || !w.tags.includes('serve')) && w.maxStatus == null) {
      issues.push({
        category: '신분/계급(Status/Bound) 매칭',
        id: c.id,
        when: c.when,
        textKo: c.text?.ko,
        reason: '노비·농노·상전 내용인데 bound=true 또는 하인/낮은 신분 조건이 없음'
      });
    }
  }
  if (checkText(c, NOBLE_KW)) {
    if (w.minStatus == null && (!w.tags || !w.tags.includes('elite'))) {
      issues.push({
        category: '신분/계급(Status/Rank) 매칭',
        id: c.id,
        when: c.when,
        textKo: c.text?.ko,
        reason: '귀족·지주·영주 내용인데 elite 태그나 minStatus 조건이 없음'
      });
    }
  }
}

// -------------------------------------------------------------
// 6. 성별(Sex) / 나이(Stage/Age) 매칭 검사
// -------------------------------------------------------------
const CHILDBIRTH_KW = [/아이를 낳/, /출산/, /산고/, /해산/, /giving birth/, /childbirth/, /labor/];
for (const c of ALL_CARDS) {
  const w = c.when || {};
  if (checkText(c, CHILDBIRTH_KW)) {
    // 직접 출산하는 주체인 경우 성별 f 조건이 있어야 함 (아내의 출산을 지켜보는 경우 제외)
    const isWitness = /아내가|짝이|아내의|wife|partner/.test(c.text?.ko || '');
    if (!isWitness && w.sex !== 'f') {
      issues.push({
        category: '성별(Sex) 매칭',
        id: c.id,
        when: c.when,
        textKo: c.text?.ko,
        reason: '직접 출산·산고 내용인데 when.sex="f" 조건이 누락됨'
      });
    }
  }
}

console.log(`\n발견된 이슈 총계: ${issues.length}건\n`);
for (const iss of issues) {
  console.log(`[${iss.category}] ID: ${iss.id}`);
  console.log(`  - 텍스트: ${iss.textKo ? iss.textKo.slice(0, 70) : '(선택지)'}`);
  console.log(`  - 조건: ${JSON.stringify(iss.when)}`);
  console.log(`  - 원인: ${iss.reason}\n`);
}
