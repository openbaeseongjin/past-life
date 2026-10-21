# 중세 잉글랜드 건물 세트 (1329년 무렵 마을) — Blender 4.2 명령줄 스크립트.
#   GLTFT=<gltf-transform 폴더> "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe" --background --python tools/blender/kit_england.py
#   (GLTFT 가 없으면 docs/past-life/tools/node_modules 를 본다 — kit_common.py 머리말)
# 결과: docs/past-life/assets/real/kits/england.glb (meshopt + WebP), kits/england.dims.json (조각 바닥 크기), kits/preview/england_*.png
# 노드: cottage_a/b/c, house_jetty, longhouse, barn, smithy(+smithy_forge), church, mill(+mill_wheel), well, market_stall
# 각 조각: 바닥 가운데가 원점, 미터, 앞면 = glTF +Z (Blender -Y), 긴 축 = X. 굴뚝 꼭대기마다 '<조각>_smoke' 빈 노드.
# 환경변수: KIT_FAST=1 (굽기·렌더 표본 적게), KIT_ONLY=cottage_a,church (일부만), KIT_NOPREVIEW=1
import os, sys, math, time
sys.dont_write_bytecode = True          # tools/blender 에 __pycache__ 를 남기지 않는다
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector, Matrix
import kit_common as K
from kit_common import Piece, box_vf, prism_vf, temp_obj, boolean_cut, smin, smax, fbm, log

rad = math.radians
TP = lambda deg: math.tan(rad(deg))


# ───────────────────────── 재료 ─────────────────────────
def setup_materials():
    T, X = K.prep_texture, lambda f: os.path.join(K.TEX, f)
    mk = K.make_material
    mk('stone_rubble', T('stone_rubble_d', 'rustic_stone_wall_diff_1k.jpg', tint=(1.03, 0.98, 0.9), gain=1.04, sat=0.85),
       X('rustic_stone_wall_nor_gl_1k.jpg'), rough=0.92, nstr=1.3)
    mk('stone_ashlar', T('stone_ashlar_d', 'castle_wall_slates_diff_1k.jpg', tint=(1.06, 1.0, 0.9), gain=1.12, sat=0.8),
       X('castle_wall_slates_nor_gl_1k.jpg'), rough=0.9, nstr=1.1)
    mk('plaster_lime', T('plaster_lime_d', 'white_rough_plaster_diff_1k.jpg', tint=(1.0, 0.92, 0.77), gain=0.86, contrast=0.38, sat=0.45),
       X('white_rough_plaster_nor_gl_1k.jpg'), rough=0.95, nstr=0.7)
    mk('wattle', T('wattle_d', 'clay_plaster_diff_1k.jpg', tint=(1.0, 0.94, 0.82), gain=1.08, contrast=1.25, sat=0.55),
       X('clay_plaster_nor_gl_1k.jpg'), rough=0.95, nstr=1.2)
    mk('timber_dark', T('timber_dark_d', 'rough_wood_diff_1k.jpg', tint=(0.78, 0.64, 0.52), gain=0.62, sat=0.8, contrast=1.15),
       X('rough_wood_nor_gl_1k.jpg'), rough=0.85, nstr=1.0)
    mk('thatch', T('thatch_d', 'reed_roof_04_diff_1k.jpg', tint=(0.96, 0.86, 0.68), gain=0.86, sat=0.9, tile_v=(0.075, 0.12)),
       T('thatch_n', 'reed_roof_04_nor_gl_1k.jpg', tile_v=(0.075, 0.12), normal=True), rough=0.97, nstr=1.4)
    mk('slate', T('slate_d', 'roof_slates_02_diff_1k.jpg', tint=(0.9, 0.9, 0.92), gain=0.66, contrast=1.45, sat=0.7),
       X('roof_slates_02_nor_gl_1k.jpg'), rough=0.78, nstr=1.6)
    mk('planks', T('planks_d', 'old_planks_02_diff_1k.jpg', tint=(0.95, 0.86, 0.74), gain=1.0),
       X('old_planks_02_nor_gl_1k.jpg'), rough=0.85, nstr=1.0)
    mk('cobble', T('cobble_d', 'cobblestone_02_diff_1k.jpg', gain=0.95, sat=0.85), X('cobblestone_02_nor_gl_1k.jpg'), rough=0.9, nstr=1.0)
    mk('canvas', T('canvas_d', 'rough_linen_diff_1k.jpg', stripes=(4, (0.8, 0.74, 0.6), (0.5, 0.17, 0.1))),
       X('rough_linen_nor_gl_1k.jpg'), rough=0.95, nstr=0.6, double=True)
    mk('glass', color=(0.025, 0.022, 0.018), rough=0.3, emit=(1.0, 0.55, 0.22), emit_strength=0.0)
    mk('iron', color=(0.05, 0.048, 0.045), rough=0.55, metal=0.7)
    mk('coals', color=(0.04, 0.02, 0.01), rough=1.0, emit=(1.0, 0.36, 0.08), emit_strength=6.0)
    mk('water', color=(0.02, 0.03, 0.03), rough=0.08)
    mk('leather', color=(0.13, 0.075, 0.045), rough=0.7)


TILE = {'stone_rubble': 2.4, 'stone_ashlar': 2.6, 'plaster_lime': 2.2, 'wattle': 2.0, 'planks': 1.8, 'cobble': 1.6, 'slate': 1.8}


# ───────────────────────── 벽면 틀 ─────────────────────────
class Face:
    """벽면 하나의 로컬 틀: x = 벽 따라, z = 위, 로컬 -y = 바깥. plane = 벽면 좌표."""

    def __init__(self, P, side, plane):
        self.P, self.side = P, side
        rot = {'-y': 0.0, '+y': math.pi, '-x': -math.pi / 2, '+x': math.pi / 2}[side]
        T = (0, plane, 0) if side in ('-y', '+y') else (plane, 0, 0)
        self.M = Matrix.Translation(T) @ Matrix.Rotation(rot, 4, 'Z')
        self.R3 = self.M.to_3x3()

    def loc(self, c):
        return {'-y': c, '+y': -c, '-x': -c, '+x': c}[self.side]

    def span(self, a, b):
        p, q = self.loc(a), self.loc(b)
        return (min(p, q), max(p, q))

    def pt(self, x, y, z):
        return self.M @ Vector((x, y, z))

    def box(self, x0, x1, y0, y1, z0, z1, mat, **kw):
        kw.setdefault('tile', TILE.get(mat, 2.0))
        self.P.box(x0, x1, y0, y1, z0, z1, mat, matrix=self.M, **kw)

    def member(self, xa, za, xb, zb, w, prot=0.035, depth=0.12, mat='timber_dark', jitter=0.01):
        r = self.P.rng
        if jitter:
            xa += (r.random() - 0.5) * jitter
            xb += (r.random() - 0.5) * jitter
            za += (r.random() - 0.5) * jitter
            zb += (r.random() - 0.5) * jitter
            w *= 0.92 + r.random() * 0.16
        yc = depth / 2 - prot
        self.P.beam(self.pt(xa, yc, za), self.pt(xb, yc, zb), w, depth, mat, up=self.R3 @ Vector((0, -1, 0)))

    def cutter(self, x0, x1, z0, z1, depth, arch=False):
        if arch:
            v, f = prism_vf(pointed_poly(x0, x1, z0, z1), 'y', -0.8, depth)
        else:
            v, f = box_vf(x0, x1, -0.8, depth, z0, z1)
        return [tuple(self.M @ Vector(p)) for p in v], f


def pointed_poly(x0, x1, z0, zs, n=7):
    """뾰족 아치(정삼각 아치) 단면: 아래 z0, 아치가 시작하는 높이 zs."""
    w = x1 - x0
    pts = [(x0, z0), (x1, z0), (x1, zs)]
    for k in range(1, n):
        a = rad(60) * k / n
        pts.append((x0 + w * math.cos(a), zs + w * math.sin(a)))
    pts.append(((x0 + x1) / 2, zs + w * math.sin(rad(60))))
    for k in range(1, n):
        a = rad(120) + rad(60) * k / n
        pts.append((x1 + w * math.cos(a), zs + w * math.sin(a)))
    pts.append((x0, zs))
    return pts


def frustum_vf(cx, cy, w0, d0, z0, w1, d1, z1, dy1=0.0):
    v = [(cx - w0 / 2, cy - d0 / 2, z0), (cx + w0 / 2, cy - d0 / 2, z0), (cx + w0 / 2, cy + d0 / 2, z0), (cx - w0 / 2, cy + d0 / 2, z0),
         (cx - w1 / 2, cy + dy1 - d1 / 2, z1), (cx + w1 / 2, cy + dy1 - d1 / 2, z1), (cx + w1 / 2, cy + dy1 + d1 / 2, z1), (cx - w1 / 2, cy + dy1 + d1 / 2, z1)]
    f = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    return v, f


def ring_vf(ro, ri, z0, z1, n=20):
    v = []
    for r_, z in ((ro, z0), (ro, z1), (ri, z1), (ri, z0)):
        for k in range(n):
            a = 2 * math.pi * k / n
            v.append((r_ * math.cos(a), r_ * math.sin(a), z))
    f = []
    for ring in range(4):
        a0, a1 = ring * n, ((ring + 1) % 4) * n
        for k in range(n):
            k1 = (k + 1) % n
            f.append((a0 + k, a0 + k1, a1 + k1, a1 + k))
    return v, f


def solid_obj(parts, name='solid'):
    """(v,f) 여러 개 → 바깥 법선이 맞춰진 오브젝트 하나."""
    vs, fs = [], []
    for v, f in parts:
        o = len(vs)
        vs += list(v)
        fs += [tuple(i + o for i in face) for face in f]
    bm = K.bm_from(vs, fs)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def gable_profile(y0, y1, H, pitch, z0=0.0, hg=None):
    """박공(또는 반박공 hg) 벽 단면 (y,z). 지붕 밑면이 벽 바깥선(y0,y1)에서 높이 H 를 지난다."""
    tp = TP(pitch)
    yc, hw = (y0 + y1) / 2, (y1 - y0) / 2
    if hg is None:
        return [(y0, z0), (y1, z0), (y1, H), (yc, H + hw * tp), (y0, H)]
    dy = hg / tp
    return [(y0, z0), (y1, z0), (y1, H), (y1 - dy, H + hg), (y0 + dy, H + hg), (y0, H)]


# ───────────────────────── 지붕 ─────────────────────────
def roof_fn(L, D, H, pitch, t, kind='gable', oE=0.5, oG=0.4, hg=0.0, hip_pitch=None, sag=0.12, noise=(0.03, 0.012),
            seed=0, dormer=None, k=0.35, cy=0.0):
    tp, tq = TP(pitch), TP(hip_pitch or pitch)
    Hu = H + t / math.cos(rad(pitch))
    zr = Hu + D / 2 * tp
    xe = L / 2 + (oG if kind == 'gable' else oE)

    def fz(x, y):
        yy = y - cy
        z = smin(Hu + (D / 2 - yy) * tp, Hu + (D / 2 + yy) * tp, k)
        if kind in ('hip', 'half'):
            h0 = Hu + (hg if kind == 'half' else 0.0)
            z = smin(z, h0 + (L / 2 - x) * tq, k * 0.8)
            z = smin(z, h0 + (L / 2 + x) * tq, k * 0.8)
        if dormer:
            xd, wd, Hdu, tpd = dormer
            zd = Hdu + (wd / 2 - abs(x - xd)) * tpd - max(0.0, yy + 0.3) * 2 * tp
            z = smax(z, zd, 0.32)
        f = min(1.0, max(0.0, (z - Hu) / max(zr - Hu, 1e-3)))
        z -= sag * (1 - min(1.0, (x / xe) ** 2)) * f * f
        if noise:
            z += noise[0] * fbm(x * 0.6, y * 0.6, seed) + noise[1] * fbm(x * 2.2, y * 2.2, seed + 11)
        return z
    return fz, xe, Hu, zr


def lin(a, b, n):
    return [a + (b - a) * i / n for i in range(n + 1)]


def thatch_roof(P, L, D, H, pitch=50, kind='gable', oE=0.5, oG=0.42, t=0.36, sag=0.12, hg=0.0, dormer=None,
                res=0.18, cap=True, cy=0.0, hip_pitch=None, xlim=None):
    seed = P.rng.randrange(1000)
    fz, xe, Hu, zr = roof_fn(L, D, H, pitch, t, kind, oE, oG, hg, hip_pitch, sag, (0.03, 0.012), seed, dormer, 0.35, cy)
    ye = D / 2 + oE
    xa, xb = (-xe, xe) if xlim is None else xlim
    xs = lin(xa, xb, max(4, int((xb - xa) / res)))
    ys = lin(cy - ye, cy + ye, max(4, int(2 * ye / res)))
    off = (P.rng.random() * 5, P.rng.random() * 5)
    ob = K.heightfield(fz, xs, ys, t, bevel_w=0.08, bevel_seg=2, uvfn=K.slope_uv(2.0, 2.0, pitch, off), name='thatch')
    P.add_obj(ob, 'thatch', keep_uv=True, smooth=True)
    if cap:
        tq = TP(hip_pitch or pitch)
        if kind == 'gable':
            xr = xe - 0.06
        elif kind == 'hip':
            xr = L / 2 - (D / 2 * TP(pitch)) / tq + 0.25
        else:
            xr = L / 2 - (D / 2 * TP(pitch) - hg) / tq + 0.1
        xr = max(0.6, xr)
        ridge_cap(P, fz, -xr, xr, cy, pitch, tapered=kind != 'gable')
    return fz, Hu, zr


def ridge_cap(P, fz, x0, x1, cy, pitch, tapered=True, mat='thatch', lift=0.075, thick=0.15, base=0.42, amp=0.11, period=0.55,
              res=0.069, nc=8):
    """덧댄 용마루 (아래 끝이 톱니처럼 깎인 블록컷 용마루)."""
    def bfn(x):
        tri = abs(((x - x0) / period) % 1.0 - 0.5) * 2      # 0..1 삼각파
        b = base + amp * (1 - tri)
        if tapered:
            e = min(x - x0, x1 - x) / 0.5
            b *= 0.35 + 0.65 * min(1.0, max(0.0, e))
        return b
    nx = max(2, int((x1 - x0) / res))
    v, f = [], []
    for i in range(nx + 1):
        x = x0 + (x1 - x0) * i / nx
        b = bfn(x)
        for j in range(nc + 1):
            s = -1 + 2 * j / nc
            y = cy + s * b
            v.append((x, y, fz(x, y) + lift * (1 - 0.4 * s * s)))
    for i in range(nx):
        for j in range(nc):
            a = i * (nc + 1) + j
            f.append((a, a + nc + 1, a + nc + 2, a + 1))
    ob = temp_obj(v, f, 'cap')
    me = ob.data
    uvl = me.uv_layers.new(name='UVMap')
    fn = K.slope_uv(2.0, 2.0, pitch, (P.rng.random(), P.rng.random()))
    for poly in me.polygons:
        for li, uv in zip(poly.loop_indices, fn(me, poly)):
            uvl.data[li].uv = uv
    sol = ob.modifiers.new('s', 'SOLIDIFY')
    sol.thickness = thick
    sol.offset = -1
    sol.use_even_offset = True
    bv = ob.modifiers.new('b', 'BEVEL')
    bv.width = 0.03
    bv.segments = 2
    bv.limit_method = 'ANGLE'
    bv.angle_limit = rad(50)
    P.add_obj(ob, mat, keep_uv=True, smooth=True)


def slate_roof(P, L, D, H, pitch=50, oE=0.32, oG=0.26, t=0.07, sag=0.04, cy=0.0, xlim=None, matrix=None,
               ridge=True, barge=(True, True), mat='slate'):
    seed = P.rng.randrange(1000)
    fz, xe, Hu, zr = roof_fn(L, D, H, pitch, t, 'gable', oE, oG, 0.0, None, sag, (0.006, 0.0), seed, None, 0.0, cy)
    ye = D / 2 + oE
    xa, xb = (-xe, xe) if xlim is None else xlim
    xs = lin(xa, xb, max(2, int((xb - xa) / 0.55)))
    ny = max(2, int(2 * ye / 0.6))
    ny += ny % 2
    ys = lin(cy - ye, cy + ye, ny)
    off = (P.rng.random() * 5, P.rng.random() * 5)
    ob = K.heightfield(fz, xs, ys, t, bevel_w=0.012, bevel_seg=1, uvfn=K.slope_uv(1.8, 1.8, pitch, off), name='slate')
    P.add_obj(ob, mat, keep_uv=True, smooth=False, matrix=matrix)
    if ridge:
        cap = Piece('_tmp', 1)
        ridge_cap(cap, fz, xa + 0.02, xb - 0.02, cy, pitch, tapered=False, mat='stone_ashlar', lift=0.06, thick=0.1,
                  base=0.15, amp=0.0, res=0.55, nc=2)
        _absorb(P, cap, matrix)
    # 박공널 (verge boards)
    for sx, on in ((xa, barge[0]), (xb, barge[1])):
        if not on:
            continue
        xg = sx + (0.02 if sx < 0 else -0.02)
        for sy in (-1, 1):
            ya, yb = cy + sy * (ye - 0.02), cy + sy * 0.16
            pa = Vector((xg, ya, fz(xg, ya) - t - 0.12))
            pb = Vector((xg, yb, fz(xg, yb) - t - 0.12))
            if matrix is not None:
                pa, pb = matrix @ pa, matrix @ pb
            up = Vector((0, 0, 1)) if matrix is None else matrix.to_3x3() @ Vector((0, 0, 1))
            P.beam(pa, pb, 0.045, 0.2, 'timber_dark', up=up)
    return fz, Hu, zr


def _absorb(P, sub, matrix=None):
    """임시 Piece 의 면을 P 로 옮긴다."""
    sub.bm.normal_update()
    if matrix is not None:
        bmesh.ops.transform(sub.bm, matrix=matrix, verts=sub.bm.verts)
    for i, m in enumerate(sub.mats):
        b2 = sub.bm.copy()
        bmesh.ops.delete(b2, geom=[f for f in b2.faces if f.material_index != i], context='FACES')
        P._merge(b2, m, False, b2.loops.layers.uv['UVMap'])
        b2.free()
    sub.bm.free()


# ───────────────────────── 벽·창·문·목골조 ─────────────────────────
def wall_solid(P, parts, mat, cutters, tile=None):
    ob = solid_obj(parts, 'wall')
    if cutters:
        boolean_cut(ob, cutters)
    P.add_obj(ob, mat, tile=tile or TILE.get(mat, 2.2))


def window(F, cuts, c, w, z0, z1, depth, wall='timber', shutters=None, mull=None, sill=True, lintel=True):
    P, r = F.P, F.P.rng
    x0, x1 = c - w / 2, c + w / 2
    cuts.append(F.cutter(x0, x1, z0, z1, depth))
    F.box(x0, x1, depth - 0.03, depth + 0.02, z0, z1, 'glass', tile=1.0)
    fp = -(depth - 0.17)            # 창틀 바깥면 (벽면 안쪽으로)
    F.member(x0 + 0.045, z0, x0 + 0.045, z1, 0.09, prot=fp, depth=0.14, jitter=0)
    F.member(x1 - 0.045, z0, x1 - 0.045, z1, 0.09, prot=fp, depth=0.14, jitter=0)
    F.member(x0, z1 - 0.045, x1, z1 - 0.045, 0.09, prot=fp, depth=0.14, jitter=0)
    F.member(x0, z0 + 0.045, x1, z0 + 0.045, 0.09, prot=fp, depth=0.14, jitter=0)
    nm = mull if mull is not None else (1 if w < 0.75 else 2)
    for k in range(nm):
        x = x0 + (k + 1) * w / (nm + 1)
        F.member(x, z0 + 0.05, x, z1 - 0.05, 0.055, prot=fp + 0.02, depth=0.08, jitter=0)
    if wall == 'stone':
        if sill:
            F.box(x0 - 0.1, x1 + 0.1, -0.07, 0.2, z0 - 0.1, z0, 'stone_ashlar', bevel=0.015, tile=1.2)
        if lintel:
            F.box(x0 - 0.22, x1 + 0.22, -0.03, 0.3, z1, z1 + 0.2, 'timber_dark', bevel=0.015, grain='x', tile=(1.6, 0.8))
    else:
        F.box(x0 - 0.06, x1 + 0.06, -0.08, 0.04, z0 - 0.06, z0 - 0.005, 'timber_dark', bevel=0.01, grain='x', tile=(1.6, 0.8))
    if shutters == 'open':
        lw = w / 2 + 0.02
        for side in (-1, 1):
            hx = x0 - 0.02 if side < 0 else x1 + 0.02
            ang = rad(14 + r.random() * 18) * (1 if side < 0 else -1)
            M = F.M @ Matrix.Translation((hx, -0.05, 0)) @ Matrix.Rotation(ang, 4, 'Z')
            xa, xb = (-lw, 0) if side < 0 else (0, lw)
            P.box(xa, xb, -0.035, 0.0, z0 - 0.02, z1 + 0.02, 'planks', matrix=M, bevel=0.006, tile=1.2)
            for zz in (z0 + 0.12, z1 - 0.16):   # 띠장
                P.box(xa + 0.03, xb - 0.03, -0.06, -0.035, zz, zz + 0.07, 'planks', matrix=M, bevel=0.005, tile=1.2)
    elif shutters == 'closed':
        F.box(x0 + 0.02, x1 - 0.02, depth - 0.24, depth - 0.2, z0 + 0.02, z1 - 0.02, 'planks', bevel=0.005, tile=1.2)


def door(F, cuts, c, w, h, z0, depth, wall='timber', step=True, ajar=0.0):
    P = F.P
    x0, x1 = c - w / 2, c + w / 2
    cuts.append(F.cutter(x0, x1, z0, z0 + h, depth))
    if ajar <= 0:
        F.box(x0, x1, depth - 0.08, depth - 0.02, z0, z0 + h, 'planks', bevel=0.005, tile=1.6)
        lf = F.M
        yy = depth - 0.08
    else:
        lf = F.M @ Matrix.Translation((x0, depth - 0.08, 0)) @ Matrix.Rotation(-ajar, 4, 'Z')
        P.box(0, w, 0, 0.06, z0, z0 + h, 'planks', matrix=lf, bevel=0.005, tile=1.6)
        lf, yy, x0, x1 = lf, 0.0, 0.0, w
    for zz in (z0 + 0.28, z0 + h - 0.36):   # 쇠 경첩 띠
        P.box(x0 + 0.03, x1 - 0.14, yy - 0.015, yy, zz, zz + 0.05, 'iron', matrix=lf, tile=1.0)
    if wall == 'stone':
        F.box(c - w / 2 - 0.26, c + w / 2 + 0.26, -0.03, 0.3, z0 + h, z0 + h + 0.22, 'timber_dark', bevel=0.015, grain='x', tile=(1.6, 0.8))
    if step:
        F.box(c - w / 2 - 0.12, c + w / 2 + 0.12, -0.42, -0.02, -0.4, z0 - 0.03, 'stone_ashlar', bevel=0.02, tile=1.4)


def frame_wall(F, x0, x1, zb, zt, openings, stud=1.05, close=False, braces=True, rail=True, corners=True, plate=True):
    """목골조: 지방·도리·모서리 기둥·샛기둥·띠장·가새. openings = [(x0,x1,z0,z1)] (로컬)."""
    m = F.member
    m(x0, zb + 0.1, x1, zb + 0.1, 0.2, prot=0.038)
    if plate:
        m(x0, zt - 0.11, x1, zt - 0.11, 0.22, prot=0.042)
    posts = []
    if corners:
        posts += [x0 + 0.11, x1 - 0.11]
        m(x0 + 0.11, zb, x0 + 0.11, zt, 0.22, prot=0.04)
        m(x1 - 0.11, zb, x1 - 0.11, zt, 0.22, prot=0.04)
    for (ox0, ox1, oz0, oz1) in openings:
        for px in (ox0 - 0.07, ox1 + 0.07):
            if all(abs(px - q) > 0.2 for q in posts):
                m(px, zb + 0.2, px, zt - 0.22, 0.14, prot=0.034)
                posts.append(px)
        m(ox0 - 0.14, oz1 + 0.07, ox1 + 0.14, oz1 + 0.07, 0.14, prot=0.032)
        if oz0 > zb + 0.35:
            m(ox0 - 0.14, oz0 - 0.07, ox1 + 0.14, oz0 - 0.07, 0.14, prot=0.032)
    zr = zb + (zt - zb) * 0.46
    if rail:
        a = x0 + 0.2
        cuts = sorted([(ox0 - 0.14, ox1 + 0.14) for (ox0, ox1, oz0, oz1) in openings if oz0 - 0.1 < zr < oz1 + 0.1])
        for (c0, c1) in cuts + [(x1 - 0.2, x1)]:
            if c0 - a > 0.3:
                m(a, zr, c0, zr, 0.16, prot=0.033)
            a = max(a, c1)
    sp = 0.47 if close else stud
    n = max(1, round((x1 - x0 - 0.44) / sp))
    for k in range(1, n):
        x = x0 + 0.22 + k * (x1 - x0 - 0.44) / n
        if any(abs(x - q) < (0.2 if close else 0.3) for q in posts):
            continue
        segs = [(zb + 0.2, zt - 0.22)]
        for (ox0, ox1, oz0, oz1) in openings:
            if ox0 - 0.12 < x < ox1 + 0.12:
                ns = []
                for (a, b) in segs:
                    if oz0 - 0.14 > a:
                        ns.append((a, min(b, oz0 - 0.14)))
                    if oz1 + 0.14 < b:
                        ns.append((max(a, oz1 + 0.14), b))
                segs = ns
        for (a, b) in segs:
            if b - a > 0.25:
                m(x, a, x, b, 0.15 if close else 0.16, prot=0.03)
    if braces and not close:
        bw = min(1.15, (x1 - x0) * 0.24)
        for xa, sg in ((x0 + 0.22, 1), (x1 - 0.22, -1)):
            xb = xa + sg * bw
            lo, hi = min(xa, xb), max(xa, xb)
            for (za, zz) in ((zr + 0.08, zt - 0.22), (zb + 0.2, zr - 0.08)):
                if all(not (ox1 + 0.1 > lo and ox0 - 0.1 < hi and oz1 + 0.1 > za and oz0 - 0.1 < zz) for (ox0, ox1, oz0, oz1) in openings):
                    if za > zr:
                        m(xa, za, xb, zz, 0.14, prot=0.028)
                    else:
                        m(xb, za, xa, zz, 0.14, prot=0.028)
                    break


def gable_frame(F, x0, x1, zt, zr):
    """박공 세모 목골조: 왕기둥·고삐보·버팀."""
    m = F.member
    xc = (x0 + x1) / 2
    hw = (x1 - x0) / 2
    m(xc, zt, xc, zr - 0.3, 0.18, prot=0.036)
    zc = zt + (zr - zt) * 0.48
    cw = hw * (1 - 0.48) - 0.12
    m(xc - cw, zc, xc + cw, zc, 0.16, prot=0.033)
    for s in (-1, 1):
        m(xc + s * cw * 0.55, zt, xc + s * cw * 0.55, zc, 0.14, prot=0.03)
        m(xc + s * 0.1, zc + 0.1, xc + s * cw * 0.7, zr - (zr - zc) * 0.2 - (cw * 0.7) * (zr - zt) / hw, 0.12, prot=0.028)


def plinth(P, x0, x1, y0, y1, top=0.42, out=0.05):
    P.box(x0 - out, x1 + out, y0 - out, y1 + out, -0.6, top, 'stone_rubble', bevel=0.035, tile=2.4)


def quoins(P, x0, x1, y0, y1, z0, z1, mat='stone_ashlar', hb=0.27):
    for cx, sx in ((x0, -1), (x1, 1)):
        for cy, sy in ((y0, -1), (y1, 1)):
            z, k = z0, 0
            while z + hb < z1:
                la, lb = (0.5, 0.28) if k % 2 == 0 else (0.28, 0.5)
                P.box(cx - sx * la, cx + sx * 0.018, cy - sy * lb, cy + sy * 0.018, z, z + hb - 0.025, mat, bevel=0.018, tile=1.3)
                z += hb
                k += 1


def chimney(P, x, y, z0, ztop, w=0.9, d=0.7, base=None, tag='', mat='stone_rubble'):
    if base:
        bw, bd, bz, bdy = base
        P.box(x - bw / 2, x + bw / 2, y - bd / 2 + bdy, y + bd / 2 + bdy, z0, bz, mat, bevel=0.025, tile=2.4)
        v, f = frustum_vf(x, y + bdy, bw, bd, bz, w, d, bz + 0.5, -bdy)
        P.add_bm(K.bm_from(v, f), mat, tile=2.4, bevel=0.02)
        z0 = bz + 0.5
    P.box(x - w / 2, x + w / 2, y - d / 2, y + d / 2, z0, ztop, mat, bevel=0.025, tile=2.4)
    P.box(x - w / 2 - 0.07, x + w / 2 + 0.07, y - d / 2 - 0.07, y + d / 2 + 0.07, ztop, ztop + 0.11, 'stone_ashlar', bevel=0.02, tile=1.4)
    P.box(x - w / 2 + 0.04, x + w / 2 - 0.04, y - d / 2 + 0.04, y + d / 2 - 0.04, ztop + 0.11, ztop + 0.3, mat, bevel=0.015, tile=2.4)
    P.box(x - w / 2 + 0.17, x + w / 2 - 0.17, y - d / 2 + 0.15, y + d / 2 - 0.15, ztop + 0.25, ztop + 0.305, 'iron', tile=1.0)
    P.marker(P.name + '_smoke' + tag, (x, y, ztop + 0.45))


# ───────────────────────── 조각들 ─────────────────────────
def cottage_a():
    """목골조 + 석회 회벽, 박공 초가, 박공 바깥 굴뚝."""
    P = Piece('cottage_a', 101)
    L, D, H, pitch = 6.6, 4.6, 2.55, 50
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    zb = 0.42
    plinth(P, x0, x1, y0, y1, zb)
    cuts = []
    Ff, Fb, Fl, Fr = Face(P, '-y', y0), Face(P, '+y', y1), Face(P, '-x', x0), Face(P, '+x', x1)
    zr_u = H + D / 2 * TP(pitch)
    # 앞
    door(Ff, cuts, -1.3, 0.95, 1.88, zb, 0.2)
    window(Ff, cuts, 0.95, 0.95, 1.08, 1.82, 0.22, shutters='open')
    window(Ff, cuts, 2.45, 0.6, 1.12, 1.72, 0.22)
    window(Ff, cuts, -2.55, 0.55, 1.12, 1.68, 0.22, shutters='closed')
    frame_wall(Ff, x0, x1, zb, H, [(-1.3 - 0.475, -1.3 + 0.475, zb, zb + 1.88), (0.95 - 0.475, 0.95 + 0.475, 1.08, 1.82),
                                   (2.15, 2.75, 1.12, 1.72), (-2.825, -2.275, 1.12, 1.68)])
    # 뒤 (로컬 x = -세계 x)
    window(Fb, cuts, Fb.loc(0.6), 0.75, 1.1, 1.75, 0.22)
    window(Fb, cuts, Fb.loc(-1.9), 0.55, 1.15, 1.7, 0.22, shutters='open')
    frame_wall(Fb, x0, x1, zb, H, [(Fb.loc(0.6) - 0.375, Fb.loc(0.6) + 0.375, 1.1, 1.75), (Fb.loc(-1.9) - 0.275, Fb.loc(-1.9) + 0.275, 1.15, 1.7)])
    # 박공 -x: 창 둘 (아래, 다락)
    window(Fl, cuts, Fl.loc(0.2), 0.55, 1.15, 1.7, 0.22)
    window(Fl, cuts, Fl.loc(0.0), 0.42, 3.05, 3.55, 0.2, mull=1)
    frame_wall(Fl, y0, y1, zb, H, [(Fl.loc(0.2) - 0.275, Fl.loc(0.2) + 0.275, 1.15, 1.7)])
    gable_frame(Fl, y0, y1, H, zr_u)
    frame_wall(Fr, y0, y1, zb, H, [], braces=True)
    gable_frame(Fr, y0, y1, H, zr_u)
    wall_solid(P, [prism_vf(gable_profile(y0, y1, H, pitch, 0.3), 'x', x0, x1)], 'plaster_lime', cuts)
    fz, Hu, zr = thatch_roof(P, L, D, H, pitch, 'gable', oE=0.5, oG=0.42, sag=0.12)
    chimney(P, x1 + 0.42, 0.45, -0.3, zr + 0.55, w=0.85, d=0.62, base=(0.84, 1.35, 1.9, 0.0))
    return P


def cottage_b():
    """막돌 벽, 반박공 초가, 바깥 끝에 슬레이트 덧지붕 별채(헛간), 용마루 굴뚝, 모서리 돌."""
    P = Piece('cottage_b', 202)
    L, D, H, pitch, hg = 7.0, 4.8, 2.3, 50, 1.55
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    zf = 0.12
    P.box(x0 - 0.07, x1 + 0.07, y0 - 0.07, y1 + 0.07, -0.6, 0.14, 'stone_rubble', bevel=0.03)
    cuts = []
    Ff, Fb, Fl = Face(P, '-y', y0), Face(P, '+y', y1), Face(P, '-x', x0)
    door(Ff, cuts, -0.55, 1.0, 1.85, zf, 0.32, wall='stone')
    window(Ff, cuts, -2.3, 0.75, 1.0, 1.68, 0.36, wall='stone', shutters='open')
    window(Ff, cuts, 1.55, 0.85, 1.0, 1.7, 0.36, wall='stone')
    window(Fb, cuts, Fb.loc(0.6), 0.7, 1.0, 1.62, 0.36, wall='stone', shutters='closed')
    window(Fb, cuts, Fb.loc(-2.2), 0.5, 1.1, 1.6, 0.36, wall='stone')
    window(Fl, cuts, Fl.loc(0.0), 0.5, 2.62, 3.15, 0.32, wall='stone', mull=1)
    wall_solid(P, [prism_vf(gable_profile(y0, y1, H, pitch, 0.0, hg), 'x', x0, x1)], 'stone_rubble', cuts)
    quoins(P, x0, x1, y0, y1, 0.14, H - 0.05)
    thatch_roof(P, L, D, H, pitch, 'half', oE=0.5, hg=hg, sag=0.13, hip_pitch=56)
    zr = H + D / 2 * TP(pitch) + 0.36 / math.cos(rad(pitch))
    chimney(P, -2.2, 0.0, 1.6, zr + 0.7, w=0.8, d=0.62)
    # 별채: 외쪽 지붕(슬레이트), 바깥벽 높이 Ha
    La, Da, Ha, pa = 2.6, 3.6, 1.85, 27
    ax0, ax1, ay0, ay1 = x1 - 0.25, x1 + La, -Da / 2, Da / 2
    P.box(x1, ax1 + 0.06, ay0 - 0.06, ay1 + 0.06, -0.6, 0.1, 'stone_rubble', bevel=0.03)
    hi = Ha + La * TP(pa)
    prof = [(ax0, 0.0), (ax1, 0.0), (ax1, Ha), (ax0, Ha + (ax1 - ax0) * TP(pa))]
    acuts = []
    Fa = Face(P, '-y', ay0)
    door(Fa, acuts, x1 + 1.25, 0.95, 1.55, 0.08, 0.25, wall='stone', step=False)
    Fe = Face(P, '+x', ax1)
    window(Fe, acuts, Fe.loc(0.3), 0.45, 0.95, 1.4, 0.3, wall='stone', mull=1, shutters='closed')
    wall_solid(P, [prism_vf(prof, 'y', ay0, ay1)], 'stone_rubble', acuts)
    quoins(P, x1 - 0.5, ax1, ay0, ay1, 0.1, Ha - 0.05)
    # 외쪽 지붕: 높이장 (x 방향으로 내려감)
    t = 0.07
    Hu = Ha + t / math.cos(rad(pa))
    seed = P.rng.randrange(99)

    def fz(x, y):
        return Hu + (ax1 - x) * TP(pa) - 0.03 * (1 - (y / (Da / 2 + 0.3)) ** 2) + 0.004 * fbm(x, y, seed)
    xs = lin(x1 - 0.02, ax1 + 0.32, 7)
    ys = lin(ay0 - 0.3, ay1 + 0.3, 8)
    ob = K.heightfield(fz, xs, ys, t, bevel_w=0.012, bevel_seg=1, uvfn=_uv_lean(pa), name='lean')
    P.add_obj(ob, 'slate', keep_uv=True)
    for sy in (-1, 1):
        yg = sy * (Da / 2 + 0.28)
        P.beam((x1 + 0.02, yg, fz(x1 + 0.02, yg) - t - 0.1), (ax1 + 0.3, yg, fz(ax1 + 0.3, yg) - t - 0.1), 0.045, 0.2, 'timber_dark')
    return P


def _uv_lean(pitch):
    sp = math.sin(rad(pitch))

    def fn(me, poly):
        return [(me.vertices[i].co.y / 1.8, me.vertices[i].co.z / sp / 1.8) for i in poly.vertices]
    return fn


def cottage_c():
    """욋가지 흙벽 + 목골조, 우진각 초가에 지붕창(박공 지붕창) 하나, 용마루 굴뚝."""
    P = Piece('cottage_c', 303)
    L, D, H, pitch = 6.0, 4.4, 2.4, 50
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    zb = 0.42
    plinth(P, x0, x1, y0, y1, zb)
    xd, wd, Hd, pd = 0.75, 1.75, H + 0.5, 50
    t = 0.36
    cuts = []
    Ff, Fb, Fl, Fr = Face(P, '-y', y0), Face(P, '+y', y1), Face(P, '-x', x0), Face(P, '+x', x1)
    door(Ff, cuts, -1.5, 0.92, 1.85, zb, 0.2)
    window(Ff, cuts, xd, 0.8, 1.05, 1.72, 0.22, shutters='open')
    window(Ff, cuts, 2.25, 0.5, 1.12, 1.62, 0.22)
    frame_wall(Ff, x0, x1, zb, H, [(-1.96, -1.04, zb, zb + 1.85), (xd - 0.4, xd + 0.4, 1.05, 1.72), (2.0, 2.5, 1.12, 1.62)])
    window(Fb, cuts, Fb.loc(-0.4), 0.7, 1.1, 1.72, 0.22, shutters='closed')
    frame_wall(Fb, x0, x1, zb, H, [(Fb.loc(-0.4) - 0.35, Fb.loc(-0.4) + 0.35, 1.1, 1.72)])
    window(Fl, cuts, Fl.loc(0.3), 0.55, 1.15, 1.68, 0.22)
    frame_wall(Fl, y0, y1, zb, H, [(Fl.loc(0.3) - 0.275, Fl.loc(0.3) + 0.275, 1.15, 1.68)])
    frame_wall(Fr, y0, y1, zb, H, [])
    wall_solid(P, [box_vf(x0, x1, y0, y1, 0.3, H)], 'wattle', cuts)
    # 지붕창 앞벽 (오각형, 벽선 위)
    dprof = [(xd - wd / 2, H), (xd + wd / 2, H), (xd + wd / 2, Hd), (xd, Hd + wd / 2 * TP(pd)), (xd - wd / 2, Hd)]
    dcuts = []
    Fd = Face(P, '-y', y0)
    window(Fd, dcuts, xd, 0.72, H + 0.12, H + 0.78, 0.2, mull=1)
    wall_solid(P, [prism_vf(dprof, 'y', y0, y0 + 0.3)], 'wattle', dcuts)
    Fd.member(xd - wd / 2 + 0.09, H, xd - wd / 2 + 0.09, Hd, 0.18, prot=0.04)
    Fd.member(xd + wd / 2 - 0.09, H, xd + wd / 2 - 0.09, Hd, 0.18, prot=0.04)
    Fd.member(xd - wd / 2, Hd - 0.08, xd + wd / 2, Hd - 0.08, 0.16, prot=0.036)
    dormer = (xd, wd, Hd + t / math.cos(rad(pd)), TP(pd))
    fz, Hu, zr = thatch_roof(P, L, D, H, pitch, 'hip', oE=0.5, sag=0.1, dormer=dormer, t=t)
    chimney(P, -1.15, 0.15, 1.5, zr + 0.75, w=0.8, d=0.6)
    return P


def house_jetty():
    """2층 목골조, 앞쪽 위층이 0.5 m 튀어나옴(장선 끝이 보임), 촘촘한 샛기둥, 슬레이트 박공지붕."""
    P = Piece('house_jetty', 404)
    L, D, H1, H2, J, pitch = 7.4, 5.0, 2.7, 5.15, 0.5, 50
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    zb = 0.42
    zu = H1 + 0.16                     # 위층 바닥 (지방 밑)
    yu0 = y0 - J
    plinth(P, x0, x1, y0, y1, zb)
    cuts = []
    Ff, Fb, Fl, Fr = Face(P, '-y', y0), Face(P, '+y', y1), Face(P, '-x', x0), Face(P, '+x', x1)
    door(Ff, cuts, -2.45, 1.0, 1.95, zb, 0.2)
    window(Ff, cuts, -0.35, 1.15, 1.05, 1.9, 0.22, shutters='open')
    window(Ff, cuts, 2.1, 0.95, 1.05, 1.9, 0.22)
    frame_wall(Ff, x0, x1, zb, H1, [(-2.95, -1.95, zb, zb + 1.95), (-0.925, 0.225, 1.05, 1.9), (1.625, 2.575, 1.05, 1.9)])
    window(Fb, cuts, Fb.loc(1.2), 0.85, 1.1, 1.85, 0.22)
    frame_wall(Fb, x0, x1, zb, H1, [(Fb.loc(1.2) - 0.425, Fb.loc(1.2) + 0.425, 1.1, 1.85)])
    frame_wall(Fl, y0, y1, zb, H1, [])
    window(Fr, cuts, Fr.loc(-0.6), 0.6, 1.15, 1.75, 0.22, shutters='closed')
    frame_wall(Fr, y0, y1, zb, H1, [(Fr.loc(-0.6) - 0.3, Fr.loc(-0.6) + 0.3, 1.15, 1.75)])
    wall_solid(P, [box_vf(x0, x1, y0, y1, 0.3, H1)], 'plaster_lime', cuts)
    # 장선: 앞으로 튀어나온 끝
    nj = int(L / 0.45)
    for k in range(nj + 1):
        x = x0 + 0.12 + k * (L - 0.24) / nj
        P.beam((x, y0 + 0.6, (H1 + zu) / 2), (x, yu0 - 0.06, (H1 + zu) / 2), 0.14, zu - H1)
    P.box(x0 + 0.02, x1 - 0.02, y0 + 0.05, y1, H1 - 0.05, zu, 'planks', tile=1.6)
    P.box(x0, x1, yu0, y0, zu - 0.02, zu, 'planks', tile=1.6)            # 장선 사이 마루 밑판
    # 위층
    ucuts = []
    Uf, Ub, Ul, Ur = Face(P, '-y', yu0), Face(P, '+y', y1), Face(P, '-x', x0), Face(P, '+x', x1)
    Uf.member(x0 - 0.05, zu + 0.13, x1 + 0.05, zu + 0.13, 0.26, prot=0.05, depth=0.2)     # 멍에(bressumer)
    wins = [-2.4, 0.0, 2.4]
    for c in wins:
        window(Uf, ucuts, c, 0.9, zu + 0.85, zu + 1.6, 0.22, shutters='open' if c == 0.0 else None)
    frame_wall(Uf, x0, x1, zu + 0.06, H2, [(c - 0.45, c + 0.45, zu + 0.85, zu + 1.6) for c in wins], close=True)
    window(Ub, ucuts, Ub.loc(-1.0), 0.8, zu + 0.9, zu + 1.55, 0.22)
    frame_wall(Ub, x0, x1, zu, H2, [(Ub.loc(-1.0) - 0.4, Ub.loc(-1.0) + 0.4, zu + 0.9, zu + 1.55)], close=True)
    zr_u = H2 + (D + J) / 2 * TP(pitch)
    window(Ul, ucuts, Ul.loc(-0.25), 0.55, zu + 0.95, zu + 1.5, 0.2)
    frame_wall(Ul, *Ul.span(yu0, y1), zu, H2, [(Ul.loc(-0.25) - 0.275, Ul.loc(-0.25) + 0.275, zu + 0.95, zu + 1.5)])
    gable_frame(Ul, *Ul.span(yu0, y1), H2, zr_u)
    frame_wall(Ur, *Ur.span(yu0, y1), zu, H2, [])
    gable_frame(Ur, *Ur.span(yu0, y1), H2, zr_u)
    cy = (yu0 + y1) / 2
    wall_solid(P, [prism_vf(gable_profile(yu0, y1, H2, pitch, zu), 'x', x0, x1)], 'plaster_lime', ucuts)
    fz, Hu, zr = slate_roof(P, L, D + J, H2, pitch, oE=0.34, oG=0.28, cy=cy, sag=0.05)
    chimney(P, 2.5, cy + 0.3, H1, zr + 0.85, w=0.9, d=0.7)
    return P


def longhouse():
    """긴 막돌 집 (사람 칸 + 외양간), 우진각 초가, 가로지르는 통로 문, 넓은 외양간 문."""
    P = Piece('longhouse', 505)
    L, D, H, pitch = 14.0, 5.4, 2.25, 50
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    zf = 0.1
    P.box(x0 - 0.07, x1 + 0.07, y0 - 0.07, y1 + 0.07, -0.6, 0.12, 'stone_rubble', bevel=0.03)
    cuts = []
    Ff, Fb, Fl, Fr = Face(P, '-y', y0), Face(P, '+y', y1), Face(P, '-x', x0), Face(P, '+x', x1)
    door(Ff, cuts, -1.2, 1.0, 1.85, zf, 0.34, wall='stone')
    door(Ff, cuts, 4.5, 1.7, 1.95, zf, 0.34, wall='stone', ajar=rad(35))
    window(Ff, cuts, -4.9, 0.62, 1.0, 1.6, 0.38, wall='stone', shutters='open')
    window(Ff, cuts, -3.1, 0.62, 1.0, 1.6, 0.38, wall='stone')
    window(Ff, cuts, 1.4, 0.5, 1.05, 1.55, 0.38, wall='stone', shutters='closed')
    window(Ff, cuts, 6.1, 0.22, 1.1, 1.65, 0.38, wall='stone', mull=0, sill=False)
    door(Fb, cuts, Fb.loc(-1.2), 0.95, 1.8, zf, 0.34, wall='stone')
    window(Fb, cuts, Fb.loc(-4.2), 0.6, 1.05, 1.6, 0.38, wall='stone')
    window(Fb, cuts, Fb.loc(3.0), 0.22, 1.1, 1.65, 0.38, wall='stone', mull=0, sill=False)
    window(Fl, cuts, Fl.loc(0.2), 0.55, 1.05, 1.6, 0.38, wall='stone', shutters='open')
    wall_solid(P, [box_vf(x0, x1, y0, y1, 0.0, H)], 'stone_rubble', cuts)
    quoins(P, x0, x1, y0, y1, 0.12, H - 0.05)
    fz, Hu, zr = thatch_roof(P, L, D, H, pitch, 'hip', oE=0.52, sag=0.2, res=0.2)
    chimney(P, -2.6, 0.1, 1.2, zr + 0.6, w=0.85, d=0.65)
    return P


def barn():
    """목골조 + 세로 판자벽, 큰 우진각 초가, 수레 문: 한 짝은 활짝, 한 짝은 처져서 기울어짐."""
    P = Piece('barn', 606)
    L, D, H, pitch = 13.0, 7.2, 3.8, 50
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    zb = 0.5
    plinth(P, x0, x1, y0, y1, zb, out=0.06)
    cuts = []
    Ff, Fb, Fl, Fr = Face(P, '-y', y0), Face(P, '+y', y1), Face(P, '-x', x0), Face(P, '+x', x1)
    dw, dh = 3.6, 3.3
    cuts.append(Ff.cutter(-dw / 2, dw / 2, zb, zb + dh, 4.0))
    door(Fr, cuts, Fr.loc(1.2), 0.95, 2.0, zb, 0.25)
    window(Fl, cuts, Fl.loc(0.0), 0.7, 2.6, 3.1, 0.2, mull=3)
    wall_solid(P, [box_vf(x0, x1, y0, y1, 0.4, H)], 'planks', cuts, tile=2.2)
    for F, a, b in ((Ff, x0, x1), (Fb, x0, x1), (Fl, y0, y1), (Fr, y0, y1)):
        F.member(a, zb + 0.1, b, zb + 0.1, 0.2, prot=0.05)
        F.member(a, H - 0.12, b, H - 0.12, 0.24, prot=0.05)
        F.member(a + 0.12, zb, a + 0.12, H, 0.24, prot=0.055)
        F.member(b - 0.12, zb, b - 0.12, H, 0.24, prot=0.055)
        mid = (a + b) / 2
        if F is not Ff:
            F.member(mid, zb + 0.2, mid, H - 0.24, 0.2, prot=0.045)
    for px in (-dw / 2 - 0.12, dw / 2 + 0.12):
        Ff.member(px, zb, px, H, 0.24, prot=0.06)
    Ff.member(-dw / 2 - 0.25, zb + dh + 0.12, dw / 2 + 0.25, zb + dh + 0.12, 0.24, prot=0.055)
    # 문짝: 판자 + 띠장 + Z 가새
    def leaf(M, w, h):
        P.box(0, w, -0.06, 0.0, 0, h, 'planks', matrix=M, bevel=0.006, tile=1.8)
        for zz in (0.25, h / 2, h - 0.35):
            P.box(0.05, w - 0.05, -0.11, -0.06, zz - 0.08, zz + 0.08, 'timber_dark', matrix=M, bevel=0.008, tile=1.2)
        L2 = math.hypot(w - 0.2, h / 2 - 0.4)
        a = math.atan2(h / 2 - 0.4, w - 0.2)
        for z0 in (0.33, h / 2 + 0.08):
            Mb = M @ Matrix.Translation((0.1, -0.085, z0)) @ Matrix.Rotation(-a, 4, 'Y')
            P.box(0, L2, -0.025, 0.025, -0.06, 0.06, 'timber_dark', matrix=Mb, bevel=0.006, grain='x', tile=(1.6, 0.8))
        for zz in (0.4, h - 0.5):
            P.box(0.02, 0.7, -0.125, -0.11, zz, zz + 0.06, 'iron', matrix=M, tile=1.0)
    hw = dw / 2
    # 왼짝: 바깥으로 활짝 (경첩 x=-hw)
    Ml = Matrix.Translation((-hw, y0 - 0.01, zb + 0.03)) @ Matrix.Rotation(rad(-112), 4, 'Z')
    P.nofoot = True                      # 열린 문짝은 바닥 크기에서 뺀다
    leaf(Ml, hw - 0.02, dh - 0.08)
    # 오른짝: 닫혔지만 경첩이 처져 기울어지고 조금 벌어짐 (경첩 x=+hw)
    Mr = (Matrix.Translation((hw, y0 - 0.01, zb + 0.03)) @ Matrix.Rotation(rad(180 + 16), 4, 'Z')
          @ Matrix.Rotation(rad(-4.5), 4, 'Y') @ Matrix.Translation((0, 0.06, 0.05)))
    leaf(Mr, hw - 0.04, dh - 0.12)
    P.nofoot = False
    fz, Hu, zr = thatch_roof(P, L, D, H, pitch, 'hip', oE=0.55, sag=0.22, res=0.22)
    return P


def smithy():
    """앞이 트인 대장간: 막돌 뒷벽·옆벽, 앞 기둥과 보, 슬레이트 지붕, 화덕(smithy_forge)·덮개·굴뚝, 풀무, 모루, 물통."""
    P = Piece('smithy', 707)
    L, D, H, pitch = 6.4, 6.0, 2.7, 40
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    P.box(x0 - 0.05, x1 + 0.05, y0 - 0.05, y1 + 0.05, -0.5, 0.05, 'cobble', bevel=0.02, tile=1.6)
    wt = 0.5
    cuts = []
    Fb = Face(P, '+y', y1)
    window(Fb, cuts, Fb.loc(1.6), 0.55, 1.2, 1.75, 0.3, wall='stone', shutters='closed')
    wall_solid(P, [box_vf(x0, x1, y1 - wt, y1, 0.0, H)], 'stone_rubble', cuts)
    P.box(x0, x0 + wt, -0.7, y1 - wt, 0.0, H, 'stone_rubble', tile=2.4)
    P.box(x1 - wt, x1, -0.7, y1 - wt, 0.0, H, 'stone_rubble', tile=2.4)
    quoins(P, x0, x1, -0.7, y1, 0.05, H - 0.05)
    # 앞 기둥·보·박공(판자)
    for px in (x0 + 0.17, x1 - 0.17):
        P.beam((px, y0 + 0.2, 0.0), (px, y0 + 0.2, H), 0.26, 0.26, up=(0, -1, 0))
        P.box(px - 0.22, px + 0.22, y0 + 0.0, y0 + 0.4, -0.05, 0.18, 'stone_ashlar', bevel=0.02, tile=1.2)   # 기둥 받침돌
    P.beam((x0 - 0.05, y0 + 0.2, H - 0.12), (x1 + 0.05, y0 + 0.2, H - 0.12), 0.26, 0.3)
    for px in (x0 + 0.17, x1 - 0.17):
        P.beam((px, y0 + 0.05, H - 0.12), (px, -0.7, H - 0.12), 0.24, 0.28)
        P.beam((px, y0 + 0.2, H - 0.9), (px, y0 + 0.95, H - 0.2), 0.14, 0.14)
    for F, xs in ((Face(P, '-x', x0), 1), (Face(P, '+x', x1), -1)):
        zr_u = H + D / 2 * TP(pitch)
        a0, a1 = (x0 + 0.03, x0 + 0.11) if xs > 0 else (x1 - 0.11, x1 - 0.03)
        v, f = prism_vf(gable_profile(y0, y1, H, pitch, H - 0.02), 'x', a0, a1)
        P.add_bm(K.bm_from(v, f), 'planks', tile=1.8)
        gable_frame(F, *F.span(y0, y1), H, zr_u)
    fz, Hu, zr = slate_roof(P, L, D, H, pitch, oE=0.45, oG=0.3, sag=0.06)
    # 화덕
    hx, hy = -1.25, y1 - wt
    P.box(hx - 0.85, hx + 0.85, hy - 0.95, hy, 0.0, 0.82, 'stone_rubble', bevel=0.03, tile=2.0)
    P.box(hx - 0.45, hx + 0.45, hy - 0.72, hy - 0.2, 0.82, 0.9, 'coals', tile=1.0)
    for (a, b, c, d) in ((hx - 0.6, hx + 0.6, hy - 0.86, hy - 0.72), (hx - 0.6, hx - 0.45, hy - 0.86, hy), (hx + 0.45, hx + 0.6, hy - 0.86, hy)):
        P.box(a, b, c, d, 0.82, 0.96, 'stone_ashlar', bevel=0.015, tile=1.2)
    P.marker('smithy_forge', (hx, hy - 0.46, 0.95))
    v, f = frustum_vf(hx, hy - 0.5, 1.7, 1.0, 1.75, 0.85, 0.6, 2.75, 0.2)
    P.add_bm(K.bm_from(v, f), 'stone_rubble', tile=2.0, bevel=0.02)
    P.box(hx - 0.85, hx + 0.85, hy - 1.02, hy, 1.65, 1.78, 'stone_ashlar', bevel=0.015, tile=1.4)
    chimney(P, hx, hy + 0.0, 2.75, zr + 0.4, w=0.85, d=0.62)
    # 풀무 (가죽 쐐기 + 판) 와 받침
    bx = hx + 1.3
    prof = [(bx - 0.5, 1.0), (bx + 0.55, 0.92), (bx + 0.55, 1.28), (bx - 0.5, 1.06)]
    P.prism(prof, 'y', hy - 0.75, hy - 0.2, 'leather', tile=1.0)
    P.prism([(bx - 0.52, 1.06), (bx + 0.6, 1.28), (bx + 0.6, 1.32), (bx - 0.52, 1.1)], 'y', hy - 0.78, hy - 0.17, 'planks', tile=1.0)
    P.beam((bx - 0.5, hy - 0.475, 1.0), (hx + 0.6, hy - 0.475, 0.92), 0.06, 0.06, 'iron', bevel=0.0)
    for lx in (bx - 0.3, bx + 0.4):
        P.beam((lx, hy - 0.475, 0.0), (lx, hy - 0.475, 0.95), 0.1, 0.1)
    # 모루 + 그루터기
    ax, ay = 0.55, -0.6
    P.cyl(0.3, 0.27, 0.55, 'timber_dark', n=12, matrix=Matrix.Translation((ax, ay, 0.0)), tile=1.0)
    P.box(ax - 0.12, ax + 0.12, ay - 0.09, ay + 0.09, 0.55, 0.66, 'iron', bevel=0.01, tile=1.0)
    P.box(ax - 0.3, ax + 0.26, ay - 0.1, ay + 0.1, 0.66, 0.8, 'iron', bevel=0.015, tile=1.0)
    P.prism([(ax + 0.26, 0.69), (ax + 0.55, 0.77), (ax + 0.55, 0.785), (ax + 0.26, 0.8)], 'y', ay - 0.06, ay + 0.06, 'iron', tile=1.0)
    # 담금 물통
    tx, ty = -2.35, 0.6
    P.cyl(0.36, 0.38, 0.55, 'planks', n=14, matrix=Matrix.Translation((tx, ty, 0.0)), tile=0.8, caps=False)
    for zz in (0.1, 0.42):
        P.cyl(0.39, 0.39, 0.05, 'iron', n=14, matrix=Matrix.Translation((tx, ty, zz)), caps=False)
    P.cyl(0.35, 0.35, 0.01, 'water', n=14, matrix=Matrix.Translation((tx, ty, 0.45)))
    P.cyl(0.36, 0.36, 0.03, 'planks', n=14, matrix=Matrix.Translation((tx, ty, 0.0)))
    # 작업대 (옆벽 따라)
    P.box(x1 - wt - 0.62, x1 - wt - 0.02, 0.2, 2.1, 0.82, 0.9, 'planks', bevel=0.01, tile=1.6)
    for yy in (0.3, 2.0):
        P.box(x1 - wt - 0.55, x1 - wt - 0.45, yy - 0.05, yy + 0.05, 0.0, 0.82, 'timber_dark', tile=1.0)
    # 벽에 건 연장 (집게·망치 자루)
    for k in range(5):
        tx2 = 0.3 + k * 0.22
        P.box(tx2 - 0.015, tx2 + 0.015, y1 - wt - 0.04, y1 - wt - 0.01, 1.05 + (k % 2) * 0.1, 1.65, 'iron', tile=1.0)
    P.box(0.15, 1.35, y1 - wt - 0.08, y1 - wt, 1.62, 1.7, 'timber_dark', tile=1.0)
    return P


def church():
    """교회: 서쪽 네모 탑(총안 성가퀴·작은 첨탑·버팀벽·종탑 창), 슬레이트 본당·제단부, 뾰족 창, 남쪽 현관."""
    P = Piece('church', 808)
    A = 'stone_ashlar'
    # 본당
    nx0, nx1, ny, Hn, pn = -8.0, 8.0, 4.2, 6.6, 52
    cx0, cx1, cy_, Hc = 8.0, 15.0, 3.1, 5.4
    tx0, tx1, ty, Ht = -13.8, -8.0, 2.9, 16.0
    wd = 0.45
    # 기단 (쇠시리)
    for (a, b, c) in ((nx0, nx1, ny), (cx0, cx1, cy_), (tx0, tx1, ty)):
        P.box(a - 0.15, b + 0.15, -c - 0.15, c + 0.15, -0.6, 0.45, A, bevel=0.06, tile=2.6)
    cuts = []
    Fs, Fn = Face(P, '-y', -ny), Face(P, '+y', ny)
    for x in (-5.8, 1.4, 5.2):
        lancet(Fs, cuts, x, 0.78, 2.3, 4.7, wd)
    for x in (-5.4, -1.2, 3.2):
        lancet(Fn, cuts, Fn.loc(x), 0.78, 2.3, 4.7, wd)
    # 남쪽 문 (현관 안쪽)
    cuts.append(Fs.cutter(-5.3, -3.9, 0.3, 2.5, 0.35, arch=True))
    Fs.box(-5.3, -3.9, 0.3, 0.35, 0.3, 3.7, 'planks', tile=1.6)
    wall_solid(P, [prism_vf(gable_profile(-ny, ny, Hn, pn, 0.2), 'x', nx0 - 0.3, nx1)], A, cuts)
    zrn = Hn + ny * TP(pn)
    slate_roof(P, nx1 - nx0, 2 * ny, Hn, pn, oE=0.35, xlim=(nx0 - 0.1, nx1 - 0.25), barge=(False, False))
    coping(P, nx1 - 0.2, ny + 0.06, Hn, pn, cross=True)
    # 제단부
    ccuts = []
    Fcs, Fcn, Fce = Face(P, '-y', -cy_), Face(P, '+y', cy_), Face(P, '+x', cx1)
    lancet(Fcs, ccuts, 11.6, 0.7, 2.2, 4.0, wd)
    lancet(Fcn, ccuts, Fcn.loc(11.6), 0.7, 2.2, 4.0, wd)
    lancet(Fce, ccuts, 0.0, 0.8, 1.9, 4.2, wd)
    lancet(Fce, ccuts, -1.05, 0.55, 2.1, 3.7, wd)
    lancet(Fce, ccuts, 1.05, 0.55, 2.1, 3.7, wd)
    cuts2 = ccuts + [Fcs.cutter(13.4, 14.2, 0.3, 2.0, 0.3, arch=True)]
    Fcs.box(13.4, 14.2, 0.25, 0.3, 0.3, 3.0, 'planks', tile=1.6)
    wall_solid(P, [prism_vf(gable_profile(-cy_, cy_, Hc, pn, 0.2), 'x', cx0 - 0.4, cx1)], A, cuts2)
    slate_roof(P, cx1 - cx0, 2 * cy_, Hc, pn, oE=0.32, xlim=(cx0 - 0.3, cx1 - 0.25), barge=(False, False))
    coping(P, cx1 - 0.2, cy_ + 0.06, Hc, pn, cross=True)
    # 탑
    tcuts = []
    Fw = Face(P, '-x', tx0)
    tfaces = [Face(P, '-y', -ty), Face(P, '+y', ty), Fw, Face(P, '+x', tx1)]
    cuts_w = Fw.cutter(-0.75, 0.75, 0.3, 2.5, 0.85, arch=True)
    tcuts.append(cuts_w)
    Fw.box(-0.75, 0.75, 0.8, 0.85, 0.3, 4.0, 'planks', tile=1.6)
    Fw.box(-0.95, 0.95, -0.12, 0.05, 2.45, 2.62, A, bevel=0.02, tile=1.4)
    lancet(Fw, tcuts, 0.0, 0.85, 5.6, 7.3, 0.6)
    tcx = (tx0 + tx1) / 2
    for k, F in enumerate(tfaces):
        c0 = F.loc(tcx) if k < 2 else 0.0
        for c in (-0.55, 0.55):          # 종탑 창 (나무 비늘판)
            lancet(F, tcuts, c0 + c, 0.55, 12.6, 14.0, 0.6, louvre=True)
        if k < 2:
            lancet(F, tcuts, c0, 0.26, 8.4, 9.3, 0.4, glass_only=True)
    wall_solid(P, [box_vf(tx0, tx1, -ty, ty, 0.2, Ht)], A, tcuts)
    for z in (5.0, 11.0):              # 띠돌림
        P.box(tx0 - 0.12, tx1 + 0.12, -ty - 0.12, ty + 0.12, z, z + 0.22, A, bevel=0.04, tile=2.0)
    P.box(tx0 - 0.16, tx1 + 0.16, -ty - 0.16, ty + 0.16, Ht - 0.1, Ht + 0.18, A, bevel=0.04, tile=2.0)
    # 성가퀴: 난간벽 + 총안
    pw = 0.4
    for (a, b, c, d) in ((tx0 - 0.08, tx1 + 0.08, -ty - 0.08, -ty - 0.08 + pw), (tx0 - 0.08, tx1 + 0.08, ty + 0.08 - pw, ty + 0.08),
                         (tx0 - 0.08, tx0 - 0.08 + pw, -ty, ty), (tx1 + 0.08 - pw, tx1 + 0.08, -ty, ty)):
        P.box(a, b, c, d, Ht + 0.18, Ht + 0.85, A, bevel=0.02, tile=2.0)
    P.box(tx0 + 0.3, tx1 - 0.3, -ty + 0.3, ty - 0.3, Ht - 0.2, Ht + 0.3, 'slate', tile=1.8)
    span = (tx1 - tx0) + 0.16
    nm = 5
    for side in range(4):
        for k in range(nm):
            s = -span / 2 + 0.3 + k * (span - 0.6) / (nm - 1)
            if side == 0:
                bx, by, w_, d_ = (tx0 + tx1) / 2 + s, -ty - 0.08 + pw / 2, 0.62, pw
            elif side == 1:
                bx, by, w_, d_ = (tx0 + tx1) / 2 + s, ty + 0.08 - pw / 2, 0.62, pw
            elif side == 2:
                bx, by, w_, d_ = tx0 - 0.08 + pw / 2, s, pw, 0.62
            else:
                bx, by, w_, d_ = tx1 + 0.08 - pw / 2, s, pw, 0.62
            if k in (0, nm - 1):
                continue
            P.box(bx - w_ / 2, bx + w_ / 2, by - d_ / 2, by + d_ / 2, Ht + 0.85, Ht + 1.5, A, bevel=0.02, tile=1.4)
            P.box(bx - w_ / 2 - 0.03, bx + w_ / 2 + 0.03, by - d_ / 2 - 0.03, by + d_ / 2 + 0.03, Ht + 1.5, Ht + 1.58, A, bevel=0.015, tile=1.4)
    for (px, py) in ((tx0 + 0.05, -ty - 0.05), (tx1 - 0.05, -ty - 0.05), (tx0 + 0.05, ty + 0.05), (tx1 - 0.05, ty + 0.05)):
        P.box(px - 0.32, px + 0.32, py - 0.32, py + 0.32, Ht + 0.18, Ht + 1.75, A, bevel=0.03, tile=1.4)
        v, f = frustum_vf(px, py, 0.7, 0.7, Ht + 1.75, 0.02, 0.02, Ht + 2.65)
        P.add_bm(K.bm_from(v, f), A, tile=1.4)
    # 탑 버팀벽 (서쪽 모서리 두 쌍) + 본당 버팀벽
    for sy in (-1, 1):
        buttress(P, 'x', tx0, sy * (ty - 0.55), -1, 0.9, 1.1, 9.5, A)
        buttress(P, 'y', tx0 + 0.55, sy * ty, sy, 0.9, 1.1, 9.5, A)
    for x in (-3.2, 3.6):
        for sy in (-1, 1):
            if sy < 0 and x < 0:
                continue
            buttress(P, 'y', x, sy * ny, sy, 0.7, 0.85, 4.2, A)
    for sy in (-1, 1):
        buttress(P, 'y', nx1 - 0.35, sy * ny, sy, 0.7, 0.85, 4.2, A)
        buttress(P, 'x', cx1, sy * (cy_ - 0.35), 1, 0.65, 0.8, 3.4, A)
    # 남쪽 현관 (박공 지붕은 y 방향)
    px0, px1, py0, py1, Hp = -6.2, -3.0, -7.4, -ny + 0.05, 2.9
    pcuts = []
    Fp = Face(P, '-y', py0)
    pcuts.append(Fp.cutter(-5.3, -3.9, 0.25, 1.95, 2.85, arch=True))
    Fp.box(-5.5, -3.7, -0.1, 0.05, 2.1, 2.24, A, bevel=0.015, tile=1.2)
    P.box(px0 - 0.1, px1 + 0.1, py0 - 0.1, py1, -0.6, 0.3, A, bevel=0.04, tile=2.6)
    wall_solid(P, [prism_vf(gable_profile(px0, px1, Hp, 50, 0.25), 'y', py0, py1)], A, pcuts)
    P.box(-5.2, -4.0, py0 + 0.3, py1 - 0.3, 0.25, 0.3, 'cobble', tile=1.6)
    Rz = Matrix.Translation(((px0 + px1) / 2, 0, 0)) @ Matrix.Rotation(rad(90), 4, 'Z')
    # 회전된 지붕: 로컬 x(용마루) → 세계 y, 로컬 y → 세계 -x
    slate_roof(P, py1 - py0, px1 - px0, Hp, 50, oE=0.25, xlim=(py0 + 0.05, py1 + 0.1), matrix=Rz, barge=(False, False))
    coping(P, py0 + 0.15, (px1 - px0) / 2 + 0.06, Hp, 50, cross=True, axis='y', cx=(px0 + px1) / 2, flip=True)
    return P


def lancet(F, cuts, c, w, z0, zs, depth, louvre=False, glass_only=False):
    """뾰족 창: 깊은 창턱 + 안쪽 유리(또는 종탑 비늘판) + 가운데 살."""
    P = F.P
    x0, x1 = c - w / 2, c + w / 2
    cuts.append(F.cutter(x0, x1, z0, zs, depth, arch=True))
    poly = pointed_poly(x0, x1, z0, zs)
    v, f = prism_vf(poly, 'y', depth - 0.04, depth + 0.02)
    P.add_bm(K.bm_from([tuple(F.M @ Vector(p)) for p in v], f), 'glass', tile=1.0)
    if louvre:
        n = 6
        for k in range(n):
            z = z0 + 0.1 + k * (zs - z0 + 0.2) / n
            Ml = F.M @ Matrix.Translation((c, depth * 0.5, z)) @ Matrix.Rotation(rad(-35), 4, 'X')
            P.box(-w / 2, w / 2, -0.12, 0.12, -0.015, 0.015, 'timber_dark', matrix=Ml, tile=1.0)
    elif not glass_only and w > 0.6:
        F.member(c, z0, c, zs + w * 0.7, 0.07, prot=-(depth - 0.12), depth=0.1, mat='stone_ashlar', jitter=0)
    # 창 아래 물끊기 돌
    F.box(x0 - 0.12, x1 + 0.12, -0.08, 0.15, z0 - 0.12, z0, 'stone_ashlar', bevel=0.015, tile=1.2)


def buttress(P, axis, a, b, sgn, w, d, h, mat):
    """버팀벽: 벽면에서 sgn 방향으로 d 만큼, 위로 갈수록 두 단으로 물러난다.
    axis='y': 벽면 y=b, 가운데 x=a.  axis='x': 벽면 x=a, 가운데 y=b."""
    prof = [(0.0, -0.4), (d, -0.4), (d, h * 0.55), (d * 0.62, h * 0.55 + 0.35), (d * 0.62, h), (0.0, h + d * 0.62 * 0.9)]
    if axis == 'y':
        v, f = prism_vf([(b + sgn * p[0], p[1]) for p in prof], 'x', a - w / 2, a + w / 2)
    else:
        v, f = prism_vf([(a + sgn * p[0], p[1]) for p in prof], 'y', b - w / 2, b + w / 2)
    bm = K.bm_from(v, f)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    P.add_bm(bm, mat, tile=2.6, bevel=0.02)


def coping(P, x, hy, H, pitch, cross=False, axis='x', cx=0.0, flip=False):
    """박공 머리 갓돌 (지붕선 위로 0.35 솟은 돌 띠) + 십자가."""
    tp = TP(pitch)
    prof = [(-hy, H - 0.1), (hy, H - 0.1), (hy, H + 0.38), (0, H + 0.38 + hy * tp), (-hy, H + 0.38)]
    inner = [(-hy + 0.02, H + 0.25), (hy - 0.02, H + 0.25), (0, H + 0.25 + (hy - 0.02) * tp)]
    if axis == 'x':
        v, f = prism_vf(prof, 'x', x - 0.25, x + 0.3)
    else:
        v, f = prism_vf([(cx + p[0], p[1]) for p in prof], 'y', x - 0.3, x + 0.25)
    P.add_bm(K.bm_from(v, f), 'stone_ashlar', tile=1.6, bevel=0.02)
    if cross:
        top = H + 0.38 + hy * tp
        if axis == 'x':
            P.box(x - 0.08, x + 0.08, -0.08, 0.08, top - 0.1, top + 0.85, 'stone_ashlar', bevel=0.015, tile=1.0)
            P.box(x - 0.08, x + 0.08, -0.32, 0.32, top + 0.45, top + 0.62, 'stone_ashlar', bevel=0.015, tile=1.0)
        else:
            P.box(cx - 0.08, cx + 0.08, x - 0.08, x + 0.08, top - 0.1, top + 0.75, 'stone_ashlar', bevel=0.015, tile=1.0)
            P.box(cx - 0.28, cx + 0.28, x - 0.08, x + 0.08, top + 0.38, top + 0.54, 'stone_ashlar', bevel=0.015, tile=1.0)


def mill():
    """물레방앗간: 2층 막돌, 슬레이트 박공, 뒤(+y)쪽에 따로 도는 물레바퀴 mill_wheel."""
    P = Piece('mill', 909)
    L, D, H, pitch = 8.0, 6.4, 5.0, 45
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    P.box(x0 - 0.08, x1 + 0.08, y0 - 0.08, y1 + 0.08, -1.6, 0.14, 'stone_rubble', bevel=0.03)
    cuts = []
    Ff, Fb, Fl, Fr = Face(P, '-y', y0), Face(P, '+y', y1), Face(P, '-x', x0), Face(P, '+x', x1)
    door(Ff, cuts, -1.5, 1.15, 2.05, 0.12, 0.4, wall='stone')
    window(Ff, cuts, 1.7, 0.8, 1.0, 1.8, 0.42, wall='stone', shutters='open')
    window(Ff, cuts, -1.5, 0.75, 3.15, 3.85, 0.42, wall='stone')
    window(Ff, cuts, 1.7, 0.75, 3.15, 3.85, 0.42, wall='stone', shutters='closed')
    window(Fb, cuts, Fb.loc(-2.4), 0.6, 1.2, 1.85, 0.42, wall='stone')
    window(Fb, cuts, Fb.loc(-2.4), 0.6, 3.2, 3.85, 0.42, wall='stone')
    door(Fl, cuts, Fl.loc(0.0), 1.1, 1.6, 3.3, 0.35, wall='stone', step=False)       # 자루 올리는 문
    window(Fr, cuts, Fr.loc(0.5), 0.55, 1.2, 1.8, 0.42, wall='stone', shutters='open')
    wall_solid(P, [prism_vf(gable_profile(y0, y1, H, pitch, -0.2), 'x', x0, x1)], 'stone_rubble', cuts)
    quoins(P, x0, x1, y0, y1, 0.14, H - 0.05)
    P.beam((x0 + 0.3, 0, 5.25), (x0 - 0.85, 0, 5.25), 0.18, 0.2)      # 자루 도르래 들보
    fz, Hu, zr = slate_roof(P, L, D, H, pitch, oE=0.38, oG=0.3, sag=0.06)
    chimney(P, -2.9, 0.4, 3.5, zr + 0.6, w=0.75, d=0.6)
    # 바퀴 (따로): 피벗 = 축 가운데
    R, W = 2.2, 0.9
    piv = (0.8, y1 + 0.18 + W / 2, 1.0)
    P.subs.append(('mill_wheel', piv, build_wheel(R, W)))
    # 바깥 축받이 기둥 + 수로 벽
    oy = piv[1] + W / 2 + 0.45
    P.beam((piv[0], oy, -1.7), (piv[0], oy, piv[2] + 0.2), 0.28, 0.28)
    P.box(piv[0] - 0.25, piv[0] + 0.25, oy - 0.2, oy + 0.2, piv[2] - 0.28, piv[2] - 0.12, 'timber_dark', bevel=0.01)
    P.beam((piv[0], y1, piv[2]), (piv[0], oy + 0.1, piv[2]), 0.1, 0.1, 'iron', bevel=0.0)
    P.box(x0 + 1.0, x1 - 0.2, y1, oy + 0.35, -1.9, -1.45, 'stone_rubble', bevel=0.02)
    return P


def build_wheel(R, W):
    S = Piece('mill_wheel_geo', 910)
    n = 24
    for side in (-1, 1):
        yy = side * W / 2
        for ring_r, sw, sh in ((R - 0.07, 0.09, 0.15), (R * 0.6, 0.08, 0.11)):
            for k in range(n):
                a0, a1 = 2 * math.pi * k / n, 2 * math.pi * (k + 1) / n
                am = (a0 + a1) / 2
                p0 = (ring_r * math.cos(a0), yy, ring_r * math.sin(a0))
                p1 = (ring_r * math.cos(a1), yy, ring_r * math.sin(a1))
                S.beam(p0, p1, sw, sh, up=(math.cos(am), 0, math.sin(am)), ext=0.03, bevel=0.008)
        for k in range(8):
            a = 2 * math.pi * k / 8 + (0.2 if side > 0 else 0.2)
            S.beam((0.3 * math.cos(a), yy, 0.3 * math.sin(a)), ((R - 0.1) * math.cos(a), yy, (R - 0.1) * math.sin(a)), 0.1, 0.08,
                   up=(0, 1, 0), bevel=0.008)
    for k in range(20):
        a = 2 * math.pi * k / 20
        M = Matrix.Rotation(-a, 4, 'Y') @ Matrix.Translation((R - 0.2, 0, 0)) @ Matrix.Rotation(rad(12), 4, 'Y')
        S.box(-0.28, 0.24, -W / 2 - 0.04, W / 2 + 0.04, -0.022, 0.022, 'planks', matrix=M, bevel=0.005, tile=1.2)
    Mx = Matrix.Rotation(rad(-90), 4, 'X')
    S.cyl(0.34, 0.34, W + 0.18, 'timber_dark', n=12, matrix=Mx @ Matrix.Translation((0, 0, -(W + 0.18) / 2)), tile=1.0)
    S.cyl(0.12, 0.12, 1.9, 'timber_dark', n=10, matrix=Mx @ Matrix.Translation((0, 0, -1.0)), tile=1.0)
    for yy in (-W / 2 - 0.1, W / 2 + 0.06):
        S.cyl(0.36, 0.36, 0.05, 'iron', n=12, matrix=Mx @ Matrix.Translation((0, 0, yy)), caps=False)
    return S


def well():
    """둥근 돌우물: 갓돌, 나무 기둥 둘 + 도르래 굴대·손잡이, 작은 판자 지붕, 두레박, 자갈 바닥."""
    P = Piece('well', 1001)
    v, f = ring_vf(0.8, 0.56, -0.5, 0.72, 22)
    bm = K.bm_from(v, f)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    P.add_bm(bm, 'stone_rubble', tile=1.6, bevel=0.015)
    v, f = ring_vf(0.87, 0.52, 0.72, 0.86, 22)
    bm = K.bm_from(v, f)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    P.add_bm(bm, 'stone_ashlar', tile=1.2, bevel=0.02)
    P.cyl(0.56, 0.56, 0.02, 'water', n=22, matrix=Matrix.Translation((0, 0, -0.32)), smooth=False)
    pts = [(1.6 * math.cos(2 * math.pi * k / 8 + math.pi / 8), 1.6 * math.sin(2 * math.pi * k / 8 + math.pi / 8)) for k in range(8)]
    v, f = prism_vf(pts, 'z', -0.15, 0.04)
    P.add_bm(K.bm_from(v, f), 'cobble', tile=1.4)
    for sx in (-1, 1):
        P.beam((sx * 0.74, 0, -0.3), (sx * 0.74, 0, 2.08), 0.15, 0.15)
        P.beam((sx * 0.74, -0.35, 0.86), (sx * 0.74, 0, 1.5), 0.08, 0.08)
    P.beam((-0.95, 0, 2.02), (0.95, 0, 2.02), 0.14, 0.16)
    My = Matrix.Rotation(rad(90), 4, 'Y')
    P.cyl(0.1, 0.1, 1.62, 'timber_dark', n=10, matrix=Matrix.Translation((-0.81, 0, 1.3)) @ My, tile=1.0)
    P.cyl(0.13, 0.13, 0.32, 'leather', n=10, matrix=Matrix.Translation((-0.1, 0, 1.3)) @ My, tile=1.0)
    P.beam((0.82, 0, 1.3), (1.0, 0, 1.3), 0.03, 0.03, 'iron', bevel=0)
    P.beam((1.0, 0, 1.3), (1.0, 0, 1.0), 0.03, 0.03, 'iron', bevel=0)
    P.beam((1.0, 0, 1.0), (1.14, 0, 1.0), 0.04, 0.04, 'iron', bevel=0)
    P.beam((0.05, -0.1, 1.27), (0.05, -0.1, 1.12), 0.015, 0.015, 'leather', bevel=0)
    P.cyl(0.15, 0.17, 0.3, 'planks', n=12, matrix=Matrix.Translation((0.05, -0.1, 0.82)), tile=0.6)
    P.cyl(0.175, 0.175, 0.03, 'iron', n=12, matrix=Matrix.Translation((0.05, -0.1, 1.06)), caps=False)
    # 지붕 (판자 두 장)
    for sy in (-1, 1):
        P.beam((0, sy * 0.8, 2.12), (0, sy * 0.02, 2.64), 2.16, 0.045, 'planks', tile=(1.4, 1.4), bevel=0.005)
    P.beam((-1.1, 0, 2.63), (1.1, 0, 2.63), 0.1, 0.1)
    return P


def market_stall():
    """장터 좌판: 기둥 넷, 판자 계산대, 줄무늬 천 차양(처짐 + 물결 드림), 상자 둘."""
    P = Piece('market_stall', 1101)
    w, d = 3.0, 1.8
    for (x, y, h) in ((-1.45, -0.85, 2.25), (1.45, -0.85, 2.25), (-1.45, 0.85, 2.55), (1.45, 0.85, 2.55)):
        P.beam((x, y, -0.2), (x, y, h), 0.1, 0.1)
    P.box(-1.52, 1.52, -0.98, -0.32, 0.86, 0.92, 'planks', bevel=0.008, tile=1.6)
    P.box(-1.52, 1.52, -0.99, -0.95, 0.25, 0.86, 'planks', bevel=0.005, tile=1.6)
    for x in (-1.5, 1.5):
        P.box(x - 0.02, x + 0.02, -0.95, -0.35, 0.25, 0.86, 'planks', tile=1.6)
    P.box(-1.4, 1.4, 0.55, 0.85, 1.2, 1.24, 'planks', tile=1.6)
    P.beam((-1.5, -0.85, 2.2), (1.5, -0.85, 2.2), 0.08, 0.1)
    P.beam((-1.5, 0.85, 2.5), (1.5, 0.85, 2.5), 0.08, 0.1)
    # 차양
    def fz(x, y):
        t = (y + 1.4) / 2.4
        return 2.24 + t * 0.34 - 0.07 * (1 - (x / 1.7) ** 2) * math.sin(math.pi * min(1, max(0, t)))
    xs, ys = lin(-1.7, 1.7, 24), lin(-1.4, 1.0, 14)

    def uvf(me, poly):
        return [(me.vertices[i].co.x / 1.0 + 0.25, me.vertices[i].co.y / 1.0) for i in poly.vertices]
    ob = K.heightfield(fz, xs, ys, 0.012, uvfn=uvf, name='awning')
    P.add_obj(ob, 'canvas', keep_uv=True, smooth=True)
    # 드림 (물결 끝)
    v, f = [], []
    nx = 60
    for i in range(nx + 1):
        x = -1.7 + 3.4 * i / nx
        zt = fz(x, -1.4)
        zb_ = zt - 0.24 + 0.07 * abs(math.sin(math.pi * x / 0.425))
        v += [(x, -1.405, zb_), (x, -1.405, zt)]
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
    for (x, s) in ((-0.8, 0.45), (0.55, 0.38)):
        P.box(x - s / 2, x + s / 2, -0.85, -0.45, 0.92, 0.92 + s * 0.6, 'planks', bevel=0.01, tile=1.0)
    P.box(0.9, 1.4, -0.3, 0.2, 0.0, 0.42, 'planks', bevel=0.01, tile=1.0)
    return P


BUILDERS = [cottage_a, cottage_b, cottage_c, house_jetty, longhouse, barn, smithy, church, mill, well, market_stall]


# ───────────────────────── 실행 ─────────────────────────
CENTER = {'barn': (0.0, 0.0), 'mill': (0.0, 0.9)}     # 문짝·바퀴 때문에 경계 상자 가운데가 몸채에서 벗어나는 조각
CAM = {'mill': (215, 12), 'smithy': (-28, 16), 'church': (-35, 12), 'market_stall': (-30, 10)}


def recenter(root, foot):
    """바닥 가운데를 원점으로: 메시 xy 경계 상자 가운데를 0 으로 옮긴다 (표시 노드·바퀴도 같이).
    돌려주는 크기 = 바닥 경계 상자(foot: 열린 문짝 같은 nofoot 부품을 뺀 것) 의 x, y 와 메시 높이."""
    me_obj = [c for c in root.children if c.type == 'MESH'][0]
    xs = [v.co.x for v in me_obj.data.vertices]
    ys = [v.co.y for v in me_obj.data.vertices]
    cx, cy = CENTER.get(root.name, ((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2))
    for c in root.children:
        if c.type == 'MESH':
            c.data.transform(Matrix.Translation((-cx, -cy, 0)))
        else:
            c.location.x -= cx
            c.location.y -= cy
    return (foot[1] - foot[0], foot[3] - foot[2], max(v.co.z for v in me_obj.data.vertices))


def main():
    t0 = time.time()
    K.reset_scene()
    setup_materials()
    only = [s for s in os.environ.get('KIT_ONLY', '').split(',') if s]
    roots, dims = [], {}
    for i, b in enumerate(BUILDERS):
        if only and b.__name__ not in only:
            continue
        ts = time.time()
        P = b()
        root = P.finish()
        dims[root.name] = recenter(root, P.foot)
        roots.append(root)
        log('%-13s %6d 삼각형  %.1fs  %s' % (root.name, sum(K.tri_count(o) for o in K.mesh_objects([root])), time.time() - ts,
                                         'x'.join('%.1f' % d for d in dims[root.name])))
    # 굽기: 조각을 멀리 떨어뜨려 놓는다
    for i, r in enumerate(roots):
        r.location = (i * 60.0, 0, 0)
    objs = K.mesh_objects(roots)
    K.make_ao_uvs(objs)
    img = K.bake_ao(objs, size=2048, samples=256, distance=1.4)
    mats = [K.MATS[n] for n in K.MATS]
    K.wire_ao(mats, img)
    for r in roots:
        r.location = (0, 0, 0)
    # 일부만 지을 때(KIT_ONLY)는 배포 파일을 건드리지 않는다: KIT_EXPORT=1 이면 임시 폴더에 england_partial.glb
    out = os.path.join(K.KITS, 'england.glb') if not only else os.path.join(K.BUILD, 'england_partial.glb')
    tris = {r.name: sum(K.tri_count(o) for o in K.mesh_objects([r])) for r in roots}
    info = K.export_glb(roots, out) if not only or os.environ.get('KIT_EXPORT') == '1' else {}
    if not only:
        # 조각 바닥 크기 [x 길이, z 깊이, 높이] m — realscene 의 KIT_DIMS(kitdata.js) 와 test/kit.test.mjs 가 맞춰 본다
        with open(os.path.join(K.KITS, 'england.dims.json'), 'w', encoding='utf-8', newline='\n') as f:
            json_dump({'source': 'tools/blender/kit_england.py', 'units': 'm, [x 길이, 앞뒤 깊이, 높이]',
                       'pieces': {k: [round(x, 2) for x in v] for k, v in dims.items()}}, f)
            f.write('\n')
    log('삼각형 합계', sum(tris.values()), tris)
    stats = {'tris': tris, 'dims': {k: [round(x, 2) for x in v] for k, v in dims.items()}, 'glb': info,
             'sha': K.sha(out) if info else None, 'seconds': round(time.time() - t0, 1)}
    with open(os.path.join(K.BUILD, 'england_stats.json'), 'w', encoding='utf-8') as f:
        json_dump(stats, f)
    log('STATS', stats)
    if os.environ.get('KIT_NOPREVIEW') != '1':
        previews(roots, mats)
    log('끝 %.1fs' % (time.time() - t0))


def json_dump(o, f):
    import json
    json.dump(o, f, ensure_ascii=False, indent=1)


def previews(roots, mats):
    K.ao_into_basecolor(mats)
    K.setup_preview(sun_elev=26, sun_az=135, grass=os.path.join(K.TEX, 'leafy_grass_diff_1k.jpg'))
    by = {r.name: r for r in roots}
    # 마을처럼 늘어놓기 (길은 x 방향, y=0)
    LAYOUT = {
        'cottage_a': (-14, -8, 0), 'cottage_c': (-4, -8.5, 0.05), 'house_jetty': (6.5, -8.2, 0), 'cottage_b': (19, -8.6, -0.04),
        'longhouse': (-12, 9.5, math.pi), 'well': (1.5, -1.8, 0.3), 'market_stall': (4.5, 2.5, math.pi - 0.1), 'smithy': (12, 8.5, math.pi),
        'barn': (30, 10, math.pi), 'church': (2, 30, math.pi), 'mill': (-30, -6, 0.1),
    }
    for n, (x, y, rz) in LAYOUT.items():
        if n in by:
            by[n].location = (x, y, 0)
            by[n].rotation_euler = (0, 0, rz)
    shots = [
        ('england_overview', (-38, -46, 22), (2, 4, 2), 30),
        ('england_street', (-20, -1.2, 1.65), (10, -6.5, 3.2), 28),
        ('england_street2', (16, 1.5, 1.65), (-6, -7, 3.0), 30),
    ]
    for name, pos, tgt, lens in shots:
        cam = K.camera_look(name, pos, tgt, lens)
        K.render_to(cam, os.path.join(K.PREVIEW, name + '.png'))
    # 조각마다 3/4 시점 (따로 세워서)
    for r in roots:
        r.location = (1000, 1000, -500)
    for r in roots:
        r.location = (0, 0, 0)
        r.rotation_euler = (0, 0, 0)
        bpy.context.view_layer.update()
        me = [c for c in r.children_recursive if c.type == 'MESH']
        pts = [c.matrix_world @ v.co for c in me for v in c.data.vertices]
        lo = Vector((min(p.x for p in pts), min(p.y for p in pts), 0))
        hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
        ctr = (lo + hi) / 2
        rad_ = (hi - lo).length / 2
        dist = rad_ / math.sin(rad(26)) * 1.22
        az, el = (rad(a) for a in CAM.get(r.name, (-38, 13)))
        pos = (ctr.x + math.sin(az) * dist * math.cos(el), ctr.y - math.cos(az) * dist * math.cos(el), max(1.6, ctr.z * 0.6 + math.sin(el) * dist))
        cam = K.camera_look('cam_' + r.name, pos, (ctr.x, ctr.y, ctr.z * 0.75), 35)
        K.render_to(cam, os.path.join(K.PREVIEW, 'england_%s.png' % r.name))
        r.location = (1000, 1000, -500)


if __name__ == '__main__':
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)               # Blender 가 0 으로 끝나지 않게 (실패를 알린다)
