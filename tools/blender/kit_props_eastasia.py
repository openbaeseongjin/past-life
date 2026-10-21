# 동아시아 마을 소품·가축 세트 — Blender 4.2 명령줄 스크립트. kit_common.py · kit_sa_common.py · kit_ea_common.py · kit_props.py(결정적 도형 도구)를 함께 쓴다.
#   GLTFT=<gltf-transform 폴더> "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe" --background --python tools/blender/kit_props_eastasia.py
# 결과: docs/past-life/assets/real/kits/props_eastasia.glb (meshopt + WebP), kits/props_eastasia.dims.json, kits/preview/eastasia_props_*.png
# 땅 변형(중국·한국·일본)이 함께 쓰는 한 벌이다. 땅마다 다른 것은 마을 꾸미기 규칙(villageplan.js)이 고른다 (장독대 = 한국, 큰 독 = 중국, 나무통 = 일본, 돌담·흙담·바자울).
# 노드:
#   운반·살림 cart_ea(소달구지: 바퀴 둘, 끌채를 땅에 내린 자세), jangdok(장독대: 돌 단 위 옹기 여덟), jars_ea(큰 독 셋), taru_ea(나무통 셋),
#            rice_rack(볏단 걸대: 세 갈래 받침 + 장대 둘에 볏단), straw_stack(볏가리), bales_ea(짚 가마니·쌀섬), basket_ea(바구니·키), mortar_ea(돌절구·맷돌),
#            woodpile_ea(장작·나뭇단), bench_ea(평상 + 돗자리), veg_bed_ea(텃밭: 배추·무·파 이랑), trough_ea(통나무 구유), stones_ea(개울 디딤돌 10 m)
#   울·담   wall_stone_ea(막돌 돌담 2 m), wall_earth_ea(흙담 + 기와 갓 2 m), fence_ea(대·싸리 바자울 2 m) — X 로 -1 … +1, 이어 붙인다
#   가축     ox_ea(누렁소: 짧은 뿔·코뚜레), buffalo_ea(물소, 남중국 논), pig(검은 돼지), chicken(닭), duck_ea(오리)
#   (머리 = +X. 가축 몸 색은 재료 색 hide·hide_dark·hide_pig·down — 장면에서 마리마다 곱해 변주)
# 좌표: 조각마다 바닥 가운데가 원점, 미터. 긴 축 = X, 앞 = glTF +Z (Blender -Y).
# 환경변수: KIT_FAST=1, KIT_ONLY=ox_ea,pig, KIT_NOPREVIEW=1, KIT_EXPORT=1
import os, sys, math, time, json
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
import numpy as np
from mathutils import Vector, Matrix
import kit_common as K
from kit_common import Piece, box_vf, temp_obj, log
import kit_props as KP
import kit_sa_common as S
from kit_sa_common import prism_ok, add_vf, ring_ok, Tm, Rz, Ry, Rx, lin
import kit_ea_common as E
from kit_ea_common import pal_add, pal_box, crock
from kit_props import lathe_bm, loft_bm, tube_bm, ellipsoid_bm, outward, noise3, densify

rad = math.radians
NAME = 'props_eastasia'


# ───────────────────────── 재료 ─────────────────────────
def gen_mat_weave():
    """돗자리 엮음 (가로 줄, 이어 붙는다 256²)."""
    N = 256
    y, x = np.mgrid[0:N, 0:N].astype(np.float32)
    v = y / 8.0
    fv = v % 1.0
    h = np.sin(np.pi * fv) ** 0.7
    alt = (np.floor(x / 32) + np.floor(v)) % 2
    col = np.array([0.74, 0.64, 0.42], np.float32)[None, None] * (0.6 + 0.4 * h[..., None]) * (0.92 + 0.08 * alt[..., None])
    rs = np.random.RandomState(9)
    col += rs.normal(0, 0.012, col.shape).astype(np.float32)
    a = np.concatenate([col, np.ones_like(col[..., :1])], -1)
    path = os.path.join(K.BUILD, 'ea_mat_weave.png')
    K._save_np(a, path)
    return path


def setup_materials():
    T, X = K.prep_texture, lambda f: os.path.join(K.TEX, f)
    mk = K.make_material
    mk('timber', T('ea_timber_d_props', 'rough_wood_diff_1k.jpg', tint=(0.66, 0.52, 0.4), gain=0.62, sat=0.7), X('rough_wood_nor_gl_1k.jpg'), rough=0.85, nstr=0.9)
    mk('planks', T('ea_planks_d', 'old_planks_02_diff_1k.jpg', tint=(0.86, 0.76, 0.64), gain=0.82), X('old_planks_02_nor_gl_1k.jpg'), rough=0.85, nstr=1.0)
    mk('floor', T('ea_floor_d', 'hinoki_planks_diff_1k.jpg', tint=(0.9, 0.84, 0.74), gain=0.95, sat=0.55), X('hinoki_planks_nor_gl_1k.jpg'), rough=0.7, nstr=0.8)
    mk('bamboo', T('ea_bamboo_d', 'bamboo_wall_diff_1k.jpg', tint=(1.0, 0.95, 0.76), gain=1.0, sat=0.75), X('bamboo_wall_nor_gl_1k.jpg'), rough=0.8, nstr=1.0)
    mk('hay', T('ea_hay_d', 'reed_roof_04_diff_1k.jpg', tint=(1.12, 1.0, 0.66), gain=1.0, sat=0.75, tile_v=(0.075, 0.12)),
       T('ea_thatch_n', 'reed_roof_04_nor_gl_1k.jpg', tile_v=(0.075, 0.12), normal=True), rough=1.0, nstr=1.5)
    mk('rubble', T('ea_rubble_d', 'broken_wall_diff_1k.jpg', tint=(1.0, 0.97, 0.9), gain=1.0, sat=0.5), X('broken_wall_nor_gl_1k.jpg'), rough=0.95, nstr=1.2)
    mk('stone', T('ea_stone_d', 'japanese_stone_wall_diff_1k.jpg', tint=(1.0, 0.98, 0.94), gain=1.05, sat=0.4), X('japanese_stone_wall_nor_gl_1k.jpg'),
       rough=0.9, nstr=1.0)
    mk('granite', T('ea_granite_d', 'white_rough_plaster_diff_1k.jpg', tint=(0.76, 0.75, 0.72), gain=0.95, contrast=0.75, sat=0.1),
       X('white_rough_plaster_nor_gl_1k.jpg'), rough=0.88, nstr=0.8)
    mk('rammed', T('ea_rammed_d', 'clay_block_wall_diff_1k.jpg', tint=(1.02, 0.94, 0.78), gain=1.12, sat=0.5, contrast=0.8), X('clay_block_wall_nor_gl_1k.jpg'),
       rough=0.97, nstr=0.9)
    mk('soil', T('ea_soil_d', 'farm_soil_diff_1k.jpg', tint=(0.95, 0.9, 0.84), gain=0.95), X('farm_soil_nor_gl_1k.jpg'), rough=0.98, nstr=1.0)
    td, tn = E.gen_tile_tex('ea_tile_props', base=(0.3, 0.305, 0.32))
    mk('tile', td, tn, rough=0.62, nstr=1.0)
    mk('weave', gen_mat_weave(), None, rough=0.95)
    mk('iron', color=(0.05, 0.048, 0.045), rough=0.55, metal=0.7)
    mk('water', color=(0.02, 0.03, 0.03), rough=0.08)
    E.palette_material()
    hn = KP.gen_hide_normal()
    mk('hide', None, hn, rough=0.7, nstr=0.5, color=(0.3, 0.13, 0.035))          # 누렁소 (선형 색, 장면에서 마리마다 곱)
    mk('hide_dark', None, hn, rough=0.6, nstr=0.4, color=(0.06, 0.055, 0.052))   # 물소
    mk('hide_pig', None, hn, rough=0.75, nstr=0.6, color=(0.07, 0.062, 0.06))     # 검은 돼지
    mk('down', None, None, rough=0.85, color=(0.84, 0.83, 0.78))                  # 오리 깃털 (흰·갈색으로 곱)


# ───────────────────────── 가축 도구 ─────────────────────────
def legs_pair(P, path, r, mat, hoof_col='hoof', hoof_r=None, ys=(1, -1)):
    for sy in ys:
        pts = [(x, sy * y, z) for (x, y, z) in path]
        P.add_bm(tube_bm(pts, r, n=7, ref=(1, 0, 0), cap0=False), mat, tile=(0.4, 0.4), smooth=True)
        x, y, z = pts[-1]
        hr = hoof_r or r[-1] * 1.12
        pal_add(P, lathe_bm([(hr * 1.08, 0.0), (hr, z * 0.55), (hr * 0.9, z + 0.005), (0.0, z + 0.01)], n=7, cap0=True), hoof_col, matrix=Tm(x + hr * 0.15, y, 0.0))


def shoulders_thighs(P, mat, front, back):
    for (x, y, z, rx, ry, rz) in (front, back):
        for sy in (1, -1):
            P.add_bm(ellipsoid_bm((x, sy * y, z), (rx, ry, rz), nu=10, nv=6), mat, tile=(0.45, 0.45), smooth=True)


def eye_pair(P, x, y, z, r=0.012, col='eye'):
    for sy in (1, -1):
        pal_add(P, ellipsoid_bm((x, sy * y, z), (r, r * 0.7, r), nu=5, nv=3), col)


# ───────────────────────── 운반·살림 ─────────────────────────
def cart_ea():
    """소달구지: 큰 나무바퀴 둘(살 12·바퀴통), 굴대, 널 바닥 + 낮은 난간, 앞으로 모이는 끌채 둘(끝을 땅에 내림), 위에 짚 가마니 둘."""
    P = Piece('cart_ea', 8001)
    R = 0.68
    L, W = 2.2, 1.15
    zb = R + 0.12
    ang = math.atan2(zb - 0.1, 2.6)
    Mb = Tm(0, 0, R) @ Ry(ang) @ Tm(0, 0, -R)
    for sy in (-1, 1):
        p0 = Mb @ Vector((-L / 2 - 0.2, sy * W / 2, zb - 0.05))
        p1 = Mb @ Vector((0.8, sy * W / 2, zb - 0.05))
        p2 = Mb @ Vector((2.85, sy * 0.28, zb - 0.05))
        P.beam(tuple(p0), tuple(p1), 0.1, 0.11, 'timber', bevel=0.012)
        P.beam(tuple(p1), tuple(p2), 0.09, 0.1, 'timber', bevel=0.012, ext=0.02)
    P.box(-L / 2 - 0.15, 0.85, -W / 2 - 0.04, W / 2 + 0.04, zb, zb + 0.05, 'planks', matrix=Mb, tile=1.2)
    for sy in (-1, 1):
        for x in (-L / 2 - 0.1, -0.2, 0.7):
            P.box(x - 0.03, x + 0.03, sy * W / 2 - 0.03, sy * W / 2 + 0.03, zb, zb + 0.4, 'timber', matrix=Mb, tile=0.8)
        P.box(-L / 2 - 0.12, 0.75, sy * W / 2 - 0.03, sy * W / 2 + 0.03, zb + 0.35, zb + 0.41, 'timber', matrix=Mb, tile=0.8)
    py = Mb @ Vector((2.7, 0.0, zb + 0.04))
    P.beam((py.x, -0.5, py.z), (py.x, 0.5, py.z), 0.08, 0.08, 'timber', bevel=0.012)
    P.beam((0, -W / 2 - 0.3, R), (0, W / 2 + 0.3, R), 0.1, 0.1, 'timber', bevel=0.012, up=(1, 0, 0))
    for sy in (-1, 1):
        yw = sy * (W / 2 + 0.17)
        nseg = 12
        for k in range(nseg):
            a0, a1 = 2 * math.pi * k / nseg, 2 * math.pi * (k + 1) / nseg
            am = (a0 + a1) / 2
            p0 = (R * 0.92 * math.cos(a0), yw, R + R * 0.92 * math.sin(a0))
            p1 = (R * 0.92 * math.cos(a1), yw, R + R * 0.92 * math.sin(a1))
            P.beam(p0, p1, 0.09, 0.11, 'planks', up=(math.cos(am), 0, math.sin(am)), ext=0.04, bevel=0.008)
        P.add_bm(lathe_bm([(0.0, -0.16), (0.1, -0.15), (0.13, -0.07), (0.13, 0.07), (0.1, 0.15), (0.0, 0.16)], n=12, tile=0.5), 'timber', uv=False,
                 smooth=True, matrix=Tm(0, yw, R) @ Rx(rad(90)))
        for k in range(12):
            a = 2 * math.pi * k / 12 + 0.13
            P.beam((0.11 * math.cos(a), yw, R + 0.11 * math.sin(a)), ((R * 0.86) * math.cos(a), yw, R + (R * 0.86) * math.sin(a)), 0.045, 0.04, 'planks',
                   up=(0, 1, 0), bevel=0.005)
    for (x, y) in ((-0.55, 0.2), (0.05, -0.15)):
        P.add_bm(KP.sack_bm(P.rng, h=0.6, r=0.22), 'hay', tile=0.6, smooth=True, matrix=Mb @ Tm(x, y, zb + 0.27) @ Rz(1.2) @ Ry(rad(86)))
    return P


def jangdok():
    """장독대: 낮은 막돌 단(2.4 × 1.4) 위에 옹기 여덟 (뒤 큰 독 → 앞 작은 단지), 뚜껑, 하나는 뚜껑을 내려 둠."""
    P = Piece('jangdok', 8002)
    P.box(-1.2, 1.2, -0.7, 0.7, -0.2, 0.28, 'rubble', tile=1.2, bevel=0.04)
    P.box(-1.15, 1.15, -0.65, 0.65, 0.28, 0.32, 'granite', tile=1.2)
    spots = [(-0.82, 0.32, 1.35), (-0.15, 0.36, 1.45), (0.55, 0.32, 1.3), (-0.6, -0.25, 1.0), (0.05, -0.28, 0.95), (0.62, -0.25, 1.05),
             (0.95, 0.1, 0.75), (-0.98, -0.05, 0.7)]
    for k, (x, y, s) in enumerate(spots):
        crock(P, Tm(x, y, 0.32), s * 0.62, 'onggi' if k % 3 else 'onggi_dark', lid=k != 4)
    pal_add(P, lathe_bm([(0.0, 0.0), (0.15, 0.0), (0.16, 0.025), (0.0, 0.04)], n=14), 'onggi_lid', matrix=Tm(0.3, -0.6, 0.32) @ Ry(rad(14)))
    return P


def jars_ea():
    """큰 독 셋 (중국 장·물 독): 넓은 입 + 나무 뚜껑, 하나는 반쯤 묻힘."""
    P = Piece('jars_ea', 8003)
    for (x, y, s, z) in ((-0.38, 0.0, 1.35, 0.0), (0.4, 0.15, 1.15, 0.0), (0.05, -0.45, 0.85, 0.0)):
        prof = [(0.0, 0.0), (0.16, 0.0), (0.26, 0.12), (0.3, 0.3), (0.28, 0.48), (0.22, 0.56), (0.23, 0.6), (0.21, 0.6)]
        pal_add(P, lathe_bm([(r * s, zz * s) for r, zz in prof], n=16), 'onggi_dark', matrix=Tm(x, y, z))
        pal_add(P, lathe_bm([(0.0, 0.62 * s), (0.25 * s, 0.6 * s), (0.25 * s, 0.585 * s), (0.0, 0.6 * s)], n=14), 'wood_dark', matrix=Tm(x, y, z))
    return P


def taru_ea():
    """나무통 셋 (일본 된장·물 통): 세로 널 + 대나무 테 + 뚜껑, 작은 것 하나는 위에."""
    P = Piece('taru_ea', 8004)
    for (x, y, z, s) in ((-0.32, 0.0, 0.0, 1.0), (0.36, 0.1, 0.0, 0.9), (-0.3, 0.0, 0.62, 0.62)):
        h, r = 0.62 * s, 0.3 * s
        P.add_bm(lathe_bm([(r * 0.92, 0.0), (r, h * 0.5), (r * 0.95, h), (0.0, h)], n=14, cap0=True, tile=0.6), 'planks', uv=True, smooth=True, matrix=Tm(x, y, z))
        for f in (0.15, 0.5, 0.85):
            rr = r * (0.94 + 0.06 * math.sin(math.pi * f)) + 0.012
            P.add_bm(lathe_bm([(rr, h * f - 0.02), (rr, h * f + 0.02)], n=14), 'bamboo', uv=True, smooth=True, matrix=Tm(x, y, z))
    return P


def rice_rack():
    """볏단 걸대 (하사): 양끝·가운데 세 갈래 받침, 장대 둘 (1.0·1.55 m), 장대마다 볏단을 촘촘히 걸쳐 말린다. 길이 4.4 m."""
    P = Piece('rice_rack', 8005)
    Lr = 4.4
    for x in (-Lr / 2, 0.0, Lr / 2):
        for a in (0.0, 2.1, 4.2):
            P.add_bm(tube_bm([(x + 0.5 * math.cos(a) * 0.6, 0.5 * math.sin(a) * 0.6, -0.15), (x, 0.0, 1.85)], 0.03, n=5), 'bamboo', tile=(0.5, 0.5))
    for z in (1.0, 1.55):
        P.add_bm(tube_bm([(-Lr / 2 - 0.15, 0.0, z), (Lr / 2 + 0.15, 0.0, z)], 0.03, n=5, ref=(0, 0, 1)), 'bamboo', tile=(0.5, 0.5))
        n = 22
        for k in range(n):
            x = -Lr / 2 + 0.12 + (Lr - 0.24) * (k + 0.5) / n
            for sy in (-1, 1):
                st = [((x, sy * 0.03, z + 0.04), 0.05, 0.04), ((x, sy * 0.1, z - 0.05), 0.08, 0.05), ((x, sy * 0.16, z - 0.3), 0.09, 0.06),
                      ((x, sy * 0.19, z - 0.5), 0.075, 0.05), ((x, sy * 0.2, z - 0.56), 0.03, 0.02)]
                P.add_bm(loft_bm(st, n=6, expo=2.0, ref=(0, 1, 0)), 'hay', tile=(0.5, 0.5), smooth=True)
    return P


def straw_stack():
    """볏가리: 볏단을 둥글게 쌓아 올린 낟가리 (지름 ~2.2 m, 키 ~2.6 m), 꼭대기 짚 덮개."""
    P = Piece('straw_stack', 8006)
    seed = 13

    def bump(p):
        return 0.07 * noise3(p.x * 2.0, p.y * 2.0, p.z * 1.5, seed) + 0.03 * noise3(p.x * 6, p.y * 6, p.z * 6, seed + 3)
    prof = [(0.95, -0.1), (1.08, 0.3), (1.12, 0.9), (1.08, 1.4), (0.92, 1.85), (0.66, 2.2), (0.38, 2.45), (0.12, 2.6), (0.02, 2.63)]
    bm = loft_bm([((0, 0, z), r, r) for r, z in prof], n=26, ref=(1, 0, 0), cap0=False, cap1=True, disp=bump)
    uvl = bm.loops.layers.uv.verify()
    for face in bm.faces:
        us = []
        for l in face.loops:
            p = l.vert.co
            a = math.atan2(p.y, p.x) / (2 * math.pi) % 1.0
            l[uvl].uv = (a * 6.8 / 1.4, p.z / 1.2)
            us.append(l[uvl].uv.x)
        if max(us) - min(us) > 2.4:
            for l in face.loops:
                if l[uvl].uv.x < 2.4:
                    l[uvl].uv.x += 6.8 / 1.4
    P.add_bm(bm, 'hay', uv=False, smooth=True)
    P.add_bm(lathe_bm([(0.5, 2.25), (0.4, 2.55), (0.18, 2.75), (0.0, 2.82)], n=12), 'hay', uv=False, smooth=True)
    pal_add(P, lathe_bm([(0.52, 2.2), (0.52, 2.26)], n=14), 'rope')
    return P


def bales_ea():
    """짚 가마니·쌀섬 넷 (둥근 섬 셋을 쌓고 하나는 세움): 새끼로 세 군데 묶음."""
    P = Piece('bales_ea', 8007)
    for (x, y, z, ax) in ((-0.32, 0.0, 0.0, 0), (0.32, 0.0, 0.0, 0), (0.0, 0.0, 0.42, 0), (0.85, 0.25, 0.0, 1)):
        L, r = 0.78, 0.22
        M = Tm(x, y, z + r) @ (Ry(rad(90)) if not ax else Matrix.Identity(4))
        if ax:
            M = Tm(x, y, 0.0)
        prof = [(0.0, -L / 2), (r * 0.75, -L / 2), (r, -L / 2 + 0.08), (r * 1.03, 0.0), (r, L / 2 - 0.08), (r * 0.75, L / 2), (0.0, L / 2)]
        if ax:
            prof = [(rr, zz + L / 2) for rr, zz in prof]
        P.add_bm(lathe_bm(prof, n=12, tile=0.5), 'hay', uv=True, smooth=True, matrix=M if not ax else Tm(x, y, 0.0))
        for f in (-0.25, 0.0, 0.25):
            zz = f * L
            if ax:
                zz += L / 2
            pal_add(P, lathe_bm([(r * 1.04, zz - 0.015), (r * 1.04, zz + 0.015)], n=12), 'rope', matrix=M if not ax else Tm(x, y, 0.0))
    return P


def basket_ea():
    """대바구니 둘 (하나는 고추·콩) + 기대 세운 키."""
    P = Piece('basket_ea', 8008)

    def bask(M, r, h, col='straw_dark'):
        pal_add(P, lathe_bm([(r * 0.72, 0.0), (r, h * 0.7), (r * 1.04, h), (r * 0.98, h), (r * 0.92, h * 0.7), (r * 0.68, 0.02)], n=14, cap0=True), col, matrix=M)
    bask(Tm(0, 0, 0), 0.32, 0.22)
    pal_add(P, lathe_bm([(0.28, 0.2), (0.16, 0.26), (0.0, 0.28)], n=14), 'pepper_red', matrix=Tm(0, 0, 0))
    bask(Tm(0.6, 0.12, 0), 0.26, 0.18)
    pal_add(P, lathe_bm([(0.22, 0.16), (0.12, 0.21), (0.0, 0.22)], n=14), 'bean', matrix=Tm(0.6, 0.12, 0))
    v = [(-0.24, -0.22, 0.0), (0.24, -0.22, 0.0), (0.3, 0.22, 0.07), (-0.3, 0.22, 0.07)]
    M = Tm(-0.55, 0.28, 0.27) @ Rx(rad(72))
    for d, face in ((0.0, (0, 1, 2, 3)), (-0.01, (3, 2, 1, 0))):
        pal_add(P, K.bm_from([(x, y, z + d) for x, y, z in v], [face]), 'straw', smooth=False, matrix=M)
    return P


def mortar_ea():
    """돌절구(공이를 세워 둠) + 맷돌 한 벌."""
    P = Piece('mortar_ea', 8009)
    P.add_bm(lathe_bm([(0.0, 0.0), (0.26, 0.0), (0.3, 0.3), (0.3, 0.55), (0.2, 0.55), (0.12, 0.3), (0.0, 0.28)], n=14, tile=0.6), 'granite', uv=True,
             smooth=True)
    P.add_bm(tube_bm([(0.0, 0.0, 0.32), (0.08, 0.05, 1.25)], [0.06, 0.04], n=7), 'timber', tile=(0.5, 0.5))
    for (z, h) in ((0.0, 0.14), (0.15, 0.12)):
        P.add_bm(lathe_bm([(0.0, z), (0.3, z), (0.31, z + h), (0.0, z + h)], n=14, tile=0.6), 'granite', uv=True, smooth=False, matrix=Tm(0.8, 0.1, 0.0))
    P.add_bm(tube_bm([(0.8 + 0.22, 0.1, 0.27), (0.8 + 0.22, 0.1, 0.42)], 0.025, n=5), 'timber', tile=(0.4, 0.4))
    return P


def woodpile_ea():
    """장작 더미 (벽에 기대 쌓은 쪼갠 장작) + 묶은 나뭇단 둘."""
    P = Piece('woodpile_ea', 8010)
    rng = P.rng
    for row in range(5):
        for k in range(9):
            x = -1.0 + k * 0.23 + (0.1 if row % 2 else 0.0)
            if x > 1.05:
                continue
            r = rng.uniform(0.055, 0.075)
            P.add_bm(lathe_bm([(0.0, -0.32), (r, -0.32), (r, 0.32), (0.0, 0.32)], n=6, tile=0.4), 'timber', uv=True, smooth=False,
                     matrix=Tm(x, 0.0, 0.07 + row * 0.13) @ Rx(rad(90)))
    for (x, a) in ((1.45, 0.2), (1.7, -0.25)):
        P.add_bm(loft_bm([((x, 0.0, 0.0), 0.16, 0.16), ((x + 0.04 * a, 0.0, 0.6), 0.12, 0.12), ((x + 0.12 * a, 0.0, 1.2), 0.22, 0.2)], n=8, cap0=True, cap1=True),
                 'hay', tile=(0.6, 0.6), smooth=True)
        pal_add(P, lathe_bm([(0.13, 0.48), (0.13, 0.53)], n=10), 'rope', matrix=Tm(x, 0.0, 0.0))
    return P


def bench_ea():
    """평상: 낮은 널 마루 (1.8 × 1.2, 높이 0.42) + 다리 여섯 + 위에 깐 돗자리."""
    P = Piece('bench_ea', 8011)
    L, W, Hs = 1.8, 1.2, 0.42
    P.box(-L / 2, L / 2, -W / 2, W / 2, Hs - 0.06, Hs, 'floor', tile=1.2, bevel=0.008)
    for x in (-L / 2 + 0.08, 0.0, L / 2 - 0.08):
        for y in (-W / 2 + 0.08, W / 2 - 0.08):
            P.box(x - 0.05, x + 0.05, y - 0.05, y + 0.05, 0.0, Hs - 0.06, 'timber', tile=1.0)
    for y in (-W / 2 + 0.03, W / 2 - 0.03):
        P.box(-L / 2, L / 2, y - 0.03, y + 0.03, Hs - 0.16, Hs - 0.06, 'timber', tile=1.0)
    v = [(-0.75, -0.5, Hs + 0.004), (0.75, -0.5, Hs + 0.004), (0.75, 0.5, Hs + 0.004), (-0.75, 0.5, Hs + 0.004)]
    bm = K.bm_from(v, [(0, 1, 2, 3)])
    uvl = bm.loops.layers.uv.verify()
    for f in bm.faces:
        for l in f.loops:
            l[uvl].uv = (l.vert.co.x / 0.5, l.vert.co.y / 0.5)
    P.add_bm(bm, 'weave', uv=False)
    return P


def veg_bed_ea():
    """텃밭: 흙 두둑 셋 (배추 · 무 · 파), 말뚝 몇."""
    P = Piece('veg_bed_ea', 8012)
    rng = P.rng
    for j, (y, kind) in enumerate(((-0.45, 'cabbage'), (0.0, 'radish'), (0.45, 'onion'))):
        P.add_bm(loft_bm([((x, y, 0.0), 0.2, 0.12) for x in lin(-1.45, 1.45, 6)], n=8, expo=2.0, ref=(0, 1, 0), cap0=True, cap1=True), 'soil', tile=(0.8, 0.8),
                 smooth=True)
        for k in range(8):
            x = -1.3 + k * 0.37 + rng.uniform(-0.04, 0.04)
            if kind == 'cabbage':
                for q in range(5):
                    a = q * 1.26 + k
                    pal_add(P, ellipsoid_bm((x + 0.06 * math.cos(a), y + 0.06 * math.sin(a), 0.16), (0.11, 0.07, 0.06), nu=6, nv=3, rot=Rz(a).to_3x3()),
                            'cabbage' if q % 2 else 'leaf')
                pal_add(P, ellipsoid_bm((x, y, 0.2), (0.07, 0.07, 0.09), nu=6, nv=4), 'cabbage')
            elif kind == 'radish':
                pal_add(P, ellipsoid_bm((x, y, 0.13), (0.045, 0.045, 0.06), nu=6, nv=3), 'radish')
                for q in range(4):
                    a = q * 1.57 + k
                    pal_add(P, ellipsoid_bm((x + 0.08 * math.cos(a), y + 0.08 * math.sin(a), 0.26), (0.11, 0.03, 0.012), nu=5, nv=3,
                                            rot=(Rz(a) @ Ry(rad(-40))).to_3x3()), 'leaf')
            else:
                for q in range(5):
                    a = q * 1.26
                    pal_add(P, tube_bm([(x, y, 0.1), (x + 0.04 * math.cos(a), y + 0.04 * math.sin(a), 0.42)], [0.012, 0.004], n=4), 'leaf')
    for (x, y) in ((-1.55, -0.7), (1.55, -0.7), (-1.55, 0.7), (1.55, 0.7)):
        P.add_bm(tube_bm([(x, y, -0.1), (x, y, 0.55)], 0.025, n=5), 'bamboo', tile=(0.5, 0.5))
    return P


def trough_ea():
    """통나무 구유 (반을 파낸 통나무를 받침 위에) + 여물."""
    P = Piece('trough_ea', 8013)
    L = 1.7
    P.add_bm(lathe_bm([(0.0, -L / 2), (0.26, -L / 2), (0.26, L / 2), (0.0, L / 2)], n=10, tile=0.5), 'timber', uv=True, smooth=True,
             matrix=Tm(0, 0, 0.3) @ Ry(rad(90)))
    P.box(-L / 2 + 0.08, L / 2 - 0.08, -0.18, 0.18, 0.4, 0.53, 'hay', tile=0.8)
    for x in (-0.6, 0.6):
        P.box(x - 0.08, x + 0.08, -0.3, 0.3, 0.0, 0.12, 'timber', tile=0.8)
    return P


def stones_ea():
    """개울 디딤돌: 넓적한 돌 열하나를 일직선에 가깝게 (X 로 -5 … +5, 돌 윗면 0.42). 장면이 물높이에 맞춰 놓는다."""
    P = Piece('stones_ea', 8014)
    rng = P.rng
    n = 11
    for k in range(n):
        x = -5.0 + 10.0 * k / (n - 1)
        y = 0.12 * math.sin(k * 1.7)
        s = rng.uniform(0.85, 1.15)
        bm = ellipsoid_bm((x, y, 0.1), (0.44 * s, 0.36 * s, 0.32), nu=10, nv=5, rot=Rz(rng.uniform(0, 3.1)).to_3x3())
        for v in bm.verts:
            if v.co.z > 0.3:
                v.co.z = 0.3 + (v.co.z - 0.3) * 0.2
        P.add_bm(bm, 'granite', tile=(0.8, 0.8), smooth=True)
    return P


# ───────────────────────── 울·담 ─────────────────────────
def wall_stone_ea():
    """막돌 돌담 2 m 조각 (X 로 -1 … +1, 높이 ~1.4): 막돌을 흙으로 쌓은 둥근 어깨, 위로 좁아짐, 끝 단면이 같아 이어 붙는다."""
    P = Piece('wall_stone_ea', 8101)
    Lh, nx, nz = 2.0, 10, 7
    wb, wt, H = 0.34, 0.24, 1.3

    def disp(x, z, side):
        a = math.pi * x / (Lh / 2)
        return 0.03 * noise3(math.cos(a) * 1.4 + side * 3, math.sin(a) * 1.4, z * 3.2, 61)
    v, f = [], []
    rows = [(H * j / nz, wb + (wt - wb) * (j / nz)) for j in range(nz + 1)] + [(H + 0.08, wt * 0.75), (H + 0.13, wt * 0.35)]
    for side in (-1, 1):
        for (z, w) in rows:
            for i in range(nx + 1):
                x = -Lh / 2 + Lh * i / nx
                v.append((x, side * (w + disp(x, z, side) * (z < H)), z - 0.15 * (z == 0)))
    stride, nr = nx + 1, len(rows)
    off = nr * stride
    for j in range(nr - 1):
        for i in range(nx):
            a = j * stride + i
            f.append((a, a + 1, a + stride + 1, a + stride))
            b = off + j * stride + i
            f.append((b, b + stride, b + stride + 1, b + 1))
    for i in range(nx):
        a, b = (nr - 1) * stride + i, off + (nr - 1) * stride + i
        f.append((a, a + 1, b + 1, b))
    P.add_bm(K.bm_from(v, f), 'rubble', tile=(1.2, 1.2), smooth=True)
    return P


def wall_earth_ea():
    """흙담 + 기와 갓 2 m 조각 (높이 ~1.75): 다진 흙 몸, 위에 작은 맞배 기와 (막새 없음). 끝 단면이 같아 이어 붙는다."""
    P = Piece('wall_earth_ea', 8102)
    P.box(-1.0, 1.0, -0.22, 0.22, -0.15, 0.25, 'rubble', tile=1.2)
    P.box(-1.0, 1.0, -0.19, 0.19, 0.25, 1.5, 'rammed', tile=2.0)
    tp = math.tan(rad(28))

    def fz(x, y):
        return 1.74 - abs(y) * tp
    ys = lin(-0.42, 0.42, 4)

    def uvf(me, poly):
        return [(me.vertices[i].co.x / E.TILE_U, -abs(me.vertices[i].co.y) / math.cos(rad(28)) / E.TILE_V) for i in poly.vertices]
    ob = K.heightfield(fz, lin(-1.0, 1.0, 4), ys, 0.08, uvfn=uvf, name='cap')
    P.add_obj(ob, 'tile', keep_uv=True)
    P.box(-1.0, 1.0, -0.07, 0.07, 1.68, 1.8, 'tile', tile=0.8)
    return P


def fence_ea():
    """바자울 2 m 조각 (X 로 -1 … +1, 높이 1.3): 대나무 말뚝 다섯 + 가로대 둘 + 촘촘히 세운 싸리·대 가지."""
    P = Piece('fence_ea', 8103)
    rng = P.rng
    for k in range(5):
        x = -0.96 + k * 0.48
        P.add_bm(tube_bm([(x, 0, -0.3), (x, 0, 1.35)], 0.03, n=6), 'bamboo', tile=(0.5, 0.5))
    for z in (0.35, 1.0):
        P.add_bm(tube_bm([(-1.0, 0.035, z), (1.0, 0.035, z)], 0.02, n=5, ref=(0, 0, 1)), 'bamboo', tile=(0.5, 0.5))
    n = 34
    for k in range(n):
        x = -0.98 + 1.96 * (k + 0.5) / n
        h = rng.uniform(1.1, 1.3)
        P.add_bm(tube_bm([(x, -0.02, 0.0), (x + rng.uniform(-0.03, 0.03), -0.02, h)], 0.012, n=3, cap0=False), 'bamboo', tile=(0.4, 0.4))
    return P


# ───────────────────────── 가축 ─────────────────────────
def ox_ea():
    """누렁소 (한우·중국 황소 일반형, 기갑 ~1.25 m, 몸길이 ~1.75 m): 혹 없는 곧은 등, 짧게 옆으로 휜 뿔, 코뚜레, 가는 다리, 끝 술 꼬리."""
    P = Piece('ox_ea', 9001)
    st = [((-0.84, 0, 1.06), 0.02, 0.02, 0.02),
          ((-0.82, 0, 1.07), 0.13, 0.05, 0.16, 0.3),
          ((-0.74, 0, 1.09), 0.2, 0.07, 0.34, 0.35),
          ((-0.58, 0, 1.11), 0.24, 0.08, 0.42, 0.38),
          ((-0.36, 0, 1.12), 0.26, 0.08, 0.45, 0.38),
          ((-0.12, 0, 1.12), 0.27, 0.08, 0.46, 0.4),
          ((0.14, 0, 1.13), 0.27, 0.09, 0.47, 0.4),
          ((0.36, 0, 1.15), 0.24, 0.1, 0.46, 0.35),
          ((0.52, 0, 1.16), 0.19, 0.1, 0.4, 0.3),
          ((0.64, 0, 1.15), 0.14, 0.1, 0.28, 0.2),
          ((0.74, 0, 1.15), 0.115, 0.1, 0.16),
          ((0.82, 0, 1.16), 0.1, 0.09, 0.11),
          ((0.86, 0, 1.17), 0.05, 0.05, 0.05)]
    st = [(c, hw * 1.08, ht * 1.06, *rest) for (c, hw, ht, *rest) in st]
    P.add_bm(loft_bm(densify(st, 1), n=20, expo=2.2), 'hide', tile=(0.45, 0.45), smooth=True)
    P.add_bm(ellipsoid_bm((0.62, 0, 0.82), (0.18, 0.03, 0.09), nu=10, nv=5, rot=Ry(rad(-35)).to_3x3()), 'hide', tile=(0.45, 0.45), smooth=True)
    shoulders_thighs(P, 'hide', (0.38, 0.13, 0.88, 0.15, 0.09, 0.2), (-0.56, 0.14, 0.9, 0.19, 0.1, 0.24))
    hd = [((0.84, 0, 1.22), 0.03, 0.03), ((0.87, 0, 1.22), 0.1, 0.075, 0.09), ((0.95, 0, 1.15), 0.095, 0.065, 0.09),
          ((1.03, 0, 1.06), 0.08, 0.055, 0.08), ((1.1, 0, 0.97), 0.07, 0.055, 0.07), ((1.15, 0, 0.9), 0.075, 0.05, 0.06), ((1.17, 0, 0.87), 0.035, 0.03, 0.03)]
    P.add_bm(loft_bm(densify(hd, 1), n=12, expo=2.3), 'hide', tile=(0.45, 0.45), smooth=True)
    pal_add(P, ellipsoid_bm((1.165, 0, 0.885), (0.032, 0.07, 0.05), nu=8, nv=4), 'ox_face')
    pal_add(P, lathe_bm([(0.045, -0.006), (0.045, 0.006)], n=10), 'rope', matrix=Tm(1.15, 0, 0.9) @ Rx(rad(90)))      # 코뚜레
    pal_add(P, tube_bm([(1.15, 0.04, 0.9), (1.0, 0.15, 1.05), (0.9, 0.12, 1.2)], 0.01, n=3), 'rope')
    eye_pair(P, 0.97, 0.085, 1.15, r=0.016)
    for sy in (1, -1):
        rot = (Rz(sy * rad(80)) @ Ry(rad(15))).to_3x3()
        P.add_bm(ellipsoid_bm((0.9, sy * 0.15, 1.17), (0.09, 0.04, 0.02), nu=6, nv=3, rot=rot), 'hide', tile=(0.45, 0.45), smooth=True)
        pal_add(P, tube_bm([(0.86, sy * 0.06, 1.26), (0.86, sy * 0.14, 1.3), (0.9, sy * 0.2, 1.36), (0.95, sy * 0.19, 1.4)], [0.026, 0.02, 0.012, 0.005], n=6,
                           ref=(1, 0, 0)), 'horn')
    P.add_bm(tube_bm([(-0.83, 0, 1.06), (-0.88, 0, 0.88), (-0.89, 0, 0.55), (-0.88, 0, 0.38)], [0.03, 0.022, 0.017, 0.015], n=6, ref=(0, 1, 0)), 'hide',
             tile=(0.45, 0.45), smooth=True)
    pal_add(P, ellipsoid_bm((-0.88, 0, 0.32), (0.035, 0.035, 0.09), nu=6, nv=4), 'dark_brown')
    legs_pair(P, [(0.38, 0.13, 0.76), (0.39, 0.13, 0.55), (0.39, 0.13, 0.36), (0.4, 0.13, 0.1)], [0.1, 0.07, 0.052, 0.046], 'hide')
    legs_pair(P, [(-0.56, 0.14, 0.8), (-0.61, 0.14, 0.62), (-0.68, 0.14, 0.42), (-0.62, 0.14, 0.1)], [0.11, 0.08, 0.055, 0.046], 'hide')
    return P


def buffalo_ea():
    """물소 (남중국 논): 넓고 깊은 통 몸, 검은 가죽, 앞으로 내민 머리, 뒤로 휜 초승달 뿔, 굵은 다리."""
    P = Piece('buffalo_ea', 9002)
    st = [((-0.95, 0, 1.15), 0.03, 0.03, 0.03), ((-0.93, 0, 1.16), 0.17, 0.07, 0.2, 0.25), ((-0.84, 0, 1.18), 0.27, 0.08, 0.38, 0.3),
          ((-0.66, 0, 1.2), 0.33, 0.1, 0.5, 0.32), ((-0.4, 0, 1.2), 0.36, 0.1, 0.54, 0.32), ((-0.1, 0, 1.2), 0.37, 0.11, 0.56, 0.32),
          ((0.2, 0, 1.23), 0.34, 0.12, 0.56, 0.3), ((0.42, 0, 1.25), 0.27, 0.12, 0.5, 0.25), ((0.58, 0, 1.22), 0.2, 0.12, 0.36, 0.2),
          ((0.72, 0, 1.18), 0.16, 0.12, 0.22), ((0.82, 0, 1.15), 0.15, 0.12, 0.17), ((0.88, 0, 1.15), 0.06, 0.06, 0.06)]
    P.add_bm(loft_bm(densify(st, 1), n=22, expo=2.1), 'hide_dark', tile=(0.45, 0.45), smooth=True)
    shoulders_thighs(P, 'hide_dark', (0.44, 0.19, 0.86, 0.19, 0.12, 0.24), (-0.62, 0.2, 0.9, 0.24, 0.13, 0.28))
    hd = [((0.85, 0, 1.2), 0.04, 0.04), ((0.88, 0, 1.19), 0.13, 0.08, 0.12), ((0.97, 0, 1.13), 0.12, 0.07, 0.11),
          ((1.07, 0, 1.05), 0.095, 0.06, 0.09), ((1.16, 0, 0.98), 0.09, 0.06, 0.075), ((1.21, 0, 0.94), 0.09, 0.055, 0.06), ((1.23, 0, 0.92), 0.04, 0.03, 0.03)]
    P.add_bm(loft_bm(densify(hd, 1), n=12, expo=2.4), 'hide_dark', tile=(0.45, 0.45), smooth=True)
    pal_add(P, ellipsoid_bm((1.225, 0, 0.935), (0.035, 0.08, 0.05), nu=8, nv=4), 'soot')
    eye_pair(P, 0.98, 0.115, 1.14, r=0.017)
    for sy in (1, -1):
        rot = (Rz(sy * rad(85)) @ Ry(rad(20))).to_3x3()
        P.add_bm(ellipsoid_bm((0.88, sy * 0.17, 1.13), (0.1, 0.045, 0.02), nu=6, nv=3, rot=rot), 'hide_dark', tile=(0.45, 0.45), smooth=True)
        pts = [(0.87, sy * 0.08, 1.27), (0.84, sy * 0.24, 1.31), (0.72, sy * 0.38, 1.33), (0.56, sy * 0.41, 1.36), (0.46, sy * 0.33, 1.42)]
        pal_add(P, loft_bm([(p, r, r * 0.6) for p, r in zip(pts, (0.05, 0.045, 0.036, 0.024, 0.008))], n=7, ref=(0, 0, 1)), 'charcoal')
    P.add_bm(tube_bm([(-0.94, 0, 1.12), (-0.98, 0, 0.92), (-0.98, 0, 0.7)], [0.035, 0.025, 0.02], n=6, ref=(0, 1, 0)), 'hide_dark', tile=(0.45, 0.45), smooth=True)
    legs_pair(P, [(0.44, 0.19, 0.72), (0.45, 0.19, 0.52), (0.45, 0.19, 0.32), (0.46, 0.19, 0.1)], [0.11, 0.075, 0.055, 0.05], 'hide_dark', hoof_r=0.065)
    legs_pair(P, [(-0.62, 0.2, 0.75), (-0.66, 0.2, 0.58), (-0.74, 0.2, 0.4), (-0.68, 0.2, 0.1)], [0.12, 0.085, 0.06, 0.05], 'hide_dark', hoof_r=0.065)
    return P


def pig():
    """검은 돼지 (몸길이 ~0.95 m, 키 ~0.55 m): 둥근 통 몸, 처진 배, 큰 귀가 앞으로 처짐, 주둥이, 짧은 다리, 말린 꼬리."""
    P = Piece('pig', 9003)
    st = [((-0.45, 0, 0.42), 0.02, 0.02, 0.02), ((-0.43, 0, 0.42), 0.12, 0.1, 0.12), ((-0.32, 0, 0.42), 0.19, 0.16, 0.2),
          ((-0.12, 0, 0.42), 0.22, 0.18, 0.24), ((0.1, 0, 0.42), 0.21, 0.17, 0.23), ((0.26, 0, 0.43), 0.17, 0.15, 0.18), ((0.36, 0, 0.42), 0.12, 0.11, 0.11),
          ((0.44, 0, 0.39), 0.08, 0.07, 0.07), ((0.5, 0, 0.37), 0.06, 0.055, 0.05), ((0.53, 0, 0.37), 0.055, 0.05, 0.045)]
    P.add_bm(loft_bm(densify(st, 1), n=16, expo=2.0), 'hide_pig', tile=(0.35, 0.35), smooth=True)
    pal_add(P, lathe_bm([(0.05, 0.0), (0.052, 0.012), (0.0, 0.016)], n=10, cap0=True), 'pig_skin', matrix=Tm(0.535, 0, 0.37) @ Ry(rad(90)))
    eye_pair(P, 0.42, 0.06, 0.46, r=0.01)
    for sy in (1, -1):
        rot = (Rz(sy * rad(30)) @ Ry(rad(50))).to_3x3()
        P.add_bm(ellipsoid_bm((0.39, sy * 0.08, 0.49), (0.09, 0.06, 0.012), nu=6, nv=3, rot=rot), 'hide_pig', tile=(0.35, 0.35), smooth=True)
    pal_add(P, tube_bm([(-0.44, 0, 0.44), (-0.5, 0.02, 0.46), (-0.52, -0.02, 0.5), (-0.49, 0.0, 0.53)], 0.012, n=4), 'pig_black')
    legs_pair(P, [(0.24, 0.1, 0.3), (0.25, 0.1, 0.16), (0.26, 0.1, 0.04)], [0.05, 0.035, 0.03], 'hide_pig')
    legs_pair(P, [(-0.28, 0.11, 0.3), (-0.3, 0.11, 0.16), (-0.29, 0.11, 0.04)], [0.06, 0.038, 0.03], 'hide_pig')
    return P


def chicken():
    """닭 (토종닭, 키 ~0.4 m): 밤색 몸, 검은 꽁지, 붉은 볏·고기수염, 노란 발."""
    P = Piece('chicken', 9004)
    st = [((-0.15, 0, 0.22), 0.02, 0.02), ((-0.12, 0, 0.22), 0.07, 0.06, 0.06), ((-0.05, 0, 0.21), 0.095, 0.08, 0.1),
          ((0.03, 0, 0.21), 0.09, 0.085, 0.095), ((0.09, 0, 0.24), 0.06, 0.07, 0.06), ((0.11, 0, 0.28), 0.04, 0.04, 0.04),
          ((0.125, 0, 0.33), 0.032, 0.032, 0.032), ((0.135, 0, 0.36), 0.03, 0.03, 0.03), ((0.14, 0, 0.38), 0.01, 0.01, 0.01)]
    pal_add(P, loft_bm(st, n=10), 'hen')
    pal_add(P, loft_bm([((-0.1, 0, 0.25), 0.03, 0.04), ((-0.16, 0, 0.31), 0.025, 0.07), ((-0.2, 0, 0.37), 0.012, 0.05), ((-0.21, 0, 0.4), 0.004, 0.012)], n=6), 'hen_dark')
    pal_add(P, loft_bm([((0.12, 0, 0.385), 0.006, 0.01), ((0.14, 0, 0.398), 0.008, 0.024), ((0.16, 0, 0.388), 0.006, 0.013), ((0.17, 0, 0.372), 0.003, 0.004)], n=5), 'comb')
    pal_add(P, loft_bm([((0.15, 0, 0.355), 0.01, 0.008), ((0.18, 0, 0.35), 0.002, 0.002)], n=5), 'beak')
    pal_add(P, ellipsoid_bm((0.15, 0, 0.33), (0.01, 0.006, 0.016), nu=5, nv=3), 'comb')
    for sy in (1, -1):
        pal_add(P, tube_bm([(0.0, sy * 0.035, 0.14), (0.01, sy * 0.035, 0.0)], 0.007, n=4, ref=(1, 0, 0)), 'beak')
        for a in (-0.5, 0.0, 0.5):
            pal_add(P, tube_bm([(0.01, sy * 0.035, 0.005), (0.01 + 0.04 * math.cos(a), sy * 0.035 + 0.04 * math.sin(a), 0.003)], 0.004, n=3, ref=(0, 0, 1)), 'beak')
    eye_pair(P, 0.14, 0.022, 0.37, r=0.006)
    return P


def duck_ea():
    """오리 (몸길이 ~0.45 m): 떠 있는 몸 (물에 잠긴 밑면 없음), 목·머리, 납작한 부리. 깃털 = down (장면에서 흰·갈색으로 곱)."""
    P = Piece('duck_ea', 9005)
    st = [((-0.22, 0, 0.08), 0.02, 0.02, 0.01), ((-0.18, 0, 0.09), 0.07, 0.06, 0.05), ((-0.08, 0, 0.09), 0.11, 0.07, 0.06), ((0.05, 0, 0.09), 0.11, 0.07, 0.06),
          ((0.14, 0, 0.1), 0.08, 0.06, 0.05), ((0.18, 0, 0.12), 0.04, 0.04, 0.04)]
    P.add_bm(loft_bm(st, n=10), 'down', tile=(0.3, 0.3), smooth=True)
    P.add_bm(loft_bm([((0.15, 0, 0.12), 0.035, 0.035), ((0.18, 0, 0.2), 0.03, 0.03), ((0.2, 0, 0.25), 0.04, 0.04), ((0.24, 0, 0.27), 0.035, 0.03),
                      ((0.26, 0, 0.27), 0.01, 0.01)], n=8), 'down', tile=(0.3, 0.3), smooth=True)
    pal_add(P, loft_bm([((0.25, 0, 0.26), 0.018, 0.01), ((0.31, 0, 0.255), 0.016, 0.005), ((0.32, 0, 0.255), 0.006, 0.003)], n=6), 'duck_bill')
    eye_pair(P, 0.235, 0.028, 0.285, r=0.006)
    pal_add(P, loft_bm([((-0.2, 0, 0.1), 0.02, 0.02), ((-0.25, 0, 0.14), 0.012, 0.02)], n=5), 'duck_brown')
    return P


BUILDERS = [cart_ea, jangdok, jars_ea, taru_ea, rice_rack, straw_stack, bales_ea, basket_ea, mortar_ea, woodpile_ea, bench_ea, veg_bed_ea, trough_ea, stones_ea,
            wall_stone_ea, wall_earth_ea, fence_ea, ox_ea, buffalo_ea, pig, chicken, duck_ea]


def foot_dims(root, foot):
    me_obj = [c for c in root.children if c.type == 'MESH'][0]
    return (foot[1] - foot[0], foot[3] - foot[2], max(v.co.z for v in me_obj.data.vertices))


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
        dims[root.name] = foot_dims(root, P.foot)
        roots.append(root)
        log('%-14s %6d 삼각형  %.1fs  %s' % (root.name, sum(K.tri_count(o) for o in K.mesh_objects([root])), time.time() - ts,
                                          'x'.join('%.2f' % d for d in dims[root.name])))
    for i, r in enumerate(roots):
        r.location = (i * 12.0, 0, 0)
    objs = K.mesh_objects(roots)
    K.make_ao_uvs(objs, margin=0.003)
    img = K.bake_ao(objs, size=2048, samples=192, distance=0.7)
    mats = [K.MATS[n] for n in K.MATS]
    K.wire_ao(mats, img)
    for r in roots:
        r.location = (0, 0, 0)
    out = os.path.join(K.KITS, NAME + '.glb') if not only else os.path.join(K.BUILD, NAME + '_partial.glb')
    tris = {r.name: sum(K.tri_count(o) for o in K.mesh_objects([r])) for r in roots}
    info = K.export_glb(roots, out) if not only or os.environ.get('KIT_EXPORT') == '1' else {}
    if not only:
        with open(os.path.join(K.KITS, NAME + '.dims.json'), 'w', encoding='utf-8', newline='\n') as f:
            json.dump({'source': 'tools/blender/kit_props_eastasia.py', 'units': 'm, [x 길이, 앞뒤 깊이, 높이]',
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
    if [s for s in os.environ.get('KIT_ONLY', '').split(',') if s]:
        K.PREVIEW = os.path.join(K.BUILD, 'preview_only')
        os.makedirs(K.PREVIEW, exist_ok=True)
    K.setup_preview(sun_elev=30, sun_az=140, grass=os.path.join(K.TEX, 'leafy_grass_diff_1k.jpg'))
    S.preview_ground((0.66, 0.74, 0.44))
    by = {r.name: r for r in roots}
    LAYOUT = {
        'cart_ea': (-3.2, -1.6, 0.35), 'jangdok': (1.6, 2.6, 0.0), 'jars_ea': (4.2, 2.4, 0.0), 'taru_ea': (5.6, 1.0, 0.0), 'rice_rack': (-4.5, 4.6, 0.0),
        'straw_stack': (-9.2, 4.0, 0.0), 'bales_ea': (-1.4, 2.2, 0.3), 'basket_ea': (0.6, 0.9, 0.0), 'mortar_ea': (2.6, 0.4, 0.0), 'woodpile_ea': (-0.4, 4.7, 0.0),
        'bench_ea': (4.5, -0.6, -0.2), 'veg_bed_ea': (8.4, 3.0, 0.0), 'trough_ea': (-6.6, -0.8, 0.1), 'stones_ea': (2.0, -6.0, 0.05),
        'wall_stone_ea': (-7.0, 6.6, 0.0), 'wall_earth_ea': (-5.0, 6.6, 0.0), 'fence_ea': (-3.0, 6.6, 0.0),
        'ox_ea': (-7.4, -2.8, 0.5), 'buffalo_ea': (-10.6, -1.0, -0.3), 'pig': (-4.4, -3.8, 1.1), 'chicken': (0.9, -1.4, 2.0), 'duck_ea': (1.6, -2.2, 0.6),
    }
    for n, (x, y, rz) in LAYOUT.items():
        if n in by:
            by[n].location = (x, y, 0)
            by[n].rotation_euler = (0, 0, rz)
    shots = [
        ('eastasia_props_overview', (-1, -16, 7.0), (-1.5, 1.5, 0.6), 30),
        ('eastasia_animals', (-5.5, -8.6, 1.6), (-7.5, -1.8, 0.7), 38),
        ('eastasia_props_yard', (3.0, -3.6, 1.8), (2.5, 2.0, 0.6), 34),
    ]
    for name, pos, tgt, lens in shots:
        cam = K.camera_look(name, pos, tgt, lens)
        K.render_to(cam, os.path.join(K.PREVIEW, name + '.png'))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)
