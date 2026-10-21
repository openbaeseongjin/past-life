# 동아시아 식생 세트 — Blender 4.2 명령줄 스크립트. ez-tree(MIT)로 못 짓는 꼴만 여기서 짓는다 (소나무·느티·버들·감나무는 kitdata.js TREES_EA 의 ez-tree 프리셋).
#   GLTFT=<gltf-transform 폴더> "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe" --background --python tools/blender/kit_trees_eastasia.py
# 결과: docs/past-life/assets/real/kits/trees_eastasia.glb (meshopt + WebP), kits/trees_eastasia.dims.json, kits/preview/eastasia_trees.png
# 노드 (바닥 가운데 = 밑동, 미터):
#   bamboo_grove  대숲 (왕대·솜대 꼴: 곧은 줄기 22, 키 8~11 m, 위 2/3 에 잔가지 + 잎 다발) — 마을 뒤·개울가
#   bamboo_small  집 뒤 작은 대 포기 (줄기 9, 키 4~6 m)
#   grass_silver  억새 포기 (키 ~1.8 m, 은빛 이삭) — 둑·물가
#   reed_ea       갈대 포기 (키 ~2.2 m, 갈색 이삭) — 개울가
# 재료: 조각마다 둘 — 줄기 bamboo(bamboo_wall 을 푸르게) + 잎 frond(이 스크립트가 만든 잎 띠 그림, 양면). 장면은 줄기 = bGeo, frond = lGeo 로 받아
#   ez-tree 나무와 같은 틀(가까이 재질별 InstancedMesh, 멀리 8방향 빌보드)로 그린다. 결정성: 난수는 Piece 의 random.Random(고정 씨앗)만.
import os, sys, math, time, json
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
import numpy as np
from mathutils import Vector, Matrix
import kit_common as K
from kit_common import Piece, log
import kit_sa_common as S
from kit_sa_common import Tm, Rz, Ry, Rx
from kit_props import lathe_bm, tube_bm, ellipsoid_bm
import kit_trees_southasia as KTS          # 줄기 관(trunk_bm)만 빌려 쓴다 (도형 도구, 남아시아 세트 결과와 상관없다)

rad = math.radians
NAME = 'trees_eastasia'
BANDS = ['bamboo', 'bamboo_y', 'stem', 'silver', 'silver_tip', 'reed', 'reed_tip', 'node']
BAND_COL = {   # (밑동, 끝) sRGB
    'bamboo': ((0.26, 0.4, 0.12), (0.42, 0.54, 0.18)), 'bamboo_y': ((0.36, 0.44, 0.16), (0.52, 0.56, 0.24)), 'stem': ((0.32, 0.42, 0.16), (0.38, 0.48, 0.2)),
    'silver': ((0.32, 0.42, 0.18), (0.56, 0.6, 0.36)), 'silver_tip': ((0.78, 0.76, 0.7), (0.92, 0.9, 0.86)), 'reed': ((0.36, 0.42, 0.2), (0.58, 0.56, 0.34)),
    'reed_tip': ((0.5, 0.4, 0.3), (0.68, 0.58, 0.46)), 'node': ((0.5, 0.52, 0.32), (0.56, 0.56, 0.36)),
}


def gen_frond():
    """잎 띠 그림 256×256: 가로 8 칸(칸마다 32 화소), 세로 = 밑동(아래) → 끝(위) 색 변화, 칸 가운데 잎맥, 잔 결."""
    W, H, n = 32 * len(BANDS), 256, len(BANDS)
    bw = W // n
    rs = np.random.RandomState(17)
    a = np.ones((H, W, 4), np.float32)
    v = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
    for i, b in enumerate(BANDS):
        c0, c1 = (np.array(c, np.float32) for c in BAND_COL[b])
        u = (np.arange(bw, dtype=np.float32) + 0.5) / bw
        mid = np.exp(-((u - 0.5) / 0.05) ** 2)[None, :, None]
        edge = (np.abs(u - 0.5) * 2)[None, :, None]
        col = c0[None, None] * (1 - v) + c1[None, None] * v
        col = col * (1 - 0.3 * mid) * (0.92 + 0.12 * edge)
        streak = rs.normal(0, 1, (1, bw, 1)).astype(np.float32)
        col = col * (1 + 0.05 * streak) + rs.normal(0, 0.012, (H, bw, 3)).astype(np.float32)
        a[:, i * bw:(i + 1) * bw, :3] = col
    path = os.path.join(K.BUILD, 'ea_frond.png')
    K._save_np(a, path)
    return path


def band_uv(band, s, t):
    i = BANDS.index(band)
    return ((i + 0.08 + 0.84 * s) / len(BANDS), 0.02 + 0.96 * t)


def frond_add(P, bm, band, smooth=True, matrix=None):
    uvl = bm.loops.layers.uv.verify()
    uv = band_uv(band, 0.5, 0.5)
    for f in bm.faces:
        for l in f.loops:
            l[uvl].uv = uv
    P.add_bm(bm, 'frond', uv=False, smooth=smooth, matrix=matrix)


def leaf_strip(P, base, tip_dir, L, w, band, droop=0.0, side=Vector((0, 0, 1)), segs=2, width_prof=None):
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


def setup_materials():
    T, X = K.prep_texture, lambda f: os.path.join(K.TEX, f)
    mk = K.make_material
    mk('bamboo', T('ea_bamboo_culm_d', 'bamboo_wall_diff_1k.jpg', tint=(0.8, 1.0, 0.6), gain=0.9, sat=1.1), X('bamboo_wall_nor_gl_1k.jpg'), rough=0.55, nstr=0.6)
    mk('frond', gen_frond(), None, rough=0.75, double=True)


def culm(P, x0, y0, a, H, lean, r0, leaves_from=0.35, twig_rate=1.0, band='bamboo'):
    """대 줄기 하나: 곧게 오르다 끝이 조금 휜다, 마디 고리, 위쪽 잔가지 + 잎 다발."""
    rng = P.rng
    pts, radii = [], []
    n = 10
    for j in range(n + 1):
        t = j / n
        pts.append((x0 + math.cos(a) * lean * t ** 2.2, y0 + math.sin(a) * lean * t ** 2.2, H * t - 0.25 * lean * t ** 3))
        radii.append(r0 * (1 - 0.6 * t))
    P.add_bm(KTS.trunk_bm(pts, radii, n=6, tile_u=0.25, tile_v=1.4), 'bamboo', uv=False, smooth=True)
    for j in range(2, n + 1, 2):
        p = Vector(pts[j - 1]).lerp(Vector(pts[j]), 0.5)
        frond_add(P, lathe_bm([(radii[j] * 1.18, -0.02), (radii[j] * 1.18, 0.02)], n=6), 'node', matrix=Tm(*p))
    j0 = int(n * leaves_from)
    for j in range(max(1, j0), n + 1):
        p0, p1 = Vector(pts[j - 1]), Vector(pts[j])
        up = (j - j0) / max(1, n - j0)
        for q in range(int((2 + 2 * up) * twig_rate + 0.5)):
            p = p0.lerp(p1, rng.uniform(0.0, 1.0))
            az = a + rng.uniform(-2.8, 2.8)
            tw = Vector((math.cos(az), math.sin(az), rng.uniform(0.0, 0.45))).normalized()
            L = rng.uniform(0.55, 1.1) * (1.0 - 0.35 * up)
            end = p + tw * L
            frond_add(P, tube_bm([tuple(p), tuple(end)], 0.007, n=3, cap0=False), 'stem')
            for lf in range(7):
                st = p + tw * (L * (0.25 + 0.75 * lf / 6))
                la = az + (lf % 2 * 2 - 1) * rng.uniform(0.4, 1.2)
                ld = Vector((math.cos(la), math.sin(la), rng.uniform(-0.8, -0.2))).normalized()
                leaf_strip(P, st, ld, rng.uniform(0.3, 0.46), 0.055, band, droop=0.08, segs=1, side=tw, width_prof=lambda t: 1.0 - 0.75 * t)


def bamboo_grove():
    P = Piece('bamboo_grove', 7101)
    rng = P.rng
    n = 22
    for k in range(n):
        a = k * 2.39996
        r0 = 1.9 * math.sqrt((k + 0.5) / n)
        x0, y0 = r0 * math.cos(a), r0 * math.sin(a)
        H = rng.uniform(7.5, 10.8)
        culm(P, x0, y0, a + rng.uniform(-0.6, 0.6), H, rng.uniform(0.2, 0.9), rng.uniform(0.055, 0.075), leaves_from=0.42, twig_rate=0.8,
             band='bamboo' if k % 3 else 'bamboo_y')
    return P


def bamboo_small():
    P = Piece('bamboo_small', 7102)
    rng = P.rng
    n = 9
    for k in range(n):
        a = k * 2.39996
        r0 = 0.7 * math.sqrt((k + 0.5) / n)
        culm(P, r0 * math.cos(a), r0 * math.sin(a), a, rng.uniform(3.8, 5.8), rng.uniform(0.3, 0.9), rng.uniform(0.03, 0.042), leaves_from=0.3, twig_rate=0.9)
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


def plumes(P, n, hmin, hmax, band_stem, band_tip, spread, size, droop=0.25):
    rng = P.rng
    for k in range(n):
        a = k * 2.39996
        r = spread * math.sqrt((k + 0.5) / n)
        x, y = r * math.cos(a), r * math.sin(a)
        h = rng.uniform(hmin, hmax)
        tip = (x + 0.22 * math.cos(a), y + 0.22 * math.sin(a), h)
        frond_add(P, tube_bm([(x, y, 0.0), tip], 0.006, n=3, cap0=False), band_stem)
        for q in range(5):
            b = a + (q - 2) * 0.35
            d = Vector((math.cos(b) * 0.5, math.sin(b) * 0.5, 0.2 - droop)).normalized()
            leaf_strip(P, (tip[0], tip[1], tip[2] - 0.05 * q), d, size * rng.uniform(0.8, 1.1), 0.03, band_tip, droop=size * 0.4, segs=2,
                       width_prof=lambda t: 1.0 - 0.6 * t)


def grass_silver():
    P = Piece('grass_silver', 7103)
    grass_clump(P, 40, 0.9, 1.5, 'silver', 0.02, 0.032, spread=0.32, arch=0.55)
    plumes(P, 12, 1.5, 1.95, 'silver', 'silver_tip', 0.28, 0.32, droop=0.35)
    return P


def reed_ea():
    P = Piece('reed_ea', 7104)
    grass_clump(P, 36, 1.2, 2.0, 'reed', 0.02, 0.03, spread=0.4, arch=0.25)
    plumes(P, 10, 1.9, 2.35, 'reed', 'reed_tip', 0.35, 0.26, droop=0.1)
    return P


BUILDERS = [bamboo_grove, bamboo_small, grass_silver, reed_ea]


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
    out = os.path.join(K.KITS, NAME + '.glb') if not only else os.path.join(K.BUILD, NAME + '_partial.glb')
    tris = {r.name: sum(K.tri_count(o) for o in K.mesh_objects([r])) for r in roots}
    info = K.export_glb(roots, out) if not only or os.environ.get('KIT_EXPORT') == '1' else {}
    if not only:
        with open(os.path.join(K.KITS, NAME + '.dims.json'), 'w', encoding='utf-8', newline='\n') as f:
            json.dump({'source': 'tools/blender/kit_trees_eastasia.py', 'units': 'm, [x 길이, 앞뒤 깊이, 높이]',
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
    if [s for s in os.environ.get('KIT_ONLY', '').split(',') if s]:
        K.PREVIEW = os.path.join(K.BUILD, 'preview_only')
        os.makedirs(K.PREVIEW, exist_ok=True)
    K.setup_preview(sun_elev=32, sun_az=140, grass=os.path.join(K.TEX, 'leafy_grass_diff_1k.jpg'))
    S.preview_ground((0.66, 0.74, 0.44))
    by = {r.name: r for r in roots}
    LAYOUT = {'bamboo_grove': (-4.0, 5.0, 0.0), 'bamboo_small': (3.0, 3.0, 0.0), 'grass_silver': (0.4, 0.0, 0.0), 'reed_ea': (-1.6, -0.4, 0.0)}
    for n, (x, y, rz) in LAYOUT.items():
        if n in by:
            by[n].location = (x, y, 0)
            by[n].rotation_euler = (0, 0, rz)
    cam = K.camera_look('eastasia_trees', (-0.5, -15.0, 3.0), (-0.5, 4.0, 4.0), 28)
    K.render_to(cam, os.path.join(K.PREVIEW, 'eastasia_trees.png'))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)
