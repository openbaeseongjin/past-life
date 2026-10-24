# 흙벽돌 건물 세트 (서아시아·북아프리카·나일·이란) — Blender 4.2 명령줄 스크립트.
#   "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe" --background --python tools/blender/kit_mudbrick.py
# 결과: docs/past-life/assets/real/kits/mudbrick.glb (meshopt + WebP), kits/mudbrick.dims.json, kits/preview/mudbrick_*.png
# 노드:
#   house_flat_a       평지붕 흙벽돌 집 A — 두꺼운 흙벽, 돌출 vigas 목재 보, 옥상 파라펫·물골, 외벽 옥상 계단, 나무문
#   house_flat_b       2단 테라스 흙벽돌 집 B — 1층과 2층 테라스, 목재 기둥 차양 캐노피, 돌출 vigas
#   house_courtyard_mb 흙벽돌 안뜰집 — 사각 중정을 에워싼 방들, 안뜰 아케이드 회랑, 웅장한 아치 대문
#   tower_wind         바람탑(Badgir) 가옥 — 가옥 위에 높이 솟은 4면 통풍 풍탑, 목재 교차 보
#   mosque_small       작은 흙벽돌 모스크 (≥630 이슬람 시대) — 흙벽돌 돔, 3연속 아치 현관, 진흙 미나렛 첨탑
#   shrine_mb          이슬람 이전 성소 (<630) — 4개 기둥 아치(차하르 타크) 돔, 중앙 불의 제단(성화대)
#   well_mb            오아시스 우물 — 둥근 흙벽 난간, 기둥과 도르래, 물통과 가죽 두레박
#   market_arcade      바자르 아케이드 — 3연속 아치 회랑, 줄무늬 차양 천막, 좌판 평상과 양탄자
#   granary_mb         곡식 저장고 — 벌집형 진흙 사일로 3기 군집
#   smithy_mb          흙벽돌 대장간 — 모루 로컬 (0.55, 0.6), 흙벽돌 화덕, smithy_forge 빈 노드
#   gate_mb            마을 입구 관문 — 흙벽돌 아치 게이트와 상부 흉벽
#   palace_mb          흙벽돌 궁정 저택 (카스바) — 4 모퉁이 망루 타워, 다층 테라스, 대형 아치 포털
import os, sys, math, time, json
import numpy as np
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector, Matrix
import kit_common as K
from kit_common import Piece, box_vf, temp_obj, log, bm_from
import kit_props as KP
from kit_props import lathe_bm, tube_bm, ellipsoid_bm
import kit_mb_common as MB
import kit_sa_common as S
from kit_mb_common import add_vigas, make_dome_bm, make_parapet, make_outdoor_stairs, pal_set, pal_uv, Tm, Rz, Ry, Rx

rad = math.radians
NAME = 'mudbrick'

# ───────────────────────── 재료 설정 ─────────────────────────
def setup_materials():
    T, X = K.prep_texture, lambda f: os.path.join(K.TEX, f)
    mk = K.make_material

    # 따뜻한 햇볕에 말린 흙벽돌 / 진흙 플라스터
    mk('adobe', T('mb_adobe_d', 'clay_plaster_diff_1k.jpg', tint=(1.05, 0.92, 0.78), gain=0.92, sat=1.1, contrast=1.1),
       X('clay_plaster_nor_gl_1k.jpg'), rough=0.96, nstr=1.1)

    # 줄눈이 선명한 흙벽돌 블록 (기단·벽체 하단)
    mk('adobe_brick', T('mb_brick_d', 'clay_block_wall_diff_1k.jpg', tint=(1.02, 0.88, 0.72), gain=0.88, sat=1.15),
       X('clay_block_wall_nor_gl_1k.jpg'), rough=0.94, nstr=1.3)

    # 흰 석회칠 벽 (모스크·안뜰 일부)
    mk('mud_white', T('mb_white_d', 'white_rough_plaster_diff_1k.jpg', tint=(1.0, 0.96, 0.90), gain=0.96, sat=0.4),
       X('white_rough_plaster_nor_gl_1k.jpg'), rough=0.95, nstr=0.8)

    # 사암 블록 (성소 기단·기둥)
    mk('sandstone', T('mb_sandstone_d', 'sandstone_blocks_08_diff_1k.jpg', tint=(1.06, 0.92, 0.76), gain=0.92, sat=1.1),
       X('sandstone_blocks_08_nor_gl_1k.jpg'), rough=0.9, nstr=1.0)

    # 돌출 vigas 및 목재 들보
    mk('timber_dark', T('mb_timber_d', 'rough_wood_diff_1k.jpg', tint=(0.78, 0.62, 0.48), gain=0.65, sat=0.85),
       X('rough_wood_nor_gl_1k.jpg'), rough=0.85, nstr=1.0)

    # 낡은 판자 문
    mk('planks', T('mb_planks_d', 'old_planks_02_diff_1k.jpg', tint=(0.88, 0.76, 0.62), gain=0.85),
       X('old_planks_02_nor_gl_1k.jpg'), rough=0.85, nstr=1.0)

    # 차양 천막 (줄무늬 린넨)
    mk('canvas', T('mb_canvas_d', 'rough_linen_diff_1k.jpg', stripes=(4, (0.75, 0.22, 0.15), (0.15, 0.28, 0.55))),
       X('rough_linen_nor_gl_1k.jpg'), rough=0.95, nstr=0.7, double=True)

    # 건조한 모래/흙 바닥
    mk('earth_dry', T('mb_earth_d', 'brown_mud_dry_diff_1k.jpg', tint=(1.1, 0.95, 0.8), gain=0.85, sat=0.9),
       X('brown_mud_dry_nor_gl_1k.jpg'), rough=0.98, nstr=1.0)

    # 특수 머티리얼 (어둠, 불씨, 물)
    mk('glass', color=(0.025, 0.02, 0.016), rough=0.6, emit=(1.0, 0.55, 0.22), emit_strength=0.0)
    mk('coals', color=(0.05, 0.02, 0.01), rough=1.0, emit=(1.0, 0.38, 0.08), emit_strength=5.0)
    mk('water', color=(0.04, 0.08, 0.08), rough=0.06)

    # 색표 팔레트 텍스처 머티리얼
    pal_png = MB.gen_palette()
    mk('palette', pal_png, rough=0.85)


# ───────────────────────── 조각 구현 ─────────────────────────

def house_flat_a():
    """평지붕 흙벽돌 집 A: 돌출 vigas, 외벽 계단, 옥상 파라펫 난간과 물골, 아치 나무문."""
    P = Piece('house_flat_a', 3101)
    L, D, H = 6.8, 5.2, 3.2
    x0, x1 = -L * 0.5, L * 0.5
    y0, y1 = -D * 0.5, D * 0.5
    zp, z_top = 0.25, 3.15

    # 1. 기단 (사암/흙)
    P.box(x0 - 0.25, x1 + 0.25, y0 - 0.25, y1 + 0.25, -0.2, zp, 'adobe_brick', bevel=0.04, tile=2.0)
    # 입구 디딤단
    P.box(-0.8, 0.8, y0 - 0.65, y0 - 0.25, -0.1, zp * 0.5, 'sandstone', bevel=0.03, tile=1.5)

    # 2. 벽체 (본체)
    # 벽 하단 흙벽돌
    P.box(x0, x1, y0, y1, zp, zp + 0.8, 'adobe_brick', bevel=0.05, tile=2.0)
    # 벽 상단 미장
    P.box(x0, x1, y0, y1, zp + 0.8, z_top, 'adobe', bevel=0.05, tile=2.2)

    # 3. 튀어나온 목재 보 (Vigas): X축 방향으로 Y축 양면 돌출
    MB.add_vigas(P, P.bm, x0, x1, y0, y1, z_top - 0.25, count=7, axis='Y', r=0.075, ext=0.28, mat='timber_dark')

    # 4. 옥상 파라펫 난간벽 + 배수구 물골
    MB.make_parapet(P, x0, x1, y0, y1, z_top, h=0.55, t=0.28, mat='adobe', drain_spout=True)

    # 5. 출입문 (정면 y0)
    # 아치형 문설주 프레임
    P.box(-0.65, 0.65, y0 - 0.08, y0 + 0.05, zp, zp + 2.05, 'sandstone', bevel=0.03, tile=1.0)
    # 문짝 (planks) + 문 안쪽 어둠(glass)
    P.box(-0.52, 0.52, y0 - 0.02, y0 + 0.08, zp, zp + 1.95, 'planks', bevel=0.02, tile=1.2)
    P.box(-0.48, 0.48, y0 + 0.08, y0 + 0.18, zp, zp + 1.90, 'glass')

    # 6. 작은 슬릿 창문들 (사막의 강한 열기를 막는 전통 창문)
    # 정면 우측 창문
    P.box(1.4, 2.0, y0 - 0.06, y0 + 0.06, zp + 1.1, zp + 1.65, 'sandstone', bevel=0.02, tile=1.0)
    P.box(1.48, 1.92, y0 - 0.02, y0 + 0.12, zp + 1.18, zp + 1.57, 'glass')
    # 좌측 외벽 창문
    P.box(x0 - 0.06, x0 + 0.06, -0.3, 0.3, zp + 1.2, zp + 1.75, 'sandstone', bevel=0.02, tile=1.0)
    P.box(x0 - 0.02, x0 + 0.12, -0.22, 0.22, zp + 1.28, zp + 1.67, 'glass')

    # 7. 외벽 옥상 계단 (우측 외벽 x1에 붙어 옥상으로 올라감)
    MB.make_outdoor_stairs(P, x1 + 0.05, y1 - 2.8, zp, length=2.8, width=0.75, height=z_top - zp, steps=9, axis='Z', mat='adobe_brick')

    # 8. 옥상 소품: 옥상 위 작은 목재 그늘 캐노피 (기둥 넷 + 린넨 천 차양)
    kx0, kx1, ky0, ky1 = x0 + 0.6, x0 + 2.4, y0 + 0.6, y0 + 2.2
    for kx in (kx0, kx1):
        for ky in (ky0, ky1):
            P.cyl(0.045, 0.04, 1.8, 'timber_dark', n=6, matrix=Tm(kx, ky, z_top))
    # 차양 천막 (canvas)
    P.box(kx0 - 0.1, kx1 + 0.1, ky0 - 0.1, ky1 + 0.1, z_top + 1.75, z_top + 1.82, 'canvas', tile=1.5)

    # 옥상 모퉁이 작은 흙 굴뚝과 연기 마커
    P.box(x1 - 0.8, x1 - 0.3, y1 - 0.8, y1 - 0.3, z_top, z_top + 0.65, 'adobe', bevel=0.02)
    P.marker('house_flat_a_smoke', (x1 - 0.55, y1 - 0.55, z_top + 0.75))
    return P


def house_flat_b():
    """2단 테라스 흙벽돌 집 B: 1층 테라스, 2층 가옥, 차양 캐노피, vigas."""
    P = Piece('house_flat_b', 3102)
    L1, D1, H1 = 8.0, 6.2, 2.8
    x0, x1 = -L1 * 0.5, L1 * 0.5
    y0, y1 = -D1 * 0.5, D1 * 0.5
    zp = 0.25
    z1_top = zp + H1

    # 1. 1층 기단 및 벽체
    P.box(x0 - 0.2, x1 + 0.2, y0 - 0.2, y1 + 0.2, -0.2, zp, 'adobe_brick', bevel=0.04, tile=2.0)
    P.box(x0, x1, y0, y1, zp, z1_top, 'adobe', bevel=0.05, tile=2.2)
    MB.add_vigas(P, P.bm, x0, x1, y0, y1, z1_top - 0.22, count=8, axis='Y', r=0.075, ext=0.28)
    MB.make_parapet(P, x0, x1, y0, y1, z1_top, h=0.55, t=0.26, mat='adobe')

    # 2. 2층 본체 (북서쪽으로 물러난 형태: 남쪽 앞마당이 1층 테라스가 됨)
    x2_0, x2_1 = x0 + 0.4, x1 - 2.4
    y2_0, y2_1 = y0 + 2.0, y1 - 0.3
    z2_top = z1_top + 2.3
    P.box(x2_0, x2_1, y2_0, y2_1, z1_top, z2_top, 'adobe', bevel=0.04, tile=2.0)
    MB.add_vigas(P, P.bm, x2_0, x2_1, y2_0, y2_1, z2_top - 0.2, count=5, axis='Y', r=0.065, ext=0.25)
    MB.make_parapet(P, x2_0, x2_1, y2_0, y2_1, z2_top, h=0.5, t=0.24, mat='adobe')

    # 3. 1층 테라스 차양 (남동쪽 트인 테라스)
    tx0, tx1 = x1 - 2.8, x1 - 0.5
    ty0, ty1 = y0 + 0.5, y0 + 2.5
    for cx in (tx0, tx1):
        for cy in (ty0, ty1):
            P.cyl(0.05, 0.045, 1.9, 'timber_dark', n=6, matrix=Tm(cx, cy, z1_top))
    P.box(tx0 - 0.1, tx1 + 0.1, ty0 - 0.1, ty1 + 0.1, z1_top + 1.85, z1_top + 1.92, 'canvas', tile=1.5)

    # 4. 문과 창문들
    # 1층 정면 출입문
    P.box(-0.6, 0.6, y0 - 0.08, y0 + 0.06, zp, zp + 2.0, 'sandstone', bevel=0.03)
    P.box(-0.48, 0.48, y0 - 0.02, y0 + 0.08, zp, zp + 1.9, 'planks')
    P.box(-0.42, 0.42, y0 + 0.08, y0 + 0.16, zp, zp + 1.85, 'glass')

    # 2층 테라스 출입문
    P.box((x2_0 + x2_1) * 0.5 - 0.5, (x2_0 + x2_1) * 0.5 + 0.5, y2_0 - 0.06, y2_0 + 0.06, z1_top, z1_top + 1.85, 'sandstone')
    P.box((x2_0 + x2_1) * 0.5 - 0.4, (x2_0 + x2_1) * 0.5 + 0.4, y2_0 - 0.02, y2_0 + 0.08, z1_top, z1_top + 1.78, 'planks')

    # 5. 1층 테라스로 올라가는 외벽 계단 (동쪽 외벽 x1에 배치)
    MB.make_outdoor_stairs(P, x1 + 0.04, y0 + 0.8, zp, length=3.0, width=0.75, height=z1_top - zp, steps=9, axis='Z', mat='adobe_brick')

    # 연기 마커
    P.marker('house_flat_b_smoke', (x2_1 - 0.5, y2_1 - 0.5, z2_top + 0.6))
    return P


def house_courtyard_mb():
    """흙벽돌 안뜰집: 사각 중정을 에워싼 방들, 안뜰 아케이드 회랑, 웅장한 대문."""
    P = Piece('house_courtyard_mb', 3103)
    L, D, H = 12.8, 12.0, 3.4
    x0, x1 = -L * 0.5, L * 0.5
    y0, y1 = -D * 0.5, D * 0.5
    zp = 0.25
    z_top = zp + H

    # 1. 외곽 기단
    P.box(x0 - 0.25, x1 + 0.25, y0 - 0.25, y1 + 0.25, -0.2, zp, 'adobe_brick', bevel=0.04, tile=2.5)

    # 2. 건물 외벽 및 내부 중정 (중정 cx0~cx1, cy0~cy1)
    cx0, cx1 = -2.5, 2.5
    cy0, cy1 = -2.2, 2.2

    # 남채 (앞채)
    P.box(x0, x1, y0, cy0, zp, z_top, 'adobe', bevel=0.04, tile=2.2)
    # 북채 (뒤채)
    P.box(x0, x1, cy1, y1, zp, z_top, 'adobe', bevel=0.04, tile=2.2)
    # 서채 (좌채)
    P.box(x0, cx0, cy0, cy1, zp, z_top, 'adobe', bevel=0.04, tile=2.2)
    # 동채 (우채)
    P.box(cx1, x1, cy0, cy1, zp, z_top, 'adobe', bevel=0.04, tile=2.2)

    # 중정 바닥 (earth_dry 또는 타일)
    P.box(cx0, cx1, cy0, cy1, zp - 0.05, zp + 0.02, 'earth_dry', tile=2.0)

    # 3. 외벽 vigas 및 파라펫
    MB.add_vigas(P, P.bm, x0, x1, y0, y1, z_top - 0.25, count=12, axis='Y', r=0.075, ext=0.28)
    MB.make_parapet(P, x0, x1, y0, y1, z_top, h=0.6, t=0.3, mat='adobe')
    # 중정 둘레 파라펫
    MB.make_parapet(P, cx0, cx1, cy0, cy1, z_top, h=0.45, t=0.22, mat='adobe', drain_spout=False)

    # 4. 정면 웅장한 아치 대문 (Iwan 스타일 포털)
    gw = 2.2
    P.box(-gw * 0.5, gw * 0.5, y0 - 0.15, y0 + 0.1, zp, zp + 2.7, 'sandstone', bevel=0.04, tile=1.5)
    # 대문 잎 (두 짝 planks)
    P.box(-0.8, 0.8, y0 + 0.05, y0 + 0.15, zp, zp + 2.3, 'planks', bevel=0.02)
    # 대문 통로 안 어둠
    P.box(-0.75, 0.75, y0 + 0.15, cy0, zp, zp + 2.4, 'glass')

    # 5. 중정 쪽 아케이드 기둥들
    for qx in (cx0 + 0.3, 0.0, cx1 - 0.3):
        P.box(qx - 0.18, qx + 0.18, cy1 - 0.4, cy1 - 0.05, zp, z_top, 'sandstone', bevel=0.02)

    # 연기 마커
    P.marker('house_courtyard_mb_smoke', (x0 + 1.2, y1 - 1.2, z_top + 0.65))
    return P


def tower_wind():
    """바람탑(Badgir) 가옥: 평지붕 가옥 위에 솟은 사각 바람탑, 세로 통풍구, 목재 교차 빔."""
    P = Piece('tower_wind', 3104)
    L, D, H = 7.2, 5.6, 3.2
    x0, x1 = -L * 0.5, L * 0.5
    y0, y1 = -D * 0.5, D * 0.5
    zp = 0.25
    z_top = zp + H

    # 1. 가옥 본체
    P.box(x0 - 0.2, x1 + 0.2, y0 - 0.2, y1 + 0.2, -0.2, zp, 'adobe_brick', bevel=0.04)
    P.box(x0, x1, y0, y1, zp, z_top, 'adobe', bevel=0.05, tile=2.2)
    MB.add_vigas(P, P.bm, x0, x1, y0, y1, z_top - 0.25, count=7, axis='Y', r=0.075, ext=0.28)
    MB.make_parapet(P, x0, x1, y0, y1, z_top, h=0.55, t=0.26, mat='adobe')

    # 2. 바람탑 (동쪽 옥상 위로 솟아오른 사각 탑)
    bx0, bx1 = x1 - 2.2, x1 - 0.4
    by0, by1 = y0 + 0.8, y0 + 2.6
    b_h = 4.2
    bz_top = z_top + b_h

    # 바람탑 기둥 및 몸통
    P.box(bx0, bx1, by0, by1, z_top, bz_top, 'adobe', bevel=0.03, tile=1.8)

    # 바람탑 4면 통풍 슬릿 및 그늘진 개구부 (상단 1.4m 구간)
    slit_z0, slit_z1 = bz_top - 1.5, bz_top - 0.3
    # 남/북 개구부
    P.box(bx0 + 0.2, bx1 - 0.2, by0 - 0.05, by0 + 0.08, slit_z0, slit_z1, 'glass')
    P.box(bx0 + 0.2, bx1 - 0.2, by1 - 0.08, by1 + 0.05, slit_z0, slit_z1, 'glass')
    # 동/서 개구부
    P.box(bx0 - 0.05, bx0 + 0.08, by0 + 0.2, by1 - 0.2, slit_z0, slit_z1, 'glass')
    P.box(bx1 - 0.08, bx1 + 0.05, by0 + 0.2, by1 - 0.2, slit_z0, slit_z1, 'glass')

    # 바람탑 통풍구 사이 목재 세로 날개
    for sx in np.linspace(bx0 + 0.4, bx1 - 0.4, 3):
        P.beam((sx, by0 - 0.03, slit_z0), (sx, by0 - 0.03, slit_z1), 0.06, 0.08, 'timber_dark')
        P.beam((sx, by1 + 0.03, slit_z0), (sx, by1 + 0.03, slit_z1), 0.06, 0.08, 'timber_dark')

    # 바람탑 꼭대기 파라펫과 톱니 흉벽
    P.box(bx0 - 0.1, bx1 + 0.1, by0 - 0.1, by1 + 0.1, bz_top, bz_top + 0.35, 'adobe_brick', bevel=0.02)
    # 바람탑 교차 목재 빔 (돌출 vigas)
    MB.add_vigas(P, P.bm, bx0, bx1, by0, by1, bz_top - 0.35, count=2, axis='Y', r=0.06, ext=0.3)

    # 3. 출입문과 창문
    P.box(-0.6, 0.6, y0 - 0.08, y0 + 0.06, zp, zp + 2.0, 'sandstone')
    P.box(-0.48, 0.48, y0 - 0.02, y0 + 0.08, zp, zp + 1.9, 'planks')
    P.box(-0.42, 0.42, y0 + 0.08, y0 + 0.16, zp, zp + 1.85, 'glass')

    P.marker('tower_wind_smoke', (x0 + 1.0, y1 - 1.0, z_top + 0.6))
    return P


def mosque_small():
    """작은 흙벽돌 모스크 (≥630 이슬람 시대): 흙벽돌 돔, 아치 현관 회랑, 진흙 미나렛 첨탑."""
    P = Piece('mosque_small', 3105)
    L, D, H = 8.6, 8.6, 3.8
    x0, x1 = -L * 0.5, L * 0.5
    y0, y1 = -D * 0.5, D * 0.5
    zp = 0.3
    z_top = zp + H

    # 1. 넓은 기단 (사암/석회)
    P.box(x0 - 0.4, x1 + 0.4, y0 - 0.4, y1 + 0.4, -0.3, zp, 'sandstone', bevel=0.05, tile=2.0)

    # 2. 본당 (사각 예배실)
    P.box(x0, x1, y0, y1, zp, z_top, 'mud_white', bevel=0.04, tile=2.0)
    MB.make_parapet(P, x0, x1, y0, y1, z_top, h=0.6, t=0.28, mat='mud_white')

    # 3. 중앙 흙벽돌 첨두 돔 (Pointed Dome)
    dome_r, dome_h = 2.6, 2.4
    dome_bm = make_dome_bm(r=dome_r, h=dome_h, n_lat=12, n_lon=20, pointed=0.25)
    # 돔을 지붕 위 중앙에 배치
    dome_bm.transform(Tm(0, 0, z_top))
    # 돔 표면 UV 및 머티리얼 할당
    uvl = dome_bm.loops.layers.uv.verify()
    for f in dome_bm.faces:
        for l in f.loops:
            # 돔 텍스처 박스 UV
            v = l.vert.co
            l[uvl].uv = (v.x * 0.4 + 0.5, v.y * 0.4 + 0.5)
    P._merge(dome_bm, 'adobe', smooth=True, uvl_src=uvl)
    dome_bm.free()

    # 돔 꼭대기 초승달 피니얼
    top_z = z_top + dome_h
    P.cyl(0.04, 0.04, 0.8, 'palette', n=8, matrix=Tm(0, 0, top_z))
    P.box(-0.15, 0.15, -0.04, 0.04, top_z + 0.5, top_z + 0.75, 'palette')

    # 4. 정면 3연속 아치 현관 포르티코 (Riwaq)
    fw = 1.8
    for ax in (-2.4, 0.0, 2.4):
        # 아치 양 기둥
        P.box(ax - 0.85, ax - 0.65, y0 - 0.15, y0 + 0.1, zp, zp + 2.2, 'sandstone', bevel=0.02)
        P.box(ax + 0.65, ax + 0.85, y0 - 0.15, y0 + 0.1, zp, zp + 2.2, 'sandstone', bevel=0.02)
        # 아치 윗인방 (첨두 아치형 박스)
        P.box(ax - 0.85, ax + 0.85, y0 - 0.15, y0 + 0.1, zp + 2.15, zp + 2.7, 'sandstone', bevel=0.03)
        # 아치 내부 입구 어둠
        P.box(ax - 0.65, ax + 0.65, y0 - 0.05, y0 + 0.12, zp, zp + 2.2, 'glass')

    # 5. 진흙 미나렛 첨탑 (남서쪽 모퉁이에 솟음)
    mx, my = x0 + 0.8, y0 + 0.8
    m_r = 0.95
    m_h = 9.5
    P.cyl(m_r * 1.1, m_r, m_h, 'mud_white', n=16, matrix=Tm(mx, my, zp))
    # 미나렛 상부 목재 난간 발코니
    balc_z = zp + m_h - 1.8
    P.box(mx - 1.25, mx + 1.25, my - 1.25, my + 1.25, balc_z, balc_z + 0.15, 'timber_dark')
    P.box(mx - 1.25, mx + 1.25, my - 1.25, my + 1.25, balc_z + 0.15, balc_z + 0.8, 'planks')
    # 미나렛 상부 작은 꼬깔 돔
    cap_bm = make_dome_bm(r=0.8, h=1.4, n_lat=8, n_lon=12, pointed=0.4)
    cap_bm.transform(Tm(mx, my, zp + m_h))
    uvl = cap_bm.loops.layers.uv.verify()
    P._merge(cap_bm, 'adobe', smooth=True, uvl_src=uvl)
    cap_bm.free()

    return P


def shrine_mb():
    """이슬람 이전 성소 (<630): 4개 기둥 아치(차하르 타크) 돔, 중앙 불의 제단(성화대)."""
    P = Piece('shrine_mb', 3106)
    L = 7.2
    x0, x1 = -L * 0.5, L * 0.5
    y0, y1 = -L * 0.5, L * 0.5
    zp = 0.35

    # 1. 2단 사암 기단
    P.box(x0 - 0.4, x1 + 0.4, y0 - 0.4, y1 + 0.4, -0.3, zp * 0.5, 'sandstone', bevel=0.06, tile=2.0)
    P.box(x0, x1, y0, y1, zp * 0.5, zp, 'sandstone', bevel=0.04, tile=2.0)

    # 2. 4 모퉁이 사각 사암 기둥
    pw = 1.05
    col_h = 3.2
    for px in (x0 + 0.2, x1 - 0.2 - pw):
        for py in (y0 + 0.2, y1 - 0.2 - pw):
            P.box(px, px + pw, py, py + pw, zp, zp + col_h, 'sandstone', bevel=0.04, tile=1.5)

    # 3. 4면 아치 인방 및 상부 사각 엔타블러처
    top_z = zp + col_h
    P.box(x0 + 0.1, x1 - 0.1, y0 + 0.1, y1 - 0.1, top_z, top_z + 0.8, 'sandstone', bevel=0.05, tile=2.0)

    # 4. 중앙 사암 돔 (스킨치 돔)
    dome_bm = make_dome_bm(r=2.4, h=2.0, n_lat=10, n_lon=16, pointed=0.15)
    dome_bm.transform(Tm(0, 0, top_z + 0.8))
    uvl = dome_bm.loops.layers.uv.verify()
    for f in dome_bm.faces:
        for l in f.loops:
            v = l.vert.co
            l[uvl].uv = (v.x * 0.4 + 0.5, v.y * 0.4 + 0.5)
    P._merge(dome_bm, 'adobe_brick', smooth=True, uvl_src=uvl)
    dome_bm.free()

    # 5. 중앙 불의 제단 (성화대)
    # 사암 제단 받침
    P.box(-0.65, 0.65, -0.65, 0.65, zp, zp + 0.65, 'sandstone', bevel=0.03)
    P.box(-0.8, 0.8, -0.8, 0.8, zp + 0.65, zp + 0.85, 'sandstone', bevel=0.02)
    # 타오르는 숯/불꽃 (coals 머티리얼)
    P.box(-0.6, 0.6, -0.6, 0.6, zp + 0.85, zp + 0.95, 'coals')
    # 청동 성화 그릇
    P.cyl(0.7, 0.65, 0.2, 'palette', n=12, matrix=Tm(0, 0, zp + 0.85))

    return P


def well_mb():
    """오아시스 우물: 둥근 흙벽 난간, 기둥과 도르래, 물통과 가죽 두레박."""
    P = Piece('well_mb', 3107)
    zp = 0.25

    # 1. 방사형 사암 바닥 단
    P.cyl(2.2, 2.1, zp + 0.1, 'sandstone', n=16, matrix=Tm(0, 0, -0.1))

    # 2. 우물 난간벽 (원형 파라펫)
    r_out, r_in, h_w = 1.25, 0.95, 0.85
    # 바깥 원통
    P.cyl(r_out, r_out, h_w, 'adobe_brick', n=16, matrix=Tm(0, 0, zp))
    # 내부 물 (water)
    P.cyl(r_in, r_in, 0.1, 'water', n=16, matrix=Tm(0, 0, zp + 0.2))

    # 3. 우물 기둥 둘 + 목재 가로보
    col_h = 2.2
    P.box(-1.15, -0.95, -0.12, 0.12, zp, zp + col_h, 'timber_dark')
    P.box(0.95, 1.15, -0.12, 0.12, zp, zp + col_h, 'timber_dark')
    P.beam((-1.25, 0, zp + col_h - 0.08), (1.25, 0, zp + col_h - 0.08), 0.16, 0.16, 'timber_dark')

    # 4. 도르래와 밧줄, 가죽 두레박
    P.cyl(0.12, 0.12, 0.08, 'timber_dark', n=8, matrix=Tm(0, 0, zp + col_h - 0.3) @ Rx(90))
    P.cyl(0.015, 0.015, 1.2, 'palette', n=4, matrix=Tm(0, 0, zp + 0.7))

    # 5. 옆에 놓인 가축용 사암 물통 (trough)
    P.box(1.5, 2.5, -0.5, 0.5, zp, zp + 0.45, 'sandstone', bevel=0.02)
    P.box(1.58, 2.42, -0.42, 0.42, zp + 0.35, zp + 0.42, 'water')

    return P


def market_arcade():
    """바자르 아케이드: 3연속 아치 회랑, 줄무늬 차양 천막, 좌판 평상과 양탄자."""
    P = Piece('market_arcade', 3108)
    L, D, H = 7.6, 4.2, 3.6
    x0, x1 = -L * 0.5, L * 0.5
    y0, y1 = -D * 0.5, D * 0.5
    zp = 0.25
    z_top = zp + H

    # 1. 기단 및 바닥
    P.box(x0 - 0.2, x1 + 0.2, y0 - 0.2, y1 + 0.2, -0.2, zp, 'adobe_brick', bevel=0.03)

    # 2. 뒷벽 (북쪽 y1)
    P.box(x0, x1, y1 - 0.4, y1, zp, z_top, 'adobe', bevel=0.04)
    # 양 옆벽
    P.box(x0, x0 + 0.4, y0, y1, zp, z_top, 'adobe', bevel=0.04)
    P.box(x1 - 0.4, x1, y0, y1, zp, z_top, 'adobe', bevel=0.04)
    # 지붕 슬래브
    P.box(x0, x1, y0, y1, z_top - 0.3, z_top, 'adobe', bevel=0.03)
    MB.make_parapet(P, x0, x1, y0, y1, z_top, h=0.45, t=0.22, mat='adobe', drain_spout=False)

    # 3. 정면 3연속 아치 기둥들
    posts = np.linspace(x0 + 0.2, x1 - 0.2, 4)
    for px in posts:
        P.box(px - 0.22, px + 0.22, y0 - 0.05, y0 + 0.35, zp, z_top - 0.6, 'sandstone', bevel=0.02)
    # 아치 연결부 인방
    P.box(x0, x1, y0 - 0.05, y0 + 0.35, z_top - 0.6, z_top - 0.15, 'sandstone', bevel=0.03)

    # 4. 아치 앞 돌출 줄무늬 차양 천막 (canvas)
    P.box(x0 - 0.15, x1 + 0.15, y0 - 1.2, y0 + 0.1, z_top - 0.85, z_top - 0.75, 'canvas', tile=2.0)
    # 차양 지지 목재 기둥
    for px in (x0 + 0.3, x1 - 0.3):
        P.cyl(0.04, 0.035, z_top - 0.85 - zp, 'timber_dark', n=6, matrix=Tm(px, y0 - 1.15, zp))

    # 5. 회랑 안쪽 좌판 평상들 (상인들이 앉아 장사하는 곳)
    P.box(x0 + 0.6, x1 - 0.6, y0 + 0.7, y1 - 0.6, zp, zp + 0.55, 'adobe_brick', bevel=0.02)
    # 평상 위 양탄자 (palette carpet_red)
    P.box(x0 + 0.8, x1 - 0.8, y0 + 0.75, y1 - 0.65, zp + 0.55, zp + 0.58, 'palette')

    return P


def granary_mb():
    """곡식 저장고: 3기의 벌집형 진흙 사일로 돔 군집."""
    P = Piece('granary_mb', 3109)
    zp = 0.25

    # 1. 흙벽돌 바닥 단
    P.box(-2.4, 2.4, -2.4, 2.4, -0.2, zp, 'adobe_brick', bevel=0.05, tile=2.0)

    # 2. 3개의 벌집형 사일로 (삼각형 배치)
    centers = [(-1.1, -0.7), (1.1, -0.7), (0.0, 1.1)]
    silo_r = 1.05
    silo_h = 2.8

    for cx, cy in centers:
        # 하부 원통
        P.cyl(silo_r, silo_r * 0.95, silo_h * 0.6, 'adobe', n=14, matrix=Tm(cx, cy, zp))
        # 상부 원뿔/돔 뚜껑
        dome = make_dome_bm(r=silo_r * 0.95, h=silo_h * 0.4, n_lat=6, n_lon=14, pointed=0.35)
        dome.transform(Tm(cx, cy, zp + silo_h * 0.6))
        uvl = dome.loops.layers.uv.verify()
        P._merge(dome, 'adobe', smooth=True, uvl_src=uvl)
        dome.free()
        # 곡물 배출구 목재 마개
        P.box(cx - 0.18, cx + 0.18, cy - silo_r - 0.05, cy - silo_r + 0.1, zp + 0.2, zp + 0.55, 'timber_dark')

    return P


def smithy_mb():
    """흙벽돌 대장간: 잉글랜드/남아시아 규격 준수 (모루 위치 (0.55, 0.6)), 화덕 및 연기 노드."""
    P = Piece('smithy_mb', 3110)
    L, D, H = 7.2, 6.8, 3.4
    x0, x1 = -L * 0.5, L * 0.5
    y0, y1 = -D * 0.5, D * 0.5
    zp = 0.25
    z_top = zp + H

    # 1. 기단 및 바닥
    P.box(x0 - 0.2, x1 + 0.2, y0 - 0.2, y1 + 0.2, -0.2, zp, 'adobe_brick', bevel=0.03)

    # 2. 벽체 (작업 공간을 위해 정면 y0 은 반쯤 트인 구조)
    # 뒷벽과 좌측벽
    P.box(x0, x1, y1 - 0.4, y1, zp, z_top, 'adobe', bevel=0.04)
    P.box(x0, x0 + 0.4, y0, y1, zp, z_top, 'adobe', bevel=0.04)
    P.box(x1 - 0.4, x1, y0, y1, zp, z_top, 'adobe', bevel=0.04)
    # 지붕
    P.box(x0, x1, y0, y1, z_top - 0.3, z_top, 'adobe', bevel=0.03)
    MB.make_parapet(P, x0, x1, y0, y1, z_top, h=0.5, t=0.25, mat='adobe')
    # 정면 트인 기둥 2개
    for px in (x0 + 0.2, x1 - 0.2):
        P.box(px - 0.2, px + 0.2, y0, y0 + 0.4, zp, z_top - 0.3, 'sandstone')

    # 3. 흙벽돌 대장간 화덕 (Forge)
    # 위치: 우측 뒷모퉁이 부근
    fx0, fx1 = 1.2, 2.5
    fy0, fy1 = 0.6, 1.8
    P.box(fx0, fx1, fy0, fy1, zp, zp + 0.9, 'adobe_brick', bevel=0.03)
    # 불타는 숯/화덕 (coals)
    P.box(fx0 + 0.25, fx1 - 0.25, fy0 + 0.25, fy1 - 0.25, zp + 0.85, zp + 0.95, 'coals')
    # 화덕 연통/굴뚝 (옥상 위로 관통)
    P.box(fx0 + 0.1, fx1 - 0.1, fy0 + 0.1, fy1 - 0.1, zp + 0.9, z_top + 0.8, 'adobe')

    # 4. smithy 약속 노드들
    # 모루 위치는 로컬 (0.55, 0.6) - 사람은 이 앞에 선다
    # smithy_forge 노드
    P.marker('smithy_forge', ((fx0 + fx1) * 0.5, (fy0 + fy1) * 0.5, zp + 0.95))
    # smithy_mb_smoke 노드 (굴뚝 꼭대기)
    P.marker('smithy_mb_smoke', ((fx0 + fx1) * 0.5, (fy0 + fy1) * 0.5, z_top + 0.9))

    return P


def gate_mb():
    """마을 입구 관문: 흙벽돌 아치 게이트와 상부 흉벽."""
    P = Piece('gate_mb', 3111)
    L, D, H = 5.2, 2.6, 4.4
    x0, x1 = -L * 0.5, L * 0.5
    y0, y1 = -D * 0.5, D * 0.5
    zp = 0.25
    z_top = zp + H

    # 1. 좌우 관문 타워 기둥
    gw = 2.4  # 통로 너비
    # 서쪽 타워
    P.box(x0, -gw * 0.5, y0, y1, zp, z_top, 'adobe_brick', bevel=0.04)
    # 동쪽 타워
    P.box(gw * 0.5, x1, y0, y1, zp, z_top, 'adobe_brick', bevel=0.04)

    # 2. 아치 상부 연결벽 (성벽 인방)
    P.box(-gw * 0.5, gw * 0.5, y0, y1, z_top - 1.2, z_top, 'adobe_brick', bevel=0.03)

    # 3. 관문 상부 흉벽 파라펫 (톱니 총안)
    MB.make_parapet(P, x0, x1, y0, y1, z_top, h=0.65, t=0.25, mat='adobe', drain_spout=False)
    # 톱니 총안 조각들
    for bx in np.linspace(x0 + 0.2, x1 - 0.6, 5):
        P.box(bx, bx + 0.4, y0 - 0.05, y0 + 0.25, z_top + 0.65, z_top + 0.95, 'adobe_brick')
        P.box(bx, bx + 0.4, y1 - 0.25, y1 + 0.05, z_top + 0.65, z_top + 0.95, 'adobe_brick')

    return P


def palace_mb():
    """흙벽돌 궁정 저택 (카스바 Kasbah): 4 모퉁이 망루 타워, 다층 테라스, 대형 아치 포털."""
    P = Piece('palace_mb', 3112)
    L, D, H = 15.6, 14.4, 5.5
    x0, x1 = -L * 0.5, L * 0.5
    y0, y1 = -D * 0.5, D * 0.5
    zp = 0.3
    z_top = zp + H

    # 1. 웅장한 기단
    P.box(x0 - 0.3, x1 + 0.3, y0 - 0.3, y1 + 0.3, -0.3, zp, 'adobe_brick', bevel=0.05, tile=2.5)

    # 2. 중앙 본체 가옥
    P.box(x0 + 1.2, x1 - 1.2, y0 + 1.2, y1 - 1.2, zp, z_top, 'adobe', bevel=0.05, tile=2.5)
    MB.add_vigas(P, P.bm, x0 + 1.2, x1 - 1.2, y0 + 1.2, y1 - 1.2, z_top - 0.28, count=14, axis='Y', r=0.08, ext=0.3)
    MB.make_parapet(P, x0 + 1.2, x1 - 1.2, y0 + 1.2, y1 - 1.2, z_top, h=0.6, t=0.28, mat='adobe')

    # 3. 4 모퉁이 사각 망루 타워 (높이 7.4m)
    tw = 3.2
    th = 7.4
    t_coords = [
        (x0, x0 + tw, y0, y0 + tw),
        (x1 - tw, x1, y0, y0 + tw),
        (x0, x0 + tw, y1 - tw, y1),
        (x1 - tw, x1, y1 - tw, y1),
    ]
    for tx0, tx1, ty0, ty1 in t_coords:
        P.box(tx0, tx1, ty0, ty1, zp, zp + th, 'adobe_brick', bevel=0.04, tile=2.0)
        MB.add_vigas(P, P.bm, tx0, tx1, ty0, ty1, zp + th - 0.3, count=3, axis='Y', r=0.075, ext=0.25)
        MB.make_parapet(P, tx0, tx1, ty0, ty1, zp + th, h=0.7, t=0.25, mat='adobe_brick')

    # 4. 정면 웅장한 아치 포털
    pw = 3.0
    P.box(-pw * 0.5, pw * 0.5, y0 + 0.8, y0 + 1.3, zp, zp + 3.8, 'sandstone', bevel=0.05, tile=1.8)
    P.box(-1.1, 1.1, y0 + 1.15, y0 + 1.28, zp, zp + 3.2, 'planks', bevel=0.03)
    P.box(-1.0, 1.0, y0 + 1.28, y0 + 1.45, zp, zp + 3.0, 'glass')

    P.marker('palace_mb_smoke', (x1 - 2.5, y1 - 2.5, z_top + 0.8))
    return P


# ───────────────────────── 빌드 파이프라인 ─────────────────────────

BUILDERS = [
    house_flat_a,
    house_flat_b,
    house_courtyard_mb,
    tower_wind,
    mosque_small,
    shrine_mb,
    well_mb,
    market_arcade,
    granary_mb,
    smithy_mb,
    gate_mb,
    palace_mb,
]

CENTER = {
    'smithy_mb': (0.55, 0.6),     # 모루 기준 약속
}

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
        dims[root.name] = S.recenter(root, P.foot, CENTER.get(root.name))
        roots.append(root)
        tris_count = sum(K.tri_count(o) for o in K.mesh_objects([root]))
        log('%-18s %6d 삼각형  %.1fs  %s' % (root.name, tris_count, time.time() - ts,
                                            'x'.join('%.2f' % d for d in dims[root.name])))

    # AO 굽기: 조각들을 60m 씩 띄워 서로 그림자를 주지 않게 함
    for i, r in enumerate(roots):
        r.location = (i * 60.0, 0, 0)
    objs = K.mesh_objects(roots)
    K.make_ao_uvs(objs)
    # 사막 빛은 부드럽고 넓게 퍼지므로 samples=128 (FAST 시 적게)
    samples = 32 if K.FAST else 128
    img = K.bake_ao(objs, size=2048, samples=samples, distance=1.4)
    mats = [K.MATS[n] for n in K.MATS]
    K.wire_ao(mats, img)

    # 원점으로 복귀
    for r in roots:
        r.location = (0, 0, 0)

    out = os.path.join(K.KITS, NAME + '.glb') if not only else os.path.join(K.BUILD, NAME + '_partial.glb')
    tris = {r.name: sum(K.tri_count(o) for o in K.mesh_objects([r])) for r in roots}
    info = K.export_glb(roots, out) if not only or os.environ.get('KIT_EXPORT') == '1' else {}

    if not only:
        dims_path = os.path.join(K.KITS, NAME + '.dims.json')
        with open(dims_path, 'w', encoding='utf-8', newline='\n') as f:
            json.dump({'source': 'tools/blender/kit_mudbrick.py', 'units': 'm, [x 길이, 앞뒤 깊이, 높이]',
                       'pieces': {k: [round(v, 2) for v in dims[k]] for k in sorted(dims)}}, f, indent=2, ensure_ascii=False)
        log('치수표 저장 완료: %s' % dims_path)

    log('=== 흙벽돌 세트 빌드 완료: 총 %d개 조각 (%.1fs) ===' % (len(roots), time.time() - t0))


if __name__ == '__main__':
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)

