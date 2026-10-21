# 남아시아 마을 소품·가축 세트 — Blender 4.2 명령줄 스크립트. kit_common.py · kit_sa_common.py · kit_props.py(결정적 도형 도구)를 함께 쓴다.
#   GLTFT=<gltf-transform 폴더> "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe" --background --python tools/blender/kit_props_southasia.py
# 결과: docs/past-life/assets/real/kits/props_southasia.glb (meshopt + WebP), kits/props_southasia.dims.json, kits/preview/southasia_props_*.png
# 노드:
#   운반·살림 cart_bullock(소달구지, 멍에 끝을 땅에 내린 자세), water_pot(흙 항아리 셋: 똬리 위·포갬), lota(놋 물병), charpai(끈 침상),
#            haystack_sa(볏짚 가리), sacks_sa(마대), basket_sa(바구니·키), dung_cakes(쇠똥 떡 더미), chulha(흙 아궁이 + 냄비), loom(바닥 베틀)
#   울·담   wall_mud(흙 담 2 m, 이어 붙임), fence_bamboo(대나무 울 2 m, 이어 붙임), trough_sa(흙 여물통)
#   가축     cow_zebu(혹소: 혹·처진 목살·늘어진 귀·위로 휜 뿔), buffalo(물소: 뒤로 휜 초승달 뿔·검은 몸), goat(염소: 늘어진 귀·짧은 뿔), chicken(닭)
#   (머리 = +X. 가축 몸 색은 재료 색 hide·hide_dark·hide_goat — 장면에서 마리마다 곱해 변주)
# 좌표: 조각마다 바닥 가운데가 원점, 미터. 긴 축 = X, 앞 = glTF +Z (Blender -Y). 울·담은 X 로 -1 … +1.
# 환경변수: KIT_FAST=1, KIT_ONLY=cow_zebu,goat, KIT_NOPREVIEW=1, KIT_EXPORT=1
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
from kit_sa_common import pal_add, prism_ok, add_vf, Tm, Rz, Ry, Rx
from kit_props import lathe_bm, loft_bm, tube_bm, ellipsoid_bm, outward, noise3, densify

rad = math.radians
NAME = 'props_southasia'


# ───────────────────────── 만든 텍스처 ─────────────────────────
def gen_weave():
    """끈 침상 엮음: 대각 두 방향 끈이 번갈아 위로 (256², 이어 붙는다)."""
    N, p = 256, 16
    y, x = np.mgrid[0:N, 0:N].astype(np.float32)
    u, v = (x + y) / p, (x - y) / p
    top = (np.floor(u) + np.floor(v)) % 2
    fu, fv = u % 1.0, v % 1.0
    prof_u = np.sin(np.pi * fv) ** 0.6           # u 방향 끈 (단면 둥긂)
    prof_v = np.sin(np.pi * fu) ** 0.6
    h = np.where(top > 0, prof_u, prof_v)
    gap = np.minimum(np.sin(np.pi * fu), np.sin(np.pi * fv))
    rs = np.random.RandomState(5)
    col = np.array([0.7, 0.58, 0.38], np.float32)[None, None] * (0.55 + 0.45 * h[..., None])
    col *= (0.75 + 0.25 * np.clip(gap * 3, 0, 1))[..., None]
    col += rs.normal(0, 0.015, col.shape).astype(np.float32)
    a = np.concatenate([col, np.ones_like(col[..., :1])], -1)
    path = os.path.join(K.BUILD, 'sa_weave.png')
    K._save_np(a, path)
    return path


# ───────────────────────── 재료 ─────────────────────────
def setup_materials():
    T, X = K.prep_texture, lambda f: os.path.join(K.TEX, f)
    mk = K.make_material
    mk('planks', T('sa_planks_d', 'old_planks_02_diff_1k.jpg', tint=(0.92, 0.8, 0.66), gain=0.9),
       X('old_planks_02_nor_gl_1k.jpg'), rough=0.85, nstr=1.0)
    mk('timber_dark', T('sa_timber_d', 'rough_wood_diff_1k.jpg', tint=(0.8, 0.64, 0.5), gain=0.6, sat=0.8, contrast=1.15),
       X('rough_wood_nor_gl_1k.jpg'), rough=0.85, nstr=1.0)
    mk('bamboo', T('sa_bamboo_d', 'bamboo_wall_diff_1k.jpg', tint=(1.05, 0.95, 0.78), gain=1.0, sat=0.8),
       X('bamboo_wall_nor_gl_1k.jpg'), rough=0.8, nstr=1.0)
    mk('hay', T('sa_hay_d', 'reed_roof_04_diff_1k.jpg', tint=(1.12, 1.0, 0.68), gain=1.02, sat=0.8, tile_v=(0.075, 0.12)),
       T('sa_thatch_n', 'reed_roof_04_nor_gl_1k.jpg', tile_v=(0.075, 0.12), normal=True), rough=1.0, nstr=1.6)
    mk('mud_bare', T('sa_mud_bare_d', 'patterned_clay_plaster_diff_1k.jpg', tint=(1.0, 0.84, 0.66), gain=0.8, sat=1.15, contrast=1.15),
       X('patterned_clay_plaster_nor_gl_1k.jpg'), rough=0.96, nstr=1.1)
    mk('canvas_jute', T('sa_jute_d', 'rough_linen_diff_1k.jpg', tint=(0.84, 0.68, 0.46), gain=0.86, sat=0.85),
       X('rough_linen_nor_gl_1k.jpg'), rough=0.95, nstr=1.2)
    mk('weave', gen_weave(), None, rough=0.95)
    mk('iron', color=(0.05, 0.048, 0.045), rough=0.55, metal=0.7)
    mk('brass', color=(0.55, 0.38, 0.12), rough=0.35, metal=0.9)
    mk('water', color=(0.02, 0.03, 0.03), rough=0.08)
    S.palette_material()
    hn = KP.gen_hide_normal()
    mk('hide', None, hn, rough=0.72, nstr=0.5, color=(0.44, 0.42, 0.39))         # 혹소 (회백, 장면에서 마리마다 곱)
    mk('hide_dark', None, hn, rough=0.6, nstr=0.4, color=(0.05, 0.048, 0.046))   # 물소
    mk('hide_goat', None, hn, rough=0.8, nstr=0.7, color=(0.2, 0.13, 0.08))      # 염소 (밤색, 장면에서 검정·흰색으로 곱)


# ───────────────────────── 도구 ─────────────────────────
def legs_pair(P, path, r, mat, hoof_col='hoof', hoof_r=None, ys=(1, -1)):
    for sy in ys:
        pts = [(x, sy * y, z) for (x, y, z) in path]
        bm = tube_bm(pts, r, n=7, ref=(1, 0, 0), cap0=False)
        P.add_bm(bm, mat, tile=(0.4, 0.4), smooth=True)
        x, y, z = pts[-1]
        hr = hoof_r or r[-1] * 1.12
        hb = lathe_bm([(hr * 1.08, 0.0), (hr, z * 0.55), (hr * 0.9, z + 0.005), (0.0, z + 0.01)], n=7, cap0=True)
        pal_add(P, hb, hoof_col, matrix=Tm(x + hr * 0.15, y, 0.0))


def shoulders_thighs(P, mat, front, back):
    """다리 윗부분 살 (어깨·넓적다리): 몸 아래로 다리가 막대처럼 꽂혀 보이지 않게. (x, y, z, rx, ry, rz) 를 좌우로."""
    for (x, y, z, rx, ry, rz) in (front, back):
        for sy in (1, -1):
            P.add_bm(ellipsoid_bm((x, sy * y, z), (rx, ry, rz), nu=10, nv=6), mat, tile=(0.45, 0.45), smooth=True)


def eye_pair(P, x, y, z, r=0.012, col='eye'):
    for sy in (1, -1):
        pal_add(P, ellipsoid_bm((x, sy * y, z), (r, r * 0.7, r), nu=5, nv=3), col)


def clay_pot(P, M, s=1.0, color='clay_pot'):
    prof = [(0.0, 0.0), (0.09, 0.005), (0.17, 0.06), (0.2, 0.15), (0.18, 0.25), (0.12, 0.31), (0.085, 0.335), (0.1, 0.36), (0.085, 0.365)]
    pal_add(P, lathe_bm([(r * s, z * s) for r, z in prof], n=16), color, smooth=True, matrix=M)


def lota_bm(s=1.0):
    prof = [(0.0, 0.0), (0.035, 0.0), (0.06, 0.02), (0.075, 0.06), (0.068, 0.1), (0.04, 0.125), (0.034, 0.14), (0.05, 0.16), (0.046, 0.165)]
    return lathe_bm([(r * s, z * s) for r, z in prof], n=14)


# ───────────────────────── 운반·살림 ─────────────────────────
def cart_bullock():
    """소달구지: 큰 나무바퀴 둘(살 12, 쇠테), 굴대, 바닥 대나무 살, 옆 말뚝·가로대, 앞으로 모이는 끌채 둘과 멍에.
    소를 떼어 낸 채 멍에 끝(+X)을 땅에 내려놓은 자세. 위에 볏짚 한 무더기와 마대 하나."""
    P = Piece('cart_bullock', 5001)
    R = 0.72
    L, W = 2.3, 1.2
    zb = R + 0.1
    ang = math.atan2(zb - 0.12, 2.9)
    Mb = Tm(0, 0, R) @ Ry(ang) @ Tm(0, 0, -R)

    def B(*a, **k):
        P.box(*a, matrix=Mb, **k)
    for sy in (-1, 1):                      # 옆 들보 = 앞으로 모이는 끌채
        p0 = Mb @ Vector((-L / 2 - 0.25, sy * W / 2, zb - 0.05))
        p1 = Mb @ Vector((0.9, sy * W / 2, zb - 0.05))
        p2 = Mb @ Vector((3.1, sy * 0.1, zb - 0.05))
        P.beam(tuple(p0), tuple(p1), 0.1, 0.11, 'timber_dark', bevel=0.012)
        P.beam(tuple(p1), tuple(p2), 0.09, 0.1, 'timber_dark', bevel=0.012, ext=0.02)
    for k in range(14):                      # 바닥 대나무 살 (가로)
        x = -L / 2 - 0.15 + k * (L + 0.9) / 13
        t = min(1.0, max(0.0, (x - 0.9) / 2.2))
        hw = W / 2 * (1 - t) + 0.1 * t
        B(x - 0.035, x + 0.035, -hw - 0.04, hw + 0.04, zb, zb + 0.05, 'bamboo', tile=0.8, bevel=0.01) if x < 1.4 else None
    for sy in (-1, 1):                      # 말뚝 + 가로대
        for x in (-L / 2 - 0.1, -0.6, 0.0, 0.6, 1.15):
            B(x - 0.025, x + 0.025, sy * (W / 2) - 0.025, sy * (W / 2) + 0.025, zb, zb + 0.62, 'bamboo', tile=0.8, bevel=0.006)
        for zz in (zb + 0.3, zb + 0.6):
            B(-L / 2 - 0.15, 1.2, sy * (W / 2) - 0.03, sy * (W / 2) + 0.03, zz, zz + 0.05, 'bamboo', tile=0.8, bevel=0.006)
    # 멍에 (끌채 끝 가로) + 멍에 고리 말뚝
    py = Mb @ Vector((2.95, 0.0, zb + 0.04))
    P.beam((py.x, -0.85, py.z), (py.x, 0.85, py.z), 0.1, 0.1, 'timber_dark', bevel=0.015)
    for sy in (-0.62, -0.32, 0.32, 0.62):
        P.add_bm(tube_bm([(py.x, sy, py.z - 0.2), (py.x, sy, py.z + 0.22)], 0.02, n=6), 'timber_dark', tile=(0.5, 0.5), smooth=True)
    # 굴대 + 바퀴
    P.beam((0, -W / 2 - 0.3, R), (0, W / 2 + 0.3, R), 0.1, 0.1, 'timber_dark', bevel=0.012, up=(1, 0, 0))
    for sy in (-1, 1):
        yw = sy * (W / 2 + 0.18)
        nseg = 12
        for k in range(nseg):
            a0, a1 = 2 * math.pi * k / nseg, 2 * math.pi * (k + 1) / nseg
            am = (a0 + a1) / 2
            p0 = (R * 0.93 * math.cos(a0), yw, R + R * 0.93 * math.sin(a0))
            p1 = (R * 0.93 * math.cos(a1), yw, R + R * 0.93 * math.sin(a1))
            P.beam(p0, p1, 0.1, 0.1, 'planks', up=(math.cos(am), 0, math.sin(am)), ext=0.04, bevel=0.008)
        P.add_bm(lathe_bm([(R + 0.012, -0.055), (R + 0.012, 0.055)], n=28), 'iron', uv=False, smooth=True, matrix=Tm(0, yw, R) @ Rx(rad(90)))
        P.add_bm(lathe_bm([(0.0, -0.17), (0.11, -0.16), (0.14, -0.08), (0.14, 0.08), (0.11, 0.16), (0.0, 0.17)], n=12, tile=0.5), 'timber_dark', uv=False,
                 smooth=True, matrix=Tm(0, yw, R) @ Rx(rad(90)))
        for k in range(12):
            a = 2 * math.pi * k / 12 + 0.13
            P.beam((0.12 * math.cos(a), yw, R + 0.12 * math.sin(a)), ((R * 0.88) * math.cos(a), yw, R + (R * 0.88) * math.sin(a)), 0.05, 0.04, 'planks',
                   up=(0, 1, 0), bevel=0.005)
    # 실은 짐: 볏짚 무더기 + 마대
    st = [((x, 0, zb + 0.05), hw, hh, 0.05) for (x, hw, hh) in ((-1.25, 0.2, 0.15), (-1.05, 0.48, 0.32), (-0.6, 0.55, 0.42), (-0.1, 0.55, 0.4), (0.3, 0.45, 0.3), (0.5, 0.2, 0.12))]
    bm = loft_bm(st, n=14, expo=2.2, ref=(0, 1, 0), disp=lambda p: 0.03 * noise3(p.x * 4, p.y * 4, p.z * 4, 31))
    P.add_bm(bm, 'hay', tile=(1.2, 1.2), smooth=True, matrix=Mb)
    P.add_bm(KP.sack_bm(P.rng, h=0.55, r=0.19), 'canvas_jute', tile=0.6, smooth=True, matrix=Mb @ Tm(0.75, 0.2, zb + 0.24) @ Rz(1.2) @ Ry(rad(86)))
    return P


def water_pot():
    """흙 항아리 (마트카) 셋: 짚 똬리 위 큰 것, 그 위 포갠 작은 것, 옆에 하나 + 놋 물병 하나."""
    P = Piece('water_pot', 5002)
    pal_add(P, lathe_bm([(0.13, 0.0), (0.16, 0.03), (0.13, 0.06), (0.1, 0.03)], n=14, cap0=False), 'hay_pale', matrix=Tm(0, 0, 0))
    clay_pot(P, Tm(0, 0, 0.035), 1.25)
    clay_pot(P, Tm(0.0, 0.0, 0.035 + 0.36 * 1.25 - 0.015), 0.85, 'clay_dark')
    clay_pot(P, Tm(0.36, 0.12, 0.0), 1.0, 'clay_pot')
    P.add_bm(lota_bm(1.0), 'brass', uv=False, smooth=True, matrix=Tm(0.26, -0.24, 0.0))
    return P


def lota():
    P = Piece('lota', 5003)
    P.add_bm(lota_bm(1.0), 'brass', uv=False, smooth=True)
    return P


def charpai():
    """끈 침상: 둥글게 깎은 다리 넷, 둥근 틀(긴 틀 둘·짧은 틀 둘), 대각으로 엮은 끈 바닥(조금 처짐), 한쪽 끝에 만 이불."""
    P = Piece('charpai', 5004)
    L, W, Hs = 1.9, 0.92, 0.46
    for sx in (-1, 1):
        for sy in (-1, 1):
            prof = [(0.045, 0.0), (0.05, 0.04), (0.04, 0.12), (0.055, 0.2), (0.04, 0.3), (0.045, 0.38), (0.04, Hs + 0.03)]
            P.add_bm(lathe_bm(prof, n=8, tile=0.5), 'timber_dark', uv=False, smooth=True, matrix=Tm(sx * (L / 2 - 0.03), sy * (W / 2 - 0.03), 0))
    for sy in (-1, 1):
        P.add_bm(tube_bm([(-L / 2, sy * (W / 2 - 0.03), Hs - 0.02), (L / 2, sy * (W / 2 - 0.03), Hs - 0.02)], 0.03, n=8, ref=(0, 0, 1)), 'timber_dark',
                 tile=(0.6, 0.6), smooth=True)
    for sx in (-1, 1):
        P.add_bm(tube_bm([(sx * (L / 2 - 0.03), -W / 2, Hs - 0.02), (sx * (L / 2 - 0.03), W / 2, Hs - 0.02)], 0.028, n=8, ref=(0, 0, 1)), 'timber_dark',
                 tile=(0.6, 0.6), smooth=True)
    nx, ny = 16, 8
    v, f = [], []
    for j in range(ny + 1):
        for i in range(nx + 1):
            x, y = -L / 2 + 0.05 + (L - 0.1) * i / nx, -W / 2 + 0.05 + (W - 0.1) * j / ny
            sag = 0.035 * math.sin(math.pi * i / nx) * math.sin(math.pi * j / ny)
            v.append((x, y, Hs - 0.01 - sag))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            f.append((a, a + 1, a + nx + 2, a + nx + 1))
    bm = K.bm_from(v + [(x, y, z - 0.012) for x, y, z in v], f + [tuple(reversed([q + len(v) for q in face])) for face in f])
    uvl = bm.loops.layers.uv.verify()
    for face in bm.faces:
        for l in face.loops:
            p = l.vert.co
            l[uvl].uv = (p.x / 0.5, p.y / 0.5)
    P.add_bm(bm, 'weave', uv=False, smooth=True)
    # 만 이불 (쪽빛 무명)
    pal_add(P, lathe_bm([(0.0, -0.4), (0.11, -0.4), (0.12, -0.36), (0.12, 0.36), (0.11, 0.4), (0.0, 0.4)], n=12), 'indigo', smooth=True,
            matrix=Tm(-L / 2 + 0.22, 0, Hs + 0.1) @ Rx(rad(90)))
    return P


def haystack_sa():
    """볏짚 가리: 가운데 장대를 둘러 쌓은 둥근 지붕꼴 (지름 ~3 m, 키 ~3.4 m), 꼭대기 짚 매듭과 장대 끝."""
    P = Piece('haystack_sa', 5005)
    seed = 7

    def bump(p):
        return 0.08 * noise3(p.x * 1.8, p.y * 1.8, p.z * 1.4, seed) + 0.03 * noise3(p.x * 5, p.y * 5, p.z * 5, seed + 3)
    prof = [(1.35, -0.1), (1.5, 0.3), (1.58, 0.8), (1.55, 1.3), (1.42, 1.8), (1.18, 2.3), (0.85, 2.72), (0.5, 3.02), (0.22, 3.2), (0.04, 3.28)]
    st = [((0, 0, z), r, r) for r, z in prof]
    bm = loft_bm(st, n=30, ref=(1, 0, 0), cap0=False, cap1=True, disp=bump)
    uvl = bm.loops.layers.uv.verify()
    for face in bm.faces:
        us = []
        for l in face.loops:
            p = l.vert.co
            a = math.atan2(p.y, p.x) / (2 * math.pi) % 1.0
            l[uvl].uv = (a * 9.6 / 1.6, p.z / 1.4)
            us.append(l[uvl].uv.x)
        if max(us) - min(us) > 3.0:
            for l in face.loops:
                if l[uvl].uv.x < 3.0:
                    l[uvl].uv.x += 9.6 / 1.6
    P.add_bm(bm, 'hay', uv=False, smooth=True)
    P.add_bm(lathe_bm([(0.2, 3.1), (0.16, 3.3), (0.06, 3.42), (0.0, 3.45)], n=10), 'hay', uv=False, smooth=True)
    P.add_bm(tube_bm([(0, 0, 3.2), (0.02, 0, 3.85)], [0.045, 0.03], n=6), 'bamboo', tile=(0.6, 0.6), smooth=True)
    return P


def sacks_sa():
    P = Piece('sacks_sa', 5006)
    for (x, y, rz, s) in ((-0.22, 0.05, 0.3, 1.0), (0.2, -0.04, 1.9, 0.95), (0.02, 0.32, 0.8, 0.88)):
        P.add_bm(KP.sack_bm(P.rng, h=0.62 * s, r=0.21 * s, lean=0.02), 'canvas_jute', tile=0.6, smooth=True, matrix=Tm(x, y, 0) @ Rz(rz))
    P.add_bm(KP.sack_bm(P.rng, h=0.6, r=0.19), 'canvas_jute', tile=0.6, smooth=True, matrix=Tm(0.05, -0.38, 0.16) @ Rz(0.2) @ Ry(rad(88)))
    return P


def basket_sa():
    """바구니 셋 (포갬·하나는 곡식) + 키 (곡식 까부는 삼각 키)."""
    P = Piece('basket_sa', 5007)

    def bask(M, r, h):
        pal_add(P, lathe_bm([(r * 0.7, 0.0), (r, h * 0.7), (r * 1.04, h), (r * 0.98, h), (r * 0.92, h * 0.7), (r * 0.66, 0.02)], n=14, cap0=True), 'wicker', matrix=M)
    bask(Tm(0, 0, 0), 0.3, 0.2)
    bask(Tm(0, 0, 0.12), 0.27, 0.18)
    pal_add(P, lathe_bm([(0.25, 0.26), (0.15, 0.32), (0.0, 0.34)], n=14), 'rice', matrix=Tm(0, 0, 0))
    bask(Tm(0.55, 0.15, 0), 0.24, 0.16)
    pal_add(P, lathe_bm([(0.21, 0.14), (0.12, 0.2), (0.0, 0.22)], n=14), 'lentil', matrix=Tm(0.55, 0.15, 0))
    # 키 (supa): 앞이 트인 삼각 접시, 벽에 기대어
    v = [(-0.22, -0.2, 0.0), (0.22, -0.2, 0.0), (0.28, 0.2, 0.06), (-0.28, 0.2, 0.06), (0.0, 0.26, 0.02)]
    M = Tm(-0.5, 0.25, 0.25) @ Rx(rad(70))
    for d in (0.0, -0.01):
        bm = K.bm_from([(x, y, z + d) for x, y, z in v], [(0, 1, 2, 3)] if d == 0 else [(3, 2, 1, 0)])
        pal_add(P, bm, 'wicker', smooth=False, matrix=M)
    for sx in (-1, 1):
        pal_add(P, tube_bm([(sx * 0.22, -0.2, 0.0), (sx * 0.28, 0.2, 0.06), (sx * 0.05, 0.24, 0.07)], 0.02, n=5), 'wicker', matrix=M)
    return P


def dung_cakes():
    """쇠똥 떡: 원뿔꼴로 둘러 쌓은 둥글넓적한 떡 더미 (땔감, 마을 어디에나)."""
    P = Piece('dung_cakes', 5008)
    rng = P.rng
    z = 0.0
    for ring in range(9):
        rr = 0.62 * (1 - ring / 10.5)
        n = max(3, int(2 * math.pi * rr / 0.17))
        for k in range(n):
            a = 2 * math.pi * k / n + ring * 0.37
            tilt = rad(62) - ring * rad(3)
            rot = (Rz(a) @ Ry(-tilt)).to_3x3()
            s = rng.uniform(0.9, 1.1)
            pal_add(P, ellipsoid_bm((rr * math.cos(a), rr * math.sin(a), z + 0.09), (0.11 * s, 0.11 * s, 0.022), nu=8, nv=3, rot=rot), 'dung')
        z += 0.115
    pal_add(P, ellipsoid_bm((0, 0, z + 0.02), (0.12, 0.12, 0.06), nu=8, nv=4), 'dung')
    return P


def chulha():
    """흙 아궁이 (U 꼴, 불구멍 앞) + 위에 얹은 흙 냄비, 옆 땔감 몇 개."""
    P = Piece('chulha', 5009)
    cuts = [box_vf(-0.13, 0.13, -0.5, 0.05, 0.0, 0.18)]
    S.wall_ok(P, [box_vf(-0.3, 0.3, -0.24, 0.24, -0.02, 0.26)], 'mud_bare', cuts, tile=1.2, bevel=0.04)
    pal_add(P, lathe_bm([(0.0, 0.0), (0.06, 0.005), (0.06, 0.05), (0.0, 0.05)], n=10), 'soot', matrix=Tm(0, 0, 0.0))
    clay_pot(P, Tm(0, 0, 0.24), 0.8, 'clay_dark')
    for k, (x, a) in enumerate(((0.38, 0.4), (0.45, 0.6), (0.33, 0.9))):
        P.add_bm(tube_bm([(x, -0.2 + 0.08 * k, 0.03), (x + 0.4 * math.cos(a), -0.2 + 0.08 * k + 0.4 * math.sin(a), 0.03)], 0.025, n=5, ref=(0, 0, 1)), 'timber_dark',
                 tile=(0.5, 0.5), smooth=True)
    return P


def loom():
    """바닥 베틀 (시대 일반형): 말뚝 넷 위 앞뒤 빔, 날실 판, 짠 천(꼭두서니 줄), 잉아 틀을 매단 삼각 버팀, 북."""
    P = Piece('loom', 5010)
    L, W = 2.4, 1.0
    for x in (-L / 2, L / 2):
        for sy in (-1, 1):
            P.add_bm(tube_bm([(x, sy * (W / 2 + 0.08), -0.2), (x, sy * (W / 2 + 0.08), 0.5)], 0.03, n=6), 'timber_dark', tile=(0.5, 0.5), smooth=True)
        P.add_bm(tube_bm([(x, -W / 2 - 0.12, 0.45), (x, W / 2 + 0.12, 0.45)], 0.04, n=8, ref=(0, 0, 1)), 'timber_dark', tile=(0.6, 0.6), smooth=True)
    # 날실 (앞 빔 → 잉아 → 뒤 빔), 짠 천 (앞 0.9 m)
    xw = -L / 2 + 0.95
    for (xa, xb, col) in ((-L / 2, xw, 'madder'), (xw, L / 2, 'cotton')):
        v = [(xa, -W / 2, 0.45), (xb, -W / 2, 0.45), (xb, W / 2, 0.45), (xa, W / 2, 0.45)]
        for d, face in ((0.002, (0, 1, 2, 3)), (-0.002, (3, 2, 1, 0))):
            pal_add(P, K.bm_from([(x, y, z + d) for x, y, z in v], [face]), col, smooth=False)
    for k in range(5):                         # 꼭두서니 천 위 쪽빛 줄
        x = -L / 2 + 0.12 + k * 0.17
        for d, face in ((0.004, (0, 1, 2, 3)), (-0.004, (3, 2, 1, 0))):
            pal_add(P, K.bm_from([(x, -W / 2, 0.45 + d), (x + 0.04, -W / 2, 0.45 + d), (x + 0.04, W / 2, 0.45 + d), (x, W / 2, 0.45 + d)], [face]), 'indigo', smooth=False)
    # 잉아 틀 + 삼각 버팀
    hx = xw + 0.25
    for sy in (-1, 1):
        P.add_bm(tube_bm([(hx - 0.5, sy * 0.75, 0.0), (hx, sy * 0.7, 1.55)], 0.025, n=6), 'bamboo', tile=(0.5, 0.5), smooth=True)
        P.add_bm(tube_bm([(hx + 0.5, sy * 0.75, 0.0), (hx, sy * 0.7, 1.55)], 0.025, n=6), 'bamboo', tile=(0.5, 0.5), smooth=True)
    P.add_bm(tube_bm([(hx, -0.75, 1.55), (hx, 0.75, 1.55)], 0.025, n=6, ref=(0, 0, 1)), 'bamboo', tile=(0.5, 0.5), smooth=True)
    for zz in (0.62, 0.95):
        P.box(hx - 0.02, hx + 0.02, -W / 2 - 0.05, W / 2 + 0.05, zz, zz + 0.03, 'timber_dark', tile=1.0)
    for sy in (-0.45, 0.45):
        pal_add(P, tube_bm([(hx, sy, 0.98), (hx, sy, 1.55)], 0.006, n=4), 'rope')
    P.add_bm(lathe_bm([(0.0, -0.15), (0.025, -0.1), (0.03, 0.0), (0.025, 0.1), (0.0, 0.15)], n=8), 'timber_dark', uv=False, smooth=True,
             matrix=Tm(xw + 0.08, 0.2, 0.49) @ Rx(rad(90)))
    return P


# ───────────────────────── 울·담 ─────────────────────────
def wall_mud():
    """흙 담 2 m 조각 (X 로 -1 … +1, 높이 ~1.25): 둥근 어깨, 위로 좁아짐, 손으로 바른 울퉁불퉁함. 양끝 단면이 같아 이어 붙는다."""
    P = Piece('wall_mud', 5101)
    Lh, nx, nz = 2.0, 10, 7
    wb, wt, H = 0.26, 0.17, 1.12

    def disp(x, z, side):
        a = math.pi * x / (Lh / 2)
        cx, sx = math.cos(a), math.sin(a)
        return 0.018 * noise3(cx * 1.2 + side * 3, sx * 1.2, z * 2.5, 51)
    v, f = [], []
    rows = [(H * j / nz, wb + (wt - wb) * (j / nz)) for j in range(nz + 1)] + [(H + 0.06, wt * 0.8), (H + 0.1, wt * 0.45)]
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
    P.add_bm(K.bm_from(v, f), 'mud_bare', tile=(1.6, 1.6), smooth=True)
    return P


def fence_bamboo():
    """대나무 울 2 m 조각 (X 로 -1 … +1): 말뚝 다섯, 쪼갠 대 가로대 셋, 사이에 엇갈린 대각 살. 이어 붙인다."""
    P = Piece('fence_bamboo', 5102)
    Lh, H = 2.0, 1.15
    for k in range(5):
        x = -Lh / 2 + 0.04 + k * (Lh - 0.08) / 4
        P.add_bm(tube_bm([(x, 0, -0.3), (x + 0.005, 0, H + 0.05 + 0.04 * math.sin(k * 2.3))], [0.03, 0.026], n=7), 'bamboo', tile=(0.6, 0.6), smooth=True)
    for z in (0.18, 0.6, 1.02):
        P.add_bm(tube_bm([(-Lh / 2, 0.035, z), (Lh / 2, 0.035, z)], 0.018, n=5, ref=(0, 0, 1)), 'bamboo', tile=(0.6, 0.6), smooth=True)
    for k in range(10):
        x0 = -Lh / 2 + k * Lh / 10
        for (za, zb_, d) in ((0.2, 1.0, 1), (0.2, 1.0, -1)):
            xa, xb = (x0, x0 + Lh / 10 * 1.6) if d > 0 else (x0 + Lh / 10 * 1.6, x0)
            xa, xb = max(-Lh / 2, min(Lh / 2, xa)), max(-Lh / 2, min(Lh / 2, xb))
            P.add_bm(tube_bm([(xa, -0.01 * d, za), (xb, -0.01 * d, zb_)], 0.01, n=4, ref=(0, 1, 0)), 'bamboo', tile=(0.5, 0.5), smooth=True)
    return P


def trough_sa():
    """흙 여물통 (큰 흙 대야 둘을 흙 단에 묻은 꼴) + 안의 물·여물."""
    P = Piece('trough_sa', 5103)
    S.wall_ok(P, [box_vf(-0.85, 0.85, -0.38, 0.38, -0.05, 0.35)], 'mud_bare', [], tile=1.2, bevel=0.06)
    for x in (-0.4, 0.4):
        pal_add(P, lathe_bm([(0.0, 0.18), (0.25, 0.2), (0.32, 0.36), (0.34, 0.4), (0.3, 0.4), (0.24, 0.24), (0.0, 0.22)], n=16), 'clay_pot', matrix=Tm(x, 0, 0))
    P.cyl(0.26, 0.26, 0.005, 'water', n=16, matrix=Tm(-0.4, 0, 0.33), smooth=False)
    pal_add(P, lathe_bm([(0.27, 0.3), (0.18, 0.36), (0.0, 0.38)], n=12), 'hay_pale', matrix=Tm(0.4, 0, 0))
    return P


# ───────────────────────── 가축 ─────────────────────────
def cow_zebu():
    """혹소 (기갑 ~1.25 m, 혹 꼭대기 ~1.42 m, 몸길이 ~1.85 m): 어깨 위 혹, 목 밑 처진 살(목살), 긴 얼굴, 아래로 늘어진 긴 귀,
    위로 휘어 오른 뿔, 기울어진 엉덩이, 가는 긴 다리, 끝이 검은 긴 꼬리."""
    P = Piece('cow_zebu', 6001)
    st = [((-0.88, 0, 1.05), 0.02, 0.02, 0.02),
          ((-0.86, 0, 1.06), 0.12, 0.05, 0.15, 0.3),
          ((-0.78, 0, 1.08), 0.19, 0.07, 0.32, 0.35),
          ((-0.64, 0, 1.1), 0.23, 0.08, 0.4, 0.38),
          ((-0.46, 0, 1.11), 0.25, 0.08, 0.42, 0.38),
          ((-0.24, 0, 1.1), 0.27, 0.08, 0.45, 0.4),
          ((0.04, 0, 1.11), 0.28, 0.09, 0.47, 0.4),
          ((0.28, 0, 1.14), 0.25, 0.1, 0.49, 0.35),
          ((0.44, 0, 1.16), 0.2, 0.1, 0.5, 0.3),
          ((0.58, 0, 1.15), 0.15, 0.1, 0.42, 0.2),
          ((0.7, 0, 1.13), 0.12, 0.1, 0.25),
          ((0.8, 0, 1.13), 0.105, 0.09, 0.12),
          ((0.86, 0, 1.14), 0.05, 0.05, 0.05)]
    P.add_bm(loft_bm(densify(st, 1), n=20, expo=2.2), 'hide', tile=(0.45, 0.45), smooth=True)
    # 혹 (어깨 위, 앞으로 조금 기움) + 목살
    P.add_bm(ellipsoid_bm((0.37, 0, 1.19), (0.19, 0.11, 0.15), nu=12, nv=7, rot=Ry(rad(-22)).to_3x3()), 'hide', tile=(0.45, 0.45), smooth=True)
    P.add_bm(ellipsoid_bm((0.76, 0, 0.84), (0.22, 0.03, 0.1), nu=12, nv=6, rot=Ry(rad(-42)).to_3x3()), 'hide', tile=(0.45, 0.45), smooth=True)
    shoulders_thighs(P, 'hide', (0.4, 0.13, 0.86, 0.15, 0.09, 0.2), (-0.6, 0.14, 0.88, 0.19, 0.1, 0.24))
    for sy in (1, -1):          # 엉덩이뼈
        P.add_bm(ellipsoid_bm((-0.58, sy * 0.15, 1.1), (0.08, 0.06, 0.05), nu=8, nv=5), 'hide', tile=(0.45, 0.45), smooth=True)
    # 머리: 긴 얼굴, 아래로 숙임
    hd = [((0.84, 0, 1.2), 0.03, 0.03), ((0.87, 0, 1.19), 0.1, 0.07, 0.09), ((0.94, 0, 1.11), 0.095, 0.06, 0.09),
          ((1.01, 0, 1.01), 0.075, 0.05, 0.075), ((1.07, 0, 0.92), 0.065, 0.05, 0.065), ((1.12, 0, 0.85), 0.07, 0.05, 0.06), ((1.14, 0, 0.82), 0.03, 0.025, 0.025)]
    P.add_bm(loft_bm(densify(hd, 1), n=12, expo=2.3), 'hide', tile=(0.45, 0.45), smooth=True)
    pal_add(P, ellipsoid_bm((1.135, 0, 0.835), (0.03, 0.065, 0.045), nu=8, nv=4), 'zebu_face')
    eye_pair(P, 0.95, 0.09, 1.12, r=0.017)
    for sy in (1, -1):
        rot = (Rz(sy * rad(75)) @ Ry(rad(58))).to_3x3()           # 아래로 늘어진 긴 귀
        P.add_bm(ellipsoid_bm((0.93, sy * 0.175, 1.06), (0.15, 0.06, 0.022), nu=8, nv=3, rot=rot), 'hide', tile=(0.45, 0.45), smooth=True)
        bm = tube_bm([(0.86, sy * 0.06, 1.24), (0.85, sy * 0.1, 1.31), (0.83, sy * 0.13, 1.4), (0.85, sy * 0.12, 1.47)], [0.028, 0.022, 0.014, 0.005], n=6, ref=(1, 0, 0))
        pal_add(P, bm, 'horn')
    bm = tube_bm([(-0.87, 0, 1.06), (-0.92, 0, 0.88), (-0.93, 0, 0.55), (-0.92, 0, 0.36)], [0.03, 0.022, 0.017, 0.015], n=6, ref=(0, 1, 0))
    P.add_bm(bm, 'hide', tile=(0.45, 0.45), smooth=True)
    pal_add(P, ellipsoid_bm((-0.92, 0, 0.3), (0.035, 0.035, 0.09), nu=6, nv=4), 'black')
    legs_pair(P, [(0.4, 0.13, 0.75), (0.41, 0.13, 0.55), (0.41, 0.13, 0.36), (0.42, 0.13, 0.1)], [0.08, 0.055, 0.04, 0.036], 'hide')
    legs_pair(P, [(-0.6, 0.14, 0.78), (-0.65, 0.14, 0.6), (-0.72, 0.14, 0.42), (-0.66, 0.14, 0.1)], [0.09, 0.065, 0.044, 0.036], 'hide')
    return P


def buffalo():
    """물소 (기갑 ~1.35 m, 몸길이 ~2.0 m): 넓고 깊은 통 몸, 거의 털 없는 검은 가죽, 앞으로 내민 머리, 뒤로 휜 초승달 뿔, 굵은 다리, 짧은 꼬리."""
    P = Piece('buffalo', 6002)
    st = [((-0.95, 0, 1.15), 0.03, 0.03, 0.03),
          ((-0.93, 0, 1.16), 0.17, 0.07, 0.2, 0.25),
          ((-0.84, 0, 1.18), 0.27, 0.08, 0.38, 0.3),
          ((-0.66, 0, 1.2), 0.33, 0.1, 0.5, 0.32),
          ((-0.4, 0, 1.2), 0.36, 0.1, 0.54, 0.32),
          ((-0.1, 0, 1.2), 0.37, 0.11, 0.56, 0.32),
          ((0.2, 0, 1.23), 0.34, 0.12, 0.56, 0.3),
          ((0.42, 0, 1.25), 0.27, 0.12, 0.5, 0.25),
          ((0.58, 0, 1.22), 0.2, 0.12, 0.36, 0.2),
          ((0.72, 0, 1.18), 0.16, 0.12, 0.22),
          ((0.82, 0, 1.15), 0.15, 0.12, 0.17),
          ((0.88, 0, 1.15), 0.06, 0.06, 0.06)]
    P.add_bm(loft_bm(densify(st, 1), n=22, expo=2.1), 'hide_dark', tile=(0.45, 0.45), smooth=True)
    shoulders_thighs(P, 'hide_dark', (0.44, 0.19, 0.86, 0.19, 0.12, 0.24), (-0.62, 0.2, 0.9, 0.24, 0.13, 0.28))
    # 머리: 이마는 넓고 얼굴은 앞으로 (거의 수평)
    hd = [((0.85, 0, 1.2), 0.04, 0.04), ((0.88, 0, 1.19), 0.13, 0.08, 0.12), ((0.97, 0, 1.13), 0.12, 0.07, 0.11),
          ((1.07, 0, 1.05), 0.095, 0.06, 0.09), ((1.16, 0, 0.98), 0.09, 0.06, 0.075), ((1.21, 0, 0.94), 0.09, 0.055, 0.06), ((1.23, 0, 0.92), 0.04, 0.03, 0.03)]
    P.add_bm(loft_bm(densify(hd, 1), n=12, expo=2.4), 'hide_dark', tile=(0.45, 0.45), smooth=True)
    pal_add(P, ellipsoid_bm((1.225, 0, 0.935), (0.035, 0.08, 0.05), nu=8, nv=4), 'soot')
    eye_pair(P, 0.98, 0.115, 1.14, r=0.017)
    for sy in (1, -1):
        rot = (Rz(sy * rad(85)) @ Ry(rad(20))).to_3x3()
        P.add_bm(ellipsoid_bm((0.88, sy * 0.17, 1.13), (0.1, 0.045, 0.02), nu=6, nv=3, rot=rot), 'hide_dark', tile=(0.45, 0.45), smooth=True)
        pts = [(0.87, sy * 0.08, 1.27), (0.84, sy * 0.24, 1.31), (0.72, sy * 0.38, 1.33), (0.56, sy * 0.41, 1.36), (0.46, sy * 0.33, 1.42)]
        bm = loft_bm([(p, r, r * 0.6) for p, r in zip(pts, (0.05, 0.045, 0.036, 0.024, 0.008))], n=7, ref=(0, 0, 1))
        pal_add(P, bm, 'buff_horn')
    bm = tube_bm([(-0.94, 0, 1.12), (-0.98, 0, 0.92), (-0.98, 0, 0.7)], [0.035, 0.025, 0.02], n=6, ref=(0, 1, 0))
    P.add_bm(bm, 'hide_dark', tile=(0.45, 0.45), smooth=True)
    pal_add(P, ellipsoid_bm((-0.98, 0, 0.65), (0.03, 0.03, 0.07), nu=6, nv=4), 'black')
    legs_pair(P, [(0.44, 0.19, 0.72), (0.45, 0.19, 0.52), (0.45, 0.19, 0.32), (0.46, 0.19, 0.1)], [0.11, 0.075, 0.055, 0.05], 'hide_dark', hoof_r=0.065)
    legs_pair(P, [(-0.62, 0.2, 0.75), (-0.66, 0.2, 0.58), (-0.74, 0.2, 0.4), (-0.68, 0.2, 0.1)], [0.12, 0.085, 0.06, 0.05], 'hide_dark', hoof_r=0.065)
    return P


def goat():
    """염소 (기갑 ~0.66 m, 몸길이 ~0.9 m): 늘어진 긴 귀, 뒤로 짧게 휜 뿔, 로마 코, 턱수염, 위로 선 짧은 꼬리."""
    P = Piece('goat', 6003)
    st = [((-0.4, 0, 0.6), 0.02, 0.02, 0.02),
          ((-0.38, 0, 0.6), 0.1, 0.05, 0.11, 0.25),
          ((-0.3, 0, 0.6), 0.14, 0.06, 0.18, 0.3),
          ((-0.12, 0, 0.6), 0.155, 0.06, 0.21, 0.3),
          ((0.08, 0, 0.61), 0.15, 0.06, 0.22, 0.3),
          ((0.22, 0, 0.62), 0.12, 0.06, 0.2, 0.25),
          ((0.3, 0, 0.66), 0.08, 0.06, 0.12),
          ((0.36, 0, 0.74), 0.06, 0.05, 0.06),
          ((0.39, 0, 0.8), 0.04, 0.04, 0.04)]
    P.add_bm(loft_bm(densify(st, 1), n=14, expo=2.2), 'hide_goat', tile=(0.3, 0.3), smooth=True)
    shoulders_thighs(P, 'hide_goat', (0.2, 0.065, 0.48, 0.07, 0.045, 0.1), (-0.28, 0.07, 0.5, 0.09, 0.05, 0.12))
    hd = [((0.37, 0, 0.84), 0.02, 0.02), ((0.39, 0, 0.84), 0.05, 0.05, 0.05), ((0.45, 0, 0.8), 0.045, 0.045, 0.045),
          ((0.51, 0, 0.73), 0.033, 0.035, 0.03), ((0.54, 0, 0.69), 0.025, 0.026, 0.022), ((0.55, 0, 0.675), 0.01, 0.01)]
    P.add_bm(loft_bm(densify(hd, 1), n=10), 'hide_goat', tile=(0.3, 0.3), smooth=True)
    eye_pair(P, 0.45, 0.042, 0.82, r=0.008)
    pal_add(P, tube_bm([(0.5, 0, 0.7), (0.5, 0, 0.62), (0.49, 0, 0.58)], [0.012, 0.01, 0.003], n=5), 'dark_brown')
    for sy in (1, -1):
        rot = (Rz(sy * rad(80)) @ Ry(rad(62))).to_3x3()
        P.add_bm(ellipsoid_bm((0.42, sy * 0.085, 0.77), (0.11, 0.042, 0.012), nu=6, nv=3, rot=rot), 'hide_goat', tile=(0.3, 0.3), smooth=True)
        pal_add(P, tube_bm([(0.4, sy * 0.025, 0.88), (0.37, sy * 0.035, 0.94), (0.31, sy * 0.045, 0.97)], [0.012, 0.009, 0.003], n=5, ref=(0, 1, 0)), 'horn')
    pal_add(P, tube_bm([(-0.38, 0, 0.66), (-0.42, 0, 0.73), (-0.43, 0, 0.77)], [0.02, 0.015, 0.006], n=5, ref=(0, 1, 0)), 'dark_brown')
    legs_pair(P, [(0.2, 0.07, 0.45), (0.21, 0.07, 0.3), (0.21, 0.07, 0.16), (0.22, 0.07, 0.04)], [0.035, 0.022, 0.016, 0.015], 'hide_goat')
    legs_pair(P, [(-0.28, 0.075, 0.47), (-0.31, 0.075, 0.33), (-0.35, 0.075, 0.2), (-0.32, 0.075, 0.04)], [0.04, 0.025, 0.017, 0.015], 'hide_goat')
    return P


def chicken():
    """닭 (토종닭, 키 ~0.4 m): 밤색 몸, 검은 꽁지, 붉은 볏·고기수염, 노란 발."""
    P = Piece('chicken', 6004)
    st = [((-0.15, 0, 0.22), 0.02, 0.02), ((-0.12, 0, 0.22), 0.07, 0.06, 0.06), ((-0.05, 0, 0.21), 0.095, 0.08, 0.1),
          ((0.03, 0, 0.21), 0.09, 0.085, 0.095), ((0.09, 0, 0.24), 0.06, 0.07, 0.06), ((0.11, 0, 0.28), 0.04, 0.04, 0.04),
          ((0.125, 0, 0.33), 0.032, 0.032, 0.032), ((0.135, 0, 0.36), 0.03, 0.03, 0.03), ((0.14, 0, 0.38), 0.01, 0.01, 0.01)]
    pal_add(P, loft_bm(st, n=10), 'hen')
    pal_add(P, loft_bm([((-0.1, 0, 0.25), 0.03, 0.04), ((-0.16, 0, 0.31), 0.025, 0.07), ((-0.2, 0, 0.37), 0.012, 0.05), ((-0.21, 0, 0.4), 0.004, 0.012)], n=6), 'hen_dark')
    pal_add(P, loft_bm([((0.12, 0, 0.385), 0.006, 0.01), ((0.14, 0, 0.398), 0.008, 0.024), ((0.16, 0, 0.388), 0.006, 0.013), ((0.17, 0, 0.372), 0.003, 0.004)], n=5), 'comb_red')
    pal_add(P, loft_bm([((0.15, 0, 0.355), 0.01, 0.008), ((0.18, 0, 0.35), 0.002, 0.002)], n=5), 'beak')
    pal_add(P, ellipsoid_bm((0.15, 0, 0.33), (0.01, 0.006, 0.016), nu=5, nv=3), 'comb_red')
    for sy in (1, -1):
        pal_add(P, tube_bm([(0.0, sy * 0.035, 0.14), (0.01, sy * 0.035, 0.0)], 0.007, n=4, ref=(1, 0, 0)), 'beak')
        for a in (-0.5, 0.0, 0.5):
            pal_add(P, tube_bm([(0.01, sy * 0.035, 0.005), (0.01 + 0.04 * math.cos(a), sy * 0.035 + 0.04 * math.sin(a), 0.003)], 0.004, n=3, ref=(0, 0, 1)), 'beak')
    eye_pair(P, 0.14, 0.022, 0.37, r=0.006)
    return P


BUILDERS = [cart_bullock, water_pot, lota, charpai, haystack_sa, sacks_sa, basket_sa, dung_cakes, chulha, loom, wall_mud, fence_bamboo, trough_sa,
            cow_zebu, buffalo, goat, chicken]


def foot_dims(root, foot):
    me_obj = [c for c in root.children if c.type == 'MESH'][0]
    return (foot[1] - foot[0], foot[3] - foot[2], max(v.co.z for v in me_obj.data.vertices))


def build(only=None):
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
    return roots, dims


def main():
    t0 = time.time()
    K.reset_scene()
    setup_materials()
    only = [s for s in os.environ.get('KIT_ONLY', '').split(',') if s]
    roots, dims = build(only)
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
            json.dump({'source': 'tools/blender/kit_props_southasia.py', 'units': 'm, [x 길이, 앞뒤 깊이, 높이]',
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
    K.setup_preview(sun_elev=30, sun_az=140, grass=os.path.join(K.TEX, 'brown_mud_dry_diff_1k.jpg'))
    S.preview_ground((1.0, 0.9, 0.72))
    by = {r.name: r for r in roots}
    LAYOUT = {
        'cart_bullock': (-3.0, -1.6, 0.35), 'water_pot': (1.2, 1.7, 0), 'lota': (1.75, 1.3, 0), 'charpai': (3.4, 0.6, -0.25), 'haystack_sa': (-9.0, 4.5, 0),
        'sacks_sa': (-4.9, 1.9, 0.2), 'basket_sa': (0.3, 2.2, 0.0), 'dung_cakes': (-6.8, 3.6, 0), 'chulha': (2.2, 2.6, 0.3), 'loom': (6.6, 2.6, 0.0),
        'wall_mud': (-0.9, 3.6, 0.0), 'fence_bamboo': (-3.0, 3.6, 0.0), 'trough_sa': (-6.2, -1.0, 0.1),
        'cow_zebu': (-7.6, -2.6, 0.5), 'buffalo': (-10.6, -1.0, -0.3), 'goat': (-4.6, -3.6, 1.1), 'chicken': (0.9, -1.2, 2.0),
    }
    for n, (x, y, rz) in LAYOUT.items():
        if n in by:
            by[n].location = (x, y, 0)
            by[n].rotation_euler = (0, 0, rz)
    shots = [
        ('southasia_props_overview', (-2, -15, 6.5), (-2.5, 1.0, 0.6), 30),
        ('southasia_animals', (-6.0, -8.2, 1.5), (-8.0, -1.8, 0.75), 38),
        ('southasia_props_yard', (2.5, -3.6, 1.6), (1.5, 1.8, 0.5), 34),
    ]
    for name, pos, tgt, lens in shots:
        cam = K.camera_look(name, pos, tgt, lens)
        K.render_to(cam, os.path.join(K.PREVIEW, name + '.png'))
    if os.environ.get('KIT_CLOSEUPS') == '1':        # 손질용: 가축 하나씩 옆 3/4 (배포 미리보기 아님 → 임시 폴더)
        for n in ('cow_zebu', 'buffalo', 'goat', 'chicken', 'cart_bullock'):
            if n not in by:
                continue
            r = by[n]
            x, y = r.location.x, r.location.y
            d = max(1.2, foot_dims(r, [0, 2.2, 0, 0])[2] * 2.6) if n != 'cart_bullock' else 6.5
            cam = K.camera_look('cu_' + n, (x + d * 0.55, y - d, max(0.6, d * 0.32)), (x, y, d * 0.22), 40)
            K.render_to(cam, os.path.join(K.BUILD, 'closeup_%s.png' % n))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)
