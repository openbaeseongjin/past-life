# 동아시아 세트 공통 도구 — kit_eastasia.py(건물)·kit_props_eastasia.py(소품·가축)·kit_trees_eastasia.py(대나무·풀)가 함께 쓴다.
# Blender 안의 Python 에서만 돈다. kit_common.py · kit_sa_common.py 는 고치지 않는다 (잉글랜드·남아시아 세트 결과가 그대로이게).
#
# 들어 있는 것:
#   - 색표 EA_PAL (작은 색 부품을 재료 하나 'palette' 로): 단청 초록·주홍, 옹기, 창호지, 볏짚 …
#   - 골기와 무늬 (gen_tile_tex): 수키와(볼록)·암키와(오목) 줄이 경사를 따라 내려가고, 장마다 겹친 턱. 풍화 결은 Poly Haven grey_roof_tiles 밝기를 섞는다.
#   - 곡선 지붕 (roof_ea): 맞배(gable)·우진각(hip)·팔작(hipgable). 경사는 용마루 쪽이 가파르고 처마 쪽이 누운 오목 곡선(curve),
#     처마 귀가 들린다(lift). 팔작은 아래 우진각 치마 + 위 맞배 + 박공 세모(합각).
#   - 용마루·내림마루(ridge_ea), 막새 줄(eave_caps), 서까래(rafters), 살창·창호·쇼지(lattice), 주춧돌·기둥.
# 결정성: recalc_face_normals 를 쓰지 않는다 (감김을 만들 때부터 맞춘다), 난수는 Piece.rng 와 고정 씨앗 RandomState 뿐.
import os, math
import numpy as np
import bpy, bmesh
from mathutils import Vector, Matrix
import kit_common as K
from kit_common import box_vf, temp_obj, fbm, smin, smax
import kit_props as KP
from kit_props import lathe_bm, loft_bm, tube_bm, ellipsoid_bm
from kit_sa_common import prism_ok, solid_ok, bool_cut, add_vf, Tm, Rz, Ry, Rx, lin

rad = math.radians
TP = lambda d: math.tan(rad(d))


# ───────────────────────── 색표 ─────────────────────────
EA_PAL = [
    'vermilion', 'cinnabar', 'dan_green', 'dan_blue', 'dan_ochre', 'white', 'paper', 'black',
    'dark_brown', 'onggi', 'onggi_dark', 'onggi_lid', 'clay', 'iron', 'bronze', 'gold',
    'straw', 'straw_dark', 'rice_gold', 'rope', 'leaf', 'leaf_dark', 'cabbage', 'radish',
    'persimmon', 'pepper_red', 'soy', 'eye', 'hoof', 'horn', 'pig_black', 'pig_skin',
    'hen', 'hen_dark', 'comb', 'beak', 'duck_white', 'duck_brown', 'duck_bill', 'stone_grey',
    'stone_dark', 'lime_white', 'wood_light', 'wood_dark', 'incense', 'cloth_indigo', 'cloth_red', 'cloth_white',
    'cloth_brown', 'lantern', 'soot', 'water_dark', 'moss', 'bamboo_green', 'tile_dark', 'charcoal',
    'flame', 'ash', 'ribbon_red', 'ribbon_blue', 'ribbon_yellow', 'ox_face', 'bean', 'rice_white',
]
EA_RGB = {   # sRGB 0~1
    'vermilion': (0.74, 0.2, 0.1), 'cinnabar': (0.56, 0.16, 0.1), 'dan_green': (0.2, 0.46, 0.4), 'dan_blue': (0.16, 0.28, 0.48),
    'dan_ochre': (0.82, 0.6, 0.22), 'white': (0.92, 0.91, 0.87), 'paper': (0.93, 0.9, 0.82), 'black': (0.045, 0.042, 0.04),
    'dark_brown': (0.15, 0.09, 0.05), 'onggi': (0.3, 0.17, 0.09), 'onggi_dark': (0.15, 0.085, 0.05), 'onggi_lid': (0.36, 0.22, 0.13),
    'clay': (0.55, 0.36, 0.22), 'iron': (0.18, 0.18, 0.19), 'bronze': (0.42, 0.34, 0.2), 'gold': (0.78, 0.6, 0.24),
    'straw': (0.76, 0.64, 0.38), 'straw_dark': (0.52, 0.42, 0.26), 'rice_gold': (0.82, 0.66, 0.3), 'rope': (0.6, 0.5, 0.32),
    'leaf': (0.24, 0.38, 0.14), 'leaf_dark': (0.13, 0.23, 0.09), 'cabbage': (0.5, 0.66, 0.32), 'radish': (0.9, 0.9, 0.84),
    'persimmon': (0.9, 0.42, 0.08), 'pepper_red': (0.66, 0.1, 0.06), 'soy': (0.2, 0.1, 0.05), 'eye': (0.03, 0.025, 0.02),
    'hoof': (0.12, 0.1, 0.08), 'horn': (0.7, 0.64, 0.52), 'pig_black': (0.07, 0.06, 0.06), 'pig_skin': (0.5, 0.36, 0.34),
    'hen': (0.5, 0.24, 0.1), 'hen_dark': (0.16, 0.11, 0.07), 'comb': (0.72, 0.09, 0.07), 'beak': (0.85, 0.62, 0.22),
    'duck_white': (0.88, 0.87, 0.82), 'duck_brown': (0.42, 0.3, 0.18), 'duck_bill': (0.86, 0.56, 0.16), 'stone_grey': (0.5, 0.49, 0.46),
    'stone_dark': (0.3, 0.29, 0.27), 'lime_white': (0.86, 0.85, 0.8), 'wood_light': (0.62, 0.48, 0.32), 'wood_dark': (0.28, 0.18, 0.1),
    'incense': (0.4, 0.3, 0.22), 'cloth_indigo': (0.16, 0.22, 0.4), 'cloth_red': (0.62, 0.14, 0.12), 'cloth_white': (0.86, 0.84, 0.78),
    'cloth_brown': (0.42, 0.3, 0.2), 'lantern': (0.95, 0.85, 0.6), 'soot': (0.09, 0.08, 0.07), 'water_dark': (0.04, 0.05, 0.05),
    'moss': (0.3, 0.38, 0.18), 'bamboo_green': (0.42, 0.52, 0.22), 'tile_dark': (0.2, 0.2, 0.21), 'charcoal': (0.1, 0.1, 0.1),
    'flame': (1.0, 0.75, 0.3), 'ash': (0.55, 0.53, 0.5), 'ribbon_red': (0.78, 0.16, 0.12), 'ribbon_blue': (0.18, 0.32, 0.62),
    'ribbon_yellow': (0.9, 0.74, 0.18), 'ox_face': (0.36, 0.22, 0.12), 'bean': (0.72, 0.6, 0.38), 'rice_white': (0.9, 0.88, 0.8),
}
PAL_CELLS, PAL_PX = 8, 8


def gen_palette(fname='ea_palette.png'):
    n = PAL_CELLS * PAL_PX
    a = np.ones((n, n, 4), np.float32)
    for i, name in enumerate(EA_PAL):
        cx, cy = i % PAL_CELLS, i // PAL_CELLS
        a[cy * PAL_PX:(cy + 1) * PAL_PX, cx * PAL_PX:(cx + 1) * PAL_PX, :3] = EA_RGB[name]
    path = os.path.join(K.BUILD, fname)
    K._save_np(a, path)
    return path


def pal_uv(name):
    i = EA_PAL.index(name)
    return ((i % PAL_CELLS + 0.5) / PAL_CELLS, (i // PAL_CELLS + 0.5) / PAL_CELLS)


def pal_add(P, bm, color, smooth=True, matrix=None):
    uvl = bm.loops.layers.uv.verify()
    uv = pal_uv(color)
    for f in bm.faces:
        for l in f.loops:
            l[uvl].uv = uv
    P.add_bm(bm, 'palette', uv=False, smooth=smooth, matrix=matrix)


def palette_material():
    pm = K.make_material('palette', gen_palette(), None, rough=0.8)
    pm.node_tree.nodes['BASE'].interpolation = 'Closest'
    return pm


def pal_box(P, x0, x1, y0, y1, z0, z1, color, matrix=None):
    pal_add(P, K.bm_from(*box_vf(min(x0, x1), max(x0, x1), min(y0, y1), max(y0, y1), min(z0, z1), max(z0, z1))), color, smooth=False, matrix=matrix)


# ───────────────────────── 골기와 무늬 (만든 텍스처) ─────────────────────────
TILE_U = 1.04      # 텍스처 한 장의 가로 = 수키와 줄 4 (0.26 m 간격)
TILE_V = 1.04      # 세로 = 기와 3 장 (0.347 m)


def gen_tile_tex(key='ea_tile', base=(0.33, 0.335, 0.35), wear=0.5):
    """골기와 지붕 512² : 열마다 볼록한 수키와 + 오목한 암키와 골, 장마다 겹친 턱(그늘). 풍화 결 = grey_roof_tiles 밝기(채도 0).
    돌려주는 것: (색 그림, 노멀 그림) 경로. u = 경사에 가로, v = 경사 따라 (아래 = 처마 쪽)."""
    N = 512
    cols, rows = 4, 3
    y, x = np.mgrid[0:N, 0:N].astype(np.float32)
    u = (x + 0.5) / N * cols                  # 0..4 (줄)
    v = (y + 0.5) / N * rows                  # 0..3 (장)
    fu, fv = u % 1.0, v % 1.0
    iu, iv = np.floor(u), np.floor(v)
    # 높이 (m): 수키와 = 가운데 0.42 폭의 반원통 (0.065), 암키와 = 나머지의 얕은 골 (-0.018)
    cw = 0.21
    dc = np.abs(fu - 0.5)
    cover = np.where(dc < cw, 0.065 * np.sqrt(np.clip(1 - (dc / cw) ** 2, 0, 1)), 0.0)
    fu2 = (fu + 0.5) % 1.0                    # 암키와 가운데 = 줄 경계
    dp = np.abs(fu2 - 0.5)
    pw = 0.5 - cw + 0.03
    pan = np.where(dp < pw, -0.018 * (1 - (dp / pw) ** 2), 0.0)
    h = np.where(dc < cw, cover, pan)
    # 장마다 턱: 위(용마루 쪽 = 그림 위 = v 작은 쪽) 장이 아래 장 위에 얹힌다 → 아래 끝으로 갈수록 조금 높아지는 톱니
    h += 0.012 * fv
    rs = np.random.RandomState(31)
    jit = rs.uniform(-1, 1, (rows + 1, cols * 2 + 2)).astype(np.float32)
    tid = (iv.astype(int), (iu * 2 + (dc < cw)).astype(int))
    tone = 1.0 + 0.08 * jit[tid]
    # 색: 수키와 등은 조금 밝게, 골과 턱 그늘은 어둡게
    lum = np.ones((N, N), np.float32)
    lum *= np.where(dc < cw, 0.9 + 0.22 * np.sqrt(np.clip(1 - (dc / cw) ** 2, 0, 1)), 0.78 + 0.1 * (1 - dp / pw))
    lum *= 0.82 + 0.18 * np.clip(fv / 0.12, 0, 1)          # 턱 밑 그늘
    lum *= tone
    det = K._load_np(os.path.join(K.TEX, 'grey_roof_tiles_diff_1k.jpg'))[..., :3]
    dl = (det * np.array([0.2126, 0.7152, 0.0722], np.float32)).sum(-1)
    dl = dl[::2, ::2][:N, :N]
    dl = dl / max(float(dl.mean()), 1e-3)
    lum *= 1.0 + wear * (dl - 1.0) * 0.6
    col = np.stack([lum * base[0], lum * base[1], lum * base[2], np.ones_like(lum)], -1)
    # 노멀 (높이 기울기, OpenGL: 그림 위 = +v)
    s = N / (TILE_U)                          # 화소/m
    gx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * s / 2
    gy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * s / 2
    nx, ny, nz = -gx * 2.2, gy * 2.2, np.ones_like(h)
    L = np.sqrt(nx * nx + ny * ny + nz * nz)
    nor = np.stack([nx / L * 0.5 + 0.5, ny / L * 0.5 + 0.5, nz / L * 0.5 + 0.5, np.ones_like(h)], -1)
    pc, pn = os.path.join(K.BUILD, key + '_d.png'), os.path.join(K.BUILD, key + '_n.png')
    K._save_np(col.astype(np.float32), pc)
    K._save_np(nor.astype(np.float32), pn)
    return pc, pn


# ───────────────────────── 곡선 지붕 ─────────────────────────
class Roof:
    """곡선 지붕 한 채의 높이 함수와 치수. 좌표: 벽 바깥선 x ∈ [-L/2, L/2], y ∈ [-D/2, D/2] (cy 만큼 앞뒤로 옮길 수 있다).
    H = 벽 바깥선에서 지붕 밑면 높이, pitch = 벽 바깥선 경사(°), t = 두께(연직), oE = 앞뒤 처마, oG = 옆(박공·우진각 끝) 처마.
    curve: 오목함 (용마루 쪽 경사 ×(1+curve), 벽 쪽 ×(1-curve)), lift: 처마 귀 들림 (m), lift_len: 귀 들림이 시작되는 끝에서의 거리 비.
    kind: 'gable' 맞배 · 'hip' 우진각 · 'hipgable' 팔작 (setback = 합각 세모가 끝에서 들어온 거리)."""

    def __init__(self, L, D, H, pitch, t, kind='gable', oE=0.9, oG=0.6, curve=0.3, lift=0.0, lift_len=0.32, cy=0.0, setback=None,
                 hip_pitch=None, noise=0.0, seed=0, flare=0.0, k=0.08):
        self.L, self.D, self.H, self.pitch, self.t, self.kind = L, D, H, pitch, t, kind
        self.oE, self.oG, self.curve, self.lift, self.cy = oE, oG, curve, lift, cy
        self.tp = TP(pitch)
        self.tq = TP(hip_pitch or pitch)
        self.Hu = H + t / math.cos(rad(pitch))
        self.half = D / 2
        self.zr = self.Hu + self.half * self.tp * 1.0      # g(1) = 1 → 벽 바깥선에서 Hu
        self.xe = L / 2 + oG
        self.ye = D / 2 + oE
        self.lift_len = lift_len
        self.noise, self.seed, self.flare, self.k = noise, seed, flare, k
        sb = setback if setback is not None else (D / 2) * 0.55
        self.setback = sb
        self.xg = L / 2 - sb                               # 팔작: 합각 세모 자리

    def g(self, s):
        c = self.curve
        if s <= 1.0:
            return s * (1 + c) - c * s * s
        return 1.0 + (1 - c) * (s - 1) - self.flare * (s - 1) ** 2

    def z_long(self, y):
        d = abs(y - self.cy)
        return self.zr - self.half * self.tp * self.g(d / self.half)

    def z_end(self, x):
        """우진각 끝 경사: 끝 벽 바깥선(|x| = L/2)에서 Hu, 안으로 올라간다. 팔작은 합각(xg)까지."""
        d = abs(x) - (self.L / 2 - self.half)              # 0 = 경사가 용마루에 닿는 곳
        if d <= 0:
            return 1e9
        s = d / self.half                                   # 1 = 끝 벽 바깥선
        return self.zr - self.half * self.tq * self.g(s)

    def lift_at(self, x, y):
        if self.lift <= 0:
            return 0.0
        ax = abs(x) / self.xe
        ay = abs(y - self.cy) / self.ye
        a0 = 1.0 - self.lift_len
        fx = max(0.0, (ax - a0) / self.lift_len)
        fy = max(0.0, (ay - a0) / self.lift_len)
        if self.kind == 'gable':
            # 맞배: 앞뒤 처마 끝(박공 쪽)만 조금
            return self.lift * fx ** 2.2 * min(1.0, max(0.0, (ay - 0.55) / 0.45)) ** 1.5
        # 우진각·팔작: 처마 선이 귀로 갈수록 들린다 (긴 처마·짧은 처마 둘 다)
        e_long = min(1.0, max(0.0, (ay - 0.55) / 0.45)) ** 1.5
        e_end = min(1.0, max(0.0, (ax - 0.55) / 0.45)) ** 1.5
        return self.lift * (fx ** 2.2 * e_long + fy ** 2.2 * e_end) * 0.5 + self.lift * 0.5 * (fx * fy) ** 1.6

    def fz(self, x, y, part='all'):
        z = self.z_long(y)
        if self.kind == 'hip' or (self.kind == 'hipgable' and part == 'skirt'):
            z = smin(z, self.z_end(x), self.k)
        z += self.lift_at(x, y)
        if self.noise:
            z += self.noise * fbm(x * 0.6, y * 0.6, self.seed)
        return z

    def skirt_top(self):
        """팔작: 치마(우진각 끝 경사)가 합각 자리(xg)에서 닿는 높이."""
        return self.z_end(self.xg)


def roof_uv(R, tile_u=TILE_U, tile_v=TILE_V, off=(0.0, 0.0)):
    """골기와 UV: 긴 경사 면 = (x, 용마루에서 잰 경사 거리), 끝 경사 면 = (y, 끝 용마루에서 잰 경사 거리). 기와 줄(v)이 경사를 따라 내려간다."""
    def fn(me, poly):
        vs = [me.vertices[i].co for i in poly.vertices]
        n = poly.normal
        out = []
        long_face = abs(n.y) >= abs(n.x) * 0.9
        for p in vs:
            if long_face:
                d = abs(p.y - R.cy)
                u = p.x
            else:
                d = max(0.0, abs(p.x) - (R.L / 2 - R.half))
                u = p.y
            dz = R.zr - p.z
            s = math.sqrt(d * d + dz * dz)
            out.append((u / tile_u + off[0], -s / tile_v + off[1]))
        return out
    return fn


def _grid(breaks, res):
    """꺾임점들 사이를 res 간격으로 나눈 격자 (꺾임점이 늘 격자점: 지붕 조각끼리 칸 경계가 맞는다)."""
    out = [breaks[0]]
    for a, b in zip(breaks, breaks[1:]):
        n = max(1, int(math.ceil((b - a) / res)))
        out += [a + (b - a) * k / n for k in range(1, n + 1)]
    return out


def roof_mesh(P, R, mat, xa, xb, ya, yb, part='all', res=0.25, bevel=0.012, uvfn=None, keep_xy=None, smooth=False, xbreaks=None):
    xs = _grid(xbreaks or [xa, xb], res)
    ys = _grid([ya, R.cy, yb] if ya < R.cy < yb else [ya, yb], res)
    keep = None
    if keep_xy is not None:
        def keep(i, j):
            return keep_xy((xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2)
    ob = K.heightfield(lambda x, y: R.fz(x, y, part), xs, ys, R.t, bevel_w=bevel, bevel_seg=1, uvfn=uvfn or roof_uv(R), name='roof', keep=keep)
    P.add_obj(ob, mat, keep_uv=True, smooth=smooth)


def roof_ea(P, R, mat='tile', res=0.33, smooth=False, gable_mat='timber', bevel=0.0, uvfn=None):
    """R(Roof) 대로 지붕 면을 짓는다. 팔작이면 위 맞배 + 아래 우진각 치마 + 합각 세모 판. 돌려주는 것: R."""
    if R.kind in ('gable', 'hip'):
        roof_mesh(P, R, mat, -R.xe, R.xe, R.cy - R.ye, R.cy + R.ye, 'all', res, bevel, uvfn, smooth=smooth)
        return R
    # 팔작: 위 맞배 (합각 바깥으로 0.35 m 처마) + 아래 치마 (합각 자리 xg 부터 끝까지, 우진각 꼴)
    #   맞배는 합각 바깥(|x| > xg)에서 치마 윗선(zs)보다 낮은 칸(처마 쪽)을 비운다 → 치마가 이어 받는다 (같은 높이 면이 겹치지 않게).
    #   두 조각의 x 격자는 xg 를 꺾임점으로 함께 가져 칸 경계가 맞는다.
    xg = R.xg
    gx = xg + 0.35
    zs = R.skirt_top()
    roof_mesh(P, R, mat, -gx, gx, R.cy - R.ye, R.cy + R.ye, 'all', res, bevel, uvfn, smooth=smooth, xbreaks=[-gx, -xg, xg, gx],
              keep_xy=lambda x, y: abs(x) < xg or R.z_long(y) > zs)
    for sx in (-1, 1):
        a, b = (xg, R.xe) if sx > 0 else (-R.xe, -xg)
        roof_mesh(P, R, mat, a, b, R.cy - R.ye, R.cy + R.ye, 'skirt', res, bevel, uvfn, smooth=smooth)
        # 합각 세모: 치마 윗선(zs) 위, 맞배 밑면 아래
        yt = R.half * _inv_g(R, (R.zr - zs) / (R.half * R.tp))
        pts = [(R.cy - yt, zs - 0.05)]
        n = 10
        for k in range(n + 1):
            y = R.cy - yt + 2 * yt * k / n
            pts.append((y, R.z_long(y) - R.t / math.cos(rad(R.pitch)) - 0.02))
        pts.append((R.cy + yt, zs - 0.05))
        add_vf(P, prism_ok([(p[0], p[1]) for p in pts], 'x', sx * xg - 0.06, sx * xg + 0.06), gable_mat, tile=1.2)
    return R


def _inv_g(R, gv):
    """g(s) = gv 인 s (0..1) — 이분법."""
    lo, hi = 0.0, 1.5
    for _ in range(40):
        m = (lo + hi) / 2
        if R.g(m) < gv:
            lo = m
        else:
            hi = m
    return (lo + hi) / 2


# ───────────────────────── 용마루·내림마루·막새·서까래 ─────────────────────────
def ridge_line(P, pts, w, h, mat, n=6, expo=4.0):
    """점 줄을 따라 네모진 마루 (위로 볼록). pts = 마루 윗면 가운데 선."""
    st = [((p[0], p[1], p[2] - h / 2), w / 2, h / 2) for p in pts]
    P.add_bm(loft_bm(st, n=n, expo=expo, ref=(0, 0, 1)), mat, tile=(0.8, 0.8), smooth=False)


def ridge_ea(P, R, style='china', mat='ridge', x_half=None, h=0.34, w=0.36, curl=0.55, lime=False):
    """용마루: 지붕 꼭대기를 따라 (x 방향), 양끝이 들린다.
    style: 'china' (양끝 꼬리가 말려 오른 치미꼴) · 'korea' (양끝이 살짝 들리고 흰 양성바름 띠) · 'japan' (곧은 마루 + 끝 귀면 판)."""
    xh = x_half if x_half is not None else (R.xg + 0.35 if R.kind == 'hipgable' else (R.L / 2 - R.half + 0.15 if R.kind == 'hip' else R.xe - 0.05))
    pts = []
    m = 24
    for i in range(m + 1):
        x = -xh + 2 * xh * i / m
        e = max(0.0, (abs(x) - (xh - curl)) / curl) if curl > 0 else 0.0
        up = (0.28 if style == 'china' else 0.14 if style == 'korea' else 0.04) * e ** 2
        pts.append((x, R.cy, R.fz(x, R.cy) + h * 0.55 + up))
    ridge_line(P, pts, w, h, mat)
    if lime:     # 한국 양성바름: 마루 옆면 흰 회 띠 (마루 아래쪽 2/3)
        for sy in (-1, 1):
            band = [(x, R.cy + sy * (w / 2 + 0.012), z - h * 0.18) for (x, _, z) in pts]
            ridge_line(P, band, 0.02, h * 0.6, 'lime', n=4, expo=6)
    ends = []
    q = h / 0.34                  # 마루 크기에 맞춘 끝 장식 배율 (작은 대문·사당 지붕은 작게)
    for sx in (-1, 1):
        x, y, z = pts[-1] if sx > 0 else pts[0]
        if style == 'china':      # 치미꼴 꼬리: 안으로 말린 넓적한 판
            tail = [(x - sx * 0.05 * q, y, z), (x + sx * 0.05 * q, y, z + 0.22 * q), (x, y, z + 0.5 * q), (x - sx * 0.2 * q, y, z + 0.62 * q),
                    (x - sx * 0.32 * q, y, z + 0.55 * q)]
            P.add_bm(loft_bm([(p, 0.09 * q, 0.14 * q * (1 - 0.5 * k / 4)) for k, p in enumerate(tail)], n=6, expo=3.0, ref=(0, 1, 0)), mat, tile=(0.8, 0.8))
        elif style == 'korea':    # 망와: 끝에 세운 반달 판
            P.add_bm(K.bm_from(*prism_ok([(-0.24 * q, -0.1 * q), (0.24 * q, -0.1 * q), (0.2 * q, 0.12 * q), (0.0, 0.24 * q), (-0.2 * q, 0.12 * q)], 'x', -0.04, 0.04)),
                     mat, tile=0.8, matrix=Tm(x + sx * 0.02, y, z + 0.02))
        else:                     # 귀면 기와: 끝에 세운 네모 판 (위가 둥근)
            P.add_bm(K.bm_from(*prism_ok([(-0.26 * q, -0.22 * q), (0.26 * q, -0.22 * q), (0.26 * q, 0.18 * q), (0.14 * q, 0.3 * q), (-0.14 * q, 0.3 * q),
                                          (-0.26 * q, 0.18 * q)], 'x', -0.05, 0.05)), mat, tile=0.8, matrix=Tm(x + sx * 0.03, y, z))
        ends.append((x, y, z))
    return ends


def hip_ridges(P, R, mat='ridge', h=0.24, w=0.26, lift_tip=0.12, lime=False):
    """내림마루(추녀마루): 우진각·팔작의 귀 선을 따라. 팔작은 합각 아래 치마의 귀 선만."""
    out = []
    if R.kind not in ('hip', 'hipgable'):
        return out
    # 귀 선 = 긴 경사와 끝 경사가 만나는 골: 두 경사가 같으면 평면에서 45° (|x| - (L/2 - D/2) = |y - cy|).
    #   우진각은 용마루 끝(d = 0)에서, 팔작은 합각 밑(치마 윗선, d = D/2 - setback)에서 시작해 처마 귀까지.
    d0 = 0.0 if R.kind == 'hip' else max(0.0, R.half - R.setback)
    d1 = min(R.half + R.oE, R.half + R.oG) - 0.06
    base = R.L / 2 - R.half
    for sx in (-1, 1):
        for sy in (-1, 1):
            pts = []
            m = 16
            for i in range(m + 1):
                t = i / m
                d = d0 + (d1 - d0) * t
                x, y = sx * (base + d), R.cy + sy * d
                z = R.fz(x, y, 'skirt') + h * 0.42 + lift_tip * t ** 3
                pts.append((x, y, z))
            ridge_line(P, pts, w, h, mat, n=6, expo=4.0)
            out.append(pts[-1])
    return out


def eave_caps(P, R, sides=('front', 'back'), spacing=0.26, r=0.075, color='tile_dark', part='all', xlim=None, skirt=False):
    """막새: 처마 끝 수키와 마구리 (둥근 판). 앞뒤 처마(와 우진각·팔작 끝 처마)."""
    for side in sides:
        if side in ('front', 'back'):
            sy = -1 if side == 'front' else 1
            y = R.cy + sy * R.ye
            xa, xb = xlim if xlim else (-R.xe + 0.12, R.xe - 0.12)
            n = max(1, int((xb - xa) / spacing))
            for k in range(n + 1):
                x = xa + (xb - xa) * k / n
                z = R.fz(x, y - sy * 0.02, 'skirt' if skirt else part) - R.t * 0.45
                M = Tm(x, y + sy * 0.015, z) @ Rx(rad(90) * -sy)
                pal_add(P, lathe_bm([(r, 0.0), (r, 0.035), (0.0, 0.035)], n=6, cap0=True), color, smooth=False, matrix=M)
        else:
            sx = -1 if side == 'left' else 1
            x = sx * R.xe
            ya, yb = R.cy - R.ye + 0.12, R.cy + R.ye - 0.12
            n = max(1, int((yb - ya) / spacing))
            for k in range(n + 1):
                y = ya + (yb - ya) * k / n
                z = R.fz(x - sx * 0.02, y, 'skirt') - R.t * 0.45
                M = Tm(x + sx * 0.015, y, z) @ Ry(rad(90) * sx)
                pal_add(P, lathe_bm([(r, 0.0), (r, 0.035), (0.0, 0.035)], n=6, cap0=True), color, smooth=False, matrix=M)


def rafters(P, R, sides=('front', 'back'), spacing=0.36, r=0.055, mat='timber', end_color=None, xlim=None, part='all', double=False):
    """서까래: 벽(도리) 위에서 처마 끝까지 처마 밑으로 보이는 둥근 각재. end_color 면 마구리에 단청 색 원."""
    for side in sides:
        sy = -1 if side == 'front' else 1
        xa, xb = xlim if xlim else (-R.L / 2 + 0.1, R.L / 2 - 0.1)
        n = max(1, int((xb - xa) / spacing))
        for k in range(n + 1):
            x = xa + (xb - xa) * k / n
            y0 = R.cy + sy * (R.half - 0.25)
            y1 = R.cy + sy * (R.ye - 0.12)
            z0 = R.fz(x, y0, part) - R.t / math.cos(rad(R.pitch)) - r * 1.1
            z1 = R.fz(x, y1, part) - R.t / math.cos(rad(R.pitch)) - r * 1.1
            P.add_bm(tube_bm([(x, y0, z0), (x, y1, z1)], r, n=6, ref=(1, 0, 0), cap0=False, cap1=end_color is None), mat, tile=(0.5, 0.5), smooth=True)
            if end_color:
                d = Vector((0, y1 - y0, z1 - z0)).normalized()
                q = Vector((0, 0, 1)).rotation_difference(d)
                pal_add(P, lathe_bm([(0.0, 0.0), (r * 1.02, 0.0), (r * 1.02, 0.012), (0.0, 0.012)], n=6), end_color, smooth=False,
                        matrix=Tm(x, y1, z1) @ q.to_matrix().to_4x4())


# ───────────────────────── 기둥·주춧돌·기단 ─────────────────────────
def post(P, x, y, z0, z1, r=0.13, mat='timber', round_=True, base='stone', base_h=0.18):
    """기둥 + 주춧돌. round_: 둥근 기둥(두리기둥), 아니면 네모(각기둥)."""
    if base:
        P.add_bm(K.bm_from(*box_vf(x - r * 1.6, x + r * 1.6, y - r * 1.6, y + r * 1.6, z0 - 0.05, z0 + base_h)), base, tile=0.8, bevel=0.03)
    zb = z0 + (base_h if base else 0.0)
    if round_:
        P.cyl(r, r * 0.94, z1 - zb, mat, n=10, matrix=Tm(x, y, zb), tile=0.8, caps=False)
    else:
        P.box(x - r, x + r, y - r, y + r, zb, z1, mat, tile=1.0, bevel=0.012, grain=None)


def plinth(P, x0, x1, y0, y1, z0, z1, mat='stone', steps=None, step_mat=None, bevel=0.03):
    """기단 (돌 단). steps = [(가운데 x, 폭, 쪽 '-y'|'+y'|'-x'|'+x', 칸 수)]."""
    P.box(x0, x1, y0, y1, z0, z1, mat, tile=1.6, bevel=bevel)
    for (cx, w, side, n) in steps or []:
        h = (z1 - z0) / (n + 1)
        for k in range(n):
            d = 0.32 * (n - k)
            zt = z0 + h * (k + 1)
            if side == '-y':
                P.box(cx - w / 2, cx + w / 2, y0 - d, y0, z0, zt, step_mat or mat, tile=1.2, bevel=0.02)
            elif side == '+y':
                P.box(cx - w / 2, cx + w / 2, y1, y1 + d, z0, zt, step_mat or mat, tile=1.2, bevel=0.02)
            elif side == '-x':
                P.box(x0 - d, x0, cx - w / 2, cx + w / 2, z0, zt, step_mat or mat, tile=1.2, bevel=0.02)
            else:
                P.box(x1, x1 + d, cx - w / 2, cx + w / 2, z0, zt, step_mat or mat, tile=1.2, bevel=0.02)


# ───────────────────────── 살창·창호·쇼지 ─────────────────────────
def lattice(F, cuts, c, w, h, z0, depth, pattern='ttisal', frame='timber', bar='timber', paper='paper', bar_w=0.022, leaves=2, open_=0.0, sill=None):
    """살문·살창: 벽 F 에 구멍(c 가운데, 폭 w, 높이 h, 밑 z0)을 내고, 안쪽 depth 에 종이(밤에 불빛), 앞에 문틀·살.
    pattern: 'ttisal' (한국 띠살: 촘촘한 세로살 + 위·가운데·아래 가로 띠) · 'grid' (네모 격자 0.12) · 'shoji' (쇼지: 넓은 격자 0.28×0.32)
             · 'bars' (세로살만, 부엌 살창) · 'plank' (판문).
    leaves: 문짝 수 (가운데 문울거미), open_: 가운데를 이만큼 밀어 연다 (쇼지)."""
    P = F.P
    x0, x1 = c - w / 2, c + w / 2
    cuts.append(F.cutter(x0, x1, z0, z0 + h, depth))
    if paper == 'glass' or pattern == 'plank':
        F.box(x0, x1, depth - 0.02, depth + 0.03, z0, z0 + h, 'glass', tile=1.0)
    yb = 0.06
    # 문틀 (벽면에서 조금 나옴)
    fw = 0.075
    F.box(x0 - fw, x0, -0.05, 0.12, z0, z0 + h, frame, tile=1.0, bevel=0.006)
    F.box(x1, x1 + fw, -0.05, 0.12, z0, z0 + h, frame, tile=1.0, bevel=0.006)
    F.box(x0 - fw, x1 + fw, -0.05, 0.12, z0 + h, z0 + h + fw, frame, tile=(1.6, 0.8), bevel=0.006, grain='x')
    F.box(x0 - fw, x1 + fw, -0.05, 0.12, z0 - (sill if sill is not None else fw), z0, frame, tile=(1.6, 0.8), bevel=0.006, grain='x')
    if pattern == 'plank':
        lw = w / leaves
        for k in range(leaves):
            a = x0 + k * lw
            F.box(a + 0.004, a + lw - 0.004, yb - 0.02, yb + 0.02, z0, z0 + h, 'planks', tile=1.2, bevel=0.004)
            for zz in (0.18, h * 0.5, h - 0.25):
                F.box(a + 0.04, a + lw - 0.04, yb - 0.04, yb - 0.02, z0 + zz, z0 + zz + 0.06, frame, tile=1.0)
        return
    # 종이: 살 바로 뒤 (구멍 안)
    F.box(x0, x1, yb + 0.014, yb + 0.02, z0, z0 + h, paper, tile=1.0)
    lw = w / leaves
    for k in range(leaves):
        a, b = x0 + k * lw, x0 + (k + 1) * lw
        if open_ and k == leaves - 1:
            a, b = a - open_, b - open_
        yy = yb - (0.03 if (open_ and k == leaves - 1) else 0.0)
        mw = 0.045                                     # 문울거미
        F.box(a, a + mw, yy - 0.02, yy + 0.012, z0, z0 + h, frame, tile=1.0)
        F.box(b - mw, b, yy - 0.02, yy + 0.012, z0, z0 + h, frame, tile=1.0)
        F.box(a, b, yy - 0.02, yy + 0.012, z0 + h - mw, z0 + h, frame, tile=1.0)
        F.box(a, b, yy - 0.02, yy + 0.012, z0, z0 + mw * 1.6, frame, tile=1.0)
        ia, ib, iz0, iz1 = a + mw, b - mw, z0 + mw * 1.6, z0 + h - mw
        if pattern in ('ttisal', 'bars'):
            nv = max(2, int((ib - ia) / (0.075 if pattern == 'ttisal' else 0.1)))
            for q in range(1, nv):
                x = ia + (ib - ia) * q / nv
                F.box(x - bar_w / 2, x + bar_w / 2, yy - 0.012, yy + 0.008, iz0, iz1, bar, tile=1.0)
            if pattern == 'ttisal':
                for zc in (iz0 + 0.12, (iz0 + iz1) / 2, iz1 - 0.12):
                    for dz in (-0.05, 0.0, 0.05):
                        F.box(ia, ib, yy - 0.014, yy + 0.008, zc + dz - bar_w / 2, zc + dz + bar_w / 2, bar, tile=1.0)
        else:
            gu, gv = (0.12, 0.12) if pattern == 'grid' else (0.27, 0.32)
            nu = max(1, int(round((ib - ia) / gu)))
            nvv = max(1, int(round((iz1 - iz0) / gv)))
            for q in range(1, nu):
                x = ia + (ib - ia) * q / nu
                F.box(x - bar_w / 2, x + bar_w / 2, yy - 0.012, yy + 0.008, iz0, iz1, bar, tile=1.0)
            for q in range(1, nvv):
                z = iz0 + (iz1 - iz0) * q / nvv
                F.box(ia, ib, yy - 0.012, yy + 0.008, z - bar_w / 2, z + bar_w / 2, bar, tile=1.0)
            if pattern == 'shoji':     # 쇼지 아래 판 (腰板)
                F.box(ia, ib, yy - 0.012, yy + 0.016, iz0, iz0 + 0.3, frame, tile=1.0)


# ───────────────────────── 기타 ─────────────────────────
def crock(P, M, s=1.0, color='onggi', lid=True):
    """옹기 항아리 (장독): 어깨가 넓고 입이 좁은 몸 + 뚜껑."""
    prof = [(0.0, 0.0), (0.13, 0.0), (0.2, 0.08), (0.255, 0.22), (0.26, 0.32), (0.235, 0.42), (0.17, 0.5), (0.13, 0.53), (0.135, 0.555), (0.12, 0.56)]
    pal_add(P, lathe_bm([(r * s, z * s) for r, z in prof], n=16, cap0=False), color, smooth=True, matrix=M)
    if lid:
        lp = [(0.0, 0.61), (0.06, 0.6), (0.15, 0.575), (0.165, 0.555), (0.15, 0.55), (0.0, 0.565)]
        pal_add(P, lathe_bm([(r * s, z * s) for r, z in lp], n=16), 'onggi_lid' if color == 'onggi' else color, smooth=True, matrix=M)
