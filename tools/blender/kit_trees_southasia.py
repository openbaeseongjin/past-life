# 남아시아 식생 세트 — Blender 4.2 명령줄 스크립트. ez-tree(MIT)로 못 짓는 꼴만 여기서 짓는다 (넓은잎 나무는 kitdata.js TREES_SA 의 ez-tree 프리셋).
#   GLTFT=<gltf-transform 폴더> "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe" --background --python tools/blender/kit_trees_southasia.py
# 결과: docs/past-life/assets/real/kits/trees_southasia.glb (meshopt + WebP), kits/trees_southasia.dims.json, kits/preview/southasia_trees.png
# 노드 (바닥 가운데 = 줄기 밑동, 미터):
#   palm_coconut  코코넛 야자 (키 ~9.5 m, 휜 줄기, 잎 18, 열매 송이, 마른 잎 둘)
#   palm_areca    빈랑 야자 (키 ~11 m, 곧고 가는 줄기, 초록 잎집, 잎 9)
#   palm_date     대추 야자 (키 ~6.5 m, 굵은 줄기, 뻣뻣한 회녹 잎 22 + 아래 마른 잎 치마) — 마른 땅
#   banana        바나나 포기 (헛줄기 셋, 넓은 잎 + 찢긴 가장자리, 꽃송이 하나)
#   bamboo_clump  대나무 포기 (줄기 18, 바깥으로 휘어 오름, 잔가지 끝 잎 다발)
#   banyan_roots  반얀 공기뿌리 (ez-tree 반얀 밑에 함께 놓는 것: 매달린 가는 뿌리 + 땅에 닿아 굵어진 기둥 뿌리, 반지름 ~8 m, 높이 ~7.5 m)
#   grass_tall    카슈 풀 포기 (키 ~1.9 m, 흰 이삭) — 계절풍 둑·물가
#   grass_dry     마른 풀 포기 (키 ~0.7 m) — 마른 땅
# 재료: 조각마다 둘 — 줄기 palm_bark(Poly Haven palm_tree_bark)·bark(bark_brown_02)·bamboo(bamboo_wall) 가운데 하나 + 잎 frond(이 스크립트가 만든 잎 띠 그림, 양면).
#   frond 한 장의 가로 16 칸 = 코코넛·빈랑·대추·마른 잎·대나무·바나나·풀·마른 풀 잎 + 열매·야자 섬유·잎집·이삭·꽃·바나나 열매·마디·빈랑 열매 색.
#   장면(realscene.js)은 줄기 = bGeo, frond = lGeo 로 받아 ez-tree 나무와 같은 틀(가까이 InstancedMesh, 멀리 8방향 빌보드)로 그린다.
# 그늘(AO)은 굽지 않는다 (나무는 장면이 빛을 따로 준다). 결정성: 난수는 Piece 의 random.Random(고정 씨앗)만.
import os, sys, math, time, json
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
import numpy as np
from mathutils import Vector, Matrix
import kit_common as K
from kit_common import Piece, log
import kit_props as KP
import kit_sa_common as S
from kit_sa_common import Tm, Rz, Ry, Rx
from kit_props import lathe_bm, tube_bm, ellipsoid_bm

rad = math.radians
NAME = 'trees_southasia'
BANDS = ['coconut', 'areca', 'date', 'dead', 'bamboo', 'banana', 'grass', 'grass_dry', 'nut', 'coir', 'shaft', 'plume', 'flower', 'fruit', 'stem', 'red']
BAND_COL = {   # (밑동, 끝) sRGB
    'coconut': ((0.24, 0.36, 0.1), (0.42, 0.52, 0.16)), 'areca': ((0.2, 0.34, 0.1), (0.36, 0.5, 0.14)), 'date': ((0.34, 0.42, 0.28), (0.5, 0.56, 0.38)),
    'dead': ((0.42, 0.3, 0.16), (0.56, 0.42, 0.24)), 'bamboo': ((0.3, 0.44, 0.12), (0.46, 0.56, 0.18)), 'banana': ((0.32, 0.5, 0.14), (0.44, 0.6, 0.2)),
    'grass': ((0.3, 0.42, 0.12), (0.62, 0.62, 0.3)), 'grass_dry': ((0.5, 0.42, 0.24), (0.76, 0.66, 0.42)),
    'nut': ((0.46, 0.46, 0.16), (0.52, 0.5, 0.2)), 'coir': ((0.36, 0.24, 0.12), (0.42, 0.28, 0.15)), 'shaft': ((0.36, 0.5, 0.2), (0.44, 0.58, 0.24)),
    'plume': ((0.86, 0.84, 0.78), (0.94, 0.92, 0.88)), 'flower': ((0.46, 0.12, 0.16), (0.56, 0.16, 0.2)), 'fruit': ((0.36, 0.48, 0.16), (0.46, 0.56, 0.2)),
    'stem': ((0.3, 0.38, 0.14), (0.36, 0.44, 0.18)), 'red': ((0.8, 0.38, 0.1), (0.86, 0.46, 0.14)),
}


def gen_frond():
    """잎 띠 그림 512×256: 가로 16 칸(칸마다 32 화소), 세로 = 밑동(아래) → 끝(위) 색 변화, 칸 가운데 잎맥, 가장자리 조금 밝게, 잔 결."""
    W, H, n = 32 * len(BANDS), 256, len(BANDS)
    bw = W // n
    rs = np.random.RandomState(13)
    a = np.ones((H, W, 4), np.float32)
    v = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    for i, b in enumerate(BANDS):
        c0, c1 = (np.array(c, np.float32) for c in BAND_COL[b])
        u = (np.arange(bw, dtype=np.float32) + 0.5) / bw
        mid = np.exp(-((u - 0.5) / 0.05) ** 2)[None, :, None]
        edge = (np.abs(u - 0.5) * 2)[None, :, None]
        col = c0[None, None] * (1 - v) + c1[None, None] * v
        col = col * (1 - 0.35 * mid) * (0.92 + 0.12 * edge)
        streak = rs.normal(0, 1, (1, bw, 1)).astype(np.float32)
        col = col * (1 + 0.05 * streak) + rs.normal(0, 0.012, (H, bw, 3)).astype(np.float32)
        a[:, i * bw:(i + 1) * bw, :3] = col
    path = os.path.join(K.BUILD, 'sa_frond.png')
    K._save_np(a, path)
    return path


def frond_add(P, bm, band, smooth=True, matrix=None):
    """작은 색 부품 (열매·잎집·마디·이삭)도 frond 재료의 색 칸으로: 조각마다 재료가 줄기 + 잎 둘뿐이다 (장면의 나무 틀이 그대로 쓴다)."""
    uvl = bm.loops.layers.uv.verify()
    uv = band_uv(band, 0.5, 0.5)
    for f in bm.faces:
        for l in f.loops:
            l[uvl].uv = uv
    P.add_bm(bm, 'frond', uv=False, smooth=smooth, matrix=matrix)


def band_uv(band, s, t):
    """칸 band 안의 (가로 s 0~1, 세로 t 0~1) → UV."""
    i = BANDS.index(band)
    return ((i + 0.08 + 0.84 * s) / len(BANDS), 0.02 + 0.96 * t)


def setup_materials():
    T, X = K.prep_texture, lambda f: os.path.join(K.TEX, f)
    mk = K.make_material
    mk('palm_bark', T('sa_palm_bark_d', 'palm_tree_bark_diff_1k.jpg', tint=(1.0, 0.95, 0.88), gain=0.85, sat=0.8), X('palm_tree_bark_nor_gl_1k.jpg'),
       rough=0.92, nstr=1.4)
    mk('bark', T('sa_bark_d', 'bark_brown_02_diff_1k.jpg', tint=(0.92, 0.9, 0.86), gain=0.72, sat=0.45), X('bark_brown_02_nor_gl_1k.jpg'), rough=0.95, nstr=1.2)
    mk('bamboo', T('sa_bamboo_culm_d', 'bamboo_wall_diff_1k.jpg', tint=(0.86, 1.0, 0.62), gain=0.95, sat=1.1), X('bamboo_wall_nor_gl_1k.jpg'), rough=0.6, nstr=0.6)
    mk('frond', gen_frond(), None, rough=0.75, double=True)


# ───────────────────────── 도구 ─────────────────────────
def trunk_bm(pts, radii, n=10, tile_u=0.6, tile_v=0.6):
    """줄기: 점 사슬을 따라 고리를 이은 관 (원통 UV: u = 둘레 거리, v = 길이). 감김은 바깥 (loft_bm 과 같은 약속)."""
    cs = [Vector(p) for p in pts]
    m = len(cs)
    ref = Vector((1, 0, 0))
    v, rings = [], []
    s = ref
    for i in range(m):
        a, b = cs[max(i - 1, 0)], cs[min(i + 1, m - 1)]
        t = (b - a).normalized()
        s = s - t * s.dot(t)
        if s.length < 1e-6:
            s = Vector((0, 1, 0)) - t * t.y
        s.normalize()
        u = t.cross(s).normalized()
        for k in range(n):
            ang = 2 * math.pi * k / n
            v.append(tuple(cs[i] + (s * math.cos(ang) + u * math.sin(ang)) * radii[i]))
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')
    vs = [bm.verts.new(p) for p in v]
    L = [0.0]
    for i in range(1, m):
        L.append(L[-1] + (cs[i] - cs[i - 1]).length)
    for i in range(m - 1):
        for k in range(n):
            k1 = (k + 1) % n
            f = bm.faces.new((vs[i * n + k], vs[i * n + k1], vs[(i + 1) * n + k1], vs[(i + 1) * n + k]))
            f.smooth = True
            circ = 2 * math.pi * (radii[i] + radii[i + 1]) / 2
            for l, (ii, kk) in zip(f.loops, ((i, k), (i, k + 1), (i + 1, k + 1), (i + 1, k))):
                l[uvl].uv = (kk / n * circ / tile_u, L[ii] / tile_v)
    top = bm.faces.new([vs[(m - 1) * n + k] for k in range(n)])
    for l in top.loops:
        l[uvl].uv = (0.0, L[-1] / tile_v)
    return bm


def leaf_strip(P, base, tip_dir, L, w, band, droop=0.0, side=Vector((0, 0, 1)), segs=2, width_prof=None):
    """잎 한 장 (가는 띠, 길이 L, 폭 w): base 에서 tip_dir 로, 끝으로 갈수록 droop 만큼 아래로. 양면 재질 frond 의 band 칸."""
    d = Vector(tip_dir).normalized()
    sv = d.cross(Vector(side))
    if sv.length < 1e-4:
        sv = d.cross(Vector((1, 0, 0)))
    sv.normalize()
    pts = []
    for k in range(segs + 1):
        t = k / segs
        p = Vector(base) + d * (L * t) + Vector((0, 0, -droop * t * t))
        wk = (width_prof(t) if width_prof else (math.sin(math.pi * (0.15 + 0.85 * t)) * 0.9 + 0.1 if k < segs else 0.0)) * w
        pts.append((p, wk, t))
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')
    L_, R_ = [], []
    for p, wk, t in pts:
        L_.append((bm.verts.new(p - sv * wk / 2), t))
        R_.append((bm.verts.new(p + sv * wk / 2), t))
    for k in range(segs):
        (a, ta), (b, tb) = L_[k], L_[k + 1]
        (c, _), (e, _) = R_[k + 1], R_[k]
        if (c.co - b.co).length < 1e-6:
            f = bm.faces.new((a, b, e))
            uvs = (band_uv(band, 0, ta), band_uv(band, 0.5, tb), band_uv(band, 1, ta))
        else:
            f = bm.faces.new((a, b, c, e))
            uvs = (band_uv(band, 0, ta), band_uv(band, 0, tb), band_uv(band, 1, tb), band_uv(band, 1, ta))
        for l, uv in zip(f.loops, uvs):
            l[uvl].uv = uv
    P.add_bm(bm, 'frond', uv=False, smooth=False)


def palm_frond(P, base, az, elev, L, n_pairs, band, droop, leaf_len, leaf_w, leaf_angle=48, leaf_droop=0.25, rachis_r=0.03, stiff=1.0):
    """야자 잎 하나: 잎자루 곡선(밑 → 끝, 무게로 처짐) + 양쪽 작은 잎 n_pairs 쌍 (V 꼴로 아래로 처진다)."""
    ca, sa = math.cos(az), math.sin(az)
    d0 = Vector((ca * math.cos(elev), sa * math.cos(elev), math.sin(elev)))
    nseg = 8
    pts = []
    for k in range(nseg + 1):
        t = k / nseg
        p = Vector(base) + d0 * (L * t) + Vector((0, 0, -droop * (t ** 2.2)))
        pts.append(p)
    frond_add(P, tube_bm([tuple(p) for p in pts], [rachis_r * (1 - 0.75 * k / nseg) for k in range(nseg + 1)], n=4, ref=(0, 0, 1)), 'stem' if band != 'dead' else 'dead')
    horiz = Vector((-sa, ca, 0.0))
    for j in range(n_pairs):
        t = 0.1 + 0.88 * (j + 0.5) / n_pairs
        f = t * nseg
        i0 = min(nseg - 1, int(f))
        p = pts[i0].lerp(pts[i0 + 1], f - i0)
        tang = (pts[i0 + 1] - pts[i0]).normalized()
        ll = leaf_len * (math.sin(math.pi * min(1.0, 0.1 + t)) ** 0.5) * (0.55 + 0.45 * (1 - t))
        for sd in (1, -1):
            out = (tang * math.cos(rad(leaf_angle)) + horiz * sd * math.sin(rad(leaf_angle)))
            out = (out + Vector((0, 0, -leaf_droop * stiff))).normalized()
            leaf_strip(P, p, out, ll, leaf_w, band, droop=ll * 0.25 / stiff, side=tang, segs=2)


# ───────────────────────── 조각들 ─────────────────────────
def palm_coconut():
    P = Piece('palm_coconut', 7001)
    rng = P.rng
    H = 9.2
    lean = 0.9
    pts, radii = [], []
    for k in range(13):
        t = k / 12
        pts.append((lean * t ** 1.6, 0.12 * math.sin(t * 2.4), H * t))
        radii.append(0.2 * (1 - 0.3 * t) + 0.12 * max(0.0, 1 - t / 0.08))
    P.add_bm(trunk_bm(pts, radii, n=10, tile_u=0.7, tile_v=0.9), 'palm_bark', uv=False, smooth=True)
    top = Vector(pts[-1])
    frond_add(P, ellipsoid_bm(tuple(top + Vector((0, 0, 0.05))), (0.26, 0.26, 0.3), nu=10, nv=6), 'coir')
    nf = 18
    for k in range(nf):
        az = k * 2.39996 + rng.uniform(-0.15, 0.15)
        tier = k / nf
        elev = rad(48 - 70 * tier + rng.uniform(-8, 8))
        L = 4.4 * (1 - 0.25 * tier) * rng.uniform(0.9, 1.05)
        palm_frond(P, tuple(top + Vector((0, 0, 0.25 - 0.3 * tier))), az, elev, L, 30, 'coconut', droop=1.3 + 1.2 * tier, leaf_len=0.95, leaf_w=0.07)
    for k in range(2):        # 마른 잎 (아래로 처진)
        az = 1.0 + k * 3.0
        palm_frond(P, tuple(top + Vector((0, 0, -0.15))), az, rad(-60), 3.4, 20, 'dead', droop=0.4, leaf_len=0.7, leaf_w=0.06, leaf_angle=25, leaf_droop=0.6)
    for k in range(9):        # 코코넛 송이
        a = k * 2.2
        r = 0.27 + 0.05 * (k % 2)
        frond_add(P, ellipsoid_bm(tuple(top + Vector((r * math.cos(a), r * math.sin(a), -0.15 - 0.08 * (k % 3)))), (0.12, 0.12, 0.14), nu=8, nv=5),
                'nut' if k % 3 else 'coir')
    return P


def palm_areca():
    P = Piece('palm_areca', 7002)
    rng = P.rng
    H = 10.0
    pts, radii = [], []
    for k in range(11):
        t = k / 10
        pts.append((0.25 * t * t, 0.0, H * t))
        radii.append(0.1 * (1 - 0.15 * t) + 0.04 * max(0.0, 1 - t / 0.06))
    P.add_bm(trunk_bm(pts, radii, n=8, tile_u=0.4, tile_v=0.5), 'palm_bark', uv=False, smooth=True)
    top = Vector(pts[-1])
    frond_add(P, tube_bm([tuple(top), tuple(top + Vector((0.03, 0, 1.1)))], [0.12, 0.1], n=10), 'shaft')
    crown = top + Vector((0.03, 0, 1.1))
    for k in range(9):
        az = k * 2.39996 + rng.uniform(-0.1, 0.1)
        tier = k / 9
        palm_frond(P, tuple(crown + Vector((0, 0, 0.1 - 0.2 * tier))), az, rad(62 - 60 * tier), 2.5 * rng.uniform(0.9, 1.05), 24, 'areca', droop=0.9 + 0.8 * tier,
                   leaf_len=0.6, leaf_w=0.05, rachis_r=0.022)
    for k in range(5):
        a = k * 1.3
        frond_add(P, ellipsoid_bm(tuple(top + Vector((0.13 * math.cos(a), 0.13 * math.sin(a), 0.6 - 0.05 * k))), (0.035, 0.035, 0.045), nu=6, nv=4), 'red')
    return P


def palm_date():
    P = Piece('palm_date', 7003)
    rng = P.rng
    H = 5.4
    pts, radii = [], []
    for k in range(9):
        t = k / 8
        pts.append((0.15 * t, 0.05 * t, H * t))
        radii.append(0.27 * (1 - 0.1 * t))
    P.add_bm(trunk_bm(pts, radii, n=10, tile_u=0.5, tile_v=0.45), 'palm_bark', uv=False, smooth=True)
    top = Vector(pts[-1])
    for k in range(8):        # 마른 잎 치마 (줄기 꼭대기 아래로 늘어짐)
        az = k * 2.39996
        palm_frond(P, tuple(top + Vector((0, 0, -0.1))), az, rad(-72), 2.4, 10, 'dead', droop=0.1, leaf_len=0.45, leaf_w=0.04, leaf_angle=20, leaf_droop=0.8,
                   rachis_r=0.025)
    for k in range(18):
        az = k * 2.39996 + rng.uniform(-0.1, 0.1)
        tier = k / 18
        palm_frond(P, tuple(top + Vector((0, 0, 0.2))), az, rad(70 - 70 * tier), 3.2 * rng.uniform(0.9, 1.05), 20, 'date', droop=0.25 + 0.8 * tier,
                   leaf_len=0.5, leaf_w=0.035, leaf_angle=40, leaf_droop=0.05, stiff=2.0)
    return P


def banana():
    """바나나 포기: 헛줄기 셋 (큰 것·중간·새끼), 넓은 잎 (가운데 맥 + 양쪽 잎판, 끝이 찢김), 큰 포기에 꽃송이·열매 송이."""
    P = Piece('banana', 7004)
    rng = P.rng
    for (x, y, h, nl, s) in ((0.0, 0.0, 2.6, 8, 1.0), (0.55, 0.3, 1.8, 6, 0.75), (-0.35, 0.45, 1.1, 4, 0.5)):
        frond_add(P, tube_bm([(x, y, 0.0), (x + 0.03, y, h)], [0.13 * s, 0.09 * s], n=8), 'shaft')
        for k in range(nl):
            az = k * 2.39996 + rng.uniform(-0.2, 0.2)
            el = rad(55 - 50 * k / nl)
            base = Vector((x + 0.03, y, h - 0.05 * k))
            L = 2.1 * s * rng.uniform(0.85, 1.05)
            d = Vector((math.cos(az) * math.cos(el), math.sin(az) * math.cos(el), math.sin(el)))
            horiz = Vector((-math.sin(az), math.cos(az), 0))
            segs = 6
            mid = [base + d * (L * t / segs) + Vector((0, 0, -0.5 * L * (t / segs) ** 2)) for t in range(segs + 1)]
            frond_add(P, tube_bm([tuple(p) for p in mid], 0.015 * s, n=4), 'shaft')
            for sd in (1, -1):
                for t in range(segs):
                    if rng.random() < 0.08:
                        continue        # 찢긴 틈
                    wv = 0.42 * s * math.sin(math.pi * (t + 0.5) / segs) ** 0.5
                    a, b = mid[t], mid[t + 1]
                    out = (horiz * sd + Vector((0, 0, -0.35))).normalized() * wv
                    leaf_strip(P, (a + b) / 2, out, wv, (b - a).length * 1.02, 'banana', droop=0.05, side=(b - a), segs=1,
                               width_prof=lambda t: 1.0)
    frond_add(P, ellipsoid_bm((0.25, -0.1, 2.0), (0.07, 0.07, 0.16), nu=8, nv=5, rot=Ry(rad(30)).to_3x3()), 'flower')
    for k in range(6):
        frond_add(P, ellipsoid_bm((0.2 + 0.02 * k, -0.08, 2.35 - 0.05 * k), (0.11 - 0.008 * k, 0.11 - 0.008 * k, 0.04), nu=8, nv=3), 'fruit')
    return P


def bamboo_clump():
    P = Piece('bamboo_clump', 7005)
    rng = P.rng
    n = 18
    for k in range(n):
        a = k * 2.39996
        r0 = 0.25 + 0.35 * math.sqrt((k + 0.5) / n)
        x0, y0 = r0 * math.cos(a), r0 * math.sin(a)
        H = rng.uniform(7.0, 10.5)
        out = rng.uniform(0.8, 2.2)
        pts, radii = [], []
        for j in range(9):
            t = j / 8
            pts.append((x0 + math.cos(a) * out * t ** 2, y0 + math.sin(a) * out * t ** 2, H * t - 0.6 * out * t ** 3))
            radii.append(0.07 * (1 - 0.55 * t))
        P.add_bm(trunk_bm(pts, radii, n=6, tile_u=0.25, tile_v=1.2), 'bamboo', uv=False, smooth=True)
        for j in range(2, 9):          # 마디 고리
            p = Vector(pts[j - 1]).lerp(Vector(pts[j]), 0.5)
            frond_add(P, lathe_bm([(radii[j] * 1.2, -0.025), (radii[j] * 1.2, 0.025)], n=6), 'stem', matrix=Tm(*p))
        for j in range(3, 9):          # 잔가지 + 끝 잎 다발 (위로 갈수록 많이): 대나무 포기가 초록 덩어리로 읽히게
            p0, p1 = Vector(pts[j - 1]), Vector(pts[j])
            for q in range(2 if j < 6 else 3):
                p = p0.lerp(p1, rng.uniform(0.0, 1.0))
                az = a + rng.uniform(-1.9, 1.9)
                tw = Vector((math.cos(az), math.sin(az), rng.uniform(-0.25, 0.25))).normalized()
                L = rng.uniform(0.5, 1.0)
                end = p + tw * L
                frond_add(P, tube_bm([tuple(p), tuple(end)], 0.008, n=3, cap0=False), 'stem')
                for lf in range(6):
                    st = p + tw * (L * (0.35 + 0.65 * lf / 5))
                    la = az + (lf % 2 * 2 - 1) * rng.uniform(0.6, 1.2)
                    ld = Vector((math.cos(la), math.sin(la), rng.uniform(-0.7, -0.2))).normalized()
                    leaf_strip(P, st, ld, rng.uniform(0.3, 0.42), 0.05, 'bamboo', droop=0.08, segs=1, side=tw, width_prof=lambda t: 1.0 - 0.7 * t)
    return P


def banyan_roots():
    """반얀 공기뿌리: 가지에서 매달린 가는 뿌리 (땅에 닿지 않은 것·닿은 것) + 땅에 내려 굵어진 기둥 뿌리 여덟. 가운데(원점) = 반얀 줄기 자리."""
    P = Piece('banyan_roots', 7006)
    rng = P.rng
    for k in range(8):                 # 기둥 뿌리
        a = k * 2.39996 + 0.4
        r = rng.uniform(3.2, 7.2)
        x, y = r * math.cos(a), r * math.sin(a)
        top = rng.uniform(5.8, 7.4)
        rr = rng.uniform(0.11, 0.2)
        pts = [(x + 0.06 * math.sin(j * 1.3), y + 0.06 * math.cos(j * 1.1), top * j / 8) for j in range(9)]
        radii = [rr * (1.6 if j == 0 else 1.15 if j == 1 else 1.0) * (1 - 0.35 * j / 8) for j in range(9)]
        P.add_bm(trunk_bm(pts, radii, n=8, tile_u=0.8, tile_v=1.2), 'bark', uv=False, smooth=True)
        for q in range(3):             # 기둥 둘레 덜 자란 뿌리
            ox, oy = 0.12 * math.cos(q * 2.1), 0.12 * math.sin(q * 2.1)
            L = rng.uniform(2.0, 4.5)
            P.add_bm(tube_bm([(x + ox, y + oy, top), (x + ox * 1.5, y + oy * 1.5, top - L)], [0.025, 0.012], n=4), 'bark', tile=(0.5, 0.5), smooth=True)
    for k in range(46):                # 매달린 가는 뿌리
        a = k * 2.39996 + rng.uniform(-0.2, 0.2)
        r = 2.2 + 6.0 * math.sqrt(rng.random())
        x, y = r * math.cos(a), r * math.sin(a)
        top = rng.uniform(5.2, 7.6)
        L = top - rng.uniform(0.6, 3.5) if rng.random() < 0.7 else top
        sway = rng.uniform(-0.15, 0.15)
        pts = [(x + sway * (j / 5) ** 2, y, top - L * j / 5) for j in range(6)]
        P.add_bm(tube_bm(pts, [0.03, 0.026, 0.022, 0.018, 0.014, 0.01], n=4), 'bark', tile=(0.5, 0.5), smooth=True)
    return P


def grass_clump(P, n, hmin, hmax, band, wmin, wmax, spread=0.25, arch=0.35):
    rng = P.rng
    for k in range(n):
        a = k * 2.39996 + rng.uniform(-0.3, 0.3)
        r = spread * math.sqrt((k + 0.5) / n)
        base = Vector((r * math.cos(a), r * math.sin(a), -0.02))
        h = rng.uniform(hmin, hmax)
        lean = rng.uniform(0.1, arch)
        d = Vector((math.cos(a) * lean, math.sin(a) * lean, 1.0)).normalized()
        leaf_strip(P, base, d, h, rng.uniform(wmin, wmax), band, droop=h * lean * 0.6, segs=3, side=Vector((math.cos(a), math.sin(a), 0)),
                   width_prof=lambda t: 1.0 - 0.9 * t)


def grass_tall():
    P = Piece('grass_tall', 7007)
    grass_clump(P, 46, 1.1, 1.8, 'grass', 0.025, 0.04, spread=0.35, arch=0.5)
    rng = P.rng
    for k in range(14):                # 흰 이삭 (카슈 풀)
        a = k * 2.39996
        r = 0.3 * math.sqrt((k + 0.5) / 14)
        x, y = r * math.cos(a), r * math.sin(a)
        h = rng.uniform(1.6, 2.05)
        tip = (x + 0.25 * math.cos(a), y + 0.25 * math.sin(a), h)
        frond_add(P, tube_bm([(x, y, 0.0), tip], 0.006, n=3, cap0=False), 'grass_dry')
        rot = (Rz(a) @ Ry(rad(-28))).to_3x3()
        frond_add(P, ellipsoid_bm((tip[0] + 0.06 * math.cos(a), tip[1] + 0.06 * math.sin(a), h + 0.12), (0.035, 0.035, 0.2), nu=6, nv=4, rot=rot), 'plume')
    return P


def grass_dry():
    P = Piece('grass_dry', 7008)
    grass_clump(P, 52, 0.35, 0.75, 'grass_dry', 0.012, 0.022, spread=0.22, arch=0.7)
    return P


BUILDERS = [palm_coconut, palm_areca, palm_date, banana, bamboo_clump, banyan_roots, grass_tall, grass_dry]


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
    out = os.path.join(K.KITS, NAME + '.glb') if not only else os.path.join(K.BUILD, NAME + '_partial.glb')
    tris = {r.name: sum(K.tri_count(o) for o in K.mesh_objects([r])) for r in roots}
    info = K.export_glb(roots, out) if not only or os.environ.get('KIT_EXPORT') == '1' else {}
    if not only:
        with open(os.path.join(K.KITS, NAME + '.dims.json'), 'w', encoding='utf-8', newline='\n') as f:
            json.dump({'source': 'tools/blender/kit_trees_southasia.py', 'units': 'm, [x 길이, 앞뒤 깊이, 높이]',
                       'pieces': {k: [round(x, 2) for x in v] for k, v in dims.items()}}, f, ensure_ascii=False, indent=1)
            f.write('\n')
    log('삼각형 합계', sum(tris.values()), tris)
    stats = {'tris': tris, 'total': sum(tris.values()), 'dims': {k: [round(x, 2) for x in v] for k, v in dims.items()}, 'glb': info,
             'sha': K.sha(out) if info else None, 'seconds': round(time.time() - t0, 1)}
    with open(os.path.join(K.BUILD, NAME + '_stats.json'), 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=1)
    log('STATS', json.dumps(stats, ensure_ascii=False))
    if os.environ.get('KIT_NOPREVIEW') != '1':
        previews(roots)
    log('끝 %.1fs' % (time.time() - t0))


def previews(roots):
    K.setup_preview(sun_elev=32, sun_az=140, grass=os.path.join(K.TEX, 'leafy_grass_diff_1k.jpg'))
    S.preview_ground((0.72, 0.78, 0.45))
    by = {r.name: r for r in roots}
    LAYOUT = {'palm_coconut': (-6.0, 4.0, 0.3), 'palm_areca': (-2.2, 6.0, 0), 'palm_date': (2.0, 5.0, 0), 'banana': (4.4, 0.8, 0),
              'bamboo_clump': (9.5, 6.5, 0), 'banyan_roots': (-16.0, 10.0, 0), 'grass_tall': (0.6, 0.0, 0), 'grass_dry': (-1.4, -0.6, 0)}
    for n, (x, y, rz) in LAYOUT.items():
        if n in by:
            by[n].location = (x, y, 0)
            by[n].rotation_euler = (0, 0, rz)
    cam = K.camera_look('southasia_trees', (-1.0, -16.0, 3.2), (-1.5, 5.0, 4.6), 26)
    K.render_to(cam, os.path.join(K.PREVIEW, 'southasia_trees.png'))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)
