# 남아시아 세트 공통 도구 — kit_southasia.py(건물)·kit_props_southasia.py(소품·가축)·kit_trees_southasia.py(야자·대나무·풀)가 함께 쓴다.
# Blender 안의 Python 에서만 돈다. kit_common.py 는 고치지 않는다 (잉글랜드 세트 결과가 그대로이게).
#
# 결정성: recalc_face_normals 를 쓰지 않는다 (돌릴 때마다 면 고리 시작점이 바뀌어 UV 순서가 달라질 수 있다).
#   대신 감김을 만들 때부터 바깥으로 맞춘다: box_vf(이미 바깥), prism_ok(부호 넓이·부호 부피로 맞춤),
#   bool_cut(자르개도 같은 방법으로 감김을 맞춘 뒤 EXACT 불리언).
import os, math
import numpy as np
import bpy, bmesh
from mathutils import Vector, Matrix
import kit_common as K
from kit_common import box_vf, temp_obj, kill

rad = math.radians


# ───────────────────────── 색표 (작은 색 부품을 재료 하나로) ─────────────────────────
SA_PAL = [
    'vermilion', 'saffron', 'turmeric', 'chili', 'lentil', 'rice', 'brass', 'brass_dark',
    'clay_pot', 'clay_dark', 'leaf_dark', 'leaf', 'leaf_light', 'marigold', 'marigold_red', 'white',
    'black', 'dark_brown', 'horn', 'nose_pink', 'comb_red', 'beak', 'hen', 'hen_dark',
    'rope', 'jute', 'indigo', 'madder', 'cotton', 'green_dye', 'eye', 'hoof',
    'zebu_face', 'goat_ear', 'straw', 'wicker', 'coconut', 'coconut_husk', 'banana', 'onion',
    'stem', 'flame', 'soot', 'iron', 'tulsi', 'ghee', 'pink', 'stone_grey',
    'dung', 'hay_pale', 'kans', 'grass_dry', 'palm_dead', 'bamboo_leaf', 'coir', 'buff_horn',
]
SA_RGB = {   # sRGB 0~1
    'vermilion': (0.86, 0.22, 0.08), 'saffron': (0.95, 0.55, 0.12), 'turmeric': (0.92, 0.68, 0.12), 'chili': (0.62, 0.1, 0.06),
    'lentil': (0.85, 0.55, 0.25), 'rice': (0.9, 0.87, 0.78), 'brass': (0.78, 0.6, 0.26), 'brass_dark': (0.5, 0.37, 0.15),
    'clay_pot': (0.62, 0.33, 0.19), 'clay_dark': (0.36, 0.18, 0.1), 'leaf_dark': (0.13, 0.24, 0.08), 'leaf': (0.23, 0.38, 0.12),
    'leaf_light': (0.45, 0.58, 0.2), 'marigold': (0.98, 0.62, 0.08), 'marigold_red': (0.9, 0.36, 0.06), 'white': (0.92, 0.9, 0.85),
    'black': (0.05, 0.045, 0.04), 'dark_brown': (0.14, 0.08, 0.045), 'horn': (0.74, 0.68, 0.56), 'nose_pink': (0.5, 0.36, 0.34),
    'comb_red': (0.72, 0.09, 0.07), 'beak': (0.85, 0.62, 0.22), 'hen': (0.5, 0.24, 0.1), 'hen_dark': (0.16, 0.11, 0.07),
    'rope': (0.6, 0.5, 0.33), 'jute': (0.7, 0.58, 0.38), 'indigo': (0.16, 0.22, 0.42), 'madder': (0.6, 0.16, 0.12),
    'cotton': (0.86, 0.83, 0.74), 'green_dye': (0.24, 0.42, 0.24), 'eye': (0.03, 0.025, 0.02), 'hoof': (0.12, 0.1, 0.08),
    'zebu_face': (0.42, 0.4, 0.38), 'goat_ear': (0.3, 0.2, 0.14), 'straw': (0.78, 0.66, 0.38), 'wicker': (0.55, 0.42, 0.24),
    'coconut': (0.42, 0.28, 0.12), 'coconut_husk': (0.52, 0.5, 0.18), 'banana': (0.88, 0.76, 0.22), 'onion': (0.66, 0.3, 0.3),
    'stem': (0.33, 0.42, 0.16), 'flame': (1.0, 0.75, 0.3), 'soot': (0.09, 0.08, 0.07), 'iron': (0.2, 0.2, 0.21),
    'tulsi': (0.2, 0.32, 0.12), 'ghee': (0.95, 0.82, 0.42), 'pink': (0.86, 0.45, 0.55), 'stone_grey': (0.48, 0.46, 0.43),
    'dung': (0.36, 0.3, 0.24), 'hay_pale': (0.8, 0.72, 0.5), 'kans': (0.9, 0.88, 0.82), 'grass_dry': (0.66, 0.56, 0.34),
    'palm_dead': (0.45, 0.33, 0.19), 'bamboo_leaf': (0.36, 0.48, 0.16), 'coir': (0.4, 0.27, 0.15), 'buff_horn': (0.16, 0.14, 0.12),
}
PAL_CELLS = 8
PAL_PX = 8


def gen_palette(fname='sa_palette.png'):
    n = PAL_CELLS * PAL_PX
    a = np.ones((n, n, 4), np.float32)
    for i, name in enumerate(SA_PAL):
        cx, cy = i % PAL_CELLS, i // PAL_CELLS
        a[cy * PAL_PX:(cy + 1) * PAL_PX, cx * PAL_PX:(cx + 1) * PAL_PX, :3] = SA_RGB[name]
    path = os.path.join(K.BUILD, fname)
    K._save_np(a, path)
    return path


def pal_uv(name):
    i = SA_PAL.index(name)
    return ((i % PAL_CELLS + 0.5) / PAL_CELLS, (i // PAL_CELLS + 0.5) / PAL_CELLS)


def pal_set(bm, name):
    uvl = bm.loops.layers.uv.verify()
    uv = pal_uv(name)
    for f in bm.faces:
        for l in f.loops:
            l[uvl].uv = uv
    return bm


def pal_add(P, bm, color, smooth=True, matrix=None):
    pal_set(bm, color)
    P.add_bm(bm, 'palette', uv=False, smooth=smooth, matrix=matrix)


def palette_material():
    pm = K.make_material('palette', gen_palette(), None, rough=0.8)
    pm.node_tree.nodes['BASE'].interpolation = 'Closest'
    return pm


# ───────────────────────── 감김이 맞는 도형 ─────────────────────────
def _signed_area(poly):
    s = 0.0
    for i in range(len(poly)):
        x0, y0 = poly[i]
        x1, y1 = poly[(i + 1) % len(poly)]
        s += x0 * y1 - x1 * y0
    return s / 2


def signed_volume(v, f):
    s = 0.0
    for face in f:
        p0 = Vector(v[face[0]])
        for k in range(1, len(face) - 1):
            p1, p2 = Vector(v[face[k]]), Vector(v[face[k + 1]])
            s += p0.dot(p1.cross(p2))
    return s / 6


def orient_closed(v, f):
    """닫힌 덩어리의 면 감김이 한결같다면(이웃 면끼리 맞물림) 부피가 음수일 때 모두 뒤집는다 → 바깥."""
    if signed_volume(v, f) < 0:
        f = [tuple(reversed(face)) for face in f]
    return v, f


def prism_ok(poly, axis, a0, a1):
    """kit_common.prism_vf 와 같은 기둥이지만 뚜껑까지 감김이 바깥으로 맞다 (단순 다각형이면 볼록이 아니어도 된다)."""
    if _signed_area(poly) < 0:
        poly = list(reversed(poly))
    n = len(poly)

    def P(p, a):
        if axis == 'y':
            return (p[0], a, p[1])
        if axis == 'x':
            return (a, p[0], p[1])
        return (p[0], p[1], a)
    v = [P(p, a0) for p in poly] + [P(p, a1) for p in poly]
    f = [tuple(range(n - 1, -1, -1)), tuple(range(n, 2 * n))]
    for i in range(n):
        j = (i + 1) % n
        f.append((i, j, n + j, n + i))
    return orient_closed(v, f)


def ring_ok(ro, ri, z0, z1, n=20, a0=0.0):
    """두꺼운 고리 (바깥 ro, 안 ri). kit_england.ring_vf 와 같은 꼴, 감김을 맞춘 것."""
    v = []
    for r_, z in ((ro, z0), (ro, z1), (ri, z1), (ri, z0)):
        for k in range(n):
            a = a0 + 2 * math.pi * k / n
            v.append((r_ * math.cos(a), r_ * math.sin(a), z))
    f = []
    for ring in range(4):
        b0, b1 = ring * n, ((ring + 1) % 4) * n
        for k in range(n):
            k1 = (k + 1) % n
            f.append((b0 + k, b0 + k1, b1 + k1, b1 + k))
    return orient_closed(v, f)


def frustum_ok(cx, cy, w0, d0, z0, w1, d1, z1, dy1=0.0):
    v = [(cx - w0 / 2, cy - d0 / 2, z0), (cx + w0 / 2, cy - d0 / 2, z0), (cx + w0 / 2, cy + d0 / 2, z0), (cx - w0 / 2, cy + d0 / 2, z0),
         (cx - w1 / 2, cy + dy1 - d1 / 2, z1), (cx + w1 / 2, cy + dy1 - d1 / 2, z1), (cx + w1 / 2, cy + dy1 + d1 / 2, z1), (cx - w1 / 2, cy + dy1 + d1 / 2, z1)]
    f = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    return orient_closed(v, f)


def merge_vf(parts):
    vs, fs = [], []
    for v, f in parts:
        o = len(vs)
        vs += list(v)
        fs += [tuple(i + o for i in face) for face in f]
    return vs, fs


def solid_ok(parts, name='solid'):
    """(v,f) 여러 개 (각각 감김이 맞은 것) → 오브젝트 하나. recalc_face_normals 없이."""
    vs, fs = merge_vf(parts)
    me = bpy.data.meshes.new(name)
    me.from_pydata(vs, [], fs)
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def bool_cut(obj, cutters, op='DIFFERENCE'):
    """kit_common.boolean_cut 과 같지만 자르개 감김을 이미 맞춘 것으로 (recalc 없이) EXACT 불리언."""
    if not cutters:
        return
    vs, fs = merge_vf(cutters)
    cme = bpy.data.meshes.new('cutter')
    cme.from_pydata(vs, [], fs)
    cme.update()
    c = bpy.data.objects.new('cutter', cme)
    bpy.context.scene.collection.objects.link(c)
    c.hide_render = True
    mod = obj.modifiers.new('cut', 'BOOLEAN')
    mod.operation = op
    mod.solver = 'EXACT'
    mod.use_self = True           # 자르개끼리 겹친다 (안뜰·통로·문 상자): 겹친 자르개도 바르게 뺀다
    mod.object = c
    dg = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev)
    old = obj.data
    obj.modifiers.clear()
    obj.data = me
    bpy.data.meshes.remove(old)
    kill(c)


def wall_ok(P, parts, mat, cutters, tile=2.2, bevel=0.0, bevel_seg=2, off=None):
    """벽 덩어리: 감김 맞춘 기둥들 → 문·창 자르기 → (흙벽은) 둥근 모서리 → 조각에 붙인다."""
    ob = solid_ok(parts, 'wall')
    if cutters:
        bool_cut(ob, cutters)
    if bevel > 0:
        bv = ob.modifiers.new('bev', 'BEVEL')
        bv.width = bevel
        bv.segments = bevel_seg
        bv.limit_method = 'ANGLE'
        bv.angle_limit = rad(50)
        bv.harden_normals = False
    P.add_obj(ob, mat, tile=tile, off=off)


def add_vf(P, vf, mat, tile=2.0, matrix=None, bevel=0.0, smooth=False, grain=None, off=None):
    v, f = vf
    P.add_bm(K.bm_from(v, f), mat, tile, matrix, bevel, smooth=smooth, grain=grain, off=off)


# ───────────────────────── 벽면 틀 (kit_england.Face 와 같은 약속) ─────────────────────────
class Face:
    """벽면 하나의 로컬 틀: x = 벽 따라, z = 위, 로컬 -y = 바깥. plane = 벽면 좌표."""

    def __init__(self, P, side, plane, tiles=None):
        self.P, self.side = P, side
        rot = {'-y': 0.0, '+y': math.pi, '-x': -math.pi / 2, '+x': math.pi / 2}[side]
        T = (0, plane, 0) if side in ('-y', '+y') else (plane, 0, 0)
        self.M = Matrix.Translation(T) @ Matrix.Rotation(rot, 4, 'Z')
        self.R3 = self.M.to_3x3()
        self.tiles = tiles or {}

    def loc(self, c):
        return {'-y': c, '+y': -c, '-x': -c, '+x': c}[self.side]

    def pt(self, x, y, z):
        return self.M @ Vector((x, y, z))

    def box(self, x0, x1, y0, y1, z0, z1, mat, **kw):
        kw.setdefault('tile', self.tiles.get(mat, 2.0))
        self.P.box(x0, x1, y0, y1, z0, z1, mat, matrix=self.M, **kw)

    def beam(self, xa, ya, za, xb, yb, zb, w, h, mat='timber_dark', bevel=0.01):
        self.P.beam(self.pt(xa, ya, za), self.pt(xb, yb, zb), w, h, mat, up=self.R3 @ Vector((0, -1, 0)), bevel=bevel)

    def post(self, x, y, z0, z1, r, mat='bamboo', n=8):
        M = self.M @ Matrix.Translation((x, y, z0))
        self.P.cyl(r, r * 0.94, z1 - z0, mat, n=n, matrix=M, tile=(0.6), caps=True)

    def cutter(self, x0, x1, z0, z1, depth, arch=None):
        if arch == 'round':
            v, f = prism_ok(round_poly(x0, x1, z0, z1), 'y', -0.8, depth)
        elif arch == 'cusp':
            v, f = prism_ok(cusp_poly(x0, x1, z0, z1), 'y', -0.8, depth)
        else:
            v, f = box_vf(x0, x1, -0.8, depth, z0, z1)
        return [tuple(self.M @ Vector(p)) for p in v], f

    def panel(self, poly, y0, y1, mat, tile=1.0):
        """벽면 로컬 (x, z) 다각형을 y0~y1 두께로 (문 안 어둠·창 유리 등)."""
        v, f = prism_ok(poly, 'y', y0, y1)
        add_vf(self.P, ([tuple(self.M @ Vector(p)) for p in v], f), mat, tile=tile)


def round_poly(x0, x1, z0, zs, n=9):
    """반원 아치 단면: 아래 z0, 아치가 시작하는 높이 zs."""
    w = (x1 - x0) / 2
    xc = (x0 + x1) / 2
    pts = [(x0, z0), (x1, z0)]
    for k in range(n + 1):
        a = math.pi * k / n
        pts.append((xc + w * math.cos(a), zs + w * math.sin(a)))
    return pts


def cusp_poly(x0, x1, z0, zs, n=5):
    """살짝 뾰족한 아치 (무굴·라지푸트 시대 문틀 같은 일반형): 두 원호가 꼭대기에서 만난다."""
    w = x1 - x0
    xc = (x0 + x1) / 2
    r = w * 0.62
    pts = [(x0, z0), (x1, z0), (x1, zs)]
    # 오른쪽 호: 중심 (x1 - r, zs)
    cx = x1 - r
    top_a = math.acos((xc - cx) / r)
    for k in range(1, n + 1):
        a = top_a * k / n
        pts.append((cx + r * math.cos(a), zs + r * math.sin(a)))
    cx2 = x0 + r
    for k in range(n - 1, 0, -1):
        a = math.pi - top_a * k / n
        pts.append((cx2 + r * math.cos(a), zs + r * math.sin(a)))
    pts.append((x0, zs))
    return pts


# ───────────────────────── 문·창 (남아시아 마을 일반형) ─────────────────────────
def door_sa(F, cuts, c, w, h, z0, depth, leaves='closed', ajar=0.0, frame=0.11, arch=None, step=None, lime_frame=False, mat_frame='timber_dark', dark=True):
    """두 짝 나무문: 두꺼운 문틀(문설주·인방) + 판자 문짝(띠장·쇠못 머리) + 안쪽 어둠('glass': 밤에 불빛).
    leaves: 'closed' 닫힘 / 'ajar' 한 짝 조금 엶 / 'open' 두 짝 안으로 엶 (안 어둠이 보인다)."""
    P = F.P
    x0, x1 = c - w / 2, c + w / 2
    cuts.append(F.cutter(x0, x1, z0, z0 + h, depth, arch=arch))
    # 안 어둠: 문 깊이 뒤 (통로 대문은 dark=False: 뒤가 트여 있다)
    if dark:
        F.box(x0, x1, depth - 0.02, depth + 0.03, z0, z0 + h + (w / 2 if arch else 0.0), 'glass', tile=1.0)
    # 문틀 (벽면에서 조금 나옴)
    fm = mat_frame
    F.box(x0 - frame, x0, -0.04, 0.16, z0, z0 + h, fm, tile=1.2, bevel=0.01, grain='x')
    F.box(x1, x1 + frame, -0.04, 0.16, z0, z0 + h, fm, tile=1.2, bevel=0.01, grain='x')
    if not arch:
        F.box(x0 - frame - 0.08, x1 + frame + 0.08, -0.05, 0.18, z0 + h, z0 + h + 0.16, fm, tile=(1.6, 0.8), bevel=0.012, grain='x')
    if lime_frame:     # 문 둘레 석회 띠 (흙벽 집의 흔한 꾸밈): 양옆 + 위 띠 (구멍은 막지 않는다)
        a, b, top = x0 - frame - 0.16, x1 + frame + 0.16, z0 + h + (w / 2 if arch else 0.0) + 0.32
        F.box(a, x0 - frame, -0.012, 0.02, z0, top, 'mud_lime', tile=1.4)
        F.box(x1 + frame, b, -0.012, 0.02, z0, top, 'mud_lime', tile=1.4)
        F.box(x0 - frame, x1 + frame, -0.012, 0.02, top - 0.32 + (0.16 if not arch else 0.0), top, 'mud_lime', tile=1.4)
    # 문짝
    lw = w / 2
    dz = 0.025
    yy = depth * 0.45
    for side in (-1, 1):
        hx = x0 if side < 0 else x1
        if leaves == 'open':
            a = rad(80)
        elif leaves == 'ajar' and side > 0:
            a = ajar or rad(28)
        else:
            a = 0.0
        # 안쪽(+y)으로 연다: 왼짝(경첩 x0, +x 로 뻗음)은 +a, 오른짝(경첩 x1, -x 로 뻗음)은 -a
        M = F.M @ Matrix.Translation((hx, yy, z0 + dz)) @ Matrix.Rotation(a if side < 0 else -a, 4, 'Z')
        xa, xb = (0.0, lw - 0.006) if side < 0 else (-(lw - 0.006), 0.0)
        hh = h - 2 * dz
        P.box(xa, xb, -0.025, 0.025, 0, hh, 'planks', matrix=M, bevel=0.004, tile=1.4)
        for zz in (0.22, hh * 0.5, hh - 0.3):     # 띠장
            P.box(xa + 0.03, xb - 0.03, -0.045, -0.025, zz, zz + 0.07, 'timber_dark', matrix=M, bevel=0.004, tile=1.0)
        for zz in (0.25, hh * 0.5 + 0.035, hh - 0.265):   # 쇠못 머리 (띠장 위)
            for k in range(3):
                xx = xa + (xb - xa) * (0.22 + 0.28 * k)
                P.box(xx - 0.012, xx + 0.012, -0.055, -0.045, zz - 0.012, zz + 0.012, 'iron', matrix=M, tile=1.0)
    if step:
        sw, sd, sh = step
        F.box(c - sw / 2, c + sw / 2, -sd, 0.0, z0 - sh, z0 - 0.005, step[3] if len(step) > 3 else 'mud_bare', tile=1.4, bevel=0.03)


def window_sa(F, cuts, c, w, h, z0, depth, bars=3, shutters=None, frame=0.07, arch=None, lime_frame=False, jaali=False):
    """작은 창: 나무틀 + 둥근 나무 창살 (또는 격자 jaali) + 안 어둠 + (덧문)."""
    P = F.P
    x0, x1 = c - w / 2, c + w / 2
    cuts.append(F.cutter(x0, x1, z0, z0 + h, depth, arch=arch))
    F.box(x0, x1, depth - 0.02, depth + 0.03, z0, z0 + h + (w / 2 if arch else 0.0), 'glass', tile=1.0)
    F.box(x0 - frame, x1 + frame, -0.03, 0.12, z0 - frame, z0, 'timber_dark', tile=(1.6, 0.8), bevel=0.008, grain='x')
    if not arch:
        F.box(x0 - frame, x1 + frame, -0.03, 0.12, z0 + h, z0 + h + frame, 'timber_dark', tile=(1.6, 0.8), bevel=0.008, grain='x')
    F.box(x0 - frame, x0, -0.03, 0.12, z0, z0 + h, 'timber_dark', tile=1.0, bevel=0.006)
    F.box(x1, x1 + frame, -0.03, 0.12, z0, z0 + h, 'timber_dark', tile=1.0, bevel=0.006)
    if lime_frame:     # 창 둘레 석회 띠 (네 토막)
        a, b, lo, hi = x0 - frame - 0.1, x1 + frame + 0.1, z0 - frame - 0.1, z0 + h + (w / 2 if arch else frame) + 0.1
        F.box(a, x0 - frame, -0.012, 0.02, lo, hi, 'mud_lime', tile=1.4)
        F.box(x1 + frame, b, -0.012, 0.02, lo, hi, 'mud_lime', tile=1.4)
        F.box(x0 - frame, x1 + frame, -0.012, 0.02, lo, z0 - frame, 'mud_lime', tile=1.4)
        F.box(x0 - frame, x1 + frame, -0.012, 0.02, hi - 0.1, hi, 'mud_lime', tile=1.4)
    yb = depth * 0.5
    if jaali:          # 나무 격자 (가로·세로 살)
        n = max(2, int(w / 0.09))
        for k in range(1, n):
            x = x0 + w * k / n
            F.box(x - 0.012, x + 0.012, yb - 0.02, yb + 0.02, z0, z0 + h, 'timber_dark', tile=1.0)
        m = max(2, int(h / 0.09))
        for k in range(1, m):
            z = z0 + h * k / m
            F.box(x0, x1, yb - 0.018, yb + 0.018, z - 0.012, z + 0.012, 'timber_dark', tile=1.0)
    else:
        for k in range(bars):
            x = x0 + w * (k + 1) / (bars + 1)
            M = F.M @ Matrix.Translation((x, yb, z0))
            P.cyl(0.018, 0.018, h, 'timber_dark', n=6, matrix=M, tile=0.5, caps=False)
    if shutters == 'open':
        lw = w / 2 + 0.01
        for side in (-1, 1):
            hx = x0 - frame if side < 0 else x1 + frame
            ang = rad(25) * (1 if side < 0 else -1)      # 벽에 붙게 활짝 연 덧문을 바깥으로 조금 띄운다
            M = F.M @ Matrix.Translation((hx, -0.03, 0)) @ Matrix.Rotation(ang, 4, 'Z')
            xa, xb = (-lw, 0) if side < 0 else (0, lw)
            P.box(xa, xb, -0.03, 0.0, z0 - 0.02, z0 + h + 0.02, 'planks', matrix=M, bevel=0.004, tile=1.0)


def niche(F, cuts, c, w, h, z0, depth=0.14, arch='round'):
    """등잔 감실 (벽에 판 작은 아치 홈): 안은 벽 재료 그대로."""
    cuts.append(F.cutter(c - w / 2, c + w / 2, z0, z0 + h, depth, arch=arch))


# ───────────────────────── 초가 지붕 (앞 처마를 툇마루까지 늘이기) ─────────────────────────
def lin(a, b, n):
    return [a + (b - a) * i / n for i in range(n + 1)]


def thatch_hf(P, fz, xa, xb, ya, yb, t, pitch, res=0.2, mat='thatch', bevel=0.08):
    xs = lin(xa, xb, max(4, int((xb - xa) / res)))
    ys = lin(ya, yb, max(4, int((yb - ya) / res)))
    off = (P.rng.random() * 5, P.rng.random() * 5)
    ob = K.heightfield(fz, xs, ys, t, bevel_w=bevel, bevel_seg=2, uvfn=K.slope_uv(2.0, 2.0, pitch, off), name='thatch')
    P.add_obj(ob, mat, keep_uv=True, smooth=True)


# ───────────────────────── 기타 ─────────────────────────
def Tm(x, y, z):
    return Matrix.Translation((x, y, z))


def Rz(a):
    return Matrix.Rotation(a, 4, 'Z')


def Ry(a):
    return Matrix.Rotation(a, 4, 'Y')


def Rx(a):
    return Matrix.Rotation(a, 4, 'X')


def recenter(root, foot, center=None):
    """바닥 가운데를 원점으로 (kit_england.recenter 와 같은 일). 돌려주는 크기 = 바닥 경계(foot)의 x, y 와 메시 높이."""
    me_obj = [c for c in root.children if c.type == 'MESH'][0]
    xs = [v.co.x for v in me_obj.data.vertices]
    ys = [v.co.y for v in me_obj.data.vertices]
    cx, cy = center if center is not None else ((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2)
    for c in root.children:
        if c.type == 'MESH':
            c.data.transform(Matrix.Translation((-cx, -cy, 0)))
        else:
            c.location.x -= cx
            c.location.y -= cy
    return (foot[1] - foot[0], foot[3] - foot[2], max(v.co.z for v in me_obj.data.vertices))


def preview_ground(color=(0.74, 0.62, 0.45)):
    """kit_common.setup_preview 가 깐 땅(풀빛 곱)을 남아시아 흙빛으로 바꾼다 (kit_common 은 고치지 않는다)."""
    gm = bpy.data.materials.get('preview_ground')
    if gm is None:
        return
    for n in gm.node_tree.nodes:
        if n.type == 'MIX' and n.blend_type == 'MULTIPLY':
            n.inputs['B'].default_value = (*color, 1)
