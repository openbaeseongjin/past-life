// 한 영혼의 여정 (설계 6장). 다음 탄생은 생이 끝날 때 바로 뽑아 둔다
import { newId } from './rng.js';
import { drawBirth } from './birth.js';
import { eraOf, groupOf, ERAS } from './births.js';
import { REGIONS, AREAS } from './places.js';
import { householdOf } from './households.js';
import { CAUSES } from './deaths.js';
import { computeTraces, TRACE_TEXT } from './traces.js';
import { BEADS_RE } from './beads.js';

export const NOW = 2000;   // 이 해 이후에 태어나면 「지금, 당신」

export function newSoul(id = newId()) {
  return { id, lives: [], traces: [], next: drawBirth(`${id}-1`), ended: false };
}

export function finishLife(soul, life, extra = {}) {
  const gained = computeTraces(life);
  soul.lives.push({ seed: life.birth.seed, birth: life.birth, death: life.death, traces: life.traces, gained, ...extra });
  soul.traces = gained.map((t) => ({ ...t }));   // 기록과 다음 생이 같은 배열을 나눠 쓰지 않게
  const n = soul.lives.length;
  // 2000년 이후에 끝났거나 지금(PRESENT)까지 살아 멈춘 생이면 다음 탄생 없이 여정이 끝난다
  soul.next = life.death.present || life.death.year >= NOW ? null : drawBirth(`${soul.id}-${n + 1}`, life.death.year);
  soul.ended = !soul.next || soul.next.year >= NOW;
  return soul;
}

export function addDex(dex, life) {
  const k = `${eraOf(life.birth.year).id}|${life.birth.region}`;
  dex[k] = (dex[k] || 0) + 1;
  return dex;
}

// 저장된 영혼·도감이 지금 코드가 읽을 수 있는 모양인가. 깨졌거나 옛 모양이면 버리고 새로 시작한다 (시작 화면에서 멈추지 않게)
const own = (o, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const okTrace = (t) => isObj(t) && own(TRACE_TEXT, t.kind) && own(TRACE_TEXT[t.kind], t.key)
  && (t.who == null || (isObj(t.who) && typeof t.who.ko === 'string' && typeof t.who.en === 'string'));
const okBirth = (b) => isObj(b) && typeof b.seed === 'string' && Number.isInteger(b.year) && b.era === eraOf(b.year).id && b.group === groupOf(b.year)
  && own(AREAS, b.area) && AREAS[b.area].region === b.region && !!householdOf(b.group, b.household)
  && (b.sex === 'm' || b.sex === 'f') && Number.isInteger(b.order) && b.order >= 1 && b.order <= 5
  && Array.isArray(b.tags) && b.tags.every((x) => typeof x === 'string') && Number.isFinite(b.wealth);
const okDeath = (d) => isObj(d) && Number.isInteger(d.age) && d.age >= 0 && Number.isInteger(d.year) && Number.isInteger(d.line)
  && (d.present === true ? d.cause === null : own(CAUSES, d.cause));   // present: 지금(2026)까지 살아 멈춘 생은 사인이 없다
const okLife = (l) => isObj(l) && okBirth(l.birth) && okDeath(l.death) && Array.isArray(l.gained) && l.gained.every(okTrace) && (l.note == null || typeof l.note === 'string')
  && (l.beads == null || (typeof l.beads === 'string' && l.beads.length <= 121 && BEADS_RE.test(l.beads)))
  && (l.lines == null || (Array.isArray(l.lines) && l.lines.length <= 200 && l.lines.every((x) => typeof x === 'string')));   // 그 생에 나온 작은 일 줄 (다음 생이 덜 고른다)
export function validSoul(s) {
  return isObj(s) && typeof s.id === 'string' && s.id.length > 0 && Array.isArray(s.lives) && s.lives.every(okLife)
    && Array.isArray(s.traces) && s.traces.every(okTrace) && typeof s.ended === 'boolean'
    && (s.next === null ? s.ended : okBirth(s.next));
}
// 도감은 맞는 칸(시대 id|지역 → 양의 정수)만 남긴다
export function cleanDex(d) {
  const out = {};
  if (!isObj(d)) return out;
  for (const [k, v] of Object.entries(d)) {
    const [e, g] = k.split('|');
    if (ERAS.some((x) => String(x.id) === e) && REGIONS.includes(g) && Number.isInteger(v) && v > 0) out[k] = v;
  }
  return out;
}

// localStorage 가 없거나 막혀도 게임은 그 판만 놀 수 있게
export function makeStore(ls) {
  if (ls === undefined) { try { ls = globalThis.localStorage; } catch { ls = undefined; } }   // 꺼내기만 해도 막히는 곳이 있다
  const warn = (k) => console.warn(`한 영혼의 여정: 저장값 ${k} 의 모양이 맞지 않아 버리고 새로 시작한다`);
  const get = (k, d) => {
    let v;
    try { v = ls && ls.getItem(k); } catch { return d; }
    if (!v) return d;
    try { return JSON.parse(v); } catch { warn(k); return d; }
  };
  const set = (k, v) => { try { if (!ls) return false; ls.setItem(k, JSON.stringify(v)); return true; } catch { return false; } };
  const loadSoul = () => {
    const s = get('pl.soul.v1', null);
    if (s === null || validSoul(s)) return s;
    warn('pl.soul.v1');
    return null;
  };
  const loadDex = () => {
    const d = get('pl.dex.v1', {}), c = cleanDex(d);
    if (d !== null && (!isObj(d) || Object.keys(c).length !== Object.keys(d).length)) warn('pl.dex.v1');
    return c;
  };
  return {
    loadSoul, saveSoul: (s) => set('pl.soul.v1', s),
    loadDex, saveDex: (d) => set('pl.dex.v1', d),
    loadDynasty: () => get('pl.dynasty.v1', null), saveDynasty: (d) => set('pl.dynasty.v1', d),
    loadDynastyDex: () => get('pl.dynasty.dex', []), saveDynastyDex: (list) => set('pl.dynasty.dex', list),
    loadLang: () => get('pl.lang', null), saveLang: (l) => set('pl.lang', l),
    loadSound: () => get('pl.sound', true), saveSound: (on) => set('pl.sound', on),
    // 설정 (처음 하는 사람을 위한 다듬기): 해가 흐르는 기본 빠르기 · 화질(realscene.js 와 같은 열쇠 pl.quality) · 처음 안내를 봤는가
    loadSpeed: () => { const v = get('pl.speed', 'normal'); return ['slow', 'normal', 'fast', 'fastest'].includes(v) ? v : 'normal'; }, saveSpeed: (v) => set('pl.speed', v),
    loadQuality: () => { const v = get('pl.quality', 'high'); return v === 'normal' ? 'normal' : 'high'; }, saveQuality: (v) => set('pl.quality', v),
    loadCoach: () => get('pl.coach', false) === true, saveCoach: (done) => set('pl.coach', !!done),
    // 이제 쓰지 않는 옛 저장값을 지운다: pl.pauses (옛 「다음부터 모닥불 건너뛰기」). 저장소가 막혀도 조용히
    clearLegacy: () => { try { if (ls) ls.removeItem('pl.pauses'); } catch { /* 막힌 저장소 */ } },
  };
}
