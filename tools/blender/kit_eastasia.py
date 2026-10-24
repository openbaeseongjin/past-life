# 동아시아 건물 세트 (시대 일반형 마을) — Blender 4.2 명령줄 스크립트. kit_common.py · kit_sa_common.py · kit_ea_common.py 를 함께 쓴다.
#   KIT_VARIANT=china|korea|japan GLTFT=<gltf-transform 폴더> "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe" --background --python tools/blender/kit_eastasia.py
# 결과 (땅 변형마다 같은 조각 이름의 glb 하나):
#   china → docs/past-life/assets/real/kits/eastasia.glb       · eastasia.dims.json       · kits/preview/eastasia_china_*.png
#   korea → kits/eastasia_korea.glb · eastasia_korea.dims.json · kits/preview/eastasia_korea_*.png
#   japan → kits/eastasia_japan.glb · eastasia_japan.dims.json · kits/preview/eastasia_japan_*.png
# 조각 (특정 실존 건물을 본뜨지 않은 시대 일반형):
#   house_thatch_ea 서민 초가 — 중국: 판축 흙벽 + 맞배 초가 · 한국: 초가삼간(둥근 초가 + 새끼 그물, 흙벽·띠살문·툇마루·굴뚝) · 일본: 민가(가파른 팔작 초가, 판벽·엔가와·쇼지)
#   house_tile_ea   기와집 — 중국: 청벽돌 박공벽 + 맞배 기와(경산) · 한국: 팔작 기와(처마 곡선·양성바름, 대청·띠살문) · 일본: 팔작 기와(흰 회벽·엔가와)
#   house_town_ea   가게 딸린 집 — 중국: 두 층 가게(판문·계산대·간판) · 한국: 시전 행랑(들어열개 판문) · 일본: 마치야(격자·노렌·무시코창)
#   temple_ea       목조 법당 — 돌 기단·계단, 두리기둥·공포, 팔작 기와, 살문, 편액, 앞에 석등(한국)·향로(중국)·석등 한 쌍(일본)
#   pagoda_small    탑 — 중국: 다섯 층 벽돌탑 · 한국: 삼층 석탑(한국은 목탑보다 석탑이 일반형) · 일본: 삼층 목탑
#   gate_ea         대문 — 중국: 벽돌 문루 · 한국: 평대문 · 일본: 지붕 얹은 나무 문
#   well_ea         우물 — 중국: 네모 돌 우물 + 도르래 감개 · 한국: 둥근 돌 우물 + 두레박 틀 · 일본: 나무 井桁 + 도르래 지붕
#   granary_ea      곳간 — 중국: 둥근 곡식 뒤주(흙 바른 통 + 원뿔 초가) · 한국: 다락 곳간(기둥 위) · 일본: 기둥 위 창고(쥐막이 판)
#   smithy_ea       대장간 — 앞이 트인 헛간, 흙 화덕(숯불 coals + smithy_forge), 상자 풀무, 모루 (잉글랜드 smithy 와 같은 자리 약속)
#   shrine_ea       마을 신당 — 중국: 토지묘 · 한국: 서낭당(돌무더기·솟대·오방색 천) · 일본: 작은 사당 + 도리이. 나무는 장면이 'shrine_ea_trunk' 자리에 세운다
#   stall_ea        장터 좌판 — 기둥 넷 + 거적 차양(앞 처마 2.3 m), 평상 위 바구니·옹기·피륙
#   pit_house_ea    움집 — 둥근 원뿔 초가가 땅까지, 앞 맞배 들머리 (신석기·청동기, 농사 전 야영)
#   camp_hearth     야영 화덕 — 돌 둘레 불자리(숯불 + smithy_forge), 건조대, 일하는 돌 (농사 전 생의 '대장간' 자리)
# 좌표: 조각마다 바닥 가운데가 원점, 미터, 앞면 = glTF +Z (Blender -Y), 긴 축 = X. 연기 = '<조각>_smoke' 빈 노드.
# 재료 이름 약속: 'glass' = 문·창 안 어둠 (장면이 밤에 불빛), 'paper' = 창호지·쇼지 (장면이 밤에 은은히 밝힌다), 'coals' = 화덕.
# 환경변수: KIT_VARIANT (기본 china), KIT_FAST=1, KIT_ONLY=house_tile_ea,temple_ea, KIT_NOPREVIEW=1, KIT_EXPORT=1, KIT_VIGNETTE=0
import os, sys, math, time, json
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
from mathutils import Vector, Matrix
import kit_common as K
from kit_common import Piece, box_vf, temp_obj, fbm, smin, smax, log
import kit_england as KE
import kit_props as KP
import kit_sa_common as S
from kit_sa_common import Face, prism_ok, ring_ok, frustum_ok, wall_ok, add_vf, thatch_hf, lin, Tm, Rz, Ry, Rx
import kit_ea_common as E
from kit_ea_common import Roof, roof_ea, ridge_ea, hip_ridges, eave_caps, rafters, post, plinth, lattice, pal_add, pal_box, crock
from kit_props import lathe_bm, loft_bm, tube_bm, ellipsoid_bm

rad = math.radians
TP = lambda d: math.tan(rad(d))
VARIANT = os.environ.get('KIT_VARIANT', 'china')
if VARIANT not in ('china', 'korea', 'japan'):
    raise SystemExit('KIT_VARIANT 는 china · korea · japan 가운데 하나')
NAME = {'china': 'eastasia', 'korea': 'eastasia_korea', 'japan': 'eastasia_japan'}[VARIANT]
CN, KR, JP = VARIANT == 'china', VARIANT == 'korea', VARIANT == 'japan'
TILE = {'rammed': 2.2, 'earth': 2.0, 'plaster': 2.2, 'lime': 1.6, 'brick_grey': 1.4, 'stone': 1.8, 'rubble': 1.8, 'granite': 2.0, 'timber': 1.2,
        'timber_red': 1.2, 'planks': 1.6, 'boards': 1.6, 'floor': 1.4, 'ridge': 0.9, 'thatch': 2.0}

# 땅 변형 표: 기와 색·지붕 곡선·처마 귀 들림·나무 색·초가 색·마루 꼴
V = {
    'china': dict(tile=(0.31, 0.32, 0.34), curve=0.28, lift=0.22, ridge='china', timber=((0.62, 0.42, 0.3), 0.62), red=(0.62, 0.2, 0.13),
                  thatch=((1.0, 0.9, 0.68), 0.88, 0.7)),
    'korea': dict(tile=(0.27, 0.275, 0.29), curve=0.36, lift=0.42, ridge='korea', timber=((0.86, 0.72, 0.56), 0.78), red=(0.58, 0.18, 0.12),
                  thatch=((1.0, 0.86, 0.6), 0.84, 0.62)),
    'japan': dict(tile=(0.35, 0.36, 0.38), curve=0.2, lift=0.07, ridge='japan', timber=((0.56, 0.42, 0.32), 0.55), red=(0.7, 0.22, 0.1),
                  thatch=((0.84, 0.78, 0.66), 0.66, 0.42)),
}[VARIANT]


# ───────────────────────── 재료 ─────────────────────────
def setup_materials():
    T, X = K.prep_texture, lambda f: os.path.join(K.TEX, f)
    mk = K.make_material
    tcol, tgain = V['timber']
    mk('timber', T('ea_timber_d_' + VARIANT, 'rough_wood_diff_1k.jpg', tint=tcol, gain=tgain, sat=0.7, contrast=1.05), X('rough_wood_nor_gl_1k.jpg'), rough=0.85, nstr=0.9)
    mk('timber_red', T('ea_timber_red_' + VARIANT, 'rough_wood_diff_1k.jpg', tint=V['red'], gain=1.25, sat=0.35, contrast=0.6), X('rough_wood_nor_gl_1k.jpg'),
       rough=0.6, nstr=0.4)
    mk('planks', T('ea_planks_d', 'old_planks_02_diff_1k.jpg', tint=(0.86, 0.76, 0.64), gain=0.82), X('old_planks_02_nor_gl_1k.jpg'), rough=0.85, nstr=1.0)
    mk('boards', T('ea_boards_d', 'weathered_plank_siding_diff_1k.jpg', tint=(0.92, 0.84, 0.76), gain=0.95, sat=0.6), X('weathered_plank_siding_nor_gl_1k.jpg'),
       rough=0.86, nstr=1.0)
    mk('floor', T('ea_floor_d', 'hinoki_planks_diff_1k.jpg', tint=(0.9, 0.84, 0.74), gain=0.95, sat=0.55), X('hinoki_planks_nor_gl_1k.jpg'), rough=0.7, nstr=0.8)
    mk('plaster', T('ea_plaster_d', 'white_rough_plaster_diff_1k.jpg', tint=(1.0, 0.98, 0.94), gain=1.04, contrast=0.22, sat=0.2),
       X('white_rough_plaster_nor_gl_1k.jpg'), rough=0.95, nstr=0.6)
    mk('wall_red', T('ea_wall_red_d', 'white_rough_plaster_diff_1k.jpg', tint=(0.66, 0.24, 0.16), gain=1.0, contrast=0.3, sat=0.2),
       X('white_rough_plaster_nor_gl_1k.jpg'), rough=0.92, nstr=0.5)
    mk('lime', T('ea_lime_d', 'white_rough_plaster_diff_1k.jpg', tint=(1.0, 1.0, 0.97), gain=1.06, contrast=0.35, sat=0.2), X('white_rough_plaster_nor_gl_1k.jpg'),
       rough=0.9, nstr=0.5)
    mk('earth', T('ea_earth_d', 'clay_plaster_diff_1k.jpg', tint=(1.0, 0.9, 0.72), gain=1.32, sat=0.55, contrast=0.8), X('clay_plaster_nor_gl_1k.jpg'),
       rough=0.96, nstr=1.0)
    mk('rammed', T('ea_rammed_d', 'clay_block_wall_diff_1k.jpg', tint=(1.02, 0.94, 0.78), gain=1.12, sat=0.5, contrast=0.8), X('clay_block_wall_nor_gl_1k.jpg'),
       rough=0.97, nstr=0.9)
    mk('brick_grey', T('ea_brick_grey_d', 'brick_wall_11_diff_1k.jpg', tint=(0.86, 0.9, 0.96), gain=1.25, sat=0.06, contrast=1.1),
       X('brick_wall_11_nor_gl_1k.jpg'), rough=0.9, nstr=1.0)
    mk('stone', T('ea_stone_d', 'japanese_stone_wall_diff_1k.jpg', tint=(1.0, 0.98, 0.94), gain=1.05, sat=0.4), X('japanese_stone_wall_nor_gl_1k.jpg'),
       rough=0.9, nstr=1.0)
    mk('rubble', T('ea_rubble_d', 'broken_wall_diff_1k.jpg', tint=(1.0, 0.97, 0.9), gain=1.0, sat=0.5), X('broken_wall_nor_gl_1k.jpg'), rough=0.95, nstr=1.2)
    mk('granite', T('ea_granite_d', 'white_rough_plaster_diff_1k.jpg', tint=(0.76, 0.75, 0.72), gain=0.95, contrast=0.75, sat=0.1),
       X('white_rough_plaster_nor_gl_1k.jpg'), rough=0.88, nstr=0.8)
    td, tn = E.gen_tile_tex('ea_tile_' + VARIANT, base=V['tile'])
    mk('tile', td, tn, rough=0.62, nstr=1.0)
    mk('ridge', T('ea_ridge_d_' + VARIANT, 'grey_roof_tiles_diff_1k.jpg', tint=tuple(c * 0.85 for c in V['tile']), gain=2.4, sat=0.0, contrast=0.5),
       X('grey_roof_tiles_nor_gl_1k.jpg'), rough=0.7, nstr=0.6)
    th, tg, ts = V['thatch']
    mk('thatch', T('ea_thatch_d_' + VARIANT, 'reed_roof_04_diff_1k.jpg', tint=th, gain=tg, sat=ts, tile_v=(0.075, 0.12)),
       T('ea_thatch_n', 'reed_roof_04_nor_gl_1k.jpg', tile_v=(0.075, 0.12), normal=True), rough=0.97, nstr=1.4)
    mk('paper', color=(0.86, 0.83, 0.74), rough=0.9, emit=(1.0, 0.72, 0.4), emit_strength=0.0)
    mk('glass', color=(0.025, 0.02, 0.016), rough=0.6, emit=(1.0, 0.55, 0.22), emit_strength=0.0)
    mk('shade', color=(0.07, 0.06, 0.05), rough=0.92)
    mk('coals', color=(0.04, 0.02, 0.01), rough=1.0, emit=(1.0, 0.36, 0.08), emit_strength=6.0)
    mk('iron', color=(0.05, 0.048, 0.045), rough=0.55, metal=0.7)
    mk('water', color=(0.02, 0.03, 0.03), rough=0.08)
    E.palette_material()


def F_(P, side, plane):
    return Face(P, side, plane, TILE)


def smoke(P, name, co):
    P.marker(name + '_smoke', co)


# ───────────────────────── 작은 꾸밈 ─────────────────────────
def chimney_kr(P, x, y, h=1.5):
    """한국 굴뚝: 막돌을 흙으로 쌓은 낮은 굴뚝 (집 옆·뒤 따로) + 위에 엎은 옹기."""
    P.add_bm(K.bm_from(*frustum_ok(x, y, 0.62, 0.62, -0.2, 0.44, 0.44, h)), 'rubble', tile=1.2, bevel=0.03)
    crock(P, Tm(x, y, h - 0.02), 0.62, 'onggi_dark', lid=False)


def pepper_string(P, x, y, z, n=9, color='pepper_red'):
    """처마에 매단 고추·곶감 줄."""
    pal_add(P, tube_bm([(x, y, z), (x, y, z - n * 0.075)], 0.006, n=3), 'rope')
    for k in range(n):
        zz = z - 0.05 - k * 0.075
        a = k * 1.9
        pal_add(P, ellipsoid_bm((x + 0.02 * math.cos(a), y + 0.02 * math.sin(a), zz), (0.022, 0.022, 0.05) if color == 'pepper_red' else (0.035, 0.035, 0.03),
                                nu=6, nv=3), color)


def lantern(P, x, y, z, color='cloth_red', s=1.0):
    """처마 등롱 (중국): 둥근 종이·천 등 + 위아래 검은 테."""
    pal_add(P, tube_bm([(x, y, z + 0.38 * s), (x, y, z + 0.2 * s)], 0.006, n=3), 'black')
    pal_add(P, ellipsoid_bm((x, y, z), (0.2 * s, 0.2 * s, 0.22 * s), nu=12, nv=7), color)
    for zz in (0.2, -0.2):
        pal_add(P, lathe_bm([(0.08 * s, z + zz * s - 0.02), (0.085 * s, z + zz * s + 0.02)], n=10, cap0=True, cap1=True), 'black')
    pal_add(P, tube_bm([(x, y, z - 0.24 * s), (x, y, z - 0.4 * s)], 0.01, n=3), 'ribbon_yellow')


def strawrope_net(P, R, step_x=0.6, step_y=0.62, r=0.018, part='all'):
    """한국 초가 새끼 그물: 경사 따라 내려가는 줄 + 가로줄 (지붕 윗면을 따라)."""
    lift = 0.012
    xs = []
    x = -R.xe + 0.3
    while x < R.xe - 0.25:
        xs.append(x)
        x += step_x
    for x in xs:                      # 앞·뒤 경사 따라 (용마루 → 처마)
        for sy in (-1, 1):
            pts = []
            n = 10
            for k in range(n + 1):
                y = R.cy + sy * (R.ye - 0.05) * k / n
                z = R.fz(x, y, part)
                if z < R.H - 0.2:
                    break
                pts.append((x, y, z + lift))
            if len(pts) > 2 and R.fz(x, R.cy, part) - R.fz(x, R.cy + sy * 0.5, part) < 1.5:
                pal_add(P, tube_bm(pts, r, n=3, ref=(1, 0, 0), cap0=False, cap1=False), 'rope', smooth=True)
    ys = []
    y = step_y * 0.6
    while y < R.ye - 0.2:
        ys.append(y)
        y += step_y
    for d in ys:                      # 가로줄 (긴 경사)
        for sy in (-1, 1):
            yy = R.cy + sy * d
            pts = []
            n = 30
            for k in range(n + 1):
                x = -R.xe + 0.15 + (2 * R.xe - 0.3) * k / n
                pts.append((x, yy, R.fz(x, yy, part) + lift))
            pal_add(P, tube_bm(pts, r, n=3, ref=(0, 0, 1), cap0=False, cap1=False), 'rope', smooth=True)


def thatch_roof_ea(P, R, uv_pitch=None, res=0.24, noise=(0.03, 0.012), bevel=0.07, mat='thatch'):
    """초가 지붕 면: R(Roof) 높이 + 거친 결. UV = 경사 따라 (KE 초가와 같은 결)."""
    seed = P.rng.randrange(1000)

    def fz(x, y):
        return R.fz(x, y) + noise[0] * fbm(x * 0.6 + 3, y * 0.6, seed) + noise[1] * fbm(x * 2.2, y * 2.2, seed + 11)
    xs = lin(-R.xe, R.xe, max(4, int(2 * R.xe / res)))
    ys = lin(R.cy - R.ye, R.cy + R.ye, max(4, int(2 * R.ye / res)))
    off = (P.rng.random() * 5, P.rng.random() * 5)
    ob = K.heightfield(fz, xs, ys, R.t, bevel_w=bevel, bevel_seg=1, uvfn=K.slope_uv(2.0, 2.0, uv_pitch or R.pitch, off), name='thatch')
    P.add_obj(ob, mat, keep_uv=True, smooth=True)
    return fz


# ───────────────────────── 서민 초가 ─────────────────────────
def house_thatch_ea():
    P = Piece('house_thatch_ea', 3101)
    if CN:
        return _thatch_china(P)
    if KR:
        return _thatch_korea(P)
    return _thatch_japan(P)


def _thatch_china(P):
    """중국 서민 집: 판축 흙벽(두껍게) + 낮은 돌 밑단, 세 칸 앞면(가운데 두 짝 판문 + 양옆 네모 살창), 맞배 초가(처마 얕고 박공은 흙벽에 얹힘),
    흙 용마루, 박공 끝 흙 굴뚝, 문 양옆 바랜 붉은 대련."""
    L, D, H, pitch = 7.6, 4.4, 2.5, 30
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    P.box(x0 - 0.12, x1 + 0.12, y0 - 0.12, y1 + 0.12, -0.45, 0.22, 'stone', bevel=0.03, tile=1.6)
    P.box(-0.75, 0.75, y0 - 0.55, y0 - 0.12, -0.3, 0.12, 'stone', bevel=0.02, tile=1.2)
    cuts = []
    Ff, Fb, Fl, Fr = F_(P, '-y', y0), F_(P, '+y', y1), F_(P, '-x', x0), F_(P, '+x', x1)
    lattice(Ff, cuts, 0.0, 1.0, 1.95, 0.22, 0.4, pattern='plank', frame='timber', leaves=2)
    for sx in (-1, 1):
        lattice(Ff, cuts, sx * 2.25, 0.85, 0.75, 1.1, 0.4, pattern='grid', frame='timber', bar='timber', leaves=1)
    lattice(Fb, cuts, Fb.loc(-1.6), 0.6, 0.55, 1.35, 0.4, pattern='bars', frame='timber', leaves=1)
    wall_ok(P, [box_vf(x0, x1, y0, y1, 0.18, H)], 'rammed', cuts, tile=2.2, bevel=0.06)
    R = Roof(L, D, H, pitch, 0.3, 'gable', oE=0.55, oG=0.28, curve=0.04, lift=0.0, seed=3)
    for (a, b) in ((x0, x0 + 0.42), (x1 - 0.42, x1)):          # 박공 흙벽 (지붕 밑까지)
        prof = [(y0, H - 0.05)] + [(y, R.z_long(y) - R.t / math.cos(rad(pitch)) - 0.02) for y in lin(y0, y1, 12)] + [(y1, H - 0.05)]
        wall_ok(P, [prism_ok([(y0, H - 0.1)] + prof[1:-1] + [(y1, H - 0.1)], 'x', a, b)], 'rammed', [], tile=2.2, bevel=0.05)
    thatch_roof_ea(P, R)
    zr = R.z_long(0.0)
    P.add_bm(loft_bm([((x, 0, zr + 0.05), 0.24, 0.13) for x in lin(-R.xe + 0.05, R.xe - 0.05, 8)], n=8, expo=2.2, ref=(0, 0, 1)), 'rammed', tile=(1.2, 1.2),
             smooth=True)
    # 박공 끝 흙 굴뚝 (구들 굴뚝)
    cx, cy = x1 - 0.25, 0.9
    P.add_bm(K.bm_from(*frustum_ok(cx, cy, 0.62, 0.62, H - 0.4, 0.5, 0.5, zr + 0.75)), 'rammed', tile=1.2, bevel=0.03)
    P.box(cx - 0.32, cx + 0.32, cy - 0.32, cy + 0.32, zr + 0.75, zr + 0.85, 'stone', tile=0.8, bevel=0.02)
    smoke(P, 'house_thatch_ea', (cx, cy, zr + 1.0))
    # 대련 (바랜 붉은 종이) — 문 양옆·위
    for sx in (-1, 1):
        pal_box(P, sx * 0.72 - 0.1, sx * 0.72 + 0.1, y0 - 0.015, y0 - 0.002, 0.55, 2.0, 'cinnabar')
    pal_box(P, -0.55, 0.55, y0 - 0.015, y0 - 0.002, 2.24, 2.42, 'cinnabar')
    # 처마 밑 마른 고추 줄 둘 + 문 옆 물독
    pepper_string(P, -1.5, y0 - 0.3, H + 0.05)
    pepper_string(P, -1.32, y0 - 0.3, H + 0.02, n=7)
    crock(P, Tm(1.35, y0 - 0.45, 0.22), 1.25, 'onggi')
    return P


def _thatch_korea(P):
    """한국 초가삼간: 막돌 기단 + 주춧돌·각기둥, 흙벽(누런 흙) 사이 중방, 방 둘 띠살문 + 부엌 판문, 방 앞 툇마루,
    둥근 우진각 초가 (볼록한 꼴, 새끼 그물, 용마름), 뒤 옆 낮은 굴뚝, 처마 밑 고추 줄."""
    L, D, H, pitch = 7.4, 4.0, 2.15, 24
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    zb = 0.4                                         # 기단 윗면 (마당 위)
    plinth(P, x0 - 0.55, x1 + 0.55, y0 - 1.0, y1 + 0.45, -0.45, zb, mat='rubble')
    P.box(-0.5, 0.5, y0 - 1.35, y0 - 1.0, -0.3, zb * 0.5, 'stone', bevel=0.03, tile=1.2)         # 섬돌
    bays = [x0, x0 + 2.5, x0 + 4.9, x1]                # 안방 · 대청(부엌 쪽) · 건넌방 — 왼쪽 칸이 부엌
    zf = zb + 0.42                                     # 방 바닥 (툇마루 높이)
    cuts = []
    Ff, Fb, Fl, Fr = F_(P, '-y', y0), F_(P, '+y', y1), F_(P, '-x', x0), F_(P, '+x', x1)
    # 부엌 (왼쪽 칸): 판문, 위 살창
    lattice(Ff, cuts, (bays[0] + bays[1]) / 2 - 0.3, 0.95, 1.62, zb, 0.4, pattern='plank', frame='timber', leaves=2)
    lattice(Ff, cuts, (bays[0] + bays[1]) / 2 + 0.75, 0.45, 0.4, zb + 1.2, 0.4, pattern='bars', frame='timber', leaves=1)
    # 방 둘: 띠살문 두 짝 (툇마루 위)
    for (a, b) in ((bays[1], bays[2]), (bays[2], bays[3])):
        c = (a + b) / 2
        lattice(Ff, cuts, c, 1.15, 1.32, zf + 0.12, 0.4, pattern='ttisal', frame='timber', bar='timber', leaves=2)
    lattice(Fb, cuts, Fb.loc(1.2), 0.55, 0.5, zf + 0.7, 0.4, pattern='ttisal', leaves=1)
    lattice(Fr, cuts, 0.2, 0.55, 0.5, zf + 0.7, 0.4, pattern='ttisal', leaves=1)
    wall_ok(P, [box_vf(x0, x1, y0, y1, zb - 0.02, H)], 'earth', cuts, tile=2.0, bevel=0.035)
    # 기둥 (각기둥, 주춧돌) + 중방·인방 (벽에 드러난 나무)
    for x in bays:
        for y in (y0, y1):
            post(P, x, y, zb, H + 0.12, r=0.095, mat='timber', round_=False, base='stone', base_h=0.12)
    for y in (y0 - 0.005, y1 + 0.005):
        for z in (zf + 0.02, H - 0.1):
            P.box(x0, x1, y - 0.055, y + 0.055, z - 0.06, z + 0.06, 'timber', tile=(1.6, 0.8), bevel=0.01, grain='x')
    # 툇마루 (방 둘 앞)
    P.box(bays[1], x1 + 0.05, y0 - 0.78, y0, zf - 0.08, zf, 'floor', tile=1.4, bevel=0.01)
    for x in (bays[1] + 0.1, (bays[1] + x1) / 2, x1 - 0.05):
        P.box(x - 0.06, x + 0.06, y0 - 0.72, y0 - 0.6, zb, zf - 0.08, 'timber', tile=1.0)
    # 둥근 초가 (우진각, 볼록): 처마는 기둥 밖 0.75, 툇마루 위는 깊게
    R = Roof(L, D, H, pitch, 0.42, 'hip', oE=0.95, oG=0.8, curve=-0.3, lift=0.0, hip_pitch=pitch + 8, seed=5, k=0.3)
    fz = thatch_roof_ea(P, R, noise=(0.025, 0.01), bevel=0.11)
    strawrope_net(P, R, step_x=0.58, step_y=0.55)
    xr = R.L / 2 - R.half + 0.1
    P.add_bm(loft_bm([((x, 0, R.fz(x, 0) + 0.06), 0.3, 0.12) for x in lin(-xr - 0.4, xr + 0.4, 10)], n=10, expo=2.0, ref=(0, 0, 1)), 'thatch', tile=(0.9, 0.9),
             smooth=True)      # 용마름
    chimney_kr(P, x0 - 0.15, y1 + 0.95, 1.35)
    smoke(P, 'house_thatch_ea', (x0 - 0.15, y1 + 0.95, 1.85))
    pepper_string(P, 0.3, y0 - 0.6, H - 0.05)
    pepper_string(P, 0.5, y0 - 0.6, H - 0.08, n=7)
    crock(P, Tm(x0 + 0.5, y0 - 0.7, zb), 1.0, 'onggi')
    return P


def _thatch_japan(P):
    """일본 민가: 돌 기초 + 들린 마루, 아래 판벽·위 흙벽, 왼쪽 흙바닥 들머리(나무 미닫이), 오른쪽 엔가와 + 쇼지(하나 조금 엶),
    가파른 팔작 초가 (두꺼운 처마, 꼭대기 연기 빠지는 합각), 용마루 덮개 + 짧은 엇갈림 막대, 처마 밑 곶감 줄."""
    L, D, H, pitch = 8.6, 5.6, 2.35, 50
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    zf = 0.55
    P.box(x0 - 0.15, x1 + 0.15, y0 - 0.15, y1 + 0.15, -0.45, 0.16, 'stone', bevel=0.03, tile=1.6)
    P.box(x0, x1, y0, y1, 0.16, zf, 'boards', tile=1.4)                   # 마루 밑 판 (흙바닥 칸도 문지방까지)
    cuts = []
    Ff, Fb, Fl, Fr = F_(P, '-y', y0), F_(P, '+y', y1), F_(P, '-x', x0), F_(P, '+x', x1)
    xd = x0 + 1.5                                       # 흙바닥 들머리 (왼쪽)
    lattice(Ff, cuts, xd, 1.5, 1.85, 0.16, 0.4, pattern='plank', frame='timber', leaves=2)
    for k, c in enumerate((x0 + 3.9, x0 + 5.6, x0 + 7.2)):                  # 쇼지 (엔가와 뒤)
        lattice(Ff, cuts, c, 1.5, 1.72, zf, 0.4, pattern='shoji', frame='timber', bar='timber', leaves=2, open_=0.45 if k == 1 else 0.0, sill=0.05)
    lattice(Fb, cuts, Fb.loc(1.5), 1.2, 0.9, 1.15, 0.4, pattern='shoji', leaves=2)
    lattice(Fl, cuts, Fl.loc(0.6), 0.7, 0.55, 1.4, 0.4, pattern='bars', leaves=1)
    wall_ok(P, [box_vf(x0, x1, y0, y1, zf - 0.02, H)], 'earth', cuts, tile=2.0, bevel=0.03)
    # 아래 판벽 (흙벽 앞 2 cm, 문·쇼지 칸 빼고) + 기둥·도리
    for (xa, xb) in ((x0, xd - 0.82), (xd + 0.82, x0 + 3.1)):
        P.box(xa, xb, y0 - 0.025, y0, zf, 1.25, 'boards', tile=1.4)
    for (fc, side) in ((Fb, '+y'), (Fl, '-x'), (Fr, '+x')):
        Lw = L if side in ('+y', '-y') else D
        fc.box(-Lw / 2, Lw / 2, -0.025, 0.0, zf, 1.2, 'boards', tile=1.4)
    for x in (x0, xd - 0.82, xd + 0.82, x0 + 3.1, x0 + 4.7, x0 + 6.4, x1):
        P.box(x - 0.09, x + 0.09, y0 - 0.06, y0 + 0.1, zf - 0.4, H + 0.1, 'timber', tile=1.0, bevel=0.01)
    for x in (x0, x0 + 2.9, x0 + 5.8, x1):
        P.box(x - 0.09, x + 0.09, y1 - 0.1, y1 + 0.06, zf - 0.4, H + 0.1, 'timber', tile=1.0, bevel=0.01)
    for y in (y0 - 0.02, y1 + 0.02):
        P.box(x0 - 0.1, x1 + 0.1, y - 0.07, y + 0.07, H - 0.1, H + 0.08, 'timber', tile=(1.6, 0.8), bevel=0.01, grain='x')
    # 엔가와 (오른쪽 세 칸 앞)
    P.box(x0 + 3.0, x1 + 0.05, y0 - 0.85, y0, zf - 0.07, zf, 'floor', tile=1.4, bevel=0.01)
    for x in (x0 + 3.1, x0 + 5.0, x1 - 0.05):
        P.box(x - 0.06, x + 0.06, y0 - 0.8, y0 - 0.68, 0.0, zf - 0.07, 'timber', tile=1.0)
        P.box(x - 0.14, x + 0.14, y0 - 0.88, y0 - 0.6, -0.1, 0.06, 'stone', tile=0.8, bevel=0.02)
    R = Roof(L, D, H, pitch, 0.6, 'hipgable', oE=1.05, oG=0.95, curve=0.0, lift=0.0, setback=1.25, seed=7, k=0.1)
    _thatch_hipgable(P, R)
    # 처마 밑 곶감 줄 + 장작 더미 (벽에 붙여)
    for k in range(3):
        pepper_string(P, x0 + 3.6 + k * 0.25, y0 - 0.55, H - 0.05, n=8, color='persimmon')
    for row in range(4):
        for k in range(10):
            yy = y0 + 0.5 + k * 0.2
            P.add_bm(lathe_bm([(0.0, -0.3), (0.07, -0.3), (0.07, 0.3), (0.0, 0.3)], n=7), 'planks', uv=False, smooth=True,
                     matrix=Tm(x1 + 0.22, yy, 0.25 + row * 0.15 + 0.07 * (k % 2)) @ Ry(rad(90)))
    smoke(P, 'house_thatch_ea', (0.0, 0.0, R.zr + 0.6))
    return P


def _thatch_hipgable(P, R):
    """두꺼운 팔작 초가 (일본 민가): 위 맞배 + 아래 우진각 치마, 합각 세모는 대나무 살 연기창, 용마루 덮개."""
    th = 'thatch'
    seed = P.rng.randrange(1000)
    off = (P.rng.random() * 5, P.rng.random() * 5)

    def mk(part, xa, xb, keep=None, brk=None):
        def fz(x, y):
            return R.fz(x, y, part) + 0.03 * fbm(x * 0.6 + 3, y * 0.6, seed) + 0.012 * fbm(x * 2.2, y * 2.2, seed + 11)
        xs = E._grid(brk or [xa, xb], 0.25)
        ys = E._grid([R.cy - R.ye, R.cy, R.cy + R.ye], 0.25)
        kp = None
        if keep:
            def kp(i, j):
                return keep((xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2)
        ob = K.heightfield(fz, xs, ys, R.t, bevel_w=0.1, bevel_seg=1, uvfn=K.slope_uv(2.0, 2.0, R.pitch, off), name='thatch', keep=kp)
        P.add_obj(ob, th, keep_uv=True, smooth=True)
    xg, zs = R.xg, R.skirt_top()
    gx = xg + 0.45
    mk('all', -gx, gx, keep=lambda x, y: abs(x) < xg or R.z_long(y) > zs, brk=[-gx, -xg, xg, gx])
    mk('skirt', xg, R.xe)
    mk('skirt', -R.xe, -xg)
    # 합각 세모: 나무 판 + 대나무 살 (연기창)
    yt = R.half * E._inv_g(R, (R.zr - zs) / (R.half * R.tp))
    for sx in (-1, 1):
        pts = [(R.cy - yt, zs - 0.08)] + [(y, R.z_long(y) - R.t / math.cos(rad(R.pitch)) - 0.02) for y in lin(R.cy - yt * 0.98, R.cy + yt * 0.98, 8)] + \
              [(R.cy + yt, zs - 0.08)]
        add_vf(P, prism_ok(pts, 'x', sx * xg - 0.05, sx * xg + 0.05), 'timber', tile=1.2)
        for k in range(1, 8):
            y = R.cy - yt + 2 * yt * k / 8
            ztop = R.z_long(y) - R.t / math.cos(rad(R.pitch)) - 0.05
            if ztop > zs + 0.1:
                P.box(sx * xg + sx * 0.05, sx * xg + sx * 0.08, y - 0.02, y + 0.02, zs, ztop, 'planks', tile=1.0)
        P.box(sx * xg + sx * 0.04, sx * xg + sx * 0.06, -yt * 0.45, yt * 0.45, zs + 0.15, zs + 0.15 + (R.zr - zs) * 0.35, 'glass', tile=1.0)
    # 용마루 덮개 (짚 다발을 덮어 묶은 꼴) + 엇갈림 막대
    xr = gx + 0.05
    zr = R.fz(0, R.cy)
    P.add_bm(loft_bm([((x, R.cy, zr + 0.1), 0.42, 0.22) for x in lin(-xr, xr, 10)], n=10, expo=2.6, ref=(0, 0, 1)), 'thatch', tile=(0.9, 0.9), smooth=True)
    n = 6
    for k in range(n):
        x = -xr + 0.3 + (2 * xr - 0.6) * k / (n - 1)
        for s in (-1, 1):
            pal_add(P, tube_bm([(x - 0.05, R.cy - 0.5, zr - 0.05), (x + 0.05, R.cy + 0.5, zr - 0.05)] if s > 0 else
                               [(x + 0.05, R.cy - 0.5, zr - 0.05), (x - 0.05, R.cy + 0.5, zr - 0.05)], 0.035, n=5), 'wood_dark')
        pal_add(P, tube_bm([(x, R.cy - 0.45, zr + 0.22), (x, R.cy + 0.45, zr + 0.22)], 0.03, n=5, ref=(0, 0, 1)), 'wood_dark')


# ───────────────────────── 기와 지붕 묶음 ─────────────────────────
def tile_roof(P, R, ridge=True, caps=True, raft=('front', 'back'), raft_color=None, gable_mat='timber', ridge_h=0.34, ridge_w=0.36, style=None, res=0.25,
              hip_h=0.24):
    """골기와 지붕 한 벌: 면 + 용마루(땅 변형 꼴, 한국은 양성바름) + 내림마루 + 막새 + 서까래."""
    roof_ea(P, R, 'tile', res=res, gable_mat=gable_mat)
    st = style or V['ridge']
    lime = st == 'korea'
    if ridge:
        ridge_ea(P, R, style=st, mat='ridge', h=ridge_h, w=ridge_w, lime=lime)
        hip_ridges(P, R, mat='ridge', h=hip_h, w=hip_h + 0.02, lime=lime, lift_tip=0.06 + R.lift * 0.4)
    if caps:
        sides = ('front', 'back') if R.kind == 'gable' else ('front', 'back', 'left', 'right')
        eave_caps(P, R, sides=sides, skirt=R.kind != 'gable')
    if raft:
        rafters(P, R, sides=raft, mat='timber', end_color=raft_color, part='all' if R.kind == 'gable' else 'skirt',
                xlim=(-R.L / 2 + 0.15, R.L / 2 - 0.15))
    return R


def pent_roof(P, xa, xb, y_in, y_out, z_in, pitch=24, t=0.1, caps=True):
    """외쪽 기와 차양 (벽 y_in 에서 바깥 y_out 으로 내려간다): 두 층 집의 허리 처마·가게 차양."""
    tp = TP(pitch)
    sgn = 1 if y_out > y_in else -1

    def fz(x, y):
        return z_in - abs(y - y_in) * tp

    def uvf(me, poly):
        return [(me.vertices[i].co.x / E.TILE_U, -abs(me.vertices[i].co.y - y_in) / math.cos(rad(pitch)) / E.TILE_V) for i in poly.vertices]
    ya, yb = sorted((y_in, y_out))
    ob = K.heightfield(fz, E._grid([xa, xb], 0.3), E._grid([ya, yb], 0.3), t, bevel_w=0.01, bevel_seg=1, uvfn=uvf, name='pent')
    P.add_obj(ob, 'tile', keep_uv=True)
    if caps:
        n = max(1, int((xb - xa - 0.2) / 0.26))
        for k in range(n + 1):
            x = xa + 0.1 + (xb - xa - 0.2) * k / n
            pal_add(P, lathe_bm([(0.0, 0.0), (0.07, 0.0), (0.07, 0.035), (0.0, 0.035)], n=8), 'tile_dark', smooth=False,
                    matrix=Tm(x, y_out + sgn * 0.015, fz(x, y_out) - t * 0.45) @ Rx(rad(90) * sgn))
    P.beam((xa, y_out - sgn * 0.08, fz(xa, y_out) - t - 0.05), (xb, y_out - sgn * 0.08, fz(xb, y_out) - t - 0.05), 0.08, 0.1, 'timber')


def gable_wall(P, R, xa, xb, mat, z0, y0=None, y1=None):
    """박공벽 (지붕 밑면까지 차오른 끝벽): x 방향 두께 xa..xb, 앞뒤 y0..y1."""
    y0 = R.cy - R.half if y0 is None else y0
    y1 = R.cy + R.half if y1 is None else y1
    cosp = math.cos(rad(R.pitch))
    prof = [(y0, z0), (y1, z0)] + [(y, R.z_long(y) - R.t / cosp - 0.01) for y in lin(y1, y0, 14)]
    wall_ok(P, [prism_ok(prof, 'x', xa, xb)], mat, [], tile=TILE.get(mat, 2.0), bevel=0.03)


def brackets(P, x, y, z, depth=0.6, color='dan_green', n=2, along='y'):
    """공포 (단순화): 기둥 머리 위 주두 + 엇갈려 쌓은 첨차 둘 + 소로. 단청 색 (palette)."""
    pal_box(P, x - 0.2, x + 0.2, y - 0.2, y + 0.2, z, z + 0.16, color)
    zz = z + 0.16
    for k in range(n):
        L = depth * (0.7 + 0.3 * k)
        pal_box(P, x - L / 2, x + L / 2, y - 0.08, y + 0.08, zz, zz + 0.13, color)
        pal_box(P, x - 0.08, x + 0.08, y - L / 2, y + L / 2, zz, zz + 0.13, color)
        for sx in (-1, 1):
            pal_box(P, x + sx * L / 2 - 0.09, x + sx * L / 2 + 0.09, y - 0.09, y + 0.09, zz + 0.13, zz + 0.22, 'dan_ochre' if color != 'wood_dark' else 'wood_dark')
        zz += 0.22
    return zz


# ───────────────────────── 기와집 ─────────────────────────
def house_tile_ea():
    P = Piece('house_tile_ea', 3102)
    if CN:
        return _tile_china(P)
    if KR:
        return _tile_korea(P)
    return _tile_japan(P)


def _tile_china(P):
    """중국 기와집 (경산): 돌 기단 + 앞 툇간(붉은 두리기둥 넷), 청벽돌 박공벽·뒷벽, 앞면 나무 칸막이 (가운데 네 짝 살문, 양옆 벽돌 하방 위 살창),
    곡선 맞배 기와 + 양끝 꼬리 말린 용마루, 막새·서까래, 처마 붉은 등롱 둘."""
    L, D, H, pitch = 10.0, 5.4, 3.3, 29
    porch = 1.1
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    zb = 0.42
    plinth(P, x0 - 0.3, x1 + 0.3, y0 - porch - 0.45, y1 + 0.25, -0.45, zb, mat='stone', steps=[(0.0, 2.2, '-y', 2)])
    R = Roof(L + 0.0, D + porch, H, pitch, 0.3, 'gable', oE=0.75, oG=0.12, curve=V['curve'], lift=0.12, cy=-porch / 2, seed=11)
    cuts = []
    Ff = F_(P, '-y', y0)
    lattice(Ff, cuts, 0.0, 2.8, 2.45, zb, 0.25, pattern='grid', frame='timber_red', bar='timber_red', leaves=4)
    for sx in (-1, 1):
        lattice(Ff, cuts, sx * 3.15, 2.0, 1.25, zb + 1.0, 0.25, pattern='grid', frame='timber_red', bar='timber_red', leaves=2)
    wall_ok(P, [box_vf(x0 + 0.4, x1 - 0.4, y0, y0 + 0.22, zb - 0.02, H)], 'timber', cuts, tile=1.2, bevel=0.0)
    for sx in (-1, 1):       # 살창 밑 벽돌 하방
        P.box(sx * 3.15 - 1.12, sx * 3.15 + 1.12, y0 - 0.06, y0 + 0.2, zb, zb + 0.92, 'brick_grey', tile=1.4, bevel=0.01)
    # 뒷벽 (작은 높은 창) + 박공벽
    cb = []
    Fb = F_(P, '+y', y1)
    lattice(Fb, cb, 0.0, 0.8, 0.6, 2.0, 0.42, pattern='grid', frame='timber', leaves=1)
    wall_ok(P, [box_vf(x0 + 0.4, x1 - 0.4, y1 - 0.42, y1, zb - 0.02, H + 0.05)], 'brick_grey', cb, tile=1.4)
    for (a, b) in ((x0 - 0.05, x0 + 0.45), (x1 - 0.45, x1 + 0.05)):
        gable_wall(P, R, a, b, 'brick_grey', zb - 0.02, y0 - porch - 0.1, y1)
    for sx in (-1, 1):       # 박공 머리 (벽돌 끝 장식띠)
        pts = [(sx * (L / 2 + 0.1), y, R.z_long(y) + 0.06) for y in lin(R.cy - R.ye + 0.1, R.cy + R.ye - 0.1, 14)]
        E.ridge_line(P, pts, 0.55, 0.16, 'ridge')
    # 툇간 기둥 + 처마도리 + 작은 까치발
    for x in (x0 + 0.3, -1.6, 1.6, x1 - 0.3):
        post(P, x, y0 - porch + 0.2, zb, H + 0.05, r=0.13, mat='timber_red', base='stone', base_h=0.15)
        for sx in (-1, 1):
            if abs(x + sx * 0.4) < L / 2:
                pal_box(P, x + sx * 0.13, x + sx * 0.5, y0 - porch + 0.14, y0 - porch + 0.26, H - 0.45, H - 0.3, 'dan_green')
    P.beam((x0 - 0.1, y0 - porch + 0.2, H + 0.02), (x1 + 0.1, y0 - porch + 0.2, H + 0.02), 0.22, 0.26, 'timber_red')
    for x in (-3.2, -1.6, 0.0, 1.6, 3.2):     # 툇간 들보
        P.beam((x, y0 - porch + 0.2, H - 0.1), (x, y0 + 0.1, H - 0.1), 0.14, 0.18, 'timber')
    tile_roof(P, R, raft=('front',), raft_color=None)
    for sx in (-1, 1):
        lantern(P, sx * 1.6, y0 - porch + 0.2, H - 0.62)
    smoke(P, 'house_tile_ea', (x1 - 1.0, y1 - 0.4, R.zr + 0.4))
    return P


def _tile_korea(P):
    """한국 기와집: 높은 돌 기단(계단), 주춧돌·네모 기둥, 흰 회벽 + 나무 틀(중방·인방), 가운데 두 칸 대청(앞이 트인 마루, 뒤 판문), 양옆 방 띠살문,
    앞 툇마루, 팔작 기와 (오목 곡선·처마 귀 들림·흰 양성바름 용마루·내림마루), 막새·서까래, 뒤 굴뚝."""
    L, D, H, pitch = 10.4, 4.8, 2.9, 30
    toet = 0.95
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    zb = 0.7
    zf = zb + 0.42
    plinth(P, x0 - 0.9, x1 + 0.9, y0 - toet - 0.9, y1 + 0.6, -0.45, zb, mat='stone', steps=[(0.0, 2.4, '-y', 3)])
    bx = [x0, x0 + 2.6, x0 + 5.2, x0 + 7.8, x1]
    cuts = []
    Ff, Fb = F_(P, '-y', y0), F_(P, '+y', y1)
    for (a, b) in ((bx[0], bx[1]), (bx[3], bx[4])):
        lattice(Ff, cuts, (a + b) / 2, 1.35, 1.45, zf + 0.42, 0.25, pattern='ttisal', frame='timber', bar='timber', leaves=2)
    for k in (1, 2):         # 대청: 뒤 판문
        lattice(Fb, cuts, Fb.loc((bx[k] + bx[k + 1]) / 2), 1.4, 1.65, zf, 0.25, pattern='plank', frame='timber', leaves=2)
    lattice(Fb, cuts, Fb.loc((bx[0] + bx[1]) / 2), 0.7, 0.6, zf + 1.0, 0.25, pattern='ttisal', leaves=1)
    lattice(Fb, cuts, Fb.loc((bx[3] + bx[4]) / 2), 0.7, 0.6, zf + 1.0, 0.25, pattern='ttisal', leaves=1)
    wall_ok(P, [box_vf(bx[0], bx[1], y0, y0 + 0.16, zb - 0.02, H), box_vf(bx[3], bx[4], y0, y0 + 0.16, zb - 0.02, H)], 'plaster', cuts, tile=2.2)
    wall_ok(P, [box_vf(x0, x1, y1 - 0.16, y1, zb - 0.02, H)], 'plaster', cuts, tile=2.2)
    for (a, b) in ((x0, x0 + 0.16), (x1 - 0.16, x1)):
        wall_ok(P, [box_vf(a, b, y0, y1, zb - 0.02, H)], 'plaster', [], tile=2.2)
    # 대청 바닥 (트인 칸) + 툇마루
    P.box(bx[1], bx[3], y0, y1 - 0.16, zf - 0.1, zf, 'floor', tile=1.4)
    P.box(x0, x1, y0 - toet, y0, zf - 0.1, zf, 'floor', tile=1.4, bevel=0.008)
    P.box(x0, x1, y0 - toet - 0.02, y0 - toet + 0.08, zb, zf - 0.1, 'timber', tile=1.0)
    # 기둥 (앞 툇간 줄·벽 줄·뒤 줄) + 중방·인방·창방
    for x in bx:
        post(P, x, y0 - toet + 0.1, zb, H + 0.08, r=0.12, mat='timber', round_=False, base='stone', base_h=0.12)
        post(P, x, y0, zb, H + 0.08, r=0.11, mat='timber', round_=False, base=None)
        post(P, x, y1, zb, H + 0.08, r=0.11, mat='timber', round_=False, base=None)
    for y in (y0 - 0.02, y1 + 0.02):
        for z in (zf + 0.3, H - 0.18):
            P.box(x0, x1, y - 0.06, y + 0.06, z - 0.07, z + 0.07, 'timber', tile=(1.6, 0.8), bevel=0.008, grain='x')
    P.beam((x0 - 0.1, y0 - toet + 0.1, H + 0.02), (x1 + 0.1, y0 - toet + 0.1, H + 0.02), 0.2, 0.24, 'timber')
    for x in bx:
        P.beam((x, y0 - toet + 0.1, H - 0.08), (x, y0, H - 0.08), 0.12, 0.16, 'timber')
    R = Roof(L, D + toet, H + 0.12, pitch, 0.3, 'hipgable', oE=1.3, oG=1.15, curve=V['curve'], lift=V['lift'], cy=-toet / 2, setback=1.5, seed=13)
    tile_roof(P, R, raft=('front', 'back'), gable_mat='timber')
    chimney_kr(P, x1 - 0.6, y1 + 1.6, 1.25)
    smoke(P, 'house_tile_ea', (x1 - 0.6, y1 + 1.6, 1.7))
    return P


def _tile_japan(P):
    """일본 기와집: 낮은 돌 기초 + 들린 마루, 아래 판벽·위 흰 회벽(기둥·누키가 드러남), 앞 엔가와 + 쇼지(둘 엶), 팔작 기와(곡선 작게),
    흰 합각, 귀면 기와 용마루."""
    L, D, H, pitch = 10.0, 5.8, 2.65, 27
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    zf = 0.62
    P.box(x0 - 0.15, x1 + 0.15, y0 - 1.0, y1 + 0.15, -0.45, 0.16, 'stone', tile=1.6, bevel=0.03)
    P.box(x0, x1, y0, y1, 0.16, zf, 'boards', tile=1.4)
    cuts = []
    Ff, Fb, Fl, Fr = F_(P, '-y', y0), F_(P, '+y', y1), F_(P, '-x', x0), F_(P, '+x', x1)
    bays = [x0, x0 + 2.5, x0 + 5.0, x0 + 7.5, x1]
    for k in range(4):
        lattice(Ff, cuts, (bays[k] + bays[k + 1]) / 2, 2.25, 1.85, zf, 0.25, pattern='shoji', frame='timber', bar='timber', leaves=2,
                open_=0.55 if k in (1, 2) else 0.0, sill=0.05)
    lattice(Fb, cuts, Fb.loc(-2.0), 1.6, 0.9, 1.2, 0.25, pattern='shoji', leaves=2)
    lattice(Fl, cuts, 0.0, 1.4, 0.9, 1.2, 0.25, pattern='shoji', leaves=2)
    lattice(Fr, cuts, 0.0, 1.4, 0.9, 1.2, 0.25, pattern='shoji', leaves=2)
    wall_ok(P, [box_vf(x0, x1, y0, y1, zf - 0.02, H)], 'plaster', cuts, tile=2.2)
    for (fc, Lw) in ((Fb, L), (Fl, D), (Fr, D)):
        fc.box(-Lw / 2, Lw / 2, -0.025, 0.0, zf, zf + 0.75, 'boards', tile=1.4)
    for x in bays:
        P.box(x - 0.08, x + 0.08, y0 - 0.06, y0 + 0.06, 0.16, H + 0.1, 'timber', tile=1.0)
        P.box(x - 0.08, x + 0.08, y1 - 0.06, y1 + 0.06, 0.16, H + 0.1, 'timber', tile=1.0)
    for y in (y0 - 0.02, y1 + 0.02):
        for z in (zf + 1.95, H - 0.05):
            P.box(x0, x1, y - 0.05, y + 0.05, z - 0.05, z + 0.05, 'timber', tile=(1.6, 0.8), grain='x')
    for x in (x0 - 0.02, x1 + 0.02):
        for z in (zf + 1.95, H - 0.05):
            P.box(x - 0.05, x + 0.05, y0, y1, z - 0.05, z + 0.05, 'timber', tile=(1.6, 0.8))
    P.box(x0, x1, y0 - 0.95, y0, zf - 0.07, zf, 'floor', tile=1.4, bevel=0.01)
    for x in bays:
        P.box(x - 0.06, x + 0.06, y0 - 0.9, y0 - 0.78, 0.0, zf - 0.07, 'timber', tile=1.0)
    R = Roof(L, D, H + 0.08, pitch, 0.28, 'hipgable', oE=1.15, oG=1.0, curve=V['curve'], lift=V['lift'], setback=1.7, seed=17)
    tile_roof(P, R, raft=('front',), gable_mat='plaster')
    smoke(P, 'house_tile_ea', (x1 - 1.2, 0.8, R.zr + 0.3))
    return P


# ───────────────────────── 가게 딸린 집 ─────────────────────────
def shop_goods(P, xa, xb, y, z, rng):
    """평상·계산대 위 물건: 바구니(배추·무·감·콩), 옹기, 피륙 두루마리."""
    x = xa + 0.25
    while x < xb - 0.2:
        q = rng.random()
        if q < 0.35:
            pal_add(P, lathe_bm([(0.16, 0.0), (0.22, 0.12), (0.23, 0.16), (0.0, 0.16)], n=12, cap0=True), 'straw_dark', matrix=Tm(x, y, z))
            col = ['cabbage', 'radish', 'persimmon', 'bean', 'pepper_red'][int(rng.random() * 5)]
            for k in range(5):
                a = k * 2.4
                pal_add(P, ellipsoid_bm((x + 0.08 * math.cos(a), y + 0.08 * math.sin(a), z + 0.2), (0.07, 0.07, 0.06), nu=7, nv=4), col)
            x += 0.5
        elif q < 0.6:
            crock(P, Tm(x, y, z), 0.55, 'onggi')
            x += 0.36
        else:
            for k, c in enumerate(['cloth_indigo', 'cloth_white', 'cloth_red', 'cloth_brown'][: 2 + int(rng.random() * 3)]):
                pal_add(P, lathe_bm([(0.0, -0.3), (0.06, -0.3), (0.06, 0.3), (0.0, 0.3)], n=8), c, matrix=Tm(x, y + k * 0.13 - 0.15, z + 0.06) @ Ry(rad(90)))
            x += 0.7


def house_town_ea():
    P = Piece('house_town_ea', 3103)
    if CN:
        return _town_china(P)
    if KR:
        return _town_korea(P)
    return _town_japan(P)


def _town_china(P):
    """중국 두 층 가게 집: 아래층 앞이 트인 가게(계산대·안 선반·세워 둔 판문), 허리 기와 처마, 위층 살창 셋, 청벽돌 박공벽, 맞배 기와,
    세로 간판·붉은 등롱·쪽빛 깃발."""
    L, D, H1, H, pitch = 7.6, 6.2, 3.0, 5.6, 28
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    zb = 0.25
    P.box(x0 - 0.15, x1 + 0.15, y0 - 0.35, y1 + 0.15, -0.45, zb, 'stone', tile=1.6, bevel=0.03)
    R = Roof(L, D, H, pitch, 0.28, 'gable', oE=0.7, oG=0.12, curve=V['curve'], lift=0.1, seed=19)
    for (a, b) in ((x0 - 0.05, x0 + 0.4), (x1 - 0.4, x1 + 0.05)):
        gable_wall(P, R, a, b, 'brick_grey', zb - 0.02)
    for sx in (-1, 1):
        E.ridge_line(P, [(sx * (L / 2 + 0.08), y, R.z_long(y) + 0.06) for y in lin(-R.ye + 0.1, R.ye - 0.1, 12)], 0.5, 0.15, 'ridge')
    wall_ok(P, [box_vf(x0 + 0.4, x1 - 0.4, y1 - 0.35, y1, zb, H + 0.05)], 'brick_grey', [], tile=1.4)
    # 아래층: 가게 안 어둠 + 선반 + 계산대 + 왼쪽 들머리
    P.box(x0 + 0.4, x1 - 0.4, y0 + 2.6, y0 + 2.7, zb, H1, 'shade', tile=1.0)
    P.box(x0 + 0.4, x1 - 0.4, y0 + 0.2, y0 + 2.7, H1 - 0.05, H1 + 0.12, 'timber', tile=1.2)
    for z in (1.1, 1.8):
        P.box(-1.0, x1 - 0.5, y0 + 2.2, y0 + 2.6, z, z + 0.05, 'planks', tile=1.0)
    rng = P.rng
    shop_goods(P, -1.0, x1 - 0.6, y0 + 2.4, 1.15, rng)
    shop_goods(P, -1.0, x1 - 0.6, y0 + 2.4, 1.85, rng)
    P.box(-1.2, x1 - 0.45, y0 + 0.25, y0 + 0.75, zb, zb + 0.95, 'planks', tile=1.2, bevel=0.01)
    P.box(-1.25, x1 - 0.4, y0 + 0.2, y0 + 0.8, zb + 0.95, zb + 1.02, 'timber', tile=1.0)
    shop_goods(P, -1.0, x1 - 0.7, y0 + 0.5, zb + 1.02, rng)
    for k in range(6):       # 세워 둔 판문 (밤에 끼우는 널)
        P.box(x1 - 0.5 - k * 0.045, x1 - 0.46 - k * 0.045, y0 + 0.85 + k * 0.06, y0 + 1.15 + k * 0.06, zb, zb + 2.4, 'planks', tile=1.0)
    for x in (x0 + 0.35, -1.3, 1.3, x1 - 0.35):
        P.box(x - 0.11, x + 0.11, y0 + 0.05, y0 + 0.27, zb, H1 + 0.1, 'timber', tile=1.0, bevel=0.01)
    P.box(x0 + 0.4, -1.4, y0 + 0.25, y0 + 2.6, zb, zb + 0.05, 'planks', tile=1.2)
    # 위층 앞벽 + 살창 셋
    cuts = []
    Fu = F_(P, '-y', y0 + 0.25)
    for c in (-2.2, 0.0, 2.2):
        lattice(Fu, cuts, c, 1.5, 1.1, H1 + 0.75, 0.2, pattern='grid', frame='timber_red', bar='timber_red', leaves=2)
    wall_ok(P, [box_vf(x0 + 0.4, x1 - 0.4, y0 + 0.25, y0 + 0.45, H1 + 0.1, H)], 'timber', cuts, tile=1.2)
    pent_roof(P, x0 + 0.3, x1 - 0.3, y0 + 0.27, y0 - 0.85, H1 + 0.55, pitch=24)
    tile_roof(P, R, raft=('front',))
    # 세로 간판 + 등롱 + 깃발
    P.box(x0 + 0.7, x0 + 1.05, y0 - 0.1, y0 + 0.0, H1 - 1.55, H1 - 0.05, 'timber', tile=1.0)
    pal_box(P, x0 + 0.74, x0 + 1.01, y0 - 0.115, y0 - 0.1, H1 - 1.5, H1 - 0.1, 'black')
    for k in range(4):
        pal_box(P, x0 + 0.82, x0 + 0.93, y0 - 0.12, y0 - 0.112, H1 - 0.45 - k * 0.3, H1 - 0.3 - k * 0.3, 'gold')
    lantern(P, 1.3, y0 - 0.35, H1 + 0.05, s=0.85)
    P.add_bm(tube_bm([(x1 - 0.3, y0 + 0.3, H1 + 1.2), (x1 + 0.9, y0 - 0.7, H1 + 1.6)], 0.03, n=5), 'timber', tile=0.5)
    for d, face in ((0.004, (0, 1, 2, 3)), (-0.004, (3, 2, 1, 0))):
        v = [(x1 + 0.35, y0 - 0.25 + d, H1 + 1.42), (x1 + 0.85, y0 - 0.66 + d, H1 + 1.58), (x1 + 0.85, y0 - 0.66 + d, H1 + 0.4), (x1 + 0.35, y0 - 0.25 + d, H1 + 0.3)]
        pal_add(P, K.bm_from(v, [face]), 'cloth_indigo', smooth=False)
    smoke(P, 'house_town_ea', (x0 + 1.2, y1 - 0.6, R.zr + 0.3))
    return P


def _town_korea(P):
    """한국 시전 행랑: 낮은 돌 기단, 네 칸 가게 (들어열개 판문을 처마 밑으로 들어 걸었다), 칸마다 평상에 물건, 안 어둠,
    맞배 기와 (곡선·양성바름), 박공 쪽 풍판."""
    L, D, H, pitch = 9.6, 4.6, 2.75, 30
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    zb = 0.35
    P.box(x0 - 0.3, x1 + 0.3, y0 - 1.2, y1 + 0.3, -0.45, zb, 'stone', tile=1.6, bevel=0.03)
    bx = [x0 + k * L / 4 for k in range(5)]
    P.box(x0, x1, y0 + 2.1, y0 + 2.2, zb, H, 'shade', tile=1.0)
    wall_ok(P, [box_vf(x0, x1, y1 - 0.16, y1, zb, H)], 'plaster', [], tile=2.2)
    for (a, b) in ((x0, x0 + 0.16), (x1 - 0.16, x1)):
        wall_ok(P, [box_vf(a, b, y0, y1, zb, H)], 'plaster', [], tile=2.2)
    P.box(x0, x1, y0, y0 + 2.1, zb, zb + 0.05, 'planks', tile=1.2)
    rng = P.rng
    for k in range(4):
        a, b = bx[k] + 0.15, bx[k + 1] - 0.15
        P.box(a, b, y0 - 0.95, y0 - 0.05, zb + 0.4, zb + 0.46, 'floor', tile=1.2, bevel=0.008)          # 평상
        for x in (a + 0.1, b - 0.1):
            for y in (y0 - 0.9, y0 - 0.1):
                P.box(x - 0.04, x + 0.04, y - 0.04, y + 0.04, zb, zb + 0.4, 'timber', tile=1.0)
        shop_goods(P, a, b, y0 - 0.5, zb + 0.46, rng)
        # 들어열개 판문: 위 도리에 걸어 앞으로 70° 들어 올림
        M = Tm((a + b) / 2, y0 + 0.02, H - 0.12) @ Rx(rad(-72))
        P.box(-(b - a) / 2, (b - a) / 2, -0.03, 0.0, -1.95, 0.0, 'planks', matrix=M, tile=1.2)
        for zz in (-0.4, -1.0, -1.6):
            P.box(-(b - a) / 2 + 0.05, (b - a) / 2 - 0.05, -0.05, -0.03, zz, zz + 0.07, 'timber', matrix=M, tile=1.0)
        shop_goods(P, a + 0.2, b - 0.2, y0 + 1.6, zb + 0.05, rng)
    for x in bx:
        post(P, x, y0, zb, H + 0.06, r=0.11, mat='timber', round_=False, base='stone', base_h=0.1)
        post(P, x, y1, zb, H + 0.06, r=0.11, mat='timber', round_=False, base=None)
    for y in (y0, y1):
        P.box(x0 - 0.05, x1 + 0.05, y - 0.07, y + 0.07, H - 0.12, H + 0.06, 'timber', tile=(1.6, 0.8), grain='x')
    R = Roof(L, D, H + 0.06, pitch, 0.28, 'gable', oE=1.15, oG=0.75, curve=V['curve'], lift=V['lift'] * 0.6, seed=23)
    tile_roof(P, R, raft=('front', 'back'))
    for sx in (-1, 1):       # 풍판 (박공 밑 비바람막이 널)
        zs = R.z_long(R.cy) - 0.5
        for y in lin(-R.half + 0.1, R.half - 0.1, 7):
            z1 = R.z_long(y) - R.t / math.cos(rad(pitch)) - 0.05
            if z1 > H + 0.25:
                P.box(sx * (L / 2 + 0.55) - 0.025, sx * (L / 2 + 0.55) + 0.025, y - 0.33, y + 0.33, H + 0.15, z1, 'planks', tile=1.0)
    smoke(P, 'house_town_ea', (x1 - 0.8, y1 + 0.2, R.zr + 0.3))
    return P


def _town_japan(P):
    """일본 마치야: 앞면이 길(처마 쪽 들머리), 아래층 짙은 나무 격자(고시) 두 칸 + 노렌을 건 들머리, 허리 차양, 낮은 위층의 흰 회벽 무시코창,
    옆벽 흰 회벽 + 아래 판벽, 완만한 맞배 기와, 처마 작은 간판."""
    L, D, H1, H, pitch = 7.0, 7.2, 2.75, 4.5, 24
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    zb = 0.15
    P.box(x0 - 0.1, x1 + 0.1, y0 - 0.1, y1 + 0.1, -0.45, zb, 'stone', tile=1.6, bevel=0.02)
    cuts = []
    Fl, Fr, Fb = F_(P, '-x', x0), F_(P, '+x', x1), F_(P, '+y', y1)
    wall_ok(P, [box_vf(x0, x1, y0 + 0.3, y1, zb, H)], 'plaster', cuts, tile=2.2)
    for (fc, Lw) in ((Fl, D - 0.3), (Fr, D - 0.3), (Fb, L)):
        fc.box(-Lw / 2, Lw / 2, -0.025, 0.0, zb, zb + 1.0, 'boards', tile=1.4)
    # 아래층 앞: 들머리 (왼쪽, 노렌) + 고시 격자 둘
    xd0, xd1 = x0 + 0.25, x0 + 1.95
    P.box(xd0, xd1, y0 + 0.26, y0 + 0.31, zb, H1 - 0.15, 'glass', tile=1.0)
    for k in range(3):
        a = xd0 + 0.08 + k * 0.54
        for d, face in ((0.0, (0, 1, 2, 3)), (-0.004, (3, 2, 1, 0))):
            v = [(a, y0 + 0.2 + d, H1 - 0.2), (a + 0.5, y0 + 0.2 + d, H1 - 0.2), (a + 0.5, y0 + 0.2 + d, H1 - 0.95), (a, y0 + 0.2 + d, H1 - 0.95)]
            pal_add(P, K.bm_from(v, [face]), 'cloth_indigo', smooth=False)
    P.add_bm(tube_bm([(xd0, y0 + 0.2, H1 - 0.18), (xd1, y0 + 0.2, H1 - 0.18)], 0.02, n=5, ref=(0, 0, 1)), 'timber', tile=0.5)
    for (a, b) in ((x0 + 2.1, x0 + 4.5), (x0 + 4.65, x1 - 0.2)):
        P.box(a, b, y0 + 0.3, y0 + 0.36, zb + 0.3, H1 - 0.2, 'shade', tile=1.0)
        n = int((b - a) / 0.065)
        for k in range(n):
            x = a + (b - a) * (k + 0.5) / n
            P.box(x - 0.018, x + 0.018, y0 + 0.18, y0 + 0.24, zb + 0.3, H1 - 0.2, 'timber', tile=1.0)
        for z in (zb + 0.3, H1 - 0.25, (zb + H1) / 2):
            P.box(a, b, y0 + 0.16, y0 + 0.24, z - 0.03, z + 0.03, 'timber', tile=1.0)
        P.box(a, b, y0 + 0.18, y0 + 0.36, zb, zb + 0.3, 'boards', tile=1.0)
    for x in (x0 + 0.12, xd1 + 0.08, x0 + 4.58, x1 - 0.12):
        P.box(x - 0.08, x + 0.08, y0 + 0.14, y0 + 0.32, zb, H + 0.05, 'timber', tile=1.0)
    P.box(x0, x1, y0 + 0.14, y0 + 0.32, H1 - 0.2, H1 + 0.1, 'timber', tile=(1.6, 0.8), grain='x')
    pent_roof(P, x0 - 0.05, x1 + 0.05, y0 + 0.3, y0 - 0.75, H1 + 0.45, pitch=22)
    # 위층 앞: 흰 회벽 + 무시코창 셋
    P.box(x0 + 0.2, x1 - 0.2, y0 + 0.22, y0 + 0.32, H1 + 0.1, H, 'plaster', tile=2.2)
    for c in (-2.0, 0.0, 2.0):
        P.box(c - 0.55, c + 0.55, y0 + 0.2, y0 + 0.23, H1 + 0.6, H1 + 1.3, 'glass', tile=1.0)
        for k in range(8):
            x = c - 0.55 + 1.1 * (k + 0.5) / 8
            P.box(x - 0.035, x + 0.035, y0 + 0.17, y0 + 0.22, H1 + 0.6, H1 + 1.3, 'plaster', tile=1.0)
        P.box(c - 0.62, c + 0.62, y0 + 0.15, y0 + 0.22, H1 + 0.53, H1 + 0.6, 'plaster', tile=1.0)
        P.box(c - 0.62, c + 0.62, y0 + 0.15, y0 + 0.22, H1 + 1.3, H1 + 1.37, 'plaster', tile=1.0)
    R = Roof(L, D, H + 0.05, pitch, 0.26, 'gable', oE=0.8, oG=0.35, curve=V['curve'], lift=V['lift'], seed=29)
    tile_roof(P, R, raft=('front',))
    P.box(x1 - 1.6, x1 - 0.5, y0 - 0.32, y0 - 0.27, H1 + 0.12, H1 + 0.45, 'timber', tile=1.0)       # 간판
    pal_box(P, x1 - 1.55, x1 - 0.55, y0 - 0.335, y0 - 0.32, H1 + 0.16, H1 + 0.41, 'black')
    smoke(P, 'house_town_ea', (x1 - 1.2, y1 - 1.0, R.zr + 0.3))
    return P


# ───────────────────────── 목조 법당 ─────────────────────────
def temple_ea():
    """목조 법당 (시대 일반형): 높은 돌 기단·앞 계단, 두리기둥 넷(앞)·여섯(옆 뒤), 공포·창방(단청), 가운데 네 짝 살문 + 양옆 두 짝, 편액,
    팔작 기와 (곡선·귀 들림), 막새·서까래 마구리 단청, 앞마당 석등(한국)·향로(중국)·석등 한 쌍(일본)."""
    P = Piece('temple_ea', 3104)
    L, D, H, pitch = 9.6, 7.4, 4.3, 33
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    zb = 1.0
    plinth(P, x0 - 1.5, x1 + 1.5, y0 - 1.6, y1 + 1.2, -0.5, zb, mat='stone', steps=[(0.0, 2.6, '-y', 4)])
    paint = 'dan_green' if not JP else 'wood_dark'
    colmat = 'timber_red' if not JP else 'timber'
    wallmat = 'wall_red' if CN else 'plaster'
    cuts = []
    Ff, Fb, Fl, Fr = F_(P, '-y', y0), F_(P, '+y', y1), F_(P, '-x', x0), F_(P, '+x', x1)
    bx = [x0, -1.75, 1.75, x1]
    lattice(Ff, cuts, 0.0, 3.1, 3.0, zb + 0.08, 0.3, pattern='grid', frame=colmat, bar=colmat, leaves=4)
    for c in ((x0 + bx[1]) / 2, (bx[2] + x1) / 2):
        lattice(Ff, cuts, c, 2.4, 2.6, zb + 0.08, 0.3, pattern='grid', frame=colmat, bar=colmat, leaves=2)
    lattice(Fl, cuts, 0.0, 1.6, 1.4, zb + 1.2, 0.3, pattern='grid', frame=colmat, leaves=2)
    lattice(Fr, cuts, 0.0, 1.6, 1.4, zb + 1.2, 0.3, pattern='grid', frame=colmat, leaves=2)
    lattice(Fb, cuts, 0.0, 1.8, 2.2, zb + 0.08, 0.3, pattern='plank', frame=colmat, leaves=2)
    wall_ok(P, [box_vf(x0, x1, y0, y1, zb - 0.02, H)], wallmat, cuts, tile=2.2)
    for y in (y0 - 0.03, y1 + 0.03):            # 하인방 (벽 밑 나무띠)
        P.box(x0, x1, y - 0.05, y + 0.05, zb, zb + 0.22, colmat, tile=(1.6, 0.8), grain='x')
    for x in (x0 - 0.03, x1 + 0.03):
        P.box(x - 0.05, x + 0.05, y0, y1, zb, zb + 0.22, colmat, tile=(1.6, 0.8))
    cols = [(x, y0) for x in bx] + [(x, y1) for x in bx] + [(x0, y0 + D / 3), (x0, y0 + 2 * D / 3), (x1, y0 + D / 3), (x1, y0 + 2 * D / 3)]
    for (x, y) in cols:
        post(P, x, y, zb, H, r=0.2, mat=colmat, base='stone', base_h=0.2)
    # 창방·평방 (단청 띠) + 공포
    for y in (y0 - 0.05, y1 + 0.05):
        pal_box(P, x0 - 0.15, x1 + 0.15, y - 0.13, y + 0.13, H - 0.42, H - 0.1, paint)
        pal_box(P, x0 - 0.18, x1 + 0.18, y - 0.16, y + 0.16, H - 0.1, H + 0.05, 'dan_ochre' if not JP else 'wood_dark')
    for x in (x0 - 0.05, x1 + 0.05):
        pal_box(P, x - 0.13, x + 0.13, y0 - 0.15, y1 + 0.15, H - 0.42, H - 0.1, paint)
        pal_box(P, x - 0.16, x + 0.16, y0 - 0.18, y1 + 0.18, H - 0.1, H + 0.05, 'dan_ochre' if not JP else 'wood_dark')
    zt = H + 0.05
    for x in bx + [(bx[0] + bx[1]) / 2, (bx[1] + bx[2]) / 2, (bx[2] + bx[3]) / 2]:
        for y in (y0, y1):
            zt = brackets(P, x, y, H + 0.05, depth=0.75, color=paint, n=2)
    for y in (y0 + D / 3, y0 + 2 * D / 3, (y0 + y1) / 2):
        for x in (x0, x1):
            brackets(P, x, y, H + 0.05, depth=0.75, color=paint, n=2)
    # 편액
    pal_box(P, -0.75, 0.75, y0 - 0.32, y0 - 0.26, H - 0.35, H + 0.25, 'gold')
    pal_box(P, -0.68, 0.68, y0 - 0.34, y0 - 0.3, H - 0.28, H + 0.18, 'black')
    R = Roof(L, D, zt + 0.05, pitch, 0.34, 'hipgable', oE=2.2, oG=2.0, curve=V['curve'] + 0.06, lift=V['lift'] * 1.35 + 0.08, setback=2.1, seed=31)
    tile_roof(P, R, raft=('front', 'back'), raft_color=None if JP else 'dan_green', gable_mat=colmat, ridge_h=0.42, ridge_w=0.42, hip_h=0.3)
    # 앞마당
    if KR:       # 석등 (팔각 일반형)
        x, y = 0.0, y0 - 3.4
        P.add_bm(K.bm_from(*prism_ok([(0.55 * math.cos(a), 0.55 * math.sin(a)) for a in [k * math.pi / 4 for k in range(8)]], 'z', -0.3, 0.25)), 'granite',
                 tile=1.0, matrix=Tm(x, y, 0))
        P.cyl(0.16, 0.14, 1.0, 'granite', n=8, matrix=Tm(x, y, 0.25), tile=0.8)
        P.add_bm(K.bm_from(*prism_ok([(0.42 * math.cos(a), 0.42 * math.sin(a)) for a in [k * math.pi / 4 for k in range(8)]], 'z', 1.25, 1.42)), 'granite',
                 tile=1.0, matrix=Tm(x, y, 0))
        P.add_bm(K.bm_from(*prism_ok([(0.3 * math.cos(a), 0.3 * math.sin(a)) for a in [k * math.pi / 4 for k in range(8)]], 'z', 1.42, 1.95)), 'granite',
                 tile=1.0, matrix=Tm(x, y, 0))
        P.box(x - 0.13, x + 0.13, y - 0.31, y - 0.29, 1.55, 1.85, 'glass', tile=1.0)
        P.add_bm(lathe_bm([(0.55, 1.95), (0.5, 2.05), (0.2, 2.25), (0.08, 2.32), (0.1, 2.42), (0.0, 2.5)], n=8, cap0=True), 'granite', uv=False,
                 matrix=Tm(x, y, 0))
    elif CN:     # 청동 향로 (세 발)
        x, y = 0.0, y0 - 3.2
        P.box(x - 0.6, x + 0.6, y - 0.6, y + 0.6, -0.2, 0.35, 'stone', tile=1.0, bevel=0.03)
        pal_add(P, lathe_bm([(0.0, 0.62), (0.35, 0.62), (0.42, 0.78), (0.4, 0.98), (0.44, 1.02), (0.0, 1.0)], n=14), 'bronze', matrix=Tm(x, y, 0))
        for a in (0.0, 2.094, 4.189):
            pal_add(P, tube_bm([(x + 0.25 * math.cos(a), y + 0.25 * math.sin(a), 0.68), (x + 0.32 * math.cos(a), y + 0.32 * math.sin(a), 0.35)], 0.04, n=5), 'bronze')
        for sx in (-1, 1):
            pal_add(P, tube_bm([(x + sx * 0.36, y, 0.98), (x + sx * 0.36, y, 1.18), (x + sx * 0.28, y, 1.22)], 0.03, n=5), 'bronze')
        for k in range(3):
            pal_add(P, tube_bm([(x - 0.1 + k * 0.1, y, 0.98), (x - 0.1 + k * 0.1, y, 1.3)], 0.006, n=3), 'incense')
    else:        # 석등 한 쌍
        for sx in (-1, 1):
            x, y = sx * 2.4, y0 - 2.8
            P.box(x - 0.42, x + 0.42, y - 0.42, y + 0.42, -0.2, 0.2, 'granite', tile=1.0, bevel=0.03)
            P.cyl(0.12, 0.12, 0.9, 'granite', n=8, matrix=Tm(x, y, 0.2), tile=0.8)
            P.box(x - 0.32, x + 0.32, y - 0.32, y + 0.32, 1.1, 1.24, 'granite', tile=1.0)
            P.box(x - 0.24, x + 0.24, y - 0.24, y + 0.24, 1.24, 1.66, 'granite', tile=1.0)
            P.box(x - 0.12, x + 0.12, y - 0.25, y - 0.23, 1.32, 1.58, 'glass', tile=1.0)
            P.add_bm(lathe_bm([(0.5, 1.66), (0.46, 1.74), (0.18, 1.9), (0.08, 1.96), (0.1, 2.05), (0.0, 2.12)], n=6, cap0=True), 'granite', uv=False,
                     matrix=Tm(x, y, 0))
    return P


# ───────────────────────── 탑 ─────────────────────────
def pyramid_roof(P, w, z, pitch=24, t=0.2, curve=0.2, lift=0.2, mat='tile', ridges=True, caps=True, hip_h=0.16):
    """네모 탑 지붕 (사방 경사가 한 점으로): Roof 우진각에서 길이 = 깊이."""
    R = Roof(w, w, z, pitch, t, 'hip', oE=0.0, oG=0.0, curve=curve, lift=lift, k=0.04)
    roof_mesh_sq = E.roof_mesh
    roof_mesh_sq(P, R, mat, -R.xe, R.xe, -R.ye, R.ye, 'all', 0.2, 0.012)
    if ridges:
        hip_ridges(P, R, mat='ridge' if mat == 'tile' else mat, h=hip_h, w=hip_h + 0.02, lift_tip=lift * 0.5)
    if caps and mat == 'tile':
        eave_caps(P, R, sides=('front', 'back', 'left', 'right'), skirt=True, r=0.06, spacing=0.3)
    return R


def pagoda_small():
    P = Piece('pagoda_small', 3105)
    if CN:
        return _pagoda_china(P)
    if KR:
        return _pagoda_korea(P)
    return _pagoda_japan(P)


def finial(P, z, n=7, r=0.16, color='bronze', h_ring=0.2):
    """탑 꼭대기 상륜: 연꽃 받침 + 고리 n + 보주."""
    pal_add(P, lathe_bm([(0.0, z), (0.35, z), (0.42, z + 0.12), (0.3, z + 0.3), (0.12, z + 0.38), (0.0, z + 0.4)], n=12), color)
    zz = z + 0.38
    pal_add(P, tube_bm([(0, 0, zz), (0, 0, zz + n * h_ring + 0.6)], 0.045, n=6), color)
    for k in range(n):
        rr = r * (1.0 - 0.05 * k)
        pal_add(P, lathe_bm([(0.0, zz + 0.1 + k * h_ring), (rr, zz + 0.1 + k * h_ring), (rr, zz + 0.16 + k * h_ring), (0.0, zz + 0.16 + k * h_ring)], n=10), color)
    pal_add(P, ellipsoid_bm((0, 0, zz + n * h_ring + 0.72), (0.13, 0.13, 0.18), nu=10, nv=6), color)
    return zz + n * h_ring + 0.9


def _pagoda_china(P):
    """중국 다섯 층 벽돌탑: 돌 기단, 층마다 네모 몸(벽돌, 네 면 아치 감실) + 벽돌을 내쌓은 처마 + 얇은 기와 지붕, 위로 갈수록 좁고 낮다, 상륜."""
    P.box(-2.6, 2.6, -2.6, 2.6, -0.4, 0.6, 'stone', tile=1.6, bevel=0.03)
    P.box(-1.0, 1.0, -3.2, -2.6, -0.4, 0.3, 'stone', tile=1.2, bevel=0.02)
    z = 0.6
    for k in range(5):
        w = 3.4 * (1 - 0.1 * k)
        h = 2.9 if k == 0 else 2.0 - 0.1 * k
        cuts = []
        for side, plane in (('-y', -w / 2), ('+y', w / 2), ('-x', -w / 2), ('+x', w / 2)):
            F = F_(P, side, plane)
            aw, ah = (0.9 if k == 0 else 0.6), (1.6 if k == 0 else 0.9)
            cuts.append(F.cutter(-aw / 2, aw / 2, z + 0.15, z + 0.15 + ah, 0.25, arch='round'))
            F.box(-aw / 2, aw / 2, 0.22, 0.26, z + 0.15, z + 0.15 + ah + aw / 2, 'glass', tile=1.0)
        wall_ok(P, [box_vf(-w / 2, w / 2, -w / 2, w / 2, z, z + h)], 'brick_grey', cuts, tile=1.4)
        z += h
        for j, d in enumerate((0.12, 0.24, 0.36)):      # 내쌓은 벽돌 처마
            P.box(-w / 2 - d, w / 2 + d, -w / 2 - d, w / 2 + d, z + j * 0.11, z + (j + 1) * 0.11, 'brick_grey', tile=1.4)
        z += 0.33
        R = pyramid_roof(P, w + 0.9, z + 0.05, pitch=22, t=0.14, curve=0.22, lift=0.18, hip_h=0.12)
        z = R.fz(w / 2 - 0.1 - 0.12 * 0, 0) if False else z + 0.35
    zz = finial(P, z + 0.6, n=7, color='iron')
    return P


def _pagoda_korea(P):
    """한국 삼층 석탑 (통일신라 일반형): 두 층 기단(우주·탱주 돋을새김) + 갑석, 탑신 셋(모서리 기둥 새김), 얇고 넓은 옥개석(밑면 다섯 단 층급받침,
    윗면 낙수면, 귀가 살짝 들림), 노반·복발·보륜 상륜. 화강암."""
    g = 'granite'
    P.box(-1.5, 1.5, -1.5, 1.5, -0.3, 0.5, g, tile=1.6, bevel=0.02)
    P.box(-1.58, 1.58, -1.58, 1.58, 0.5, 0.64, g, tile=1.6, bevel=0.02)
    P.box(-1.15, 1.15, -1.15, 1.15, 0.64, 1.36, g, tile=1.6, bevel=0.01)
    for s in (-1, 1):            # 상층 기단 우주·탱주
        for x in (-1.1, 0.0, 1.1):
            P.box(x - 0.07, x + 0.07, s * 1.15 - 0.02, s * 1.15 + 0.02, 0.64, 1.36, g, tile=1.0)
            P.box(s * 1.15 - 0.02, s * 1.15 + 0.02, x - 0.07, x + 0.07, 0.64, 1.36, g, tile=1.0)
    P.box(-1.3, 1.3, -1.3, 1.3, 1.36, 1.52, g, tile=1.6, bevel=0.02)
    z = 1.52
    for k, (bw, bh, rw) in enumerate(((1.05, 1.0, 2.2), (0.84, 0.48, 1.9), (0.7, 0.42, 1.68))):
        P.box(-bw / 2, bw / 2, -bw / 2, bw / 2, z, z + bh, g, tile=1.2, bevel=0.01)
        for s in (-1, 1):
            for x in (-bw / 2 + 0.06, bw / 2 - 0.06):
                P.box(x - 0.06, x + 0.06, s * bw / 2 - 0.015, s * bw / 2 + 0.015, z, z + bh, g, tile=1.0)
                P.box(s * bw / 2 - 0.015, s * bw / 2 + 0.015, x - 0.06, x + 0.06, z, z + bh, g, tile=1.0)
        z += bh
        for j in range(5):       # 층급받침
            ww = bw + 0.12 + j * (rw - bw - 0.5) / 5
            P.box(-ww / 2, ww / 2, -ww / 2, ww / 2, z + j * 0.045, z + (j + 1) * 0.045, g, tile=1.2)
        z += 0.225
        R = pyramid_roof(P, rw, z + 0.08, pitch=17, t=0.17, curve=0.28, lift=0.12, mat=g, ridges=False, caps=False)
        z = R.fz(0, 0) - 0.02
        if k < 2:
            P.box(-bw * 0.42, bw * 0.42, -bw * 0.42, bw * 0.42, z - 0.05, z + 0.06, g, tile=1.0)
            z += 0.06
    P.box(-0.3, 0.3, -0.3, 0.3, z, z + 0.25, g, tile=1.0, bevel=0.01)                   # 노반
    P.add_bm(lathe_bm([(0.0, z + 0.25), (0.22, z + 0.25), (0.26, z + 0.38), (0.2, z + 0.48), (0.0, z + 0.5)], n=12), g, uv=False, smooth=True)
    for k in range(3):
        P.add_bm(lathe_bm([(0.0, z + 0.55 + k * 0.17), (0.16, z + 0.55 + k * 0.17), (0.16, z + 0.62 + k * 0.17), (0.0, z + 0.62 + k * 0.17)], n=10), g, uv=False)
    P.add_bm(tube_bm([(0, 0, z + 0.48), (0, 0, z + 1.35)], 0.04, n=6), 'iron', tile=0.5)
    return P


def _pagoda_japan(P):
    """일본 삼층 목탑: 돌 기단, 층마다 작은 몸(붉은 기둥·흰 벽·가운데 판문)에 아주 넓게 나온 기와 지붕(곡선, 귀 조금 들림), 층은 낮고 위층도 거의 같은 폭,
    높은 청동 상륜(고리 아홉 + 물불꽃 + 보주)."""
    P.box(-2.9, 2.9, -2.9, 2.9, -0.4, 0.75, 'stone', tile=1.6, bevel=0.03)
    P.box(-0.9, 0.9, -3.5, -2.9, -0.4, 0.38, 'stone', tile=1.2, bevel=0.02)
    z = 0.75
    for k in range(3):
        w = 3.5 - 0.25 * k
        h = 2.2 if k == 0 else 1.45
        cuts = []
        Ff = F_(P, '-y', -w / 2)
        lattice(Ff, cuts, 0.0, 0.95, 1.55 if k == 0 else 0.95, z + 0.12, 0.2, pattern='plank', frame='timber_red', leaves=2)
        wall_ok(P, [box_vf(-w / 2, w / 2, -w / 2, w / 2, z, z + h)], 'plaster', cuts, tile=2.2)
        for x in (-w / 2, -0.62, 0.62, w / 2):
            for y in (-w / 2, w / 2):
                P.box(x - 0.09, x + 0.09, y - 0.09, y + 0.09, z, z + h, 'timber_red', tile=1.0)
                P.box(y - 0.09, y + 0.09, x - 0.09, x + 0.09, z, z + h, 'timber_red', tile=1.0)
        P.box(-w / 2 - 0.12, w / 2 + 0.12, -w / 2 - 0.12, w / 2 + 0.12, z + h - 0.25, z + h, 'timber_red', tile=1.0)
        if k > 0:
            P.box(-w / 2 - 0.35, w / 2 + 0.35, -w / 2 - 0.35, w / 2 + 0.35, z - 0.06, z + 0.04, 'timber_red', tile=1.0)
        z += h
        zt = brackets(P, -w / 2, -w / 2, z, depth=0.6, color='wood_dark', n=1)
        pal_box(P, -w / 2 - 0.4, w / 2 + 0.4, -w / 2 - 0.4, w / 2 + 0.4, z, z + 0.3, 'wood_dark')
        pal_box(P, -w / 2 - 0.75, w / 2 + 0.75, -w / 2 - 0.75, w / 2 + 0.75, z + 0.3, z + 0.42, 'white')
        R = pyramid_roof(P, w + 3.6, z + 0.5, pitch=21, t=0.24, curve=0.26, lift=0.2, hip_h=0.18)
        z = z + 0.5 + 0.55
    finial(P, z + 0.1, n=9, r=0.36, color='bronze', h_ring=0.3)
    return P


# ───────────────────────── 대문 ─────────────────────────
def door_leaf(P, hinge, w, h, z0, ang, mat='planks', frame='timber', studs=None, sy=1):
    """문짝 하나: hinge = (x, y) 돌쩌귀 자리, w = 폭(부호 = 뻗는 쪽), ang = 안(+y)으로 연 각."""
    M = Tm(hinge[0], hinge[1], z0) @ Rz(ang)
    a, b = (0.0, w) if w > 0 else (w, 0.0)
    P.box(a, b, -0.03, 0.03, 0.0, h, mat, matrix=M, tile=1.2, bevel=0.004)
    for zz in (0.2, h * 0.5, h - 0.28):
        P.box(a + 0.04, b - 0.04, -0.05, -0.03, zz, zz + 0.07, frame, matrix=M, tile=1.0)
    if studs:
        for zz in (0.35, h * 0.5 + 0.2, h - 0.5):
            for k in range(4):
                x = a + (b - a) * (0.2 + 0.2 * k)
                pal_add(P, ellipsoid_bm((x, -0.04, zz), (0.022, 0.012, 0.022), nu=5, nv=3), studs, matrix=M)


def gate_ea():
    """대문: 중국 벽돌 문루 · 한국 평대문 · 일본 지붕 얹은 나무 문. 두 짝 문을 안으로 열어 두었다."""
    P = Piece('gate_ea', 3106)
    if CN:
        W, Hd = 2.0, 2.6
        P.box(-2.0, 2.0, -0.8, 0.8, -0.3, 0.12, 'stone', tile=1.2, bevel=0.02)
        for sx in (-1, 1):
            P.box(sx * (W / 2) - (0.0 if sx > 0 else 0.65), sx * (W / 2) + (0.65 if sx > 0 else 0.0), -0.5, 0.5, 0.12, 3.3, 'brick_grey', tile=1.4, bevel=0.01)
        P.box(-W / 2, W / 2, -0.5, 0.5, Hd + 0.12, 3.3, 'brick_grey', tile=1.4)
        pal_box(P, -0.55, 0.55, -0.52, -0.5, Hd + 0.3, Hd + 0.62, 'black')
        P.box(-W / 2 - 0.04, W / 2 + 0.04, -0.12, 0.12, 0.12, 0.25, 'stone', tile=1.0)
        for sx in (-1, 1):
            door_leaf(P, (sx * W / 2, 0.05), -sx * W / 2, Hd - 0.02, 0.14, sx * rad(-65), mat='timber_red', studs='bronze')
        R = Roof(3.6, 1.4, 3.42, 32, 0.22, 'gable', oE=0.55, oG=0.35, curve=V['curve'], lift=0.18, seed=41)
        tile_roof(P, R, raft=None, ridge_h=0.26, ridge_w=0.3)
    elif KR:
        W, Hd = 2.2, 2.45
        P.box(-1.9, 1.9, -1.0, 1.0, -0.3, 0.15, 'stone', tile=1.2, bevel=0.02)
        for sx in (-1, 1):
            post(P, sx * (W / 2 + 0.12), -0.35, 0.15, 2.95, r=0.12, mat='timber', round_=False, base='stone', base_h=0.1)
            post(P, sx * (W / 2 + 0.12), 0.35, 0.15, 2.95, r=0.1, mat='timber', round_=False, base='stone', base_h=0.1)
        P.box(-W / 2 - 0.3, W / 2 + 0.3, -0.42, 0.42, 2.85, 3.02, 'timber', tile=(1.6, 0.8), grain='x')
        P.box(-W / 2, W / 2, -0.1, 0.1, Hd + 0.15, 2.85, 'plaster', tile=2.0)
        P.box(-W / 2, W / 2, -0.07, 0.07, 0.15, 0.32, 'timber', tile=1.0)
        for sx in (-1, 1):
            door_leaf(P, (sx * W / 2, 0.05), -sx * W / 2, Hd - 0.18, 0.32, sx * rad(-70), mat='planks', studs='iron')
        R = Roof(3.4, 1.6, 3.02, 30, 0.22, 'gable', oE=0.7, oG=0.45, curve=V['curve'], lift=V['lift'] * 0.7, seed=43)
        tile_roof(P, R, raft=('front', 'back'), ridge_h=0.26, ridge_w=0.3)
    else:
        W, Hd = 2.2, 2.4
        P.box(-1.7, 1.7, -0.8, 0.8, -0.3, 0.1, 'stone', tile=1.2, bevel=0.02)
        for sx in (-1, 1):
            post(P, sx * (W / 2 + 0.1), 0.0, 0.1, 3.0, r=0.13, mat='timber', round_=False, base='stone', base_h=0.12)
        P.box(-W / 2 - 0.6, W / 2 + 0.6, -0.11, 0.11, 2.62, 2.84, 'timber', tile=(1.6, 0.8), grain='x')      # 가부키 (가로 들보)
        for sx in (-1, 1):
            P.box(sx * (W / 2 + 0.1) - 0.07, sx * (W / 2 + 0.1) + 0.07, -0.65, 0.65, 2.86, 2.98, 'timber', tile=1.0)
            door_leaf(P, (sx * W / 2, 0.06), -sx * W / 2, Hd, 0.12, sx * rad(-75), mat='boards')
        R = Roof(3.2, 1.3, 3.0, 26, 0.2, 'gable', oE=0.55, oG=0.45, curve=V['curve'], lift=V['lift'], seed=47)
        tile_roof(P, R, raft=('front', 'back'), ridge_h=0.24, ridge_w=0.28)
    return P


# ───────────────────────── 우물 ─────────────────────────
def bucket(P, M, s=1.0):
    pal_add(P, lathe_bm([(0.0, 0.0), (0.12 * s, 0.0), (0.14 * s, 0.24 * s), (0.13 * s, 0.24 * s), (0.11 * s, 0.03 * s), (0.0, 0.03 * s)], n=10), 'wood_light',
            matrix=M)
    for zz in (0.05, 0.19):
        pal_add(P, lathe_bm([(0.124 * s + zz * 0.08, zz * s), (0.127 * s + zz * 0.08, zz * s + 0.025)], n=10), 'iron', matrix=M)


def well_ea():
    """우물: 중국 네모 돌 우물 + 감개 도르래 · 한국 둥근 돌 우물 + 두레박 틀 · 일본 나무 井桁 + 도르래 + 작은 지붕. 둘레 돌 바닥."""
    P = Piece('well_ea', 3107)
    P.box(-1.5, 1.5, -1.5, 1.5, -0.25, 0.06, 'stone', tile=1.4, bevel=0.02)
    if CN:
        for (a, b, c, d) in ((-0.65, 0.65, -0.65, -0.42), (-0.65, 0.65, 0.42, 0.65), (-0.65, -0.42, -0.42, 0.42), (0.42, 0.65, -0.42, 0.42)):
            P.box(a, b, c, d, 0.06, 0.72, 'stone', tile=1.0, bevel=0.025)
        P.box(-0.42, 0.42, -0.42, 0.42, -0.2, -0.18, 'water', tile=1.0)
        for sx in (-1, 1):
            P.box(sx * 0.62 - 0.07, sx * 0.62 + 0.07, -0.07, 0.07, 0.72, 1.55, 'timber', tile=1.0)
        P.cyl(0.11, 0.11, 1.3, 'timber', n=10, matrix=Tm(-0.65, 0, 1.38) @ Ry(rad(90)), tile=0.6)
        P.add_bm(tube_bm([(0.72, 0, 1.38), (0.72, -0.32, 1.38), (0.82, -0.32, 1.38)], 0.025, n=5), 'timber', tile=0.5)
        pal_add(P, tube_bm([(0.1, 0, 1.28), (0.1, 0, 0.5)], 0.01, n=3), 'rope')
        bucket(P, Tm(0.1, 0, 0.3))
        bucket(P, Tm(-0.95, -0.85, 0.06), 1.05)
    elif KR:
        add_vf(P, ring_ok(0.78, 0.52, 0.06, 0.74, n=18), 'granite', tile=1.2)
        P.cyl(0.52, 0.52, 0.01, 'water', n=18, matrix=Tm(0, 0, -0.15), smooth=False)
        for sx in (-1, 1):
            P.box(sx * 0.95 - 0.07, sx * 0.95 + 0.07, -0.07, 0.07, 0.06, 1.75, 'timber', tile=1.0)
        P.box(-1.05, 1.05, -0.06, 0.06, 1.68, 1.8, 'timber', tile=(1.6, 0.8), grain='x')
        P.cyl(0.13, 0.13, 0.05, 'timber', n=12, matrix=Tm(0, -0.025, 1.52) @ Rx(rad(90)), tile=0.5)
        pal_add(P, tube_bm([(0.12, 0, 1.52), (0.12, 0, 0.75)], 0.01, n=3), 'rope')
        pal_add(P, tube_bm([(-0.12, 0, 1.52), (-0.35, -0.5, 0.06)], 0.01, n=3), 'rope')
        bucket(P, Tm(0.12, 0, 0.55), 0.9)
        crock(P, Tm(-1.0, -1.0, 0.06), 0.9, 'onggi', lid=False)
    else:
        for z in (0.06, 0.24, 0.42, 0.6):
            for sy in (-1, 1):
                P.box(-0.78, 0.78, sy * 0.6 - 0.09, sy * 0.6 + 0.09, z, z + 0.17, 'timber', tile=(1.6, 0.8), grain='x')
                P.box(sy * 0.6 - 0.09, sy * 0.6 + 0.09, -0.78, 0.78, z + 0.09, z + 0.18, 'timber', tile=(1.6, 0.8))
        P.cyl(0.5, 0.5, 0.01, 'water', n=14, matrix=Tm(0, 0, -0.15), smooth=False)
        for sx in (-1, 1):
            P.box(sx * 0.82 - 0.07, sx * 0.82 + 0.07, -0.07, 0.07, 0.06, 2.1, 'timber', tile=1.0)
        P.box(-0.9, 0.9, -0.06, 0.06, 1.85, 1.95, 'timber', tile=(1.6, 0.8), grain='x')
        P.cyl(0.14, 0.14, 0.06, 'timber', n=12, matrix=Tm(0, -0.03, 1.68) @ Rx(rad(90)), tile=0.5)
        pal_add(P, tube_bm([(0.13, 0, 1.68), (0.13, 0, 0.9)], 0.01, n=3), 'rope')
        bucket(P, Tm(0.13, 0, 0.66), 0.85)
        R = Roof(1.9, 1.0, 2.05, 28, 0.08, 'gable', oE=0.35, oG=0.2, curve=0.0, lift=0.0, seed=51)
        roof_ea(P, R, 'planks', res=0.3)
        P.box(-1.1, 1.1, -0.04, 0.04, R.zr - 0.02, R.zr + 0.08, 'timber', tile=1.0)
    return P


# ───────────────────────── 곳간 ─────────────────────────
def ladder(P, a, b, w=0.4, rungs=6, mat='timber'):
    a, b = Vector(a), Vector(b)
    side = Vector((1, 0, 0)) * (w / 2)
    for s in (-1, 1):
        P.add_bm(tube_bm([tuple(a + side * s), tuple(b + side * s)], 0.025, n=5), mat, tile=(0.5, 0.5))
    for k in range(rungs):
        p = a.lerp(b, (k + 0.6) / (rungs + 0.4))
        P.add_bm(tube_bm([tuple(p - side), tuple(p + side)], 0.018, n=4, ref=(0, 0, 1)), mat, tile=(0.5, 0.5))


def granary_ea():
    P = Piece('granary_ea', 3108)
    if CN:
        """중국 둥근 곡식 뒤주: 돌 밑단 + 흙 바른 둥근 통 + 원뿔 초가 + 작은 문 + 사다리."""
        import kit_southasia as KSA
        add_vf(P, ring_ok(1.55, 0.0001, -0.3, 0.45, n=20), 'stone', tile=1.4)
        cuts = []
        F = F_(P, '-y', -1.3)
        lattice(F, cuts, 0.0, 0.55, 0.7, 1.5, 0.35, pattern='plank', frame='timber', leaves=1)
        n = 22
        disc = [(1.3 * math.cos(2 * math.pi * k / n), 1.3 * math.sin(2 * math.pi * k / n)) for k in range(n)]
        wall_ok(P, [prism_ok(disc, 'z', 0.42, 2.7)], 'rammed', cuts, tile=2.0, bevel=0.03)
        for z in (0.9, 1.6, 2.3):
            add_vf(P, ring_ok(1.34, 1.29, z, z + 0.05, n=22), 'timber', tile=1.0)
        za = KSA.polar_thatch(P, lambda r: 2.62 + (1.8 - r) * 0.95, 1.8, t=0.25, n=26)
        P.add_bm(lathe_bm([(0.22, za - 0.2), (0.16, za + 0.02), (0.05, za + 0.12), (0.0, za + 0.14)], n=10), 'thatch', uv=False, smooth=True)
        ladder(P, (0.0, -1.95, 0.0), (0.0, -1.38, 1.6))
    elif KR:
        """한국 다락 곳간: 아홉 기둥 위 마루, 세로 널벽, 둥근 초가(새끼 그물), 들창, 사다리."""
        L, D, zf = 3.4, 2.6, 1.0
        for x in (-L / 2 + 0.1, 0.0, L / 2 - 0.1):
            for y in (-D / 2 + 0.1, 0.0, D / 2 - 0.1):
                post(P, x, y, 0.0, zf, r=0.08, mat='timber', round_=False, base='stone', base_h=0.1)
        P.box(-L / 2, L / 2, -D / 2, D / 2, zf, zf + 0.12, 'planks', tile=1.2)
        cuts = []
        F = F_(P, '-y', -D / 2)
        lattice(F, cuts, 0.4, 0.8, 1.0, zf + 0.35, 0.2, pattern='plank', frame='timber', leaves=1)
        wall_ok(P, [box_vf(-L / 2, L / 2, -D / 2, D / 2, zf + 0.12, zf + 1.75)], 'boards', cuts, tile=1.4)
        R = Roof(L, D, zf + 1.75, 26, 0.32, 'hip', oE=0.6, oG=0.55, curve=-0.28, hip_pitch=34, seed=53, k=0.25)
        thatch_roof_ea(P, R, noise=(0.02, 0.008), bevel=0.09)
        strawrope_net(P, R, step_x=0.55, step_y=0.5)
        ladder(P, (0.4, -D / 2 - 0.75, 0.0), (0.4, -D / 2 - 0.05, zf + 0.15))
    else:
        """일본 기둥 위 창고: 쥐막이 판을 끼운 기둥 여섯, 통나무를 가로로 쌓은 벽(아제쿠라), 가파른 맞배 초가, 사다리."""
        L, D, zf = 3.6, 2.8, 1.25
        for x in (-L / 2 + 0.15, 0.0, L / 2 - 0.15):
            for y in (-D / 2 + 0.15, D / 2 - 0.15):
                post(P, x, y, 0.0, zf, r=0.11, mat='timber', base='stone', base_h=0.1)
                P.cyl(0.32, 0.32, 0.04, 'planks', n=12, matrix=Tm(x, y, zf - 0.3), tile=0.6)
        P.box(-L / 2, L / 2, -D / 2, D / 2, zf, zf + 0.12, 'planks', tile=1.2)
        z = zf + 0.12
        k = 0
        while z < zf + 1.9:
            for (a, b, c, d) in ((-L / 2, L / 2, -D / 2 - 0.06, -D / 2 + 0.06), (-L / 2, L / 2, D / 2 - 0.06, D / 2 + 0.06)):
                P.box(a - (0.08 if k % 2 else 0.0), b + (0.08 if k % 2 else 0.0), c, d, z, z + 0.15, 'timber', tile=(1.6, 0.8), grain='x', bevel=0.02)
            for (a, b) in ((-L / 2 - 0.06, -L / 2 + 0.06), (L / 2 - 0.06, L / 2 + 0.06)):
                P.box(a, b, -D / 2 - (0.0 if k % 2 else 0.08), D / 2 + (0.0 if k % 2 else 0.08), z + 0.075, z + 0.225, 'timber', tile=(1.6, 0.8), bevel=0.02)
            z += 0.15
            k += 1
        P.box(-0.4, 0.4, -D / 2 - 0.09, -D / 2 - 0.06, zf + 0.25, zf + 1.3, 'planks', tile=1.0)
        R = Roof(L, D, z, 46, 0.4, 'gable', oE=0.55, oG=0.45, curve=0.0, seed=57)
        thatch_roof_ea(P, R, noise=(0.02, 0.008), bevel=0.08)
        P.add_bm(loft_bm([((x, 0, R.zr + 0.05), 0.3, 0.16) for x in lin(-R.xe, R.xe, 6)], n=8, expo=2.6, ref=(0, 0, 1)), 'thatch', tile=(0.9, 0.9), smooth=True)
        ladder(P, (0.0, -D / 2 - 0.9, 0.0), (0.0, -D / 2 - 0.1, zf + 0.15))
    return P


# ───────────────────────── 대장간 ─────────────────────────
def smithy_ea():
    """대장간: 앞이 트인 헛간 (뒷벽·옆벽 = 땅 변형의 흙벽·판벽), 앞 기둥 둘·도리, 맞배 초가(일본은 기와), 흙 화덕(숯불 + smithy_forge),
    상자 풀무(손잡이), 그루터기 위 쇠 모루, 물통, 벽에 건 연장, 숯 가마니. 잉글랜드 smithy 와 같은 자리 약속 (모루 = 로컬 (0.55, +0.6), 화덕 = (-1.25, -1.0))."""
    P = Piece('smithy_ea', 3109)
    L, D, H, pitch = 6.4, 6.0, 2.5, 30
    x0, x1, y0, y1 = -L / 2, L / 2, -D / 2, D / 2
    wm = 'rammed' if CN else ('earth' if KR else 'boards')
    P.box(x0 - 0.1, x1 + 0.1, y0 - 0.1, y1 + 0.1, -0.45, 0.1, 'stone' if not CN else 'rammed', bevel=0.03, tile=2.0)
    wall_ok(P, [box_vf(x0, x1, y1 - 0.35, y1, 0.05, H)], wm, [], tile=2.0, bevel=0.03)
    for (a, b) in ((x0, x0 + 0.35), (x1 - 0.35, x1)):
        wall_ok(P, [prism_ok(KE.gable_profile(-0.8, y1, H, pitch, 0.05), 'x', a, b)], wm, [], tile=2.0, bevel=0.03)
    for px in (x0 + 0.35, x1 - 0.35):
        post(P, px, y0 + 0.35, 0.1, H + 0.1, r=0.12, mat='timber', round_=False, base='stone', base_h=0.1)
    P.beam((x0 - 0.1, y0 + 0.35, H + 0.04), (x1 + 0.1, y0 + 0.35, H + 0.04), 0.2, 0.2, 'timber')
    R = Roof(L, D, H, pitch, 0.28 if not JP else 0.22, 'gable', oE=0.55, oG=0.4, curve=0.02 if not JP else V['curve'], seed=61)
    if JP:
        tile_roof(P, R, raft=('front',))
    else:
        thatch_roof_ea(P, R)
        P.add_bm(loft_bm([((x, 0, R.zr + 0.04), 0.24, 0.12) for x in lin(-R.xe, R.xe, 6)], n=8, expo=2.2, ref=(0, 0, 1)), 'thatch' if KR else 'rammed',
                 tile=(1.0, 1.0), smooth=True)
    hx, hy = -1.25, 1.0
    wall_ok(P, [box_vf(hx - 0.8, hx + 0.8, hy - 0.55, hy + 0.55, 0.05, 0.72)], 'rammed' if CN else 'earth', [], tile=1.6, bevel=0.05)
    P.box(hx - 0.4, hx + 0.4, hy - 0.32, hy + 0.2, 0.72, 0.8, 'coals', tile=1.0)
    for (a, b, c, d) in ((hx - 0.55, hx + 0.55, hy - 0.45, hy - 0.32), (hx - 0.55, hx - 0.4, hy - 0.45, hy + 0.35), (hx + 0.4, hx + 0.55, hy - 0.45, hy + 0.35),
                         (hx - 0.55, hx + 0.55, hy + 0.2, hy + 0.35)):
        P.box(a, b, c, d, 0.72, 0.88, 'stone', bevel=0.02, tile=1.0)
    P.marker('smithy_forge', (hx, hy - 0.06, 0.85))
    # 상자 풀무 (옆에 손잡이 막대) + 바람 대롱
    P.box(hx + 0.95, hx + 1.95, hy - 0.2, hy + 0.2, 0.05, 0.5, 'planks', tile=1.0, bevel=0.01)
    P.add_bm(tube_bm([(hx + 1.95, hy, 0.3), (hx + 2.35, hy, 0.3), (hx + 2.35, hy - 0.12, 0.3)], 0.02, n=5), 'timber', tile=0.5)
    P.beam((hx + 0.95, hy, 0.25), (hx + 0.55, hy, 0.55), 0.06, 0.06, 'iron', bevel=0.0)
    ax, ay = 0.55, -0.6
    P.cyl(0.26, 0.24, 0.5, 'timber', n=12, matrix=Tm(ax, ay, 0.05), tile=1.0)
    P.box(ax - 0.16, ax + 0.16, ay - 0.11, ay + 0.11, 0.55, 0.68, 'iron', bevel=0.01, tile=1.0)
    P.box(ax - 0.2, ax + 0.2, ay - 0.13, ay + 0.13, 0.68, 0.77, 'iron', bevel=0.015, tile=1.0)
    P.add_bm(lathe_bm([(0.0, 0.0), (0.3, 0.0), (0.32, 0.45), (0.29, 0.45), (0.27, 0.05), (0.0, 0.05)], n=12), 'planks', uv=False, matrix=Tm(x1 - 0.9, -0.3, 0.05))
    P.cyl(0.27, 0.27, 0.01, 'water', n=12, matrix=Tm(x1 - 0.9, -0.3, 0.42), smooth=False)
    for k in range(5):
        tx2 = 0.5 + k * 0.22
        P.box(tx2 - 0.015, tx2 + 0.015, y1 - 0.4, y1 - 0.37, 1.0 + (k % 2) * 0.1, 1.6, 'iron', tile=1.0)
    P.box(0.35, 1.55, y1 - 0.43, y1 - 0.35, 1.57, 1.65, 'timber', tile=1.0)
    for k in range(2):           # 숯 가마니
        P.add_bm(KP.sack_bm(P.rng, h=0.55, r=0.24), 'thatch', tile=0.6, smooth=True, matrix=Tm(x0 + 0.8 + k * 0.5, y1 - 0.9, 0.05) @ Rz(0.4 * k))
    smoke(P, 'smithy_ea', (hx, hy + 0.3, R.zr + 0.2))
    return P


# ───────────────────────── 마을 신당 ─────────────────────────
def shrine_ea():
    """마을 신당: 가운데(원점)에 장면이 큰 마을 나무를 세운다 — 둘레 낮은 돌 단. 중국: 작은 벽돌 토지묘(기와 지붕) + 향로 ·
    한국: 서낭당 돌무더기 + 솟대 둘 + 나무에 감은 금줄·오방색 천 · 일본: 작은 나무 사당(돌 받침) + 붉은 도리이 + 나무에 감은 시메나와."""
    P = Piece('shrine_ea', 3110)
    add_vf(P, ring_ok(1.6, 0.85, -0.3, 0.32, n=24), 'stone', tile=1.4)
    P.marker('shrine_ea_trunk', (0.0, 0.0, 0.32))
    if CN:
        x, y = 0.0, -2.35
        P.box(x - 0.75, x + 0.75, y - 0.55, y + 0.55, -0.2, 0.45, 'stone', tile=1.0, bevel=0.02)
        cuts = []
        F = F_(P, '-y', y - 0.42)
        cuts.append(F.cutter(-0.25, 0.25, 0.65, 1.25, 0.35, arch='round'))
        F.box(-0.25, 0.25, 0.3, 0.34, 0.65, 1.5, 'glass', tile=1.0)
        wall_ok(P, [box_vf(x - 0.55, x + 0.55, y - 0.42, y + 0.42, 0.45, 1.55)], 'brick_grey', cuts, tile=1.2)
        pal_box(P, -0.2, 0.2, y - 0.3, y - 0.1, 0.65, 0.95, 'stone_grey')
        R = Roof(1.1, 0.84, 1.55, 30, 0.12, 'gable', oE=0.3, oG=0.22, curve=V['curve'], lift=0.08, cy=y, seed=71)
        tile_roof(P, R, raft=None, ridge_h=0.16, ridge_w=0.18, caps=False)
        pal_add(P, lathe_bm([(0.0, 0.0), (0.14, 0.0), (0.18, 0.12), (0.16, 0.2), (0.0, 0.2)], n=10), 'bronze', matrix=Tm(0.0, y - 0.85, 0.45 + 0.0))
        P.box(-0.35, 0.35, y - 1.05, y - 0.65, -0.2, 0.45, 'stone', tile=1.0)
        for k in range(3):
            pal_add(P, tube_bm([(-0.05 + k * 0.05, y - 0.85, 0.65), (-0.05 + k * 0.05, y - 0.85, 0.95)], 0.005, n=3), 'incense')
        for sx in (-1, 1):
            pal_box(P, sx * 0.48 - 0.06, sx * 0.48 + 0.06, y - 0.44, y - 0.425, 0.7, 1.4, 'cinnabar')
    elif KR:
        # 서낭당 돌무더기 (원뿔꼴로 쌓은 막돌)
        rng = P.rng
        cx, cy = -1.9, -1.2
        for ring in range(6):
            rr = 0.9 * (1 - ring / 6.5)
            n = max(3, int(2 * math.pi * rr / 0.28))
            for k in range(n):
                a = 2 * math.pi * k / n + ring * 0.6
                s = rng.uniform(0.85, 1.15)
                pal_add(P, ellipsoid_bm((cx + rr * math.cos(a), cy + rr * math.sin(a), 0.1 + ring * 0.17), (0.17 * s, 0.14 * s, 0.11 * s), nu=6, nv=4,
                                        rot=Rz(rng.uniform(0, 6.3)).to_3x3()), 'stone_grey' if (k + ring) % 3 else 'stone_dark')
        # 제단 돌
        P.box(-0.5, 0.5, -1.45, -1.05, -0.2, 0.42, 'granite', tile=1.0, bevel=0.03)
        # 솟대 둘 (긴 장대 끝 나무 새)
        for (sx, sy, hh) in ((1.9, -1.6, 4.2), (2.3, -0.9, 3.6)):
            P.add_bm(tube_bm([(sx, sy, -0.3), (sx + 0.03, sy, hh)], [0.05, 0.035], n=6), 'timber', tile=(0.5, 0.5))
            pal_add(P, loft_bm([((sx - 0.05, sy, hh + 0.02), 0.015, 0.015), ((sx + 0.05, sy, hh + 0.06), 0.045, 0.05), ((sx + 0.2, sy, hh + 0.08), 0.04, 0.045),
                                ((sx + 0.28, sy, hh + 0.12), 0.025, 0.025), ((sx + 0.33, sy, hh + 0.12), 0.008, 0.008)], n=6), 'wood_light')
        # 나무 둘레 금줄 + 오방색 천 (줄기 반지름 ~0.55 m 둘레, 높이 1.6)
        n = 20
        pts = [(0.62 * math.cos(2 * math.pi * k / n), 0.62 * math.sin(2 * math.pi * k / n), 1.6 + 0.04 * math.sin(k)) for k in range(n + 1)]
        pal_add(P, tube_bm(pts, 0.025, n=4), 'rope')
        for k, col in enumerate(['ribbon_red', 'ribbon_blue', 'ribbon_yellow', 'white', 'black', 'ribbon_red', 'white', 'ribbon_blue']):
            a = 2 * math.pi * (k + 0.3) / 8
            px, py = 0.66 * math.cos(a), 0.66 * math.sin(a)
            for d, face in ((0.003, (0, 1, 2, 3)), (-0.003, (3, 2, 1, 0))):
                v = [(px - 0.05 * math.sin(a), py + 0.05 * math.cos(a) + d, 1.6), (px + 0.05 * math.sin(a), py - 0.05 * math.cos(a) + d, 1.6),
                     (px + 0.04 * math.sin(a) + 0.03 * math.cos(a), py - 0.04 * math.cos(a) + 0.03 * math.sin(a) + d, 1.0),
                     (px - 0.04 * math.sin(a) + 0.03 * math.cos(a), py + 0.04 * math.cos(a) + 0.03 * math.sin(a) + d, 1.05)]
                pal_add(P, K.bm_from(v, [face]), col, smooth=False)
    else:
        # 작은 나무 사당 (돌 받침 위)
        x, y = 0.0, -2.2
        P.box(x - 0.65, x + 0.65, y - 0.55, y + 0.55, -0.2, 0.5, 'stone', tile=1.0, bevel=0.02)
        P.box(x - 0.42, x + 0.42, y - 0.36, y + 0.36, 0.5, 1.25, 'planks', tile=1.0)
        P.box(x - 0.3, x + 0.3, y - 0.38, y - 0.36, 0.62, 1.12, 'glass', tile=1.0)
        R = Roof(0.84, 0.72, 1.25, 38, 0.08, 'gable', oE=0.32, oG=0.22, curve=0.12, lift=0.0, cy=y, seed=73)
        roof_ea(P, R, 'planks', res=0.2)
        for sx in (-1, 1):       # 박공 끝 엇갈린 장식 막대
            P.add_bm(tube_bm([(sx * 0.42, y - 0.5, R.zr - 0.25), (sx * 0.42, y + 0.5, R.zr + 0.32)], 0.025, n=4), 'timber', tile=0.5)
        # 붉은 도리이
        ty = -3.6
        for sx in (-1, 1):
            P.add_bm(tube_bm([(sx * 0.85, ty, -0.2), (sx * 0.8, ty, 2.35)], [0.11, 0.09], n=10), 'timber_red', tile=(0.6, 0.6))
            P.box(sx * 0.85 - 0.14, sx * 0.85 + 0.14, ty - 0.14, ty + 0.14, -0.2, 0.15, 'stone', tile=0.8)
        P.box(-1.15, 1.15, ty - 0.07, ty + 0.07, 1.85, 2.0, 'timber_red', tile=1.0)
        pts = [(x, ty, 2.42 + 0.1 * (abs(x) / 1.45) ** 2) for x in lin(-1.45, 1.45, 10)]
        E.ridge_line(P, pts, 0.2, 0.18, 'timber_red', n=6, expo=4.0)
        E.ridge_line(P, [(x, ty, z + 0.08) for (x, _, z) in pts], 0.24, 0.07, 'ridge', n=6, expo=4.0)
        # 나무 둘레 시메나와 + 종이 술
        n = 20
        pts = [(0.62 * math.cos(2 * math.pi * k / n), 0.62 * math.sin(2 * math.pi * k / n), 1.7) for k in range(n + 1)]
        pal_add(P, tube_bm(pts, 0.05, n=5), 'straw')
        for k in range(4):
            a = 2 * math.pi * (k + 0.5) / 4 + 1.2
            px, py = 0.68 * math.cos(a), 0.68 * math.sin(a)
            for j in range(3):
                pal_box(P, px - 0.04, px + 0.04, py - 0.01, py + 0.01, 1.62 - j * 0.1, 1.68 - j * 0.1, 'white')
    return P


# ───────────────────────── 장터 좌판 ─────────────────────────
def stall_ea():
    """장터 좌판: 기둥 넷 위 거적 차양 (뒤 2.75 m → 앞 2.3 m), 널 평상 위 바구니(배추·무·감·콩)·옹기·피륙, 땅에 큰 옹기."""
    P = Piece('stall_ea', 3111)
    for (x, y, h) in ((-1.55, -1.1, 2.3), (1.55, -1.1, 2.3), (-1.55, 1.1, 2.75), (1.55, 1.1, 2.75)):
        P.add_bm(tube_bm([(x, y, -0.2), (x, y, h)], 0.045, n=6), 'timber', tile=(0.5, 0.5))
    def fz(x, y):
        return 2.3 + (y + 1.1) / 2.2 * 0.45 + 0.03 * math.sin(x * 2.0)
    ob = K.heightfield(fz, lin(-1.85, 1.85, 8), lin(-1.45, 1.35, 6), 0.03, uvfn=K.slope_uv(1.2, 1.2, 12), name='mat')
    P.add_obj(ob, 'thatch', keep_uv=True)
    for y in (-1.1, 1.1):
        P.beam((-1.7, y, fz(0, y) - 0.06), (1.7, y, fz(0, y) - 0.06), 0.06, 0.06, 'timber')
    P.box(-1.35, 1.35, -0.85, 0.35, 0.6, 0.68, 'planks', tile=1.2, bevel=0.008)
    for x in (-1.25, 1.25):
        for y in (-0.75, 0.25):
            P.box(x - 0.04, x + 0.04, y - 0.04, y + 0.04, 0.0, 0.6, 'timber', tile=1.0)
    shop_goods(P, -1.25, 1.3, -0.25, 0.68, P.rng)
    crock(P, Tm(-1.0, 0.85, 0.0), 1.15, 'onggi')
    crock(P, Tm(-0.4, 0.95, 0.0), 0.9, 'onggi_dark')
    pal_add(P, lathe_bm([(0.0, 0.0), (0.3, 0.0), (0.34, 0.26), (0.0, 0.24)], n=12), 'straw_dark', matrix=Tm(0.7, 0.8, 0.0))
    for k in range(6):
        a = k * 2.4
        pal_add(P, ellipsoid_bm((0.7 + 0.12 * math.cos(a), 0.8 + 0.12 * math.sin(a), 0.3), (0.1, 0.1, 0.08), nu=7, nv=4), 'cabbage')
    return P


# ───────────────────────── 움집 · 야영 화덕 ─────────────────────────
def pit_house_ea():
    """움집 (신석기·청동기 일반형): 둥근 흙 둑 위로 원뿔 초가가 땅까지, 꼭대기 연기 구멍 덮개(작은 맞배), 앞 맞배 들머리."""
    import kit_southasia as KSA
    P = Piece('pit_house_ea', 3112)
    add_vf(P, ring_ok(3.0, 2.3, -0.3, 0.3, n=24), 'earth', tile=2.0)
    za = KSA.polar_thatch(P, lambda r: 0.25 + (3.05 - r) * 1.18, 3.05, t=0.3, n=30, dr=0.2)
    # 연기 구멍 덮개
    R = Roof(0.9, 0.6, za - 0.15, 40, 0.12, 'gable', oE=0.25, oG=0.15, curve=0.0, seed=81)
    thatch_roof_ea(P, R, res=0.15, noise=(0.01, 0.0), bevel=0.03)
    # 들머리 (앞 -y): 작은 맞배 초가 + 어두운 입구
    R2 = Roof(1.2, 1.5, 1.35, 42, 0.18, 'gable', oE=0.18, oG=0.15, curve=0.0, seed=83)
    # 들머리 지붕을 앞으로 옮긴다 (긴 축을 y 로: 맞배가 앞을 본다)
    sub = Piece('_porch', 85)
    thatch_roof_ea(sub, R2, res=0.15, noise=(0.01, 0.0), bevel=0.04)
    bm = sub.bm
    bmesh.ops.transform(bm, matrix=Tm(0, -2.75, -0.15) @ Rz(rad(90)), verts=bm.verts)
    _absorb(P, sub)
    P.box(-0.42, 0.42, -3.35, -3.3, 0.0, 1.05, 'glass', tile=1.0)
    for sx in (-1, 1):
        P.add_bm(tube_bm([(sx * 0.5, -3.4, 0.0), (sx * 0.5, -3.4, 1.15)], 0.05, n=5), 'timber', tile=(0.5, 0.5))
    smoke(P, 'pit_house_ea', (0.0, 0.0, za + 0.2))
    return P


def _absorb(P, sub):
    """하위 Piece 의 bmesh 를 P 에 그대로 합친다 (재료·UV 유지)."""
    uvl = sub.uvl
    vmap = {}
    for v in sub.bm.verts:
        vmap[v] = P.bm.verts.new(v.co)
        fb = P.foot
        fb[0], fb[1] = min(fb[0], v.co.x), max(fb[1], v.co.x)
        fb[2], fb[3] = min(fb[2], v.co.y), max(fb[3], v.co.y)
    for f in sub.bm.faces:
        try:
            nf = P.bm.faces.new([vmap[v] for v in f.verts])
        except ValueError:
            continue
        nf.material_index = P.mi(sub.mats[f.material_index])
        nf.smooth = f.smooth
        for ls, ld in zip(f.loops, nf.loops):
            ld[P.uvl].uv = ls[uvl].uv
    sub.bm.free()


def camp_hearth():
    """야영 화덕 (농사 전 생의 일터): 돌 둘레 불자리(숯불 + smithy_forge), 걸쳐 놓은 장작, 바람막이(장대 + 이엉), 고기·가죽 건조대,
    일하는 넓적돌(모루 자리 (0.55, +0.6))과 뗀석기, 통나무 걸상 둘."""
    P = Piece('camp_hearth', 3113)
    rng = P.rng
    hx, hy = -1.25, 1.0
    for k in range(12):
        a = 2 * math.pi * k / 12
        s = rng.uniform(0.85, 1.15)
        pal_add(P, ellipsoid_bm((hx + 0.62 * math.cos(a), hy + 0.62 * math.sin(a), 0.06), (0.16 * s, 0.13 * s, 0.11 * s), nu=6, nv=4,
                                rot=Rz(a).to_3x3()), 'stone_grey' if k % 3 else 'stone_dark')
    P.cyl(0.48, 0.48, 0.05, 'coals', n=12, matrix=Tm(hx, hy, 0.0), smooth=False)
    P.marker('smithy_forge', (hx, hy - 0.06, 0.2))
    for k in range(4):
        a = k * 1.6 + 0.3
        P.add_bm(tube_bm([(hx + 0.55 * math.cos(a), hy + 0.55 * math.sin(a), 0.08), (hx + 0.05 * math.cos(a), hy + 0.05 * math.sin(a), 0.42)], 0.05, n=5),
                 'timber', tile=(0.5, 0.5))
    # 바람막이 (뒤): 장대 틀 + 이엉
    def fz(x, y):
        return 0.2 + (2.6 - y) * 0.9
    ob = K.heightfield(fz, lin(-2.4, 0.4, 8), lin(1.75, 2.55, 3), 0.12, bevel_w=0.04, bevel_seg=1, uvfn=K.slope_uv(2.0, 2.0, 42), name='screen')
    P.add_obj(ob, 'thatch', keep_uv=True, smooth=True)
    for x in (-2.3, -1.0, 0.3):
        P.add_bm(tube_bm([(x, 2.65, -0.1), (x, 1.6, 1.15)], 0.035, n=5), 'timber', tile=(0.5, 0.5))
    # 건조대: 두 갈래 장대 + 가로대 + 매단 고기·가죽
    for x in (0.6, 2.2):
        for s in (-1, 1):
            P.add_bm(tube_bm([(x + s * 0.25, 1.4, -0.1), (x, 1.4, 1.6)], 0.03, n=5), 'timber', tile=(0.5, 0.5))
    P.add_bm(tube_bm([(0.5, 1.4, 1.55), (2.3, 1.4, 1.55)], 0.03, n=5, ref=(0, 0, 1)), 'timber', tile=(0.5, 0.5))
    for k in range(5):
        x = 0.85 + k * 0.3
        pal_add(P, ellipsoid_bm((x, 1.4, 1.3), (0.06, 0.02, 0.2), nu=6, nv=4), 'dark_brown' if k % 2 else 'cloth_brown')
    # 일하는 넓적돌 + 뗀석기, 통나무 걸상
    pal_add(P, ellipsoid_bm((0.55, -0.6, 0.2), (0.42, 0.34, 0.24), nu=10, nv=6), 'stone_grey')
    for k in range(4):
        pal_add(P, ellipsoid_bm((0.4 + k * 0.1, -0.45 - 0.05 * k, 0.43), (0.05, 0.03, 0.015), nu=5, nv=3, rot=Rz(k).to_3x3()), 'stone_dark')
    for (x, y, a) in ((-2.3, 0.2, 0.3), (0.0, 1.95, 1.4)):
        P.add_bm(tube_bm([(x - 0.6 * math.cos(a), y - 0.6 * math.sin(a), 0.16), (x + 0.6 * math.cos(a), y + 0.6 * math.sin(a), 0.16)], 0.16, n=8, ref=(0, 0, 1)),
                 'timber', tile=(0.6, 0.6))
    smoke(P, 'camp_hearth', (hx, hy, 1.4))
    return P


# ───────────────────────── 큰 집: 큰 저택 (courtyard_estate) ─────────────────────────
def courtyard_estate():
    """동아시아 큰 집 (대저택):
    - 한국: 솟을대문 행랑채 + 안마당(디딤돌·장독대) + 높은 기단 팔작기와 본채(대청·툇마루) + 굴뚝
    - 중국: 사합원 도좌방/광량대문 + 안마당(석조 수반) + 청벽돌 박공 본채(정방·화창)
    - 일본: 나가야몬(무사실) + 안마당(토비이시·석등) + 엔가와 팔작기와 본채(슈야·쇼지)
    """
    P = Piece('courtyard_estate', 3114)
    if CN:
        return _estate_china(P)
    if KR:
        return _estate_korea(P)
    return _estate_japan(P)


def _estate_korea(P):
    """한국 양반 종가 대저택:
    - 앞쪽 솟을대문 행랑채: 가운데 우뚝 솟은 솟을대문(두 짝 판문 + 철물), 좌우 행랑방(띠살문, 온돌방, 광)
    - 넓은 안마당: 디딤돌, 장독대(옹기 4개)
    - 뒤쪽 본채: 높은 화강암 기단, 3단 계단, 가운데 넓은 대청마루(우물마루, 뒤 판문), 양옆 방 띠살문,
      앞 툇마루, 네모 기둥과 인방, 웅장한 팔작기와 지붕(곡선·귀들림·흰 양성바름 용마루/내림마루, 막새, 서까래)
    - 뒤뜰 전통 굴뚝 + 연기 마커
    """
    # 1. 앞쪽 행랑채 (y: -5.8 ~ -3.6)
    P.box(-7.8, 7.8, -5.8, -3.6, -0.4, 0.18, 'stone', tile=1.4, bevel=0.02)
    # 솟을대문 기둥 넷 + 들보
    for sx in (-1, 1):
        post(P, sx * 1.5, -5.5, 0.18, 3.4, r=0.12, mat='timber', round_=False, base='stone', base_h=0.1)
        post(P, sx * 1.5, -3.9, 0.18, 3.4, r=0.11, mat='timber', round_=False, base='stone', base_h=0.1)
    P.box(-1.7, 1.7, -5.6, -3.8, 3.3, 3.45, 'timber', tile=(1.6, 0.8), grain='x')
    P.box(-1.45, 1.45, -4.75, -4.65, 2.65, 3.3, 'plaster', tile=2.0)
    # 대문 문짝 두 짝
    door_leaf(P, (-1.3, -4.7), 1.3, 2.45, 0.18, rad(-65), mat='planks', studs='iron')
    door_leaf(P, (1.3, -4.7), -1.3, 2.45, 0.18, rad(-65), mat='planks', studs='iron')
    # 솟을대문 지붕 (맞배)
    R_gate = Roof(4.2, 3.0, 3.45, 30, 0.22, 'gable', oE=0.65, oG=0.45, curve=V['curve'], lift=V['lift'] * 0.7, cy=-4.7, seed=61)
    tile_roof(P, R_gate, caps=False, raft=None, res=0.35, ridge_h=0.26, ridge_w=0.3)

    # 좌우 행랑방
    for sx, a, b in ((-1, -7.6, -1.5), (1, 1.5, 7.6)):
        cuts = []
        Ff = F_(P, '-y', -5.6)
        if sx < 0:
            lattice(Ff, cuts, -4.5, 1.1, 1.25, 0.55, 0.25, pattern='ttisal', frame='timber', bar='timber', leaves=2)
            lattice(Ff, cuts, -2.8, 0.9, 1.8, 0.18, 0.25, pattern='plank', frame='timber', leaves=2)
        else:
            lattice(Ff, cuts, 4.5, 1.2, 1.9, 0.18, 0.25, pattern='plank', frame='timber', leaves=2)
        wall_ok(P, [box_vf(a, b, -5.6, -3.8, 0.16, 2.65)], 'plaster', cuts, tile=2.2)
        for x in (a, (a + b) / 2, b):
            post(P, x, -5.6, 0.18, 2.68, r=0.1, mat='timber', round_=False, base='stone', base_h=0.08)
            post(P, x, -3.8, 0.18, 2.68, r=0.1, mat='timber', round_=False, base='stone', base_h=0.08)
    R_front = Roof(15.2, 2.2, 2.65, 27, 0.2, 'gable', oE=0.55, oG=0.4, curve=V['curve'], lift=V['lift'] * 0.6, cy=-4.7, seed=62)
    tile_roof(P, R_front, caps=False, raft=None, res=0.36, ridge_h=0.24, ridge_w=0.28)

    # 2. 안마당 (y: -3.6 ~ 0.7)
    # 디딤돌 5개
    for y in lin(-3.0, 0.4, 5):
        P.box(-0.35, 0.35, y - 0.2, y + 0.2, -0.05, 0.05, 'stone', bevel=0.015, tile=1.2)
    # 장독대 (안마당 동쪽)
    P.box(4.8, 6.6, -2.0, -0.5, -0.1, 0.22, 'stone', tile=1.4, bevel=0.02)
    crock(P, Tm(5.3, -1.5, 0.22), 1.15, 'onggi')
    crock(P, Tm(6.1, -1.5, 0.22), 0.95, 'onggi_dark')
    crock(P, Tm(5.7, -0.8, 0.22), 1.05, 'onggi')

    # 3. 본채 사랑채/안채 (y: 0.7 ~ 6.2)
    zb = 0.72
    zf = zb + 0.42     # 마루 높이 1.14
    plinth(P, -7.8, 7.8, 0.7, 6.3, -0.45, zb, mat='stone', steps=[(0.0, 2.8, '-y', 2)])

    bx = [-7.2, -2.6, 0.0, 2.6, 7.2]
    cuts = []
    Ff = F_(P, '-y', 1.5)
    Fb = F_(P, '+y', 5.8)

    # 대청마루 (가운데 칸 x: -2.6 ~ 2.6)
    P.box(-2.6, 2.6, 1.5, 5.8, zf - 0.1, zf, 'floor', tile=1.4)
    # 대청 뒤 판문
    for k in (-1, 1):
        lattice(Fb, cuts, Fb.loc(k * 1.3), 1.3, 1.7, zf, 0.25, pattern='plank', frame='timber', leaves=2)

    # 좌우 방 띠살문
    for (a, b) in ((bx[0], bx[1]), (bx[3], bx[4])):
        c = (a + b) / 2
        lattice(Ff, cuts, c, 1.5, 1.45, zf + 0.4, 0.25, pattern='ttisal', frame='timber', bar='timber', leaves=2)
        lattice(Fb, cuts, Fb.loc(c), 0.75, 0.65, zf + 0.95, 0.25, pattern='ttisal', leaves=1)

    # 방 벽체 (흰 회벽)
    wall_ok(P, [box_vf(bx[0], bx[1], 1.5, 1.66, zb - 0.02, 3.65), box_vf(bx[3], bx[4], 1.5, 1.66, zb - 0.02, 3.65)], 'plaster', cuts, tile=2.2)
    wall_ok(P, [box_vf(-7.2, 7.2, 5.64, 5.8, zb - 0.02, 3.65)], 'plaster', cuts, tile=2.2)
    for (a, b) in ((-7.2, -7.04), (7.04, 7.2)):
        wall_ok(P, [box_vf(a, b, 1.5, 5.8, zb - 0.02, 3.65)], 'plaster', [], tile=2.2)

    # 앞 툇마루
    P.box(-7.2, 7.2, 0.75, 1.5, zf - 0.1, zf, 'floor', tile=1.4, bevel=0.008)
    P.box(-7.2, 7.2, 0.73, 0.83, zb, zf - 0.1, 'timber', tile=1.0)

    # 기둥 (앞 툇간 줄·벽 줄·뒤 줄) + 인방
    for x in bx:
        post(P, x, 0.85, zb, 3.73, r=0.12, mat='timber', round_=False, base='stone', base_h=0.12)
        post(P, x, 1.58, zb, 3.73, r=0.11, mat='timber', round_=False, base=None)
        post(P, x, 5.72, zb, 3.73, r=0.11, mat='timber', round_=False, base=None)
    for y in (1.56, 5.74):
        for z in (zf + 0.3, 3.5):
            P.box(-7.2, 7.2, y - 0.06, y + 0.06, z - 0.07, z + 0.07, 'timber', tile=(1.6, 0.8), bevel=0.008, grain='x')
    P.beam((-7.3, 0.85, 3.67), (7.3, 0.85, 3.67), 0.2, 0.24, 'timber')
    for x in bx:
        P.beam((x, 0.85, 3.57), (x, 1.58, 3.57), 0.12, 0.16, 'timber')

    # 본채 팔작지붕
    R_main = Roof(14.8, 5.6, 3.65, 31, 0.32, 'hipgable', oE=1.5, oG=1.4, curve=V['curve'], lift=V['lift'], cy=3.4, setback=1.8, seed=65)
    tile_roof(P, R_main, caps=False, raft=('front',), res=0.36, gable_mat='timber', ridge_h=0.38, ridge_w=0.4, hip_h=0.28)

    # 뒤뜰 굴뚝
    chimney_kr(P, 6.8, 6.5, 1.6)
    smoke(P, 'courtyard_estate', (6.8, 6.5, 2.1))
    return P


def _estate_china(P):
    """중국 사합원 고택:
    - 앞채: 청벽돌 도좌방 + 웅장한 광량대문(붉은 판문·황동 못·문루)
    - 안마당: 청벽돌 포장 바닥 + 석조 수반/향로 + 석등
    - 좌우 상방: 청벽돌 외벽 맞배집
    - 뒤쪽 정방(본채): 돌 기단 + 3단 계단, 붉은 두리기둥 툇간, 정면 조각 화창, 맞배 기와지붕(치미 장식), 등롱 둘
    - 연기 마커
    """
    # 1. 앞채 (도좌방 & 광량대문, y: -5.8 ~ -3.6)
    P.box(-7.8, 7.8, -5.8, -3.6, -0.4, 0.15, 'stone', tile=1.4, bevel=0.02)
    # 광량대문 (중앙)
    W_gate, Hd = 2.2, 2.7
    for sx in (-1, 1):
        P.box(sx * (W_gate / 2) - (0.0 if sx > 0 else 0.7), sx * (W_gate / 2) + (0.7 if sx > 0 else 0.0), -5.6, -3.8, 0.15, 3.4, 'brick_grey', tile=1.4, bevel=0.01)
    P.box(-W_gate / 2, W_gate / 2, -5.6, -3.8, Hd + 0.15, 3.4, 'brick_grey', tile=1.4)
    pal_box(P, -0.6, 0.6, -5.62, -5.6, Hd + 0.35, Hd + 0.65, 'black')      # 편액
    door_leaf(P, (-W_gate / 2, -4.7), W_gate / 2, Hd - 0.05, 0.15, rad(-65), mat='timber_red', studs='bronze')
    door_leaf(P, (W_gate / 2, -4.7), -W_gate / 2, Hd - 0.05, 0.15, rad(-65), mat='timber_red', studs='bronze')
    R_gate = Roof(4.2, 2.8, 3.5, 32, 0.24, 'gable', oE=0.6, oG=0.4, curve=V['curve'], lift=0.18, cy=-4.7, seed=71)
    tile_roof(P, R_gate, caps=False, raft=None, res=0.35, ridge_h=0.28, ridge_w=0.32)

    # 좌우 도좌방 (청벽돌)
    for a, b in ((-7.6, -1.6), (1.6, 7.6)):
        cuts = []
        Ff = F_(P, '-y', -5.6)
        lattice(Ff, cuts, (a + b) / 2, 1.4, 1.1, 1.0, 0.35, pattern='grid', frame='timber_red', bar='timber_red', leaves=2)
        wall_ok(P, [box_vf(a, b, -5.6, -3.8, 0.15, 2.75)], 'brick_grey', cuts, tile=1.4)
    R_front = Roof(15.2, 2.2, 2.75, 28, 0.22, 'gable', oE=0.5, oG=0.35, curve=V['curve'], lift=0.15, cy=-4.7, seed=72)
    tile_roof(P, R_front, caps=False, raft=('front',), res=0.35, gable_mat='brick_grey')

    # 2. 안마당 (y: -3.6 ~ 0.7)
    P.box(-3.5, 3.5, -3.4, 0.7, 0.0, 0.06, 'brick_grey', tile=1.4)
    # 중앙 석조 수반
    P.box(-0.65, 0.65, -1.6, -0.4, 0.06, 0.45, 'stone', tile=1.0, bevel=0.02)
    # 석등
    P.box(3.5, 4.3, -1.8, -1.0, 0.0, 1.25, 'stone', tile=1.0, bevel=0.02)
    P.box(3.7, 4.1, -1.6, -1.2, 1.25, 1.55, 'glass', tile=1.0)

    # 3. 본채 정방 (y: 0.7 ~ 6.2)
    zb = 0.55
    plinth(P, -7.8, 7.8, 0.7, 6.3, -0.45, zb, mat='stone', steps=[(0.0, 2.6, '-y', 3)])
    porch = 1.1
    cuts = []
    Ff = F_(P, '-y', 1.8)
    lattice(Ff, cuts, 0.0, 2.8, 2.5, zb, 0.25, pattern='grid', frame='timber_red', bar='timber_red', leaves=4)
    for sx in (-1, 1):
        lattice(Ff, cuts, sx * 4.2, 2.2, 1.35, zb + 1.0, 0.25, pattern='grid', frame='timber_red', bar='timber_red', leaves=2)
    wall_ok(P, [box_vf(-7.2, 7.2, 1.8, 2.05, zb - 0.02, 3.65)], 'timber', cuts, tile=1.2)
    # 뒷벽 및 박공벽 (청벽돌)
    cb = []
    Fb = F_(P, '+y', 5.8)
    lattice(Fb, cb, 0.0, 1.0, 0.75, zb + 1.5, 0.4, pattern='grid', frame='timber', leaves=1)
    wall_ok(P, [box_vf(-7.2, 7.2, 5.4, 5.8, zb - 0.02, 3.65)], 'brick_grey', cb, tile=1.4)
    for a, b in ((-7.2, -6.7), (6.7, 7.2)):
        wall_ok(P, [box_vf(a, b, 1.8, 5.8, zb - 0.02, 3.65)], 'brick_grey', [], tile=1.4)

    # 툇간 붉은 두리기둥 + 도리
    for x in (-6.5, -4.2, -1.8, 1.8, 4.2, 6.5):
        post(P, x, 0.85, zb, 3.7, r=0.13, mat='timber_red', base='stone', base_h=0.15)
    P.beam((-7.3, 0.85, 3.66), (7.3, 0.85, 3.66), 0.22, 0.26, 'timber_red')

    # 본채 맞배/경산지붕
    R_main = Roof(15.2, 5.6, 3.7, 30, 0.3, 'gable', oE=1.1, oG=0.35, curve=V['curve'], lift=0.16, cy=3.4, seed=75)
    tile_roof(P, R_main, raft=('front',), res=0.32, gable_mat='brick_grey')
    for sx in (-1, 1):
        pts = [(sx * 7.7, y, R_main.z_long(y) + 0.06) for y in lin(R_main.cy - R_main.ye + 0.1, R_main.cy + R_main.ye - 0.1, 14)]
        E.ridge_line(P, pts, 0.55, 0.16, 'ridge')
    for sx in (-1, 1):
        lantern(P, sx * 2.2, 0.85, 3.1)

    smoke(P, 'courtyard_estate', (6.5, 6.2, 4.2))
    return P


def _estate_japan(P):
    """일본 무가 저택 (호농 고택):
    - 앞채: 나가야몬(중후한 흑색 판벽 + 큰 대문 + 좌우 무사실 격자창)
    - 안마당: 자갈 마당, 토비이시(디딤돌), 석등, 초즈바치(수반)
    - 뒤쪽 슈야(본채): 돌 기초, 넓은 엔가와, 쇼지 미닫이문, 흰 회벽·판벽, 웅장한 이리모야 기와지붕
    - 연기 마커
    """
    # 1. 앞채 나가야몬 (y: -5.8 ~ -3.6)
    P.box(-7.8, 7.8, -5.8, -3.6, -0.4, 0.12, 'stone', tile=1.4, bevel=0.02)
    # 중앙 대문
    W_gate, Hd = 2.4, 2.5
    for sx in (-1, 1):
        post(P, sx * (W_gate / 2 + 0.12), -4.7, 0.12, 3.15, r=0.14, mat='timber', round_=False, base='stone', base_h=0.12)
    P.box(-W_gate / 2 - 0.6, W_gate / 2 + 0.6, -4.82, -4.58, 2.75, 2.98, 'timber', tile=(1.6, 0.8), grain='x')
    door_leaf(P, (-W_gate / 2, -4.65), W_gate / 2, Hd, 0.12, rad(-75), mat='boards')
    door_leaf(P, (W_gate / 2, -4.65), -W_gate / 2, Hd, 0.12, rad(-75), mat='boards')

    # 좌우 무사실 (흑색 판벽 + 격자창)
    for a, b in ((-7.6, -1.6), (1.6, 7.6)):
        cuts = []
        Ff = F_(P, '-y', -5.6)
        lattice(Ff, cuts, (a + b) / 2, 1.4, 1.0, 1.0, 0.25, pattern='shoji', frame='timber', bar='timber', leaves=2)
        wall_ok(P, [box_vf(a, b, -5.6, -3.8, 0.12, 2.8)], 'boards', cuts, tile=1.4)
    R_gate = Roof(16.0, 2.6, 2.85, 27, 0.22, 'gable', oE=0.7, oG=0.5, curve=V['curve'], lift=V['lift'], cy=-4.7, seed=81)
    tile_roof(P, R_gate, caps=False, raft=('front',), res=0.35, ridge_h=0.25, ridge_w=0.28)

    # 2. 안마당 (y: -3.6 ~ 0.7)
    for y in lin(-3.2, 0.5, 6):
        P.box(-0.35, 0.35, y - 0.2, y + 0.2, -0.05, 0.05, 'stone', bevel=0.015, tile=1.2)
    # 석등
    P.box(3.8, 4.4, -1.6, -1.0, 0.0, 0.25, 'granite', tile=1.0, bevel=0.02)
    P.cyl(0.12, 0.12, 0.85, 'granite', n=8, matrix=Tm(4.1, -1.3, 0.25), tile=0.8)
    P.box(3.85, 4.35, -1.55, -1.05, 1.1, 1.45, 'granite', tile=1.0)
    P.box(3.95, 4.25, -1.45, -1.15, 1.18, 1.38, 'glass', tile=1.0)
    # 수반 (초즈바치)
    P.box(-4.4, -3.6, -1.6, -0.8, 0.0, 0.45, 'stone', tile=1.0, bevel=0.03)
    P.box(-4.2, -3.8, -1.4, -1.0, 0.35, 0.46, 'water', tile=1.0)

    # 3. 본채 슈야 (y: 0.7 ~ 6.2)
    zf = 0.65
    P.box(-7.8, 7.8, 0.7, 6.3, -0.4, 0.2, 'stone', tile=1.6, bevel=0.03)
    P.box(-7.4, 7.4, 1.8, 5.8, 0.2, zf, 'boards', tile=1.4)

    # 엔가와 (툇마루)
    P.box(-7.4, 7.4, 0.75, 1.8, zf - 0.07, zf, 'floor', tile=1.4, bevel=0.01)
    bays = [-7.2, -4.8, -2.4, 0.0, 2.4, 4.8, 7.2]
    for x in bays:
        P.box(x - 0.06, x + 0.06, 0.85, 0.97, 0.0, zf - 0.07, 'timber', tile=1.0)

    # 본채 쇼지문들
    cuts = []
    Ff = F_(P, '-y', 1.8)
    Fb = F_(P, '+y', 5.8)
    for k in range(len(bays) - 1):
        lattice(Ff, cuts, (bays[k] + bays[k + 1]) / 2, 2.2, 1.9, zf, 0.25, pattern='shoji', frame='timber', bar='timber', leaves=2,
                open_=0.5 if k in (2, 3) else 0.0, sill=0.05)
    wall_ok(P, [box_vf(-7.2, 7.2, 1.8, 5.8, zf - 0.02, 3.45)], 'plaster', cuts, tile=2.2)
    # 하부 판벽
    for fc, Lw in ((Fb, 14.4), (F_(P, '-x', -7.2), 4.0), (F_(P, '+x', 7.2), 4.0)):
        fc.box(-Lw / 2, Lw / 2, -0.025, 0.0, zf, zf + 0.75, 'boards', tile=1.4)

    # 본채 기둥들
    for x in bays:
        P.box(x - 0.08, x + 0.08, 1.74, 1.86, 0.2, 3.55, 'timber', tile=1.0)
        P.box(x - 0.08, x + 0.08, 5.68, 5.8, 0.2, 3.55, 'timber', tile=1.0)

    # 본채 이리모야 기와지붕
    R_main = Roof(14.8, 5.6, 3.45, 28, 0.28, 'hipgable', oE=1.3, oG=1.1, curve=V['curve'], lift=V['lift'], cy=3.4, setback=1.7, seed=85)
    tile_roof(P, R_main, raft=('front',), gable_mat='plaster')

    smoke(P, 'courtyard_estate', (6.5, 5.8, 4.2))
    return P


BUILDERS = [house_thatch_ea, house_tile_ea, house_town_ea, temple_ea, pagoda_small, gate_ea, well_ea, granary_ea, smithy_ea, shrine_ea, stall_ea,
            pit_house_ea, camp_hearth, courtyard_estate]


# ───────────────────────── 실행 ─────────────────────────
CENTER = {'smithy_ea': (0.0, 0.0), 'camp_hearth': (0.0, 0.0), 'shrine_ea': (0.0, 0.0)}
CAM = {'temple_ea': (-32, 12), 'house_tile_ea': (-30, 14), 'house_town_ea': (-30, 10), 'pagoda_small': (-28, 6), 'shrine_ea': (-30, 12), 'courtyard_estate': (-34, 18)}


def only_names():
    return [s for s in os.environ.get('KIT_ONLY', '').split(',') if s]


def main():
    t0 = time.time()
    K.reset_scene()
    setup_materials()
    only = only_names()
    roots, dims = [], {}
    for b in BUILDERS:
        if only and b.__name__ not in only:
            continue
        ts = time.time()
        P = b()
        root = P.finish()
        dims[root.name] = S.recenter(root, P.foot, CENTER.get(root.name))
        roots.append(root)
        log('%-16s %6d 삼각형  %.1fs  %s' % (root.name, sum(K.tri_count(o) for o in K.mesh_objects([root])), time.time() - ts,
                                            'x'.join('%.2f' % d for d in dims[root.name])))
    for i, r in enumerate(roots):
        r.location = (i * 60.0, 0, 0)
    objs = K.mesh_objects(roots)
    K.make_ao_uvs(objs)
    img = K.bake_ao(objs, size=2048, samples=256, distance=1.4)
    mats = [K.MATS[n] for n in K.MATS]
    K.wire_ao(mats, img)
    for r in roots:
        r.location = (0, 0, 0)
    out = os.path.join(K.KITS, NAME + '.glb') if not only else os.path.join(K.BUILD, NAME + '_partial.glb')
    tris = {r.name: sum(K.tri_count(o) for o in K.mesh_objects([r])) for r in roots}
    info = K.export_glb(roots, out) if not only or os.environ.get('KIT_EXPORT') == '1' else {}
    if not only:
        with open(os.path.join(K.KITS, NAME + '.dims.json'), 'w', encoding='utf-8', newline='\n') as f:
            json.dump({'source': 'tools/blender/kit_eastasia.py (KIT_VARIANT=%s)' % VARIANT, 'units': 'm, [x 길이, 앞뒤 깊이, 높이]',
                       'pieces': {k: [round(x, 2) for x in v] for k, v in dims.items()}}, f, ensure_ascii=False, indent=1)
            f.write('\n')
    log('삼각형 합계', sum(tris.values()), tris)
    stats = {'variant': VARIANT, 'tris': tris, 'total': sum(tris.values()), 'dims': {k: [round(x, 2) for x in v] for k, v in dims.items()}, 'glb': info,
             'sha': K.sha(out) if info else None, 'seconds': round(time.time() - t0, 1)}
    with open(os.path.join(K.BUILD, NAME + '_stats.json'), 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=1)
    log('STATS', json.dumps(stats, ensure_ascii=False))
    if os.environ.get('KIT_NOPREVIEW') != '1':
        previews(roots, mats)
    log('끝 %.1fs' % (time.time() - t0))


def previews(roots, mats):
    K.ao_into_basecolor(mats)
    if only_names():            # 손질용 부분 빌드: 배포 미리보기를 덮지 않는다
        K.PREVIEW = os.path.join(K.BUILD, 'preview_only')
        os.makedirs(K.PREVIEW, exist_ok=True)
    K.setup_preview(sun_elev=34, sun_az=140, grass=os.path.join(K.TEX, 'leafy_grass_diff_1k.jpg'))
    S.preview_ground((0.66, 0.74, 0.44))
    for r in roots:
        r.location = (1000, 1000, -500)
    for r in roots:
        r.location = (0, 0, 0)
        r.rotation_euler = (0, 0, 0)
        bpy.context.view_layer.update()
        me = [c for c in r.children_recursive if c.type == 'MESH']
        pts = [c.matrix_world @ v.co for c in me for v in c.data.vertices]
        lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(0.0, min(p.z for p in pts) * 0.3)))
        hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
        ctr = (lo + hi) / 2
        rad_ = (hi - lo).length / 2
        dist = rad_ / math.sin(rad(26)) * 1.18
        az, el = (rad(a) for a in CAM.get(r.name, (-34, 14)))
        pos = (ctr.x + math.sin(az) * dist * math.cos(el), ctr.y - math.cos(az) * dist * math.cos(el), max(1.6, ctr.z * 0.6 + math.sin(el) * dist))
        tall = (hi.z - lo.z) > 1.3 * max(hi.x - lo.x, hi.y - lo.y)
        cam = K.camera_look('cam_' + r.name, pos, (ctr.x, ctr.y, ctr.z * (0.95 if tall else 0.75)), 35)
        K.render_to(cam, os.path.join(K.PREVIEW, 'eastasia_%s_%s.png' % (VARIANT, r.name)))
        r.location = (1000, 1000, -500)


if __name__ == '__main__':
    try:
        main()
    except Exception:
        import traceback
        traceback.print_exc()
        sys.exit(1)
