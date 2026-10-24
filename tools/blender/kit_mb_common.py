# 흙벽돌(서아시아·북아프리카·나일·이란) 세트 공통 도구
# kit_mudbrick.py(건물) · kit_props_mudbrick.py(소품·가축) · kit_trees_mudbrick.py(야자·올리브)가 함께 쓴다.
# Blender 4.2 명령줄 환경에서 작동한다. 결정성 유지: recalc_face_normals 사용 금지, 정해진 감김과 일정한 UV 사용.
import os, math
import numpy as np
import bpy, bmesh
from mathutils import Vector, Matrix
import kit_common as K
from kit_common import box_vf, temp_obj
import kit_props as KP
from kit_props import lathe_bm, loft_bm, tube_bm, ellipsoid_bm
from kit_sa_common import prism_ok, solid_ok, bool_cut, add_vf, Tm, Rz, Ry, Rx, lin

rad = math.radians
TP = lambda d: math.tan(rad(d))

# ───────────────────────── 색표 ─────────────────────────
MB_PAL = [
    'sand_light', 'sand_dark', 'adobe_mud', 'adobe_dark', 'persian_blue', 'turquoise', 'lapis', 'ochre',
    'terracotta', 'white_lime', 'wood_viga', 'wood_dark', 'iron', 'bronze', 'gold', 'brass',
    'camel_hair', 'camel_dark', 'goat_black', 'goat_white', 'goat_brown', 'donkey_grey', 'donkey_dark', 'donkey_muzzle',
    'carpet_red', 'carpet_navy', 'carpet_gold', 'carpet_cream', 'date_fruit', 'date_bunch', 'palm_leaf', 'palm_dead',
    'palm_trunk', 'olive_leaf', 'olive_fruit', 'clay_pot', 'clay_bright', 'flame', 'ash', 'charcoal',
    'water_dark', 'glass_dark', 'cloth_indigo', 'cloth_white', 'cloth_black', 'cloth_saffron', 'cloth_brown', 'straw',
    'stone_rubble', 'rope', 'copper', 'wool_cream', 'wool_brown', 'saddle_red', 'eye', 'hoof',
    'chaff', 'bread', 'mortar', 'tile_green', 'tile_blue', 'tile_yellow', 'reed_mat', 'lime_wash'
]

MB_RGB = {
    'sand_light': (0.86, 0.78, 0.65), 'sand_dark': (0.70, 0.58, 0.44),
    'adobe_mud': (0.68, 0.54, 0.40), 'adobe_dark': (0.50, 0.38, 0.28),
    'persian_blue': (0.12, 0.34, 0.65), 'turquoise': (0.16, 0.60, 0.56),
    'lapis': (0.09, 0.18, 0.52), 'ochre': (0.82, 0.58, 0.22),
    'terracotta': (0.74, 0.38, 0.24), 'white_lime': (0.92, 0.90, 0.84),
    'wood_viga': (0.36, 0.25, 0.16), 'wood_dark': (0.22, 0.15, 0.10),
    'iron': (0.18, 0.18, 0.19), 'bronze': (0.48, 0.38, 0.22),
    'gold': (0.82, 0.66, 0.25), 'brass': (0.75, 0.58, 0.24),
    'camel_hair': (0.72, 0.58, 0.42), 'camel_dark': (0.50, 0.38, 0.26),
    'goat_black': (0.08, 0.07, 0.07), 'goat_white': (0.88, 0.86, 0.80),
    'goat_brown': (0.42, 0.28, 0.16), 'donkey_grey': (0.52, 0.50, 0.47),
    'donkey_dark': (0.32, 0.30, 0.28), 'donkey_muzzle': (0.78, 0.76, 0.72),
    'carpet_red': (0.65, 0.15, 0.12), 'carpet_navy': (0.12, 0.18, 0.40),
    'carpet_gold': (0.82, 0.64, 0.22), 'carpet_cream': (0.88, 0.84, 0.75),
    'date_fruit': (0.28, 0.14, 0.08), 'date_bunch': (0.82, 0.50, 0.12),
    'palm_leaf': (0.28, 0.42, 0.16), 'palm_dead': (0.55, 0.44, 0.28),
    'palm_trunk': (0.44, 0.36, 0.28), 'olive_leaf': (0.36, 0.46, 0.30),
    'olive_fruit': (0.14, 0.18, 0.10), 'clay_pot': (0.62, 0.40, 0.26),
    'clay_bright': (0.78, 0.48, 0.30), 'flame': (1.0, 0.75, 0.3),
    'ash': (0.48, 0.46, 0.44), 'charcoal': (0.08, 0.08, 0.08),
    'water_dark': (0.06, 0.18, 0.22), 'glass_dark': (0.025, 0.02, 0.016),
    'cloth_indigo': (0.15, 0.22, 0.45), 'cloth_white': (0.88, 0.86, 0.82),
    'cloth_black': (0.07, 0.06, 0.06), 'cloth_saffron': (0.88, 0.52, 0.14),
    'cloth_brown': (0.40, 0.28, 0.18), 'straw': (0.76, 0.65, 0.40),
    'stone_rubble': (0.56, 0.52, 0.46), 'rope': (0.62, 0.52, 0.36),
    'copper': (0.72, 0.42, 0.28), 'wool_cream': (0.85, 0.82, 0.74),
    'wool_brown': (0.38, 0.28, 0.20), 'saddle_red': (0.58, 0.16, 0.12),
    'eye': (0.03, 0.025, 0.02), 'hoof': (0.12, 0.1, 0.08),
    'chaff': (0.80, 0.70, 0.48), 'bread': (0.78, 0.58, 0.32),
    'mortar': (0.75, 0.72, 0.66), 'tile_green': (0.18, 0.52, 0.38),
    'tile_blue': (0.14, 0.40, 0.70), 'tile_yellow': (0.88, 0.72, 0.20),
    'reed_mat': (0.72, 0.62, 0.42), 'lime_wash': (0.90, 0.88, 0.82)
}

PAL_CELLS = 8
PAL_PX = 8

def gen_palette(fname='mb_palette.png'):
    n = PAL_CELLS * PAL_PX
    a = np.ones((n, n, 4), np.float32)
    for i, name in enumerate(MB_PAL):
        cx, cy = i % PAL_CELLS, i // PAL_CELLS
        a[cy * PAL_PX:(cy + 1) * PAL_PX, cx * PAL_PX:(cx + 1) * PAL_PX, :3] = MB_RGB[name]
    path = os.path.join(K.BUILD, fname)
    K._save_np(a, path)
    return path

def pal_uv(name):
    i = MB_PAL.index(name)
    return ((i % PAL_CELLS + 0.5) / PAL_CELLS, (i // PAL_CELLS + 0.5) / PAL_CELLS)

def pal_set(bm, name):
    uvl = bm.loops.layers.uv.verify()
    uv = pal_uv(name)
    for f in bm.faces:
        for l in f.loops:
            l[uvl].uv = uv
    return bm

# ───────────────────────── 기하학 도구 (흙벽돌 전용) ─────────────────────────

def add_vigas(P, bm, x0, x1, y0, y1, z_level, count=6, axis='X', r=0.08, ext=0.28, mat='timber_dark'):
    """벽 바깥으로 튀어나온 둥근 목재 보(vigas). 사막 흙벽돌 가옥의 결정적 실루엣."""
    n_sides = 8
    if axis == 'X':
        # 보가 X 방향으로 뻗어 있고 양끝(x0, x1)으로 돌출
        ys = np.linspace(y0 + 0.3, y1 - 0.3, count)
        L = (x1 + ext) - (x0 - ext)
        cx = (x0 + x1) * 0.5
        for y in ys:
            cyl = tube_bm([(0, 0, -L * 0.5), (0, 0, L * 0.5)], [r, r], n=n_sides)
            cyl.transform(Ry(90))
            cyl.transform(Tm(cx, y, z_level))
            P.add_bm(cyl, mat, tile=1.0)
    else:
        # 보가 Y 방향으로 뻗어 있고 양끝(y0, y1)으로 돌출
        xs = np.linspace(x0 + 0.3, x1 - 0.3, count)
        L = (y1 + ext) - (y0 - ext)
        cy = (y0 + y1) * 0.5
        for x in xs:
            cyl = tube_bm([(0, 0, -L * 0.5), (0, 0, L * 0.5)], [r, r], n=n_sides)
            cyl.transform(Rx(90))
            cyl.transform(Tm(x, cy, z_level))
            P.add_bm(cyl, mat, tile=1.0)

def make_dome_bm(r=1.5, h=1.8, n_lat=10, n_lon=16, pointed=0.2):
    """흙벽돌 돔: pointed > 0 이면 위쪽이 살짝 뾰족한 페르시아·아랍 첨두형 돔."""
    bm = bmesh.new()
    verts = []
    # 아래서부터 위로 고리 생성
    for i in range(n_lat):
        t = i / (n_lat - 1)   # 0 ~ 1
        phi = t * math.pi * 0.5
        # pointed 곡률: 위로 갈수록 r 이 조금 더 천천히 줄어들다가 꼭대기에서 뾰족해짐
        curv_r = math.cos(phi) * (1.0 - pointed * (t ** 2))
        curv_y = math.sin(phi) * (1.0 + pointed * (1.0 - t))
        curv_r = max(0.001, curv_r)
        rad_curr = r * curv_r
        y_curr = h * (curv_y / (1.0 + pointed if pointed else 1.0))
        
        ring = []
        for j in range(n_lon):
            theta = j * 2.0 * math.pi / n_lon
            x = rad_curr * math.cos(theta)
            z = rad_curr * math.sin(theta)
            v = bm.verts.new((x, z, y_curr))
            ring.append(v)
        verts.append(ring)
    
    # 꼭대기 정점
    v_top = bm.verts.new((0, 0, h))
    
    # 고리 간 면 연결
    for i in range(n_lat - 1):
        for j in range(n_lon):
            j_next = (j + 1) % n_lon
            v0 = verts[i][j]
            v1 = verts[i][j_next]
            v2 = verts[i + 1][j_next]
            v3 = verts[i + 1][j]
            bm.faces.new((v0, v1, v2, v3))
            
    # 꼭대기 부채꼴 면
    for j in range(n_lon):
        j_next = (j + 1) % n_lon
        bm.faces.new((verts[-1][j], verts[-1][j_next], v_top))
        
    bm.verts.ensure_lookup_table()
    bm.faces.ensure_lookup_table()
    return bm

def make_parapet(P, x0, x1, y0, y1, z_bot, h=0.5, t=0.25, mat='adobe', drain_spout=True):
    """평지붕 둘레를 감싸는 흙벽돌 파라펫(난간벽) + 나무 물골(spout)."""
    # 4면 파라펫 박스들
    # 남쪽 (y = y0)
    b_s = box_vf(x0, x1, y0, y0 + t, z_bot, z_bot + h)
    add_vf(P, b_s, mat)
    # 북쪽 (y = y1)
    b_n = box_vf(x0, x1, y1 - t, y1, z_bot, z_bot + h)
    add_vf(P, b_n, mat)
    # 서쪽 (x = x0)
    b_w = box_vf(x0, x0 + t, y0 + t, y1 - t, z_bot, z_bot + h)
    add_vf(P, b_w, mat)
    # 동쪽 (x = x1)
    b_e = box_vf(x1 - t, x1, y0 + t, y1 - t, z_bot, z_bot + h)
    add_vf(P, b_e, mat)

    # 배수용 나무 홈통 (spout) 돌출
    if drain_spout:
        spout = tube_bm([(0, 0, -0.3), (0, 0, 0.3)], [0.04, 0.04], n=6)
        spout.transform(Rx(90))
        spout.transform(Tm((x0 + x1) * 0.5, y0 - 0.15, z_bot + 0.12))
        P.add_bm(spout, 'timber_dark', tile=1.0)

def make_outdoor_stairs(P, x_start, z_start, y_start, length, width, height, steps=10, axis='Z', mat='adobe'):
    """외벽 옥상 계단. 흙벽돌 집에서 옥상으로 올라갈 때 쓴다."""
    step_w = width
    step_h = height / steps
    step_d = length / steps
    
    for i in range(steps):
        cur_y = y_start + i * step_h
        cur_h = height - i * step_h  # 계단 아래 채움
        if axis == 'Z':
            cur_z = z_start + i * step_d
            b = box_vf(x_start, x_start + step_w, cur_z, cur_z + step_d, y_start, cur_y + step_h)
        else:
            cur_x = x_start + i * step_d
            b = box_vf(cur_x, cur_x + step_d, z_start, z_start + step_w, y_start, cur_y + step_h)
        add_vf(P, b, mat)
