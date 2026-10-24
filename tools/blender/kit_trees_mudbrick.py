# 흙벽돌(서아시아·북아프리카·나일·이란) 식생 세트 — Blender 4.2 명령줄 스크립트.
#   "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe" --background --python tools/blender/kit_trees_mudbrick.py
# 결과: docs/past-life/assets/real/kits/trees_mudbrick.glb (meshopt + WebP), kits/trees_mudbrick.dims.json
# 노드:
#   palm_date_tall      큰 대추야자 (키 ~9 m, 굵은 줄기, 뻣뻣한 회녹 잎 24 + 주황 열매 송이 + 마른 잎 치마)
#   palm_date_medium    중간 대추야자 (키 ~6 m)
#   palm_date_cluster   대추야자 2그루 군집 (오아시스 풍경)
#   olive_tree_mb       올리브 나무 (뒤틀린 줄기, 은회녹색 잎)
#   bush_desert_mb      사막 덤불 (키 ~1.4 m)
#   reed_oasis          오아시스 갈대 (키 ~2.2 m)
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
NAME = 'trees_mudbrick'

BANDS = ['date_leaf', 'date_dead', 'date_fruit', 'olive_leaf', 'olive_fruit', 'bush', 'reed', 'wood_grey']
BAND_COL = {
    'date_leaf': ((0.32, 0.42, 0.26), (0.48, 0.56, 0.36)),
    'date_dead': ((0.45, 0.32, 0.18), (0.58, 0.44, 0.26)),
    'date_fruit': ((0.75, 0.40, 0.10), (0.85, 0.52, 0.14)),
    'olive_leaf': ((0.34, 0.42, 0.30), (0.46, 0.54, 0.42)),
    'olive_fruit': ((0.12, 0.16, 0.10), (0.18, 0.24, 0.14)),
    'bush': ((0.42, 0.40, 0.28), (0.62, 0.58, 0.38)),
    'reed': ((0.36, 0.44, 0.20), (0.68, 0.65, 0.34)),
    'wood_grey': ((0.42, 0.38, 0.34), (0.52, 0.48, 0.44)),
}

def gen_frond():
    W, H, n = 32 * len(BANDS), 256, len(BANDS)
    bw = W // n
    rs = np.random.RandomState(23)
    a = np.ones((H, W, 4), np.float32)
    v = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    for i, b in enumerate(BANDS):
        c0, c1 = (np.array(c, np.float32) for c in BAND_COL[b])
        u = (np.arange(bw, dtype=np.float32) + 0.5) / bw
        mid = np.exp(-((u - 0.5) / 0.05) ** 2)[None, :, None]
        col = c0[None, None] * (1 - v) + c1[None, None] * v
        col = col * (1 - 0.3 * mid)
        a[:, i * bw:(i + 1) * bw, :3] = col
    path = os.path.join(K.BUILD, 'mb_frond.png')
    K._save_np(a, path)
    return path

def band_uv(band, u_norm, v_norm):
    i = BANDS.index(band)
    n = len(BANDS)
    return ((i + u_norm) / n, v_norm)

def setup_materials():
    T, X = K.prep_texture, lambda f: os.path.join(K.TEX, f)
    mk = K.make_material
    mk('palm_bark', T('mb_palm_bark_d', 'palm_tree_bark_diff_1k.jpg', tint=(1.05, 0.95, 0.85), gain=0.88),
       X('palm_tree_bark_nor_gl_1k.jpg'), rough=0.92, nstr=1.2)
    mk('bark_olive', T('mb_bark_olive_d', 'bark_brown_02_diff_1k.jpg', tint=(0.95, 0.92, 0.88), gain=0.85),
       X('bark_brown_02_nor_gl_1k.jpg'), rough=0.94, nstr=1.1)
    mk('frond', gen_frond(), None, rough=0.85, double=True)


# ───────────────────────── 야자 잎 생성기 ─────────────────────────

def make_date_frond_bm(length=3.4, width=0.65, n_segs=8, band='date_leaf'):
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.verify()
    verts = []
    # 잎 중심축을 따라 아래로 활처럼 굽는 호
    for i in range(n_segs + 1):
        t = i / n_segs
        # 사막 대추야자 잎은 단단하게 뻗다가 끝에서만 살짝 휨
        x = length * t
        z = -0.5 * (t ** 2.2)
        w = width * math.sin(t * math.pi) * (1.0 - 0.3 * t)
        
        vl = bm.verts.new((x, -w * 0.5, z))
        vr = bm.verts.new((x, w * 0.5, z))
        verts.append((vl, vr))
        
    for i in range(n_segs):
        v0l, v0r = verts[i]
        v1l, v1r = verts[i + 1]
        t0 = i / n_segs
        t1 = (i + 1) / n_segs
        
        f = bm.faces.new((v0l, v0r, v1r, v1l))
        # UV 매핑
        loops = list(f.loops)
        loops[0][uvl].uv = band_uv(band, 0.05, t0)
        loops[1][uvl].uv = band_uv(band, 0.95, t0)
        loops[2][uvl].uv = band_uv(band, 0.95, t1)
        loops[3][uvl].uv = band_uv(band, 0.05, t1)
        
    bm.verts.ensure_lookup_table()
    bm.faces.ensure_lookup_table()
    return bm


def palm_date_tall():
    """큰 대추야자: 키 ~9m."""
    P = Piece('palm_date_tall', 3301)
    H = 8.8
    # 1. 굵은 줄기 (대추야자 줄기: 밑동 r=0.45, 꼭대기 r=0.32)
    pts = [
        (0, 0, 0),
        (0.1, 0, 2.5),
        (0.18, 0, 5.5),
        (0.12, 0, H)
    ]
    radii = [0.46, 0.40, 0.36, 0.32]
    trunk = tube_bm(pts, radii, n=10)
    P.add_bm(trunk, 'palm_bark', tile=2.0)

    # 2. 잎 머리 (Crown of Fronds)
    # 24개 회녹색 잎 방사형 배치 (2개 층)
    for ring, (pitch, count, length) in enumerate([(18, 12, 3.6), (42, 10, 3.2), (-15, 6, 2.4)]):
        band = 'date_dead' if ring == 2 else 'date_leaf'
        for i in range(count):
            az = (i + (0.5 if ring == 1 else 0)) * (360.0 / count)
            frond = make_date_frond_bm(length=length, width=0.6, band=band)
            # 회전 적용: pitch 로 들고, az 로 방사
            frond.transform(Ry(-pitch) @ Rz(az) @ Tm(0.12, 0, H))
            uvl = frond.loops.layers.uv.verify()
            P._merge(frond, 'frond', smooth=True, uvl_src=uvl)
            frond.free()

    # 3. 주황색 대추야자 열매 송이들 (Date bunches)
    for az in (45, 165, 285):
        bunch = ellipsoid_bm((0, 0, 0), (0.28, 0.22, 0.38), nu=6, nv=6)
        bunch.transform(Tm(0.35, 0, -0.4) @ Rz(az) @ Tm(0.12, 0, H))
        uvl = bunch.loops.layers.uv.verify()
        for f in bunch.faces:
            for l in f.loops:
                l[uvl].uv = band_uv('date_fruit', 0.5, 0.5)
        P._merge(bunch, 'frond', smooth=True, uvl_src=uvl)
        bunch.free()

    return P


def palm_date_medium():
    """중간 대추야자: 키 ~6m."""
    P = Piece('palm_date_medium', 3302)
    H = 6.0
    pts = [(0, 0, 0), (0.08, 0, 2.2), (0.05, 0, H)]
    trunk = tube_bm(pts, [0.38, 0.32, 0.26], n=8)
    P.add_bm(trunk, 'palm_bark', tile=1.8)

    for ring, (pitch, count, length) in enumerate([(22, 10, 2.8), (48, 8, 2.5), (-12, 4, 1.8)]):
        band = 'date_dead' if ring == 2 else 'date_leaf'
        for i in range(count):
            az = (i + 0.3 * ring) * (360.0 / count)
            frond = make_date_frond_bm(length=length, width=0.52, band=band)
            frond.transform(Ry(-pitch) @ Rz(az) @ Tm(0.05, 0, H))
            uvl = frond.loops.layers.uv.verify()
            P._merge(frond, 'frond', smooth=True, uvl_src=uvl)
            frond.free()

    return P


def palm_date_cluster():
    """대추야자 2그루 군집 (오아시스 풍경)."""
    P = Piece('palm_date_cluster', 3303)
    # 1번 야자 (약간 동쪽으로 기울어짐)
    p1 = palm_date_tall()
    p1_obj = p1.finish()
    # 2번 야자 (작고 서쪽으로 기울어짐)
    p2 = palm_date_medium()
    p2_obj = p2.finish()
    
    # 묶어서 하나의 bmesh 로 합침
    for o in (p1_obj, p2_obj):
        for c in o.children_recursive:
            if c.type == 'MESH':
                bm = bmesh.new()
                bm.from_mesh(c.data)
                if o == p2_obj:
                    bm.transform(Tm(-1.6, 0.8, 0) @ Rz(40))
                uvl = bm.loops.layers.uv.verify()
                mat_name = c.data.materials[0].name if c.data.materials else 'frond'
                P._merge(bm, mat_name, smooth=True, uvl_src=uvl)
                bm.free()
    return P


def olive_tree_mb():
    """올리브 나무: 뒤틀린 굵은 줄기, 은회녹색 잎."""
    P = Piece('olive_tree_mb', 3304)
    H = 4.2
    # 뒤틀린 굵은 줄기
    pts = [(0, 0, 0), (-0.12, 0.08, 1.2), (0.15, -0.05, 2.2)]
    trunk = tube_bm(pts, [0.42, 0.32, 0.25], n=8)
    P.add_bm(trunk, 'bark_olive', tile=1.5)

    # 3개 큰 가지
    branches = [
        ((-0.7, -0.6, 3.2), [0.22, 0.14]),
        ((0.8, -0.5, 3.4), [0.20, 0.12]),
        ((0.1, 0.9, 3.3), [0.21, 0.13]),
    ]
    for (bx, by, bz), radii in branches:
        b_pts = [(0.15, -0.05, 2.2), ((0.15 + bx) * 0.5, (-0.05 + by) * 0.5, (2.2 + bz) * 0.5), (bx, by, bz)]
        b_bm = tube_bm(b_pts, radii, n=6)
        P.add_bm(b_bm, 'bark_olive', tile=1.0)
        
        # 잎 구름 덩어리
        foliage = ellipsoid_bm((bx, by, bz + 0.3), (1.1, 1.1, 0.8), nu=8, nv=6)
        uvl = foliage.loops.layers.uv.verify()
        for f in foliage.faces:
            for l in f.loops:
                l[uvl].uv = band_uv('olive_leaf', 0.5, 0.5)
        P._merge(foliage, 'frond', smooth=True, uvl_src=uvl)
        foliage.free()

    return P


def bush_desert_mb():
    """사막 덤불 (키 ~1.4 m)."""
    P = Piece('bush_desert_mb', 3305)
    foliage = ellipsoid_bm((0, 0, 0.65), (0.9, 0.85, 0.65), nu=8, nv=6)
    uvl = foliage.loops.layers.uv.verify()
    for f in foliage.faces:
        for l in f.loops:
            l[uvl].uv = band_uv('bush', 0.5, 0.5)
    P._merge(foliage, 'frond', smooth=True, uvl_src=uvl)
    foliage.free()
    return P


def reed_oasis():
    """오아시스 갈대 (키 ~2.2 m)."""
    P = Piece('reed_oasis', 3306)
    for i in range(12):
        az = i * (360.0 / 12)
        r = 0.35 + 0.2 * (i % 3)
        rx, ry = r * math.cos(rad(az)), r * math.sin(rad(az))
        pts = [(rx, ry, 0), (rx * 1.2, ry * 1.2, 1.2), (rx * 1.4, ry * 1.4, 2.1)]
        reed = tube_bm(pts, [0.03, 0.02, 0.005], n=4)
        uvl = reed.loops.layers.uv.verify()
        for f in reed.faces:
            for l in f.loops:
                l[uvl].uv = band_uv('reed', 0.5, 0.5)
        P._merge(reed, 'frond', smooth=True, uvl_src=uvl)
        reed.free()
    return P


# ───────────────────────── 빌드 파이프라인 ─────────────────────────

BUILDERS = [
    palm_date_tall,
    palm_date_medium,
    olive_tree_mb,
    bush_desert_mb,
    reed_oasis,
]

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
        dims[root.name] = S.recenter(root, P.foot)
        roots.append(root)
        tris_count = sum(K.tri_count(o) for o in K.mesh_objects([root]))
        log('%-20s %6d 삼각형  %.1fs  %s' % (root.name, tris_count, time.time() - ts,
                                            'x'.join('%.2f' % d for d in dims[root.name])))

    # 식생은 AO 굽지 않음 (장면이 조명 처리)
    out = os.path.join(K.KITS, NAME + '.glb') if not only else os.path.join(K.BUILD, NAME + '_partial.glb')
    info = K.export_glb(roots, out) if not only or os.environ.get('KIT_EXPORT') == '1' else {}

    if not only:
        dims_path = os.path.join(K.KITS, NAME + '.dims.json')
        with open(dims_path, 'w', encoding='utf-8', newline='\n') as f:
            json.dump({'source': 'tools/blender/kit_trees_mudbrick.py', 'units': 'm, [x 길이, 앞뒤 깊이, 높이]',
                       'pieces': {k: [round(v, 2) for v in dims[k]] for k in sorted(dims)}}, f, indent=2, ensure_ascii=False)
        log('치수표 저장 완료: %s' % dims_path)

    log('=== 흙벽돌 식생 세트 빌드 완료: 총 %d개 조각 (%.1fs) ===' % (len(roots), time.time() - t0))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)
