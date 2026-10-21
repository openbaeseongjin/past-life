# 중세 잉글랜드 마을 소품·가축 세트 (1329년 무렵) — Blender 4.2 명령줄 스크립트. kit_common.py 를 함께 쓴다.
#   GLTFT=<gltf-transform 폴더> "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe" --background --python tools/blender/kit_props.py
#   (GLTFT 가 없으면 docs/past-life/tools/node_modules 를 본다 — kit_common.py 머리말)
# 결과: docs/past-life/assets/real/kits/props_england.glb (meshopt + WebP), kits/props_england.dims.json, kits/preview/props_*.png
# 노드:
#   운반·저장 cart, barrel, crate, woodpile, haystack, sacks / 울타리·담 wattle_fence, stone_wall(2 m, 이어 붙임), rail_fence(2.5 m, 덤)
#   일터 trough, anvil, tool_rack / 장터 market_goods, cloth_awning / 마당 bench, flower_patch, vegetable_bed
#   가축 sheep, cow, horse, chicken, duck (머리 = +X, 오리는 원점이 물높이)
# 좌표: 조각마다 바닥 가운데가 원점, 미터. 긴 축 = X, 앞 = glTF +Z (Blender -Y). 울타리·담은 X 로 -L/2 … +L/2.
# 작은 색 부품(꽃·채소·뿔·부리 …)은 'palette' 재료 하나(64² 색표, 칸 가운데 UV)로 모아 그리기 수를 줄인다.
# 환경변수: KIT_FAST=1 (굽기·렌더 표본 적게), KIT_ONLY=sheep,cow (일부만, 미리보기만; KIT_EXPORT=1 이면 임시 폴더에 _partial.glb), KIT_NOPREVIEW=1,
#   KIT_DEBUGHASH=1 (조각마다 정점·UV 해시를 로그에: 다시 돌려 같은지 볼 때)
import os, sys, math, time, json
sys.dont_write_bytecode = True          # tools/blender 에 __pycache__ 를 남기지 않는다
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
import numpy as np
from mathutils import Vector, Matrix
import kit_common as K
from kit_common import Piece, box_vf, prism_vf, temp_obj, log

rad = math.radians
NAME = 'props_england'


# ───────────────────────── 색표 (palette) ─────────────────────────
PAL = [
    'leaf_dark', 'leaf', 'leaf_light', 'cabbage', 'flower_white', 'flower_yellow', 'flower_pink', 'flower_purple',
    'flower_red', 'flower_blue', 'apple_red', 'apple_green', 'bread', 'onion', 'carrot', 'clay',
    'black', 'dark_brown', 'horn', 'nose_pink', 'comb_red', 'beak', 'hen', 'hen_dark',
    'duck_white', 'duck_bill', 'sheep_face', 'sheep_leg', 'straw', 'wicker', 'cloth_blue', 'cloth_red',
    'cloth_green', 'cloth_undyed', 'cheese', 'egg', 'stem', 'leek', 'bean', 'hoof',
    'rope', 'blade', 'pot_dark', 'flower_orange', 'leaf_grey', 'udder', 'eye', 'mane',
]
PAL_RGB = {   # sRGB 0~1
    'leaf_dark': (0.17, 0.26, 0.09), 'leaf': (0.27, 0.38, 0.13), 'leaf_light': (0.46, 0.56, 0.22), 'cabbage': (0.47, 0.6, 0.38),
    'flower_white': (0.93, 0.91, 0.84), 'flower_yellow': (0.95, 0.78, 0.16), 'flower_pink': (0.89, 0.48, 0.6), 'flower_purple': (0.52, 0.36, 0.72),
    'flower_red': (0.76, 0.12, 0.1), 'flower_blue': (0.38, 0.48, 0.82), 'apple_red': (0.62, 0.12, 0.07), 'apple_green': (0.58, 0.64, 0.2),
    'bread': (0.64, 0.42, 0.19), 'onion': (0.77, 0.6, 0.38), 'carrot': (0.86, 0.43, 0.1), 'clay': (0.56, 0.31, 0.18),
    'black': (0.05, 0.045, 0.04), 'dark_brown': (0.14, 0.08, 0.045), 'horn': (0.78, 0.72, 0.6), 'nose_pink': (0.58, 0.4, 0.38),
    'comb_red': (0.72, 0.09, 0.07), 'beak': (0.87, 0.6, 0.18), 'hen': (0.5, 0.24, 0.1), 'hen_dark': (0.16, 0.11, 0.07),
    'duck_white': (0.9, 0.89, 0.85), 'duck_bill': (0.9, 0.55, 0.14), 'sheep_face': (0.3, 0.255, 0.215), 'sheep_leg': (0.19, 0.16, 0.14),
    'straw': (0.76, 0.63, 0.34), 'wicker': (0.52, 0.38, 0.21), 'cloth_blue': (0.23, 0.31, 0.5), 'cloth_red': (0.56, 0.16, 0.1),
    'cloth_green': (0.27, 0.4, 0.22), 'cloth_undyed': (0.76, 0.71, 0.6), 'cheese': (0.86, 0.71, 0.32), 'egg': (0.86, 0.79, 0.66),
    'stem': (0.33, 0.42, 0.16), 'leek': (0.55, 0.68, 0.42), 'bean': (0.3, 0.45, 0.16), 'hoof': (0.12, 0.1, 0.08),
    'rope': (0.6, 0.5, 0.33), 'blade': (0.32, 0.32, 0.33), 'pot_dark': (0.25, 0.17, 0.12), 'flower_orange': (0.92, 0.5, 0.12),
    'leaf_grey': (0.38, 0.45, 0.32), 'udder': (0.72, 0.52, 0.48), 'eye': (0.03, 0.025, 0.02), 'mane': (0.08, 0.055, 0.04),
}
PAL_CELLS = 8
PAL_PX = 8


def gen_palette():
    n = PAL_CELLS * PAL_PX
    a = np.ones((n, n, 4), np.float32)
    for i, name in enumerate(PAL):
        cx, cy = i % PAL_CELLS, i // PAL_CELLS
        a[cy * PAL_PX:(cy + 1) * PAL_PX, cx * PAL_PX:(cx + 1) * PAL_PX, :3] = PAL_RGB[name]
    path = os.path.join(K.BUILD, 'props_palette.png')
    K._save_np(a, path)
    return path


def pal_uv(name):
    i = PAL.index(name)
    return ((i % PAL_CELLS + 0.5) / PAL_CELLS, (i // PAL_CELLS + 0.5) / PAL_CELLS)


def pal_set(bm, name):
    uvl = bm.loops.layers.uv.verify()
    uv = pal_uv(name)
    for f in bm.faces:
        for l in f.loops:
            l[uvl].uv = uv
    return bm


# ───────────────────────── 만든 텍스처 (numpy, 이 저장소 것) ─────────────────────────
def gen_end_grain():
    """통나무 자른 면: 나이테 + 갈라짐 + 바깥 껍질 띠 (원판 하나가 그림 한 장)."""
    N = 256
    rs = np.random.RandomState(7)
    y, x = np.mgrid[0:N, 0:N].astype(np.float32) / N - 0.5
    r = np.sqrt(x * x + y * y) * 2.0
    ang = np.arctan2(y, x)
    wob = 0.03 * np.sin(ang * 3 + 1.3) + 0.02 * np.sin(ang * 7 + 0.4)
    ring = 0.5 + 0.5 * np.sin((r + wob) * 2 * math.pi * 11)
    light = np.array([0.78, 0.63, 0.43], np.float32)
    dark = np.array([0.6, 0.45, 0.29], np.float32)
    col = light[None, None] * (1 - ring[..., None] ** 3 * 0.6) + dark[None, None] * (ring[..., None] ** 3 * 0.6)
    col *= (0.82 + 0.18 * (1 - r))[..., None].clip(0.7, 1.0)
    for k in range(5):                                  # 갈라짐
        a0 = rs.uniform(0, 2 * math.pi)
        d = np.abs(np.angle(np.exp(1j * (ang - a0))))
        crack = (d < 0.02 + 0.01 * r) & (r > 0.12) & (r < 0.75 + 0.2 * rs.rand())
        col[crack] *= 0.55
    bark = r > 0.9
    col[bark] = np.array([0.24, 0.18, 0.13], np.float32)
    col += rs.normal(0, 0.012, col.shape).astype(np.float32)
    a = np.concatenate([col, np.ones_like(col[..., :1])], -1)
    path = os.path.join(K.BUILD, 'props_endgrain.png')
    K._save_np(a, path)
    return path


def gen_hide_normal():
    """짧은 털 가죽 노멀: 한 방향으로 늘인 잡음 (이어 붙는 512²)."""
    N = 512
    rs = np.random.RandomState(11)
    h = rs.normal(0, 1, (N, N)).astype(np.float32)
    for _ in range(3):                                  # 세로(털 방향)로 길게 흐림, 감기 경계 이음
        h = sum(np.roll(h, k, axis=0) for k in range(-5, 6)) / 11.0
    h = (h + np.roll(h, 1, axis=1)) / 2
    big = rs.normal(0, 1, (N // 16, N // 16)).astype(np.float32)
    big = np.kron(big, np.ones((16, 16), np.float32))
    for _ in range(2):
        big = sum(np.roll(np.roll(big, i, 0), j, 1) for i in (-8, 0, 8) for j in (-8, 0, 8)) / 9.0
    h = h * 1.0 + big * 0.6
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * 0.5
    gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * 0.5
    s = 1.2
    n = np.stack([-gx * s, -gy * s, np.ones_like(h)], -1)
    n /= np.linalg.norm(n, axis=-1, keepdims=True)
    a = np.concatenate([n * 0.5 + 0.5, np.ones_like(h[..., None])], -1)
    path = os.path.join(K.BUILD, 'props_hide_n.png')
    K._save_np(a, path)
    return path


# ───────────────────────── 재료 ─────────────────────────
def setup_materials():
    T, X = K.prep_texture, lambda f: os.path.join(K.TEX, f)
    mk = K.make_material
    mk('planks', T('planks_d', 'old_planks_02_diff_1k.jpg', tint=(0.95, 0.86, 0.74), gain=1.0),
       X('old_planks_02_nor_gl_1k.jpg'), rough=0.85, nstr=1.0)
    mk('timber_dark', T('timber_dark_d', 'rough_wood_diff_1k.jpg', tint=(0.78, 0.64, 0.52), gain=0.62, sat=0.8, contrast=1.15),
       X('rough_wood_nor_gl_1k.jpg'), rough=0.85, nstr=1.0)
    mk('bark', T('bark_d', 'bark_brown_02_diff_1k.jpg', tint=(0.95, 0.9, 0.84), gain=0.78, sat=0.55),
       X('bark_brown_02_nor_gl_1k.jpg'), rough=0.95, nstr=1.2)
    mk('wood_end', gen_end_grain(), None, rough=0.9)
    mk('hay', T('hay_d', 'reed_roof_04_diff_1k.jpg', tint=(1.16, 1.0, 0.6), gain=1.08, sat=0.95, tile_v=(0.075, 0.12)),
       T('thatch_n', 'reed_roof_04_nor_gl_1k.jpg', tile_v=(0.075, 0.12), normal=True), rough=1.0, nstr=1.6)
    mk('thatch', T('thatch_d', 'reed_roof_04_diff_1k.jpg', tint=(0.96, 0.86, 0.68), gain=0.86, sat=0.9, tile_v=(0.075, 0.12)),
       T('thatch_n', 'reed_roof_04_nor_gl_1k.jpg', tile_v=(0.075, 0.12), normal=True), rough=0.97, nstr=1.4)
    mk('stone_dry', T('stone_dry_d', 'stacked_stone_wall_diff_1k.jpg', tint=(1.0, 0.98, 0.9), gain=1.18, sat=0.3, contrast=1.05),
       X('stacked_stone_wall_nor_gl_1k.jpg'), rough=0.92, nstr=1.4)
    mk('canvas', T('canvas_d', 'rough_linen_diff_1k.jpg', stripes=(4, (0.8, 0.74, 0.6), (0.5, 0.17, 0.1))),
       X('rough_linen_nor_gl_1k.jpg'), rough=0.95, nstr=0.6, double=True)
    mk('canvas_b', T('canvas_b_d', 'rough_linen_diff_1k.jpg', stripes=(5, (0.8, 0.75, 0.62), (0.22, 0.3, 0.44))),
       X('rough_linen_nor_gl_1k.jpg'), rough=0.95, nstr=0.6, double=True)
    mk('linen', T('linen_d', 'rough_linen_diff_1k.jpg', tint=(0.82, 0.66, 0.46), gain=0.85, sat=0.8),
       X('rough_linen_nor_gl_1k.jpg'), rough=0.95, nstr=1.2)
    mk('soil', T('soil_d', 'farm_soil_diff_1k.jpg', gain=0.9), X('farm_soil_nor_gl_1k.jpg'), rough=0.95, nstr=1.0)
    mk('iron', color=(0.05, 0.048, 0.045), rough=0.55, metal=0.7)
    mk('water', color=(0.02, 0.03, 0.03), rough=0.08)
    pm = mk('palette', gen_palette(), None, rough=0.8)
    pm.node_tree.nodes['BASE'].interpolation = 'Closest'
    # 가축: 색은 재료 색(장면에서 마리마다 곱해 변주), 결은 노멀
    mk('fleece', None, X('wool_boucle_nor_gl_1k.jpg'), rough=1.0, nstr=1.8, color=(0.56, 0.52, 0.43))
    mk('down', None, None, rough=0.85, color=(0.84, 0.83, 0.78))      # 오리 깃털 (장면에서 마리마다 흰색·갈색으로 곱한다)
    mk('hide', None, gen_hide_normal(), rough=0.72, nstr=0.5, color=(0.13, 0.068, 0.036))


# ───────────────────────── 모양 도구 ─────────────────────────
def lathe_bm(prof, n=16, cap0=False, cap1=False, tile=1.0):
    """(r, z) 단면을 Z 축으로 돌린 면. UV: u = 둘레 거리, v = 단면 따라 거리 (미터 / tile)."""
    v, f = [], []
    for (r, z) in prof:
        for k in range(n):
            a = 2 * math.pi * k / n
            v.append((r * math.cos(a), r * math.sin(a), z))
    for i in range(len(prof) - 1):
        for k in range(n):
            k1 = (k + 1) % n
            f.append((i * n + k, i * n + k1, (i + 1) * n + k1, (i + 1) * n + k))
    if cap0:
        f.append(tuple(range(n - 1, -1, -1)))
    if cap1:
        b = (len(prof) - 1) * n
        f.append(tuple(b + k for k in range(n)))
    bm = K.bm_from(v, f)
    uvl = bm.loops.layers.uv.verify()
    rmax = max(r for r, z in prof) or 0.01
    circ = 2 * math.pi * rmax
    sdist = [0.0]
    for i in range(1, len(prof)):
        sdist.append(sdist[-1] + math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]))
    for face in bm.faces:
        us = []
        for l in face.loops:
            p = l.vert.co
            a = math.atan2(p.y, p.x) / (2 * math.pi) % 1.0
            i = l.vert.index // n
            l[uvl].uv = (a * circ / tile, sdist[min(i, len(sdist) - 1)] / tile)
            us.append(l[uvl].uv.x)
        if max(us) - min(us) > circ / tile * 0.5:
            for l in face.loops:
                if l[uvl].uv.x < circ / tile * 0.5:
                    l[uvl].uv.x += circ / tile
    return bm


def loft_bm(st, n=10, expo=2.0, ref=(0, 1, 0), cap0=True, cap1=True, disp=None):
    """단면 고리를 줄지어 이은 몸통. st = [(중심, 반폭, 위 반높이[, 아래 반높이[, 위 좁힘 0~1]])].
    고리 축: 옆 = ref 를 진행 방향에 수직으로 옮겨 이어감(평행 이동), 위 = 진행 × 옆. expo 2 = 타원, 크면 각진 단면."""
    cs = [Vector(s[0]) for s in st]
    m = len(cs)
    ts = []
    for i in range(m):
        a, b = cs[max(i - 1, 0)], cs[min(i + 1, m - 1)]
        ts.append((b - a).normalized())
    s = Vector(ref)
    v = []
    ex = 2.0 / expo
    for i in range(m):
        t = ts[i]
        s = s - t * s.dot(t)
        if s.length < 1e-6:
            s = Vector((0, 0, 1)) - t * t.z
        s.normalize()
        u = t.cross(s).normalized()
        c, hw, ht = cs[i], st[i][1], st[i][2]
        hb = st[i][3] if len(st[i]) > 3 else ht
        pear = st[i][4] if len(st[i]) > 4 else 0.0      # 위쪽을 좁힌다 (등뼈 능선·배가 처진 단면)
        for k in range(n):
            a = 2 * math.pi * k / n
            ca, sa = math.cos(a), math.sin(a)
            x = math.copysign(abs(ca) ** ex, ca)
            y = math.copysign(abs(sa) ** ex, sa)
            if y > 0:
                x *= 1.0 - pear * y
            p = c + s * (hw * x) + u * ((ht if y >= 0 else hb) * y)
            if disp is not None:
                d = p - c
                if d.length > 1e-6:
                    p = p + d.normalized() * disp(p)
            v.append(tuple(p))
    f = []
    for i in range(m - 1):
        for k in range(n):
            k1 = (k + 1) % n
            f.append((i * n + k, i * n + k1, (i + 1) * n + k1, (i + 1) * n + k))
    if cap0:
        f.append(tuple(range(n - 1, -1, -1)))
    if cap1:
        b = (m - 1) * n
        f.append(tuple(b + k for k in range(n)))
    # 감김은 만들 때부터 바깥 (옆 × 위 = 진행 방향이라 고리 면 법선이 바깥, 뚜껑은 앞뒤로).
    # bmesh recalc_face_normals 는 쓰지 않는다: 돌릴 때마다 일부 면의 고리 시작점이 달라져 UV 순서가 바뀌었다 (바이트 동일이 깨짐)
    return K.bm_from(v, f)


def outward(bm):
    """볼록한 덩어리의 면을 모두 바깥으로: 가운데에서 면 가운데로 가는 쪽과 법선이 반대인 면만 뒤집는다.
    (bmesh recalc_face_normals 는 돌릴 때마다 고리 시작점이 달라질 수 있어 쓰지 않는다)"""
    bm.normal_update()
    c = Vector((0, 0, 0))
    for v in bm.verts:
        c += v.co
    c /= max(1, len(bm.verts))
    flip = [f for f in bm.faces if f.normal.dot(f.calc_center_median() - c) < 0]
    if flip:
        bmesh.ops.reverse_faces(bm, faces=flip)
    bm.normal_update()
    return bm


def tube_bm(pts, radii, n=6, ref=(0, 1, 0), cap0=True, cap1=True):
    if not isinstance(radii, (list, tuple)):
        radii = [radii] * len(pts)
    return loft_bm([(p, r, r) for p, r in zip(pts, radii)], n=n, ref=ref, cap0=cap0, cap1=cap1)


def ellipsoid_bm(c, r, nu=10, nv=6, rot=None):
    """UV 구를 반지름 (rx, ry, rz) 로 늘인 것. rot = 3×3 회전(Matrix) 또는 None."""
    # bmesh.ops.create_uvsphere 는 돌릴 때마다 면 순서가 달라질 때가 있어(극점 이음 처리) 직접 짓는다: 극점 둘 + 고리 nv-1 개
    v = [(0.0, 0.0, -1.0)]
    for j in range(1, nv):
        ph = -math.pi / 2 + math.pi * j / nv
        for i in range(nu):
            th = 2 * math.pi * i / nu
            v.append((math.cos(ph) * math.cos(th), math.cos(ph) * math.sin(th), math.sin(ph)))
    v.append((0.0, 0.0, 1.0))
    top, f = len(v) - 1, []
    for i in range(nu):
        i1 = (i + 1) % nu
        f.append((0, 1 + i1, 1 + i))
        for j in range(nv - 2):
            a0, b0 = 1 + j * nu, 1 + (j + 1) * nu
            f.append((a0 + i, a0 + i1, b0 + i1, b0 + i))
        c0 = 1 + (nv - 2) * nu
        f.append((c0 + i, c0 + i1, top))
    bm = K.bm_from(v, f)
    M = Matrix.Diagonal((r[0], r[1], r[2], 1.0))
    if rot is not None:
        M = rot.to_4x4() @ M
    M = Matrix.Translation(c) @ M
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts)
    return bm


def pal_add(P, bm, color, smooth=True, matrix=None):
    pal_set(bm, color)
    P.add_bm(bm, 'palette', uv=False, smooth=smooth, matrix=matrix)


def noise3(x, y, z, s=0):
    """결정적 3D 값 잡음 (-1~1): 2D 잡음 두 장을 섞는다."""
    return 0.6 * K.vnoise(x + 31.7 * z, y - 17.3 * z, s) + 0.4 * K.vnoise(y + 11.1 * z, z * 1.7 - x, s + 3)


def Rz(a):
    return Matrix.Rotation(a, 4, 'Z')


def Ry(a):
    return Matrix.Rotation(a, 4, 'Y')


def Rx(a):
    return Matrix.Rotation(a, 4, 'X')


def T(x, y, z):
    return Matrix.Translation((x, y, z))


# ───────────────────────── 운반·저장 ─────────────────────────
def barrel_parts(P, M=None, h=0.86, r=0.29, bulge=0.045):
    M = M or Matrix.Identity(4)
    prof = []
    for k in range(9):
        t = k / 8
        prof.append((r + bulge * math.sin(math.pi * t), h * t))
    bm = lathe_bm(prof, n=18, tile=0.9)
    P.add_bm(bm, 'planks', uv=False, smooth=True, matrix=M)
    for t in (0.07, 0.25, 0.75, 0.93):
        rr = r + bulge * math.sin(math.pi * t) + 0.006
        bm = lathe_bm([(rr, h * t - 0.022), (rr, h * t + 0.022)], n=18, tile=0.5)
        P.add_bm(bm, 'iron', uv=False, smooth=True, matrix=M)
    lid = lathe_bm([(r - 0.012, h - 0.035), (r - 0.012, h - 0.034)], n=18, cap1=True, tile=0.6)
    P.add_bm(lid, 'planks', uv=False, smooth=False, matrix=M)


def barrel():
    P = Piece('barrel', 3001)
    barrel_parts(P)
    return P


def crate_parts(P, M, w=0.72, d=0.5, h=0.46, rng=None):
    sl = 0.022
    P.box(-w / 2, w / 2, -d / 2, d / 2, 0.0, 0.03, 'planks', tile=1.0, bevel=0.004, matrix=M)
    nb = 3
    for side in (-1, 1):
        for k in range(nb):
            z0 = 0.04 + k * (h - 0.04) / nb
            P.box(-w / 2, w / 2, side * d / 2 - sl / 2, side * d / 2 + sl / 2, z0, z0 + (h - 0.04) / nb - 0.03, 'planks', tile=1.0, bevel=0.004, matrix=M)
            P.box(side * w / 2 - sl / 2, side * w / 2 + sl / 2, -d / 2, d / 2, z0, z0 + (h - 0.04) / nb - 0.03, 'planks', tile=1.0, bevel=0.004, matrix=M)
    for sx in (-1, 1):
        for sy in (-1, 1):
            P.box(sx * w / 2 - sx * 0.05, sx * w / 2 + sx * 0.012, sy * d / 2 - sy * 0.05, sy * d / 2 + sy * 0.012, 0.0, h,
                  'timber_dark', tile=1.0, bevel=0.004, matrix=M)


def crate():
    P = Piece('crate', 3002)
    crate_parts(P, Matrix.Identity(4))
    # 위에 양배추 셋 (장터·마당 어디에 놓아도 사는 물건처럼)
    for (x, y) in ((-0.15, -0.06), (0.14, 0.05), (0.0, 0.1)):
        cabbage(P, T(x, y, 0.38), 0.1)
    return P


def sack_bm(rng, h=0.66, r=0.21, lean=0.0):
    """곡식 자루: 아래가 퍼져 주저앉은 둥근 몸, 위는 짧게 모아 묶은 술."""
    prof = [(0.0, 0.8), (0.04, 0.96), (0.15, 1.05), (0.35, 1.07), (0.55, 1.03), (0.72, 0.9), (0.84, 0.66), (0.9, 0.4), (0.93, 0.2)]
    st = []
    for t, k in prof:
        st.append(((lean * t * t, 0, h * t), r * k * (1 + 0.05 * rng.uniform(-1, 1)), r * k * 0.8))
    st += [((lean, 0, h * 0.97), r * 0.17, r * 0.15), ((lean * 1.05, 0, h * 1.04), r * 0.3, r * 0.25),
           ((lean * 1.05, 0, h * 1.09), r * 0.22, r * 0.18), ((lean * 1.05, 0, h * 1.1), 0.01, 0.01)]
    seed = rng.randint(0, 999)
    return loft_bm(st, n=14, expo=2.6, ref=(1, 0, 0), disp=lambda p: 0.012 * noise3(p.x * 9, p.y * 9, p.z * 9, seed))


def sacks():
    P = Piece('sacks', 3003)
    for (x, y, rz, lean, s) in ((-0.22, 0.05, 0.3, 0.03, 1.0), (0.2, -0.04, 1.9, -0.04, 0.95), (0.02, 0.32, 0.8, 0.06, 0.88)):
        bm = sack_bm(P.rng, h=0.62 * s, r=0.21 * s, lean=lean)
        P.add_bm(bm, 'linen', tile=0.6, smooth=True, matrix=T(x, y, 0) @ Rz(rz))
    # 눕힌 자루 하나
    bm = sack_bm(P.rng, h=0.6, r=0.19)
    P.add_bm(bm, 'linen', tile=0.6, smooth=True, matrix=T(0.05, -0.38, 0.16) @ Rz(0.2) @ Ry(rad(88)))
    return P


def woodpile():
    """쪼갠 장작 더미(받침 통나무 위, 양끝 말뚝) + 도끼 꽂힌 그루터기."""
    P = Piece('woodpile', 3004)
    Lx, Dy = 2.1, 0.62
    for yy in (-0.2, 0.2):     # 받침
        bm = tube_bm([(-Lx / 2 - 0.05, yy, 0.06), (Lx / 2 + 0.05, yy, 0.06)], 0.06, n=7, ref=(0, 0, 1))
        P.add_bm(bm, 'bark', tile=(0.8, 0.8), smooth=True)
    rng = P.rng
    z = 0.12
    rows = 9
    for row in range(rows):
        x = -Lx / 2 + 0.06
        rmax = 0.085
        while x < Lx / 2 - 0.06:
            rr = rng.uniform(0.06, 0.1)
            if x + rr > Lx / 2 - 0.04:
                break
            q = rng.randint(0, 3)               # 쪼갠 모양: 반원/사분원
            a0 = q * math.pi / 2 + rng.uniform(-0.3, 0.3)
            span = math.pi if rng.random() < 0.45 else math.pi / 2
            n = 5
            poly = [(0.0, 0.0)] + [(rr * math.cos(a0 + span * k / n), rr * math.sin(a0 + span * k / n)) for k in range(n + 1)]
            cx, cz = x + rr * 0.6, z + rr * 0.55
            dy0, dy1 = -Dy / 2 + rng.uniform(-0.04, 0.03), Dy / 2 + rng.uniform(-0.03, 0.04)
            v, f = prism_vf([(cx + px * 0.9, cz + pz * 0.8) for px, pz in poly], 'y', dy0, dy1)
            bm = outward(K.bm_from(v, f))
            # 끝면 = 나이테, 둥근 옆 = 껍질, 쪼갠 면 = 나이테 재료(밝은 나무)
            uvl = bm.loops.layers.uv.verify()
            ends, arcs, flats = [], [], []
            for face in bm.faces:
                nrm = face.normal
                if abs(nrm.y) > 0.7:
                    ends.append(face)
                    for l in face.loops:
                        p = l.vert.co
                        l[uvl].uv = (0.5 + (p.x - cx) / (rr * 2.2), 0.5 + (p.z - cz) / (rr * 2.2))
                else:
                    c = face.calc_center_median()
                    d = math.hypot(c.x - cx, c.z - cz)
                    (arcs if d > rr * 0.55 else flats).append(face)
            sub = bm.copy()
            bm.free()
            for mat, keep in (('wood_end', 'end'), ('bark', 'arc'), ('wood_end', 'flat')):
                b2 = sub.copy()
                uv2 = b2.loops.layers.uv.verify()
                dele = []
                for face in b2.faces:
                    nrm = face.normal
                    kind = 'end' if abs(nrm.y) > 0.7 else None
                    if kind is None:
                        cc = face.calc_center_median()
                        kind = 'arc' if math.hypot(cc.x - cx, cc.z - cz) > rr * 0.55 else 'flat'
                    if kind != keep:
                        dele.append(face)
                bmesh.ops.delete(b2, geom=dele, context='FACES')
                if keep == 'end':
                    P.add_bm(b2, mat, uv=False)
                elif keep == 'arc':
                    P.add_bm(b2, mat, tile=(0.7, 0.7), smooth=True)
                else:
                    for face in b2.faces:
                        for l in face.loops:
                            p = l.vert.co
                            l[uv2].uv = (0.5 + (p.y) * 0.25, 0.75 + (p.x - cx) * 0.6)
                    P.add_bm(b2, mat, uv=False)
            sub.free()
            x += rr * 1.25 + rng.uniform(0.0, 0.03)
            rmax = max(rmax, rr)
        z += rmax * 0.95
        if row >= rows - 3:
            Lx -= 0.25
    top = z
    for sx in (-1, 1):          # 말뚝
        for sy in (-1, 1):
            bm = tube_bm([(sx * 1.13, sy * 0.33, -0.3), (sx * 1.12, sy * 0.33, top + 0.1)], 0.045, n=6)
            P.add_bm(bm, 'bark', tile=(0.6, 0.6), smooth=True)
    # 그루터기 + 도끼
    sx, sy = 1.75, -0.35
    bm = lathe_bm([(0.26, 0.0), (0.24, 0.48)], n=14, tile=0.8)
    P.add_bm(bm, 'bark', uv=False, smooth=True, matrix=T(sx, sy, -0.05))
    disc = lathe_bm([(0.235, 0.0), (0.235, 0.001)], n=14, cap1=True)
    uvl = disc.loops.layers.uv.verify()
    for face in disc.faces:
        for l in face.loops:
            p = l.vert.co
            l[uvl].uv = (0.5 + p.x / 0.52, 0.5 + p.y / 0.52)
    P.add_bm(disc, 'wood_end', uv=False, matrix=T(sx, sy, 0.43))
    M = T(sx + 0.05, sy, 0.43) @ Ry(rad(-25))
    P.add_bm(tube_bm([(0, 0, 0.05), (0, 0, 0.72)], [0.02, 0.016], n=6), 'timber_dark', tile=(0.6, 0.6), smooth=True, matrix=M)
    P.box(-0.05, 0.12, -0.012, 0.012, -0.04, 0.09, 'iron', tile=1.0, bevel=0.003, matrix=M)
    return P


def haystack():
    """건초 가리(볏가리): 불룩한 원기둥 + 원뿔 지붕(짚 이엉) + 꼭대기 장대. 반지름 ~1.8 m, 높이 ~4.3 m."""
    P = Piece('haystack', 3005)
    seed = 5

    def bump(p, a=0.1):
        return a * noise3(p.x * 2.0, p.y * 2.0, p.z * 1.6, seed) + 0.035 * noise3(p.x * 6, p.y * 6, p.z * 6, seed + 9)
    prof = [(1.55, -0.1), (1.7, 0.4), (1.8, 1.1), (1.82, 1.8), (1.86, 2.2)]
    st = [((0, 0, z), r, r) for r, z in prof]
    bm = loft_bm(st, n=28, ref=(1, 0, 0), cap0=False, cap1=False, disp=bump)
    P.add_bm(bm, 'hay', tile=(1.5, 1.5), smooth=True)
    roof = [(1.98, 2.05), (1.7, 2.6), (1.25, 3.2), (0.75, 3.75), (0.3, 4.15), (0.05, 4.3)]
    st = [((0, 0, z), r, r) for r, z in roof]
    bm = loft_bm(st, n=28, ref=(1, 0, 0), cap0=False, cap1=True, disp=lambda p: 0.04 * noise3(p.x * 3, p.y * 3, p.z * 3, seed + 4))
    uvl = bm.loops.layers.uv.verify()
    for face in bm.faces:
        us = []
        for l in face.loops:
            p = l.vert.co
            a = math.atan2(p.y, p.x) / (2 * math.pi) % 1.0
            l[uvl].uv = (a * 12.4 / 1.6, -math.hypot(p.x, p.y) / 1.2 + p.z * 0.4)
            us.append(l[uvl].uv.x)
        if max(us) - min(us) > 3.0:
            for l in face.loops:
                if l[uvl].uv.x < 3.0:
                    l[uvl].uv.x += 12.4 / 1.6
    P.add_bm(bm, 'thatch', uv=False, smooth=True)
    # 이엉 누름 새끼줄 (가로 띠 둘)
    for (r, z) in ((1.5, 2.75), (0.9, 3.5)):
        P.add_bm(lathe_bm([(r + 0.03, z - 0.03), (r + 0.03, z + 0.03)], n=28), 'palette', uv=False, smooth=True)
    P.add_bm(tube_bm([(0, 0, 3.9), (0, 0, 4.75)], [0.05, 0.035], n=6), 'bark', tile=(0.6, 0.6), smooth=True)
    return P



def cart():
    """두 바퀴 짐수레: 바퀴(테·살·통), 굴대, 판자 바닥, 옆널·말뚝, 끌채 둘. 끌채(+X) 끝을 땅에 내려놓은 자세."""
    P = Piece('cart', 3006)
    R = 0.62
    # 수레 몸: 로컬에서 짓고 기울여 놓는다 (굴대 높이 R, 끌채 끝이 땅)
    L, W = 2.1, 1.25
    zb = R + 0.12
    ang = math.atan2(zb - 0.08, 2.6)        # 굴대(x=0)에서 끌채 끝(x≈2.6)까지 내려간다
    Mb = T(0, 0, R) @ Ry(ang) @ T(0, 0, -R)
    def B(*a, **k):
        P.box(*a, matrix=Mb, **k)
    for k in range(7):                        # 바닥 판자
        y0 = -W / 2 + k * W / 7
        B(-L / 2 - 0.15, L / 2 - 0.15, y0 + 0.006, y0 + W / 7 - 0.006, zb, zb + 0.04, 'planks', tile=1.4, bevel=0.004)
    for sy in (-1, 1):                        # 옆틀·옆널·말뚝
        B(-L / 2 - 0.2, L / 2 - 0.05, sy * W / 2 - 0.05, sy * W / 2 + 0.05, zb - 0.1, zb, 'timber_dark', tile=1.6, bevel=0.008)
        for zz in (zb + 0.12, zb + 0.34):
            B(-L / 2 - 0.15, L / 2 - 0.2, sy * (W / 2 + 0.01) - 0.015, sy * (W / 2 + 0.01) + 0.015, zz, zz + 0.12, 'planks', tile=1.4, bevel=0.004)
        for xx in (-L / 2 - 0.12, -0.35, 0.35, L / 2 - 0.25):
            B(xx - 0.035, xx + 0.035, sy * (W / 2 + 0.04) - 0.03, sy * (W / 2 + 0.04) + 0.03, zb - 0.05, zb + 0.5, 'timber_dark', tile=1.0, bevel=0.006)
    for xx in (-L / 2 - 0.13, L / 2 - 0.25):      # 앞뒤 널
        for zz in (zb + 0.12, zb + 0.3):
            B(xx - 0.015, xx + 0.015, -W / 2, W / 2, zz, zz + 0.14, 'planks', tile=1.4, bevel=0.004)
    for sy in (-1, 1):                        # 끌채 (몸 밑을 지나 앞으로)
        p0 = Mb @ Vector((-L / 2 + 0.1, sy * 0.38, zb - 0.07))
        p1 = Mb @ Vector((2.7, sy * 0.3, zb - 0.07))
        P.beam(tuple(p0), tuple(p1), 0.08, 0.09, 'timber_dark', bevel=0.01)
    P.beam(tuple(Mb @ Vector((1.15, -0.36, zb - 0.07))), tuple(Mb @ Vector((1.15, 0.36, zb - 0.07))), 0.07, 0.07, 'timber_dark', bevel=0.008, up=(1, 0, 0))
    # 굴대·바퀴
    P.beam((0, -W / 2 - 0.32, R), (0, W / 2 + 0.32, R), 0.09, 0.09, 'timber_dark', bevel=0.01, up=(1, 0, 0))
    for sy in (-1, 1):
        yw = sy * (W / 2 + 0.2)
        nseg = 12
        for k in range(nseg):
            a0, a1 = 2 * math.pi * k / nseg, 2 * math.pi * (k + 1) / nseg
            am = (a0 + a1) / 2
            p0 = (R * 0.94 * math.cos(a0), yw, R + R * 0.94 * math.sin(a0))
            p1 = (R * 0.94 * math.cos(a1), yw, R + R * 0.94 * math.sin(a1))
            P.beam(p0, p1, 0.09, 0.08, 'planks', up=(math.cos(am), 0, math.sin(am)), ext=0.035, bevel=0.006)
        P.add_bm(lathe_bm([(R + 0.012, -0.05), (R + 0.012, 0.05)], n=24), 'iron', uv=False, smooth=True, matrix=T(0, yw, R) @ Rx(rad(90)))
        P.add_bm(lathe_bm([(0.0, -0.12), (0.1, -0.11), (0.12, -0.05), (0.12, 0.05), (0.1, 0.11), (0.0, 0.12)], n=10, tile=0.5), 'timber_dark', uv=False, smooth=True,
                 matrix=T(0, yw, R) @ Rx(rad(90)))
        for k in range(10):
            a = 2 * math.pi * k / 10 + 0.15
            P.beam((0.1 * math.cos(a), yw, R + 0.1 * math.sin(a)), ((R * 0.9) * math.cos(a), yw, R + (R * 0.9) * math.sin(a)), 0.045, 0.035, 'planks',
                   up=(0, 1, 0), bevel=0.005)
    # 실은 자루 둘
    for (x, y, rz) in ((-0.55, -0.25, 0.4), (-0.2, 0.22, 1.7)):
        bm = sack_bm(P.rng, h=0.55, r=0.19)
        P.add_bm(bm, 'linen', tile=0.6, smooth=True, matrix=Mb @ T(x, y, zb + 0.24) @ Rz(rz) @ Ry(rad(86)))
    return P


# ───────────────────────── 울타리·담 ─────────────────────────
def wattle_fence():
    """욋가지 울(허들) 2 m × 1 m: 말뚝 7개 사이로 가지 9줄을 엇갈려 엮는다. 이어 붙여 쓴다(X 로 -1 … +1)."""
    P = Piece('wattle_fence', 3101)
    Lh, H = 2.0, 1.0
    ns = 7
    xs = [-Lh / 2 + 0.07 + k * (Lh - 0.14) / (ns - 1) for k in range(ns)]
    for k, x in enumerate(xs):
        top = H + 0.08 + 0.05 * math.sin(k * 2.1)
        bm = tube_bm([(x, 0, -0.25), (x + 0.01, 0.005, top)], [0.028, 0.022], n=6)
        P.add_bm(bm, 'bark', tile=(0.5, 0.5), smooth=True)
    nr = 10
    for r in range(nr):
        z = 0.1 + r * (H - 0.12) / (nr - 1)
        ph = r % 2
        pts = []
        for i in range((ns - 1) * 3 + 1):
            t = i / 3
            x = -Lh / 2 + 0.02 + (Lh - 0.04) * i / ((ns - 1) * 3)
            yoff = 0.032 * math.cos(math.pi * (t + ph))
            pts.append((x, yoff, z + 0.01 * math.sin(i * 1.7 + r)))
        bm = tube_bm(pts, 0.017, n=4, ref=(0, 0, 1))
        P.add_bm(bm, 'bark', tile=(0.5, 0.5), smooth=True)
    return P


def stone_wall():
    """막쌓은 돌담 2 m 조각 (X 로 -1 … +1, 높이 1.05): 위로 좁아지는 몸 + 세워 박은 갓돌. 양끝 단면이 같아 이어 붙는다."""
    P = Piece('stone_wall', 3102)
    Lh = 2.0
    nx, nz = 10, 6
    wb, wt, H = 0.36, 0.22, 0.86

    def disp(x, z, side):
        a = math.pi * x / (Lh / 2)            # 2 m 주기 (끝이 맞물리게 원 위 좌표)
        cx, sx = math.cos(a), math.sin(a)
        return 0.035 * noise3(cx * 1.4 + side * 3, sx * 1.4, z * 3.0, 41) + 0.015 * noise3(cx * 4 + side, sx * 4, z * 9, 43)
    v, f = [], []
    for side in (-1, 1):
        for j in range(nz + 1):
            z = H * j / nz
            w = wb + (wt - wb) * (j / nz)
            for i in range(nx + 1):
                x = -Lh / 2 + Lh * i / nx
                dd = disp(x, z, side) * (0.4 if j == nz else 1.0)
                v.append((x, side * (w + dd), z - 0.15 * (j == 0)))
    stride = nx + 1
    off = (nz + 1) * stride
    for j in range(nz):
        for i in range(nx):
            a = j * stride + i
            f.append((a, a + 1, a + stride + 1, a + stride))               # -y 면
            b = off + j * stride + i
            f.append((b, b + stride, b + stride + 1, b + 1))               # +y 면
    for i in range(nx):                                                   # 윗면 (+z 쪽으로 감김)
        a, b = nz * stride + i, off + nz * stride + i
        f.append((a, a + 1, b + 1, b))
    bm = K.bm_from(v, f)
    for face in bm.faces:
        face.smooth = True
    P.add_bm(bm, 'stone_dry', tile=(1.4, 1.4), smooth=True)
    # 갓돌: 세워 박은 넓적돌 (끝에서 끝까지 고르게)
    rng = P.rng
    n = 11
    for k in range(n):
        x = -Lh / 2 + (k + 0.5) * Lh / n
        th = rng.uniform(0.11, 0.16)
        hh = rng.uniform(0.16, 0.24)
        ww = wt * 2 + rng.uniform(0.02, 0.08)
        tilt = rng.uniform(-0.12, 0.12)
        M = T(x, rng.uniform(-0.02, 0.02), H - 0.04) @ Ry(tilt)
        P.box(-th / 2, th / 2, -ww / 2, ww / 2, 0, hh, 'stone_dry', tile=1.0, bevel=0.02, matrix=M)
    return P


def rail_fence():
    """쪼갠 가로대 울타리 2.5 m (X 로 -1.25 … +1.25): 양끝 기둥 + 가로대 둘. 이어 붙이면 +X 끝의 조금 가는 기둥이
    다음 조각의 -X 기둥 속에 묻힌다 (줄 끝에도 기둥이 서도록)."""
    P = Piece('rail_fence', 3103)
    Lh = 2.5
    for x, r0, r1 in ((-Lh / 2, 0.075, 0.065), (Lh / 2, 0.066, 0.057)):
        P.add_bm(tube_bm([(x, 0, -0.35), (x + 0.01, 0, 1.22)], [r0, r1], n=6), 'timber_dark', tile=(0.8, 0.8), smooth=False)
    for (z, w) in ((0.5, 0.075), (1.0, 0.07)):
        p0, p1 = (-Lh / 2 + 0.05, 0.07, z), (Lh / 2 + 0.08, 0.07, z - 0.04)
        P.beam(p0, p1, 0.06, w + 0.02, 'timber_dark', bevel=0.012)
    return P


# ───────────────────────── 일터 ─────────────────────────
def trough():
    """여물통·물통: 판자 상자 (안쪽 물) + 짧은 다리."""
    P = Piece('trough', 3201)
    L, W, H, t = 1.9, 0.62, 0.5, 0.05
    z0 = 0.12
    P.box(-L / 2, L / 2, -W / 2, W / 2, z0, z0 + t, 'planks', tile=1.4, bevel=0.006)
    for sy in (-1, 1):
        P.box(-L / 2, L / 2, sy * W / 2 - t / 2, sy * W / 2 + t / 2, z0, z0 + H, 'planks', tile=1.4, bevel=0.006)
    for sx in (-1, 1):
        P.box(sx * L / 2 - t / 2, sx * L / 2 + t / 2, -W / 2, W / 2, z0, z0 + H + 0.02, 'planks', tile=1.4, bevel=0.006)
    P.box(-L / 2 + t, L / 2 - t, -W / 2 + t, W / 2 - t, z0 + H - 0.12, z0 + H - 0.115, 'water', tile=1.0)
    for sx in (-0.7, 0.7):
        P.box(sx - 0.06, sx + 0.06, -W / 2 - 0.03, W / 2 + 0.03, 0.0, z0, 'timber_dark', tile=1.0, bevel=0.006)
    for sx in (-0.55, 0.55):
        for sy in (-1, 1):
            P.box(sx - 0.03, sx + 0.03, sy * (W / 2 + t / 2) - 0.004, sy * (W / 2 + t / 2) + 0.004, z0 + 0.05, z0 + H - 0.02, 'iron', tile=1.0)
    return P


def anvil():
    """그루터기 위 모루 + 망치·집게."""
    P = Piece('anvil', 3202)
    P.add_bm(lathe_bm([(0.3, -0.05), (0.29, 0.25), (0.27, 0.52)], n=14, tile=0.8), 'bark', uv=False, smooth=True)
    disc = lathe_bm([(0.27, 0.0), (0.27, 0.001)], n=14, cap1=True)
    uvl = disc.loops.layers.uv.verify()
    for face in disc.faces:
        for l in face.loops:
            p = l.vert.co
            l[uvl].uv = (0.5 + p.x / 0.6, 0.5 + p.y / 0.6)
    P.add_bm(disc, 'wood_end', uv=False, matrix=T(0, 0, 0.519))
    z = 0.52
    P.box(-0.16, 0.16, -0.12, 0.12, z, z + 0.05, 'iron', tile=1.0, bevel=0.01)
    P.box(-0.1, 0.1, -0.07, 0.07, z + 0.05, z + 0.17, 'iron', tile=1.0, bevel=0.01)
    P.box(-0.24, 0.2, -0.085, 0.085, z + 0.17, z + 0.28, 'iron', tile=1.0, bevel=0.012)
    horn = loft_bm([((0.2, 0, z + 0.235), 0.085, 0.045), ((0.32, 0, z + 0.25), 0.05, 0.03), ((0.42, 0, z + 0.27), 0.012, 0.01)], n=8, ref=(0, 1, 0))
    P.add_bm(horn, 'iron', tile=1.0, smooth=True)
    P.box(-0.26, -0.24, -0.06, 0.06, z + 0.2, z + 0.28, 'iron', tile=1.0)
    # 망치 (모루 위에 눕힘)
    M = T(-0.05, 0.02, z + 0.28) @ Rz(0.5)
    P.add_bm(tube_bm([(0, 0, 0.02), (0.36, 0, 0.02)], 0.014, n=6, ref=(0, 0, 1)), 'timber_dark', tile=(0.5, 0.5), smooth=True, matrix=M)
    P.box(-0.03, 0.03, -0.055, 0.055, 0.0, 0.05, 'iron', tile=1.0, bevel=0.004, matrix=M)
    # 집게 (그루터기에 기대어)
    M = T(0.0, -0.3, 0.0) @ Rx(rad(-14))
    for sy in (-1, 1):
        P.add_bm(tube_bm([(0, sy * 0.012, 0.02), (0, sy * 0.02, 0.45), (0, sy * 0.008, 0.62)], 0.009, n=4), 'iron', tile=(0.5, 0.5), matrix=M)
    return P


def tool_rack():
    """연장 걸이: 땅에 박은 기둥 둘 + 가로대, 쇠스랑·갈퀴·삽·낫·괭이를 기대 세움 (앞 = -Y)."""
    P = Piece('tool_rack', 3203)
    for sx in (-0.8, 0.8):
        P.add_bm(tube_bm([(sx, 0.1, -0.3), (sx, 0.1, 1.45)], 0.05, n=6), 'timber_dark', tile=(0.8, 0.8))
    P.beam((-0.92, 0.1, 1.35), (0.92, 0.1, 1.35), 0.07, 0.08, 'timber_dark', bevel=0.01)
    P.beam((-0.92, 0.1, 0.55), (0.92, 0.1, 0.55), 0.05, 0.06, 'timber_dark', bevel=0.008)

    def handle(x, lean, top=1.55, r=0.017):
        p0 = Vector((x, -0.12 - lean, 0.0))
        p1 = Vector((x + 0.03, 0.06, top))
        P.add_bm(tube_bm([tuple(p0), tuple(p1)], r, n=6, ref=(1, 0, 0)), 'planks', tile=(0.6, 0.6), smooth=True)
        return p0, p1
    # 쇠스랑 (갈래 셋, 위로)
    p0, p1 = handle(-0.6, 0.15)
    d = (p1 - p0).normalized()
    for k in (-1, 0, 1):
        a = p1 + Vector((k * 0.05, 0, 0))
        P.add_bm(tube_bm([tuple(p1 + Vector((k * 0.02, 0, -0.04))), tuple(a + d * 0.12), tuple(a + d * 0.32 + Vector((0, -0.03, 0)))], [0.008, 0.007, 0.004], n=4, ref=(1, 0, 0)),
                 'iron', tile=1.0)
    # 갈퀴 (머리 위로)
    p0, p1 = handle(-0.28, 0.2, top=1.5)
    P.box(-0.22, 0.22, -0.02, 0.02, -0.025, 0.025, 'planks', tile=1.0, matrix=T(p1.x, p1.y, p1.z))
    for k in range(9):
        x = p1.x - 0.2 + k * 0.05
        P.add_bm(tube_bm([(x, p1.y, p1.z), (x, p1.y - 0.09, p1.z + 0.02)], 0.006, n=4, ref=(0, 0, 1)), 'planks', tile=1.0)
    # 삽 (날 아래)
    p0, p1 = handle(0.05, 0.25, top=1.25)
    P.box(-0.1, 0.1, -0.012, 0.012, -0.32, 0.0, 'planks', tile=1.0, bevel=0.004, matrix=T(p0.x, p0.y + 0.02, 0.32) @ Rx(rad(-6)))
    P.box(-0.105, 0.105, -0.015, 0.015, -0.33, -0.27, 'iron', tile=1.0, bevel=0.003, matrix=T(p0.x, p0.y + 0.02, 0.32) @ Rx(rad(-6)))
    # 괭이
    p0, p1 = handle(0.35, 0.12, top=1.45)
    P.box(-0.07, 0.07, -0.16, 0.0, -0.01, 0.01, 'iron', tile=1.0, matrix=T(p1.x, p1.y, p1.z) @ Rx(rad(-30)))
    # 낫 (긴 자루 + 굽은 날)
    p0, p1 = handle(0.62, 0.3, top=1.7, r=0.018)
    blade = []
    for k in range(7):
        t = k / 6
        blade.append((p1.x - 0.05 - 0.55 * t, p1.y - 0.05 - 0.12 * math.sin(t * 2.2), p1.z - 0.02 - 0.12 * t * t))
    P.add_bm(loft_bm([(b, 0.004, 0.035 * (1 - 0.8 * i / 6)) for i, b in enumerate(blade)], n=4, ref=(0, 0, 1)), 'iron', tile=1.0)
    return P


# ───────────────────────── 장터 ─────────────────────────
def apple(P, M, r=0.04, color='apple_red'):
    pal_add(P, ellipsoid_bm((0, 0, r * 0.9), (r, r, r * 0.9), nu=6, nv=4), color, matrix=M)


def cabbage(P, M, r=0.12):
    pal_add(P, ellipsoid_bm((0, 0, r * 0.8), (r, r, r * 0.85), nu=8, nv=5), 'cabbage', matrix=M)
    for k in range(5):
        a = k * 2 * math.pi / 5 + 0.4
        rot = (Rz(a) @ Ry(rad(-55))).to_3x3()
        pal_add(P, ellipsoid_bm((math.cos(a) * r * 0.75, math.sin(a) * r * 0.75, r * 0.55), (r * 0.7, r * 0.55, r * 0.07), nu=6, nv=3, rot=rot),
                'leaf_light' if k % 2 else 'cabbage', matrix=M)


def basket(P, M, r=0.2, h=0.18, fill=None, rng=None):
    bm = lathe_bm([(r * 0.8, 0.0), (r, h * 0.6), (r * 1.04, h), (r * 0.98, h), (r * 0.94, h * 0.6), (r * 0.74, 0.02)], n=12, cap0=True)
    pal_add(P, bm, 'wicker', smooth=True, matrix=M)
    if fill:
        kind, colors = fill
        if kind == 'heap':
            k = 0
            for ring, (rr, zz, cnt) in enumerate(((r * 0.62, h * 0.85, 7), (r * 0.3, h * 1.05, 4), (0, h * 1.18, 1))):
                for j in range(cnt):
                    a = 2 * math.pi * j / max(cnt, 1) + ring
                    col = colors[(k * 7 + j) % len(colors)]
                    apple(P, M @ T(rr * math.cos(a), rr * math.sin(a), zz - 0.02), r=0.042, color=col)
                    k += 1
        elif kind == 'eggs':
            for j in range(8):
                a = 2 * math.pi * j / 8
                pal_add(P, ellipsoid_bm((r * 0.45 * math.cos(a), r * 0.45 * math.sin(a), h * 0.85), (0.026, 0.026, 0.034), nu=6, nv=4), 'egg', matrix=M)


def loaf(P, M, s=1.0):
    pal_add(P, ellipsoid_bm((0, 0, 0.05 * s), (0.13 * s, 0.08 * s, 0.065 * s), nu=8, nv=5), 'bread', matrix=M)


def jug(P, M, h=0.32, color='clay'):
    prof = [(0.07, 0.0), (0.1, 0.05), (0.11, 0.14), (0.085, 0.24), (0.045, 0.28), (0.05, h), (0.04, h)]
    pal_add(P, lathe_bm(prof, n=12, cap0=True), color, smooth=True, matrix=M)


def cheese(P, M, r=0.13, h=0.09):
    pal_add(P, lathe_bm([(r, 0.0), (r * 1.03, h * 0.5), (r, h)], n=14, cap0=True, cap1=True), 'cheese', smooth=True, matrix=M)


def cloth_bolt(P, M, color, L=0.6, r=0.06):
    pal_add(P, lathe_bm([(r, -L / 2), (r, L / 2)], n=10, cap0=True, cap1=True), color, smooth=True, matrix=M @ Ry(rad(90)))


def market_goods():
    """장터 물건: 버팀다리 판자 상(2 m) 위에 사과·양배추·빵·치즈·항아리·옷감, 땅에 바구니·자루·상자. 앞(손님 쪽) = -Y."""
    P = Piece('market_goods', 3301)
    L, W, Ht = 2.0, 0.8, 0.78
    P.box(-L / 2, L / 2, -W / 2, W / 2, Ht - 0.045, Ht, 'planks', tile=1.4, bevel=0.006)
    for sx in (-0.75, 0.75):                  # 버팀다리 (X 자)
        for sy in (-1, 1):
            P.beam((sx, sy * 0.32, 0.0), (sx, -sy * 0.25, Ht - 0.05), 0.06, 0.05, 'timber_dark', up=(1, 0, 0), bevel=0.006)
        P.beam((sx, -0.36, Ht - 0.07), (sx, 0.36, Ht - 0.07), 0.07, 0.05, 'timber_dark', up=(0, 0, 1), bevel=0.006)
    z = Ht
    basket(P, T(-0.72, -0.1, z), r=0.17, h=0.13, fill=('heap', ['apple_red', 'apple_red', 'apple_green']))
    basket(P, T(-0.36, 0.12, z), r=0.16, h=0.12, fill=('heap', ['onion']))
    for (x, y) in ((-0.1, -0.15), (0.1, -0.12), (0.0, 0.08), (0.2, 0.1)):
        cabbage(P, T(x, y, z), 0.1)
    for (x, y, a) in ((0.42, -0.2, 0.2), (0.55, -0.05, -0.3), (0.45, 0.12, 0.6)):
        loaf(P, T(x, y, z) @ Rz(a))
    cheese(P, T(0.78, 0.15, z))
    cheese(P, T(0.78, 0.15, z + 0.09), r=0.11, h=0.08)
    jug(P, T(0.8, -0.2, z))
    jug(P, T(-0.9, 0.25, z), h=0.26, color='pot_dark')
    basket(P, T(0.25, 0.25, z), r=0.12, h=0.1, fill=('eggs', None))
    # 옷감 두루마리 (상 뒤쪽에 쌓음)
    for k, col in enumerate(('cloth_blue', 'cloth_red', 'cloth_undyed', 'cloth_green')):
        cloth_bolt(P, T(-0.45 + k * 0.17, 0.3, z + 0.06) @ Rz(rad(90)), col, L=0.5)
    # 땅: 바구니 둘, 자루 둘, 상자
    basket(P, T(-0.6, -0.75, 0), r=0.24, h=0.22, fill=('heap', ['apple_green', 'apple_red']))
    basket(P, T(0.05, -0.72, 0), r=0.22, h=0.2, fill=('heap', ['carrot', 'onion']))
    for (x, y, rz, s) in ((0.95, 0.65, 0.4, 0.85), (0.6, 0.75, 2.0, 0.8)):
        P.add_bm(sack_bm(P.rng, h=0.6 * s, r=0.2 * s), 'linen', tile=0.6, smooth=True, matrix=T(x, y, 0) @ Rz(rz))
    crate_parts(P, T(-1.05, 0.6, 0) @ Rz(0.3), w=0.6, d=0.45, h=0.4)
    for (x, y) in ((-1.1, 0.55), (-0.95, 0.68)):
        cabbage(P, T(x, y, 0.33) @ Rz(0.3), 0.09)
    return P


def cloth_awning():
    """홀로 선 천 차양 (천 3.5 × 2.6 m, 버팀줄까지 바닥 3.76 × 3.29 m): 기둥 넷(앞 2.2, 뒤 2.6), 처진 줄무늬 천 + 물결 드림. 앞 = -Y."""
    P = Piece('cloth_awning', 3302)
    for (x, y, h) in ((-1.5, -1.1, 2.25), (1.5, -1.1, 2.25), (-1.5, 1.1, 2.62), (1.5, 1.1, 2.62)):
        P.add_bm(tube_bm([(x, y, -0.3), (x, y, h + 0.08)], 0.045, n=6), 'timber_dark', tile=(0.8, 0.8))
    P.beam((-1.55, -1.1, 2.2), (1.55, -1.1, 2.2), 0.06, 0.07, 'timber_dark', bevel=0.008)
    P.beam((-1.55, 1.1, 2.57), (1.55, 1.1, 2.57), 0.06, 0.07, 'timber_dark', bevel=0.008)

    def fz(x, y):
        t = (y + 1.3) / 2.6
        return 2.26 + t * 0.37 - 0.09 * (1 - (x / 1.75) ** 2) * math.sin(math.pi * min(1, max(0, t)))
    xs = [-1.75 + 3.5 * i / 20 for i in range(21)]
    ys = [-1.3 + 2.6 * j / 12 for j in range(13)]

    def uvf(me, poly):
        return [(me.vertices[i].co.x / 1.1 + 0.3, me.vertices[i].co.y / 1.1) for i in poly.vertices]
    ob = K.heightfield(fz, xs, ys, 0.012, uvfn=uvf, name='awning')
    P.add_obj(ob, 'canvas_b', keep_uv=True, smooth=True)
    v, f = [], []
    nx = 48
    for i in range(nx + 1):
        x = -1.75 + 3.5 * i / nx
        zt = fz(x, -1.3)
        zb_ = zt - 0.26 + 0.07 * abs(math.sin(math.pi * x / 0.4375))
        v += [(x, -1.305, zb_), (x, -1.305, zt)]
    for i in range(nx):
        f.append((2 * i, 2 * i + 2, 2 * i + 3, 2 * i + 1))
    ob = temp_obj(v, f, 'valance')
    uvl = ob.data.uv_layers.new(name='UVMap')
    for poly in ob.data.polygons:
        for li, vi in zip(poly.loop_indices, poly.vertices):
            co = ob.data.vertices[vi].co
            uvl.data[li].uv = (co.x / 1.1 + 0.3, co.z)
    sol = ob.modifiers.new('s', 'SOLIDIFY')
    sol.thickness = 0.01
    P.add_obj(ob, 'canvas_b', keep_uv=True, smooth=True)
    # 버팀줄 둘 (앞 기둥 → 땅 말뚝)
    for sx in (-1, 1):
        bm = tube_bm([(sx * 1.5, -1.1, 2.2), (sx * 1.85, -1.95, 0.02)], 0.008, n=4, ref=(1, 0, 0))
        pal_add(P, bm, 'rope', smooth=False)
        P.add_bm(tube_bm([(sx * 1.85, -1.95, -0.1), (sx * 1.86, -1.97, 0.15)], 0.02, n=4), 'timber_dark', tile=(0.5, 0.5))
    return P


# ───────────────────────── 마당 ─────────────────────────
def bench():
    """판자 걸상 1.6 m: 두꺼운 판에 비스듬히 박은 둥근 다리 넷. 앞 = -Y."""
    P = Piece('bench', 3401)
    L, D, Hs = 1.6, 0.3, 0.45
    P.box(-L / 2, L / 2, -D / 2, D / 2, Hs - 0.06, Hs, 'planks', tile=1.2, bevel=0.012)
    for sx in (-1, 1):
        for sy in (-1, 1):
            p0 = (sx * (L / 2 - 0.16), sy * 0.06, Hs - 0.03)
            p1 = (sx * (L / 2 - 0.05), sy * 0.16, 0.0)
            P.add_bm(tube_bm([p0, p1], [0.03, 0.026], n=6), 'timber_dark', tile=(0.5, 0.5), smooth=True)
    return P


def leaf_scatter(P, rng, pts, cols, size=(0.055, 0.028, 0.006)):
    """잎 무더기: 점마다 납작한 잎 하나를 아무 방향으로 (덩어리가 아니라 잎이 겹친 포기로 읽히게)."""
    for (x, y, z) in pts:
        rot = (Rz(rng.uniform(0, 2 * math.pi)) @ Rx(rng.uniform(-0.7, 0.7)) @ Ry(rng.uniform(-0.5, 0.5))).to_3x3()
        k = rng.uniform(0.75, 1.25)
        pal_add(P, ellipsoid_bm((x, y, z), (size[0] * k, size[1] * k, size[2]), nu=4, nv=3, rot=rot), rng.choice(cols))


def leaf_card(P, x, y, z, a, L, w, tilt, col):
    """납작한 마름모 잎 한 장 (앞면·뒷면 따로, 삼각형 4): 밑동 (x,y,z) 에서 방위 a 로 L 만큼, tilt 만큼 들려 뻗는다."""
    ca, sa, ct, st = math.cos(a), math.sin(a), math.cos(tilt), math.sin(tilt)
    tip = Vector((x + ca * L * ct, y + sa * L * ct, z + L * st))
    mid = Vector((x + ca * L * 0.45 * ct, y + sa * L * 0.45 * ct, z + L * 0.45 * st + 0.012))
    side = Vector((-sa * w, ca * w, 0.0))
    base = Vector((x, y, z))
    nrm = (tip - base).cross(side).normalized() * 0.002      # 뒷면을 2 mm 띄운다 (점 합치기에 붙지 않게)
    front = [base, mid + side, tip, mid - side]
    v = [tuple(q) for q in front] + [tuple(q - nrm) for q in front]
    pal_add(P, K.bm_from(v, [(0, 1, 2, 3), (7, 6, 5, 4)]), col, smooth=False)


def flower_head(P, x, y, z, s, col):
    """꽃송이: 위를 보는 육각 원반(꽃잎) + 가운데 노란 술 (삼각형 5)."""
    pts = [(x + s * math.cos(k * math.pi / 3), y + s * math.sin(k * math.pi / 3), z) for k in range(6)]
    pal_add(P, K.bm_from(pts, [(0, 1, 2, 3, 4, 5)]), col, smooth=False)
    c = 'flower_yellow' if col != 'flower_yellow' else 'flower_orange'
    q = [(x + s * 0.32 * math.cos(k * 2 * math.pi / 3 + 0.5), y + s * 0.32 * math.sin(k * 2 * math.pi / 3 + 0.5), z + 0.004) for k in range(3)]
    pal_add(P, K.bm_from(q, [(0, 1, 2)]), c, smooth=False)


def flower_patch():
    """꽃밭 ~1.4 × 1.3 m (삼각형 ≤1,500): 잎 카드를 겹친 포기 아홉 사이로 줄기 끝에 흰·노랑·분홍·보라·빨강·파랑 꽃, 키 큰 꽃 이삭 셋."""
    P = Piece('flower_patch', 3402)
    rng = P.rng
    cols = ['flower_white', 'flower_yellow', 'flower_pink', 'flower_purple', 'flower_red', 'flower_blue', 'flower_orange', 'flower_white']
    for k in range(9):                       # 잎 포기: 가운데에서 바깥으로 비스듬히 뻗은 잎 카드 14장 (위로 갈수록 짧고 서 있다)
        cx, cy = rng.uniform(-0.6, 0.6), rng.uniform(-0.4, 0.4)
        h = rng.uniform(0.16, 0.3)
        lc = rng.choice([['leaf', 'leaf_dark'], ['leaf', 'leaf_light'], ['leaf_grey', 'leaf'], ['leaf_dark', 'leaf_grey']])
        for j in range(14):
            a = j * 2.39996 + rng.uniform(-0.3, 0.3)
            lv = j / 14
            leaf_card(P, cx + 0.02 * math.cos(a), cy + 0.02 * math.sin(a), lv * h * 0.6, a, rng.uniform(0.16, 0.26) * (1 - 0.35 * lv),
                      rng.uniform(0.035, 0.05), rng.uniform(0.25, 0.55) + lv * 0.6, lc[j % 2])
        col = cols[rng.randint(0, len(cols) - 1)]
        for j in range(rng.randint(3, 5)):   # 줄기 + 꽃
            a, d = rng.uniform(0, 2 * math.pi), rng.uniform(0.0, 0.12)
            fx, fy, fz = cx + d * math.cos(a), cy + d * math.sin(a), h + rng.uniform(0.08, 0.22)
            pal_add(P, tube_bm([(cx, cy, 0.0), (fx, fy, fz)], 0.006, n=3, cap0=False, cap1=False), 'stem', smooth=False)
            flower_head(P, fx, fy, fz, rng.uniform(0.03, 0.045), col)
    for k in range(3):                       # 키 큰 꽃 이삭 (종 모양 꽃이 줄기를 따라)
        x, y = rng.uniform(-0.55, 0.55), rng.uniform(-0.2, 0.4)
        h = rng.uniform(0.9, 1.3)
        col = ['flower_pink', 'flower_purple', 'flower_white'][k % 3]
        pal_add(P, tube_bm([(x, y, 0.0), (x + 0.02, y, h)], 0.01, n=3, cap0=False, cap1=False), 'stem', smooth=False)
        for j in range(5):
            a = j * 1.26 + rng.uniform(-0.2, 0.2)
            leaf_card(P, x, y, 0.02 + j * 0.05, a, rng.uniform(0.2, 0.3), 0.05, 0.35 + j * 0.12, 'leaf' if j % 2 else 'leaf_dark')
        for j in range(9):
            zz = h * (0.45 + 0.55 * j / 9)
            sb = 0.05 * (1 - 0.45 * j / 9)
            a = j * 2.4
            bx, by = x + 0.02 * zz / h + math.cos(a) * sb * 0.8, y + math.sin(a) * sb * 0.8
            pal_add(P, lathe_bm([(0.0, sb * 1.2), (sb * 0.85, 0.0)], n=5), col, matrix=T(bx, by, zz - sb))
    return P


def vegetable_bed():
    """텃밭 두둑 3 × 1.2 m: 흙 두둑 + 판자 테두리, 양배추 두 줄, 리크 한 줄, 콩 지지대 넷."""
    P = Piece('vegetable_bed', 3403)
    L, W = 3.0, 1.2
    nx, ny = 16, 6
    v, f = [], []
    for j in range(ny + 1):
        for i in range(nx + 1):
            x, y = -L / 2 + L * i / nx, -W / 2 + W * j / ny
            e = min(i, nx - i, j, ny - j)
            z = 0.16 if e > 0 else 0.0
            z += 0.025 * K.vnoise(x * 4, y * 4, 3) * (e > 0)
            v.append((x, y, z))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            f.append((a, a + 1, a + nx + 2, a + nx + 1))
    bm = K.bm_from(v, f)
    P.add_bm(bm, 'soil', tile=(1.2, 1.2), smooth=True)
    for sy in (-1, 1):
        P.box(-L / 2 - 0.03, L / 2 + 0.03, sy * W / 2 - 0.025, sy * W / 2 + 0.025, -0.05, 0.2, 'planks', tile=1.2, bevel=0.005)
    for sx in (-1, 1):
        P.box(sx * L / 2 - 0.025, sx * L / 2 + 0.025, -W / 2, W / 2, -0.05, 0.2, 'planks', tile=1.2, bevel=0.005)
    rng = P.rng
    for yy in (-0.35, 0.0):
        for k in range(6):
            x = -1.25 + k * 0.45 + rng.uniform(-0.04, 0.04)
            cabbage(P, T(x, yy + rng.uniform(-0.03, 0.03), 0.14), rng.uniform(0.1, 0.13))
    for k in range(11):                      # 리크
        x = -1.3 + k * 0.24
        for j in range(3):
            a = j * 2.1 + k
            bm = loft_bm([((x, 0.33, 0.15), 0.012, 0.012), ((x + 0.06 * math.cos(a), 0.33 + 0.06 * math.sin(a), 0.42), 0.018, 0.004),
                          ((x + 0.12 * math.cos(a), 0.33 + 0.12 * math.sin(a), 0.36), 0.003, 0.002)], n=4, ref=(math.sin(a), -math.cos(a), 0))
            pal_add(P, bm, 'leek', smooth=True)
    for k in range(4):                       # 콩 지지대 + 잎
        x = -1.2 + k * 0.8
        P.add_bm(tube_bm([(x, 0.47, 0.0), (x + 0.02, 0.5, 1.5)], 0.015, n=4), 'bark', tile=(0.5, 0.5))
        pts = []
        for j in range(26):                  # 콩 덩굴: 장대를 감고 올라가는 잎
            zz = 0.22 + 1.2 * j / 26
            a = j * 2.3 + rng.uniform(-0.4, 0.4)
            rr_ = 0.05 + 0.05 * rng.random()
            pts.append((x + 0.02 * zz / 1.5 + rr_ * math.cos(a), 0.49 + rr_ * math.sin(a), zz))
        leaf_scatter(P, rng, pts, ['bean', 'leaf', 'bean'], size=(0.1, 0.065, 0.006))
    return P


# ───────────────────────── 가축 ─────────────────────────
def legs_pair(P, path, r, mat, hoof_col='hoof', hoof_r=None, ys=(1, -1), pal_leg=None):
    """다리 (path: y 를 뺀 (x, z) 관절점들, r: 반지름들). 마지막 점 아래에 발굽."""
    for sy in ys:
        pts = [(x, sy * y, z) for (x, y, z) in path]
        bm = tube_bm(pts, r, n=7, ref=(1, 0, 0), cap0=False)
        if pal_leg:
            pal_add(P, bm, pal_leg)
        else:
            P.add_bm(bm, mat, tile=(0.4, 0.4), smooth=True)
        x, y, z = pts[-1]
        hr = hoof_r or r[-1] * 1.12
        hb = lathe_bm([(hr * 1.08, 0.0), (hr, z * 0.55), (hr * 0.9, z + 0.005), (0.0, z + 0.01)], n=7, cap0=True)
        pal_add(P, hb, hoof_col, matrix=T(x + hr * 0.15, y, 0.0))


def eye_pair(P, x, y, z, r=0.012, col='eye'):
    for sy in (1, -1):
        pal_add(P, ellipsoid_bm((x, sy * y, z), (r, r * 0.7, r), nu=5, nv=3), col)


def densify(st, k=2):
    """단면 목록을 Catmull-Rom 으로 촘촘하게 (각 칸 사이에 k 개를 더): 굵기·높이가 부드럽게 이어진다."""
    if len(st) < 3:
        return st
    m = max(len(q) for q in st)
    rows = []
    for q in st:
        c = list(q[0])
        vals = list(q[1:]) + [None] * (m - len(q))
        if len(vals) > 2 and vals[2] is None:
            vals[2] = vals[1]
        if len(vals) > 3 and vals[3] is None:
            vals[3] = 0.0
        rows.append(c + vals)
    width = len(rows[0])

    def cr(a, b, c, d, t):
        return 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t)
    out = []
    n = len(rows)
    for i in range(n - 1):
        a, b, c, d = rows[max(i - 1, 0)], rows[i], rows[i + 1], rows[min(i + 2, n - 1)]
        for j in range(k + 1):
            t = j / (k + 1)
            v = [cr(a[w], b[w], c[w], d[w], t) for w in range(width)]
            out.append(v)
    out.append(rows[-1])
    return [((v[0], v[1], v[2]), *[max(0.0, x) if idx < 3 else x for idx, x in enumerate(v[3:])]) for v in out]


def sheep():
    """양 (몸길이 ~1.1 m, 기갑 ~0.68 m): 덥수룩하고 울퉁불퉁한 크림색 털 몸(촘촘한 고리 + 털 뭉치 잡음), 짙은 얼굴·귀, 가는 짙은 다리."""
    P = Piece('sheep', 4001)
    seed = 17

    def wool(p):   # 큰 덩이(털 뭉치) + 중간 결 + 잔 결
        return 0.04 * noise3(p.x * 3.4, p.y * 3.4, p.z * 3.4, seed + 11) + 0.026 * noise3(p.x * 7, p.y * 7, p.z * 7, seed) + 0.012 * noise3(p.x * 13, p.y * 13, p.z * 13, seed + 5)
    zc = 0.5
    st = [((-0.56, 0, zc + 0.03), 0.04, 0.04, 0.04),
          ((-0.53, 0, zc + 0.03), 0.16, 0.13, 0.15),
          ((-0.44, 0, zc + 0.03), 0.24, 0.18, 0.22, 0.15),
          ((-0.28, 0, zc + 0.02), 0.275, 0.2, 0.25, 0.2),
          ((-0.06, 0, zc + 0.01), 0.285, 0.2, 0.26, 0.2),
          ((0.14, 0, zc + 0.02), 0.27, 0.2, 0.25, 0.2),
          ((0.3, 0, zc + 0.04), 0.23, 0.19, 0.23, 0.15),
          ((0.41, 0, zc + 0.08), 0.18, 0.17, 0.19, 0.1),
          ((0.49, 0, zc + 0.14), 0.13, 0.13, 0.13, 0.05),
          ((0.53, 0, zc + 0.19), 0.06, 0.06, 0.06, 0.0)]
    P.add_bm(loft_bm(densify(st, 2), n=24, disp=wool), 'fleece', tile=(0.3, 0.3), smooth=True)
    # 꼬리: 짧게 늘어진 털 꼬리
    tail = [((-0.5, 0, zc + 0.08), 0.07, 0.07), ((-0.57, 0, zc + 0.02), 0.07, 0.065), ((-0.6, 0, zc - 0.08), 0.055, 0.05), ((-0.61, 0, zc - 0.16), 0.035, 0.032), ((-0.61, 0, zc - 0.19), 0.01, 0.01)]
    P.add_bm(loft_bm(densify(tail, 1), n=10, disp=lambda p: 0.5 * wool(p)), 'fleece', tile=(0.3, 0.3), smooth=True)
    # 머리 (정수리 → 코, 콧등이 둥근 로마 코), 짙은 얼굴
    hd = [((0.49, 0, zc + 0.28), 0.02, 0.02), ((0.52, 0, zc + 0.28), 0.07, 0.07, 0.065), ((0.59, 0, zc + 0.25), 0.07, 0.07, 0.065),
          ((0.66, 0, zc + 0.19), 0.055, 0.058, 0.05), ((0.71, 0, zc + 0.13), 0.042, 0.045, 0.038), ((0.735, 0, zc + 0.1), 0.013, 0.013)]
    pal_add(P, loft_bm(densify(hd, 1), n=12), 'sheep_face')
    # 목덜미 털: 몸 앞에서 머리 밑동까지 잇는 털 목 + 정수리 털 한 줌
    neck = [((0.34, 0, zc + 0.1), 0.16, 0.16), ((0.42, 0, zc + 0.17), 0.14, 0.13), ((0.48, 0, zc + 0.24), 0.105, 0.1), ((0.52, 0, zc + 0.28), 0.08, 0.075), ((0.545, 0, zc + 0.3), 0.03, 0.03)]
    P.add_bm(loft_bm(densify(neck, 1), n=16, disp=lambda p: 0.7 * wool(p)), 'fleece', tile=(0.3, 0.3), smooth=True)
    P.add_bm(ellipsoid_bm((0.53, 0, zc + 0.315), (0.06, 0.055, 0.04), nu=10, nv=6), 'fleece', tile=(0.3, 0.3), smooth=True)
    for sy in (1, -1):   # 옆으로 뻗은 귀
        rot = (Rz(sy * rad(80)) @ Ry(rad(18))).to_3x3()
        pal_add(P, ellipsoid_bm((0.55, sy * 0.105, zc + 0.265), (0.075, 0.032, 0.016), nu=6, nv=4, rot=rot), 'sheep_face')
    eye_pair(P, 0.6, 0.058, zc + 0.255, r=0.011)
    pal_add(P, ellipsoid_bm((0.728, 0, zc + 0.105), (0.018, 0.03, 0.015), nu=6, nv=3), 'nose_pink')
    # 다리 (무릎·뒷무릎 꺾임, 가늘고 짙다)
    legs_pair(P, [(0.26, 0.11, zc - 0.12), (0.28, 0.11, 0.26), (0.27, 0.11, 0.05)], [0.034, 0.019, 0.016], None, pal_leg='sheep_leg', hoof_col='black')
    legs_pair(P, [(-0.32, 0.12, zc - 0.1), (-0.38, 0.12, 0.28), (-0.33, 0.12, 0.05)], [0.04, 0.02, 0.016], None, pal_leg='sheep_leg', hoof_col='black')
    return P


def cow():
    """소 (중세 소는 작다: 기갑 ~1.15 m, 몸길이 ~1.9 m): 곧은 등, 깊은 배, 처진 목살, 낮게 든 넓은 머리, 짧은 뿔, 꼬리 술."""
    P = Piece('cow', 4002)
    # 몸통 + 목 (한 줄 이어진 몸): (중심, 반폭, 위, 아래, 위 좁힘)
    # 뒤쪽 아래(넓적다리·무릎 살)와 앞쪽 아래(가슴뼈)를 몸 윤곽에 넣는다 → 다리가 막대처럼 꽂혀 보이지 않게
    st = [((-0.86, 0, 1.06), 0.02, 0.02, 0.02),
          ((-0.84, 0, 1.06), 0.13, 0.06, 0.16, 0.3),
          ((-0.76, 0, 1.06), 0.21, 0.07, 0.36, 0.35),
          ((-0.62, 0, 1.05), 0.26, 0.08, 0.45, 0.35),
          ((-0.46, 0, 1.04), 0.28, 0.08, 0.46, 0.35),
          ((-0.24, 0, 1.03), 0.3, 0.09, 0.5, 0.4),
          ((0.06, 0, 1.03), 0.31, 0.1, 0.5, 0.4),
          ((0.3, 0, 1.05), 0.27, 0.1, 0.5, 0.35),
          ((0.46, 0, 1.06), 0.21, 0.1, 0.5, 0.3),
          ((0.58, 0, 1.05), 0.16, 0.1, 0.44, 0.2),
          ((0.7, 0, 1.03), 0.13, 0.11, 0.28),
          ((0.8, 0, 1.02), 0.115, 0.1, 0.15),
          ((0.85, 0, 1.01), 0.05, 0.05, 0.05)]
    P.add_bm(loft_bm(st, n=20, expo=2.2), 'hide', tile=(0.45, 0.45), smooth=True)
    for sy in (1, -1):          # 엉덩이뼈 (등 위로 살짝 솟음)
        P.add_bm(ellipsoid_bm((-0.56, sy * 0.17, 1.06), (0.09, 0.07, 0.05), nu=8, nv=5), 'hide', tile=(0.45, 0.45), smooth=True)
    # 머리: 넓은 이마 → 넓은 주둥이, 아래로 숙임 (길이 ~0.45 m)
    hd = [((0.84, 0, 1.14), 0.03, 0.03), ((0.87, 0, 1.13), 0.13, 0.07, 0.11), ((0.93, 0, 1.05), 0.12, 0.06, 0.11),
          ((0.99, 0, 0.96), 0.095, 0.055, 0.09), ((1.04, 0, 0.88), 0.088, 0.055, 0.085), ((1.08, 0, 0.82), 0.09, 0.055, 0.075), ((1.1, 0, 0.79), 0.04, 0.03, 0.03)]
    P.add_bm(loft_bm(hd, n=12, expo=2.4), 'hide', tile=(0.45, 0.45), smooth=True)
    pal_add(P, ellipsoid_bm((1.095, 0, 0.805), (0.035, 0.08, 0.05), nu=8, nv=4), 'pot_dark')
    eye_pair(P, 0.92, 0.112, 1.06, r=0.018)
    for sy in (1, -1):
        rot = (Rz(sy * rad(85)) @ Ry(rad(10))).to_3x3()
        P.add_bm(ellipsoid_bm((0.86, sy * 0.18, 1.09), (0.1, 0.045, 0.02), nu=6, nv=3, rot=rot), 'hide', tile=(0.45, 0.45), smooth=True)
        bm = tube_bm([(0.85, sy * 0.08, 1.17), (0.85, sy * 0.16, 1.19), (0.88, sy * 0.21, 1.25), (0.92, sy * 0.2, 1.3)], [0.03, 0.024, 0.016, 0.006], n=6, ref=(1, 0, 0))
        pal_add(P, bm, 'horn')
    pal_add(P, ellipsoid_bm((-0.4, 0, 0.6), (0.13, 0.12, 0.08), nu=8, nv=4), 'udder')
    bm = tube_bm([(-0.85, 0, 1.06), (-0.9, 0, 0.9), (-0.91, 0, 0.6), (-0.9, 0, 0.45)], [0.035, 0.025, 0.02, 0.018], n=6, ref=(0, 1, 0))
    P.add_bm(bm, 'hide', tile=(0.45, 0.45), smooth=True)
    pal_add(P, ellipsoid_bm((-0.9, 0, 0.4), (0.04, 0.04, 0.09), nu=6, nv=4), 'black')
    legs_pair(P, [(0.42, 0.15, 0.68), (0.43, 0.15, 0.52), (0.43, 0.15, 0.36), (0.44, 0.15, 0.1)], [0.09, 0.065, 0.048, 0.044], 'hide')
    legs_pair(P, [(-0.6, 0.16, 0.7), (-0.64, 0.16, 0.58), (-0.72, 0.16, 0.42), (-0.66, 0.16, 0.1)], [0.1, 0.075, 0.052, 0.044], 'hide')
    return P


def horse():
    """말 (기갑 ~1.42 m, 몸길이 ~1.9 m): 몸에서 활처럼 솟는 목, 숙인 머리, 검은 갈기·꼬리, 가는 다리."""
    P = Piece('horse', 4003)
    st = [((-0.88, 0, 1.22), 0.02, 0.02, 0.02),
          ((-0.86, 0, 1.22), 0.14, 0.1, 0.18, 0.2),
          ((-0.78, 0, 1.21), 0.21, 0.13, 0.36, 0.3),
          ((-0.64, 0, 1.17), 0.24, 0.15, 0.44, 0.3),
          ((-0.48, 0, 1.13), 0.25, 0.16, 0.4, 0.3),
          ((-0.28, 0, 1.08), 0.25, 0.17, 0.33, 0.3),
          ((-0.02, 0, 1.07), 0.255, 0.18, 0.34, 0.3),
          ((0.22, 0, 1.1), 0.24, 0.2, 0.36, 0.3),
          ((0.38, 0, 1.15), 0.21, 0.22, 0.4, 0.25),
          ((0.5, 0, 1.24), 0.17, 0.22, 0.3, 0.2),
          ((0.6, 0, 1.36), 0.13, 0.18, 0.18, 0.2),
          ((0.69, 0, 1.49), 0.105, 0.14, 0.12, 0.2),
          ((0.77, 0, 1.6), 0.09, 0.12, 0.09, 0.15),
          ((0.83, 0, 1.69), 0.075, 0.1, 0.075),
          ((0.86, 0, 1.74), 0.05, 0.05, 0.05)]
    P.add_bm(loft_bm(st, n=20), 'hide', tile=(0.45, 0.45), smooth=True)
    hd = [((0.83, 0, 1.77), 0.03, 0.03), ((0.86, 0, 1.75), 0.08, 0.05, 0.12), ((0.93, 0, 1.64), 0.085, 0.05, 0.11),
          ((1.0, 0, 1.52), 0.07, 0.045, 0.07), ((1.06, 0, 1.42), 0.062, 0.042, 0.055), ((1.1, 0, 1.35), 0.06, 0.045, 0.05), ((1.115, 0, 1.32), 0.02, 0.02, 0.02)]
    P.add_bm(loft_bm(hd, n=12), 'hide', tile=(0.45, 0.45), smooth=True)
    eye_pair(P, 0.93, 0.08, 1.67, r=0.016)
    for sy in (1, -1):
        rot = (Ry(rad(-15)) @ Rx(sy * rad(12))).to_3x3()
        P.add_bm(ellipsoid_bm((0.83, sy * 0.055, 1.86), (0.025, 0.02, 0.075), nu=6, nv=3, rot=rot), 'hide', tile=(0.45, 0.45), smooth=True)
    mane = [((0.38, 0, 1.38), 0.02, 0.03), ((0.5, 0, 1.47), 0.03, 0.06), ((0.62, 0, 1.6), 0.03, 0.065), ((0.73, 0, 1.73), 0.028, 0.06),
            ((0.81, 0, 1.83), 0.02, 0.04), ((0.84, 0, 1.86), 0.01, 0.01)]
    pal_add(P, loft_bm(mane, n=6), 'mane')
    pal_add(P, ellipsoid_bm((0.88, 0, 1.8), (0.07, 0.035, 0.03), nu=6, nv=3, rot=Ry(rad(40)).to_3x3()), 'mane')   # 앞머리
    tail = [((-0.86, 0, 1.2), 0.045, 0.045), ((-0.95, 0, 1.1), 0.06, 0.07), ((-1.0, 0, 0.88), 0.07, 0.07), ((-1.01, 0, 0.62), 0.06, 0.05), ((-1.01, 0, 0.52), 0.02, 0.02)]
    pal_add(P, loft_bm(tail, n=8), 'mane')
    legs_pair(P, [(0.36, 0.14, 0.8), (0.38, 0.14, 0.6), (0.4, 0.14, 0.34), (0.42, 0.14, 0.11)], [0.085, 0.06, 0.04, 0.038], 'hide', hoof_r=0.05, hoof_col='black')
    legs_pair(P, [(-0.62, 0.15, 0.82), (-0.64, 0.15, 0.68), (-0.74, 0.15, 0.5), (-0.64, 0.15, 0.11)], [0.1, 0.075, 0.048, 0.038], 'hide', hoof_r=0.05, hoof_col='black')
    return P


def chicken():
    """닭 (키 ~0.38 m): 밤색 몸, 검은 꽁지, 붉은 볏, 노란 발."""
    P = Piece('chicken', 4004)
    st = [((-0.15, 0, 0.22), 0.02, 0.02), ((-0.12, 0, 0.22), 0.07, 0.06, 0.06), ((-0.05, 0, 0.21), 0.095, 0.08, 0.1),
          ((0.03, 0, 0.21), 0.09, 0.085, 0.095), ((0.09, 0, 0.24), 0.06, 0.07, 0.06), ((0.11, 0, 0.28), 0.04, 0.04, 0.04),
          ((0.125, 0, 0.33), 0.032, 0.032, 0.032), ((0.135, 0, 0.36), 0.03, 0.03, 0.03), ((0.14, 0, 0.38), 0.01, 0.01, 0.01)]
    pal_add(P, loft_bm(st, n=10), 'hen')
    pal_add(P, loft_bm([((-0.1, 0, 0.25), 0.03, 0.04), ((-0.15, 0, 0.3), 0.025, 0.06), ((-0.18, 0, 0.35), 0.012, 0.04), ((-0.19, 0, 0.37), 0.004, 0.01)], n=6), 'hen_dark')
    pal_add(P, loft_bm([((0.12, 0, 0.385), 0.006, 0.01), ((0.14, 0, 0.395), 0.008, 0.022), ((0.16, 0, 0.385), 0.006, 0.012), ((0.17, 0, 0.37), 0.003, 0.004)], n=5), 'comb_red')
    pal_add(P, loft_bm([((0.15, 0, 0.355), 0.01, 0.008), ((0.18, 0, 0.35), 0.002, 0.002)], n=5), 'beak')
    pal_add(P, ellipsoid_bm((0.15, 0, 0.33), (0.01, 0.006, 0.016), nu=5, nv=3), 'comb_red')
    for sy in (1, -1):
        pal_add(P, tube_bm([(0.0, sy * 0.035, 0.14), (0.01, sy * 0.035, 0.0)], 0.007, n=4, ref=(1, 0, 0)), 'beak')
        for a in (-0.5, 0.0, 0.5):
            pal_add(P, tube_bm([(0.01, sy * 0.035, 0.005), (0.01 + 0.04 * math.cos(a), sy * 0.035 + 0.04 * math.sin(a), 0.003)], 0.004, n=3, ref=(0, 0, 1)), 'beak')
    eye_pair(P, 0.14, 0.022, 0.37, r=0.006)
    return P


def duck():
    """오리 (몸길이 ~0.42 m): 물 위에 뜬 자세 — 원점이 물 높이, 몸 아래쪽이 조금 잠긴다. 몸·목은 'down'(장면이 색을 곱함), 부리·눈은 palette."""
    P = Piece('duck', 4005)
    st = [((-0.22, 0, 0.09), 0.01, 0.01), ((-0.2, 0, 0.08), 0.05, 0.03, 0.03), ((-0.12, 0, 0.06), 0.1, 0.06, 0.07),
          ((0.02, 0, 0.05), 0.11, 0.07, 0.08), ((0.12, 0, 0.06), 0.08, 0.06, 0.07), ((0.16, 0, 0.08), 0.04, 0.04, 0.04)]
    P.add_bm(loft_bm(st, n=10), 'down', smooth=True)
    nk = [((0.1, 0, 0.1), 0.04, 0.04), ((0.13, 0, 0.17), 0.03, 0.03), ((0.14, 0, 0.22), 0.035, 0.035), ((0.155, 0, 0.245), 0.03, 0.03), ((0.16, 0, 0.255), 0.01, 0.01)]
    P.add_bm(loft_bm(nk, n=8), 'down', smooth=True)
    pal_add(P, loft_bm([((0.17, 0, 0.235), 0.016, 0.01), ((0.2, 0, 0.228), 0.018, 0.006), ((0.225, 0, 0.222), 0.012, 0.004)], n=6), 'duck_bill')
    eye_pair(P, 0.165, 0.026, 0.245, r=0.005)
    return P


# ───────────────────────── 실행 ─────────────────────────
BUILDERS = [cart, barrel, crate, woodpile, haystack, sacks, wattle_fence, stone_wall, rail_fence, trough, anvil, tool_rack,
            market_goods, cloth_awning, bench, flower_patch, vegetable_bed, sheep, cow, horse, chicken, duck]


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
    dbg = os.environ.get('KIT_DEBUGHASH') == '1'      # 결정성 확인용: 메시·UV 해시를 로그에

    def mesh_hash(o, layer):
        import hashlib
        me = o.data
        co = np.empty(len(me.vertices) * 3, np.float32)
        me.vertices.foreach_get('co', co)
        uv = np.empty(len(me.loops) * 2, np.float32)
        me.uv_layers[layer].data.foreach_get('uv', uv) if layer in me.uv_layers else None
        return hashlib.md5(co.tobytes()).hexdigest()[:8] + '/' + hashlib.md5(uv.tobytes()).hexdigest()[:8]
    if dbg:
        log('HASH before', {o.name: mesh_hash(o, 'UVMap') for o in objs})
    K.make_ao_uvs(objs, margin=0.003)
    if dbg:
        log('HASH ao', {o.name: mesh_hash(o, 'AO') for o in objs})
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
            json.dump({'source': 'tools/blender/kit_props.py', 'units': 'm, [x 길이, 앞뒤 깊이, 높이]',
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
    K.setup_preview(sun_elev=28, sun_az=140, grass=os.path.join(K.TEX, 'leafy_grass_diff_1k.jpg'))
    by = {r.name: r for r in roots}
    LAYOUT = {   # 작은 마당·장터 꾸밈 (x, y, 돌림)
        'woodpile': (-6.5, 2.8, 0.0), 'cart': (-2.0, -2.2, 0.35), 'barrel': (-4.3, 1.4, 0), 'crate': (-3.7, 2.1, 0.4), 'sacks': (-4.6, 0.3, 0.2),
        'haystack': (-11, 6, 0), 'wattle_fence': (-8.5, -1.0, 0.0), 'stone_wall': (-6.4, -1.0, 0.0), 'rail_fence': (-4.15, -1.0, 0.0),
        'trough': (1.5, 3.0, 0.1), 'anvil': (3.4, 2.4, 0.4), 'tool_rack': (5.2, 3.6, 0.0), 'market_goods': (2.0, -1.6, 0.0),
        'cloth_awning': (2.0, -1.3, 0.0), 'bench': (6.5, 0.6, -0.3), 'flower_patch': (8.4, 1.2, 0), 'vegetable_bed': (9.0, 4.2, 0.0),
        'sheep': (-8.5, -4.6, 0.6), 'cow': (-12.5, -3.5, -0.4), 'horse': (-15.5, 0.0, 0.3), 'chicken': (5.0, -1.0, 2.0), 'duck': (7.8, -2.6, 2.6),
    }
    for n, (x, y, rz) in LAYOUT.items():
        if n in by:
            by[n].location = (x, y, 0)
            by[n].rotation_euler = (0, 0, rz)
    shots = [
        ('props_overview', (-2, -17, 7.5), (-3, 1.2, 0.6), 30),
        ('props_animals', (-9.5, -9.5, 1.6), (-12.5, -1.5, 0.75), 40),
        ('props_market', (4.5, -6.8, 1.65), (2.4, 0.0, 0.9), 34),
        ('props_yard', (-1.0, -3.5, 1.7), (-5.5, 1.8, 0.7), 32),
        ('props_garden', (6.6, -1.9, 1.3), (8.8, 2.2, 0.45), 34),
        ('props_sheep', (-7.0, -7.0, 1.1), (-8.5, -4.6, 0.5), 45),
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
        sys.exit(1)               # Blender 가 0 으로 끝나지 않게 (실패를 알린다)
