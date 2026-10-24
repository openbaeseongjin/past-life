# 남아시아 건물 세트 (시대 일반형 마을) — Blender 4.2 명령줄 스크립트. kit_common.py · kit_sa_common.py 를 함께 쓴다.
#   GLTFT=<gltf-transform 폴더> "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe" --background --python tools/blender/kit_southasia.py
#   (GLTFT 가 없으면 docs/past-life/tools/node_modules 를 본다 — kit_common.py 머리말)
# 결과: docs/past-life/assets/real/kits/southasia.glb (meshopt + WebP), kits/southasia.dims.json, kits/preview/southasia_*.png
# 노드 (특정 실존 건물을 본뜨지 않은 시대 일반형):
#   hut_mud_a       석회칠 흙집 — 붉은 흙 밑단, 박공 초가, 앞 처마 밑 툇마루(대나무 기둥)
#   hut_mud_b       맨흙 둥근 집 — 둥근 기단 둘레 툇마루, 처마 넓은 원뿔 초가, 꼭대기 엎은 항아리
#   house_courtyard 흙벽돌 안뜰집 — 네 채가 안뜰을 둘러싼 평지붕 집, 대문 통로·문 옆 걸터앉는 단, 뒤채 툇마루, 안뜰 툴시 단
#   house_town      두 층 읍내 벽돌집 — 아래층 가게·뾰족 아치 문, 위층 나무 발코니(까치발·난간 동자·기와 차양), 옥상 난간·작은 방
#   temple_small    나가라 양식 작은 사원 — 높은 기단·계단, 성소 위 휜 시카라(다섯 면 돌출·층 띠·모서리 아말라카·아말라카·칼라샤·깃발), 기둥 넷 앞 주랑과 계단 지붕
#   shrine_tree     나무 밑 신당 — 두 단 둥근 단(석회칠), 주홍 칠한 돌·등잔·작은 감실. 나무는 장면이 '<shrine_tree_trunk>' 자리에 세운다
#   well_step       물가 가트 — 물로 내려가는 사암 계단(땅 높이 0 에서 -2 m), 옆벽, 작은 정자(chhatri)
#   well_kuan       마을 우물 — 둥근 단(자갓), 우물 난간, 돌기둥 둘 + 들보 + 도르래, 항아리
#   granary         곳간 (골라) — 기둥 위 둥근 마루, 흙 바른 대나무 통, 원뿔 초가, 위 들창 + 대나무 사다리
#   market_stall_sa 장터 좌판 — 대나무 기둥 천 차양, 나무 평상 위 향신료 무더기·놋그릇·항아리, 매단 저울
#   (haveli 이름은 작업 4 의 큰 집으로 남겨 둔다)
# 각 조각: 바닥 가운데가 원점, 미터, 앞면 = glTF +Z (Blender -Y), 긴 축 = X. 연기 나는 곳마다 '<조각>_smoke' 빈 노드 (흙집은 초가 사이로).
# 재료 이름은 잉글랜드 세트와 같은 약속: 'glass' = 문·창 안 어둠 (장면이 밤에 불빛을 켠다).
# 환경변수: KIT_FAST=1 (굽기·렌더 표본 적게), KIT_ONLY=hut_mud_a,temple_small (일부만), KIT_NOPREVIEW=1, KIT_EXPORT=1 (일부만일 때 임시 폴더로 내보내기)
import os, sys, math, time, json
sys.dont_write_bytecode = True          # tools/blender 에 __pycache__ 를 남기지 않는다
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector, Matrix
import kit_common as K
from kit_common import Piece, box_vf, temp_obj, fbm, smin, smax, log
import kit_england as KE
import kit_props as KP
import kit_sa_common as S
from kit_sa_common import (Face, prism_ok, ring_ok, frustum_ok, wall_ok, add_vf, door_sa, window_sa, niche, thatch_hf, lin, pal_add,
                           Tm, Rz, Ry, Rx)

rad = math.radians
TP = lambda d: math.tan(rad(d))
NAME = 'southasia'
TILE = {'mud_lime': 2.2, 'mud_bare': 2.4, 'mud_red': 2.0, 'brick_old': 2.2, 'sandstone': 2.0, 'earth': 2.4, 'planks': 1.6, 'tiles': 1.6,
        'bamboo': 1.2, 'timber_dark': 1.2}


# ───────────────────────── 재료 ─────────────────────────
def setup_materials():
    T, X = K.prep_texture, lambda f: os.path.join(K.TEX, f)
    mk = K.make_material
    mk('mud_lime', T('sa_mud_lime_d', 'white_rough_plaster_diff_1k.jpg', tint=(1.0, 0.96, 0.88), gain=0.97, contrast=0.45, sat=0.3),
       X('white_rough_plaster_nor_gl_1k.jpg'), rough=0.95, nstr=0.8)
    mk('mud_bare', T('sa_mud_bare_d', 'patterned_clay_plaster_diff_1k.jpg', tint=(1.0, 0.84, 0.66), gain=0.8, sat=1.15, contrast=1.15),
       X('patterned_clay_plaster_nor_gl_1k.jpg'), rough=0.96, nstr=1.1)
    mk('mud_red', T('sa_mud_red_d', 'patterned_clay_plaster_diff_1k.jpg', tint=(1.0, 0.6, 0.44), gain=0.68, sat=1.35, contrast=1.1),
       X('patterned_clay_plaster_nor_gl_1k.jpg'), rough=0.96, nstr=1.0)
    mk('thatch', T('sa_thatch_d', 'reed_roof_04_diff_1k.jpg', tint=(1.0, 0.92, 0.74), gain=0.9, sat=0.7, tile_v=(0.075, 0.12)),
       T('sa_thatch_n', 'reed_roof_04_nor_gl_1k.jpg', tile_v=(0.075, 0.12), normal=True), rough=0.97, nstr=1.4)
    mk('brick_old', T('sa_brick_d', 'red_brick_plaster_patch_02_diff_1k.jpg', tint=(1.0, 0.95, 0.9), gain=0.95),
       X('red_brick_plaster_patch_02_nor_gl_1k.jpg'), rough=0.92, nstr=1.2)
    mk('sandstone', T('sa_sandstone_d', 'sandstone_blocks_08_diff_1k.jpg', tint=(1.04, 0.9, 0.74), gain=0.92, sat=1.15),
       X('sandstone_blocks_08_nor_gl_1k.jpg'), rough=0.9, nstr=1.0)
    mk('timber_dark', T('sa_timber_d', 'rough_wood_diff_1k.jpg', tint=(0.8, 0.64, 0.5), gain=0.6, sat=0.8, contrast=1.15),
       X('rough_wood_nor_gl_1k.jpg'), rough=0.85, nstr=1.0)
    mk('planks', T('sa_planks_d', 'old_planks_02_diff_1k.jpg', tint=(0.92, 0.8, 0.66), gain=0.9),
       X('old_planks_02_nor_gl_1k.jpg'), rough=0.85, nstr=1.0)
    mk('bamboo', T('sa_bamboo_d', 'bamboo_wall_diff_1k.jpg', tint=(1.05, 0.95, 0.78), gain=1.0, sat=0.8),
       X('bamboo_wall_nor_gl_1k.jpg'), rough=0.8, nstr=1.0)
    mk('tiles', T('sa_tiles_d', 'clay_roof_tiles_02_diff_1k.jpg', gain=0.9, sat=0.9),
       X('clay_roof_tiles_02_nor_gl_1k.jpg'), rough=0.85, nstr=1.2)
    mk('canvas', T('sa_canvas_d', 'rough_linen_diff_1k.jpg', stripes=(3, (0.84, 0.52, 0.14), (0.56, 0.15, 0.1))),
       X('rough_linen_nor_gl_1k.jpg'), rough=0.95, nstr=0.6, double=True)
    mk('canvas_jute', T('sa_jute_d', 'rough_linen_diff_1k.jpg', tint=(0.84, 0.68, 0.46), gain=0.86, sat=0.85),
       X('rough_linen_nor_gl_1k.jpg'), rough=0.95, nstr=1.2)
    mk('glass', color=(0.025, 0.02, 0.016), rough=0.6, emit=(1.0, 0.55, 0.22), emit_strength=0.0)
    mk('coals', color=(0.04, 0.02, 0.01), rough=1.0, emit=(1.0, 0.36, 0.08), emit_strength=6.0)
    mk('shade', color=(0.085, 0.062, 0.045), rough=0.92)          # 넓은 가게 안 어둠 (밤에 켜지는 'glass' 가 아니다: 큰 판이 통째로 빛나지 않게)
    mk('iron', color=(0.05, 0.048, 0.045), rough=0.55, metal=0.7)
    mk('brass', color=(0.55, 0.38, 0.12), rough=0.35, metal=0.9)
    mk('water', color=(0.02, 0.03, 0.03), rough=0.08)
    S.palette_material()


def F_(P, side, plane):
    return Face(P, side, plane, TILE)


# ───────────────────────── 지붕 도구 ─────────────────────────
def gable_thatch(P, L, D, H, pitch, t=0.3, oF=0.45, oB=0.45, oG=0.42, sag=0.1, cap=True):
    """박공 초가: 앞(-y) 처마 oF, 뒤 oB 를 따로 (앞 처마를 툇마루까지 늘인다)."""
    seed = P.rng.randrange(1000)
    fz, xe, Hu, zr = KE.roof_fn(L, D, H, pitch, t, 'gable', 0.5, oG, 0.0, None, sag, (0.03, 0.012), seed, None, 0.35, 0.0)
    thatch_hf(P, fz, -xe, xe, -D / 2 - oF, D / 2 + oB, t, pitch)
    if cap:
        KE.ridge_cap(P, fz, -xe + 0.06, xe - 0.06, 0.0, pitch, tapered=False)
    return fz, Hu, zr


def polar_thatch(P, ztop, r_max, t=0.3, n=32, dr=0.17, mat='thatch', tile=2.0, noise=(0.035, 0.012), bevel=0.07):
    """둥근 초가 (원뿔): ztop(r) = 윗면 높이. 꼭대기 한 점 + 고리들, 둘레 n 조각. 두께는 아래로 (Solidify)."""
    seed = P.rng.randrange(1000)
    nr = max(3, int(r_max / dr))
    rs = [r_max * (i + 1) / nr for i in range(nr)]
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')

    def zf(x, y, r):
        return ztop(r) + (noise[0] * fbm(x * 0.6 + 5, y * 0.6, seed) + noise[1] * fbm(x * 2.2, y * 2.2, seed + 11)) * min(1.0, r / 0.8)
    apex = bm.verts.new((0.0, 0.0, ztop(0.0)))
    rings = []
    for r in rs:
        ring = []
        for k in range(n):
            a = 2 * math.pi * k / n
            x, y = r * math.cos(a), r * math.sin(a)
            ring.append(bm.verts.new((x, y, zf(x, y, r))))
        rings.append(ring)
    # 경사 따라 거리 (v)
    sd = [0.0]
    prev = (0.0, ztop(0.0))
    for r in rs:
        z = ztop(r)
        sd.append(sd[-1] + math.hypot(r - prev[0], z - prev[1]))
        prev = (r, z)
    C = 2 * math.pi * r_max * 0.6

    def uv(i, k):      # i: 0 = 꼭대기, 1.. = 고리
        return ((k / n) * C / tile, -sd[i] / tile)
    for k in range(n):
        k1 = (k + 1) % n
        f = bm.faces.new((apex, rings[0][k], rings[0][k1]))
        for l, (i, kk) in zip(f.loops, ((0, k + 0.5), (1, k), (1, k + 1))):
            l[uvl].uv = uv(i, kk)
    for i in range(len(rings) - 1):
        for k in range(n):
            k1 = (k + 1) % n
            f = bm.faces.new((rings[i][k], rings[i + 1][k], rings[i + 1][k1], rings[i][k1]))
            for l, (ii, kk) in zip(f.loops, ((i + 1, k), (i + 2, k), (i + 2, k + 1), (i + 1, k + 1))):
                l[uvl].uv = uv(ii, kk)
    for f in bm.faces:
        f.smooth = True
    me = bpy.data.meshes.new('cone')
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new('cone', me)
    bpy.context.scene.collection.objects.link(ob)
    sol = ob.modifiers.new('sol', 'SOLIDIFY')
    sol.thickness = t
    sol.offset = -1.0
    sol.use_even_offset = True
    sol.use_quality_normals = True
    sol.use_rim = True
    if bevel > 0:
        bv = ob.modifiers.new('bev', 'BEVEL')
        bv.width = bevel
        bv.segments = 2
        bv.limit_method = 'ANGLE'
        bv.angle_limit = rad(55)
    P.add_obj(ob, mat, keep_uv=True, smooth=True)
    return ztop(0.0)


def tile_canopy(P, xa, xb, y_in, y_out, z_in, pitch, t=0.07, mat='tiles', fascia=True):
    """기와 차양 (벽에서 앞으로 내려가는 외쪽 지붕): y_in(벽) 에서 윗면 z_in, y_out 쪽으로 pitch 만큼 내려간다."""
    tp = TP(pitch)
    seed = P.rng.randrange(99)

    def fz(x, y):
        return z_in - (y_in - y) * tp + 0.004 * fbm(x, y, seed)
    xs = lin(xa, xb, max(2, int((xb - xa) / 0.5)))
    ys = lin(y_out, y_in, max(2, int((y_in - y_out) / 0.4)))
    sp = math.sin(rad(pitch))

    def uvf(me, poly):
        return [(me.vertices[i].co.x / 1.6, me.vertices[i].co.z / sp / 1.6) for i in poly.vertices]
    ob = K.heightfield(fz, xs, ys, t, bevel_w=0.01, bevel_seg=1, uvfn=uvf, name='tiles')
    P.add_obj(ob, mat, keep_uv=True)
    if fascia:
        P.beam((xa, y_out + 0.03, fz(xa, y_out) - t - 0.06), (xb, y_out + 0.03, fz(xb, y_out) - t - 0.06), 0.04, 0.12, 'timber_dark')
    return fz


# ───────────────────────── 작은 꾸밈 ─────────────────────────
def clay_pot(P, M, s=1.0, color='clay_pot'):
    """흙 항아리 (마트카): 둥근 몸 + 좁은 목 + 입술."""
    prof = [(0.0, 0.0), (0.09, 0.005), (0.17, 0.06), (0.2, 0.15), (0.18, 0.25), (0.12, 0.31), (0.085, 0.335), (0.1, 0.36), (0.085, 0.365)]
    pal_add(P, KP.lathe_bm([(r * s, z * s) for r, z in prof], n=14, cap0=False), color, smooth=True, matrix=M)


def brass_pot(P, M, s=1.0):
    prof = [(0.0, 0.0), (0.06, 0.002), (0.1, 0.04), (0.11, 0.09), (0.08, 0.15), (0.05, 0.18), (0.065, 0.2), (0.055, 0.205)]
    bm = KP.lathe_bm([(r * s, z * s) for r, z in prof], n=14)
    P.add_bm(bm, 'brass', uv=False, smooth=True, matrix=M)


def diya(P, M):
    """흙 등잔 + 불꽃."""
    pal_add(P, KP.lathe_bm([(0.0, 0.0), (0.035, 0.004), (0.05, 0.025), (0.045, 0.03), (0.0, 0.018)], n=8), 'clay_pot', matrix=M)
    pal_add(P, KP.lathe_bm([(0.008, 0.025), (0.0, 0.06)], n=5), 'flame', matrix=M)


def leaf_bush(P, cx, cy, z0, r, h, n, cols, seed=1, s=0.07):
    """작은 덤불 (툴시 등): 납작한 잎 덩이 n 개를 반구 안에."""
    rng = P.rng
    for k in range(n):
        a = k * 2.39996
        q = math.sqrt((k + 0.5) / n)
        x, y = cx + math.cos(a) * r * q, cy + math.sin(a) * r * q
        z = z0 + h * (1 - q * q) ** 0.5 * rng.uniform(0.7, 1.0)
        rot = (Rz(rng.uniform(0, 6.3)) @ Rx(rng.uniform(-0.6, 0.6))).to_3x3()
        pal_add(P, KP.ellipsoid_bm((x, y, z), (s, s * 0.7, s * 0.35), nu=6, nv=3, rot=rot), cols[k % len(cols)])


def spout(P, x, y, z, dx, dy, L=0.45):
    P.beam((x, y, z), (x + dx * L, y + dy * L, z - 0.05), 0.11, 0.09, 'timber_dark', bevel=0.01)


def parapet_ring(P, x0, x1, y0, y1, z0, h, t, mat='mud_bare', cap='mud_lime', cap_t=0.05, bevel=0.03):
    for (a, b, c, d) in ((x0, x1, y0, y0 + t), (x0, x1, y1 - t, y1), (x0, x0 + t, y0 + t, y1 - t), (x1 - t, x1, y0 + t, y1 - t)):
        P.box(a, b, c, d, z0 - 0.05, z0 + h, mat, bevel=bevel, tile=TILE.get(mat, 2.0))
        if cap:
            P.box(a - 0.02, b + 0.02, c - 0.02, d + 0.02, z0 + h, z0 + h + cap_t, cap, bevel=0.01, tile=TILE.get(cap, 2.0))


# ───────────────────────── 조각들 ─────────────────────────
def hut_mud_a():
    """석회칠 흙집: 붉은 흙 밑단, 박공 초가, 앞 처마 밑 툇마루(대나무 기둥), 두 짝 나무문, 창살 창, 등잔 감실."""
    P = Piece('hut_mud_a', 2101)
    L, D, H, pitch = 5.4, 3.8, 2.6, 30
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    zp, ver = 0.36, 1.35
    P.box(x0 - 0.3, x1 + 0.3, y0 - ver, y1 + 0.25, -0.45, zp, 'mud_red', bevel=0.06, seg=2, tile=2.0)
    P.box(-0.75, 0.75, y0 - ver - 0.4, y0 - ver + 0.05, -0.3, zp * 0.5, 'mud_red', bevel=0.04, seg=2, tile=2.0)   # 디딤단
    cuts = []
    Ff, Fb, Fl, Fr = F_(P, '-y', y0), F_(P, '+y', y1), F_(P, '-x', x0), F_(P, '+x', x1)
    door_sa(Ff, cuts, -0.8, 0.9, 1.72, zp, 0.42, leaves='ajar', lime_frame=False)
    window_sa(Ff, cuts, 1.35, 0.55, 0.52, 1.18, 0.38, bars=3, shutters='open')
    window_sa(Fl, cuts, Fl.loc(0.3), 0.45, 0.45, 1.25, 0.38, bars=2)
    window_sa(Fb, cuts, Fb.loc(-1.2), 0.45, 0.45, 1.3, 0.38, bars=2)
    niche(Ff, cuts, 0.38, 0.24, 0.3, 1.3)
    niche(Fr, cuts, Fr.loc(0.4), 0.24, 0.3, 1.3)
    zb = zp + 0.55
    wall_ok(P, [box_vf(x0, x1, y0, y1, zp - 0.05, zb)], 'mud_red', cuts, tile=2.0, bevel=0.05)
    wall_ok(P, [prism_ok(KE.gable_profile(y0, y1, H, pitch, zb), 'x', x0, x1)], 'mud_lime', cuts, tile=2.2, bevel=0.05)
    t = 0.3
    fz, Hu, zr = gable_thatch(P, L, D, H, pitch, t=t, oF=ver + 0.05, oB=0.45, oG=0.42, sag=0.1)
    # 툇마루 기둥 (대나무) + 도리
    yp = y0 - ver + 0.28
    cosp = math.cos(rad(pitch))
    for x in (-2.45, -1.0, 1.0, 2.45):
        ztop = fz(x, yp) - t / cosp - 0.04
        P.box(x - 0.11, x + 0.11, yp - 0.11, yp + 0.11, zp, zp + 0.08, 'sandstone', bevel=0.02, tile=1.0)
        P.cyl(0.06, 0.055, ztop - zp - 0.08, 'bamboo', n=8, matrix=Tm(x, yp, zp + 0.08), tile=0.6)
    zt = fz(0.0, yp) - t / cosp - 0.04
    P.beam((-2.75, yp, zt - 0.03), (2.75, yp, zt - 0.03), 0.09, 0.09, 'bamboo', bevel=0.01)
    # 툇마루의 물항아리 둘 + 문 옆 등잔
    clay_pot(P, Tm(2.05, y0 - 0.35, zp), 1.0)
    clay_pot(P, Tm(2.38, y0 - 0.32, zp), 0.85, 'clay_dark')
    P.marker('hut_mud_a_smoke', (x1 - 0.7, 0.0, zr + 0.15))
    return P


def hut_mud_b():
    """맨흙 둥근 집: 둥근 기단 둘레 툇마루, 처마가 넓은 원뿔 초가(대나무 기둥 고리가 받침), 꼭대기에 엎은 항아리."""
    P = Piece('hut_mud_b', 2102)
    R, H = 2.15, 2.5
    zp, n = 0.34, 28

    def disc(r):
        return [(r * math.cos(2 * math.pi * k / n), r * math.sin(2 * math.pi * k / n)) for k in range(n)]
    add_vf(P, prism_ok(disc(3.2), 'z', -0.45, zp), 'mud_red', tile=2.0, bevel=0.05)
    P.box(-0.6, 0.6, -3.55, -3.0, -0.3, zp * 0.5, 'mud_red', bevel=0.04, seg=2, tile=2.0)
    cuts = []
    Ff = F_(P, '-y', -R)
    door_sa(Ff, cuts, 0.0, 0.88, 1.72, zp, 0.45, leaves='closed')
    Fl, Fr, Fb = F_(P, '-x', -R), F_(P, '+x', R), F_(P, '+y', R)
    window_sa(Fl, cuts, 0.0, 0.42, 0.42, 1.25, 0.4, bars=2)
    window_sa(Fr, cuts, 0.0, 0.42, 0.42, 1.25, 0.4, bars=2, shutters='open')
    niche(Ff, cuts, 0.95, 0.22, 0.28, 1.3)
    wall_ok(P, [prism_ok(disc(R), 'z', zp - 0.05, H)], 'mud_bare', cuts, tile=2.4, bevel=0.05)
    t = 0.3
    t_in, t_out = TP(47), TP(21)

    def under(r):
        return smax(H + (R - r) * t_in, H + (R - r) * t_out, 0.35)

    def ztop(r):
        e = 0.01
        sl = abs(under(r + e) - under(r - e)) / (2 * e)
        return under(r) + t * math.sqrt(1 + sl * sl)
    za = polar_thatch(P, ztop, 3.35, t=t, n=36)
    # 꼭대기: 짚 매듭 + 엎은 항아리
    P.add_bm(KP.lathe_bm([(0.32, za - 0.25), (0.26, za + 0.02), (0.12, za + 0.12), (0.0, za + 0.15)], n=12), 'thatch', uv=False, smooth=True)
    clay_pot(P, Tm(0, 0, za + 0.5) @ Rx(math.pi), 0.9)
    # 툇마루 기둥 고리 + 도리
    rp, npost = 2.9, 10
    pts = []
    for k in range(npost):
        a = 2 * math.pi * (k + 0.5) / npost
        x, y = rp * math.cos(a), rp * math.sin(a)
        zt = under(rp) - 0.03
        P.cyl(0.055, 0.05, zt - zp, 'bamboo', n=8, matrix=Tm(x, y, zp), tile=0.6)
        pts.append((x, y, zt))
    for k in range(npost):
        a, b = pts[k], pts[(k + 1) % npost]
        P.beam(a, b, 0.08, 0.08, 'bamboo', bevel=0.01, ext=0.05)
    clay_pot(P, Tm(-1.25, -2.35, zp), 1.0)
    P.marker('hut_mud_b_smoke', (0.0, 0.25, za + 0.4))
    return P


def house_courtyard():
    """흙벽돌 안뜰집: 네 채가 안뜰을 둘러싼 평지붕, 낮은 난간벽·석회 갓, 대문 통로(두 짝 문 활짝)·문 옆 걸터앉는 단,
    뒤채 툇마루(나무 기둥·도리), 안뜰 가운데 툴시 단, 빗물 홈통."""
    P = Piece('house_courtyard', 2103)
    x0, x1, y0, y1 = -6.0, 6.0, -5.4, 5.4
    cx0, cx1, cy0, cy1 = -2.8, 2.8, -1.9, 2.0
    zp, H = 0.42, 3.15
    vd = 1.7
    P.box(x0 - 0.25, x1 + 0.25, y0 - 0.25, y1 + 0.25, -0.45, zp, 'mud_red', bevel=0.05, seg=2, tile=2.0)
    cuts = [box_vf(cx0, cx1, cy0, cy1, zp, H + 1.0),                     # 안뜰
            box_vf(cx0, cx1, cy1 - 0.01, cy1 + vd, zp, 2.62),             # 뒤채 툇마루
            box_vf(-0.85, 0.85, y0 - 1.0, cy0 + 0.1, zp, 2.45)]           # 대문 통로
    Ff, Fb, Fl, Fr = F_(P, '-y', y0), F_(P, '+y', y1), F_(P, '-x', x0), F_(P, '+x', x1)
    door_sa(Ff, cuts, 0.0, 1.7, 2.3, zp, 0.45, leaves='open', lime_frame=True, dark=False)
    for sx in (-1, 1):
        window_sa(Ff, cuts, sx * 3.7, 0.5, 0.55, 1.75, 0.4, bars=3, lime_frame=True)
        niche(Ff, cuts, sx * 1.42, 0.22, 0.3, 1.45)
        # 문 옆 걸터앉는 단 (chabutra)
        a, b = sorted((sx * 1.2, sx * 2.6))
        P.box(a, b, y0 - 0.95, y0 + 0.02, zp - 0.05, zp + 0.48, 'mud_red', bevel=0.04, seg=2, tile=2.0)
        P.box(a - 0.02, b + 0.02, y0 - 0.97, y0 + 0.02, zp + 0.48, zp + 0.53, 'mud_lime', bevel=0.012, tile=1.4)
    window_sa(Fl, cuts, Fl.loc(1.5), 0.45, 0.5, 1.8, 0.4, bars=2)
    window_sa(Fl, cuts, Fl.loc(-2.6), 0.45, 0.5, 1.8, 0.4, bars=2)
    window_sa(Fr, cuts, Fr.loc(0.0), 0.45, 0.5, 1.8, 0.4, bars=2, shutters='open')
    window_sa(Fb, cuts, Fb.loc(2.5), 0.45, 0.5, 1.8, 0.4, bars=2)
    window_sa(Fb, cuts, Fb.loc(-2.5), 0.45, 0.5, 1.8, 0.4, bars=2)
    # 안뜰 쪽 벽: 앞채(+y 를 봄), 옆채, 툇마루 뒤벽
    Ci = F_(P, '+y', cy0)
    for sx in (-1, 1):
        door_sa(Ci, cuts, Ci.loc(sx * 1.85), 0.82, 1.78, zp, 0.4, leaves='closed' if sx < 0 else 'ajar', lime_frame=True)
    Cl, Cr = F_(P, '+x', cx0), F_(P, '-x', cx1)
    door_sa(Cl, cuts, Cl.loc(0.6), 0.82, 1.78, zp, 0.4, leaves='ajar', lime_frame=True)
    window_sa(Cl, cuts, Cl.loc(-1.1), 0.45, 0.5, 1.3, 0.4, bars=2)
    door_sa(Cr, cuts, Cr.loc(-0.6), 0.82, 1.78, zp, 0.4, leaves='closed', lime_frame=True)
    window_sa(Cr, cuts, Cr.loc(1.1), 0.45, 0.5, 1.3, 0.4, bars=2, shutters='open')
    Cv = F_(P, '-y', cy1 + vd)
    door_sa(Cv, cuts, -1.4, 0.85, 1.85, zp, 0.4, leaves='ajar', lime_frame=True)
    door_sa(Cv, cuts, 1.4, 0.85, 1.85, zp, 0.4, leaves='closed', lime_frame=True)
    niche(Cv, cuts, 0.0, 0.3, 0.42, 1.25)
    wall_ok(P, [box_vf(x0, x1, y0, y1, zp - 0.05, H)], 'mud_bare', cuts, tile=2.4, bevel=0.04)
    # 툇마루 나무 기둥 + 도리 + 받침돌
    yv = cy1 + 0.14
    for x in (cx0 + 0.16, -0.95, 0.95, cx1 - 0.16):
        P.box(x - 0.14, x + 0.14, yv - 0.14, yv + 0.14, zp, zp + 0.14, 'sandstone', bevel=0.02, tile=1.0)
        P.beam((x, yv, zp + 0.14), (x, yv, 2.42), 0.16, 0.16, 'timber_dark', bevel=0.012, up=(0, -1, 0))
        P.box(x - 0.28, x + 0.28, yv - 0.1, yv + 0.1, 2.36, 2.46, 'timber_dark', bevel=0.012, tile=1.0, grain='x')   # 까치발 머리
    P.beam((cx0, yv, 2.54), (cx1, yv, 2.54), 0.18, 0.16, 'timber_dark', bevel=0.012)
    # 바깥벽 꾸밈 (삼각형 적게): 석회 처마 턱(난간 밑), 위 석회 띠, 아래 붉은 흙 밑단, 석회 덧바른 자국, 대문 들보·까치발·놋 장식, 디딤돌, 감실 테
    for (a, b, c, d) in ((x0 - 0.1, x1 + 0.1, y0 - 0.1, y0 + 0.2), (x0 - 0.1, x1 + 0.1, y1 - 0.2, y1 + 0.1), (x0 - 0.1, x0 + 0.2, y0, y1), (x1 - 0.2, x1 + 0.1, y0, y1)):
        P.box(a, b, c, d, H - 0.14, H + 0.01, 'mud_lime', bevel=0.025, tile=1.6)
    for (a, b, c, d) in ((x0 - 0.02, x1 + 0.02, y0 - 0.02, y0 + 0.1), (x0 - 0.02, x0 + 0.1, y0, y1), (x1 - 0.1, x1 + 0.02, y0, y1), (x0 - 0.02, x1 + 0.02, y1 - 0.1, y1 + 0.02)):
        P.box(a, b, c, d, H - 0.52, H - 0.3, 'mud_lime', tile=1.8)
    for (a, b) in ((x0 - 0.02, -2.75), (2.75, x1 + 0.02)):
        P.box(a, b, y0 - 0.02, y0 + 0.1, zp - 0.02, zp + 0.48, 'mud_red', tile=2.0)
    for (a, b, c, d) in ((x0 - 0.02, x0 + 0.1, y0, y1), (x1 - 0.1, x1 + 0.02, y0, y1), (x0, x1, y1 - 0.1, y1 + 0.02)):
        P.box(a, b, c, d, zp - 0.02, zp + 0.48, 'mud_red', tile=2.0)
    rng = P.rng
    for k in range(7):                       # 석회 덧바른 자국 (옆·뒤 벽, 창 없는 높이)
        side = k % 3
        u, w_, z0_, h_ = rng.uniform(-4.0, 4.0), rng.uniform(0.5, 1.2), rng.uniform(0.95, 1.4), rng.uniform(0.25, 0.32)
        if side == 0:
            P.box(x0 - 0.015, x0 + 0.05, u * 1.1 - w_ / 2, u * 1.1 + w_ / 2, z0_, z0_ + h_, 'mud_lime', bevel=0.01, tile=1.4)
        elif side == 1:
            P.box(x1 - 0.05, x1 + 0.015, u * 1.1 - w_ / 2, u * 1.1 + w_ / 2, z0_, z0_ + h_, 'mud_lime', bevel=0.01, tile=1.4)
        else:
            P.box(u * 1.3 - w_ / 2, u * 1.3 + w_ / 2, y1 - 0.05, y1 + 0.015, z0_, z0_ + h_, 'mud_lime', bevel=0.01, tile=1.4)
    gz = zp + 2.3
    P.box(-1.32, 1.32, y0 - 0.2, y0 + 0.12, gz + 0.16, gz + 0.36, 'timber_dark', bevel=0.015, tile=(1.6, 0.8), grain='x')      # 대문 들보
    P.box(-1.4, 1.4, y0 - 0.24, y0 + 0.12, gz + 0.36, gz + 0.42, 'timber_dark', bevel=0.01, tile=(1.6, 0.8), grain='x')
    for sx in (-1, 1):
        add_vf(P, prism_ok([(y0 + 0.05, gz + 0.16), (y0 - 0.18, gz + 0.16), (y0 + 0.05, gz - 0.2)], 'x', sx * 1.05 - 0.06, sx * 1.05 + 0.06), 'timber_dark', tile=1.0)
    for k in range(7):                       # 들보 놋 장식
        P.cyl(0.028, 0.028, 0.03, 'brass', n=6, matrix=Tm(-0.9 + k * 0.3, y0 - 0.2, gz + 0.26) @ Rx(rad(90)), tile=0.3)
    for k in range(3):                       # 문설주 놋 못
        for sx in (-1, 1):
            P.cyl(0.024, 0.024, 0.03, 'brass', n=6, matrix=Tm(sx * 0.93, y0 - 0.04, zp + 0.5 + k * 0.7) @ Rx(rad(90)), tile=0.3)
    P.box(-1.15, 1.15, y0 - 0.75, y0 - 0.05, zp - 0.2, zp - 0.02, 'sandstone', bevel=0.02, tile=1.4)                      # 디딤돌
    Fn = F_(P, '-y', y0)
    for sx in (-1, 1):                       # 감실 테 (석회): 양옆 + 위 + 턱 (홈은 막지 않는다)
        c = sx * 1.42
        Fn.box(c - 0.21, c - 0.12, -0.015, 0.0, 1.38, 1.86, 'mud_lime', tile=1.2)
        Fn.box(c + 0.12, c + 0.21, -0.015, 0.0, 1.38, 1.86, 'mud_lime', tile=1.2)
        Fn.box(c - 0.21, c + 0.21, -0.015, 0.0, 1.86, 1.94, 'mud_lime', tile=1.2)
        Fn.box(c - 0.21, c + 0.21, -0.03, 0.0, 1.36, 1.43, 'mud_lime', tile=1.2)
    # 지붕: 난간벽 (바깥 + 안뜰 둘레), 석회 갓, 빗물 홈통
    parapet_ring(P, x0, x1, y0, y1, H, 0.5, 0.26)
    parapet_ring(P, cx0 - 0.26, cx1 + 0.26, cy0 - 0.26, cy1 + 0.26, H, 0.42, 0.26)
    for x in (-4.6, -1.8, 4.2):
        spout(P, x, y0 + 0.1, H + 0.08, 0, -1)
    for y in (-3.0, 2.6):
        spout(P, x0 + 0.1, y, H + 0.08, -1, 0)
        spout(P, x1 - 0.1, y, H + 0.08, 1, 0)
    # 안뜰 툴시 단 + 항아리들
    tx, ty = 0.0, 0.1
    P.box(tx - 0.3, tx + 0.3, ty - 0.3, ty + 0.3, zp, zp + 0.72, 'mud_lime', bevel=0.03, tile=1.2)
    P.box(tx - 0.37, tx + 0.37, ty - 0.37, ty + 0.37, zp + 0.72, zp + 0.92, 'mud_red', bevel=0.02, tile=1.2)
    leaf_bush(P, tx, ty, zp + 0.92, 0.26, 0.42, 26, ['tulsi', 'leaf_dark', 'leaf'], s=0.06)
    diya(P, Tm(tx, ty - 0.32, zp + 0.25))
    P.box(tx - 0.1, tx + 0.1, ty - 0.31, ty - 0.29, zp + 0.18, zp + 0.36, 'glass', tile=1.0)
    for k, x in enumerate((-2.2, -1.85, 2.1)):
        clay_pot(P, Tm(x, cy1 + vd - 0.3, zp), 1.0 if k != 1 else 0.8, 'clay_pot' if k != 1 else 'clay_dark')
    P.marker('house_courtyard_smoke', (x0 + 1.4, 3.6, H + 0.7))
    return P


def house_town():
    """두 층 읍내 벽돌집: 아래층 가게(깊은 어둠·나무 평상)·뾰족 아치 문, 아래층 기와 차양, 위층 나무 발코니(까치발·난간 동자·기와 차양),
    덧문 단 아치 창, 사암 띠·갓돌, 옥상 난간과 작은 방·모서리 정자 꼭지."""
    P = Piece('house_town', 2104)
    W, D = 6.2, 8.0
    x0, x1, y0, y1 = -W / 2, W / 2, -D / 2, D / 2
    zp, H1, H2, Hp = 0.55, 3.45, 6.75, 7.35
    P.box(x0 - 0.12, x1 + 0.12, y0 - 0.12, y1 + 0.12, -0.5, zp, 'sandstone', bevel=0.02, tile=2.0)
    P.box(x0 + 0.1, x1 - 0.1, y0 - 0.55, y0 - 0.1, -0.3, zp * 0.5, 'sandstone', bevel=0.02, tile=2.0)
    cuts = []
    Ff, Fb, Fl, Fr = F_(P, '-y', y0), F_(P, '+y', y1), F_(P, '-x', x0), F_(P, '+x', x1)
    # 가게: 깊은 홈 + 안 어둠 + 앉는 평상 + 접은 덧문 판자
    sc, sw, sh = -1.05, 2.6, 2.45
    cuts.append(Ff.cutter(sc - sw / 2, sc + sw / 2, zp, zp + sh, 1.7))
    Ff.box(sc - sw / 2, sc + sw / 2, 1.66, 1.72, zp, zp + sh, 'shade', tile=1.0)
    # 가게 안 선반 두 단 + 물건 (빈 어둠이 아니라 팔 것이 보이게)
    for k, zs in enumerate((zp + 1.12, zp + 1.72)):
        Ff.box(sc - sw / 2 + 0.06, sc + sw / 2 - 0.06, 1.28, 1.66, zs - 0.05, zs, 'planks', bevel=0.006, tile=1.2)
        xs = [sc - sw / 2 + 0.32 + i * (sw - 0.64) / (4 - k) for i in range(5 - k)]
        for i, x in enumerate(xs):
            q = Ff.pt(x, 1.47, zs)
            if (i + k) % 3 == 2:
                brass_pot(P, Tm(q.x, q.y, q.z), 0.62 - 0.08 * k)
            else:
                clay_pot(P, Tm(q.x, q.y, q.z), 0.66 - 0.1 * k, 'clay_pot' if (i + k) % 2 == 0 else 'clay_dark')
    for i, x in enumerate((sc - 0.75, sc - 0.25, sc + 0.4)):      # 평상 위 자루·광주리
        Ff.box(x - 0.2, x + 0.2, 1.0, 1.4, zp + 0.42, zp + 0.42 + (0.38 if i != 1 else 0.22), 'canvas_jute' if i != 1 else 'canvas', bevel=0.06, tile=1.0)
    Ff.box(sc - sw / 2 + 0.02, sc + sw / 2 - 0.02, 0.12, 1.66, zp, zp + 0.42, 'planks', bevel=0.01, tile=1.4)
    for sx in (-1, 1):
        xx = sc + sx * (sw / 2 - 0.06)
        for k in range(3):
            Ff.box(xx - 0.03 + sx * (-0.05 * k), xx + 0.03 + sx * (-0.05 * k), 0.08 + 0.02 * k, 0.12 + 0.02 * k, zp + 0.42, zp + sh - 0.05, 'planks', tile=1.2)
    Ff.box(sc - sw / 2 - 0.12, sc + sw / 2 + 0.12, -0.06, 0.2, zp + sh, zp + sh + 0.2, 'timber_dark', bevel=0.012, grain='x', tile=(1.6, 0.8))
    door_sa(Ff, cuts, 1.9, 1.05, 1.95, zp, 0.5, leaves='closed', arch='cusp', mat_frame='sandstone')
    # 층 띠, 아래층 기와 차양 (+ 까치발)
    P.box(x0 - 0.1, x1 + 0.1, y0 - 0.1, y1 + 0.1, H1 - 0.06, H1 + 0.1, 'sandstone', bevel=0.02, tile=2.0)
    tile_canopy(P, x0 - 0.05, x1 + 0.05, y0, y0 - 0.95, H1 - 0.18, 17)
    for x in (x0 + 0.2, 0.8, x1 - 0.2):          # 가게 문·대문 사이 벽에서 나온 까치발
        P.beam((x, y0 + 0.02, H1 - 0.85), (x, y0 - 0.82, H1 - 0.48), 0.08, 0.08, 'timber_dark', bevel=0.008)
    # 위층 발코니 (자로카): 마루 + 까치발 + 아래 판 + 난간 동자 + 기둥 + 도리 + 기와 차양
    bw, bd = 2.9, 0.78
    zf = H1 + 0.4
    bx0, bx1, by0 = -bw / 2, bw / 2, y0 - bd
    P.box(bx0, bx1, by0, y0 + 0.05, zf - 0.12, zf, 'timber_dark', bevel=0.01, tile=1.2)
    for x in (bx0 + 0.12, -0.45, 0.45, bx1 - 0.12):
        add_vf(P, prism_ok([(y0, zf - 0.12), (by0 + 0.06, zf - 0.12), (y0, zf - 0.8)], 'x', x - 0.06, x + 0.06), 'timber_dark', tile=1.0)
        P.cyl(0.035, 0.035, 0.12, 'timber_dark', n=8, matrix=Tm(x, by0 + 0.1, zf - 0.24), tile=0.5)
    P.box(bx0, bx1, by0, by0 + 0.05, zf, zf + 0.34, 'planks', bevel=0.006, tile=1.2)
    for sx in (-1, 1):
        xx = bx0 if sx < 0 else bx1 - 0.05
        P.box(xx, xx + 0.05, by0, y0, zf, zf + 0.34, 'planks', bevel=0.006, tile=1.2)
    rail_z = zf + 0.9
    P.box(bx0 - 0.02, bx1 + 0.02, by0 - 0.02, by0 + 0.07, rail_z, rail_z + 0.06, 'timber_dark', bevel=0.008, grain='x', tile=(1.6, 0.8))
    for sx in (-1, 1):
        xx = bx0 - 0.02 if sx < 0 else bx1 - 0.07
        P.box(xx, xx + 0.09, by0, y0, rail_z, rail_z + 0.06, 'timber_dark', bevel=0.008, tile=1.0)
    nb = 18
    for k in range(nb):
        x = bx0 + 0.12 + (bw - 0.24) * k / (nb - 1)
        P.add_bm(KP.lathe_bm([(0.022, 0.0), (0.03, 0.08), (0.018, 0.2), (0.032, 0.36), (0.02, 0.5), (0.024, 0.56)], n=6), 'timber_dark', uv=False, smooth=True,
                 matrix=Tm(x, by0 + 0.025, zf + 0.34))
    for y in (by0 + 0.2, by0 + 0.45, y0 - 0.12):
        for sx in (-1, 1):
            P.add_bm(KP.lathe_bm([(0.022, 0.0), (0.03, 0.08), (0.018, 0.2), (0.032, 0.36), (0.02, 0.5), (0.024, 0.56)], n=6), 'timber_dark', uv=False, smooth=True,
                     matrix=Tm(sx * (bw / 2 - 0.025), y, zf + 0.34))
    ztop = zf + 2.2
    for x in (bx0 + 0.06, -0.48, 0.48, bx1 - 0.06):
        P.box(x - 0.05, x + 0.05, by0 + 0.02, by0 + 0.12, zf, ztop, 'timber_dark', bevel=0.01, tile=1.0)
        P.box(x - 0.09, x + 0.09, by0 - 0.01, by0 + 0.15, ztop - 0.2, ztop - 0.12, 'timber_dark', bevel=0.008, tile=1.0)
    P.box(bx0 - 0.05, bx1 + 0.05, by0, by0 + 0.14, ztop, ztop + 0.14, 'timber_dark', bevel=0.01, grain='x', tile=(1.6, 0.8))
    tile_canopy(P, bx0 - 0.25, bx1 + 0.25, y0 + 0.02, by0 - 0.38, ztop + 0.5, 24)
    door_sa(Ff, cuts, 0.0, 1.0, 1.95, zf, 0.45, leaves='open')
    # 위층 창 (뾰족 아치, 덧문 활짝) · 옆·뒤 창
    for sx in (-1, 1):
        window_sa(Ff, cuts, sx * 2.25, 0.62, 1.15, H1 + 0.85, 0.45, bars=3, shutters='open', arch='cusp', frame=0.08)
    window_sa(Fl, cuts, Fl.loc(1.5), 0.6, 1.1, H1 + 0.85, 0.45, bars=3, arch='cusp')
    window_sa(Fr, cuts, Fr.loc(-1.2), 0.6, 1.1, H1 + 0.85, 0.45, bars=3, arch='cusp', shutters='open')
    window_sa(Fb, cuts, Fb.loc(0.8), 0.6, 1.1, H1 + 0.85, 0.45, bars=3, arch='cusp')
    door_sa(Fb, cuts, Fb.loc(-1.4), 0.9, 1.9, zp, 0.45, leaves='closed')
    window_sa(Fl, cuts, Fl.loc(-2.0), 0.45, 0.6, 1.6, 0.45, bars=2, jaali=True)
    wall_ok(P, [box_vf(x0, x1, y0, y1, zp - 0.05, H2)], 'brick_old', cuts, tile=2.2)
    # 옥상: 석회 바닥, 난간 + 사암 갓, 모서리 꼭지(작은 둥근 지붕), 뒤쪽 작은 방
    P.box(x0 + 0.05, x1 - 0.05, y0 + 0.05, y1 - 0.05, H2, H2 + 0.04, 'mud_lime', tile=2.2)
    P.box(x0 - 0.08, x1 + 0.08, y0 - 0.08, y1 + 0.08, H2 - 0.2, H2 - 0.06, 'sandstone', bevel=0.015, tile=2.0)
    parapet_ring(P, x0, x1, y0, y1, H2, Hp - H2, 0.24, mat='brick_old', cap='sandstone', cap_t=0.08)
    for sx in (-1, 1):
        x = sx * (W / 2 - 0.15)
        P.box(x - 0.2, x + 0.2, y0 - 0.05, y0 + 0.35, Hp, Hp + 0.55, 'mud_lime', bevel=0.02, tile=1.2)
        P.add_bm(KP.lathe_bm([(0.24, 0.0), (0.24, 0.04), (0.2, 0.14), (0.12, 0.24), (0.03, 0.3), (0.015, 0.42), (0.0, 0.44)], n=12), 'mud_lime', uv=False, smooth=True,
                 matrix=Tm(x, y0 + 0.15, Hp + 0.55))
    rcuts = []
    Rf = F_(P, '-y', y1 - 3.0)
    door_sa(Rf, rcuts, -1.7, 0.8, 1.8, H2, 0.3, leaves='ajar')
    wall_ok(P, [box_vf(x0 + 0.25, x0 + 3.0, y1 - 3.0, y1 - 0.25, H2 - 0.05, H2 + 2.35)], 'brick_old', rcuts, tile=2.2)
    P.box(x0 + 0.15, x0 + 3.1, y1 - 3.1, y1 - 0.15, H2 + 2.35, H2 + 2.5, 'sandstone', bevel=0.015, tile=2.0)
    P.marker('house_town_smoke', (x0 + 2.4, y1 - 0.6, H2 + 2.8))
    return P


def shikhara_plan(hw):
    """나가라 다섯 면 평면: 한 변마다 모서리(karna)·중간(pratiratha)·가운데(bhadra) 돌출. 반시계."""
    side = [(-1.0, 0.0), (-0.62, 0.0), (-0.62, 0.06), (-0.29, 0.06), (-0.29, 0.13), (0.29, 0.13), (0.29, 0.06), (0.62, 0.06), (0.62, 0.0)]
    pts = []
    for s in range(4):
        a = s * math.pi / 2
        ca, sa = math.cos(a), math.sin(a)
        for f, o in side:
            x, y = hw * (1.0 + o), hw * f
            pts.append((x * ca - y * sa, x * sa + y * ca))
    return pts


def loft_plan(P, rows, mat, tile=2.0, cap_top=True, cy=0.0):
    """평면 다각형 고리들(rows = [(z, [(x,y)…])], 같은 점 수, 반시계)을 이은 몸 (+ 윗뚜껑). 감김은 만들 때부터 바깥."""
    n = len(rows[0][1])
    v, f = [], []
    for z, pts in rows:
        for (x, y) in pts:
            v.append((x, y + cy, z))
    for i in range(len(rows) - 1):
        for k in range(n):
            k1 = (k + 1) % n
            f.append((i * n + k, i * n + k1, (i + 1) * n + k1, (i + 1) * n + k))
    if cap_top:
        b = (len(rows) - 1) * n
        f.append(tuple(b + k for k in range(n)))
    P.add_bm(K.bm_from(v, f), mat, tile=tile)


def amalaka(P, cx, cy, z0, R, h, ribs=24, mat='sandstone'):
    """골진 납작 원반 (아말라카): 고리 단면 + 둘레 골."""
    nu, nv = ribs * 2, 7
    v, f = [], []
    for j in range(nv + 1):
        ph = -math.pi / 2 + math.pi * j / nv
        for i in range(nu):
            th = 2 * math.pi * i / nu
            rib = 1.0 - 0.09 * (0.5 + 0.5 * math.cos(ribs * th)) * math.cos(ph)
            r = (0.25 + 0.75 * math.cos(ph)) * R * rib
            v.append((cx + r * math.cos(th), cy + r * math.sin(th), z0 + h / 2 + h / 2 * math.sin(ph)))
    for j in range(nv):
        for i in range(nu):
            i1 = (i + 1) % nu
            f.append((j * nu + i, j * nu + i1, (j + 1) * nu + i1, (j + 1) * nu + i))
    f.append(tuple(range(nu - 1, -1, -1)))
    f.append(tuple(nv * nu + i for i in range(nu)))
    P.add_bm(K.bm_from(v, f), mat, tile=1.0, smooth=True)


def kalasha(P, cx, cy, z0, s=1.0, mat='sandstone'):
    prof = [(0.0, 0.0), (0.2, 0.0), (0.22, 0.05), (0.14, 0.1), (0.24, 0.24), (0.27, 0.36), (0.22, 0.48), (0.1, 0.56), (0.13, 0.62), (0.06, 0.7), (0.04, 0.82), (0.0, 0.9)]
    P.add_bm(KP.lathe_bm([(r * s, z * s) for r, z in prof], n=14), mat, uv=False, smooth=True, matrix=Tm(cx, cy, z0))
    return z0 + 0.9 * s


def temple_small():
    """나가라 양식 작은 사원 (시대 일반형): 쇠시리 기단 + 앞 계단, 성소(문틀·세 면 돌출 감실), 휜 시카라(층 띠·모서리 아말라카),
    아말라카·칼라샤·깃발, 기둥 넷 앞 주랑(걸터앉는 난간벽·종)과 계단꼴 지붕."""
    P = Piece('temple_small', 2105)
    A = 'sandstone'
    zt = 0.9
    # 기단 (jagati)
    P.box(-3.15, 3.15, -5.15, 3.75, -0.45, 0.22, A, bevel=0.03, tile=2.0)
    P.box(-3.0, 3.0, -5.0, 3.6, 0.2, zt, A, bevel=0.02, tile=2.0)
    P.box(-3.08, 3.08, -5.08, 3.68, zt - 0.14, zt, A, bevel=0.02, tile=2.0)
    for i in range(1, 5):
        P.box(-0.95, 0.95, -5.0 - i * 0.27, -4.9, -0.3, zt - i * 0.18, A, bevel=0.015, tile=1.6)
    for sx in (-1, 1):
        add_vf(P, prism_ok([(-5.0, zt + 0.15), (-5.0, -0.1), (-6.15, -0.1), (-6.15, 0.2), (-5.4, zt + 0.15)], 'x', sx * 0.95 - 0.12 * (sx < 0), sx * 0.95 + 0.12 * (sx > 0)), A, tile=1.6, bevel=0.015)
    # 성소 (garbhagriha) 3.2 × 3.2, 앞면 y = -0.2
    gx, gy0, gy1 = 1.6, -0.2, 3.0
    gyc = (gy0 + gy1) / 2
    cuts = []
    Fg = F_(P, '-y', gy0)
    cuts.append(Fg.cutter(-0.46, 0.46, zt, zt + 1.95, 0.6))
    Fg.box(-0.46, 0.46, 0.56, 0.62, zt, zt + 1.95, 'glass', tile=1.0)
    for (w, d) in ((0.9, 0.12), (0.72, 0.06)):          # 겹 문틀
        Fg.box(-w, -0.46, -d, 0.1, zt, zt + 2.15 + d, A, bevel=0.01, tile=1.2)
        Fg.box(0.46, w, -d, 0.1, zt, zt + 2.15 + d, A, bevel=0.01, tile=1.2)
        Fg.box(-w, w, -d, 0.1, zt + 1.95, zt + 2.15 + d, A, bevel=0.01, tile=1.2)
    Fg.box(-0.62, 0.62, -0.08, 0.1, zt - 0.02, zt + 0.12, A, bevel=0.01, tile=1.2)       # 문지방
    wall_ok(P, [box_vf(-gx, gx, gy0, gy1, zt - 0.02, 3.9)], A, cuts, tile=2.0)
    # 쇠시리 띠 (아래·위), 세 면 돌출 (bhadra) + 감실 틀
    for (z0, z1, o) in ((zt, zt + 0.22, 0.13), (zt + 0.22, zt + 0.34, 0.06), (zt + 0.34, zt + 0.46, 0.1)):
        # 아래 쇠시리: 뒤·옆은 띠, 앞은 문틀 바깥 두 토막 (문 아래를 막지 않게)
        P.box(-gx - o, gx + o, gy1 - 0.3, gy1 + o, z0, z1, A, bevel=0.012, tile=2.0)
        for sx in (-1, 1):
            a, b = sorted((sx * (gx + o), sx * (gx - 0.3)))
            P.box(a, b, gy0 - o, gy1 - 0.3, z0, z1, A, bevel=0.012, tile=2.0)
            a, b = sorted((sx * (gx + o), sx * 0.98))
            P.box(a, b, gy0 - o, gy0 + 0.3, z0, z1, A, bevel=0.012, tile=2.0)
    for (z0, z1, o) in ((3.5, 3.62, 0.08), (3.62, 3.9, 0.15)):
        P.box(-gx - o, gx + o, gy0 - o, gy1 + o, z0, z1, A, bevel=0.012, tile=2.0)
    for side in ('+y', '-x', '+x'):
        F = F_(P, side, {'+y': gy1, '-x': -gx, '+x': gx}[side])
        c = 0.0 if side == '+y' else F.loc(gyc)
        F.box(c - 0.55, c + 0.55, -0.16, 0.02, zt + 0.46, 3.5, A, bevel=0.012, tile=1.6)
        F.box(c - 0.36, c + 0.36, -0.22, -0.16, 1.75, 2.85, 'glass', tile=1.0)
        for sx in (-1, 1):
            F.box(c + sx * 0.36 - 0.07, c + sx * 0.36 + 0.07, -0.26, -0.14, 1.65, 2.9, A, bevel=0.01, tile=1.0)
        F.box(c - 0.48, c + 0.48, -0.28, -0.14, 2.9, 3.02, A, bevel=0.01, tile=1.0)
        add_vf(P, ([tuple(F.M @ Vector(p)) for p in frustum_ok(c, -0.2, 0.9, 0.16, 3.02, 0.3, 0.08, 3.4)[0]], frustum_ok(c, -0.2, 0.9, 0.16, 3.02, 0.3, 0.08, 3.4)[1]), A, tile=1.0)
    # 시카라: 다섯 면 평면을 층 띠마다 고리로, 위로 갈수록 안으로 휜다
    zs0, zs1, hw0 = 3.9, 10.1, 1.52
    nb = 9
    rows = []

    def hw_at(z):
        t = (z - zs0) / (zs1 - zs0)
        return hw0 * (1 - 0.66 * t ** 1.42)
    knobs = []
    for b in range(nb):
        za = zs0 + (zs1 - zs0) * b / nb
        zb = zs0 + (zs1 - zs0) * (b + 1) / nb
        h = zb - za
        for (z, s) in ((za, 1.0), (za + h * 0.06, 1.045), (za + h * 0.2, 1.045), (za + h * 0.26, 1.0), (za + h * 0.62, 1.0)):
            rows.append((z, shikhara_plan(hw_at(z) * s)))
        knobs.append((za + h * 0.06, hw_at(za) * 1.03, h * 0.15))
    rows.append((zs1, shikhara_plan(hw_at(zs1))))
    loft_plan(P, rows, A, tile=2.0, cap_top=True, cy=gyc)
    for (z, hw, hh) in knobs:          # 모서리 아말라카 (층 띠마다)
        for sx in (-1, 1):
            for sy in (-1, 1):
                P.cyl(0.13 * hw / hw0 + 0.04, 0.13 * hw / hw0 + 0.04, hh, A, n=10, matrix=Tm(sx * hw, gyc + sy * hw, z), tile=0.6)
    # 목 + 아말라카 + 칼라샤 + 깃대·깃발
    ht = hw_at(zs1)
    P.cyl(ht * 0.72, ht * 0.66, 0.22, A, n=16, matrix=Tm(0, gyc, zs1), tile=1.0)
    amalaka(P, 0.0, gyc, zs1 + 0.2, ht * 1.55, 0.46)
    P.cyl(ht * 0.62, ht * 0.5, 0.1, A, n=16, matrix=Tm(0, gyc, zs1 + 0.66), tile=1.0)
    ztop = kalasha(P, 0.0, gyc, zs1 + 0.76, 0.85)
    P.cyl(0.018, 0.014, 1.5, 'iron', n=6, matrix=Tm(0.08, gyc, ztop - 0.25), tile=0.5)
    fy = ztop + 1.15
    flag = [(0.1, gyc, fy), (0.1, gyc, fy - 0.42), (0.85, gyc + 0.06, fy - 0.3)]
    for d in (0.003, -0.003):
        bm = K.bm_from([(x, y + d, z) for x, y, z in flag], [(0, 1, 2) if d > 0 else (2, 1, 0)])
        pal_add(P, bm, 'saffron', smooth=False)
    # 앞쪽 수카나사 (antefix): 시카라 앞면에 붙은 삼각 박공 + 둥근 메달
    add_vf(P, prism_ok([(-1.0, 4.1), (1.0, 4.1), (0.0, 5.7)], 'y', gy0 - 0.12, gy0 + 0.5), A, tile=1.6, bevel=0.015)
    P.cyl(0.42, 0.42, 0.14, A, n=18, matrix=Tm(0, gy0 - 0.1, 4.75) @ Rx(rad(90)), tile=1.0)
    P.cyl(0.26, 0.26, 0.03, 'glass', n=18, matrix=Tm(0, gy0 - 0.235, 4.75) @ Rx(rad(90)), tile=1.0)
    # 앞 주랑 (mandapa): 기둥 넷 + 들보 + 지붕판 + 계단꼴 지붕
    my0, my1, mx = -3.75, -0.2, 1.75
    zc = 3.2
    for x in (-1.45, 1.45):
        for y in (-3.45, -0.62):
            P.box(x - 0.2, x + 0.2, y - 0.2, y + 0.2, zt, zt + 0.32, A, bevel=0.02, tile=1.0)
            P.box(x - 0.13, x + 0.13, y - 0.13, y + 0.13, zt + 0.32, zc - 0.32, A, bevel=0.035, seg=1, tile=1.4)
            for z in (zt + 0.9, zt + 1.55):
                P.box(x - 0.15, x + 0.15, y - 0.15, y + 0.15, z, z + 0.1, A, bevel=0.015, tile=1.0)
            P.box(x - 0.17, x + 0.17, y - 0.17, y + 0.17, zc - 0.32, zc - 0.2, A, bevel=0.015, tile=1.0)
            P.box(x - 0.36, x + 0.36, y - 0.12, y + 0.12, zc - 0.2, zc - 0.06, A, bevel=0.015, tile=1.0)
            P.box(x - 0.12, x + 0.12, y - 0.36, y + 0.12 + 0.24, zc - 0.2, zc - 0.06, A, bevel=0.015, tile=1.0)
    for x in (-1.45, 1.45):
        P.box(x - 0.17, x + 0.17, my0 + 0.1, my1, zc - 0.06, zc + 0.12, A, bevel=0.012, tile=1.6)
    for y in (-3.45, -0.62):
        P.box(-mx, mx, y - 0.17, y + 0.17, zc - 0.06, zc + 0.12, A, bevel=0.012, tile=1.6)
    P.box(-mx - 0.2, mx + 0.2, my0 - 0.12, my1, zc + 0.12, zc + 0.34, A, bevel=0.02, tile=2.0)
    for sx in (-1, 1):       # 걸터앉는 난간벽 (kakshasana): 옆면
        x = sx * 1.45
        lo, hi = (x + 0.08, x + 0.2) if sx > 0 else (x - 0.2, x - 0.08)
        P.box(lo, hi, -3.3, -0.77, zt, zt + 0.5, A, bevel=0.015, tile=1.4)
        P.box(lo - 0.05 * (sx < 0), hi + 0.05 * (sx > 0), -3.3, -0.77, zt + 0.5, zt + 0.6, A, bevel=0.012, tile=1.4)
    z = zc + 0.34
    for k in range(4):        # 계단꼴 지붕 (phamsana)
        w = 3.5 - k * 0.66
        d = 3.6 - k * 0.66
        cyy = (my0 + my1) / 2
        add_vf(P, frustum_ok(0.0, cyy, w + 0.12, d + 0.12, z, w - 0.1, d - 0.1, z + 0.24), A, tile=1.6, bevel=0.012)
        P.box(-(w - 0.3) / 2, (w - 0.3) / 2, cyy - (d - 0.3) / 2, cyy + (d - 0.3) / 2, z + 0.24, z + 0.32, A, tile=1.6)
        z += 0.32
    amalaka(P, 0.0, (my0 + my1) / 2, z, 0.36, 0.2)
    kalasha(P, 0.0, (my0 + my1) / 2, z + 0.2, 0.4)
    # 종 (놋)
    P.cyl(0.006, 0.006, 0.42, 'iron', n=4, matrix=Tm(0, -3.45, zc - 0.48), tile=0.5)
    P.add_bm(KP.lathe_bm([(0.0, -0.2), (0.11, -0.19), (0.09, -0.14), (0.065, -0.05), (0.05, 0.0), (0.0, 0.01)], n=14), 'brass', uv=False, smooth=True,
             matrix=Tm(0, -3.45, zc - 0.48))
    diya(P, Tm(-0.32, -0.55, zt))
    diya(P, Tm(0.32, -0.55, zt))
    return P


def shrine_tree():
    """나무 밑 신당 (시대 일반형): 두 단 둥근 단(석회칠, 붉은 흙 띠), 앞 디딤돌, 주홍 칠한 돌·등잔·작은 감실.
    나무는 장면이 'shrine_tree_trunk' 자리(가운데, 윗단 높이)에 세운다 (반얀·보리수). 단 윗면은 막혀 있어 줄기 굵기와 상관없다."""
    P = Piece('shrine_tree', 2106)
    n = 32

    def disc(r):
        return [(r * math.cos(2 * math.pi * k / n), r * math.sin(2 * math.pi * k / n)) for k in range(n)]
    add_vf(P, prism_ok(disc(2.65), 'z', -0.4, 0.42), 'mud_lime', tile=2.2, bevel=0.04)
    add_vf(P, prism_ok(disc(2.67), 'z', 0.02, 0.17), 'mud_red', tile=2.0)
    add_vf(P, prism_ok(disc(1.95), 'z', 0.3, 0.82), 'mud_lime', tile=2.2, bevel=0.035)
    add_vf(P, prism_ok(disc(1.97), 'z', 0.42, 0.52), 'mud_red', tile=2.0)
    for i, (y0, z1) in enumerate(((-3.05, 0.14), (-2.85, 0.28))):
        P.box(-0.6, 0.6, y0, -2.4, -0.25, z1, 'mud_lime', bevel=0.025, tile=1.4)
    P.box(-0.45, 0.45, -2.2, -1.75, 0.3, 0.6, 'mud_lime', bevel=0.02, tile=1.4)
    # 줄기 둘레 (반지름 ~0.9): 주홍 칠한 돌, 등잔, 작은 감실
    zt = 0.82
    rng = P.rng
    for k, a in enumerate((-1.75, -1.45, -1.2)):
        r = 1.05
        s = rng.uniform(0.8, 1.15)
        pal_add(P, KP.ellipsoid_bm((r * math.cos(a), r * math.sin(a), zt + 0.1 * s), (0.11 * s, 0.09 * s, 0.14 * s), nu=8, nv=5), 'vermilion')
    for a in (-1.95, -1.05, -0.8):
        diya(P, Tm(1.25 * math.cos(a), 1.25 * math.sin(a), zt))
    for a in (-1.6, -1.35):
        pal_add(P, KP.ellipsoid_bm((1.3 * math.cos(a), 1.3 * math.sin(a), zt + 0.03), (0.08, 0.08, 0.04), nu=8, nv=3), 'marigold')
    # 뒤쪽 작은 감실 (석회 칠한 작은 집 + 둥근 지붕)
    sx, sy = 0.0, 1.45
    scuts = []
    Fs = F_(P, '-y', sy - 0.3)
    scuts.append(Fs.cutter(-0.15, 0.15, zt + 0.12, zt + 0.42, 0.28, arch='round'))
    wall_ok(P, [box_vf(sx - 0.3, sx + 0.3, sy - 0.3, sy + 0.3, zt - 0.02, zt + 0.7)], 'mud_lime', scuts, tile=1.4)
    Fs.box(-0.15, 0.15, 0.24, 0.27, zt + 0.12, zt + 0.6, 'glass', tile=1.0)
    pal_add(P, KP.ellipsoid_bm((0.0, sy - 0.12, zt + 0.2), (0.06, 0.05, 0.08), nu=8, nv=4), 'vermilion')
    P.add_bm(KP.lathe_bm([(0.34, 0.0), (0.33, 0.06), (0.26, 0.2), (0.12, 0.3), (0.03, 0.36), (0.02, 0.48), (0.0, 0.5)], n=14), 'mud_lime', uv=False, smooth=True,
             matrix=Tm(sx, sy, zt + 0.7))
    P.marker('shrine_tree_trunk', (0.0, 0.0, zt))
    return P


def well_step():
    """물가 가트 (계단 우물·저수지 둑의 일반형): 뒤(+y) 단이 원점 높이 0, 사암 계단이 앞(-y)으로 2 m 내려간다. 속이 찬 둑이라
    장면은 밑 계단을 물높이에 맞춰(둑이 물가에서 솟게) 놓는다.
    양옆 비스듬한 옆벽 + 기둥 머리, 왼쪽 단 위 작은 정자(네 기둥 + 둥근 지붕, 석회칠). 장면은 앞을 물(강·못) 쪽으로 놓는다."""
    P = Piece('well_step', 2107)
    A = 'sandstone'
    W = 4.6
    yb, yt = 1.0, 3.0                     # 맨 위 단 (땅) y 범위
    P.box(-W / 2 - 0.7, W / 2 + 0.7, yb, yt, -2.6, 0.0, A, bevel=0.015, tile=2.0)       # 둑 (속이 찬 돌 덩어리: 장면은 밑 계단을 물높이에 맞춰 놓는다)
    ns, rise, run = 9, 0.22, 0.4
    for i in range(1, ns + 1):
        yf = yb - i * run
        P.box(-W / 2, W / 2, yf, yb - (i - 1) * run, -2.6, -i * rise, A, bevel=0.012, tile=2.0)
    ybot = yb - ns * run
    P.box(-W / 2, W / 2, ybot - 0.8, ybot, -2.6, -ns * rise - 0.02, A, bevel=0.012, tile=2.0)
    for sx in (-1, 1):
        a, b = (sx * W / 2, sx * (W / 2 + 0.7))
        a, b = min(a, b), max(a, b)
        prof = [(yt, -0.6), (yt, 0.42), (yb, 0.42), (ybot - 0.8, -ns * rise + 0.25), (ybot - 0.8, -2.6)]
        add_vf(P, prism_ok(prof, 'x', a, b), A, tile=2.0, bevel=0.015)
        xm = (a + b) / 2
        for (y, z) in ((yb, 0.42), (ybot - 0.62, -ns * rise + 0.25 + 0.07)):
            P.box(xm - 0.42, xm + 0.42, y - 0.18, y + 0.18, z - 0.1, z + 0.55, A, bevel=0.02, tile=1.2)
            P.add_bm(KP.lathe_bm([(0.3, 0.0), (0.28, 0.08), (0.18, 0.2), (0.05, 0.3), (0.0, 0.34)], n=12), A, uv=False, smooth=True, matrix=Tm(xm, y, z + 0.55))
    # 정자 (chhatri) — 왼쪽 위 단
    cx, cy = -1.45, 2.0
    P.box(cx - 0.95, cx + 0.95, cy - 0.85, cy + 0.85, 0.0, 0.3, A, bevel=0.02, tile=1.6)
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = cx + sx * 0.72, cy + sy * 0.62
            P.box(x - 0.12, x + 0.12, y - 0.12, y + 0.12, 0.3, 0.45, A, bevel=0.015, tile=1.0)
            P.box(x - 0.08, x + 0.08, y - 0.08, y + 0.08, 0.45, 2.25, A, bevel=0.025, tile=1.0)
            P.box(x - 0.13, x + 0.13, y - 0.13, y + 0.13, 2.25, 2.37, A, bevel=0.015, tile=1.0)
    P.box(cx - 0.92, cx + 0.92, cy - 0.82, cy + 0.82, 2.37, 2.55, A, bevel=0.015, tile=1.4)
    P.box(cx - 1.05, cx + 1.05, cy - 0.95, cy + 0.95, 2.55, 2.62, A, bevel=0.012, tile=1.4)
    P.add_bm(KP.lathe_bm([(0.82, 0.0), (0.82, 0.08), (0.78, 0.3), (0.62, 0.62), (0.38, 0.86), (0.12, 0.98), (0.0, 1.0)], n=20), 'mud_lime', uv=False, smooth=True,
             matrix=Tm(cx, cy, 2.62))
    kalasha(P, cx, cy, 3.6, 0.32, A)
    P.marker('well_step_water', (0.0, ybot - 0.4, -1.2))
    return P


def well_kuan():
    """마을 우물: 두 단 둥근 단(jagat, 붉은 흙 띠), 우물 난간(석회칠 + 사암 갓), 안 물, 돌기둥 둘 + 나무 들보 + 도르래, 항아리·밧줄."""
    P = Piece('well_kuan', 2108)
    n = 30

    def disc(r):
        return [(r * math.cos(2 * math.pi * k / n), r * math.sin(2 * math.pi * k / n)) for k in range(n)]
    add_vf(P, prism_ok(disc(2.25), 'z', -0.4, 0.22), 'mud_lime', tile=2.0, bevel=0.03)
    add_vf(P, prism_ok(disc(1.75), 'z', 0.1, 0.46), 'mud_lime', tile=2.0, bevel=0.03)
    add_vf(P, prism_ok(disc(1.77), 'z', 0.2, 0.3), 'mud_red', tile=2.0)
    add_vf(P, ring_ok(0.98, 0.68, 0.4, 1.05, 26), 'mud_lime', tile=1.6, bevel=0.015)
    add_vf(P, ring_ok(1.04, 0.64, 1.05, 1.15, 26), 'sandstone', tile=1.2, bevel=0.012)
    P.cyl(0.68, 0.68, 0.02, 'water', n=26, matrix=Tm(0, 0, -0.6), smooth=False)
    add_vf(P, ring_ok(0.69, 0.66, -0.7, 0.4, 26), 'sandstone', tile=1.6)
    for sx in (-1, 1):
        x = sx * 1.25
        P.box(x - 0.17, x + 0.17, -0.17, 0.17, 0.46, 2.55, 'sandstone', bevel=0.02, tile=1.2)
        P.box(x - 0.22, x + 0.22, -0.22, 0.22, 2.55, 2.68, 'sandstone', bevel=0.015, tile=1.0)
    P.beam((-1.45, 0, 2.6), (1.45, 0, 2.6), 0.16, 0.16, 'timber_dark', bevel=0.012)
    P.cyl(0.17, 0.17, 0.08, 'timber_dark', n=14, matrix=Tm(0.0, -0.04, 2.36) @ Rx(rad(90)), tile=0.5)
    P.box(-0.04, 0.04, -0.03, 0.03, 2.36, 2.52, 'iron', tile=1.0)
    P.cyl(0.008, 0.008, 1.65, 'iron', n=4, matrix=Tm(0.17, -0.0, 0.85), tile=0.5)
    clay_pot(P, Tm(0.17, 0.0, 0.62), 0.75, 'clay_pot')
    clay_pot(P, Tm(-0.85, -0.25, 1.15), 0.8)
    brass_pot(P, Tm(1.35, -0.9, 0.46), 1.2)
    clay_pot(P, Tm(-1.3, -0.95, 0.46), 1.0, 'clay_dark')
    return P


def granary():
    """곳간 (골라): 기둥 아홉 위 둥근 마루, 흙 바른 대나무 통(배가 조금 부른), 원뿔 초가, 위 들창 + 기대 세운 대나무 사다리."""
    P = Piece('granary', 2109)
    zf = 0.62
    for i in (-1, 0, 1):
        for j in (-1, 0, 1):
            x, y = i * 0.85, j * 0.85
            P.box(x - 0.13, x + 0.13, y - 0.13, y + 0.13, -0.3, zf - 0.1, 'brick_old', bevel=0.015, tile=1.0)
    P.cyl(1.5, 1.5, 0.1, 'planks', n=24, matrix=Tm(0, 0, zf - 0.1), tile=1.2)
    R0, Hb = 1.28, 1.95
    prof = []
    for k in range(9):
        t = k / 8
        prof.append((R0 + 0.07 * math.sin(math.pi * t) - 0.05 * t, zf + Hb * t))
    P.add_bm(KP.lathe_bm(prof, n=26, tile=2.2), 'mud_lime' if False else 'mud_bare', uv=True, tile=2.4, smooth=True)
    for t in (0.03, 0.36, 0.68, 0.97):
        r = R0 + 0.07 * math.sin(math.pi * t) - 0.05 * t + 0.02
        P.add_bm(KP.lathe_bm([(r, zf + Hb * t - 0.05), (r, zf + Hb * t + 0.05)], n=26, tile=1.0), 'bamboo', uv=False, smooth=True)
    z_eave = zf + Hb - 0.1
    t = 0.26

    def under(r):
        return smax(z_eave + (R0 - r) * TP(42), z_eave + (R0 - r) * TP(28), 0.25)

    def ztop(r):
        e = 0.01
        sl = abs(under(r + e) - under(r - e)) / (2 * e)
        return under(r) + t * math.sqrt(1 + sl * sl)
    za = polar_thatch(P, ztop, 2.0, t=t, n=30)
    P.add_bm(KP.lathe_bm([(0.24, za - 0.2), (0.2, za + 0.02), (0.08, za + 0.16), (0.0, za + 0.2)], n=10), 'thatch', uv=False, smooth=True)
    # 들창 (앞 위쪽) + 사다리
    hz = zf + Hb - 0.75
    yh = -(R0 + 0.06)
    P.box(-0.3, 0.3, yh - 0.04, yh + 0.12, hz, hz + 0.5, 'timber_dark', bevel=0.01, tile=1.0)
    P.box(-0.22, 0.22, yh - 0.06, yh + 0.0, hz + 0.06, hz + 0.44, 'planks', bevel=0.005, tile=1.0)
    lean = 0.62
    for sx in (-1, 1):
        P.add_bm(KP.tube_bm([(sx * 0.22, yh - lean - 0.05, 0.0), (sx * 0.2, yh - 0.12, hz + 0.6)], 0.03, n=6), 'bamboo', tile=(0.8, 0.8), smooth=True)
    for k in range(6):
        f = (k + 0.7) / 6.6
        y = yh - lean - 0.05 + (lean - 0.07) * f
        z = (hz + 0.6) * f
        P.add_bm(KP.tube_bm([(-0.22, y, z), (0.22, y, z)], 0.018, n=5, ref=(0, 0, 1)), 'bamboo', tile=(0.6, 0.6), smooth=True)
    return P


def market_stall_sa():
    """장터 좌판: 대나무 기둥 넷 + 줄무늬 무명 차양(처짐), 나무 평상 위 향신료·곡식 무더기(바구니), 놋그릇·항아리, 매단 저울, 뒤에 자루."""
    P = Piece('market_stall_sa', 2110)
    w, d = 2.6, 1.7
    zt = 0.5
    # 평상 (takhat)
    for sx in (-1, 1):
        for sy in (-1, 1):
            P.box(sx * 1.15 - 0.06, sx * 1.15 + 0.06, sy * 0.7 - 0.06, sy * 0.7 + 0.06, 0.0, zt - 0.08, 'timber_dark', bevel=0.01, tile=1.0)
    P.box(-1.25, 1.25, -0.8, 0.8, zt - 0.1, zt, 'planks', bevel=0.008, tile=1.4)
    P.box(-1.25, 1.25, -0.8, -0.76, zt - 0.2, zt - 0.1, 'timber_dark', tile=1.4)
    # 기둥 + 도리
    for (x, y, h) in ((-1.45, -1.05, 2.25), (1.45, -1.05, 2.25), (-1.45, 1.0, 2.55), (1.45, 1.0, 2.55)):
        P.cyl(0.045, 0.04, h + 0.25, 'bamboo', n=8, matrix=Tm(x, y, -0.25), tile=0.6)
    P.beam((-1.55, -1.05, 2.18), (1.55, -1.05, 2.18), 0.07, 0.07, 'bamboo', bevel=0.008)
    P.beam((-1.55, 1.0, 2.48), (1.55, 1.0, 2.48), 0.07, 0.07, 'bamboo', bevel=0.008)

    def fz(x, y):
        tt = (y + 1.35) / 2.55
        return 2.22 + tt * 0.32 - 0.08 * (1 - (x / 1.75) ** 2) * math.sin(math.pi * min(1, max(0, tt)))
    xs, ys = lin(-1.75, 1.75, 24), lin(-1.35, 1.2, 14)

    def uvf(me, poly):
        return [(me.vertices[i].co.x / 1.0 + 0.25, me.vertices[i].co.y / 1.0) for i in poly.vertices]
    ob = K.heightfield(fz, xs, ys, 0.012, uvfn=uvf, name='awning')
    P.add_obj(ob, 'canvas', keep_uv=True, smooth=True)
    v, f = [], []
    nx = 56
    for i in range(nx + 1):
        x = -1.75 + 3.5 * i / nx
        ztp = fz(x, -1.35)
        zb_ = ztp - 0.22 + 0.06 * abs(math.sin(math.pi * x / 0.4375))
        v += [(x, -1.355, zb_), (x, -1.355, ztp)]
    for i in range(nx):
        f.append((2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1))
    ob = temp_obj(v, f, 'valance')
    uvl = ob.data.uv_layers.new(name='UVMap')
    for poly in ob.data.polygons:
        for li, vi in zip(poly.loop_indices, poly.vertices):
            co = ob.data.vertices[vi].co
            uvl.data[li].uv = (co.x + 0.25, co.z)
    sol = ob.modifiers.new('s', 'SOLIDIFY')
    sol.thickness = 0.01
    P.add_obj(ob, 'canvas', keep_uv=True, smooth=True)
    # 물건: 얕은 바구니 위 원뿔 무더기 (강황·고추·렌즈콩·쌀·녹두)
    heaps = [(-0.9, -0.42, 'turmeric'), (-0.45, -0.45, 'chili'), (0.0, -0.44, 'lentil'), (0.45, -0.45, 'rice'), (0.9, -0.42, 'green_dye'),
             (-0.7, 0.05, 'rice'), (-0.25, 0.08, 'turmeric')]
    for (x, y, col) in heaps:
        pal_add(P, KP.lathe_bm([(0.0, 0.0), (0.2, 0.0), (0.22, 0.05), (0.2, 0.06)], n=12, cap0=True), 'wicker', matrix=Tm(x, y, zt))
        pal_add(P, KP.lathe_bm([(0.19, 0.04), (0.12, 0.1), (0.05, 0.15), (0.0, 0.165)], n=12), col, matrix=Tm(x, y, zt))
    for (x, y, s) in ((0.3, 0.2, 1.2), (0.55, 0.3, 1.0), (0.75, 0.15, 0.9), (0.45, 0.45, 0.8)):
        brass_pot(P, Tm(x, y, zt), s)
    brass_pot(P, Tm(0.55, 0.3, zt + 0.2 * 1.0), 0.7)
    clay_pot(P, Tm(1.0, 0.45, zt), 0.85)
    clay_pot(P, Tm(-1.0, 0.45, zt), 0.8, 'clay_dark')
    # 매단 저울 (앞 도리에서): 줄 + 들보 + 접시 둘
    sx0, sy0, sz0 = 0.55, -1.05, 2.15
    P.cyl(0.005, 0.005, 0.55, 'iron', n=4, matrix=Tm(sx0, sy0, sz0 - 0.55), tile=0.5)
    P.beam((sx0 - 0.28, sy0, sz0 - 0.57), (sx0 + 0.28, sy0, sz0 - 0.57), 0.02, 0.02, 'brass', bevel=0.0)
    for sx in (-1, 1):
        x = sx0 + sx * 0.26
        for a in range(3):
            aa = 2 * math.pi * a / 3
            P.beam((x, sy0, sz0 - 0.57), (x + 0.1 * math.cos(aa), sy0 + 0.1 * math.sin(aa), sz0 - 0.95), 0.004, 0.004, 'iron', bevel=0.0)
        P.add_bm(KP.lathe_bm([(0.0, 0.0), (0.12, 0.02), (0.13, 0.035)], n=12, cap0=True), 'brass', uv=False, smooth=True, matrix=Tm(x, sy0, sz0 - 0.98))
    # 뒤 자루 둘
    for (x, rz) in ((-0.6, 0.3), (0.2, 1.7)):
        P.add_bm(KP.sack_bm(P.rng, h=0.58, r=0.2), 'canvas_jute', tile=0.6, smooth=True, matrix=Tm(x, 1.15, 0) @ Rz(rz))
    return P


def smithy_sa():
    """대장간 (마을 일반형): 앞이 트인 초가 작업 헛간. 흙 뒷벽·옆벽, 앞 나무 기둥 둘과 도리, 박공 초가, 흙 화덕(숯불 coals + smithy_forge 빈 노드)·
    가죽 풀무, 나무 그루터기 위 쇠 모루, 물항아리, 벽에 건 연장. 잉글랜드 smithy 와 같은 자리 약속 (모루 = 로컬 (0.55, +0.6), 화덕 = (-1.25, -1.0))."""
    P = Piece('smithy_sa', 2111)
    L, D, H, pitch = 6.4, 6.0, 2.5, 32
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    P.box(x0 - 0.1, x1 + 0.1, y0 - 0.1, y1 + 0.1, -0.45, 0.1, 'mud_bare', bevel=0.04, seg=2, tile=2.4)
    wt = 0.4
    wall_ok(P, [box_vf(x0, x1, y1 - wt, y1, 0.05, H)], 'mud_bare', [], tile=2.4, bevel=0.04)
    for (a, b) in ((x0, x0 + wt), (x1 - wt, x1)):
        wall_ok(P, [prism_ok(KE.gable_profile(-0.8, y1, H, pitch, 0.05), 'x', a, b)], 'mud_bare', [], tile=2.4, bevel=0.04)
    for sx in (-1, 1):                       # 석회 띠 (옆벽 앞머리)
        a, b = (x0 - 0.01, x0 + wt + 0.01) if sx < 0 else (x1 - wt - 0.01, x1 + 0.01)
        P.box(a, b, -0.82, -0.78, 0.05, H - 0.1, 'mud_lime', tile=1.2)
    for px in (x0 + 0.35, x1 - 0.35):        # 앞 기둥 + 받침돌
        P.box(px - 0.18, px + 0.18, y0 + 0.17, y0 + 0.53, 0.05, 0.2, 'sandstone', bevel=0.02, tile=1.0)
        P.beam((px, y0 + 0.35, 0.2), (px, y0 + 0.35, H + 0.1), 0.18, 0.18, 'timber_dark', bevel=0.012, up=(0, -1, 0))
    P.beam((x0 - 0.1, y0 + 0.35, H + 0.04), (x1 + 0.1, y0 + 0.35, H + 0.04), 0.2, 0.2, 'timber_dark', bevel=0.012)
    fz, Hu, zr = gable_thatch(P, L, D, H, pitch, t=0.28, oF=0.55, oB=0.4, oG=0.4, sag=0.08)
    hx, hy = -1.25, 1.0
    wall_ok(P, [box_vf(hx - 0.8, hx + 0.8, hy - 0.55, hy + 0.55, 0.05, 0.72)], 'mud_red', [], tile=1.6, bevel=0.05)
    P.box(hx - 0.4, hx + 0.4, hy - 0.32, hy + 0.2, 0.72, 0.8, 'coals', tile=1.0)
    for (a, b, c, d) in ((hx - 0.55, hx + 0.55, hy - 0.45, hy - 0.32), (hx - 0.55, hx - 0.4, hy - 0.45, hy + 0.35), (hx + 0.4, hx + 0.55, hy - 0.45, hy + 0.35),
                         (hx - 0.55, hx + 0.55, hy + 0.2, hy + 0.35)):
        P.box(a, b, c, d, 0.72, 0.88, 'mud_red', bevel=0.02, tile=1.2)
    P.marker('smithy_forge', (hx, hy - 0.06, 0.85))
    for dy in (-0.25, 0.25):                 # 가죽 풀무 둘 + 바람 대롱
        pal_add(P, KP.lathe_bm([(0.0, -0.32), (0.13, -0.26), (0.17, 0.0), (0.12, 0.24), (0.04, 0.32), (0.0, 0.34)], n=10), 'dark_brown',
                matrix=Tm(hx + 1.25, hy + dy, 0.28) @ Ry(rad(80)))
    P.beam((hx + 0.95, hy, 0.3), (hx + 0.5, hy, 0.62), 0.04, 0.04, 'iron', bevel=0.0)
    ax, ay = 0.55, -0.6                      # 그루터기 + 모루
    P.cyl(0.26, 0.24, 0.5, 'timber_dark', n=12, matrix=Tm(ax, ay, 0.05), tile=1.0)
    P.box(ax - 0.11, ax + 0.11, ay - 0.08, ay + 0.08, 0.55, 0.64, 'iron', bevel=0.01, tile=1.0)
    P.box(ax - 0.28, ax + 0.24, ay - 0.09, ay + 0.09, 0.64, 0.77, 'iron', bevel=0.015, tile=1.0)
    add_vf(P, prism_ok([(ax + 0.24, 0.67), (ax + 0.5, 0.74), (ax + 0.5, 0.755), (ax + 0.24, 0.77)], 'y', ay - 0.05, ay + 0.05), 'iron', tile=1.0)
    clay_pot(P, Tm(x1 - 0.9, -0.3, 0.05), 1.2)
    clay_pot(P, Tm(x1 - 1.3, 0.2, 0.05), 0.9, 'clay_dark')
    for k in range(5):                       # 뒷벽에 건 집게·망치 자루
        tx2 = 0.5 + k * 0.22
        P.box(tx2 - 0.015, tx2 + 0.015, y1 - wt - 0.04, y1 - wt - 0.01, 1.0 + (k % 2) * 0.1, 1.6, 'iron', tile=1.0)
    P.box(0.35, 1.55, y1 - wt - 0.08, y1 - wt, 1.57, 1.65, 'timber_dark', tile=1.0)
    P.marker('smithy_sa_smoke', (hx, hy + 0.3, zr + 0.2))
    return P


# ───────────────────────── 큰 집: 하벨리 도구 ─────────────────────────
def chhatri_roof(P, cx, cy, z0, w=1.9, d=1.9, h_col=1.65, mat_stone='sandstone', mat_dome='mud_lime'):
    """옥상 4모퉁이 차트리 (사암 기단 + 기둥 넷 + 처마 차양 + 석회 돔 + 칼라샤)."""
    P.box(cx - w / 2, cx + w / 2, cy - d / 2, cy + d / 2, z0, z0 + 0.18, mat_stone, bevel=0.015, tile=1.4)
    gx, gy = w / 2 - 0.22, d / 2 - 0.22
    for sx in (-1, 1):
        for sy in (-1, 1):
            x, y = cx + sx * gx, cy + sy * gy
            P.box(x - 0.08, x + 0.08, y - 0.08, y + 0.08, z0 + 0.18, z0 + 0.3, mat_stone, tile=1.0)
            P.box(x - 0.06, x + 0.06, y - 0.06, y + 0.06, z0 + 0.3, z0 + 0.18 + h_col - 0.1, mat_stone, tile=1.0)
            P.box(x - 0.09, x + 0.09, y - 0.09, y + 0.09, z0 + 0.18 + h_col - 0.1, z0 + 0.18 + h_col, mat_stone, tile=1.0)
    zb = z0 + 0.18 + h_col
    P.box(cx - w / 2 - 0.04, cx + w / 2 + 0.04, cy - d / 2 - 0.04, cy + d / 2 + 0.04, zb, zb + 0.12, mat_stone, tile=1.4)
    ch_o = 0.22
    P.box(cx - w / 2 - ch_o, cx + w / 2 + ch_o, cy - d / 2 - ch_o, cy + d / 2 + ch_o, zb + 0.12, zb + 0.18, mat_stone, bevel=0.012, tile=1.4)
    r_dome = min(w, d) * 0.44
    h_dome = r_dome * 1.12
    P.add_bm(KP.lathe_bm([(r_dome, 0.0), (r_dome * 0.98, 0.06), (r_dome * 0.9, h_dome * 0.3), (r_dome * 0.7, h_dome * 0.65), (r_dome * 0.4, h_dome * 0.88), (r_dome * 0.12, h_dome * 0.98), (0.0, h_dome)], n=12),
             mat_dome, uv=False, smooth=True, matrix=Tm(cx, cy, zb + 0.18))
    # 작은 칼라샤
    prof_k = [(0.0, 0.0), (0.12, 0.0), (0.14, 0.04), (0.1, 0.08), (0.15, 0.18), (0.13, 0.3), (0.06, 0.4), (0.02, 0.52), (0.0, 0.58)]
    P.add_bm(KP.lathe_bm([(r * 0.5, z * 0.5) for r, z in prof_k], n=8), mat_stone, uv=False, smooth=True, matrix=Tm(cx, cy, zb + 0.18 + h_dome))


def jharokha(P, F, cuts, cx, zf, bw=2.2, bd=0.65, zh=2.2, mat_bracket='timber_dark', mat_body='sandstone', mat_roof='mud_lime', arch='cusp'):
    """돌출 자로카 (발코니): 까치발 + 사암 바닥판·난간 + 조각 기둥 + 상부 아치·차양 + 뒷벽 개구부."""
    nb = 3 if bw > 2.2 else 2
    for k in range(nb):
        bx = cx - bw / 2 + 0.2 + (bw - 0.4) * k / (nb - 1)
        v, f = prism_ok([(0.0, zf - 0.1), (-bd + 0.05, zf - 0.1), (0.0, zf - 0.75)], 'x', bx - 0.06, bx + 0.06)
        add_vf(P, ([tuple(F.M @ Vector(p)) for p in v], f), mat_bracket, tile=1.0)
    # 발코니 바닥판 (사암)
    F.box(cx - bw / 2, cx + bw / 2, -bd, 0.05, zf - 0.08, zf, mat_body, bevel=0.01, tile=1.2)
    # 발코니 난간벽 (사암)
    rail_h = 0.7
    F.box(cx - bw / 2, cx + bw / 2, -bd, -bd + 0.06, zf, zf + rail_h, mat_body, tile=1.2)
    F.box(cx - bw / 2, cx - bw / 2 + 0.06, -bd, 0.0, zf, zf + rail_h, mat_body, tile=1.2)
    F.box(cx + bw / 2 - 0.06, cx + bw / 2, -bd, 0.0, zf, zf + rail_h, mat_body, tile=1.2)
    # 난간 갓돌
    F.box(cx - bw / 2 - 0.02, cx + bw / 2 + 0.02, -bd - 0.02, -bd + 0.08, zf + rail_h, zf + rail_h + 0.05, mat_body, bevel=0.006, tile=1.2)
    F.box(cx - bw / 2 - 0.02, cx - bw / 2 + 0.08, -bd - 0.02, 0.0, zf + rail_h, zf + rail_h + 0.05, mat_body, bevel=0.006, tile=1.2)
    F.box(cx + bw / 2 - 0.08, cx + bw / 2 + 0.02, -bd - 0.02, 0.0, zf + rail_h, zf + rail_h + 0.05, mat_body, bevel=0.006, tile=1.2)
    # 앞면 기둥들 (단순화: 2~3개)
    for k in range(nb):
        bx = cx - bw / 2 + 0.12 + (bw - 0.24) * k / (nb - 1)
        F.box(bx - 0.035, bx + 0.035, -bd + 0.01, -bd + 0.07, zf + rail_h, zf + zh - 0.12, mat_body, tile=1.0)
    # 벽쪽 기둥
    F.box(cx - bw / 2 + 0.01, cx - bw / 2 + 0.07, -0.07, 0.0, zf + rail_h, zf + zh - 0.12, mat_body, tile=1.0)
    F.box(cx + bw / 2 - 0.07, cx + bw / 2 - 0.01, -0.07, 0.0, zf + rail_h, zf + zh - 0.12, mat_body, tile=1.0)
    # 상부 아치 들보
    F.box(cx - bw / 2 - 0.02, cx + bw / 2 + 0.02, -bd - 0.02, 0.05, zf + zh - 0.12, zf + zh, mat_body, tile=1.2)
    # 돌출 처마 차양 (chhajja)
    F.box(cx - bw / 2 - 0.16, cx + bw / 2 + 0.16, -bd - 0.2, 0.08, zf + zh, zf + zh + 0.07, mat_body, bevel=0.01, tile=1.4)
    # 상부 갓 지붕
    F.box(cx - bw / 2 - 0.05, cx + bw / 2 + 0.05, -bd - 0.08, 0.04, zf + zh + 0.07, zf + zh + 0.2, mat_roof, bevel=0.015, tile=1.2)
    # 뒷벽 개구부 (문)
    door_sa(F, cuts, cx, min(bw - 0.35, 1.1), zh - 0.15, zf, 0.45, leaves='open', arch=arch)


def haveli():
    """남아시아 큰 집 (하벨리 — haveli):
    - 높은 사암 기단과 진입 계단
    - 2층 다층 안뜰(chowk) 저택 (L=15.2, D=13.0, 옥상 바닥 7.4m, 차트리 돔 꼭대기 10.0m)
    - 1층: 석회칠 벽체 + 사암 기단/띠, 웅장한 다엽 아치 대문(pol)과 문지기 툇마루(chabutra), 안뜰을 둘러싼 기둥 회랑
    - 2층: 정면 중앙 대형 돌출 자로카(jharokha) 발코니 1채 + 좌우 자로카 2채 + 측면 자로카 각 1채 (정교한 까치발, 조각 기둥, 차양)
    - 옥상: 사암 난간, 4모퉁이 차트리(chhatri 돔 정자 4채), 옥상 방(barsati)
    - 안뜰 중심 툴시 제단, 놋쇠/도자기 항아리들
    - 연기 마커 haveli_smoke
    """
    P = Piece('haveli', 2112)
    L, D = 15.2, 13.0
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    cx0, cx1, cy0, cy1 = -2.8, 2.8, -2.2, 2.8
    zp, H1, H2, Hp = 0.55, 3.9, 7.4, 8.25

    # 기단 (sandstone)
    P.box(x0 - 0.15, x1 + 0.15, y0 - 0.15, y1 + 0.15, -0.4, zp, 'sandstone', bevel=0.025, tile=2.0)
    # 정면 출입 계단 3단
    for i in range(1, 4):
        P.box(-1.8, 1.8, y0 - 0.15 - i * 0.35, y0 - 0.15 - (i - 1) * 0.35, -0.4, zp - (i - 1) * 0.18, 'sandstone', bevel=0.015, tile=1.6)

    cuts = [
        box_vf(cx0, cx1, cy0, cy1, zp, H2 + 2.0),                # 안뜰 개구부
        box_vf(-1.15, 1.15, y0 - 1.2, cy0 + 0.1, zp, zp + 3.0), # 1층 대문 통로 (안뜰까지 연결)
    ]

    Ff, Fb, Fl, Fr = F_(P, '-y', y0), F_(P, '+y', y1), F_(P, '-x', x0), F_(P, '+x', x1)

    # 1층 정면 대문 (웅장한 다엽 아치 대문)
    door_sa(Ff, cuts, 0.0, 1.8, 2.7, zp, 0.6, leaves='ajar', arch='cusp', mat_frame='sandstone')
    # 문지기 평상 (chabutra) 양옆
    for sx in (-1, 1):
        a, b = sorted((sx * 1.35, sx * 2.85))
        P.box(a, b, y0 - 0.85, y0 + 0.02, zp - 0.05, zp + 0.45, 'sandstone', bevel=0.02, tile=1.4)
        P.box(a - 0.02, b + 0.02, y0 - 0.87, y0 + 0.02, zp + 0.45, zp + 0.5, 'mud_lime', bevel=0.01, tile=1.2)

    # 1층 정면 창문 (좌우 사암 자알리 격자창)
    for sx in (-1, 1):
        window_sa(Ff, cuts, sx * 5.0, 0.8, 1.3, zp + 0.8, 0.5, jaali=True, arch='cusp')
        niche(Ff, cuts, sx * 3.3, 0.28, 0.38, zp + 1.2)

    # 1층 측면 창문들
    for side, F in (('-x', Fl), ('+x', Fr)):
        for y_pos in (-3.0, 0.0, 3.0):
            window_sa(F, cuts, F.loc(y_pos), 0.75, 1.25, zp + 0.85, 0.45, bars=3, arch='cusp')

    # 1층 후면 창문 및 뒷문
    window_sa(Fb, cuts, Fb.loc(-4.0), 0.75, 1.25, zp + 0.85, 0.45, bars=3, arch='cusp')
    window_sa(Fb, cuts, Fb.loc(4.0), 0.75, 1.25, zp + 0.85, 0.45, bars=3, arch='cusp')
    door_sa(Fb, cuts, Fb.loc(0.0), 1.0, 2.05, zp, 0.45, leaves='closed', arch='round')

    # 2층 자로카 (jharokha) 발코니들
    # 정면 중앙 대형 자로카 1채
    jharokha(P, Ff, cuts, 0.0, H1 + 0.3, bw=3.2, bd=0.85, zh=2.5, arch='cusp')
    # 정면 좌우 자로카 2채
    jharokha(P, Ff, cuts, -5.0, H1 + 0.3, bw=2.0, bd=0.65, zh=2.2, arch='cusp')
    jharokha(P, Ff, cuts, 5.0, H1 + 0.3, bw=2.0, bd=0.65, zh=2.2, arch='cusp')
    # 측면 자로카 각 1채
    jharokha(P, Fl, cuts, Fl.loc(0.0), H1 + 0.3, bw=2.2, bd=0.65, zh=2.2, arch='cusp')
    jharokha(P, Fr, cuts, Fr.loc(0.0), H1 + 0.3, bw=2.2, bd=0.65, zh=2.2, arch='cusp')

    # 2층 후면 창문들
    for x_pos in (-4.2, 0.0, 4.2):
        window_sa(Fb, cuts, Fb.loc(x_pos), 0.7, 1.2, H1 + 0.85, 0.45, bars=3, arch='cusp', shutters='open')

    # 안뜰 쪽 1층/2층 문과 회랑 (veranda)
    Ci = F_(P, '+y', cy0)
    for sx in (-1, 1):
        door_sa(Ci, cuts, Ci.loc(sx * 1.8), 0.85, 1.95, zp, 0.4, leaves='ajar' if sx < 0 else 'closed', lime_frame=True)
    Cl, Cr = F_(P, '+x', cx0), F_(P, '-x', cx1)
    door_sa(Cl, cuts, Cl.loc(0.3), 0.85, 1.95, zp, 0.4, leaves='open', lime_frame=True)
    door_sa(Cr, cuts, Cr.loc(0.3), 0.85, 1.95, zp, 0.4, leaves='closed', lime_frame=True)

    # 안뜰 1층 기둥들 (기둥 6개)
    for px in (cx0 + 0.25, cx1 - 0.25):
        for py in (cy0 + 0.3, (cy0 + cy1) / 2, cy1 - 0.3):
            P.box(px - 0.1, px + 0.1, py - 0.1, py + 0.1, zp, zp + 0.25, 'sandstone', bevel=0.015, tile=1.0)
            P.box(px - 0.08, px + 0.08, py - 0.08, py + 0.08, zp + 0.25, H1 - 0.15, 'sandstone', bevel=0.012, tile=1.0)
            P.box(px - 0.12, px + 0.12, py - 0.12, py + 0.12, H1 - 0.15, H1, 'sandstone', bevel=0.015, tile=1.0)

    # 본체 벽체 (외벽)
    wall_ok(P, [box_vf(x0, x1, y0, y1, zp - 0.05, H2)], 'mud_lime', cuts, tile=2.2)

    # 1층-2층 사암 띠 (전면, 측면, 후면)
    P.box(x0 - 0.08, x1 + 0.08, y0 - 0.08, y1 + 0.08, H1 - 0.06, H1 + 0.12, 'sandstone', bevel=0.018, tile=2.0)
    # 2층 상부 처마 턱
    P.box(x0 - 0.1, x1 + 0.1, y0 - 0.1, y1 + 0.1, H2 - 0.14, H2 + 0.02, 'sandstone', bevel=0.02, tile=2.0)

    # 안뜰 바닥 (sandstone)
    P.box(cx0, cx1, cy0, cy1, zp - 0.05, zp, 'sandstone', bevel=0.01, tile=2.0)

    # 안뜰 중심 툴시 제단 + 항아리
    tx, ty = (cx0 + cx1) / 2, (cy0 + cy1) / 2
    P.box(tx - 0.45, tx + 0.45, ty - 0.45, ty + 0.45, zp, zp + 0.3, 'sandstone', bevel=0.02, tile=1.2)
    P.box(tx - 0.32, tx + 0.32, ty - 0.32, ty + 0.32, zp + 0.3, zp + 0.9, 'mud_lime', bevel=0.02, tile=1.2)
    P.box(tx - 0.38, tx + 0.38, ty - 0.38, ty + 0.38, zp + 0.9, zp + 1.05, 'mud_red', bevel=0.015, tile=1.2)
    leaf_bush(P, tx, ty, zp + 1.05, 0.32, 0.48, 16, ['tulsi', 'leaf_dark', 'leaf'], s=0.065)
    diya(P, Tm(tx, ty - 0.34, zp + 0.35))
    brass_pot(P, Tm(cx0 + 0.6, cy0 + 0.6, zp), 0.9)
    clay_pot(P, Tm(cx1 - 0.6, cy0 + 0.6, zp), 1.1)

    # 옥상 바닥 (sandstone)
    P.box(x0 + 0.05, x1 - 0.05, y0 + 0.05, y1 - 0.05, H2, H2 + 0.05, 'sandstone', tile=2.0)

    # 옥상 둘레 난간벽 (sandstone)
    parapet_ring(P, x0, x1, y0, y1, H2, Hp - H2, 0.26, mat='sandstone', cap='sandstone', cap_t=0.06)
    # 안뜰 둘레 난간벽
    parapet_ring(P, cx0 - 0.25, cx1 + 0.25, cy0 - 0.25, cy1 + 0.25, H2, 0.72, 0.22, mat='sandstone', cap='sandstone', cap_t=0.05)

    # 옥상 빗물 홈통
    for x in (-5.5, -2.0, 2.0, 5.5):
        spout(P, x, y0 + 0.1, H2 + 0.1, 0, -1)
        spout(P, x, y1 - 0.1, H2 + 0.1, 0, 1)

    # 옥상 4모퉁이 차트리 (Chhatri 4채)
    for sx in (-1, 1):
        for sy in (-1, 1):
            chx = sx * (L / 2 - 1.4)
            chy = sy * (D / 2 - 1.4)
            chhatri_roof(P, chx, chy, H2, w=1.9, d=1.9, h_col=1.65, mat_stone='sandstone', mat_dome='mud_lime')

    # 옥상 후방 작은 방 (Barsati - 계단실/방)
    rcuts = []
    Rf = F_(P, '-y', y1 - 3.2)
    door_sa(Rf, rcuts, 0.0, 0.9, 1.85, H2, 0.3, leaves='ajar')
    window_sa(Rf, rcuts, -1.3, 0.5, 0.8, H2 + 0.8, 0.3, bars=2)
    window_sa(Rf, rcuts, 1.3, 0.5, 0.8, H2 + 0.8, 0.3, bars=2)
    wall_ok(P, [box_vf(-2.3, 2.3, y1 - 3.2, y1 - 0.35, H2 - 0.02, H2 + 2.35)], 'mud_lime', rcuts, tile=1.8)
    P.box(-2.45, 2.45, y1 - 3.35, y1 - 0.2, H2 + 2.35, H2 + 2.5, 'sandstone', bevel=0.02, tile=2.0)

    # 연기 마커 (주방/부속실 위치)
    P.marker('haveli_smoke', (x1 - 2.5, y1 - 1.8, H2 + 2.6))

    return P


BUILDERS = [hut_mud_a, hut_mud_b, house_courtyard, house_town, temple_small, shrine_tree, well_step, well_kuan, granary, market_stall_sa, smithy_sa, haveli]


# ───────────────────────── 실행 ─────────────────────────
CENTER = {'smithy_sa': (0.0, 0.0)}     # 대장간: 잉글랜드 smithy 처럼 바닥 가운데를 옮기지 않는다 (모루·화덕 자리 약속)
CAM = {'temple_small': (-32, 10), 'well_step': (-35, 22), 'house_courtyard': (-30, 32), 'market_stall_sa': (-28, 10), 'house_town': (-30, 12), 'haveli': (-34, 18)}


def main():
    t0 = time.time()
    K.reset_scene()
    setup_materials()
    only = [s for s in os.environ.get('KIT_ONLY', '').split(',') if s]
    roots, dims = [], {}
    for b in BUILDERS:
        if only and b.__name__ not in only:
            continue
        ts = time.time()
        P = b()
        root = P.finish()
        dims[root.name] = S.recenter(root, P.foot, CENTER.get(root.name))
        roots.append(root)
        log('%-16s %6d 삼각형  %.1fs  %s' % (root.name, sum(K.tri_count(o) for o in K.mesh_objects([root])), time.time() - ts,
                                            'x'.join('%.2f' % d for d in dims[root.name])))
    for i, r in enumerate(roots):
        r.location = (i * 60.0, 0, 0)
    objs = K.mesh_objects(roots)
    K.make_ao_uvs(objs)
    img = K.bake_ao(objs, size=2048, samples=256, distance=1.4)
    mats = [K.MATS[n] for n in K.MATS]
    K.wire_ao(mats, img)
    for r in roots:
        r.location = (0, 0, 0)
    out = os.path.join(K.KITS, NAME + '.glb') if not only else os.path.join(K.BUILD, NAME + '_partial.glb')
    tris = {r.name: sum(K.tri_count(o) for o in K.mesh_objects([r])) for r in roots}
    info = K.export_glb(roots, out) if not only or os.environ.get('KIT_EXPORT') == '1' else {}
    if not only:
        with open(os.path.join(K.KITS, NAME + '.dims.json'), 'w', encoding='utf-8', newline='\n') as f:
            json.dump({'source': 'tools/blender/kit_southasia.py', 'units': 'm, [x 길이, 앞뒤 깊이, 높이]',
                       'pieces': {k: [round(x, 2) for x in v] for k, v in dims.items()}}, f, ensure_ascii=False, indent=1)
            f.write('\n')
    log('삼각형 합계', sum(tris.values()), tris)
    stats = {'tris': tris, 'total': sum(tris.values()), 'dims': {k: [round(x, 2) for x in v] for k, v in dims.items()}, 'glb': info,
             'sha': K.sha(out) if info else None, 'seconds': round(time.time() - t0, 1)}
    with open(os.path.join(K.BUILD, NAME + '_stats.json'), 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=1)
    log('STATS', json.dumps(stats, ensure_ascii=False))
    if os.environ.get('KIT_NOPREVIEW') != '1':
        previews(roots, mats)
    log('끝 %.1fs' % (time.time() - t0))


def previews(roots, mats):
    K.ao_into_basecolor(mats)
    K.setup_preview(sun_elev=34, sun_az=140, grass=os.path.join(K.TEX, 'brown_mud_dry_diff_1k.jpg'))
    S.preview_ground((1.0, 0.9, 0.72))
    by = {r.name: r for r in roots}
    extra = []
    if os.environ.get('KIT_VIGNETTE', '1') == '1':
        try:
            import kit_vignette_southasia as V
            extra = V.populate(by)
        except Exception as e:      # 소품·나무 스크립트가 없거나 실패해도 건물 미리보기는 남긴다
            import traceback
            traceback.print_exc()
            log('!! 마을 꾸밈 실패', e)
    LAYOUT = {   # 마을 한 모퉁이: 길은 x 방향 y = 0. 남쪽 집은 돌려(π) 앞이 길을 보고, 북쪽 것은 그대로 (앞 = -y = 길)
        'hut_mud_a': (-14.0, -7.0, math.pi), 'granary': (-8.6, -8.4, math.pi), 'hut_mud_b': (-3.4, -7.8, math.pi), 'house_courtyard': (8.0, -10.6, math.pi),
        'well_kuan': (-9.0, 4.2, 0.3), 'market_stall_sa': (0.6, 3.3, 0.04), 'shrine_tree': (-3.2, 9.4, 0.0), 'temple_small': (6.0, 12.5, 0.0),
        'house_town': (16.8, 7.6, -0.03), 'well_step': (1000.0, 1000.0, 0.0), 'smithy_sa': (24.0, 6.0, -0.2),
    }
    if not only_names():
        for n, (x, y, rz) in LAYOUT.items():
            if n in by:
                by[n].location = (x, y, 0 if x < 900 else -500)
                by[n].rotation_euler = (0, 0, rz)
        shots = [
            ('southasia_village', (34, -26, 17), (-2, 1.5, 1.5), 30),
            ('southasia_lane', (-19, -0.6, 1.65), (6, 1.2, 2.4), 30),
            ('southasia_lane2', (14, -1.4, 1.7), (-6, 1.5, 2.2), 32),
        ]
        for name, pos, tgt, lens in shots:
            cam = K.camera_look(name, pos, tgt, lens)
            K.render_to(cam, os.path.join(K.PREVIEW, name + '.png'))
    for o in extra:
        o.hide_render = True
    for r in roots:
        r.location = (1000, 1000, -500)
    for r in roots:
        r.location = (0, 0, 0)
        r.rotation_euler = (0, 0, 0)
        bpy.context.view_layer.update()
        me = [c for c in r.children_recursive if c.type == 'MESH']
        pts = [c.matrix_world @ v.co for c in me for v in c.data.vertices]
        lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(0.0, min(p.z for p in pts) * 0.3)))
        hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
        ctr = (lo + hi) / 2
        rad_ = (hi - lo).length / 2
        dist = rad_ / math.sin(rad(26)) * 1.18
        az, el = (rad(a) for a in CAM.get(r.name, (-38, 14)))
        pos = (ctr.x + math.sin(az) * dist * math.cos(el), ctr.y - math.cos(az) * dist * math.cos(el), max(1.6, ctr.z * 0.6 + math.sin(el) * dist))
        cam = K.camera_look('cam_' + r.name, pos, (ctr.x, ctr.y, ctr.z * 0.75), 35)
        gnd = bpy.data.objects.get('preview_ground')
        if gnd and r.name == 'well_step':     # 가트 계단은 땅 밑으로 내려간다: 이 그림만 땅을 낮춰 계단을 보인다
            gnd.location.z = -2.62
        K.render_to(cam, os.path.join(K.PREVIEW, 'southasia_%s.png' % r.name))
        if gnd:
            gnd.location.z = 0.0
        r.location = (1000, 1000, -500)


def only_names():
    return [s for s in os.environ.get('KIT_ONLY', '').split(',') if s]


if __name__ == '__main__':
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)               # Blender 가 0 으로 끝나지 않게 (실패를 알린다)
