// 마을 사람 고르기 (three 없는 순수 모듈) — 시드 난수로 변형·동작·자리·경로·물감을 정한다.
// planPeople(rng, count, ctx) → [{ id, variant, action, place, x, z, face, path?, speed, phase, scale, palette }]
//   ctx = { layout(planVillage), dressing(planDressing), fieldAt, propDims(PROP_DIMS) }
//   변형: villagers.glb 의 8명 (VARIANTS). 동작: ACTIONS (장면 realpeople.js 가 UAL 동작 + 코드 덧씌우기로 푼다).
// 사람 수는 10~20 으로 맞춘다. 같은 rng 순서면 같은 사람들이 나온다 (Node 시험: test/peopleplan.test.mjs).
import { SMITHY, WELL, GREEN, VC, LANES, smoothLine, polyCum, polyAt, obb, obbLocal, obbHas, recipeOf } from './villageplan.js';

export const VARIANTS = ['m_tunic', 'm_hood', 'm_smith', 'm_field', 'f_apron', 'f_cloak', 'child', 'elder'];
// walk 걷기 · stand 서기 · talk 이야기 · hammer 망치질 · carry 자루 메고 걷기 · hoe 괭이질 · kneel 텃밭 손질 · sit 걸상에 앉기
export const ACTIONS = ['walk', 'stand', 'talk', 'hammer', 'carry', 'hoe', 'kneel', 'sit'];
export const PEOPLE_MIN = 10, PEOPLE_MAX = 20, PEOPLE_DEFAULT = 16;

// 주색 물감 (sRGB 0~1, 바랜 식물 물감): 꼭두서니 벽돌색·적갈·대청 파랑·짙은 대청·초록·짙은 초록·황토·회청·자주 갈색·생모 갈색·황갈·검갈
export const DYES = [
  [0.5, 0.23, 0.16], [0.44, 0.27, 0.16], [0.26, 0.32, 0.43], [0.19, 0.23, 0.32], [0.31, 0.36, 0.21], [0.21, 0.27, 0.18],
  [0.55, 0.44, 0.25], [0.33, 0.36, 0.41], [0.36, 0.21, 0.22], [0.37, 0.31, 0.24], [0.5, 0.37, 0.23], [0.18, 0.15, 0.13],
];
// 보조색 (각반·두건·밑옷): 수수한 갈색·회색·짙은 올리브·숯빛·귀리색
export const PLAIN = [[0.22, 0.19, 0.16], [0.3, 0.27, 0.24], [0.4, 0.38, 0.34], [0.19, 0.21, 0.17], [0.33, 0.26, 0.19], [0.26, 0.25, 0.27], [0.45, 0.4, 0.33]];
export const HAIRS = [[0.18, 0.11, 0.06], [0.3, 0.18, 0.09], [0.09, 0.07, 0.05], [0.5, 0.36, 0.18], [0.62, 0.48, 0.26], [0.45, 0.2, 0.08]];
// 바래지 않은 리넨(생지) 빛: 누런 귀리색·잿빛·갈색 기 (새하얀 천은 없다)
export const LINENS = [[0.7, 0.66, 0.56], [0.64, 0.62, 0.56], [0.68, 0.6, 0.48], [0.6, 0.57, 0.5], [0.72, 0.68, 0.6]];
const GREY_HAIR = [0.7, 0.68, 0.65];
// 남아시아 (작업 2-1): 식물 물감 — 쪽빛(인디고) 짙고 옅은 것·꼭두서니 붉은 것·강황 노랑·사프란·석류 껍질 누렁·흙빛·생무명. 머리는 검정·짙은 갈색만.
export const DYES_SA = [
  [0.17, 0.22, 0.42], [0.26, 0.33, 0.52], [0.13, 0.16, 0.3], [0.62, 0.15, 0.1], [0.5, 0.12, 0.1], [0.72, 0.28, 0.16], [0.86, 0.64, 0.14],
  [0.8, 0.52, 0.14], [0.66, 0.5, 0.2], [0.42, 0.28, 0.17], [0.34, 0.42, 0.22], [0.56, 0.2, 0.3],
];
export const PLAIN_SA = [[0.78, 0.74, 0.64], [0.72, 0.66, 0.54], [0.46, 0.36, 0.26], [0.3, 0.3, 0.32], [0.62, 0.55, 0.42], [0.2, 0.24, 0.36]];
export const HAIRS_SA = [[0.04, 0.035, 0.03], [0.06, 0.045, 0.035], [0.09, 0.065, 0.045], [0.05, 0.04, 0.04], [0.12, 0.08, 0.05]];
export const LINENS_SA = [[0.82, 0.78, 0.68], [0.78, 0.74, 0.64], [0.84, 0.8, 0.72], [0.74, 0.69, 0.58]];
// 동남아 (수정 1차, 남아시아 세트의 갈래 seasia): 쪽빛·소가(갈색 바틱)·노니 붉은 갈색·짙은 초록·고동·검정·생무명. 사프란·강황 노랑은 드물게. 머리는 검정·짙은 갈색
export const DYES_SEA = [
  [0.16, 0.2, 0.38], [0.24, 0.3, 0.46], [0.42, 0.28, 0.16], [0.36, 0.22, 0.13], [0.48, 0.18, 0.12], [0.4, 0.14, 0.12], [0.2, 0.3, 0.2],
  [0.15, 0.22, 0.16], [0.3, 0.2, 0.16], [0.12, 0.11, 0.1], [0.56, 0.42, 0.2], [0.34, 0.16, 0.24],
];
export const PLAIN_SEA = [[0.74, 0.7, 0.6], [0.5, 0.4, 0.28], [0.28, 0.22, 0.17], [0.18, 0.18, 0.2], [0.6, 0.52, 0.38], [0.2, 0.24, 0.34]];
export const LINENS_SEA = [[0.8, 0.76, 0.66], [0.74, 0.7, 0.6], [0.78, 0.72, 0.6]];
// 동아시아 (작업 2-2): 땅 갈래마다 물감. 머리는 검정·짙은 갈색만.
//   중국: 쪽빛 짙고 옅은 것·검정·갈색·짙은 초록·붉은 것(여자 치마)·생무명 · 한국: 평민은 흰옷이 많다 (생지 칸 = 흰·생무명), 물감은 옥색·쪽빛·분홍·다홍·회색
//   일본: 쪽빛(아이조메)이 가장 많고, 감물 갈색·회색·검정·붉은 오비
export const DYES_CN = [
  [0.16, 0.22, 0.4], [0.24, 0.32, 0.5], [0.1, 0.12, 0.2], [0.13, 0.12, 0.11], [0.34, 0.25, 0.18], [0.42, 0.3, 0.2], [0.22, 0.3, 0.22],
  [0.5, 0.16, 0.14], [0.58, 0.22, 0.16], [0.3, 0.3, 0.32], [0.48, 0.4, 0.26], [0.36, 0.2, 0.26],
];
export const PLAIN_CN = [[0.13, 0.12, 0.11], [0.2, 0.2, 0.22], [0.3, 0.26, 0.22], [0.16, 0.2, 0.32], [0.62, 0.58, 0.5], [0.4, 0.36, 0.3]];
export const LINENS_CN = [[0.78, 0.74, 0.64], [0.72, 0.68, 0.58], [0.66, 0.62, 0.54]];
export const DYES_KR = [
  [0.52, 0.62, 0.62], [0.42, 0.56, 0.58], [0.2, 0.26, 0.44], [0.28, 0.34, 0.5], [0.66, 0.36, 0.42], [0.56, 0.2, 0.2], [0.62, 0.16, 0.18],
  [0.74, 0.62, 0.3], [0.46, 0.46, 0.48], [0.34, 0.36, 0.4], [0.5, 0.42, 0.32], [0.3, 0.36, 0.3],
];
export const PLAIN_KR = [[0.84, 0.82, 0.76], [0.78, 0.76, 0.7], [0.46, 0.46, 0.48], [0.3, 0.3, 0.34], [0.6, 0.66, 0.68], [0.7, 0.66, 0.56]];
export const LINENS_KR = [[0.88, 0.87, 0.82], [0.84, 0.83, 0.78], [0.86, 0.84, 0.77], [0.8, 0.78, 0.7]];
export const DYES_JP = [
  [0.14, 0.2, 0.36], [0.2, 0.28, 0.46], [0.1, 0.14, 0.24], [0.3, 0.38, 0.52], [0.4, 0.26, 0.16], [0.46, 0.3, 0.18], [0.24, 0.24, 0.26],
  [0.12, 0.11, 0.11], [0.5, 0.18, 0.18], [0.3, 0.34, 0.28], [0.56, 0.46, 0.3], [0.4, 0.2, 0.28],
];
export const PLAIN_JP = [[0.14, 0.18, 0.3], [0.24, 0.22, 0.22], [0.36, 0.3, 0.24], [0.5, 0.2, 0.18], [0.66, 0.56, 0.32], [0.82, 0.8, 0.74]];
export const LINENS_JP = [[0.84, 0.82, 0.76], [0.78, 0.76, 0.7], [0.72, 0.68, 0.6]];
export const HAIRS_EA = [[0.035, 0.03, 0.028], [0.05, 0.04, 0.035], [0.07, 0.055, 0.045], [0.045, 0.04, 0.04]];

// 세트(·갈래)마다 물감 표 (realscene.js 의 내 사람 물감도 이것을 쓴다)
export const PALETTES = {
  england: { dyes: DYES, plain: PLAIN, hairs: HAIRS, linens: LINENS, skin: [0.9, 1.06] },
  southasia: { dyes: DYES_SA, plain: PLAIN_SA, hairs: HAIRS_SA, linens: LINENS_SA, skin: [0.84, 1.08] },
  seasia: { dyes: DYES_SEA, plain: PLAIN_SEA, hairs: HAIRS_SA, linens: LINENS_SEA, skin: [0.86, 1.1] },
  eastasia: { dyes: DYES_CN, plain: PLAIN_CN, hairs: HAIRS_EA, linens: LINENS_CN, skin: [0.9, 1.06] },
  korea: { dyes: DYES_KR, plain: PLAIN_KR, hairs: HAIRS_EA, linens: LINENS_KR, skin: [0.92, 1.08] },
  japan: { dyes: DYES_JP, plain: PLAIN_JP, hairs: HAIRS_EA, linens: LINENS_JP, skin: [0.92, 1.08] },
  // 농사 전 야영 (동아시아 세트, 세 갈래 함께): 물들이지 않은 삼·칡 섬유와 가죽 빛만 (쪽빛·붉은 물감 없음)
  eastasia_camp: {
    dyes: [[0.42, 0.36, 0.27], [0.36, 0.3, 0.22], [0.5, 0.44, 0.34], [0.3, 0.25, 0.19], [0.46, 0.38, 0.26], [0.4, 0.3, 0.2], [0.55, 0.5, 0.4], [0.34, 0.32, 0.26]],
    plain: [[0.3, 0.24, 0.18], [0.38, 0.3, 0.22], [0.26, 0.22, 0.18], [0.44, 0.36, 0.26], [0.5, 0.36, 0.24]],
    hairs: HAIRS_EA, linens: [[0.66, 0.6, 0.48], [0.6, 0.55, 0.44], [0.7, 0.64, 0.52]], skin: [0.92, 1.08] },
};
// 농사 전 야영 (동아시아 세트): 시대가 뚜렷한 쓰개·옷 변형(갓·삿갓·두립·스게가사·두루마기·하오리·넓은 오비)을 수수한 변형으로 바꿔 입힌다.
//   갈래(flavor)마다 표 — 중국은 두건 쓴 짧은 옷(m_tunic), 한국·일본은 머리띠만 맨 짧은 옷(m_smith). 동작·자리는 그대로 (난수를 더 쓰지 않는다).
export const CAMP_SWAP = {
  china: { m_field: 'm_tunic', m_hood: 'm_tunic', f_cloak: 'f_apron' },
  korea: { m_field: 'm_smith', m_hood: 'm_smith', m_tunic: 'm_smith', elder: 'm_smith', f_cloak: 'f_apron' },
  japan: { m_field: 'm_smith', m_hood: 'm_smith', m_tunic: 'm_smith', f_cloak: 'f_apron' },
};
export const campVariant = (v, flavor) => (CAMP_SWAP[flavor || 'china'] || {})[v] || v;
// camp: 농사 전 야영이면 세트에 `<세트>_camp` 물감이 있을 때 그것을 쓴다 (없는 세트는 그대로)
export const paletteOf = (kit, flavor = null, camp = false) => (camp && PALETTES[kit + '_camp']) || (flavor && PALETTES[flavor]) || PALETTES[kit] || PALETTES.england;

// 출생 시드 → 사람 고르기 난수 씨앗 (마을 짜기·꾸미기와 섞이지 않게)
export function peopleSeed(seed) { return (Math.imul(seed ^ 0x2c1b3c6d, 2654435761) + 0x9e3779b9) >>> 0; }

export function planPeople(rng, count, ctx) {
  const want = Number.isFinite(count) ? count : PEOPLE_DEFAULT;        // ?people=abc 같은 엉뚱한 값은 기본값으로
  const R = rng, n = Math.max(PEOPLE_MIN, Math.min(PEOPLE_MAX, Math.round(want)));
  const { layout, dressing, fieldAt, propDims } = ctx;
  const kit = ctx.kit || layout.kit || 'england', RCP = recipeOf(kit), PAL = paletteOf(kit, ctx.flavor, ctx.camp), WELL_AT = RCP.sites.well || WELL;
  const TAU = Math.PI * 2, rr = (a, b) => a + (b - a) * R(), pick = (a) => a[Math.floor(R() * a.length)];
  const houses = [...layout.houses, ...layout.farms].map((h) => h.foot);
  const big = dressing.items.filter((it) => propDims[it.p] && !/fence|wall|flower|chicken|duck|sheep|cow|horse|awning|market_goods|goat|buffalo|lota|ox_ea|pig|stones_ea/.test(it.p));   // 천막 밑은 장수 자리
  const taken = [];
  // 서 있을 수 있나: 집 밖, 큰 소품(수레·통·천막 …) 밖, 다른 사람과 0.7 m 넘게.
  // ignore = 그 사람이 쓰는 소품(제 텃밭·걸상). 걸상은 집 벽에서 0.42 m 라 걸상에 앉는 사람은 집 거리 검사를 하지 않는다
  const free = (x, z, r = 0.35, ignore = null) => !(ignore?.p !== 'bench' && ignore?.p !== 'charpai' && ignore?.p !== 'bench_ea' && houses.some((o) => obbHas(o, x, z, r + 0.3)))
    && !big.some((it) => { if (it === ignore) return false; const d = propDims[it.p]; return Math.hypot(x - it.x, z - it.z) < Math.max(d[0], d[1]) / 2 * it.s * 0.8 + r; })
    && !taken.some(([tx, tz]) => Math.hypot(x - tx, z - tz) < 0.7);
  const roles = [];
  const add = (r) => { roles.push(r); return r; };

  // ── 1. 반드시: 대장간 망치질 (세트 모루 로컬 (0.55, 0.6) 앞 0.55 m, 모루를 본다) ──
  { const o = obb(SMITHY.x, SMITHY.z, SMITHY.rot, 1, 1), [x, z] = obbLocal(o, 0.55, 1.05);
    add({ tier: 0, variant: 'm_smith', action: 'hammer', place: 'smithy', x, z, face: SMITHY.rot + Math.PI, fixed: true }); }
  // ── 2. 장터: 천막마다 장수(뒤) + 손님(앞), 천막 앞이 빈터 가운데를 본다 ──
  const awn = [...layout.awnings];
  for (let i = awn.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [awn[i], awn[j]] = [awn[j], awn[i]]; }
  awn.forEach((a, k) => {
    const o = obb(a.x, a.z, a.rot, 1, 1);
    { const [x, z] = obbLocal(o, rr(-0.5, 0.5), -1.15); add({ tier: k < 1 ? 0 : 1, variant: pick(['f_apron', 'm_hood', 'f_cloak', 'm_tunic']), action: k === 0 || R() < 0.5 ? 'stand' : 'talk', place: 'market', x, z, face: a.rot }); }
    { const u = rr(-0.9, 0.9), [x, z] = obbLocal(o, u, rr(2.3, 2.8)); add({ tier: k < 1 ? 0 : 1, variant: pick(['f_cloak', 'f_apron', 'm_tunic', 'elder']), action: 'talk', place: 'market', x, z, face: a.rot + Math.PI + rr(-0.3, 0.3) }); }
  });
  // ── 3. 우물가 이야기꾼 둘 (우물 둘레에서 비어 있는 곳) ──
  { const a0 = R() * TAU;
    for (let t = 0; t < 16; t++) {
      const a = a0 + t * TAU / 16, x = WELL_AT.x + Math.cos(a) * 3.2, z = WELL_AT.z + Math.sin(a) * 3.2, x2 = WELL_AT.x + Math.cos(a + 0.42) * 3.5, z2 = WELL_AT.z + Math.sin(a + 0.42) * 3.5;
      if (!free(x, z, 0.5) || !free(x2, z2, 0.5)) continue;
      const f = Math.atan2(x2 - x, z2 - z);
      add({ tier: 0, variant: pick(['f_apron', 'f_cloak']), action: 'talk', place: 'well', x, z, face: f });
      add({ tier: 0, variant: pick(['m_hood', 'elder', 'm_tunic']), action: 'talk', place: 'well', x: x2, z: z2, face: f + Math.PI });
      break;
    } }
  // ── 4. 밭: 마을에서 가까운 갈아엎은 밭(3)·밀밭(2)에 괭이질 1~2 ──
  { let got = null;
    const a0 = R() * TAU;
    for (let t = 0; t < 120 && !got; t++) {
      const a = a0 + t * 2.39996, d = 150 + (t % 12) * 10, x = VC.x + Math.cos(a) * d, z = VC.z + Math.sin(a) * d, f = fieldAt(x, z);
      if (f && (f.type === 3 || f.type === 2) && f.edge > 7) got = [x, z];
    }
    if (got) {
      const f = R() * TAU;
      const work = ctx.camp ? 'kneel' : 'hoe';   // 농사 전 야영 (동아시아 세트): 들에서 캐고 줍는다
      add({ tier: 0, variant: 'm_field', action: work, place: 'field', x: got[0], z: got[1], face: f });
      add({ tier: 1, variant: pick(['m_field', 'm_tunic']), action: work, place: 'field', x: got[0] + Math.cos(f) * 3.2, z: got[1] - Math.sin(f) * 3.2, face: f + rr(-0.3, 0.3) });
    } }
  // ── 5. 마당: 마을 가운데에서 가까운 텃밭에 무릎 꿇은 사람, 걸상에 앉은 노인 ──
  // 남아시아: 텃밭 대신 마당 아궁이 앞에 쪼그려 앉아 일하고(kneel), 걸상 대신 끈 침상(charpai)에 앉는다. 동아시아: 텃밭 앞, 평상 (요리법 activity)
  const BED = RCP.activity.bed, SEAT = RCP.activity.seat, SEAT_H = RCP.activity.seatH;
  { const beds = dressing.items.filter((it) => it.p === BED).sort((a, b) => Math.hypot(a.x - VC.x, a.z - VC.z) - Math.hypot(b.x - VC.x, b.z - VC.z));
    for (const bed of beds.slice(0, 6)) {
      const x = bed.x + Math.sin(bed.rot) * 0.95, z = bed.z + Math.cos(bed.rot) * 0.95;
      if (!free(x, z, 0.3, bed)) continue;
      add({ tier: 0, variant: pick(['f_apron', 'm_field']), action: 'kneel', place: 'yard', x, z, face: bed.rot + Math.PI, ignore: bed }); break;
    }
    const benches = dressing.items.filter((it) => it.p === SEAT && it.yard != null).sort((a, b) => Math.hypot(a.x - VC.x, a.z - VC.z) - Math.hypot(b.x - VC.x, b.z - VC.z));
    for (const b of benches.slice(0, 6)) {
      const x = b.x + Math.sin(b.rot) * 0.06, z = b.z + Math.cos(b.rot) * 0.06;
      if (!free(x, z, 0.2, b)) continue;
      add({ tier: 1, variant: pick(['elder', 'm_hood']), action: 'sit', place: 'yard', x, z, face: b.rot, sitOn: SEAT_H * b.s, ignore: b }); break;
    } }
  // ── 6. 길: 걷는 사람·자루 멘 사람·노인·아이 (골목을 오간다) ──
  const lanes = LANES.map((lp) => { const pts = smoothLine(lp, 3); return { pts, cum: polyCum(pts) }; });
  // 걷는 사람: 골목 하나에서 28~70 m 구간을 오간다. main 이면 마을 한가운데 큰길(LANES 0·1·3)에서 고른다 (오가는 사람이 가장 많은 길)
  const walker = (tier, variant, action, speed, main = false) => {
    const L = main ? lanes[[0, 1, 3][Math.floor(R() * 3)]] : lanes[Math.floor(R() * lanes.length)], total = L.cum[L.cum.length - 1];
    const len = Math.min(total - 2, rr(28, 70)), s0 = R() * Math.max(0, total - len), side = R() < 0.5 ? 1 : -1, off = rr(0.5, 1.4);
    const path = [];
    for (let s = s0; s <= s0 + len + 1e-6; s += 3) { const p = polyAt(L.pts, L.cum, s); path.push([p.x - p.tz * side * off, p.z + p.tx * side * off]); }
    if (path.length < 3) return null;
    return add({ tier, variant, action, place: 'lane', x: path[0][0], z: path[0][1], face: 0, path, speed, phase: R() });
  };
  walker(0, pick(['m_tunic', 'm_hood']), 'walk', rr(1.15, 1.35), true);
  walker(0, 'm_field', 'carry', rr(0.95, 1.1), true);
  walker(0, pick(['f_cloak', 'f_apron']), 'walk', rr(1.05, 1.25), true);
  walker(1, 'elder', 'walk', rr(0.6, 0.72));
  walker(1, 'child', 'walk', rr(1.2, 1.45));
  walker(1, pick(['m_tunic', 'f_apron', 'm_hood']), 'walk', rr(1.1, 1.3));
  walker(1, pick(['m_tunic', 'm_field']), 'carry', rr(0.95, 1.1));
  walker(2, pick(['f_cloak', 'm_tunic', 'child']), 'walk', rr(1.1, 1.35));
  walker(2, pick(['m_hood', 'f_apron']), 'walk', rr(1.1, 1.3));
  // 빈터(장터) 둘레를 서성이는 아이·어른
  for (let k = 0; k < 2; k++) {
    const a = R() * TAU, x = GREEN.x + Math.cos(a) * rr(4, 8), z = GREEN.z + Math.sin(a) * rr(4, 8);
    add({ tier: 2, variant: k ? 'child' : pick(['m_tunic', 'f_apron']), action: 'stand', place: 'green', x, z, face: R() * TAU });
  }

  // ── 고르기: 단(tier)마다 시드로 섞어 앞에서부터 n 명 ──
  const out = [];
  for (const tier of [0, 1, 2]) {
    const list = roles.filter((r) => r.tier === tier);
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    for (const r of list) {
      if (out.length >= n) break;
      if (!r.path && !r.fixed && !free(r.x, r.z, 0.3, r.ignore)) continue;
      out.push(r); taken.push([r.x, r.z]);
    }
  }
  // 모자라면 걷는 사람을 더 (길은 늘 비어 있다)
  for (let t = 0; out.length < n && t < 40; t++) { const w = walker(3, pick(['m_tunic', 'm_hood', 'f_apron', 'f_cloak', 'child']), 'walk', rr(1.05, 1.35)); if (w) out.push(w); }
  return out.map((r, id) => {
    const prim = pick(PAL.dyes), sec = R() < 0.8 ? pick(PAL.plain) : pick(PAL.dyes.filter((d) => d !== prim));
    const hair = r.variant === 'elder' ? GREY_HAIR : pick(PAL.hairs);
    const k = rr(PAL.skin[0], PAL.skin[1]), skin = [k * rr(1.0, 1.04), k, k * rr(0.95, 1.0)];
    const scale = r.variant === 'child' ? rr(0.58, 0.66) : r.variant.startsWith('f_') ? rr(0.95, 1.02) : rr(0.95, 1.04);
    const p = { id, variant: ctx.camp && PALETTES[kit + '_camp'] ? campVariant(r.variant, ctx.flavor) : r.variant, action: r.action, place: r.place, x: r.x, z: r.z, face: r.face, speed: r.speed ?? 0, phase: r.phase ?? R(), scale,
      palette: { prim, sec, hair, skin, nat: rr(0.92, 1.06), linen: pick(PAL.linens) } };
    if (r.path) p.path = r.path;
    if (r.sitOn != null) p.sitOn = r.sitOn;
    return p;
  });
}
