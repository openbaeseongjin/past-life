// tools/simulate_all_card_matches.mjs
// 1000명의 다양한 생애 맥락을 생성하여 카드 매칭 전수 시뮬레이션
import { drawBirth } from '../birth.js';
import { createLife } from '../life.js';
import { DECK } from '../deck.js';
import { eligible } from '../cards.js';
import { stageOf as stageOfLand } from '../lands.js';
import { contextOf } from '../context.js';
import { stageOf } from '../cards.js';
import { groupOf, eraOf } from '../births.js';
import { settingOf } from '../lands.js';
import { AREAS } from '../places.js';

function buildCtx(life) {
  const b = life.birth;
  const w = contextOf(life.year, b.area, b.household);
  return {
    stage: stageOf(life.age), age: life.age, year: life.year, era: eraOf(life.year).id, group: b.household === 'band' ? 'forager' : groupOf(life.year),
    region: b.region, area: b.area, coast: !!AREAS[b.area].coast, tags: b.tags, sex: b.sex,
    flags: { ...life.flags, kids: life.kids > 0 }, traces: life.traces, dream: life.dream, stats: life.stats, seen: [],
    attrs: life.attrs, status: life.status, zone: w.zone, setting: settingOf(b.household, b.group || groupOf(b.year)), war: w.war?.level || 0, route: life.route,
  };
}

console.log('=== 1,000 생애 카드 매칭 전수 시뮬레이션 ===\n');

const ANOMALIES = [];

// 검사 규칙들
const RULES = [
  {
    name: '선사/수렵시대(forager/camp)에 화폐·문자·성당·관청',
    test: (c, ctx, stg) => {
      if (ctx.group === 'forager' || stg.setting === 'camp') {
        const text = (c.text?.ko || '') + ' ' + (c.text?.en || '');
        if (/은화|동전|금화|엽전|화폐|관청|과거시험|서당|향교|성당|사원|공장|철기|모루/.test(text)) {
          return `수렵/야영지(camp/${ctx.group})에 문명 요소 출현: ${text.slice(0, 40)}`;
        }
      }
      return null;
    }
  },
  {
    name: '내륙(비해안)에서 직접 바다 항해/어선 승선',
    test: (c, ctx) => {
      if (!ctx.coast) {
        const text = (c.text?.ko || '') + ' ' + (c.text?.en || '');
        if (/닻을 올리고 출항|무역선에서 선원을|바다로 나가는 배에 자리가|고래를 잡으러 바다로|그물을 던져 바다에서/.test(text)) {
          return `내륙 지역(coast=false, ${ctx.area})에서 바다 출항/조업: ${text.slice(0, 40)}`;
        }
      }
      return null;
    }
  },
  {
    name: '자유민/귀족에게 노비·농노의 신분적 예속 서사',
    test: (c, ctx) => {
      if (ctx.status && !ctx.status.bound && ctx.household !== 'serve') {
        const text = (c.text?.ko || '') + ' ' + (c.text?.en || '');
        if (/종문서를 찾아|상전의 매질|노비 문서를 불태|주인어른이 매질|면천하여 평민이|농노의 굴레/.test(text)) {
          return `자유민/귀족(${ctx.household}, bound=${ctx.status.bound})에게 노비/농노 예속 서사: ${text.slice(0, 40)}`;
        }
      }
      return null;
    }
  },
  {
    name: '노비/하인(serve)에게 영지 지주/상전 서사',
    test: (c, ctx) => {
      if (ctx.household === 'serve' || (ctx.status && ctx.status.bound)) {
        const text = (c.text?.ko || '') + ' ' + (c.text?.en || '');
        if (/소작농들에게 소작료를|영지를 다스리는 영주|가문의 영지를 물려받|하인을 새로 들여/.test(text)) {
          return `하인/노비(${ctx.household})에게 영주/지주 권력 행사: ${text.slice(0, 40)}`;
        }
      }
      return null;
    }
  },
  {
    name: '남성에게 직접 임신/출산/산고',
    test: (c, ctx) => {
      if (ctx.sex === 'm') {
        const text = (c.text?.ko || '') + ' ' + (c.text?.en || '');
        if (/산고 끝에 아이를 낳|진통이 시작되어 아이를 낳|배가 불러오고 입덧이/.test(text)) {
          return `남성에게 직접 출산: ${text.slice(0, 40)}`;
        }
      }
      return null;
    }
  },
  {
    name: '어린아이(baby/child: 0~12세)에게 혼인/출산/영지상속',
    test: (c, ctx) => {
      if (ctx.age < 13) {
        const text = (c.text?.ko || '') + ' ' + (c.text?.en || '');
        if (/혼례를 올리고 첫날밤|아이를 낳았|아내를 맞이|남편과 혼인/.test(text)) {
          return `어린이(${ctx.age}세)에게 혼인/출산: ${text.slice(0, 40)}`;
        }
      }
      return null;
    }
  }
];

let totalChecks = 0;
const AGES = [3, 7, 11, 15, 18, 25, 35, 45, 55, 65, 75];

for (let i = 0; i < 1000; i++) {
  const seed = `SIM-${i}`;
  const birth = drawBirth(seed);
  const stg = stageOfLand(birth);
  const life = createLife({ birth, noDeath: true, quiet: true });

  for (const age of AGES) {
    life.age = age;
    life.year = birth.year + age;
    const ctx = buildCtx(life);

    // 이 맥락에서 뜰 수 있는 모든 카드를 추출
    const el = DECK.filter(c => eligible(c, ctx));
    for (const c of el) {
      totalChecks++;
      for (const rule of RULES) {
        const err = rule.test(c, ctx, stg);
        if (err) {
          ANOMALIES.push({
            rule: rule.name,
            cardId: c.id,
            birth: `${birth.area} (${birth.year}년) ${birth.household} ${birth.sex}`,
            age,
            err
          });
        }
      }
    }
  }
}

console.log(`총 카드 적격 판정 검사 횟수: ${totalChecks.toLocaleString()}회`);
console.log(`발견된 논리적 이상치(Anomalies): ${ANOMALIES.length}건\n`);

if (ANOMALIES.length > 0) {
  // 중복 카드별로 묶어서 요약 출력
  const grouped = new Map();
  for (const a of ANOMALIES) {
    const key = `${a.rule} | ${a.cardId}`;
    if (!grouped.has(key)) grouped.set(key, { ...a, count: 0 });
    grouped.get(key).count++;
  }
  for (const [k, v] of grouped) {
    console.log(`[${v.rule}]`);
    console.log(`  카드 ID: ${v.cardId} (발생 횟수: ${v.count}회)`);
    console.log(`  표본 출생: ${v.birth}, 나이: ${v.age}세`);
    console.log(`  내용: ${v.err}\n`);
  }
} else {
  console.log('✔ 모든 시뮬레이션에서 규칙 위반이 0건입니다!');
}
