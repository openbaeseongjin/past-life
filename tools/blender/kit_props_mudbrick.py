# 흙벽돌 마을 소품·가축 세트 (서아시아·북아프리카·나일·이란) — Blender 4.2 명령줄 스크립트.
#   "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe" --background --python tools/blender/kit_props_mudbrick.py
# 결과: docs/past-life/assets/real/kits/props_mudbrick.glb (meshopt + WebP), kits/props_mudbrick.dims.json, kits/preview/mudbrick_props_*.png
# 노드:
#   가축:
#     camel         단봉낙타 — 사막의 혹, 굽은 목, 긴 다리, 넓적한 발, 안장
#     donkey_mb     당나귀 — 긴 귀, 회색 털, 등에 얹은 짐 바구니(panniers)
#     goat_mb       누비안 염소 — 늘어진 긴 귀, 뒤로 휜 뿔, 턱수염
#   생활·생업:
#     carpet_mb     바닥에 깔린 양탄자 — 킬림 무늬, 술 장식
#     loom_mb       수직 베틀 — 목재 프레임, 날실, 직조 중인 양탄자
#     pottery_mb    물항아리 무더기 — 크고 작은 테라코타 암포라 4개
#     cart_mb       흙길 수레 — 2륜 나무 바퀴, 짐칸, 끌채
#     tent_bedouin  베두인 흑천막 — 산양털 검은 천막, 목재 지주, 밧줄
#     clay_oven     흙 화덕(탄두르) — 원통형 진흙 화덕, 숯불, 빵
#     wall_mud      흙벽 담장 (2m 모듈)
#     trough_mb     사암 가축 여물통 (물 채움)
import os, sys, math, time, json
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
import numpy as np
from mathutils import Vector, Matrix
import kit_common as K
from kit_common import Piece, box_vf, temp_obj, log, bm_from
import kit_props as KP
from kit_props import lathe_bm, loft_bm, tube_bm, ellipsoid_bm
import kit_mb_common as MB
import kit_sa_common as S
from kit_sa_common import add_vf, Tm, Rz, Ry, Rx

rad = math.radians
NAME = 'props_mudbrick'

# ───────────────────────── 재료 설정 ─────────────────────────
def setup_materials():
    T, X = K.prep_texture, lambda f: os.path.join(K.TEX, f)
    mk = K.make_material

    mk('adobe', T('mb_adobe_d', 'clay_plaster_diff_1k.jpg', tint=(1.05, 0.92, 0.78), gain=0.92, sat=1.1),
       X('clay_plaster_nor_gl_1k.jpg'), rough=0.96, nstr=1.1)
    mk('adobe_brick', T('mb_brick_d', 'clay_block_wall_diff_1k.jpg', tint=(1.02, 0.88, 0.72), gain=0.88, sat=1.15),
       X('clay_block_wall_nor_gl_1k.jpg'), rough=0.94, nstr=1.3)
    mk('timber_dark', T('mb_timber_d', 'rough_wood_diff_1k.jpg', tint=(0.78, 0.62, 0.48), gain=0.65, sat=0.85),
       X('rough_wood_nor_gl_1k.jpg'), rough=0.85, nstr=1.0)
    mk('planks', T('mb_planks_d', 'old_planks_02_diff_1k.jpg', tint=(0.88, 0.76, 0.62), gain=0.85),
       X('old_planks_02_nor_gl_1k.jpg'), rough=0.85, nstr=1.0)
    mk('sandstone', T('mb_sandstone_d', 'sandstone_blocks_08_diff_1k.jpg', tint=(1.06, 0.92, 0.76), gain=0.92),
       X('sandstone_blocks_08_nor_gl_1k.jpg'), rough=0.9, nstr=1.0)
    mk('canvas_dark', T('mb_canvas_d', 'rough_linen_diff_1k.jpg', tint=(0.25, 0.22, 0.20), gain=0.5),
       X('rough_linen_nor_gl_1k.jpg'), rough=0.98, nstr=0.8, double=True)
    mk('leather', T('mb_leather_d', 'brown_leather_albedo_1k.jpg', tint=(0.85, 0.65, 0.45), gain=0.8),
       X('brown_leather_nor_gl_1k.jpg'), rough=0.75, nstr=0.8)

    mk('water', color=(0.04, 0.08, 0.08), rough=0.06)
    mk('coals', color=(0.05, 0.02, 0.01), rough=1.0, emit=(1.0, 0.38, 0.08), emit_strength=5.0)

    pal_png = MB.gen_palette()
    mk('palette', pal_png, rough=0.85)


# ───────────────────────── 소품 및 가축 조각들 ─────────────────────────

def camel():
    """단봉낙타: 사막의 혹, 굽은 목, 긴 다리, 넓적한 발, 안장 (머리 = +X)."""
    P = Piece('camel', 3201)
    # 1. 몸통 (타원체)
    body = ellipsoid_bm((0, 0, 1.45), (1.05, 0.52, 0.58), nu=12, nv=8)
    P.add_bm(body, 'palette', tile=1.0)

    # 2. 사막의 혹 (Hump)
    hump = ellipsoid_bm((-0.1, 0, 1.95), (0.48, 0.36, 0.45), nu=10, nv=6)
    P.add_bm(hump, 'palette', tile=1.0)

    # 3. 굽은 목과 머리 (Tube)
    # 목 궤적: 가슴 -> 아래로 굽었다가 -> 위로 솟구쳐 머리로 연결
    neck_pts = [
        (0.85, 0, 1.35),
        (1.15, 0, 1.25),
        (1.42, 0, 1.55),
        (1.58, 0, 1.95),
        (1.68, 0, 2.25)
    ]
    neck_radii = [0.32, 0.28, 0.24, 0.20, 0.18]
    neck = tube_bm(neck_pts, neck_radii, n=8)
    P.add_bm(neck, 'palette', tile=1.0)

    # 머리
    head = ellipsoid_bm((1.82, 0, 2.28), (0.26, 0.15, 0.18), nu=8, nv=6)
    P.add_bm(head, 'palette', tile=1.0)
    # 주둥이
    snout = ellipsoid_bm((2.02, 0, 2.22), (0.16, 0.12, 0.12), nu=6, nv=4)
    P.add_bm(snout, 'palette', tile=1.0)
    # 작은 귀 둘
    for ey in (-0.14, 0.14):
        ear = ellipsoid_bm((1.72, ey, 2.42), (0.06, 0.04, 0.10), nu=4, nv=4)
        P.add_bm(ear, 'palette', tile=1.0)

    # 4. 다리 넷
    leg_coords = [
        (0.65, -0.32), (0.65, 0.32),
        (-0.72, -0.28), (-0.72, 0.28)
    ]
    for lx, ly in leg_coords:
        # 허벅지 -> 무릎 -> 발목
        pts = [(lx, ly, 1.2), (lx, ly, 0.65), (lx, ly, 0.08)]
        radii = [0.15, 0.11, 0.08]
        leg = tube_bm(pts, radii, n=6)
        P.add_bm(leg, 'palette', tile=1.0)
        # 사막 모래에 빠지지 않는 넓적한 발
        foot = ellipsoid_bm((lx + 0.04, ly, 0.04), (0.14, 0.12, 0.05), nu=6, nv=4)
        P.add_bm(foot, 'palette', tile=1.0)

    # 5. 꼬리
    tail_pts = [(-0.95, 0, 1.45), (-1.15, 0, 1.25), (-1.22, 0, 0.95)]
    tail = tube_bm(tail_pts, [0.06, 0.04, 0.03], n=4)
    P.add_bm(tail, 'palette', tile=1.0)

    # 6. 안장 (Saddle) - 혹 앞뒤 나무 프레임과 붉은 모포
    P.box(-0.35, 0.15, -0.42, 0.42, 1.7, 1.82, 'leather')
    # 안장 폼 뿔 (Pommel)
    P.cyl(0.04, 0.03, 0.25, 'timber_dark', n=6, matrix=Tm(0.2, 0, 1.8))
    P.cyl(0.04, 0.03, 0.22, 'timber_dark', n=6, matrix=Tm(-0.38, 0, 1.8))

    return P


def donkey_mb():
    """당나귀: 긴 귀, 회색 털, 등에 얹은 짐 바구니(panniers)."""
    P = Piece('donkey_mb', 3202)
    # 1. 몸통
    body = ellipsoid_bm((0, 0, 0.95), (0.68, 0.32, 0.36), nu=10, nv=6)
    P.add_bm(body, 'palette', tile=1.0)

    # 2. 목과 머리
    neck_pts = [(0.52, 0, 0.9), (0.75, 0, 1.15), (0.88, 0, 1.35)]
    neck = tube_bm(neck_pts, [0.20, 0.16, 0.14], n=6)
    P.add_bm(neck, 'palette', tile=1.0)

    head = ellipsoid_bm((1.02, 0, 1.38), (0.20, 0.12, 0.14), nu=6, nv=4)
    P.add_bm(head, 'palette', tile=1.0)
    muzzle = ellipsoid_bm((1.18, 0, 1.32), (0.12, 0.09, 0.09), nu=6, nv=4)
    P.add_bm(muzzle, 'palette', tile=1.0)

    # 긴 귀 둘 (당나귀의 대표 특징!)
    for ey in (-0.10, 0.10):
        ear = ellipsoid_bm((0.92, ey, 1.62), (0.05, 0.04, 0.18), nu=4, nv=4)
        ear.transform(Rz(-15 if ey < 0 else 15))
        P.add_bm(ear, 'palette', tile=1.0)

    # 3. 다리 넷
    leg_coords = [(0.42, -0.22), (0.42, 0.22), (-0.45, -0.20), (-0.45, 0.20)]
    for lx, ly in leg_coords:
        pts = [(lx, ly, 0.8), (lx, ly, 0.4), (lx, ly, 0.05)]
        leg = tube_bm(pts, [0.08, 0.06, 0.05], n=6)
        P.add_bm(leg, 'palette', tile=1.0)

    # 4. 등에 얹은 짐 바구니 (Panniers)
    for sy in (-0.36, 0.36):
        P.box(-0.25, 0.25, sy - 0.18, sy + 0.18, 0.72, 1.15, 'planks', bevel=0.02)

    return P


def goat_mb():
    """누비안 염소: 늘어진 긴 귀, 뒤로 휜 뿔, 턱수염."""
    P = Piece('goat_mb', 3203)
    # 1. 몸통
    body = ellipsoid_bm((0, 0, 0.65), (0.48, 0.24, 0.28), nu=8, nv=6)
    P.add_bm(body, 'palette', tile=1.0)

    # 2. 목과 머리
    neck_pts = [(0.38, 0, 0.62), (0.52, 0, 0.82), (0.62, 0, 0.98)]
    neck = tube_bm(neck_pts, [0.14, 0.11, 0.09], n=6)
    P.add_bm(neck, 'palette', tile=1.0)

    head = ellipsoid_bm((0.74, 0, 1.02), (0.15, 0.09, 0.10), nu=6, nv=4)
    P.add_bm(head, 'palette', tile=1.0)

    # 늘어진 귀 (누비안 염소 스타일: 아래로 처진 긴 귀)
    for ey in (-0.09, 0.09):
        ear_pts = [(0.68, ey, 1.02), (0.68, ey * 1.4, 0.88), (0.68, ey * 1.5, 0.75)]
        ear = tube_bm(ear_pts, [0.03, 0.035, 0.02], n=4)
        P.add_bm(ear, 'palette', tile=1.0)

    # 뒤로 휜 작은 뿔
    for hy in (-0.06, 0.06):
        horn_pts = [(0.70, hy, 1.10), (0.60, hy, 1.18), (0.48, hy, 1.20)]
        horn = tube_bm(horn_pts, [0.025, 0.02, 0.01], n=4)
        P.add_bm(horn, 'palette', tile=1.0)

    # 다리 넷
    for lx, ly in [(0.30, -0.15), (0.30, 0.15), (-0.32, -0.15), (-0.32, 0.15)]:
        leg = tube_bm([(lx, ly, 0.55), (lx, ly, 0.03)], [0.05, 0.035], n=4)
        P.add_bm(leg, 'palette', tile=1.0)

    return P


def carpet_mb():
    """바닥에 깔린 양탄자: 킬림 무늬, 술 장식."""
    P = Piece('carpet_mb', 3204)
    w, d = 2.4, 1.6
    # 융단 본체
    P.box(-w * 0.5, w * 0.5, -d * 0.5, d * 0.5, 0.0, 0.03, 'palette')
    # 양쪽 끝 술 (Fringe)
    for fx in (-w * 0.5 - 0.08, w * 0.5):
        P.box(fx, fx + 0.08, -d * 0.5, d * 0.5, 0.0, 0.015, 'palette')
    return P


def loom_mb():
    """수직 베틀: 목재 프레임, 날실, 직조 중인 양탄자."""
    P = Piece('loom_mb', 3205)
    # 1. 수직 목재 기둥 둘
    P.beam((-0.85, 0, 0), (-0.85, 0, 2.1), 0.12, 0.12, 'timber_dark')
    P.beam((0.85, 0, 0), (0.85, 0, 2.1), 0.12, 0.12, 'timber_dark')
    # 상하 가로 들보
    P.beam((-0.95, 0, 1.95), (0.95, 0, 1.95), 0.12, 0.12, 'timber_dark')
    P.beam((-0.95, 0, 0.35), (0.95, 0, 0.35), 0.12, 0.12, 'timber_dark')

    # 2. 직조 중인 킬림 양탄자 면
    P.box(-0.75, 0.75, -0.02, 0.02, 0.4, 1.35, 'palette')
    # 상부 날실 (세로 실들)
    P.box(-0.75, 0.75, -0.01, 0.01, 1.35, 1.95, 'palette')

    # 3. 바닥 지지대
    P.beam((-0.85, -0.4, 0.06), (-0.85, 0.4, 0.06), 0.12, 0.12, 'timber_dark')
    P.beam((0.85, -0.4, 0.06), (0.85, 0.4, 0.06), 0.12, 0.12, 'timber_dark')

    return P


def pottery_mb():
    """물항아리 무더기: 크고 작은 테라코타 암포라 4개."""
    P = Piece('pottery_mb', 3206)
    pots = [
        (0.0, 0.0, 0.48, 0.95),
        (-0.55, 0.25, 0.38, 0.75),
        (0.50, 0.20, 0.35, 0.68),
        (-0.15, -0.50, 0.42, 0.82)
    ]
    for px, py, pr, ph in pots:
        # 항아리 회전체 (lathe_bm)
        profile = [
            (0.0, 0.0),
            (pr * 0.45, 0.02),
            (pr * 0.95, ph * 0.45),
            (pr * 0.80, ph * 0.75),
            (pr * 0.40, ph * 0.88),
            (pr * 0.52, ph)
        ]
        pot = lathe_bm(profile, n=10)
        pot.transform(Tm(px, py, 0))
        P.add_bm(pot, 'palette', tile=1.0)

    return P


def cart_mb():
    """흙길 수레: 2륜 나무 바퀴, 짐칸, 끌채."""
    P = Piece('cart_mb', 3207)
    # 1. 차축과 2개 나무 바퀴
    P.cyl(0.65, 0.65, 0.08, 'planks', n=12, matrix=Tm(0, -0.9, 0.65) @ Rx(90))
    P.cyl(0.65, 0.65, 0.08, 'planks', n=12, matrix=Tm(0, 0.9, 0.65) @ Rx(90))
    P.beam((0, -0.95, 0.65), (0, 0.95, 0.65), 0.12, 0.12, 'timber_dark')

    # 2. 짐칸 바닥과 난간
    P.box(-1.1, 1.1, -0.75, 0.75, 0.7, 0.78, 'planks')
    # 측면 난간 살들
    P.box(-1.1, 1.1, -0.78, -0.72, 0.78, 1.25, 'timber_dark')
    P.box(-1.1, 1.1, 0.72, 0.78, 0.78, 1.25, 'timber_dark')
    P.box(-1.12, -1.06, -0.75, 0.75, 0.78, 1.25, 'timber_dark')

    # 3. 끌채 (샤프트)
    P.beam((1.1, -0.45, 0.72), (2.4, -0.45, 0.35), 0.09, 0.09, 'timber_dark')
    P.beam((1.1, 0.45, 0.72), (2.4, 0.45, 0.35), 0.09, 0.09, 'timber_dark')

    return P


def tent_bedouin():
    """베두인 흑천막: 산양털 검은 천막, 목재 지주, 밧줄 (L=5.4m, D=3.8m, 높이 1.9m)."""
    P = Piece('tent_bedouin', 3208)
    L, D, H = 5.4, 3.8, 1.9
    x0, x1 = -L * 0.5, L * 0.5
    y0, y1 = -D * 0.5, D * 0.5

    # 1. 중앙 목재 기둥 둘 (텐트 능선)
    P.cyl(0.06, 0.05, H, 'timber_dark', n=6, matrix=Tm(-1.2, 0, 0))
    P.cyl(0.06, 0.05, H, 'timber_dark', n=6, matrix=Tm(1.2, 0, 0))
    P.beam((-1.5, 0, H - 0.05), (1.5, 0, H - 0.05), 0.08, 0.08, 'timber_dark')

    # 2. 산양털 검은 텐트 천막 (canvas_dark)
    # 지붕 능선에서 처마로 경사면들
    # 남쪽/북쪽 경사 지붕
    P.box(x0, x1, y0, 0.0, 0.85, H, 'canvas_dark', bevel=0.03)
    P.box(x0, x1, 0.0, y1, 0.85, H, 'canvas_dark', bevel=0.03)
    # 뒷벽 (북쪽)
    P.box(x0, x1, y1 - 0.05, y1, 0.0, 0.85, 'canvas_dark')

    # 3. 텐트 내부 바닥 양탄자
    P.box(x0 + 0.4, x1 - 0.4, y0 + 0.4, y1 - 0.4, 0.0, 0.03, 'palette')

    return P


def clay_oven():
    """흙 화덕(탄두르): 원통형 진흙 화덕, 숯불, 갓 구운 빵."""
    P = Piece('clay_oven', 3209)
    # 흙 화덕 몸체 (아래가 넓고 위가 좁아지는 원추형)
    P.cyl(0.65, 0.45, 0.85, 'adobe', n=12, matrix=Tm(0, 0, 0))
    # 내부 숯불 (coals)
    P.cyl(0.38, 0.38, 0.15, 'coals', n=8, matrix=Tm(0, 0, 0.3))
    # 상부 개구부 테두리
    P.cyl(0.48, 0.48, 0.08, 'sandstone', n=10, matrix=Tm(0, 0, 0.85))
    return P


def wall_mud():
    """흙벽 담장: 2m 모듈 흙벽돌 담장."""
    P = Piece('wall_mud', 3210)
    P.box(-1.0, 1.0, -0.18, 0.18, 0.0, 1.45, 'adobe', bevel=0.03)
    # 담장 상부 흙 파라펫
    P.box(-1.05, 1.05, -0.22, 0.22, 1.45, 1.62, 'adobe_brick', bevel=0.02)
    return P


def trough_mb():
    """사암 가축 여물통 (물 채움)."""
    P = Piece('trough_mb', 3211)
    P.box(-0.9, 0.9, -0.45, 0.45, 0.0, 0.52, 'sandstone', bevel=0.03)
    P.box(-0.8, 0.8, -0.35, 0.35, 0.38, 0.48, 'water')
    return P


# ───────────────────────── 빌드 파이프라인 ─────────────────────────

BUILDERS = [
    camel,
    donkey_mb,
    goat_mb,
    carpet_mb,
    loom_mb,
    pottery_mb,
    cart_mb,
    tent_bedouin,
    clay_oven,
    wall_mud,
    trough_mb,
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
        log('%-18s %6d 삼각형  %.1fs  %s' % (root.name, tris_count, time.time() - ts,
                                            'x'.join('%.2f' % d for d in dims[root.name])))

    for i, r in enumerate(roots):
        r.location = (i * 30.0, 0, 0)
    objs = K.mesh_objects(roots)
    K.make_ao_uvs(objs)
    samples = 32 if K.FAST else 128
    img = K.bake_ao(objs, size=2048, samples=samples, distance=0.8)
    mats = [K.MATS[n] for n in K.MATS]
    K.wire_ao(mats, img)

    for r in roots:
        r.location = (0, 0, 0)

    out = os.path.join(K.KITS, NAME + '.glb') if not only else os.path.join(K.BUILD, NAME + '_partial.glb')
    info = K.export_glb(roots, out) if not only or os.environ.get('KIT_EXPORT') == '1' else {}

    if not only:
        dims_path = os.path.join(K.KITS, NAME + '.dims.json')
        with open(dims_path, 'w', encoding='utf-8', newline='\n') as f:
            json.dump({'source': 'tools/blender/kit_props_mudbrick.py', 'units': 'm, [x 길이, 앞뒤 깊이, 높이]',
                       'pieces': {k: [round(v, 2) for v in dims[k]] for k in sorted(dims)}}, f, indent=2, ensure_ascii=False)
        log('치수표 저장 완료: %s' % dims_path)

    log('=== 흙벽돌 소품 세트 빌드 완료: 총 %d개 조각 (%.1fs) ===' % (len(roots), time.time() - t0))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)
