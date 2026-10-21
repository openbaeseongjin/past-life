# 마을 사람 옷 세트 (1329년 잉글랜드) — Blender 4.2 명령줄 스크립트. kit_common.py 를 함께 쓴다.
#   UBC_DIR=<Universal Base Characters[Standard] 폴더> UAL_GLB=<Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb>
#   GLTFT=<gltf-transform 폴더> "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe" --background --python tools/blender/kit_clothes.py
#   (Quaternius CC0 묶음 두 개는 저장소에 넣지 않는다: itch.io 에서 받아 푼 폴더를 환경변수로 알려 준다 — SOURCES.md)
# 결과: docs/past-life/assets/real/people/villagers.glb (변형 8명 + 연장 소품, meshopt + WebP),
#       docs/past-life/assets/real/people/anims.glb (UAL 동작 골라 담기, 회전 + 골반 이동만),
#       docs/past-life/assets/real/kits/preview/people_{idle,walk,hammer}.png (서기 = 8명 늘어선 그림), 로그의 '뚫림 검사' 표.
#
# 만드는 법 (변형마다):
#   1. Quaternius Universal Base Characters 몸(남·여)과 머리카락을 불러온다. 뼈대(65뼈)는 그대로 둔다 → Universal Animation Library 동작을 그대로 쓴다.
#   2. 옷 = 몸을 수평(몸통)·뼈 수직(소매·각반) 단면으로 잘라 지지 함수(볼록 껍질 반지름)를 구하고, 여유·처짐·허리띠 조임·치마 퍼짐·주름 물결을
#      더한 고리들을 이은 격자 (몸에 맞춘 shrinkwrap 의 바깥 감싸기). 각반·신은 몸 면을 복사해 법선으로 띄운 것 (몸에 붙는 옷).
#      두께는 Solidify(테두리만) + 양면 재질, 결은 CC0 천 텍스처 노멀 + 격자에 넣은 주름 물결(주름 노멀).
#   3. 가중치: 몸 → 옷 Data Transfer(가장 가까운 면 보간). 치마 자락(가랑이 아래)은 골반·허벅지 섞기로 덮어써 다리 사이가 찢어지지 않게 한다.
#      앞치마·허리띠처럼 겹 옷은 밑옷 격자의 가중치를 그대로 물려받아 함께 움직인다.
#   4. 옷 밑으로 가려지는 몸 면은 지운다 (몸 정점에서 법선 방향 광선이 옷 안쪽 깊이 4 cm 넘는 곳에 맞으면 가려짐). 뚫고 나올 몸이 없다.
#   5. 재질 둘: people_skin(몸·눈·머리카락 텍스처 아틀라스 1장, 정점색 = 머리카락/살/눈 가림) + people_cloth(리넨·모직·가죽·짚 결을 채널로 묶은 1장,
#      정점색 RGB = 물감 칸(주색/보조색/생지), A = 천 종류). 장면에서 사람마다 물감·머리색·살빛을 고른다 → 한 사람 그리기 2번.
#   6. 먼 사람용 LOD1(줄인 메시)을 같은 뼈대에 함께 넣는다.
# 좌표: Blender Z 위, 사람 앞 = -Y (glTF +Z), 왼쪽 = +X. 묶음 바인드 자세는 T 자세.
# 결정성: 난수 없음(물결은 결정적 함수), 장면은 비우고 시작, 집합(set) 순서에 기대지 않는다. 다시 돌리면 glb 가 바이트까지 같다.
# 환경변수: KIT_ONLY=m_smith,f_apron (일부만, 미리보기만, 내보내지 않음), KIT_NOPREVIEW=1, KIT_NOEXPORT=1, KIT_FAST=1 (렌더 표본 적게),
#   KIT_DEBUG=1 (가려진 몸 통계·뚫림 내역을 로그에), KIT_DEBUG=3 (미리보기에서 옷 조각마다 다른 색)
import os, sys, math, time, json, subprocess
sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy, bmesh
import numpy as np
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
import kit_common as K
from kit_common import log

# Quaternius 묶음: 환경변수가 먼저, 없으면 저장소 밖에 두는 원본 사본 (tools/blender/_src, 저장소에 넣지 않음)
_SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), '_src', 'quaternius')
UBC = os.environ.get('UBC_DIR') or os.path.join(_SRC, 'ubc', 'Universal Base Characters[Standard]')
UAL = os.environ.get('UAL_GLB') or os.path.join(_SRC, 'ual', 'Universal Animation Library[Standard]', 'Unreal-Godot', 'UAL1_Standard.glb')
PEOPLE = os.path.join(K.PL, 'assets', 'real', 'people')
OUT = os.path.join(PEOPLE, 'villagers.glb')
ANIMS_OUT = os.path.join(PEOPLE, 'anims.glb')
PACK = os.path.join(K.PL, 'tools', 'pack_people.mjs')
ONLY = [s for s in os.environ.get('KIT_ONLY', '').split(',') if s]
NOPREVIEW = os.environ.get('KIT_NOPREVIEW') == '1'
NOEXPORT = os.environ.get('KIT_NOEXPORT') == '1' or bool(ONLY)
# 문화권 (작업 2-1): KIT_CULTURE=southasia 면 남아시아 옷 변형 8명을 villagers_southasia.glb 로 짓는다 (변형 이름·뼈대·LOD 는 villagers.glb 와 같다 →
#   realpeople.js 가 주소만 바꿔 쓴다). 동작 묶음은 같은 원본에서 나오므로 배포 anims.glb 는 덮지 않고 임시 폴더에 지어 바이트 비교만 한다.
#   잉글랜드(기본)는 아래 SA 갈래를 하나도 타지 않는다 → villagers.glb·anims.glb·미리보기가 그대로다.
#   수정 1차: KIT_CULTURE=seasia 는 같은 남아시아 갈래(살빛·가중치·겹 규칙) 위에 동남아 옷(사롱·머리 수건·짧은 저고리·가슴 두름)을 입혀
#   villagers_seasia.glb 로 짓는다 (남아시아 세트를 쓰는 동남아 땅 mainland_sea·indonesia·malay·philippines 의 사람).
CULTURE = os.environ.get('KIT_CULTURE', 'england')
SEA = CULTURE == 'seasia'
SA = CULTURE in ('southasia', 'seasia')
# 작업 2-2: KIT_CULTURE=china|korea|japan 이면 동아시아 옷 (villagers_china/korea/japan.glb). 잉글랜드·남아시아는 아래 EA 갈래를 타지 않는다.
EA = CULTURE in ('china', 'korea', 'japan')
if SA or EA:
    OUT = os.path.join(PEOPLE, 'villagers_%s.glb' % CULTURE)
    ANIMS_OUT = os.path.join(K.BUILD, 'anims_%s_check.glb' % CULTURE)
PV = ('people_%s_' % CULTURE) if (SA or EA) else 'people_'
TAU = math.tau

# 장면에서 쓰는 동작 (UAL Standard 안의 실제 동작 이름). 브리프의 동작과 맞춤:
#   걷기 Walk_Loop · 서기 Idle_Loop · 이야기 Idle_Talking_Loop (그대로)
#   망치질 → Idle_Torch_Loop (왼손을 가슴 앞에 든 자세 = 집게 쥔 손) + 코드 덧씌우기(오른팔 내리치기, 망치 소품)
#   들기 → Walk_Loop 다리·몸 + Idle_Torch_Loop 왼팔(어깨에 멘 자루를 받친 손) + 자루 소품
#   괭이질 → Idle_Loop + 코드 덧씌우기(허리 굽힘, 두 팔 내리찍기, 괭이 소품)
#   덤: 노인 걷기 Walk_Formal_Loop(+코드로 굽은 등), 텃밭 Fixing_Kneeling, 걸상 Sitting_Idle_Loop · Sitting_Talking_Loop
CLIPS = ['Idle_Loop', 'Walk_Loop', 'Idle_Talking_Loop', 'Idle_Torch_Loop', 'Walk_Formal_Loop', 'Fixing_Kneeling', 'Sitting_Idle_Loop', 'Sitting_Talking_Loop']

FINGERS = ('index', 'middle', 'pinky', 'ring', 'thumb')


def bone_kind(name):
    if not name:
        return 'none'
    if name in ('Head', 'neck_01'):
        return 'head'
    b = name.split('_')[0]
    if b in FINGERS or name.startswith('hand'):
        return 'hand'
    if name.startswith('upperarm') or name.startswith('lowerarm'):
        return 'arm'
    if name.startswith('thigh') or name.startswith('calf'):
        return 'leg'
    if name.startswith('foot') or name.startswith('ball'):
        return 'foot'
    return 'torso'


# ───────────────────────── 불러오기 ─────────────────────────
def imp(path):
    before = set(o.name for o in bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    return sorted([o for o in bpy.data.objects if o.name not in before], key=lambda o: o.name)


def kill_tree(objs):
    for o in objs:
        if o.name in bpy.data.objects:
            K.kill(o)


class Family:
    """몸 하나(남 m / 여 f): 뼈대·몸·눈·눈썹 원본 + 단면 분석."""

    def __init__(self, kind):
        self.kind = kind
        path = os.path.join(UBC, 'Base Characters', 'Godot - UE', 'Superhero_%s_FullBody.gltf' % ('Male' if kind == 'm' else 'Female'))
        objs = imp(path)
        self.arm = [o for o in objs if o.type == 'ARMATURE'][0]
        meshes = [o for o in objs if o.type == 'MESH']
        self.body = [o for o in meshes if o.name.lower().startswith('superhero')][0]
        self.eyes = [o for o in meshes if o.name.startswith('Eyes')][0]
        self.brows = [o for o in meshes if o.name.startswith('Eyebrows')][0]
        kill_tree([o for o in meshes if o.parent is None])          # 묶음에 딸린 빈 Icosphere
        for o, nm in ((self.arm, 'src_arm_' + kind), (self.body, 'src_body_' + kind), (self.eyes, 'src_eyes_' + kind), (self.brows, 'src_brows_' + kind)):
            o.name = nm
            if o.type == 'MESH':
                o.data.name = nm
        self.arm.data.pose_position = 'REST'
        bones = self.arm.data.bones
        self.bh = {b.name: Vector(b.head_local) for b in bones}
        self.bt = {b.name: Vector(b.tail_local) for b in bones}
        me = self.body.data
        names = [g.name for g in self.body.vertex_groups]
        self.V = np.array([v.co[:] for v in me.vertices], np.float64)
        self.N = np.array([v.normal[:] for v in me.vertices], np.float64)
        dom = []
        for v in me.vertices:
            gs = sorted(((g.weight, -g.group) for g in v.groups), reverse=True)
            dom.append(names[-gs[0][1]] if gs else None)
        self.dom = dom
        self.kind_v = np.array([bone_kind(d) for d in dom])
        self.side = np.sign(self.V[:, 0])
        bz = [v.co.z for v in self.brows.data.vertices]
        self.brow_z = sum(bz) / len(bz)
        hv = self.V[self.kind_v == 'head']
        self.head_top = float(hv[:, 2].max())
        self.head_y = float((hv[:, 1].max() + hv[:, 1].min()) / 2)
        L = self.bh
        self.z_neck = L['neck_01'].z
        self.z_chest = L['spine_03'].z
        self.z_waist = L['spine_01'].z
        self.z_hip = L['thigh_l'].z
        self.z_crotch = L['thigh_l'].z - (0.11 if kind == 'm' else 0.105)
        self.z_knee = L['calf_l'].z
        self.z_ankle = L['foot_l'].z
        # 몸 BVH (가중치 옮기기 확인·뚫림 검사용)
        log('몸', kind, '정점', len(me.vertices), '눈썹 높이 %.3f 머리 꼭대기 %.3f 목 %.3f 가랑이 %.3f 무릎 %.3f' % (self.brow_z, self.head_top, self.z_neck, self.z_crotch, self.z_knee))

    # 수평 단면의 지지 함수: z 높이에서 mask 정점들의 방향별 최대 거리 (중심 c 기준)
    def support(self, z, mask, dirs, dz=0.016, center=None):
        sel = mask & (np.abs(self.V[:, 2] - z) < dz)
        P = self.V[sel][:, :2]
        if len(P) < 3:
            return None, None
        if center is None:
            center = np.array([0.0, (P[:, 1].max() + P[:, 1].min()) / 2])
        r = ((P - center) @ dirs.T).max(axis=0)
        return r, center


def hair_obj(name):
    path = os.path.join(UBC, 'Hairstyles', 'Rigged to Head Bone', 'glTF (Godot -Unreal)', name + '.gltf')
    objs = imp(path)
    h = [o for o in objs if o.type == 'MESH' and o.name.startswith(name)][0]
    h.parent = None
    h.matrix_world = Matrix.Identity(4)
    kill_tree([o for o in objs if o is not h])
    for m in list(h.modifiers):
        h.modifiers.remove(m)
    h.name = h.data.name = 'src_hair_' + name
    return h


# ───────────────────────── 텍스처: 몸 아틀라스 + 천 묶음 ─────────────────────────
# 아틀라스 2048² (UV 0~1, 아래가 v=0): 남 살 [0,.5]×[.5,1] · 여 살 [.5,1]×[.5,1] · 머리카락1 [0,.5]×[0,.5] · 머리카락2 [.5,1]×[.125,.5] · 눈 [.5,.625]×[0,.125]
ATLAS = {'skin_m': (0.0, 0.5, 0.5, 1.0), 'skin_f': (0.5, 1.0, 0.5, 1.0), 'hair1': (0.0, 0.5, 0.0, 0.5), 'hair2': (0.5, 1.0, 0.125, 0.5), 'eye': (0.5, 0.625, 0.0, 0.125)}


def _resize(a, w, h):
    """numpy 이중선형 크기 바꾸기 (결정적)."""
    H, W = a.shape[:2]
    ys = np.linspace(0, H - 1, h)
    xs = np.linspace(0, W - 1, w)
    y0 = np.floor(ys).astype(int); y1 = np.minimum(y0 + 1, H - 1); fy = (ys - y0)[:, None, None]
    x0 = np.floor(xs).astype(int); x1 = np.minimum(x0 + 1, W - 1); fx = (xs - x0)[None, :, None]
    top = a[y0][:, x0] * (1 - fx) + a[y0][:, x1] * fx
    bot = a[y1][:, x0] * (1 - fx) + a[y1][:, x1] * fx
    return top * (1 - fy) + bot * fy


def _blur(a, r):
    """상자 흐림 (반지름 r 화소, 가장자리 늘림). 2D 또는 (h, w, c)."""
    if r <= 0:
        return a
    out = a
    for ax in (0, 1):
        pad = [(0, 0)] * a.ndim
        pad[ax] = (r + 1, r)
        c = np.cumsum(np.pad(out, pad, mode='edge'), axis=ax, dtype=np.float64)
        n = out.shape[ax]
        hi = np.take(c, np.arange(2 * r + 1, 2 * r + 1 + n), axis=ax)
        lo = np.take(c, np.arange(0, n), axis=ax)
        out = ((hi - lo) / (2 * r + 1)).astype(np.float32)
    return out


def _detail_mask(F, size):
    """살 텍스처에서 무늬를 남길 곳 = 얼굴·목·손 (1), 나머지 팔·몸통·다리 (0). 몸 UV 삼각형을 칠해 만든다.
    Superhero 몸의 노멀·색에 그린 핏줄·근육 골(팔에 문신처럼 보인다)을 팔·다리에서 지우려고 쓴다."""
    me = F.body.data
    me.calc_loop_triangles()
    uvd = me.uv_layers[0].data
    M = np.zeros((size, size), np.float32)
    for t in me.loop_triangles:
        if not any(F.kind_v[v] in ('head', 'hand') for v in t.vertices):
            continue
        P = np.array([uvd[l].uv[:] for l in t.loops], np.float64) * (size - 1)
        x0, y0 = np.maximum(np.floor(P.min(0)).astype(int), 0)
        x1, y1 = np.minimum(np.ceil(P.max(0)).astype(int), size - 1)
        if x1 < x0 or y1 < y0:
            continue
        xs, ys = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1))
        (ax, ay), (bx, by), (cx, cy) = P
        d = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
        if abs(d) < 1e-9:
            continue
        l1 = ((by - cy) * (xs - cx) + (cx - bx) * (ys - cy)) / d
        l2 = ((cy - ay) * (xs - cx) + (ax - cx) * (ys - cy)) / d
        inside = (l1 >= -0.03) & (l2 >= -0.03) & (l1 + l2 <= 1.03)
        M[ys[inside], xs[inside]] = 1.0
    for _ in range(3):        # 3 화소 넓힌 뒤 흐려 경계가 갑자기 바뀌지 않게
        M = np.maximum(M, np.maximum(np.roll(M, 1, 0), np.roll(M, -1, 0)))
        M = np.maximum(M, np.maximum(np.roll(M, 1, 1), np.roll(M, -1, 1)))
    return np.clip(_blur(M, 3), 0, 1)


def build_atlas(fams):
    base = os.path.join(UBC, 'Base Characters', 'Godot - UE')
    hair = os.path.join(UBC, 'Hairstyles', 'Rigged to Head Bone', 'glTF (Godot -Unreal)')
    src = {
        'skin_m': (os.path.join(base, 'T_Superhero_Male_Dark.png'), os.path.join(base, 'T_Superhero_Male_Normal.png')),
        'skin_f': (os.path.join(base, 'T_Superhero_Female_Dark_BaseColor.png'), os.path.join(base, 'T_Superhero_Female_Normal.png')),
        'hair1': (os.path.join(hair, 'T_Hair_1_BaseColor.png'), os.path.join(hair, 'T_Hair_1_Normal.png')),
        'hair2': (os.path.join(hair, 'T_Hair_2_BaseColor.png'), os.path.join(hair, 'T_Hair_2_Normal.png')),
        'eye': (os.path.join(base, 'T_Eye_Brown.png'), None),
    }
    S, SN = 2048, 1024
    col = np.ones((S, S, 4), np.float32)
    col[..., :3] = (0.5, 0.5, 0.5)
    nor = np.ones((SN, SN, 4), np.float32)
    nor[..., :3] = (0.5, 0.5, 1.0)
    for key, (cp, npth) in src.items():
        u0, u1, v0, v1 = ATLAS[key]
        a = K._load_np(cp)[..., :3]
        if key.startswith('skin'):
            # 주황빛 만화 살 → 14세기 잉글랜드 사람 살빛 (채도를 내리고 밝게, 붉은 기 조금). 사람마다 장면에서 살빛을 조금씩 바꾼다
            lum = (a * np.array([0.2126, 0.7152, 0.0722], np.float32)).sum(-1, keepdims=True)
            if SA:      # 남아시아: 밝히지 않고 갈색으로 (주황기만 조금 뺀다). 사람마다 장면 살빛 배수로 밝기를 바꾼다
                a = lum + (a - lum) * 0.82
                a = np.clip(a * np.array([0.88, 0.84, 0.86], np.float32), 0, 1)
            elif EA:    # 동아시아: 잉글랜드보다 덜 밝히고 붉은 기를 줄여 누르스름하게 (사람마다 장면 살빛 배수)
                a = lum + (a - lum) * 0.7
                a = np.clip(a * np.array([1.1, 1.01, 0.86], np.float32) + 0.015, 0, 1)
            else:
                a = lum + (a - lum) * 0.62
                a = np.clip(a * np.array([1.2, 1.1, 1.06], np.float32) + 0.02, 0, 1)
        w, h = int((u1 - u0) * S), int((v1 - v0) * S)
        a = _resize(a, w, h)
        mask = None
        if key.startswith('skin'):
            # 팔·몸통·다리: 그린 근육 골·핏줄을 지운 고른 살 (크게 흐린 색), 얼굴·목·손만 무늬를 남긴다
            mask = _detail_mask(fams[key[-1]], w)[..., None]
            a = a * mask + _blur(a, 14) * (1 - mask)
        col[int(v0 * S):int(v0 * S) + h, int(u0 * S):int(u0 * S) + w, :3] = a
        if npth:
            n = K._load_np(npth)[..., :3]
            wn, hn = int((u1 - u0) * SN), int((v1 - v0) * SN)
            n = _resize(n, wn, hn)
            if mask is not None:   # 노멀도 얼굴·목·손만 (팔의 핏줄 노멀이 문신처럼 보였다)
                mn = _resize(mask, wn, hn)
                n = n * mn + np.array([0.5, 0.5, 1.0], np.float32) * (1 - mn)
            nor[int(v0 * SN):int(v0 * SN) + hn, int(u0 * SN):int(u0 * SN) + wn, :3] = n
    pc, pn = os.path.join(K.BUILD, 'people_skin.png'), os.path.join(K.BUILD, 'people_skin_n.png')
    K._save_np(col, pc)
    K._save_np(nor, pn)
    return pc, pn


def _lum_detail(path, crop_top=0.0, gain=1.0):
    a = K._load_np(path)[..., :3]
    if crop_top:
        a = K._tile_v(np.concatenate([a, np.ones_like(a[..., :1])], -1), crop_top, 0.12)[..., :3]
    a = _resize(a, 1024, 1024)
    lum = (a * np.array([0.2126, 0.7152, 0.0722], np.float32)).sum(-1)
    m = float(lum.mean())
    d = 0.5 + (lum / max(m, 1e-3) - 1.0) * 0.5 * gain      # 평균 0.5 (장면에서 ×2)
    return np.clip(d, 0.05, 0.95)


def build_cloth_tex():
    """천 결 묶음: RGBA = 리넨·모직·가죽·짚 밝기 결 (평균 0.5). 노멀: RG = 짠 천(리넨) XY, BA = 가죽 XY."""
    T = K.TEX
    det = np.stack([
        _lum_detail(os.path.join(T, 'rough_linen_diff_1k.jpg'), gain=1.2),
        _lum_detail(os.path.join(T, 'caban_diff_1k.jpg'), gain=0.55),
        _lum_detail(os.path.join(T, 'brown_leather_albedo_1k.jpg'), gain=1.0),
        _lum_detail(os.path.join(T, 'reed_roof_04_diff_1k.jpg'), crop_top=0.18, gain=0.9),
    ], -1).astype(np.float32)
    n1 = _resize(K._load_np(os.path.join(T, 'rough_linen_nor_gl_1k.jpg'))[..., :3], 1024, 1024)
    n2 = _resize(K._load_np(os.path.join(T, 'brown_leather_nor_gl_1k.jpg'))[..., :3], 1024, 1024)
    nor = np.concatenate([n1[..., :2], n2[..., :2]], -1).astype(np.float32)
    pd, pn = os.path.join(K.BUILD, 'people_cloth.png'), os.path.join(K.BUILD, 'people_cloth_n.png')
    _save_rgba(det, pd)
    _save_rgba(nor, pn)
    return pd, pn


def _save_rgba(arr, path):
    h, w, _ = arr.shape
    img = bpy.data.images.new(os.path.basename(path), w, h, alpha=True)
    img.alpha_mode = 'CHANNEL_PACKED'
    img.pixels.foreach_set(np.clip(arr, 0, 1).astype(np.float32).ravel())
    img.filepath_raw = path
    img.file_format = 'PNG'
    img.save()
    bpy.data.images.remove(img)


# ───────────────────────── 재질 ─────────────────────────
def mat_skin(col, nor):
    m = bpy.data.materials.new('people_skin')
    m.use_nodes = True
    m.use_backface_culling = True
    N, L = m.node_tree.nodes, m.node_tree.links
    b = N['Principled BSDF']
    b.inputs['Roughness'].default_value = 0.62
    t = N.new('ShaderNodeTexImage'); t.name = 'BASE'; t.image = K.load_image(col)
    L.new(t.outputs['Color'], b.inputs['Base Color'])
    tn = N.new('ShaderNodeTexImage'); tn.image = K.load_image(nor, noncolor=True)
    nm = N.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = 0.8
    L.new(tn.outputs['Color'], nm.inputs['Color']); L.new(nm.outputs['Normal'], b.inputs['Normal'])
    return m


def mat_cloth(det, nor):
    m = bpy.data.materials.new('people_cloth')
    m.use_nodes = True
    m.use_backface_culling = False            # 두께는 테두리만 → 안쪽은 양면으로 보인다
    N, L = m.node_tree.nodes, m.node_tree.links
    b = N['Principled BSDF']
    b.inputs['Roughness'].default_value = 0.92
    t = N.new('ShaderNodeTexImage'); t.name = 'BASE'; t.image = K.load_image(det, noncolor=True)
    t.image.alpha_mode = 'CHANNEL_PACKED'
    L.new(t.outputs['Color'], b.inputs['Base Color'])
    tn = N.new('ShaderNodeTexImage'); tn.image = K.load_image(nor, noncolor=True)
    tn.image.alpha_mode = 'CHANNEL_PACKED'
    nm = N.new('ShaderNodeNormalMap')
    L.new(tn.outputs['Color'], nm.inputs['Color']); L.new(nm.outputs['Normal'], b.inputs['Normal'])
    return m


def mat_tool():
    m = bpy.data.materials.new('people_tool')
    m.use_nodes = True
    N, L = m.node_tree.nodes, m.node_tree.links
    b = N['Principled BSDF']
    b.inputs['Roughness'].default_value = 0.7
    ca = N.new('ShaderNodeVertexColor'); ca.layer_name = 'Col'
    L.new(ca.outputs['Color'], b.inputs['Base Color'])
    return m


# ───────────────────────── 천 칸 (정점색) ─────────────────────────
# RGB = 물감 칸 (주색 / 보조색 / 생지), A = 천 종류
FAB = {'linen': 0.0, 'wool': 1 / 3, 'leather': 2 / 3, 'straw': 1.0}
SLOT = {'prim': (1, 0, 0), 'sec': (0, 1, 0), 'nat': (0, 0, 1)}
TILE = {'linen': 0.26, 'wool': 0.34, 'leather': 0.4, 'straw': 0.3}


# ───────────────────────── 격자 옷 ─────────────────────────
class Grid:
    """고리 격자: P[k][j] (행 k = 위→아래, 열 j = 둘레). closed 면 둘레가 이어진다. keep(k, j) 가 거짓인 면은 비운다."""

    def __init__(self, name, P, closed=True, fabric='wool', slot='prim', keep=None, apex=None):
        self.name, self.P, self.closed, self.fabric, self.slot, self.keep, self.apex = name, P, closed, fabric, slot, keep, apex
        self.W = None             # 정점 가중치 [dict] (행·열 순서), 밑옷에서 물려받을 때
        self.obj = None
        self.lock_w = False       # True 면 Data Transfer 하지 않고 W 를 그대로 쓴다


def grid_object(g):
    rows, cols = len(g.P), len(g.P[0])
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')
    vs = [[bm.verts.new(Vector(p)) for p in row] for row in g.P]
    apex_v = bm.verts.new(Vector(g.apex)) if g.apex is not None else None
    bm.verts.index_update()
    # UV: 둘레 = 평균 둘레 × 열 비율, 세로 = 행 사이 거리 누적 (미터 / 결 크기)
    tile = TILE[g.fabric]
    circ = []
    for row in g.P:
        c = sum((Vector(row[(j + 1) % cols]) - Vector(row[j])).length for j in range(cols if g.closed else cols - 1))
        circ.append(c)
    C = sum(circ) / len(circ)
    vacc = [0.0]
    for k in range(1, rows):
        a = sum((Vector(p) for p in g.P[k - 1]), Vector()) / cols
        b = sum((Vector(p) for p in g.P[k]), Vector()) / cols
        vacc.append(vacc[-1] + max((a - b).length, 0.004))
    span = cols if g.closed else cols - 1

    def uv(k, j):
        return ((j / span) * C / tile, -vacc[k] / tile)
    for k in range(rows - 1):
        for j in range(span):
            if g.keep and not g.keep(k, j):
                continue
            j2 = (j + 1) % cols
            f = bm.faces.new((vs[k][j], vs[k + 1][j], vs[k + 1][j2], vs[k][j2]))
            f.smooth = True
            for l, (kk, jj) in zip(f.loops, ((k, j), (k + 1, j), (k + 1, j + 1), (k, j + 1))):
                l[uvl].uv = uv(kk, jj)
    if apex_v is not None:
        for j in range(span):
            j2 = (j + 1) % cols
            f = bm.faces.new((apex_v, vs[0][j], vs[0][j2]))
            f.smooth = True
            for l, (kk, jj) in zip(f.loops, ((None, j + 0.5), (0, j), (0, j + 1))):
                l[uvl].uv = uv(0, jj) if kk is not None else ((jj / span) * C / tile, 0.04 / tile)
    # 감김: 면 법선이 고리 가운데에서 바깥을 보게 (아니면 모두 뒤집는다)
    cen = [sum((Vector(p) for p in row), Vector()) / cols for row in g.P]
    acc = 0.0
    for f in bm.faces:
        ks = [i for i in range(rows) if any(v in vs[i] for v in f.verts[:1])]
        k = ks[0] if ks else 0
        acc += f.normal.dot(f.calc_center_median() - cen[k])
    if acc < 0:
        bmesh.ops.reverse_faces(bm, faces=list(bm.faces), flip_multires=False)
    # 쓰이지 않은 정점은 지운다 (열린 부채꼴·얼굴 구멍)
    loose = [v for v in bm.verts if not v.link_faces]
    keep_idx = [v.index for v in bm.verts if v.link_faces]
    bmesh.ops.delete(bm, geom=loose, context='VERTS')
    if getattr(g, 'weld', False):        # 처음·끝 열이 겹친 행(구멍 없는 행)은 붙여 닫는다 (머리쓰개)
        bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-5)
        bm.verts.index_update()
        keep_idx = None
    me = bpy.data.meshes.new(g.name)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(g.name, me)
    bpy.context.scene.collection.objects.link(ob)
    if keep_idx is not None:
        ob['grid_map'] = keep_idx      # 메시 정점 → 원래 격자 번호 (행 × 열 [+ 꼭짓점])
    g.obj = ob
    return ob


def smooth_ring(r, it=1, closed=True):
    for _ in range(it):
        if closed:
            r = (np.roll(r, 1) + 2 * r + np.roll(r, -1)) / 4
        else:
            r2 = r.copy()
            r2[1:-1] = (r[:-2] + 2 * r[1:-1] + r[2:]) / 4
            r = r2
    return r


def dirs_of(n):
    th = np.arange(n) * TAU / n                   # θ=0 뒤(+Y), θ=π/2 왼쪽(+X), θ=π 앞(-Y)
    return th, np.stack([np.sin(th), np.cos(th)], -1)


def rows_between(z0, z1, dz_fine, dz, fine_top=0.0):
    """z0(위) → z1(아래) 행 높이: 위쪽 fine_top 은 촘촘히."""
    zs = [z0]
    z = z0
    while z - (dz_fine if z0 - z < fine_top else dz) > z1 + dz * 0.4:
        z -= dz_fine if z0 - z < fine_top else dz
        zs.append(z)
    zs.append(z1)
    return zs


def torso_garment(F, name, z_top, z_hem, n=24, ease=0.018, ease_top=0.012, belt=None, belt_ease=0.013, blouse=0.05,
                  flare=0.08, fold_amp=0.012, folds=8, fabric='wool', slot='prim', sector=None, region='body', drape_hip=True, flat=None):
    """몸통 옷 격자 (튜닉·치마·망토). 수평 단면 지지 함수 + 여유 → 처짐·조임·퍼짐·주름."""
    th, D = dirs_of(n)
    torso = np.isin(F.kind_v, ['torso', 'head', 'leg', 'foot'])
    zs = rows_between(z_top, z_hem, 0.012, 0.04, fine_top=0.07)
    R, Cs = [], []
    last = None
    for z in zs:
        m = torso.copy()
        if z > F.z_neck - 0.04:
            m &= np.isin(F.kind_v, ['torso', 'head'])
        r, c = F.support(z, m, D, dz=0.012 if z > F.z_chest else 0.018)
        if r is None:
            r, c = last
        last = (r, c)
        R.append(r.copy()); Cs.append(c.copy())
    R = np.array(R); Cs = np.array(Cs); zs = np.array(zs)
    if flat is not None:          # 아이(여자 몸): 가슴 높이 앞쪽을 윗가슴 고리로 눌러 판판하게 (밑의 몸 면은 assemble 이 지운다)
        z_lo, z_hi = flat
        kr = int(np.argmin(np.abs(zs - z_hi)))
        front = np.abs(np.arange(n) * TAU / n - math.pi) < 1.4
        for k, z in enumerate(zs):
            if z_lo <= z < z_hi:
                R[k][front] = np.minimum(R[k][front], R[kr][front] + 0.004)
    body = R.copy()
    for k, z in enumerate(zs):
        e = ease_top if z > F.z_neck - 0.03 else ease
        R[k] += e
    if belt is not None:
        for k, z in enumerate(zs):
            if abs(z - belt) < 0.022:
                R[k] = body[k] + belt_ease
    # 가슴 아래로 처짐 (허리띠 위는 불룩, 허리띠 없으면 엉덩이까지 늘어짐)
    for k in range(1, len(zs)):
        z = zs[k]
        if z < F.z_chest and (belt is None or zs[k] > belt + 0.022 or zs[k] < belt - 0.022):
            if belt is not None and zs[k - 1] >= belt - 0.022 > zs[k]:
                continue          # 허리띠 바로 아래는 다시 엉덩이를 따른다
            R[k] = np.maximum(R[k], R[k - 1] - blouse * (zs[k - 1] - z))
    # 엉덩이(가장 넓은 곳) 아래로는 안쪽으로 들어가지 않고 퍼진다
    if drape_hip:
        z_hipw = F.z_hip - 0.06
        for k in range(1, len(zs)):
            if zs[k] < z_hipw:
                R[k] = np.maximum(R[k], R[k - 1])
                R[k] += flare * (zs[k - 1] - zs[k])
    # 둘레·세로 다듬기 (목둘레 세 행과 단은 더: 가장자리가 들쭉날쭉하지 않게)
    for k in range(len(zs)):
        R[k] = smooth_ring(R[k], 5 if (k < 3 or k == len(zs) - 1) else 2)
    R2 = R.copy()
    for k in range(1, len(zs) - 1):
        if belt is not None and abs(zs[k] - belt) < 0.03:
            continue
        R2[k] = (R[k - 1] + 2 * R[k] + R[k + 1]) / 4
    R = R2
    base = R.copy()
    # 주름: 허리 아래로 갈수록 깊어지는 세로 물결 (바깥쪽으로만 → 안 옷과 거리가 줄지 않는다)
    z_f0 = (belt if belt is not None else F.z_waist) - 0.02
    for k, z in enumerate(zs):
        if z < z_f0:
            a = fold_amp * min(1.0, (z_f0 - z) / max(0.25, z_f0 - z_hem)) ** 0.8
            ph = 0.9 * math.sin(z * 7.3)
            w = 0.5 + 0.5 * np.sin(folds * th + ph + 0.6 * np.sin(3 * th + z * 4.1))
            R[k] += a * w
        elif z < F.z_chest:
            R[k] += 0.003 * (0.5 + 0.5 * np.sin(13 * th + z * 30))     # 잔주름
    P = []
    for k, z in enumerate(zs):
        c = Cs[k]
        P.append([(float(c[0] + R[k][j] * D[j][0]), float(c[1] + R[k][j] * D[j][1]), float(z)) for j in range(n)])
    keep = None
    if sector is not None:          # sector(θ) → 남길 열인가 (θ: 뒤 = 0, 왼쪽 = π/2, 앞 = π)
        def keep(k, j, n=n):
            return sector((j + 0.5) / n * TAU)
    g = Grid(name, P, True, fabric, slot, keep)
    g.zs, g.th, g.D, g.base, g.C = zs, th, D, base, Cs
    return g


def layer_from(g, name, k_range, j_keep, off, fabric, slot, fold_keep=0.4):
    """밑옷 격자 g 의 일부(행 k_range, 열 j_keep(j))를 off 만큼 바깥으로 띄운 겹 옷 (앞치마·허리띠). 가중치는 g 를 물려받는다."""
    k0, k1 = k_range
    n = len(g.P[0])
    P = []
    for k in range(k0, k1 + 1):
        row = []
        for j in range(n):
            x, y, z = g.P[k][j]
            c = g.C[k]
            dx, dy = x - c[0], y - c[1]
            r = math.hypot(dx, dy)
            rb = g.base[k][j]
            r2 = rb + (r - rb) * fold_keep + off       # 겉옷은 주름을 덜 따른다 (빳빳한 앞치마)
            r2 = max(r2, r + off * 0.5)
            row.append((c[0] + dx / r * r2, c[1] + dy / r * r2, z))
        P.append(row)
    keep = lambda k, j: j_keep(j) and j_keep((j + 1) % n)
    h = Grid(name, P, True, fabric, slot, keep)
    h.src = (g, k0)
    return h


def limb_garment(F, name, side, chain_bones, s0, s1, n=14, ease=0.018, ease_end=0.026, ds=0.022, fabric='wool', slot='prim',
                 roll=False, spiral=0.0, kinds=('arm',), min_r=0.03):
    """팔·다리 고리 격자: 뼈 사슬을 따라 수직 단면 → 지지 함수 + 여유. s 는 사슬 길이(m), s0 < 0 이면 몸통 안쪽까지 늘인다."""
    pts = [F.bh[chain_bones[0]]] + [F.bt[b] for b in chain_bones]
    seg = [(pts[i], pts[i + 1]) for i in range(len(pts) - 1)]
    lens = [(b - a).length for a, b in seg]
    total = sum(lens)
    s1 = min(s1, total)

    def at(s):
        acc = 0.0
        for (a, b), L in zip(seg, lens):
            if s <= acc + L or (a, b) == seg[-1]:
                t = (s - acc) / L
                d = (b - a).normalized()
                return a + (b - a) * t, d
            acc += L
    mask = np.isin(F.kind_v, list(kinds)) & (F.side == side)
    stations = []
    s = s0
    step = 0.03
    while s < s1 - 0.012:
        stations.append(s)
        s += step
    stations.append(s1)
    phis = np.arange(n) * TAU / n
    R, frames = [], []
    first = None
    for s in stations:
        p, t = at(max(s, 0.0))
        if s < 0:
            p = p + t * s
        up = Vector((0, 0, 1)) if abs(t.z) < 0.8 else Vector((0, -1, 0))
        u = (up - t * up.dot(t)).normalized()
        w = t.cross(u)
        Dd = np.array([[*(math.cos(f) * u + math.sin(f) * w)] for f in phis])
        rel = F.V - np.array(p[:])
        along = rel @ np.array(t[:])
        sel = mask & (np.abs(along) < ds)
        if sel.sum() >= 4 and s > 0.02:
            r = (rel[sel] @ Dd.T).max(axis=0)
            r = np.maximum(r, min_r)
            if first is None:
                first = r
        else:
            r = None
        R.append(r)
        frames.append((p, u, w))
    for i in range(len(R)):
        if R[i] is None:
            R[i] = first if first is not None else np.full(n, 0.05)
    R = np.array(R)
    for i, s in enumerate(stations):
        f = (s - s0) / max(1e-6, s1 - s0)
        R[i] = smooth_ring(R[i] + ease + (ease_end - ease) * f ** 2, 4 if i >= len(stations) - 2 else 2)
        if roll and i >= len(stations) - 2:
            R[i] += 0.008                        # 걷어 올린 소매 끝 말림
        if spiral:
            R[i] += spiral * np.maximum(0, np.sin(phis + s * TAU / 0.055)) ** 2      # 각반 감은 띠
    P = []
    for i in range(len(stations)):
        p, u, w = frames[i]
        P.append([tuple(p + (math.cos(f) * u + math.sin(f) * w) * float(R[i][j])) for j, f in enumerate(phis)])
    g = Grid(name, P, True, fabric, slot)
    g.limb = True                 # 팔·다리 옷: 치마 자락 섞기를 하지 않는다 (몸 가중치 그대로 정강이·발을 따른다)
    return g


def head_garment(F, name, z_top_extra, z_bot, n=25, ease=0.016, ease_bot=0.03, face=None, fabric='linen', slot='nat', peak=0.0,
                 with_torso=True, back_drop=0.0, hull_below=None):
    """머리쓰개 격자 (두건·머릿수건·쓰개): 머리·목(·어깨) 수평 단면 → 위로 볼록 덮개 (고개 아래 오목한 목은 메운다).
    face = (가운데 z, 반높이, 반폭 각) 얼굴 구멍: 구멍이 지나는 행은 열을 구멍 가장자리 ±w(z) 사이(뒤로 도는 호)에 고르게 놓아
    가장자리가 계단 없이 매끈하다. 모든 행이 같은 꼴(앞 θ=π 에서 시작해 한 바퀴)이라 구멍 없는 행은 처음·끝 열이 겹쳐 붙는다."""
    kinds = ['head', 'torso'] if with_torso else ['head']
    m_all = np.isin(F.kind_v, kinds)
    z0 = F.head_top + z_top_extra
    zs = np.array(rows_between(z0 - 0.012, z_bot, 0.012, 0.02, fine_top=0.05))
    c_head = np.array([0.0, F.head_y])
    TH, R = [], []
    W = []
    for z in zs:
        w = 0.0
        if face is not None:
            zc, zh, aw = face
            q = 1 - ((z - zc) / zh) ** 2
            w = aw * math.sqrt(q) if q > 0 else 0.0
        W.append(w)
    # 이웃 행끼리 구멍 반폭이 0.14 rad 넘게 바뀌지 않게 (턱·이마 쪽에서 열이 확 돌아 들쭉날쭉해지던 것)
    for _ in range(len(W)):
        for k in range(len(W)):
            for kk in (k - 1, k + 1):
                if 0 <= kk < len(W) and W[k] > W[kk] + 0.14:
                    W[k] = W[kk] + 0.14
    for z, w in zip(zs, W):
        th = math.pi + w + (TAU - 2 * w) * np.arange(n) / (n - 1)
        D = np.stack([np.sin(th), np.cos(th)], -1)
        m = m_all if z < F.z_neck - 0.02 else np.isin(F.kind_v, ['head']) | ((F.kind_v == 'torso') & (F.V[:, 2] > F.z_neck - 0.06))
        r, c = F.support(z, m, D, dz=0.012, center=c_head)
        if r is None:
            r = np.full(n, 0.03)
        TH.append(th); R.append(r)
    TH = np.array(TH); R = np.array(R)
    for k, z in enumerate(zs):
        t = min(1.0, max(0.0, (F.z_neck - z) / 0.12))
        R[k] = R[k] + ease + (ease_bot - ease) * t
    # 각 열마다 (z, r) 위 볼록 껍질 → 턱·목 밑 오목함을 메워 천이 늘어진다
    for j in range(n):
        pts = sorted(zip(zs.tolist(), R[:, j].tolist()))
        if hull_below is not None:          # 남아시아 머릿자락: 귀 높이 아래만 메운다 (정수리에서 어깨로 천막처럼 뻗지 않게)
            pts = [p for p in pts if p[0] <= hull_below]
            if len(pts) < 2:
                continue
        hull = []
        for p in pts:
            while len(hull) >= 2:
                (z1, r1), (z2, r2) = hull[-2], hull[-1]
                if (z2 - z1) * (p[1] - r1) - (r2 - r1) * (p[0] - z1) >= 0:
                    hull.pop()
                else:
                    break
            hull.append(p)
        fill = np.interp(zs, [h[0] for h in hull], [h[1] for h in hull])
        if hull_below is not None:
            fill = np.where(zs <= hull_below, fill, 0.0)
        R[:, j] = np.maximum(R[:, j], fill)
    for k in range(len(zs)):
        R[k] = smooth_ring(R[k], 2, closed=False)
    if back_drop:
        for k, z in enumerate(zs):         # 뒤로 늘어뜨림 (쓰개 뒷자락)
            R[k] += back_drop * max(0.0, (F.brow_z - z) / 0.3) * np.maximum(0, np.cos(TH[k])) ** 2
    P = []
    for k, z in enumerate(zs):
        P.append([(float(R[k][j] * math.sin(TH[k][j])), float(F.head_y + R[k][j] * math.cos(TH[k][j]) + peak * max(0, (z - F.brow_z)) * 0.6), float(z))
                  for j in range(n)])
    apex = (0.0, float(F.head_y + peak * 0.05), float(z0 + 0.004 + peak * 0.3))
    g = Grid(name, P, False, fabric, slot, None, apex=apex)
    g.zs = zs
    g.weld = True
    return g


def fitted(F, name, src_obj, face_pred, off=0.004, smooth=2, fabric='wool', slot='sec', ratio=None):
    """몸에 붙는 옷 (각반·신): 몸 면 일부를 복사해 법선 방향으로 띄운다. 가중치는 몸 것을 그대로 가진다."""
    ob = src_obj.copy()
    ob.data = src_obj.data.copy()
    ob.name = ob.data.name = name
    ob.parent = None
    ob.hide_render = False
    for m in list(ob.modifiers):
        ob.modifiers.remove(m)
    bpy.context.scene.collection.objects.link(ob)
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bm.verts.ensure_lookup_table()
    dead = [f for f in bm.faces if not face_pred(f)]
    bmesh.ops.delete(bm, geom=dead, context='FACES')
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=1e-5)      # glTF 이음매(UV 갈라진 곳)로 떨어진 정점을 붙인다
    bm.normal_update()
    nrm = {v: v.normal.copy() for v in bm.verts}
    orig = {v: v.co.copy() for v in bm.verts}
    for _ in range(smooth):
        bmesh.ops.smooth_vert(bm, verts=[v for v in bm.verts if not v.is_boundary], factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    for v in bm.verts:            # 다듬어 안으로 들어간 곳도 몸에서 off 만큼은 밖에 있게
        d = (v.co - orig[v]).dot(nrm[v])
        v.co += nrm[v] * max(0.0, off - d)
    # 천 UV: 정면 원통 투영 (뼈 축 둘레 각 × 높이)
    uvl = bm.loops.layers.uv.active or bm.loops.layers.uv.new('UVMap')
    tile = TILE[fabric]
    for f in bm.faces:
        f.smooth = True
        for l in f.loops:
            p = l.vert.co
            l[uvl].uv = (math.atan2(p.x - math.copysign(0.11, p.x), -(p.y - 0.03)) * 0.06 / tile, p.z / tile)
    bm.normal_update()
    bm.to_mesh(ob.data)
    bm.free()
    # 몸 원래 UV 층(살 텍스처)은 버리고 천 UV 하나만
    me = ob.data
    while len(me.uv_layers) > 1:
        me.uv_layers.remove(me.uv_layers[-1])
    for a in [a.name for a in me.color_attributes]:
        me.color_attributes.remove(me.color_attributes[a])
    if ratio:
        decimate(ob, ratio)
    g = Grid(name, None, True, fabric, slot)
    g.obj = ob
    g.lock_w = True
    return g


# ───────────────────────── 가중치 ─────────────────────────
def vgroups_of(ob):
    names = [vg.name for vg in ob.vertex_groups]
    W = []
    for v in ob.data.vertices:
        W.append({names[gg.group]: gg.weight for gg in v.groups if gg.weight > 1e-5})
    return W


def set_weights(ob, W, bone_names):
    for vg in list(ob.vertex_groups):
        ob.vertex_groups.remove(vg)
    groups = {b: ob.vertex_groups.new(name=b) for b in bone_names}
    for i, w in enumerate(W):
        items = sorted(w.items(), key=lambda kv: (-kv[1], kv[0]))[:4]
        s = sum(x for _, x in items) or 1.0
        for b, x in items:
            if x / s > 1e-4:
                groups[b].add([i], x / s, 'REPLACE')


def data_transfer(ob, src):
    """몸 → 옷 가중치 (Data Transfer 모디파이어, 가장 가까운 면 보간)."""
    for vg in list(ob.vertex_groups):
        ob.vertex_groups.remove(vg)
    for vg in src.vertex_groups:
        ob.vertex_groups.new(name=vg.name)
    md = ob.modifiers.new('dt', 'DATA_TRANSFER')
    md.object = src
    md.use_vert_data = True
    md.data_types_verts = {'VGROUP_WEIGHTS'}
    md.vert_mapping = 'POLYINTERP_NEAREST'
    md.layers_vgroup_select_src = 'ALL'
    md.layers_vgroup_select_dst = 'NAME'
    md.mix_mode = 'REPLACE'
    md.mix_factor = 1.0
    with bpy.context.temp_override(object=ob, active_object=ob, selected_objects=[ob], selected_editable_objects=[ob]):
        bpy.ops.object.modifier_apply(modifier='dt')
    return vgroups_of(ob)


def skirt_blend(W, P, F, share=0.8, z_full=None, no_arms=False):
    """가랑이 아래 자락: Data Transfer 값을 골반·허벅지 섞기로 바꾼다 (다리 사이로 찢어지지 않게)."""
    zc = F.z_crotch
    zf = z_full if z_full is not None else F.z_knee
    out = []
    for w, p in zip(W, P):
        x, y, z = p
        w = dict(w)
        if no_arms:
            moved = sum(v for b, v in w.items() if bone_kind(b) in ('arm', 'hand'))
            w = {b: v for b, v in w.items() if bone_kind(b) not in ('arm', 'hand')}
            if moved:
                w['spine_03'] = w.get('spine_03', 0) + moved
        t = min(1.0, max(0.0, (zc + 0.06 - z) / 0.16))
        if t > 0:
            a = share * (0.55 + 0.45 * min(1.0, max(0.0, (zc - z) / max(0.1, zc - zf))))
            sl = 1.0 / (1.0 + math.exp(-x / 0.03))
            sk = {'pelvis': 1 - a, 'thigh_l': a * sl, 'thigh_r': a * (1 - sl)}
            s = sum(w.values()) or 1.0
            w = {b: (1 - t) * w.get(b, 0) / s + t * sk.get(b, 0) for b in sorted(set(w) | set(sk))}
        out.append(w)
    return out


def arms_to_clavicle(W):
    out = []
    for w in W:
        w = dict(w)
        for side in ('l', 'r'):
            moved = sum(v for b, v in list(w.items()) if bone_kind(b) in ('arm', 'hand') and b.endswith('_' + side))
            if moved:
                for b in [b for b in w if bone_kind(b) in ('arm', 'hand') and b.endswith('_' + side)]:
                    del w[b]
                w['clavicle_' + side] = w.get('clavicle_' + side, 0) + moved
        out.append(w)
    return out


# ───────────────────────── 변형 8명 ─────────────────────────
def FRONT(w):
    return lambda th: abs(th - math.pi) <= w


def BACK(w):
    return lambda th: min(th, TAU - th) <= w


def arm_len(F, side):
    return (F.bt['upperarm_' + side] - F.bh['upperarm_' + side]).length, (F.bt['lowerarm_' + side] - F.bh['lowerarm_' + side]).length


def sleeves(F, name, frac=1.0, ease=0.014, ease_end=0.022, roll=False, fabric='wool', slot='prim', n=12):
    out = []
    for side, sg in (('l', 1), ('r', -1)):
        ua, la = arm_len(F, side)
        s1 = ua + la * frac - (0.018 if frac >= 0.99 else 0.0)
        out.append(limb_garment(F, '%s_sleeve_%s' % (name, side), sg, ['upperarm_' + side, 'lowerarm_' + side], -0.075, s1, n=n,
                                ease=ease, ease_end=(min(ease_end, 0.012) if roll else ease_end), roll=roll, fabric=fabric, slot=slot))   # 걷은 소매는 끝이 벌어지지 않게
    return out


def leg_wraps(F, name, fabric='wool', slot='nat'):
    out = []
    for side, sg in (('l', 1), ('r', -1)):
        L = (F.bt['calf_' + side] - F.bh['calf_' + side]).length
        out.append(limb_garment(F, '%s_wrap_%s' % (name, side), sg, ['calf_' + side], 0.07, L - 0.012, n=10, ease=0.008, ease_end=0.008,
                                ds=0.02, fabric=fabric, slot=slot, kinds=('leg',), spiral=0.003, min_r=0.035))
    return out


def hose(F, name, z_top, slot='sec'):
    kv, V = F.kind_v, F.V

    def pred(f):
        return all(kv[v.index] in ('leg', 'foot') for v in f.verts) and all(V[v.index][2] < z_top for v in f.verts) \
            and any(V[v.index][2] > F.z_ankle - 0.005 for v in f.verts)
    return fitted(F, name + '_hose', F.body, pred, off=0.0035, smooth=2, fabric='wool', slot=slot, ratio=0.5)


def shoes(F, name):
    kv, V = F.kind_v, F.V

    def pred(f):
        return all(kv[v.index] in ('foot', 'leg') for v in f.verts) and all(V[v.index][2] < F.z_ankle + 0.045 for v in f.verts)
    return fitted(F, name + '_shoes', F.body, pred, off=0.0055, smooth=1, fabric='leather', slot='nat', ratio=0.4)


def belt_of(g, F, z, name, off=0.007, fabric='leather', slot='nat', half=0.016):
    ks = [k for k, zz in enumerate(g.zs) if abs(zz - z) <= half + 1e-6]
    if len(ks) < 2:
        k = int(np.argmin(np.abs(g.zs - z)))
        ks = [max(0, k - 1), min(len(g.zs) - 1, k + 1)]
    return layer_from(g, name, (ks[0], ks[-1]), lambda j: True, off, fabric, slot, fold_keep=0.0)


def apron_of(g, F, z0, z1, w, name, off=0.009, fabric='linen', slot='nat'):
    ks = [k for k, zz in enumerate(g.zs) if z1 - 1e-6 <= zz <= z0 + 1e-6]
    n = len(g.P[0])
    return layer_from(g, name, (ks[0], ks[-1]), lambda j: abs(j / n * TAU - math.pi) <= w, off, fabric, slot, fold_keep=0.35)


def straw_hat(F, name):
    """짚모자: 둥근 정수리 + 처진 챙 (머리뼈에 고정)."""
    zb = F.brow_z + 0.055
    prof = [(0.0, zb + 0.125), (0.06, zb + 0.122), (0.1, zb + 0.105), (0.118, zb + 0.06), (0.124, zb + 0.005), (0.16, zb - 0.004),
            (0.21, zb - 0.02), (0.245, zb - 0.042), (0.25, zb - 0.05)]
    n = 22
    P = []
    for (r, z) in prof[1:]:
        P.append([(r * math.sin(a), F.head_y + 0.01 + r * math.cos(a), z) for a in (np.arange(n) * TAU / n)])
    g = Grid(name, P, True, 'straw', 'nat', apex=(0.0, F.head_y + 0.01, prof[0][1]))
    g.zs = np.array([z for _, z in prof[1:]])
    return g


def build_variant_parts(v, F):
    """변형마다 옷 짓기. 돌려주는 것: (옷 격자들, 머리카락 이름들)."""
    if SA:
        return build_variant_parts_sa(v, F)
    if EA:
        return build_variant_parts_ea(v, F)
    zn = F.z_neck + 0.035                 # 목 둘레 (목 밑동 위, 단면에 목만 남는 곳)
    hem_knee = F.z_knee + 0.03
    belt_z = F.z_waist - 0.055
    parts, hair = [], []
    if v == 'm_tunic':        # 튜닉 + 각반
        t = torso_garment(F, v + '_tunic', zn, hem_knee, belt=belt_z, fabric='wool', slot='prim', flare=0.06)
        parts += [t, *sleeves(F, v), belt_of(t, F, belt_z, v + '_belt'), hose(F, v, hem_knee + 0.1), *leg_wraps(F, v), shoes(F, v)]
        hair = ['Hair_SimpleParted']
    elif v == 'm_hood':       # 튜닉 + 두건 (어깨 덮개)
        t = torso_garment(F, v + '_tunic', zn, hem_knee - 0.02, belt=belt_z, fabric='wool', slot='prim', flare=0.07)
        hd = head_garment(F, v + '_hood', 0.022, F.z_chest + 0.06, ease=0.02, ease_bot=0.058, face=(F.brow_z - 0.055, 0.108, 1.18),
                          fabric='wool', slot='sec', peak=0.035)
        parts += [t, *sleeves(F, v), belt_of(t, F, belt_z, v + '_belt'), hd, hose(F, v, hem_knee + 0.08, slot='sec'), shoes(F, v)]
        hair = ['Hair_Beard']
    elif v == 'm_smith':      # 대장장이: 리넨 셔츠(소매 걷음) + 가죽 앞치마
        t = torso_garment(F, v + '_shirt', zn, F.z_hip - 0.27, fabric='linen', slot='nat', flare=0.09, ease=0.022, fold_amp=0.008)
        ap = torso_garment(F, v + '_apron', F.z_chest + 0.02, F.z_knee - 0.1, ease=0.034, ease_top=0.034, blouse=0.0, fabric='leather', slot='nat',
                           flare=0.02, fold_amp=0.004, folds=5, sector=FRONT(0.98))
        parts += [t, *sleeves(F, v, frac=0.42, roll=True, fabric='linen', slot='nat'), ap, hose(F, v, F.z_hip - 0.22, slot='sec'), shoes(F, v)]
        hair = ['Hair_Buzzed', 'Hair_Beard']
    elif v == 'm_field':      # 밭일꾼: 짧은 리넨 튜닉 + 새끼 허리띠 + 각반 + 짚모자
        hem = F.z_knee + 0.1
        t = torso_garment(F, v + '_tunic', zn, hem, belt=belt_z, fabric='linen', slot='nat', flare=0.05, fold_amp=0.01)
        parts += [t, *sleeves(F, v, frac=0.3, roll=True, fabric='linen', slot='nat'),
                  belt_of(t, F, belt_z, v + '_rope', fabric='linen', slot='nat', off=0.006, half=0.01),
                  hose(F, v, hem + 0.1, slot='prim'), *leg_wraps(F, v), shoes(F, v), straw_hat(F, v + '_hat')]
        hair = ['Hair_SimpleParted']
    elif v == 'child':        # 아이 (여자 몸: 얼굴이 앳되다): 무릎 튜닉(가슴 판판) + 새끼 허리띠, 맨 정강이 (장면에서 0.6배 + 머리 크게)
        hem = F.z_knee + 0.07
        t = torso_garment(F, v + '_tunic', zn - 0.01, hem, belt=belt_z, fabric='wool', slot='prim', flare=0.05, flat=(F.z_chest - 0.17, F.z_chest + 0.07))
        parts += [t, *sleeves(F, v, ease=0.016), belt_of(t, F, belt_z, v + '_rope', fabric='linen', slot='nat', off=0.006, half=0.01), shoes(F, v)]
        hair = ['Hair_BuzzedFemale']
    elif v == 'elder':        # 노인: 발목까지 긴 겉옷 + 리넨 쓰개, 수염 (굽은 자세는 장면 코드)
        t = torso_garment(F, v + '_gown', zn, F.z_ankle + 0.03, belt=belt_z, fabric='wool', slot='prim', flare=0.07, fold_amp=0.014)
        cf = head_garment(F, v + '_coif', 0.012, F.brow_z - 0.12, ease=0.012, ease_bot=0.014, face=(F.brow_z - 0.07, 0.1, 1.05), fabric='linen', slot='nat',
                          with_torso=False)
        parts += [t, *sleeves(F, v, ease_end=0.045), belt_of(t, F, belt_z, v + '_belt'), cf, hose(F, v, F.z_knee + 0.06, slot='sec'), shoes(F, v)]
        hair = ['Hair_Beard']
    elif v == 'f_apron':      # 여: 긴 치마(커틀) + 앞치마 + 머릿수건
        t = torso_garment(F, v + '_kirtle', zn - 0.01, F.z_ankle + 0.008, ease=0.014, ease_top=0.01, blouse=0.6, fabric='wool', slot='prim',
                          flare=0.09, fold_amp=0.014, folds=9)
        ap = apron_of(t, F, F.z_waist - 0.04, 0.3, 1.0, v + '_apron')
        band = belt_of(t, F, F.z_waist - 0.04, v + '_band', off=0.011, fabric='linen', slot='nat', half=0.012)
        cf = head_garment(F, v + '_kerchief', 0.016, F.z_neck - 0.03, ease=0.013, ease_bot=0.02, face=(F.brow_z - 0.052, 0.078, 0.86),
                          fabric='linen', slot='nat', back_drop=0.03)
        parts += [t, *sleeves(F, v, ease=0.013, ease_end=0.016), ap, band, cf, hose(F, v, F.z_knee + 0.06, slot='sec'), shoes(F, v)]
        hair = []
    elif v == 'f_cloak':      # 여: 긴 치마 + 등에 늘어진 망토, 틀어 올린 머리
        t = torso_garment(F, v + '_kirtle', zn - 0.01, F.z_ankle + 0.008, ease=0.014, ease_top=0.01, blouse=0.6, fabric='wool', slot='sec',
                          flare=0.09, fold_amp=0.012, folds=9)
        ck = torso_garment(F, v + '_cloak', zn - 0.005, F.z_knee - 0.2, n=20, ease=0.055, ease_top=0.022, blouse=0.02, fabric='wool', slot='prim', flare=0.14,
                           fold_amp=0.022, folds=6, sector=BACK(1.3))
        ck.post = 'cloak'
        parts += [t, *sleeves(F, v, ease=0.013, ease_end=0.016, slot='sec'), ck, hose(F, v, F.z_knee + 0.06, slot='sec'), shoes(F, v)]
        hair = ['Hair_Buns']
    for g in parts:
        if g.obj is None:
            grid_object(g)
    return parts, hair


VARIANTS = [('m_tunic', 'm'), ('m_hood', 'm'), ('m_smith', 'm'), ('m_field', 'm'), ('f_apron', 'f'), ('f_cloak', 'f'), ('child', 'f'), ('elder', 'm')]


# ───────────────────────── 남아시아 옷 (KIT_CULTURE=southasia, 시대 일반형 평민 옷) ─────────────────────────
# 변형 이름은 잉글랜드와 같은 자리(역할)를 쓴다 → peopleplan.js·realpeople.js 가 그대로 고른다:
#   m_tunic 쿠르타(무릎 아래) + 긴 도티 + 파그리 · m_hood 맨 윗몸 + 긴 도티(앞 주름) + 어깨 숄(앙가바스트람) + 터번 + 수염
#   m_smith 맨 윗몸 + 무릎 도티 + 머리 수건 · m_field 맨 윗몸 + 짧게 걷은 도티 + 낮게 감은 머리 수건(감차)
#   f_apron 사리(치마 + 앞 대각 자락 + 머리를 덮은 베일) + 촐리 · f_cloak 사리(왼어깨 자락이 등으로) + 촐리, 머리 틀어 올림
#   child 무릎 쿠르타(가슴 판판), 맨다리 · elder 긴 쿠르타 + 발목 도티 + 숄 + 흰 터번 + 수염
# 맨발 (신을 짓지 않는다). 무명은 'linen' 결, 물감 칸은 장면 물감(쪽빛·꼭두서니·강황·생무명)이 칠한다.
def _adiff(a, b):
    return abs((a - b + math.pi) % TAU - math.pi)


def raise_hem(g, amp, width=0.6, back=1.0):
    """도티: 앞·뒤 가운데 단을 올린다 (다리 사이로 넣어 여민 자락). 열마다 위(z_top)에서 단까지의 거리를 줄인다.
    반지름은 원래 높이의 것(엉덩이 아래로 퍼진 것)을 그대로 두어 다리와 거리가 줄지 않는다."""
    zs = g.zs
    z_top, zh = float(zs[0]), float(zs[-1])
    n = len(g.P[0])
    for j in range(n):
        th = j * TAU / n
        f = max(math.exp(-(_adiff(th, math.pi) / width) ** 2), back * math.exp(-(_adiff(th, 0.0) / width) ** 2))
        sc = 1.0 - amp * f
        for k in range(len(zs)):
            x, y, z = g.P[k][j]
            g.P[k][j] = (x, y, z_top - (z_top - z) * sc)
    g.hem_z = z_top - (z_top - zh) * (1 - amp)


def dhoti(F, name, hem_z, amp=0.3, slot='nat', flare=0.05, ease=0.016):
    g = torso_garment(F, name, F.z_waist + 0.03, hem_z, ease=ease, ease_top=ease, blouse=0.0, fabric='linen', slot=slot, flare=flare,
                      fold_amp=0.014, folds=10)
    raise_hem(g, amp)
    return g


def pleat_of(g, name, z_to, slot, w=0.2, off=0.009):
    """도티 앞 주름 자락: 허리에서 z_to 까지 앞 가운데 좁은 띠 (밑 도티의 가중치를 물려받는다)."""
    n = len(g.P[0])
    zs = [g.P[k][n // 2][2] for k in range(len(g.P))]
    k1 = max(1, min(len(zs) - 1, int(np.argmin([abs(z - z_to) for z in zs]))))
    return layer_from(g, name, (0, k1), lambda j: abs(j / n * TAU - math.pi) <= w, off, 'linen', slot, fold_keep=1.0)


def kurta(F, v, hem_z, slot='prim', frac=1.0, flat=None):
    t = torso_garment(F, v + '_kurta', F.z_neck + 0.035, hem_z, ease=0.026, ease_top=0.012, blouse=0.03, fabric='linen', slot=slot, flare=0.1,
                      fold_amp=0.012, folds=8, flat=flat)
    return [t, *sleeves(F, v, frac=frac, ease=0.016, ease_end=0.03, fabric='linen', slot=slot)]


def turban(F, name, h=0.1, bulge=0.05, tilt=0.045, low=0.0, slot='sec', n=30, nrow=18, nb=5, band=0.011, cross=True, crown=0.18):
    """터번 (파그리·머리 수건): 이마 위에서 머리를 감싼 천을 nb 겹 띠로 (띠마다 둥근 단면, 사이는 접힌 골, 비스듬히 비틀려 감김).
    벽은 이마 높이의 머리 너비에서 곧게 오르며 위로 조금 벌어지고(정수리를 따라 좁아지지 않는다), 꼭대기 crown 몫은 납작한 둥근 지붕.
    앞이마에서 띠 두 갈래가 엇갈려(V) 감긴 자국. 높이는 머리의 약 1.3~1.4 배 (h = 머리 꼭대기 위). 뒤가 tilt 만큼 낮다. 머리뼈에 고정 (rigid)."""
    th, D = dirs_of(n)
    head = F.kind_v == 'head'
    c_head = np.array([0.0, F.head_y])
    z_top = F.head_top + h
    zb0 = F.brow_z + 0.01 - low
    rb, _ = F.support(F.brow_z + 0.03, head, D, dz=0.012, center=c_head)      # 이마 띠 높이의 머리 너비 (방향마다)
    P, zrow = [], []
    for k in range(nrow):
        s = 1.0 - k / (nrow - 1)            # 1 = 꼭대기 고리, 0 = 아래 가장자리
        row = []
        for j in range(n):
            zb = zb0 - tilt * (1 + math.cos(th[j])) / 2
            zt = z_top - 0.02
            z = zb + (zt - zb) * s
            r0 = max(float(rb[j]), 0.05)
            wall = r0 + 0.014 + bulge * (0.25 + 0.75 * min(1.0, s / (1 - crown)))
            if s > 1 - crown:               # 납작한 둥근 지붕
                q = (s - (1 - crown)) / crown
                wall *= math.sqrt(max(0.0, 1 - q * q)) * 0.75 + 0.25 * (1 - q)
            twist = 0.5 * math.sin(th[j]) + 0.35 * (1 + math.cos(th[j])) / 2
            x = s * nb + twist
            ridge = math.sin(math.pi * (x % 1.0)) ** 0.55
            if cross and _adiff(th[j], math.pi) < 0.9:     # 앞이마: 반대로 비틀린 띠가 겹쳐 엇갈린다
                x2 = s * nb - twist * 1.6 + 0.5
                ridge = max(ridge, 0.9 * math.sin(math.pi * (x2 % 1.0)) ** 0.55 * (1 - _adiff(th[j], math.pi) / 0.9))
            rr = wall + band * ridge * (1.0 - smooth01((s - (1 - crown)) / crown))
            row.append((float(c_head[0] + rr * D[j][0]), float(c_head[1] + rr * D[j][1]), float(z)))
        P.append(row)
        zrow.append(sum(p[2] for p in row) / n)
    g = Grid(name, P, True, 'linen', slot, apex=(0.0, float(F.head_y), float(z_top + 0.006)))
    g.zs = np.array(zrow)
    g.rigid = 'Head'
    return g


def smooth01(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def stole(F, name, slot='prim', z_end=None, a0=0.42, w=0.34, n=28, ease=0.024):
    """어깨 숄 (앙가바스트람·감차): 목·어깨를 두르고 두 끝이 가슴 앞으로 늘어진다."""
    zt = F.z_neck + 0.02
    zh = z_end if z_end is not None else F.z_waist - 0.1
    g = torso_garment(F, name, zt, zh, n=n, ease=ease, ease_top=0.018, blouse=0.0, fabric='linen', slot=slot, flare=0.0, fold_amp=0.008, folds=6,
                      drape_hip=False)
    zc = F.z_chest + 0.07

    def keep(k, j):
        thc = (j + 0.5) / n * TAU
        if g.zs[k] >= zc:
            return True
        return any(_adiff(thc, math.pi + s * a0) <= w / 2 for s in (-1, 1))
    g.keep = keep
    return g


def _radius_on(g, th, z):
    """밑옷 격자 g (torso_garment) 의 (θ, 높이 z) 반지름 (가운데 C 기준). 범위 밖이면 None."""
    zs = g.zs
    if z > zs[0] or z < zs[-1]:
        return None
    k = 0
    while k < len(zs) - 2 and zs[k + 1] > z:
        k += 1
    t = (zs[k] - z) / max(1e-6, zs[k] - zs[k + 1])
    n = len(g.P[0])
    f = th / TAU * n
    j0 = int(math.floor(f)) % n
    j1 = (j0 + 1) % n
    fj = f - math.floor(f)

    def rad_(kk, jj):
        x, y, _ = g.P[kk][jj]
        c = g.C[kk]
        return math.hypot(x - c[0], y - c[1])
    a = rad_(k, j0) * (1 - fj) + rad_(k, j1) * fj
    b = rad_(k + 1, j0) * (1 - fj) + rad_(k + 1, j1) * fj
    return a * (1 - t) + b * t


def drape_band(F, name, under, slot, TH, ZH, ZL, n=30, nrow=16, ease=0.022, gap=0.009, loose=0.03, post='pallu', fold=None, smooth=0):
    """몸에 비스듬히 두른 천 띠 (사리 팔루 · 남자 앙가바스트람): 열 = θ 길(TH 가 큰 쪽 → 작은 쪽, θ: 뒤 0 · 왼쪽 π/2 · 앞 π),
    행 = 위 가장자리 z_hi(θ) → 아래 가장자리 z_lo(θ) (TH·ZH·ZL 매듭을 부드럽게 잇는다). 반지름은 몸 단면 + 여유, 밑옷보다 늘 gap 만큼 바깥.
    smooth: 반지름 마당을 이웃 평균으로 다듬는 횟수 (밑옷 단을 지날 때 띠 면이 계단처럼 꺾여 톱니로 보이던 것; 몸·밑옷 안으로는 들어가지 않는다).
    fold = (깊이, 열 방향 물결 수): 어깨 아래로 늘어진 곳에 세로 주름. 느슨한 천이라 밑의 몸 면을 지우지 않는다 (nohide)."""
    def interp(th, Z):
        for i in range(len(TH) - 1):
            a, b = TH[i], TH[i + 1]
            if a >= th >= b:
                t = (a - th) / (a - b)
                t = t * t * (3 - 2 * t)
                return Z[i] + (Z[i + 1] - Z[i]) * t
        return Z[-1]
    torso_all = np.isin(F.kind_v, ['torso', 'head', 'leg', 'foot'])
    torso_hi = np.isin(F.kind_v, ['torso', 'head'])
    cols = [TH[0] + (TH[-1] - TH[0]) * j / (n - 1) for j in range(n)]
    RR, LO, ZZ, CC = np.zeros((nrow, n)), np.zeros((nrow, n)), np.zeros((nrow, n)), [[None] * n for _ in range(nrow)]
    for j, th in enumerate(cols):
        zh_, zl_ = interp(th, ZH), interp(th, ZL)
        d = np.array([[math.sin(th), math.cos(th)]])
        for k in range(nrow):
            u = k / (nrow - 1)
            z = zh_ + (zl_ - zh_) * u
            m = torso_hi if z > F.z_neck - 0.04 else torso_all
            r, c = F.support(z, m, d, dz=0.014)
            if r is None:
                r, c = np.array([0.1]), np.array([0.0, F.head_y])
            rr = float(r[0]) + ease + loose * max(0.0, (F.z_hip - z)) * (th < math.pi / 2)
            lo = float(r[0]) + ease * 0.7
            for ug in under:
                ru = _radius_on(ug, th, z)
                if ru is not None:
                    rr = max(rr, ru + gap)
                    lo = max(lo, ru + gap * 0.8)
                elif ug.zs[-1] - 0.06 < z < ug.zs[-1]:      # 밑옷 단 바로 아래: 단 반지름에서 천천히 내려온다 (띠가 단 모서리를 덮어 촐리 단이 톱니로 뚫고 나오지 않게)
                    rh = _radius_on(ug, th, float(ug.zs[-1]) + 1e-5)
                    if rh is not None:
                        ext = rh + gap - (float(ug.zs[-1]) - z) * 0.35
                        rr = max(rr, ext)
                        lo = max(lo, ext - gap * 0.2)
            RR[k, j], LO[k, j], ZZ[k, j], CC[k][j] = rr, lo, z, c
    for _ in range(smooth):
        S = RR.copy()
        S[1:-1, :] = (RR[:-2, :] + 2 * RR[1:-1, :] + RR[2:, :]) / 4
        S2 = S.copy()
        S2[:, 1:-1] = (S[:, :-2] + 2 * S[:, 1:-1] + S[:, 2:]) / 4
        RR = np.maximum(S2, LO)
    if fold is not None:
        amp, kf = fold
        sh = F.bh['upperarm_l'].z
        for j in range(n):
            w = 0.5 + 0.5 * math.sin(kf * TAU * j / (n - 1) + 0.7)
            for k in range(nrow):
                RR[k, j] += amp * w * smooth01((sh + 0.02 - ZZ[k, j]) / 0.28)
    grid = [[None] * n for _ in range(nrow)]
    for j, th in enumerate(cols):
        for k in range(nrow):
            c = CC[k][j]
            grid[k][j] = (float(c[0] + RR[k, j] * math.sin(th)), float(c[1] + RR[k, j] * math.cos(th)), float(ZZ[k, j]))
    g = Grid(name, grid, False, 'linen', slot)
    g.zs = np.array([sum(p[2] for p in row) / n for row in grid])
    g.post = post
    g.nohide = True
    return g


def pallu_band(F, name, under, slot):
    """사리 자락 (팔루): 오른쪽 허리 앞 → 가슴을 대각으로 → 왼어깨 위 → 등 뒤로 무릎 위까지 늘어진다."""
    sh = F.bh['upperarm_l'].z
    zw = F.z_waist + 0.02
    # 수정 1차: 시작(오른 허리)은 치마 허리춤에 접어 넣은 6 cm 좁은 끝 → 앞으로 오며 넓어져 가슴을 대각으로 (허리 앞에 네모 판이 매달리던 것)
    TH = [4.62, 4.05, math.pi, math.pi / 2 + 0.45, math.pi / 2, math.pi / 2 - 0.45, 0.25]
    ZH = [zw + 0.012, zw + 0.06, F.z_chest + 0.1, F.z_neck - 0.01, F.z_neck - 0.01, F.z_neck - 0.03, F.z_chest + 0.02]
    ZL = [zw - 0.045, zw - 0.09, zw - 0.05, sh + 0.07, sh + 0.07, F.z_hip - 0.05, F.z_knee + 0.12]
    return drape_band(F, name, under, slot, TH, ZH, ZL, n=40, nrow=20, gap=0.008, smooth=5, fold=(0.007, 7))


def angavastram(F, name, under, slot):
    """남자 앙가바스트람 (어깨 천): 왼어깨에 걸쳐 앞자락은 왼가슴으로, 뒷자락은 왼어깨뼈를 따라 허리까지 곧게 늘어진다.
    수정 1차: 예전 것은 등 가운데로 비스듬히 와서 세로 끝단으로 끊겨 뒤에서 방패 판처럼 보였다 → 두 자락이 어깨에서 늘어지고, 세로 주름, 쿠르타에 붙는다."""
    sh = F.bh['upperarm_l'].z
    zw = F.z_waist
    q = math.pi / 2
    # 뒷자락은 좁고 짧게 (왼어깨뼈 아래까지) + 깊은 세로 주름: 넓은 뒷자락은 흰 쿠르타 위에서 색이 다른 판 하나로 읽혔다
    TH = [q + 1.45, q + 0.95, q + 0.45, q, q - 0.4, q - 0.75, q - 1.0]
    ZH = [F.z_chest + 0.02, F.z_neck - 0.03, F.z_neck - 0.01, F.z_neck - 0.005, F.z_neck - 0.012, F.z_neck - 0.03, F.z_chest + 0.03]
    ZL = [zw - 0.11, zw - 0.05, F.z_chest - 0.06, sh + 0.05, F.z_chest - 0.06, F.z_chest - 0.17, F.z_chest - 0.22]   # 바깥 모서리가 더 늘어진 비스듬한 단
    return drape_band(F, name, under, slot, TH, ZH, ZL, n=28, nrow=13, ease=0.016, gap=0.007, loose=0.0, fold=(0.017, 5), smooth=4)


def gamcha(F, name, under, slot):
    """감차 (무명 수건): 왼어깨에 걸쳐 앞은 가슴까지, 뒤는 어깨뼈 아래까지 늘어진다."""
    sh = F.bh['upperarm_l'].z
    TH = [math.pi / 2 + 0.85, math.pi / 2 + 0.35, math.pi / 2, math.pi / 2 - 0.4, 0.55]
    ZH = [F.z_chest + 0.04, F.z_neck - 0.01, F.z_neck - 0.005, F.z_neck - 0.02, F.z_chest + 0.0]
    ZL = [F.z_chest - 0.16, sh + 0.05, sh + 0.05, F.z_chest - 0.05, F.z_chest - 0.22]
    return drape_band(F, name, under, slot, TH, ZH, ZL, n=18, nrow=10, ease=0.016, loose=0.0, smooth=2)


def sari_veil(F, name, slot):
    """사리 머릿자락 (가운데 머리를 덮는 팔루 끝): 머리에 붙어 낮게 덮고, 얼굴은 넉넉히 트였으며, 앞·옆은 목 언저리에서 끝나고
    뒤로만 어깨뼈까지 늘어져 세로 주름이 진다 (뾰족한 두건이 되지 않게: 꼭대기 여유를 작게, 앞쪽 아랫단을 잘라 낸다)."""
    g = head_garment(F, name, 0.008, F.z_chest + 0.02, ease=0.014, ease_bot=0.03, face=(F.brow_z - 0.075, 0.13, 1.28), fabric='linen', slot=slot,
                     back_drop=0.0, hull_below=F.brow_z - 0.07)
    zcut = F.z_neck + 0.01
    hy = F.head_y
    for k, row in enumerate(g.P):             # 뒤 세로 주름: 이마 아래로 갈수록 깊게
        depth = max(0.0, (F.brow_z - g.zs[k]) / 0.25)
        for j, (x, y, z) in enumerate(row):
            a = math.atan2(x, y - hy)          # 0 = 뒤, ±π = 앞
            back = max(0.0, math.cos(a)) ** 1.5
            rr = math.hypot(x, y - hy)
            if rr < 1e-6:
                continue
            dr = 0.012 * depth * back * (0.5 + 0.5 * math.sin(9 * a + 0.7))
            row[j] = (x / rr * (rr + dr), hy + (y - hy) / rr * (rr + dr), z)

    # 수정 1차: 예전에는 keep(k, j) 로 격자 칸을 통째 지워 아랫단이 계단(톱니)이었다.
    #   이제는 얼굴 구멍보다 아래 행들을 열마다 원래 열 선(위 → 아래)을 따라 「자를 높이」까지 고르게 다시 놓는다 → 아랫단이 곧 그 높이의 매끈한 곡선.
    #   자를 높이: 앞·옆은 목 언저리, 뒤로 갈수록 부드럽게 가슴 높이까지. 마지막 두 행은 조금 바깥으로 (말린 단).
    K_ = len(g.P)
    z_chin = F.brow_z - 0.075 - 0.13
    ks = next((k for k in range(K_) if g.zs[k] < z_chin - 0.005), K_ - 2)
    span = K_ - 1 - ks

    def lim_of(a):
        return zcut if a > 1.25 else (zcut - (F.z_neck + 0.01 - F.z_chest - 0.02) * smooth01((1.25 - a) / 0.6))
    ncol = len(g.P[0])
    for j in range(ncol):
        col = [g.P[k][j] for k in range(ks, K_)]
        xb, yb, _ = col[-1]
        lim = max(lim_of(abs(math.atan2(xb, yb - hy))), col[-1][2])
        lim = min(lim, col[0][2] - 0.003 * span)
        # 열 선의 누적 길이에서 z = lim 인 곳까지
        acc, L = [0.0], 0.0
        for a_, b_ in zip(col, col[1:]):
            L += math.dist(a_, b_)
            acc.append(L)
        s_lim = acc[-1]
        for i in range(1, len(col)):
            if col[i][2] <= lim:
                z0_, z1_ = col[i - 1][2], col[i][2]
                t = (z0_ - lim) / max(1e-9, z0_ - z1_)
                s_lim = acc[i - 1] + (acc[i] - acc[i - 1]) * t
                break
        for i in range(1, len(col)):
            si = s_lim * i / span
            m = 1
            while m < len(acc) - 1 and acc[m] < si:
                m += 1
            t = (si - acc[m - 1]) / max(1e-9, acc[m] - acc[m - 1])
            pa, pb = col[m - 1], col[m]
            x, y, z = (pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t, pa[2] + (pb[2] - pa[2]) * t)
            roll = 0.005 if i == span else (0.002 if i == span - 1 else 0.0)
            if roll:
                rr = math.hypot(x, y - hy)
                if rr > 1e-6:
                    x, y = x / rr * (rr + roll), hy + (y - hy) / rr * (rr + roll)
            g.P[ks + i][j] = (x, y, z)
    g.zs = np.array([sum(p[2] for p in row) / ncol for row in g.P])
    return g


def cover_over(top, under, hy, gap=0.008, dz=0.025, da=0.14):
    """겉 격자 top 을 밑 띠 under 위로 띄운다 (머릿자락이 어깨·등에서 팔루를 덮게): top 정점마다 같은 높이·방향(머리 축 기준)의 밑 띠 점보다
    gap 만큼 바깥으로만 민다. 처음·끝 열이 겹쳐 붙는 행은 다시 같게 맞춘다 (앞 가운데 이음이 벌어지지 않게)."""
    U = np.array([p for row in under.P for p in row])
    ua, ur, uz = np.arctan2(U[:, 0], U[:, 1] - hy), np.hypot(U[:, 0], U[:, 1] - hy), U[:, 2]
    n = len(top.P[0])
    same = [math.dist(row[0], row[-1]) < 1e-5 for row in top.P]
    moved = 0
    for k, row in enumerate(top.P):
        for j, (x, y, z) in enumerate(row):
            a, r = math.atan2(x, y - hy), math.hypot(x, y - hy)
            m = (np.abs(uz - z) < dz) & (np.abs((ua - a + math.pi) % TAU - math.pi) < da)
            if r < 1e-6 or not m.any():
                continue
            need = float(ur[m].max()) + gap
            if need > r:
                row[j] = (x / r * need, hy + (y - hy) / r * need, z)
                moved += 1
        if same[k]:
            row[n - 1] = row[0]
    return moved


def sari(F, v, slot='prim', veil=False):
    """사리 + 촐리: 짧은 소매 촐리(가슴 아래까지), 허리에서 발목까지 사리 치마(주름 물결), 대각 자락(팔루), (머리를 덮는 자락)."""
    choli = torso_garment(F, v + '_choli', F.z_neck + 0.025, F.z_chest - 0.11, ease=0.011, ease_top=0.01, blouse=0.0, fabric='linen', slot='sec',
                          flare=0.0, fold_amp=0.002, drape_hip=False)
    sl = []
    for side, sg in (('l', 1), ('r', -1)):
        ua, la = arm_len(F, side)
        sl.append(limb_garment(F, '%s_csleeve_%s' % (v, side), sg, ['upperarm_' + side, 'lowerarm_' + side], -0.075, ua * 0.55, n=12,
                               ease=0.012, ease_end=0.014, fabric='linen', slot='sec'))
    skirt = torso_garment(F, v + '_sari', F.z_waist + 0.02, F.z_ankle + 0.006, ease=0.016, ease_top=0.012, blouse=0.0, fabric='linen', slot=slot,
                          flare=0.08, fold_amp=0.013, folds=12)
    pallu = pallu_band(F, v + '_pallu', [choli, skirt], slot)
    parts = [skirt, choli, *sl, pallu]
    if veil:
        vg = sari_veil(F, v + '_veil', slot)
        cover_over(vg, pallu, F.head_y)          # 수정 1차: 머릿자락이 어깨·등에서 팔루를 덮는다 (같은 천이 이어진 것; 팔루가 베일을 뚫고 나오던 것)
        parts.append(vg)
    return parts


def sarong(F, name, hem_z, slot='prim', hitch=0.0, flare=0.012):
    """사롱 (동남아 허리 두름): 허리에서 단까지 곧은 통 치마 (퍼짐 작게), 앞에 여민 겹 주름 한 줄. hitch 면 앞·뒤 단을 조금 걷어 올린다 (일할 때)."""
    g = torso_garment(F, name, F.z_waist + 0.035, hem_z, ease=0.015, ease_top=0.012, blouse=0.0, fabric='linen', slot=slot, flare=flare,
                      fold_amp=0.008, folds=6)
    if hitch:
        raise_hem(g, hitch, width=0.9, back=0.6)
    return g


def headcloth(F, name, slot='sec', h=0.035, nb=2):
    """동남아 머리 수건 (머리에 감아 묶은 천): 터번 틀로 낮고 납작하게, 엇갈림 없이."""
    return turban(F, name, h=h, bulge=0.02, tilt=0.03, slot=slot, nb=nb, band=0.008, cross=False, crown=0.32)


def kemben(F, v, slot='prim'):
    """가슴 두름 (동남아 여자): 겨드랑이 아래에서 허리까지 감은 천 (소매 없음)."""
    return torso_garment(F, v + '_kemben', F.z_chest + 0.075, F.z_waist + 0.0, ease=0.012, ease_top=0.012, blouse=0.0, fabric='linen', slot=slot,
                         flare=0.0, fold_amp=0.003, drape_hip=False)


def blouse_sea(F, v, slot='sec'):
    """짧은 저고리 (동남아 여자 웃옷): 목에서 엉덩이 위까지, 팔꿈치 아래까지 오는 소매. 사롱 허리춤을 덮으므로 여유를 크게 (단이 톱니로 뚫리지 않게)."""
    t = torso_garment(F, v + '_blouse', F.z_neck + 0.03, F.z_hip - 0.02, ease=0.027, ease_top=0.011, blouse=0.02, fabric='linen', slot=slot, flare=0.04,
                      fold_amp=0.006, folds=6)
    return [t, *sleeves(F, v, frac=0.8, ease=0.013, ease_end=0.02, fabric='linen', slot=slot)]


def build_variant_parts_sea(v, F):
    """동남아 (본토·섬) 평민 일반형: 사롱 + 짧은 웃옷(또는 맨 윗몸 하나) + 머리 수건(또는 맨머리). 터번·사리·베일은 없다."""
    parts, hair = [], []
    if v == 'm_tunic':        # 발목 사롱 + 엉덩이 길이 웃옷 + 머리 수건
        parts += [sarong(F, v + '_sarong', F.z_ankle + 0.06, slot='nat'), *kurta(F, v, F.z_hip - 0.1, slot='prim', frac=0.6), headcloth(F, v + '_turban', slot='sec')]
    elif v == 'm_hood':       # 종아리 사롱 + 긴소매 웃옷, 맨머리
        parts += [sarong(F, v + '_sarong', F.z_knee - 0.2, slot='prim'), *kurta(F, v, F.z_hip - 0.08, slot='nat', frac=0.95)]
        hair = ['Hair_SimpleParted']
    elif v == 'm_smith':      # 대장장이: 무릎 사롱(걷어 올림) + 반소매 웃옷 + 머리 수건
        parts += [sarong(F, v + '_sarong', F.z_knee - 0.04, slot='prim', hitch=0.12), *kurta(F, v, F.z_hip - 0.1, slot='nat', frac=0.3),
                  headcloth(F, v + '_turban', slot='sec', h=0.03)]
    elif v == 'm_field':      # 밭일꾼 (맨 윗몸은 이 하나): 무릎 위로 걷어 올린 사롱 + 어깨 수건 + 머리 수건
        parts += [sarong(F, v + '_sarong', F.z_knee + 0.04, slot='nat', hitch=0.22), gamcha(F, v + '_stole', [], 'prim'),
                  headcloth(F, v + '_turban', slot='prim', h=0.03)]
    elif v == 'child':        # 아이: 무릎 웃옷, 맨다리
        parts += kurta(F, v, F.z_knee + 0.06, slot='prim', frac=0.45, flat=(F.z_chest - 0.17, F.z_chest + 0.07))
        hair = ['Hair_BuzzedFemale']
    elif v == 'elder':        # 노인: 발목 사롱 + 긴 웃옷 + 흰 머리 수건
        parts += [sarong(F, v + '_sarong', F.z_ankle + 0.05, slot='sec'), *kurta(F, v, F.z_hip - 0.04, slot='nat', frac=0.9),
                  headcloth(F, v + '_turban', slot='nat', h=0.04)]
        hair = ['Hair_Beard']
    elif v == 'f_apron':      # 발목 사롱 + 짧은 저고리, 틀어 올린 머리
        parts += [sarong(F, v + '_sarong', F.z_ankle + 0.01, slot='prim', flare=0.016), *blouse_sea(F, v, slot='sec')]
        hair = ['Hair_Buns']
    elif v == 'f_cloak':      # 발목 사롱 + 가슴 두름 + 왼어깨 띠, 긴 머리
        k = kemben(F, v, slot='sec')
        parts += [sarong(F, v + '_sarong', F.z_ankle + 0.01, slot='prim', flare=0.016), k, gamcha(F, v + '_stole', [k], 'nat')]
        hair = ['Hair_Long']
    for g in parts:
        if g.obj is None:
            grid_object(g)
    return parts, hair


# ───────────────────────── 동아시아 옷 (KIT_CULTURE=china|korea|japan, 시대 일반형 평민 옷) ─────────────────────────
# 변형 이름은 잉글랜드와 같은 자리(역할):
#   한국(조선 평민): m_tunic 저고리 + 바지(대님) + 상투·망건 · m_hood 두루마기 + 갓 + 수염 · m_smith 저고리(소매 걷음) + 바지 + 머리띠
#                    m_field 짧은 저고리 + 걷은 바지 + 삿갓, 맨발 · f_apron 저고리 + 치마(가슴 위) + 앞치마 + 머릿수건 · f_cloak 치마저고리 + 쪽머리·비녀
#                    child 저고리 + 바지 + 땋은 머리·댕기 · elder 흰 두루마기 + 갓 + 흰 수염. 평민 옷은 흰·생무명이 많다 (slot nat)
#   중국(한족 평민): m_tunic 짧은 겉옷(교령 우임) + 허리끈 + 바지 + 두건 · m_hood 긴 포 + 허리끈 + 검은 건 + 수염 · m_smith 짧은 옷(소매 걷음) + 바지 + 가죽 앞치마
#                    m_field 짧은 옷 + 걷은 바지 + 삿갓(두립) · f_apron 저고리꼴 웃옷 + 치마 + 앞치마 + 쪽 · f_cloak 긴 웃옷 + 치마 + 쪽 · child 짧은 옷 + 바지 + 쌍상투
#                    elder 긴 포 + 두건 + 수염
#   일본(에도 무렵 평민 고소데): m_tunic 무릎 고소데 + 띠 + 모모히키 + 머리띠·상투(촌마게) · m_hood 긴 고소데 + 하오리 + 촌마게 · m_smith 짧은 고소데 + 모모히키 + 머리띠
#                    m_field 짧은 고소데 + 각반 + 스게가사 · f_apron 긴 고소데 + 넓은 오비 + 앞치마 + 머릿수건 · f_cloak 긴 고소데 + 넓은 오비(등 매듭) + 올린 머리
#                    child 무릎 고소데 + 띠 · elder 긴 고소데 + 하오리 + 수염
# 깃: 왼 섶이 오른 섶을 덮는 교령(왼어깨 → 오른 겨드랑이로 내려가는 선)을 띠(drape_band)로, 한국 저고리는 오른 가슴의 고름 둘.
# 머리카락 조각(상투·쪽·땋은 머리·머리 덮개)은 몸 재질의 머리카락 그림 칸을 쓰고 장면이 머리색을 칠한다 (g.hair).
KR_, CN_, JP_ = CULTURE == 'korea', CULTURE == 'china', CULTURE == 'japan'


def mesh_part(name, bm, fabric='linen', slot='nat', rigid='Head', hair=False, col=None):
    """bmesh → 옷 조각 (Grid 꼴). UV 는 원통 투영. rigid 면 그 뼈에 고정."""
    uvl = bm.loops.layers.uv.verify()
    tile = TILE[fabric]
    for f in bm.faces:
        f.smooth = True
        for l in f.loops:
            p = l.vert.co
            l[uvl].uv = (math.atan2(p.x, p.y - 0.03) * 0.08 / tile, p.z / tile)
    me = bpy.data.meshes.new(name)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    g = Grid(name, None, True, fabric, slot)
    g.obj = ob
    g.rigid = rigid
    g.nohide = True
    g.hair = hair
    if col:
        g.col = col
    return g


def hair_uv(ob):
    """머리카락 조각: 면이 바깥(머리 가운데 반대쪽)을 보게 맞추고 (몸 재질은 뒷면을 그리지 않는다),
    UV 를 0~1 안 (둘레 각 × 높이) 으로 → keep_uv0 가 머리카락 그림 칸으로 옮긴다."""
    me = ob.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.normal_update()
    c = Vector((0.0, 0.0, 0.0))
    for v in bm.verts:
        c += v.co
    c /= max(1, len(bm.verts))
    acc = sum(f.normal.dot(f.calc_center_median() - c) * f.calc_area() for f in bm.faces)
    if acc < 0:
        bmesh.ops.reverse_faces(bm, faces=list(bm.faces), flip_multires=False)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    zs = [v.co.z for v in me.vertices]
    z0, z1 = min(zs), max(zs)
    uv = me.uv_layers[0].data
    for poly in me.polygons:
        for li, vi in zip(poly.loop_indices, poly.vertices):
            p = me.vertices[vi].co
            a = (math.atan2(p.x, p.y - 0.03) / TAU) % 1.0
            uv[li].uv = (0.05 + 0.9 * a, 0.05 + 0.9 * (p.z - z0) / max(1e-4, z1 - z0))


def _lathe(F, prof, cx, cy, n=14):
    """(r, z) 단면을 (cx, cy) 세로축으로 돌린 bmesh (꼭대기·밑 닫힘)."""
    import kit_props as KP
    bm = KP.lathe_bm([(r, z) for r, z in prof], n=n, cap0=True, cap1=True)
    bmesh.ops.translate(bm, verts=bm.verts, vec=(cx, cy, 0.0))
    return bm


def topknot(F, name):
    """상투 (한국)·머리 위 묶은 쪽 (중국 남자, 두건 밑): 정수리 위 작은 둥근 기둥."""
    zt = F.head_top
    prof = [(0.046, zt - 0.025), (0.04, zt + 0.005), (0.034, zt + 0.045), (0.036, zt + 0.07), (0.022, zt + 0.088)]
    return mesh_part(name + '_hair_knot', _lathe(F, prof, 0.0, F.head_y + 0.005), hair=True)


def chonmage(F, name):
    """촌마게 (일본 남자 상투): 정수리에 앞으로 눕혀 접은 짧은 머리 다발."""
    import kit_props as KP
    zt = F.head_top + 0.012
    st = [((0.0, F.head_y + 0.07, zt - 0.02), 0.022, 0.022), ((0.0, F.head_y + 0.03, zt + 0.012), 0.02, 0.018), ((0.0, F.head_y - 0.02, zt + 0.02), 0.017, 0.014),
          ((0.0, F.head_y - 0.055, zt + 0.012), 0.013, 0.01)]
    return mesh_part(name + '_hair_mage', KP.loft_bm(st, n=8), hair=True)


def hair_cap(F, name, z_bot, face=None, part=True):
    """머리 덮개 (가르마 탄 납작한 머리): 머리 모양을 따라 4 mm 위, 얼굴은 트임. 몸 재질 머리카락 칸."""
    g = head_garment(F, name + '_hair_cap', 0.006, z_bot, n=25, ease=0.005, ease_bot=0.008,
                     face=face or (F.brow_z - 0.06, 0.115, 1.32), fabric='linen', slot='nat', with_torso=False)
    g.hair = True
    g.rigid = 'Head'
    g.nohide = True
    return g


def bun(F, name, c, r, stretch=(1.0, 1.0, 1.0), pin=True):
    """쪽 (틀어 올린 머리): 타원 덩이 + 비녀 (가로 막대, 짚 빛 = 금빛)."""
    import kit_props as KP
    parts = [mesh_part(name + '_bun', KP.ellipsoid_bm(c, (r * stretch[0], r * stretch[1], r * stretch[2]), nu=12, nv=7), hair=True)]
    if pin:
        parts.append(mesh_part(name + '_pin', KP.tube_bm([(c[0] - r * 1.9, c[1] + 0.005, c[2]), (c[0] + r * 1.9, c[1] + 0.005, c[2])], 0.006, n=6),
                               fabric='straw', slot='nat', col=(0, 0, 1.0, FAB['straw'])))
    return parts


def braid(F, name, length=0.42):
    """땋은 머리 (뒤로 늘어뜨림) + 끝 댕기. 가중치는 몸에서 (등을 따라 움직인다)."""
    import kit_props as KP
    y0 = F.head_y + 0.095
    pts = [(0.0, y0, F.brow_z - 0.02), (0.0, y0 + 0.02, F.z_neck + 0.03), (0.0, y0 + 0.055, F.z_neck - 0.08), (0.0, y0 + 0.07, F.z_neck - length)]
    st = [(p, 0.024 - 0.006 * k / 3, 0.02 - 0.005 * k / 3) for k, p in enumerate(pts)]
    g = mesh_part(name + '_braid', KP.loft_bm(st, n=8), hair=True, rigid=None)
    g.rigid = None
    end = pts[-1]
    rib = mesh_part(name + '_daenggi', KP.loft_bm([((end[0], end[1] + 0.005, end[2] + 0.02), 0.03, 0.006), ((end[0], end[1] + 0.012, end[2] - 0.1), 0.035, 0.005)],
                                                 n=6), fabric='linen', slot='prim', rigid=None)
    rib.rigid = None
    return [g, rib]


def headband(F, name, z, h=0.032, slot='nat', col=None, ease=0.007):
    """머리띠·망건: 이마 높이에서 머리를 두른 띠 (머리뼈에 고정)."""
    th, D = dirs_of(24)
    rb, c = F.support(z, F.kind_v == 'head', D, dz=0.012, center=np.array([0.0, F.head_y]))
    P = []
    for zz in (z + h / 2, z - h / 2):
        P.append([(float(c[0] + (rb[j] + ease) * D[j][0]), float(c[1] + (rb[j] + ease) * D[j][1]), float(zz)) for j in range(24)])
    g = Grid(name + '_band', P, True, 'linen', slot)
    g.zs = np.array([z + h / 2, z - h / 2])
    g.rigid = 'Head'
    g.nohide = True
    if col:
        g.col = col
    return g


def cone_hat(F, name, r, h, knob=0.0, droop=0.02, col=None):
    """삿갓·두립·스게가사: 머리를 넉넉히 덮는 원뿔 (짚), 머리뼈에 고정. 테가 머리에 걸리는 높이를 원뿔 안쪽이 머리 위를 지나게 잡는다."""
    rh = 0.1
    zb = F.head_top - h * (1 - rh / r) + 0.045
    prof = [(0.0, zb + h + knob)]
    if knob:
        prof += [(0.02, zb + h + knob * 0.8), (0.025, zb + h)]
    for t in (0.12, 0.3, 0.5, 0.7, 0.88, 1.0):
        prof.append((r * t, zb + h * (1 - t)))
    prof += [(r + 0.012, zb - droop), (r + 0.006, zb - droop - 0.012)]
    n = 26
    P = [[(rr * math.sin(a), F.head_y + rr * math.cos(a), z) for a in (np.arange(n) * TAU / n)] for (rr, z) in prof[1:]]
    g = Grid(name + '_hat', P, True, 'straw', 'nat', apex=(0.0, F.head_y, prof[0][1]))
    g.zs = np.array([z for _, z in prof[1:]])
    if col:
        g.col = col
    return g


def gat(F, name):
    """갓 (조선 남자): 검은 둥근 갓모자 + 넓고 판판한 양태. 가죽 결 + 생지 칸을 아주 어둡게 (검정)."""
    zb = F.brow_z + 0.075
    zt = F.head_top + 0.15
    prof = [(0.07, zt), (0.082, zt - 0.015), (0.086, zb + 0.01), (0.1, zb + 0.002), (0.22, zb - 0.004), (0.3, zb - 0.012), (0.305, zb - 0.02)]
    n = 22                                      # 노인(두루마기+갓) LOD0 가 1만 1천 삼각형 안에 들게
    P = [[(rr * math.sin(a), F.head_y + 0.005 + rr * math.cos(a), z) for a in (np.arange(n) * TAU / n)] for (rr, z) in prof]
    g = Grid(name + '_gat', P, True, 'leather', 'nat', apex=(0.0, F.head_y + 0.005, zt + 0.003))
    g.zs = np.array([z for _, z in prof])
    g.rigid = 'Head'
    g.col = (0.0, 0.0, 0.14, FAB['leather'])
    g.nohide = True
    return g


def cross_collar(F, name, under, slot='nat', z_end=None, hw=0.02, japan=False, col=None):
    """교령 깃: 왼 섶 가장자리(왼어깨·목 뒤 → 가슴 가운데 → 오른 겨드랑이 / 일본은 가운데 앞으로 오비까지) + 오른 깃(목 오른쪽 → 가슴 가운데 밑으로 숨음)."""
    zn = F.z_neck
    if japan:
        TH = [math.pi + 0.42, math.pi + 0.3, math.pi + 0.08, math.pi / 2 + 0.42, math.pi / 2, 0.0, -0.75]
        zc = [z_end if z_end is not None else F.z_waist + 0.02, F.z_chest - 0.04, zn - 0.17, zn - 0.05, zn - 0.005, zn + 0.02, zn + 0.0]
    else:
        TH = [4.05, math.pi + 0.5, math.pi, math.pi / 2 + 0.4, math.pi / 2, 0.0, -0.75]
        zc = [z_end if z_end is not None else F.z_chest - 0.08, zn - 0.25, zn - 0.16, zn - 0.045, zn - 0.005, zn + 0.02, zn + 0.0]
    hws = [hw * 1.5, hw * 1.45, hw * 1.35, hw * 1.1, hw, hw, hw]
    a = drape_band(F, name + '_collar', under, slot, TH, [z + h for z, h in zip(zc, hws)], [z - h for z, h in zip(zc, hws)], n=26, nrow=4, ease=0.016,
                   gap=0.006, loose=0.0, smooth=2)
    if japan:
        TH2, zc2 = [5.45, 4.71, math.pi + 0.3], [zn + 0.0, zn - 0.03, zn - 0.2]
    else:
        TH2, zc2 = [5.45, 4.71, 3.9], [zn + 0.0, zn - 0.02, zn - 0.13]
    b = drape_band(F, name + '_collar2', under, slot, TH2, [z + hw for z in zc2], [z - hw for z in zc2], n=10, nrow=4, ease=0.016, gap=0.005, loose=0.0, smooth=2)
    for g in (a, b):
        if col:
            g.col = col
    return [a, b]


def goreum(F, name, under, slot='prim'):
    """저고리 고름: 오른 가슴 섶 끝에 매어 늘어뜨린 긴 끈 둘 (긴 것 0.34, 짧은 것 0.24)."""
    out = []
    zc = F.z_chest + 0.0
    for k, (th0, L) in enumerate(((math.pi + 0.36, 0.34), (math.pi + 0.5, 0.24))):
        TH = [th0 + 0.13, th0 - 0.13]
        g = drape_band(F, '%s_goreum%d' % (name, k), under, slot, TH, [zc, zc], [zc - L, zc - L], n=3, nrow=7, ease=0.02, gap=0.012, loose=0.0)
        out.append(g)
    return out


def ea_jacket(F, v, hem_z, slot, frac=1.0, ease=0.034, ease_end=0.05, belt=None, flat=None, name='_jacket', z_top=None, folds=7):
    """동아시아 웃옷 (저고리·짧은 겉옷·고소데): 목에서 hem_z 까지, 소매는 끝이 넉넉히 벌어진다."""
    t = torso_garment(F, v + name, z_top or (F.z_neck + 0.03), hem_z, ease=ease, ease_top=0.012, blouse=0.03, fabric='linen', slot=slot, flare=0.07,
                      fold_amp=0.01, folds=folds, belt=belt, flat=flat)
    return [t, *sleeves(F, v, frac=frac, ease=0.02, ease_end=ease_end, fabric='linen', slot=slot, n=12)]


def trousers(F, v, slot='nat', hem_frac=1.0, ease=0.03, ease_end=0.016, tie=True, tie_slot='sec'):
    """바지·통 넓은 바지: 엉덩이 통(허리 → 가랑이 아래) + 다리 통 둘 (넓게, 발목에서 조인다). tie 면 발목에 대님·행전 띠."""
    seat = torso_garment(F, v + '_seat', F.z_waist + 0.04, F.z_crotch - 0.05, ease=0.016, ease_top=0.014, blouse=0.0, fabric='linen', slot=slot, flare=0.03,
                         fold_amp=0.006, folds=8)
    out = [seat]
    for side, sg in (('l', 1), ('r', -1)):
        L1 = (F.bt['thigh_' + side] - F.bh['thigh_' + side]).length
        L2 = (F.bt['calf_' + side] - F.bh['calf_' + side]).length
        s1 = (L1 + L2 - 0.04) * hem_frac
        out.append(limb_garment(F, '%s_pants_%s' % (v, side), sg, ['thigh_' + side, 'calf_' + side], -0.06, s1, n=10, ease=ease, ease_end=ease_end, ds=0.03,
                                fabric='linen', slot=slot, kinds=('leg',), min_r=0.05))
        if tie and hem_frac > 0.9:
            out.append(limb_garment(F, '%s_wrap_%s' % (v, side), sg, ['calf_' + side], L2 - 0.12, L2 - 0.05, n=10, ease=0.014, ease_end=0.014, ds=0.02,
                                    fabric='linen', slot=tie_slot, kinds=('leg',), min_r=0.035))
    return out


def straw_shoes(F, name):
    """짚신·조리 (발에 붙는 짚 신): 신을 짚 결 생지로."""
    g = shoes(F, name)
    g.fabric = 'straw'
    return g


def obi(t, F, name, half=0.05, slot='sec', z=None):
    return belt_of(t, F, z if z is not None else F.z_waist - 0.01, name + '_obi', off=0.011, fabric='linen', slot=slot, half=half)


def build_variant_parts_ea(v, F):
    parts, hair = [], []
    zn = F.z_neck
    if KR_:
        if v == 'm_tunic':        # 저고리 + 바지(대님) + 상투·망건
            j = ea_jacket(F, v, F.z_hip - 0.08, 'nat', ease_end=0.055)
            parts += [*j, *trousers(F, v, 'nat'), *cross_collar(F, v, [j[0]], 'nat'), topknot(F, v), headband(F, v, F.brow_z + 0.035, col=(0, 0, 0.12, FAB['linen'])), straw_shoes(F, v)]
            hair = ['Hair_Buzzed']
        elif v == 'm_hood':       # 두루마기 + 갓 + 수염
            coat = torso_garment(F, v + '_coat', zn + 0.03, F.z_knee - 0.22, ease=0.03, ease_top=0.013, blouse=0.02, fabric='linen', slot='sec', flare=0.08,
                                 fold_amp=0.013, folds=8)
            parts += [coat, *sleeves(F, v, ease=0.022, ease_end=0.065, fabric='linen', slot='sec'), *trousers(F, v, 'nat'), *cross_collar(F, v, [coat], 'nat'),
                      topknot(F, v), gat(F, v), straw_shoes(F, v)]
            hair = ['Hair_Beard']
        elif v == 'm_smith':      # 저고리(소매 걷음) + 바지 + 흰 머리띠
            j = ea_jacket(F, v, F.z_hip - 0.1, 'nat', frac=0.55, ease_end=0.03)
            parts += [*j, *trousers(F, v, 'nat'), *cross_collar(F, v, [j[0]], 'nat'), topknot(F, v), headband(F, v, F.brow_z + 0.03, slot='nat'), straw_shoes(F, v)]
            hair = ['Hair_Buzzed']
        elif v == 'm_field':      # 짧은 저고리 + 걷은 바지 + 삿갓, 맨발
            j = ea_jacket(F, v, F.z_hip - 0.04, 'nat', frac=0.5, ease_end=0.03)
            parts += [*j, *trousers(F, v, 'nat', hem_frac=0.62, ease=0.035, ease_end=0.04, tie=False), *cross_collar(F, v, [j[0]], 'nat'),
                      topknot(F, v), cone_hat(F, v, 0.4, 0.27, knob=0.03)]
            hair = ['Hair_Buzzed']
        elif v == 'f_apron':      # 저고리 + 치마(가슴 위) + 앞치마 + 머릿수건
            ch = torso_garment(F, v + '_chima', F.z_chest + 0.035, F.z_ankle + 0.006, ease=0.02, ease_top=0.014, blouse=0.0, fabric='linen', slot='prim',
                               flare=0.15, fold_amp=0.02, folds=14)
            j = ea_jacket(F, v, F.z_chest - 0.01, 'nat', ease=0.034, ease_end=0.05)
            ap = apron_of(ch, F, F.z_waist + 0.02, F.z_knee - 0.05, 0.95, v + '_apron')
            parts += [ch, *j, ap, *cross_collar(F, v, [j[0]], 'nat', z_end=F.z_chest + 0.0), hair_cap(F, v, F.brow_z - 0.1), *bun(F, v, (0.0, F.head_y + 0.105, F.z_neck + 0.075), 0.045, (1.25, 0.8, 0.85)),
                      head_garment(F, v + '_head', 0.02, F.brow_z - 0.02, ease=0.016, ease_bot=0.02, face=(F.brow_z - 0.06, 0.1, 1.15), fabric='linen', slot='nat',
                                   with_torso=False), straw_shoes(F, v)]
        elif v == 'f_cloak':      # 치마저고리 (물들인 치마, 흰 저고리) + 쪽머리·비녀
            ch = torso_garment(F, v + '_chima', F.z_chest + 0.035, F.z_ankle + 0.006, ease=0.02, ease_top=0.014, blouse=0.0, fabric='linen', slot='prim',
                               flare=0.17, fold_amp=0.022, folds=14)
            j = ea_jacket(F, v, F.z_chest - 0.01, 'sec', ease=0.034, ease_end=0.05)
            parts += [ch, *j, *cross_collar(F, v, [j[0]], 'nat', z_end=F.z_chest + 0.0), hair_cap(F, v, F.brow_z - 0.1), *bun(F, v, (0.0, F.head_y + 0.105, F.z_neck + 0.075), 0.047, (1.25, 0.8, 0.85)), straw_shoes(F, v)]
        elif v == 'child':        # 저고리 + 바지 + 땋은 머리·댕기
            j = ea_jacket(F, v, F.z_hip - 0.06, 'prim', ease_end=0.045, flat=(F.z_chest - 0.17, F.z_chest + 0.07))
            parts += [*j, *trousers(F, v, 'nat', tie=False), *cross_collar(F, v, [j[0]], 'nat'), hair_cap(F, v, F.brow_z - 0.1), *braid(F, v), straw_shoes(F, v)]
        elif v == 'elder':        # 흰 두루마기 + 갓 + 흰 수염
            coat = torso_garment(F, v + '_coat', zn + 0.03, F.z_knee - 0.25, ease=0.03, ease_top=0.013, blouse=0.02, fabric='linen', slot='nat', flare=0.08,
                                 fold_amp=0.013, folds=8)
            parts += [coat, *sleeves(F, v, ease=0.022, ease_end=0.065, fabric='linen', slot='nat'), *trousers(F, v, 'nat'), *cross_collar(F, v, [coat], 'nat'),
                      topknot(F, v), gat(F, v), straw_shoes(F, v)]
            hair = ['Hair_Beard']
    elif CN_:
        if v == 'm_tunic':        # 짧은 겉옷(교령) + 허리끈 + 바지 + 두건
            j = ea_jacket(F, v, F.z_hip - 0.2, 'prim', belt=F.z_waist - 0.04, ease=0.044, ease_end=0.045)
            parts += [*j, belt_of(j[0], F, F.z_waist - 0.04, v + '_sash', fabric='linen', slot='sec', half=0.022), *trousers(F, v, 'nat', tie_slot='sec'),
                      *cross_collar(F, v, [j[0]], 'sec'), topknot(F, v),
                      head_garment(F, v + '_head', 0.03, F.brow_z - 0.03, ease=0.012, ease_bot=0.012, face=(F.brow_z - 0.08, 0.12, 1.3), fabric='linen', slot='sec',
                                   with_torso=False, peak=0.02), shoes(F, v)]
        elif v == 'm_hood':       # 긴 포 + 허리끈 + 검은 건 + 수염
            robe = torso_garment(F, v + '_robe', zn + 0.03, F.z_ankle + 0.05, ease=0.028, ease_top=0.012, blouse=0.03, fabric='linen', slot='prim', flare=0.08,
                                 fold_amp=0.014, folds=9, belt=F.z_waist - 0.04)
            parts += [robe, *sleeves(F, v, ease=0.022, ease_end=0.075, fabric='linen', slot='prim'), belt_of(robe, F, F.z_waist - 0.04, v + '_sash', fabric='linen',
                      slot='sec', half=0.022), *cross_collar(F, v, [robe], 'sec'), topknot(F, v),
                      head_garment(F, v + '_head', 0.045, F.brow_z - 0.02, ease=0.012, ease_bot=0.012, face=(F.brow_z - 0.08, 0.12, 1.35), fabric='linen', slot='nat',
                                   with_torso=False, peak=0.03), shoes(F, v)]
            parts[-2].col = (0.0, 0.0, 0.14, FAB['linen'])
            hair = ['Hair_Beard']
        elif v == 'm_smith':      # 짧은 옷(소매 걷음) + 바지 + 가죽 앞치마
            j = ea_jacket(F, v, F.z_hip - 0.18, 'nat', frac=0.5, ease=0.044, ease_end=0.03)
            ap = torso_garment(F, v + '_smith_apron', F.z_chest + 0.02, F.z_knee - 0.1, ease=0.065, ease_top=0.045, blouse=0.0, fabric='leather', slot='nat', flare=0.07,
                               fold_amp=0.004, folds=5, sector=FRONT(0.98))
            parts += [*j, *trousers(F, v, 'sec'), ap, *cross_collar(F, v, [j[0]], 'sec'), topknot(F, v), headband(F, v, F.brow_z + 0.03, slot='sec'), shoes(F, v)]
            hair = ['Hair_Buzzed']
        elif v == 'm_field':      # 짧은 옷 + 걷은 바지 + 두립, 맨발
            j = ea_jacket(F, v, F.z_hip - 0.12, 'nat', frac=0.45, ease_end=0.03)
            parts += [*j, *trousers(F, v, 'prim', hem_frac=0.62, ease=0.03, ease_end=0.035, tie=False), *cross_collar(F, v, [j[0]], 'sec'),
                      topknot(F, v), cone_hat(F, v, 0.36, 0.2, knob=0.035)]
            hair = ['Hair_Buzzed']
        elif v == 'f_apron':      # 웃옷(엉덩이) + 치마 + 앞치마 + 쪽
            sk = torso_garment(F, v + '_skirt', F.z_waist + 0.03, F.z_ankle + 0.006, ease=0.018, ease_top=0.012, blouse=0.0, fabric='linen', slot='sec', flare=0.1,
                               fold_amp=0.016, folds=12)
            j = ea_jacket(F, v, F.z_hip - 0.1, 'prim', ease=0.03, ease_end=0.05)
            ap = apron_of(sk, F, F.z_hip - 0.12, F.z_knee - 0.12, 0.95, v + '_apron')
            parts += [sk, *j, ap, *cross_collar(F, v, [j[0]], 'nat'), hair_cap(F, v, F.brow_z - 0.1),
                      *bun(F, v, (0.0, F.head_y + 0.085, F.head_top - 0.035), 0.05, (1.0, 0.9, 0.9)), shoes(F, v)]
        elif v == 'f_cloak':      # 긴 웃옷(무릎) + 치마 + 쪽
            sk = torso_garment(F, v + '_skirt', F.z_waist + 0.03, F.z_ankle + 0.006, ease=0.018, ease_top=0.012, blouse=0.0, fabric='linen', slot='prim', flare=0.1,
                               fold_amp=0.016, folds=12)
            j = ea_jacket(F, v, F.z_hip - 0.1, 'sec', ease=0.036, ease_end=0.06)
            parts += [sk, *j, *cross_collar(F, v, [j[0]], 'prim'), hair_cap(F, v, F.brow_z - 0.1),
                      *bun(F, v, (0.0, F.head_y + 0.07, F.head_top - 0.005), 0.052, (1.1, 0.9, 0.85)), shoes(F, v)]
        elif v == 'child':        # 짧은 옷 + 바지 + 쌍상투
            j = ea_jacket(F, v, F.z_hip - 0.1, 'prim', ease_end=0.04, flat=(F.z_chest - 0.17, F.z_chest + 0.07))
            parts += [*j, *trousers(F, v, 'nat', tie=False), *cross_collar(F, v, [j[0]], 'sec'), shoes(F, v)]
            hair = ['Hair_Buns']
        elif v == 'elder':        # 긴 포 + 두건 + 수염
            robe = torso_garment(F, v + '_robe', zn + 0.03, F.z_ankle + 0.04, ease=0.03, ease_top=0.012, blouse=0.03, fabric='linen', slot='prim', flare=0.08,
                                 fold_amp=0.014, folds=9, belt=F.z_waist - 0.04)
            parts += [robe, *sleeves(F, v, ease=0.022, ease_end=0.07, fabric='linen', slot='prim'), belt_of(robe, F, F.z_waist - 0.04, v + '_sash', fabric='linen',
                      slot='sec', half=0.022), *cross_collar(F, v, [robe], 'nat'), topknot(F, v),
                      head_garment(F, v + '_head', 0.03, F.brow_z - 0.03, ease=0.012, ease_bot=0.012, face=(F.brow_z - 0.08, 0.12, 1.3), fabric='linen', slot='sec',
                                   with_torso=False, peak=0.02), shoes(F, v)]
            hair = ['Hair_Beard']
    else:
        if v == 'm_tunic':        # 무릎 고소데 + 띠 + 모모히키 + 머리띠·촌마게
            k = ea_jacket(F, v, F.z_knee + 0.04, 'prim', ease_end=0.06, name='_kosode')
            parts += [k[0], *k[1:], obi(k[0], F, v, half=0.025, slot='sec'), hose(F, v, F.z_knee + 0.1, slot='sec'), *cross_collar(F, v, [k[0]], 'sec', japan=True),
                      chonmage(F, v), headband(F, v, F.brow_z + 0.03, slot='nat'), straw_shoes(F, v)]
            hair = ['Hair_Buzzed']
        elif v == 'm_hood':       # 긴 고소데 + 하오리 + 촌마게
            k = ea_jacket(F, v, F.z_ankle + 0.06, 'sec', ease_end=0.065, name='_kosode')
            ha = torso_garment(F, v + '_haori', zn + 0.025, F.z_hip - 0.16, ease=0.045, ease_top=0.02, blouse=0.01, fabric='linen', slot='prim', flare=0.06,
                               fold_amp=0.01, folds=6, sector=lambda th: abs(th - math.pi) > 0.3)
            parts += [k[0], *k[1:], obi(k[0], F, v, half=0.03, slot='nat'), ha, *cross_collar(F, v, [k[0], ha], 'nat', japan=True), chonmage(F, v), straw_shoes(F, v)]
            hair = ['Hair_Buzzed']
        elif v == 'm_smith':      # 짧은 고소데(소매 걷음) + 모모히키 + 머리띠
            k = ea_jacket(F, v, F.z_hip - 0.14, 'prim', frac=0.55, ease_end=0.03, name='_kosode')
            parts += [k[0], *k[1:], obi(k[0], F, v, half=0.022, slot='sec'), hose(F, v, F.z_hip - 0.08, slot='sec'), *cross_collar(F, v, [k[0]], 'nat', japan=True,
                      z_end=F.z_waist - 0.02), chonmage(F, v), headband(F, v, F.brow_z + 0.03, slot='nat'), straw_shoes(F, v)]
            hair = ['Hair_Buzzed']
        elif v == 'm_field':      # 짧은 고소데 + 각반 + 스게가사
            k = ea_jacket(F, v, F.z_hip - 0.12, 'prim', frac=0.5, ease_end=0.035, name='_kosode')
            parts += [k[0], *k[1:], obi(k[0], F, v, half=0.022, slot='nat'), hose(F, v, F.z_hip - 0.06, slot='sec'), *leg_wraps(F, v),
                      *cross_collar(F, v, [k[0]], 'nat', japan=True, z_end=F.z_waist - 0.02), chonmage(F, v), cone_hat(F, v, 0.34, 0.13, droop=0.025), straw_shoes(F, v)]
            hair = ['Hair_Buzzed']
        elif v == 'f_apron':      # 긴 고소데 + 넓은 오비 + 앞치마 + 머릿수건
            k = ea_jacket(F, v, F.z_ankle + 0.008, 'prim', ease=0.022, ease_end=0.06, name='_kosode')
            ap = apron_of(k[0], F, F.z_waist - 0.08, F.z_knee - 0.12, 0.95, v + '_apron')
            parts += [k[0], *k[1:], obi(k[0], F, v, half=0.06, slot='sec'), ap, *cross_collar(F, v, [k[0]], 'nat', japan=True), hair_cap(F, v, F.brow_z - 0.1),
                      head_garment(F, v + '_head', 0.02, F.brow_z - 0.0, ease=0.016, ease_bot=0.018, face=(F.brow_z - 0.06, 0.1, 1.2), fabric='linen', slot='nat',
                                   with_torso=False, back_drop=0.02), straw_shoes(F, v)]
        elif v == 'f_cloak':      # 긴 고소데 + 넓은 오비(등 매듭) + 올린 머리
            k = ea_jacket(F, v, F.z_ankle + 0.008, 'prim', ease=0.022, ease_end=0.065, name='_kosode')
            o = obi(k[0], F, v, half=0.065, slot='sec')
            knot = drape_band(F, v + '_obi_knot', [k[0]], 'sec', [0.5, 0.0, -0.5], [F.z_waist + 0.06, F.z_waist + 0.07, F.z_waist + 0.06],
                              [F.z_waist - 0.2, F.z_waist - 0.22, F.z_waist - 0.2], n=8, nrow=6, ease=0.03, gap=0.03, loose=0.0)
            parts += [k[0], *k[1:], o, knot, *cross_collar(F, v, [k[0]], 'nat', japan=True), hair_cap(F, v, F.brow_z - 0.1),
                      *bun(F, v, (0.0, F.head_y + 0.06, F.head_top + 0.0), 0.055, (1.2, 1.25, 0.8)), straw_shoes(F, v)]
        elif v == 'child':        # 무릎 고소데 + 띠
            k = ea_jacket(F, v, F.z_knee + 0.06, 'prim', ease_end=0.05, name='_kosode', flat=(F.z_chest - 0.17, F.z_chest + 0.07))
            parts += [k[0], *k[1:], obi(k[0], F, v, half=0.025, slot='sec'), *cross_collar(F, v, [k[0]], 'sec', japan=True), straw_shoes(F, v)]
            hair = ['Hair_BuzzedFemale']
        elif v == 'elder':        # 긴 고소데 + 하오리 + 수염
            k = ea_jacket(F, v, F.z_ankle + 0.05, 'sec', ease_end=0.065, name='_kosode')
            ha = torso_garment(F, v + '_haori', zn + 0.025, F.z_hip - 0.18, ease=0.045, ease_top=0.02, blouse=0.01, fabric='linen', slot='prim', flare=0.06,
                               fold_amp=0.01, folds=6, sector=lambda th: abs(th - math.pi) > 0.3)
            parts += [k[0], *k[1:], obi(k[0], F, v, half=0.03, slot='nat'), ha, *cross_collar(F, v, [k[0], ha], 'nat', japan=True), chonmage(F, v), straw_shoes(F, v)]
            hair = ['Hair_Beard']
    for g in parts:
        if g.obj is None:
            grid_object(g)
    return parts, hair


PREVIEW_DYE_EA = {
    'korea': {'m_tunic': ((0.8, 0.78, 0.72), (0.3, 0.3, 0.34)), 'm_hood': ((0.5, 0.56, 0.58), (0.7, 0.74, 0.76)), 'm_smith': ((0.75, 0.72, 0.66), (0.3, 0.3, 0.3)),
              'm_field': ((0.75, 0.72, 0.66), (0.3, 0.3, 0.3)), 'f_apron': ((0.2, 0.26, 0.46), (0.56, 0.2, 0.2)), 'f_cloak': ((0.62, 0.16, 0.2), (0.86, 0.84, 0.66)),
              'child': ((0.66, 0.42, 0.5), (0.3, 0.3, 0.3)), 'elder': ((0.8, 0.78, 0.72), (0.4, 0.42, 0.46))},
    'china': {'m_tunic': ((0.2, 0.26, 0.42), (0.15, 0.14, 0.13)), 'm_hood': ((0.32, 0.26, 0.2), (0.12, 0.12, 0.14)), 'm_smith': ((0.4, 0.3, 0.2), (0.18, 0.2, 0.3)),
              'm_field': ((0.24, 0.3, 0.44), (0.2, 0.2, 0.2)), 'f_apron': ((0.2, 0.3, 0.48), (0.18, 0.16, 0.2)), 'f_cloak': ((0.56, 0.18, 0.16), (0.22, 0.3, 0.42)),
              'child': ((0.56, 0.2, 0.18), (0.2, 0.26, 0.4)), 'elder': ((0.28, 0.26, 0.24), (0.14, 0.14, 0.16))},
    'japan': {'m_tunic': ((0.16, 0.22, 0.38), (0.32, 0.26, 0.2)), 'm_hood': ((0.2, 0.2, 0.22), (0.3, 0.32, 0.36)), 'm_smith': ((0.22, 0.28, 0.42), (0.2, 0.2, 0.22)),
              'm_field': ((0.38, 0.3, 0.22), (0.18, 0.2, 0.26)), 'f_apron': ((0.2, 0.3, 0.46), (0.55, 0.2, 0.16)), 'f_cloak': ((0.48, 0.2, 0.22), (0.7, 0.58, 0.3)),
              'child': ((0.6, 0.36, 0.2), (0.2, 0.3, 0.46)), 'elder': ((0.24, 0.22, 0.2), (0.36, 0.34, 0.32))},
}


SOFTEN = ('m_field',)     # 맨 윗몸 일꾼: 근육을 눌러 고른다 (Superhero 몸이 보디빌더처럼 보이지 않게)


def soften_body(body, F, it=12, fac=0.55):
    """몸통·위팔 정점을 라플라스 다듬기로 고른다 (가슴·배·어깨 근육 골을 줄인다). 목·손·머리·다리와 열린 가장자리는 그대로."""
    me = body.data
    names = [g.name for g in body.vertex_groups]
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.verts.ensure_lookup_table()
    sel = []
    for v in bm.verts:
        mv = me.vertices[v.index]
        if not len(mv.groups) or v.is_boundary:
            continue
        dom = names[max(mv.groups, key=lambda gg: (gg.weight, -gg.group)).group]
        k = bone_kind(dom)
        if k == 'torso' or (k == 'arm' and dom.startswith('upperarm')):
            if F.z_hip - 0.05 < v.co.z < F.z_neck - 0.03:
                sel.append(v)
    for _ in range(it):
        bmesh.ops.smooth_vert(bm, verts=sel, factor=fac, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    return len(sel)


def build_variant_parts_sa(v, F):
    if SEA:
        return build_variant_parts_sea(v, F)
    parts, hair = [], []
    if v == 'm_tunic':        # 쿠르타(무릎 아래) + 긴 도티 + 파그리
        d = dhoti(F, v + '_dhoti', F.z_ankle + 0.07, amp=0.22, slot='nat')
        parts += [d, *kurta(F, v, F.z_knee - 0.05, slot='prim'), turban(F, v + '_turban', slot='sec')]
    elif v == 'm_hood':       # 짧은 쿠르타 + 긴 도티 + 왼어깨에 두른 앙가바스트람 + 터번 + 수염
        d = dhoti(F, v + '_dhoti', F.z_ankle + 0.06, amp=0.3, slot='nat')
        k = kurta(F, v, F.z_hip - 0.14, slot='nat', frac=1.0)
        parts += [d, *k, angavastram(F, v + '_stole', [k[0]], 'prim'), turban(F, v + '_turban', h=0.11, bulge=0.052, slot='sec')]
        hair = ['Hair_Beard']
    elif v == 'm_smith':      # 대장장이: 반소매 짧은 쿠르타 + 무릎 도티 + 머리 수건
        d = dhoti(F, v + '_dhoti', F.z_knee - 0.06, amp=0.34, slot='prim', flare=0.04)
        parts += [d, *kurta(F, v, F.z_hip - 0.12, slot='nat', frac=0.3), turban(F, v + '_turban', h=0.075, bulge=0.034, tilt=0.03, slot='sec', nb=4)]
    elif v == 'm_field':      # 밭일꾼 (맨 윗몸은 이 하나): 짧게 걷은 도티 + 목에 건 감차 + 감차 머리 수건
        d = dhoti(F, v + '_dhoti', F.z_knee + 0.07, amp=0.4, slot='nat', flare=0.04)
        parts += [d, pleat_of(d, v + '_pleat', F.z_crotch - 0.06, 'nat'), gamcha(F, v + '_stole', [], 'prim'),
                  turban(F, v + '_turban', h=0.065, bulge=0.03, tilt=0.035, slot='prim', nb=4, cross=False)]
    elif v == 'child':        # 아이: 무릎 쿠르타 (가슴 판판), 맨다리
        parts += kurta(F, v, F.z_knee + 0.06, slot='prim', frac=0.45, flat=(F.z_chest - 0.17, F.z_chest + 0.07))
        hair = ['Hair_BuzzedFemale']
    elif v == 'elder':        # 노인: 긴 쿠르타 + 발목 도티 + 숄 + 흰 터번 + 수염
        d = dhoti(F, v + '_dhoti', F.z_ankle + 0.04, amp=0.18, slot='nat')
        k = kurta(F, v, F.z_knee - 0.16, slot='nat')
        parts += [d, *k, angavastram(F, v + '_stole', [k[0]], 'sec'), turban(F, v + '_turban', h=0.1, bulge=0.048, slot='nat')]
        hair = ['Hair_Beard']
    elif v == 'f_apron':      # 사리 + 촐리, 머리를 덮은 자락
        parts += sari(F, v, slot='prim', veil=True)
    elif v == 'f_cloak':      # 사리 + 촐리, 왼어깨 자락이 등으로, 머리 틀어 올림
        parts += sari(F, v, slot='prim', veil=False)
        hair = ['Hair_Buns']
    for g in parts:
        if g.obj is None:
            grid_object(g)
    return parts, hair


PREVIEW_DYE_SA = {   # 미리보기 물감: 쪽빛·꼭두서니·강황·사프란·생무명 (장면에서는 사람마다 시드로 고른다)
    'm_tunic': ((0.22, 0.29, 0.46), (0.86, 0.5, 0.14)), 'm_hood': ((0.6, 0.18, 0.12), (0.86, 0.66, 0.16)), 'm_smith': ((0.2, 0.26, 0.42), (0.6, 0.2, 0.12)),
    'm_field': ((0.62, 0.22, 0.13), (0.3, 0.3, 0.3)), 'f_apron': ((0.64, 0.14, 0.1), (0.86, 0.64, 0.14)), 'f_cloak': ((0.88, 0.64, 0.12), (0.22, 0.28, 0.46)),
    'child': ((0.86, 0.6, 0.15), (0.3, 0.3, 0.3)), 'elder': ((0.7, 0.68, 0.6), (0.3, 0.33, 0.4)),
}
PREVIEW_DYE_SEA = {
    'm_tunic': ((0.4, 0.16, 0.1), (0.2, 0.24, 0.4)), 'm_hood': ((0.2, 0.25, 0.42), (0.46, 0.3, 0.16)), 'm_smith': ((0.3, 0.22, 0.14), (0.15, 0.17, 0.22)),
    'm_field': ((0.42, 0.28, 0.16), (0.3, 0.3, 0.3)), 'f_apron': ((0.45, 0.2, 0.12), (0.2, 0.32, 0.22)), 'f_cloak': ((0.2, 0.24, 0.4), (0.5, 0.18, 0.12)),
    'child': ((0.46, 0.3, 0.16), (0.3, 0.3, 0.3)), 'elder': ((0.3, 0.22, 0.14), (0.62, 0.6, 0.54)),
}
PREVIEW_HAIR_SA = {'m_tunic': (0.06, 0.05, 0.045), 'm_hood': (0.07, 0.055, 0.045), 'm_smith': (0.06, 0.05, 0.045), 'm_field': (0.08, 0.06, 0.05),
                   'f_apron': (0.05, 0.04, 0.035), 'f_cloak': (0.06, 0.045, 0.04), 'child': (0.07, 0.055, 0.045), 'elder': (0.7, 0.68, 0.65)}


# ───────────────────────── 가중치 입히기 ─────────────────────────
def weigh(parts, F, bone_names):
    gridW = {}
    for g in parts:
        ob = g.obj
        if getattr(g, 'src', None) is not None:
            continue
        if g.lock_w:
            W = vgroups_of(ob)
        elif g.fabric == 'straw':
            W = [{'Head': 1.0} for _ in ob.data.vertices]
        elif getattr(g, 'rigid', None):            # 남아시아 터번: 머리뼈에 고정
            W = [{g.rigid: 1.0} for _ in ob.data.vertices]
        else:
            W = data_transfer(ob, F.body)
            P = [tuple(v.co) for v in ob.data.vertices]
            if getattr(g, 'post', None) == 'cloak':
                W = arms_to_clavicle(W)
                W = skirt_blend(W, P, F, share=0.45, no_arms=True)
            elif getattr(g, 'post', None) == 'pallu':     # 사리 자락: 어깨는 빗장뼈, 등 뒤 늘어진 자락은 밑 사리 치마와 같은 섞기
                W = arms_to_clavicle(W)
                W = skirt_blend(W, P, F, share=0.95, no_arms=True)
            elif g.P is not None and len(g.P) > 4 and not getattr(g, 'limb', False) and min(p[2] for p in P) < F.z_crotch:
                W = skirt_blend(W, P, F, share=0.95)
        set_weights(ob, W, bone_names)
        if 'grid_map' in ob:
            gm = list(ob['grid_map'])
            gridW[g.name] = {gi: W[i] for i, gi in enumerate(gm)}
    for g in parts:                              # 겹 옷: 밑옷 격자 같은 자리의 가중치
        if getattr(g, 'src', None) is None:
            continue
        src, k0 = g.src
        n = len(src.P[0])
        SW = gridW[src.name]
        W = []
        for gi in list(g.obj['grid_map']):
            k, j = divmod(gi, n)
            key = (k0 + k) * n + j
            W.append(SW[key] if key in SW else SW[min(SW, key=lambda q: (abs(q - key), q))])
        set_weights(g.obj, W, bone_names)


# ───────────────────────── 가려진 몸 지우기 ─────────────────────────
def boundary_dist(ob):
    """옷 정점마다 열린 가장자리(단·소맷부리·목둘레·얼굴 구멍)까지 메시를 따라 잰 거리."""
    import heapq
    me = ob.data
    nv = len(me.vertices)
    adj = [[] for _ in range(nv)]
    ecount = {}
    for p in me.polygons:
        vs = list(p.vertices)
        for a, b in zip(vs, vs[1:] + vs[:1]):
            key = (min(a, b), max(a, b))
            ecount[key] = ecount.get(key, 0) + 1
    for (a, b) in sorted(ecount):
        L = (me.vertices[a].co - me.vertices[b].co).length
        adj[a].append((b, L)); adj[b].append((a, L))
    dist = [math.inf] * nv
    heap = []
    for (a, b) in sorted(ecount):
        if ecount[(a, b)] == 1:
            for x in (a, b):
                if dist[x] > 0:
                    dist[x] = 0.0
                    heap.append((0.0, x))
    heapq.heapify(heap)
    while heap:
        d, x = heapq.heappop(heap)
        if d > dist[x]:
            continue
        for y, L in adj[x]:
            nd = d + L
            if nd < dist[y]:
                dist[y] = nd
                heapq.heappush(heap, (nd, y))
    return dist


DOMS = []


def hide_covered(body, parts, margin=0.04, force=None):
    """몸 정점에서 법선 방향 광선이 옷의 '안쪽 깊은 곳'(가장자리에서 margin 넘게)에 맞으면 가려진 정점. 정점이 다 가려진 면은 지운다."""
    verts, polys, pdist = [], [], []
    for g in parts:
        if g.fabric == 'straw' or getattr(g, 'nohide', False):
            continue
        me = g.obj.data
        bd = boundary_dist(g.obj)
        o = len(verts)
        verts += [v.co.copy() for v in me.vertices]
        for p in me.polygons:
            polys.append([o + i for i in p.vertices])
            pdist.append(min(bd[i] for i in p.vertices))
    bvh = BVHTree.FromPolygons(verts, polys)
    me = body.data
    cov = []
    for v in me.vertices:
        o = v.co + v.normal * 0.002
        d = v.normal
        hit = False
        left = 0.6
        for _ in range(4):
            loc, nrm, idx, dist = bvh.ray_cast(o, d, left)
            if loc is None:
                break
            if pdist[idx] > margin:
                hit = True
                break
            o = loc + d * 0.001
            left -= dist + 0.001
            if left <= 0:
                break
        cov.append(hit)
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.verts.ensure_lookup_table()
    dead = [f for f in bm.faces if all(cov[v.index] for v in f.verts) or (force is not None and force(f))]
    n0 = len(bm.faces)
    if os.environ.get('KIT_DEBUG'):
        V = np.array([v.co[:] for v in me.vertices]); Nn = np.array([v.normal[:] for v in me.vertices])
        out = ((V[:, :2] - np.array([0, 0.03])) * Nn[:, :2]).sum(1) > 0
        log('법선 바깥 비율 %.2f, 가려진 정점 %d/%d' % (out.mean(), sum(cov), len(cov)))
        kinds = {}
        for f in bm.faces:
            if not all(cov[v.index] for v in f.verts):
                k = bone_kind(DOMS[f.verts[0].index]) if DOMS else '?'
                kinds[k] = kinds.get(k, 0) + 1
        log('남은 면 종류', sorted(kinds.items()))
    bmesh.ops.delete(bm, geom=dead, context='FACES')
    loose = [v for v in bm.verts if not v.link_faces]
    bmesh.ops.delete(bm, geom=loose, context='VERTS')
    bm.to_mesh(me)
    bm.free()
    return n0, len(dead)


# ───────────────────────── 조립 ─────────────────────────
def copy_obj(src, name):
    ob = src.copy()
    ob.data = src.data.copy()
    ob.name = ob.data.name = name
    ob.parent = None
    ob.matrix_world = Matrix.Identity(4)
    ob.hide_render = False
    for m in list(ob.modifiers):
        ob.modifiers.remove(m)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def keep_uv0(ob, remap=None):
    me = ob.data
    for nm in [u.name for u in me.uv_layers][1:]:
        me.uv_layers.remove(me.uv_layers[nm])
    me.uv_layers[0].name = 'UVMap'
    if remap:
        u0, u1, v0, v1 = remap
        uv = me.uv_layers[0].data
        for d in uv:
            x = min(1.0, max(0.0, d.uv.x)); y = min(1.0, max(0.0, d.uv.y))
            d.uv = (u0 + x * (u1 - u0), v0 + y * (v1 - v0))


def set_col(ob, rgba):
    me = ob.data
    for a in [a.name for a in me.color_attributes]:
        me.color_attributes.remove(me.color_attributes[a])
    ca = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    ca.data.foreach_set('color', list(rgba) * len(me.vertices))
    me.color_attributes.active_color = ca
    me.color_attributes.render_color_index = 0


def set_part(ob, i, layer=0, tight=0):
    """조각 번호·겹·몸에 붙는 옷인가 (맞음 검사용, 내보내지 않는 속성).
    겹: 몸 0 < 각반 1 < 감은 띠·신 2 < 튜닉·소매 3 < 허리띠·앞치마·머리쓰개 4 < 망토 5 < 모자 6."""
    me = ob.data
    for nm, val in (('part', i), ('layer', layer), ('tight', tight)):
        a = me.attributes.get(nm) or me.attributes.new(nm, 'INT', 'POINT')
        a.data.foreach_set('value', [val] * len(me.vertices))


def layer_of(name):
    if EA:
        for key, L in (('_hat', 6), ('_gat', 6), ('_band', 5), ('_hair', 6), ('_bun', 6), ('_pin', 6), ('_braid', 5), ('_daenggi', 5), ('_collar', 5), ('_goreum', 5),
                       ('_haori', 5), ('_obi', 4), ('_sash', 4), ('_apron', 4), ('_head', 6), ('_coat', 4), ('_jacket', 3), ('_robe', 3), ('_sleeve', 3),
                       ('_chima', 2), ('_skirt', 2), ('_seat', 2), ('_pants', 2), ('_hose', 1), ('_wrap', 2), ('_shoes', 2)):
            if key in name:
                return L
    if SA:
        for key, L in (('_turban', 6), ('_veil', 5), ('_stole', 5), ('_pallu', 4), ('_pleat', 4), ('_choli', 3), ('_csleeve', 3), ('_sari', 2), ('_dhoti', 2),
                       ('_kemben', 3), ('_blouse', 3), ('_sarong', 2)):
            if key in name:
                return L
    for key, L in (('_hose', 1), ('_wrap', 2), ('_shoes', 2), ('_hat', 6), ('_cloak', 5), ('_belt', 4), ('_rope', 4), ('_band', 4),
                   ('_hood', 4), ('_kerchief', 4), ('_coif', 4), ('_smith_apron', 4), ('_apron', 4)):
        if key in name:
            return L
    return 3


def _apply(ob, name):
    with bpy.context.temp_override(object=ob, active_object=ob, selected_objects=[ob], selected_editable_objects=[ob]):
        bpy.ops.object.modifier_apply(modifier=name)


def decimate(ob, ratio, group=None, factor=1.0, invert=False):
    md = ob.modifiers.new('dec', 'DECIMATE')
    md.decimate_type = 'COLLAPSE'
    md.ratio = ratio
    md.use_collapse_triangulate = True
    if group:
        md.vertex_group = group
        md.vertex_group_factor = factor
        md.invert_vertex_group = invert
    _apply(ob, 'dec')


def solidify(ob, t=0.005):
    md = ob.modifiers.new('sol', 'SOLIDIFY')
    md.thickness = t
    md.offset = -1.0
    md.use_rim = True
    md.use_rim_only = True
    md.use_even_offset = True
    _apply(ob, 'sol')


def join(objs, name):
    for o in bpy.context.scene.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    with bpy.context.temp_override(active_object=objs[0], object=objs[0], selected_objects=objs, selected_editable_objects=objs):
        bpy.ops.object.join()
    ob = objs[0]
    ob.name = ob.data.name = name
    return ob


DBG = [(0.9, 0.9, 0.9, 1), (0.9, 0.1, 0.1, 1), (0.1, 0.8, 0.1, 1), (0.1, 0.2, 0.9, 1), (0.9, 0.8, 0.1, 1), (0.1, 0.8, 0.8, 1), (0.8, 0.1, 0.8, 1),
       (0.95, 0.5, 0.1, 1), (0.4, 0.2, 0.1, 1), (0.1, 0.1, 0.1, 1)]


def assemble(v, F, mats, hairs):
    t0 = time.time()
    root = bpy.data.objects.new('v_' + v, None)
    bpy.context.scene.collection.objects.link(root)
    arm = F.arm.copy()
    arm.data = F.arm.data.copy()
    arm.name = arm.data.name = 'arm_' + v
    arm.hide_render = False
    bpy.context.scene.collection.objects.link(arm)
    arm.parent = root
    arm.data.pose_position = 'REST'
    bone_names = [b.name for b in arm.data.bones]
    parts, hair = build_variant_parts(v, F)
    weigh(parts, F, bone_names)
    body = copy_obj(F.body, v + '_body')
    DOMS[:] = F.dom
    # 광선 검사와 관계없이 지우는 몸 면 (늘 옷 밑이다):
    #   다리: 몸통 옷 단보다 위(허벅지)와 각반이 감싼 곳 → 무릎을 굽혀도 살이 각반·단을 뚫고 나오지 않는다
    #   아이: 판판하게 누른 가슴 밑 몸통
    hem = getattr(parts[0], 'hem_z', None) or min(p[2] for row in parts[0].P for p in row)   # hem_z: 앞뒤를 올린 도티 단의 가장 높은 곳
    hose_top = max((v.co.z for g in parts if g.name.endswith('_hose') for v in g.obj.data.vertices), default=None)
    kv, VV = F.kind_v, F.V

    def force(f):
        idx = [x.index for x in f.verts]
        if all(kv[i] == 'leg' for i in idx):
            zs_ = [VV[i][2] for i in idx]
            if min(zs_) > hem - 0.02 or (hose_top is not None and max(zs_) < hose_top - 0.01):
                return True
        return v == 'child' and all(kv[i] == 'torso' and VV[i][2] < F.z_neck - 0.05 for i in idx)
    n0, nd = hide_covered(body, parts, force=force)
    if SA and v in SOFTEN:
        log('몸 다듬기', v, soften_body(body, F))
    # 손가락이 촘촘한 손은 줄이고 얼굴은 지킨다 (머리 가중치 큰 정점은 덜 줄인다)
    keep = body.vertex_groups.new(name='__keep')
    gname = [g.name for g in body.vertex_groups]
    hv = body.vertex_groups['Head'].index
    for vv in body.data.vertices:
        w = sum(gg.weight for gg in vv.groups if gg.group == hv)
        dom = max(vv.groups, key=lambda gg: (gg.weight, -gg.group)).group if len(vv.groups) else -1
        hand = dom >= 0 and bone_kind(gname[dom]) == 'hand'
        keep.add([vv.index], 1.0 if w > 0.3 else (0.6 if hand else 0.0), 'REPLACE')     # 얼굴 > 손 > 나머지
    decimate(body, 0.4, '__keep', factor=1.0, invert=True)       # 얼굴은 지키고, 손가락은 주먹 꼴이 남을 만큼만 줄인다
    body.vertex_groups.remove(body.vertex_groups['__keep'])
    keep_uv0(body, ATLAS['skin_' + F.kind])
    set_col(body, (0, 1, 0, 1))
    eyes = copy_obj(F.eyes, v + '_eyes')
    decimate(eyes, 0.5)
    keep_uv0(eyes, ATLAS['eye'])
    set_col(eyes, (0, 0, 1, 1))
    brows = copy_obj(F.brows, v + '_brows')
    decimate(brows, 0.35)
    keep_uv0(brows, ATLAS['hair1' if F.kind == 'm' else 'hair2'])
    set_col(brows, (1, 0, 0, 1))
    skin_objs = [body, eyes, brows]
    for h in hair:
        ho = copy_obj(hairs[h], v + '_' + h)
        if len(ho.data.polygons) > 2000:
            decimate(ho, 0.32)
        elif len(ho.data.polygons) > 700:
            decimate(ho, 0.6)
        keep_uv0(ho, ATLAS['hair2' if h in ('Hair_Long', 'Hair_Buns') else 'hair1'])   # BuzzedFemale 은 T_Hair_1
        set_col(ho, (1, 0, 0, 1))
        skin_objs.append(ho)
    for o in skin_objs:
        o.data.materials.clear()
        o.data.materials.append(mats['skin'])
    for i, o in enumerate(skin_objs):
        set_part(o, 100 + i, 0, 0)
    cloth_objs = []
    for pi, g in enumerate(parts):
        ob = g.obj
        set_part(ob, pi, layer_of(g.name), 1 if (getattr(g, 'limb', False) or g.lock_w or g.P is None or any(k in g.name for k in ('_hood', '_kerchief', '_coif', '_belt', '_rope', '_band'))) else 0)
        if getattr(g, 'hair', False):        # 동아시아 머리카락 조각 (상투·쪽·땋은 머리·머리 덮개): 몸 재질 + 머리카락 그림 칸 + 정점색 R (장면 머리색)
            ob.data.materials.clear()
            ob.data.materials.append(mats['skin'])
            hair_uv(ob)
            keep_uv0(ob, ATLAS['hair1'])
            set_col(ob, (1, 0, 0, 1))
            cloth_objs.append(ob)
            continue
        ob.data.materials.clear()
        if os.environ.get('KIT_DEBUG') == '3':          # 디버그: 조각마다 눈에 띄는 색
            dm = bpy.data.materials.new('dbg_%s' % g.name)
            dm.diffuse_color = DBG[pi % len(DBG)]
            dm.use_nodes = True
            dm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = DBG[pi % len(DBG)]
            ob.data.materials.append(dm)
        else:
            ob.data.materials.append(mats['cloth'])
        keep_uv0(ob)
        set_col(ob, getattr(g, 'col', None) or (*SLOT[g.slot], FAB[g.fabric]))
        if not g.lock_w and g.fabric != 'straw':
            solidify(ob, 0.0045 if g.fabric != 'leather' else 0.006)
        cloth_objs.append(ob)
    lod0 = join(skin_objs + cloth_objs, v + '_lod0')
    lod0.parent = arm
    lod0.modifiers.new('arm', 'ARMATURE').object = arm
    # LOD1: 크게 줄인 것 (먼 사람). 눈·눈썹도 함께 줄어든다
    lod1 = lod0.copy()
    lod1.data = lod0.data.copy()
    lod1.name = lod1.data.name = v + '_lod1'
    bpy.context.scene.collection.objects.link(lod1)
    lod1.parent = arm
    for m in list(lod1.modifiers):
        lod1.modifiers.remove(m)
    decimate(lod1, 0.22)
    lod1.modifiers.new('arm', 'ARMATURE').object = arm
    info = {'tris0': K.tri_count(lod0), 'tris1': K.tri_count(lod1), 'body_faces_hidden': nd, 'body_faces': n0, 'hair': hair,
            'sec': round(time.time() - t0, 1)}
    log('변형', v, info)
    return root, arm, lod0, lod1, parts, info


# ───────────────────────── 연장 소품 (손뼈에 붙인다) ─────────────────────────
# 좌표: 쥐는 곳이 원점, 자루 = +Z (glTF +Y). 장면 코드가 손뼈에 붙이고 돌린다.
def _srgb(c):
    return tuple(x ** 2.2 for x in c)


def prop_mesh(name, parts):
    """parts: [(v, f, 색 sRGB)] → 정점색(Col) 하나짜리 메시 (재질 people_tool)."""
    bm = bmesh.new()
    col_layer = bm.verts.layers.float_color.new('Col')
    for v, f, c in parts:
        vs = [bm.verts.new(p) for p in v]
        for vv in vs:
            vv[col_layer] = (*_srgb(c), 1.0)
        for face in f:
            try:
                bm.faces.new([vs[i] for i in face]).smooth = False
            except ValueError:
                pass
    bm.normal_update()
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    me.color_attributes.active_color = me.color_attributes['Col']
    uvl = me.uv_layers.new(name='UVMap')
    return ob


WOOD, IRON = (0.55, 0.38, 0.22), (0.44, 0.44, 0.46)     # 밝은 편: 대장간 그늘에서도 망치가 보이게


def build_sack(mat):
    """곡식 자루: 불룩하고 울퉁불퉁한 몸 + 묶은 목 + 술 (매끈한 음영, 천 재질 people_cloth 의 리넨 결).
    원점 = 자루 가운데, 긴 축 = X (어깨에 앞뒤로 얹는다). 정점색 = 생지 칸 0.72배(누런 삼베빛), 천 종류 리넨."""
    nu, nx = 16, 15
    x0, x1 = -0.27, 0.31
    bm = bmesh.new()
    uvl = bm.loops.layers.uv.new('UVMap')
    col = bm.verts.layers.float_color.new('Col')
    rings = []
    for i in range(nx + 1):
        x = x0 + (x1 - x0) * i / nx
        t = (x - x0) / (0.22 - x0)                      # 0 → 1 (몸 끝 → 묶은 목)
        if x <= 0.22:
            r = 0.15 * math.sin(math.pi * min(1.0, 0.08 + 0.92 * t)) ** 0.55 + 0.012
        else:                                            # 목 위로 술이 조금 퍼진다
            r = 0.03 + 0.25 * (x - 0.22)
        ring = []
        for j in range(nu):
            b = TAU * j / nu
            lump = 1.0 + 0.07 * math.sin(3 * b + 9 * x) + 0.05 * math.sin(5 * b - 13 * x + 1.3)
            y = r * lump * math.cos(b)
            z = r * lump * math.sin(b) * (0.62 if math.sin(b) < 0 else 0.8)     # 어깨에 눌려 아래가 납작
            v = bm.verts.new((x, y, z))
            v[col] = (0.0, 0.0, 0.72, 0.0)
            ring.append(v)
        rings.append(ring)
    ends = []
    for x, ring in ((x0 - 0.012, rings[0]), (x1 + 0.004, rings[-1])):
        c = bm.verts.new((x, 0.0, 0.0))
        c[col] = (0.0, 0.0, 0.72, 0.0)
        ends.append((c, ring))
    tile = TILE['linen']
    for i in range(nx):
        for j in range(nu):
            j2 = (j + 1) % nu
            f = bm.faces.new((rings[i][j], rings[i][j2], rings[i + 1][j2], rings[i + 1][j]))
            f.smooth = True
            for l, (ii, jj) in zip(f.loops, ((i, j), (i, j + 1), (i + 1, j + 1), (i + 1, j))):
                l[uvl].uv = (jj / nu * 0.85 / tile, (x0 + (x1 - x0) * ii / nx) / tile)
    for k, (c, ring) in enumerate(ends):
        for j in range(nu):
            j2 = (j + 1) % nu
            vs = (c, ring[j2], ring[j]) if k == 0 else (c, ring[j], ring[j2])
            f = bm.faces.new(vs)
            f.smooth = True
            for l in f.loops:
                l[uvl].uv = (l.vert.co.y / tile, l.vert.co.z / tile)
    bm.normal_update()
    acc = sum(f.normal.dot(f.calc_center_median()) for f in bm.faces)    # 바깥을 보게
    if acc < 0:
        bmesh.ops.reverse_faces(bm, faces=list(bm.faces))
    me = bpy.data.meshes.new('prop_sack')
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new('prop_sack', me)
    bpy.context.scene.collection.objects.link(ob)
    me.color_attributes.active_color = me.color_attributes['Col']
    me.color_attributes.render_color_index = me.color_attributes.active_color_index     # 내보내기(ACTIVE)가 COLOR_0 으로 쓰게
    me.materials.append(mat)
    return ob


def build_props(mats):
    out = []
    cy = lambda r0, r1, h, z0, n=8: K.cyl_vf(r0, r1, h, n, z0)

    def box(x0, x1, y0, y1, z0, z1):
        return K.box_vf(x0, x1, y0, y1, z0, z1)
    # 대장장이 손망치: 자루 42 cm, 머리 15 cm (멀리서도 보이게 실물보다 조금 크게)
    out.append(prop_mesh('prop_hammer', [(*cy(0.018, 0.015, 0.42, -0.08), WOOD), (*box(-0.075, 0.075, -0.028, 0.028, 0.29, 0.355), IRON)]))
    blade = ([(-0.09, -0.02, 1.0), (0.09, -0.02, 1.0), (0.1, -0.2, 0.95), (-0.1, -0.2, 0.95), (-0.09, -0.02, 1.012), (0.09, -0.02, 1.012),
              (0.1, -0.2, 0.962), (-0.1, -0.2, 0.962)], [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)])
    out.append(prop_mesh('prop_hoe', [(*cy(0.017, 0.017, 1.42, -0.42), WOOD), (*blade, IRON), (*box(-0.02, 0.02, -0.04, 0.01, 0.97, 1.03), IRON)]))
    out.append(prop_mesh('prop_staff', [(*cy(0.02, 0.016, 1.52, -1.02), WOOD)]))
    for o in out:
        o.data.materials.append(mats['tool'])
    out.append(build_sack(mats['cloth']))
    return out


# ───────────────────────── 미리보기 재질 (장면 셰이더 흉내: 정점색 칸 → 물감) ─────────────────────────
PREVIEW_DYE = {
    'm_tunic': ((0.45, 0.25, 0.13), (0.2, 0.17, 0.14)), 'm_hood': ((0.27, 0.32, 0.4), (0.24, 0.3, 0.17)), 'm_smith': ((0.4, 0.3, 0.2), (0.2, 0.17, 0.14)),
    'm_field': ((0.34, 0.27, 0.18), (0.2, 0.17, 0.14)), 'f_apron': ((0.55, 0.22, 0.15), (0.3, 0.25, 0.2)), 'f_cloak': ((0.22, 0.29, 0.46), (0.58, 0.47, 0.25)),
    'child': ((0.34, 0.42, 0.2), (0.3, 0.25, 0.2)), 'elder': ((0.26, 0.23, 0.21), (0.2, 0.18, 0.16)),
}
PREVIEW_HAIR = {'m_tunic': (0.25, 0.15, 0.08), 'm_hood': (0.3, 0.18, 0.09), 'm_smith': (0.12, 0.09, 0.07), 'm_field': (0.55, 0.42, 0.24),
                'f_apron': (0.3, 0.2, 0.1), 'f_cloak': (0.5, 0.3, 0.14), 'child': (0.6, 0.47, 0.27), 'elder': (0.68, 0.66, 0.63)}
NATURAL = [(0.82, 0.78, 0.68), (0.6, 0.55, 0.48), (0.36, 0.22, 0.13), (0.86, 0.72, 0.44)]     # 생지: 리넨·모직·가죽·짚


def preview_materials(v, lod_objs, mats):
    """미리보기 전용 재질 (내보낸 뒤에만): 변형마다 물감·머리색을 넣은 사본을 만들어 바꿔 끼운다."""
    prim, sec = (PREVIEW_DYE_EA[CULTURE] if EA else PREVIEW_DYE_SEA if SEA else PREVIEW_DYE_SA if SA else PREVIEW_DYE)[v]
    hair = (PREVIEW_HAIR_SA if (SA or EA) else PREVIEW_HAIR)[v]
    skin = mats['skin'].copy(); skin.name = 'pv_skin_' + v
    N, L = skin.node_tree.nodes, skin.node_tree.links
    b = N['Principled BSDF']
    tex = N['BASE']
    ca = N.new('ShaderNodeVertexColor'); ca.layer_name = 'Col'
    sep = N.new('ShaderNodeSeparateColor'); L.new(ca.outputs['Color'], sep.inputs['Color'])

    def scaled(sock, rgb):
        m = N.new('ShaderNodeMix'); m.data_type = 'RGBA'; m.blend_type = 'MULTIPLY'; m.inputs['Factor'].default_value = 1.0
        m.inputs['A'].default_value = (*_srgb(rgb), 1)
        cmb = N.new('ShaderNodeCombineColor'); L.new(sock, cmb.inputs['Red']); L.new(sock, cmb.inputs['Green']); L.new(sock, cmb.inputs['Blue'])
        L.new(cmb.outputs['Color'], m.inputs['B'])
        return m.outputs['Result']
    add1 = N.new('ShaderNodeMix'); add1.data_type = 'RGBA'; add1.blend_type = 'ADD'; add1.inputs['Factor'].default_value = 1.0
    L.new(scaled(sep.outputs['Red'], [c * 2.2 for c in hair]), add1.inputs['A'])
    L.new(scaled(sep.outputs['Green'], (1, 1, 1)), add1.inputs['B'])
    add2 = N.new('ShaderNodeMix'); add2.data_type = 'RGBA'; add2.blend_type = 'ADD'; add2.inputs['Factor'].default_value = 1.0
    L.new(add1.outputs['Result'], add2.inputs['A']); L.new(scaled(sep.outputs['Blue'], (1, 1, 1)), add2.inputs['B'])
    mul = N.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs['Factor'].default_value = 1.0
    L.new(tex.outputs['Color'], mul.inputs['A']); L.new(add2.outputs['Result'], mul.inputs['B'])
    L.new(mul.outputs['Result'], b.inputs['Base Color'])

    cloth = mats['cloth'].copy(); cloth.name = 'pv_cloth_' + v
    N, L = cloth.node_tree.nodes, cloth.node_tree.links
    b = N['Principled BSDF']
    tex = N['BASE']
    ca = N.new('ShaderNodeVertexColor'); ca.layer_name = 'Col'
    sep = N.new('ShaderNodeSeparateColor'); L.new(ca.outputs['Color'], sep.inputs['Color'])
    tsep = N.new('ShaderNodeSeparateColor'); L.new(tex.outputs['Color'], tsep.inputs['Color'])

    def step(lo):       # 천 종류 문턱 (A > lo)
        g = N.new('ShaderNodeMath'); g.operation = 'GREATER_THAN'; L.new(ca.outputs['Alpha'], g.inputs[0]); g.inputs[1].default_value = lo
        return g.outputs['Value']
    s1, s2, s3 = step(1 / 6), step(0.5), step(5 / 6)

    def mixf(a, b2, f):
        m = N.new('ShaderNodeMix'); m.data_type = 'FLOAT'; L.new(f, m.inputs['Factor'])
        for sock, val in ((m.inputs[2], a), (m.inputs[3], b2)):
            if isinstance(val, float):
                sock.default_value = val
            else:
                L.new(val, sock)
        return m.outputs[0]

    def mixc(a, b2, f):
        m = N.new('ShaderNodeMix'); m.data_type = 'RGBA'; L.new(f, m.inputs['Factor'])
        for sock, val in ((m.inputs['A'], a), (m.inputs['B'], b2)):
            if isinstance(val, tuple):
                sock.default_value = (*_srgb(val), 1)
            else:
                L.new(val, sock)
        return m.outputs['Result']
    det = mixf(mixf(mixf(tsep.outputs['Red'], tsep.outputs['Green'], s1), tsep.outputs['Blue'], s2), tex.outputs['Alpha'], s3)
    nat = mixc(mixc(mixc(NATURAL[0], NATURAL[1], s1), NATURAL[2], s2), NATURAL[3], s3)
    dye = N.new('ShaderNodeMix'); dye.data_type = 'RGBA'; dye.blend_type = 'ADD'; dye.inputs['Factor'].default_value = 1.0
    L.new(scaled(sep.outputs['Red'], prim), dye.inputs['A']); L.new(scaled(sep.outputs['Green'], sec), dye.inputs['B'])
    dye2 = N.new('ShaderNodeMix'); dye2.data_type = 'RGBA'; dye2.blend_type = 'ADD'; dye2.inputs['Factor'].default_value = 1.0
    L.new(dye.outputs['Result'], dye2.inputs['A'])
    nb = N.new('ShaderNodeMix'); nb.data_type = 'RGBA'; nb.blend_type = 'MULTIPLY'; nb.inputs['Factor'].default_value = 1.0
    L.new(nat, nb.inputs['A'])
    cmb = N.new('ShaderNodeCombineColor'); [L.new(sep.outputs['Blue'], cmb.inputs[k]) for k in ('Red', 'Green', 'Blue')]
    L.new(cmb.outputs['Color'], nb.inputs['B'])
    L.new(nb.outputs['Result'], dye2.inputs['B'])
    d2 = N.new('ShaderNodeMath'); d2.operation = 'MULTIPLY'; L.new(det, d2.inputs[0]); d2.inputs[1].default_value = 2.0
    cmb2 = N.new('ShaderNodeCombineColor'); [L.new(d2.outputs[0], cmb2.inputs[k]) for k in ('Red', 'Green', 'Blue')]
    fin = N.new('ShaderNodeMix'); fin.data_type = 'RGBA'; fin.blend_type = 'MULTIPLY'; fin.inputs['Factor'].default_value = 1.0
    L.new(dye2.outputs['Result'], fin.inputs['A']); L.new(cmb2.outputs['Color'], fin.inputs['B'])
    L.new(fin.outputs['Result'], b.inputs['Base Color'])
    lm = N.new('ShaderNodeMath'); lm.operation = 'SUBTRACT'; L.new(s2, lm.inputs[0]); L.new(s3, lm.inputs[1])      # 가죽만
    rough = mixf(0.92, 0.62, lm.outputs[0])
    L.new(rough, b.inputs['Roughness'])
    # 노멀 묶음: RG = 짠 천 XY, BA = 가죽 XY → (x, y, 1) 로 다시 짓는다
    nm = N['Normal Map']
    tn = nm.inputs['Color'].links[0].from_node
    ns = N.new('ShaderNodeSeparateColor'); L.new(tn.outputs['Color'], ns.inputs['Color'])
    c1 = N.new('ShaderNodeCombineColor'); L.new(ns.outputs['Red'], c1.inputs['Red']); L.new(ns.outputs['Green'], c1.inputs['Green']); c1.inputs['Blue'].default_value = 1.0
    c2 = N.new('ShaderNodeCombineColor'); L.new(ns.outputs['Blue'], c2.inputs['Red']); L.new(tn.outputs['Alpha'], c2.inputs['Green']); c2.inputs['Blue'].default_value = 1.0
    L.new(mixc(c1.outputs['Color'], c2.outputs['Color'], lm.outputs[0]), nm.inputs['Color'])
    for ob in lod_objs:
        for i, m in enumerate(ob.data.materials):
            if m == mats['skin']:
                ob.data.materials[i] = skin
            elif m == mats['cloth']:
                ob.data.materials[i] = cloth


# ───────────────────────── 동작 (미리보기·뚫림 검사용) ─────────────────────────
def load_actions():
    objs = imp(UAL)
    acts = {}
    for a in bpy.data.actions:
        nm = a.name.replace('_Armature', '')
        if nm in CLIPS or nm in ('A_TPose',):
            # 장면과 같게: 골반 말고는 이동·크기 곡선을 뺀다 (몸마다 제 뼈 길이)
            for fc in list(a.fcurves):
                if (fc.data_path.endswith('.location') and 'pelvis' not in fc.data_path) or fc.data_path.endswith('.scale'):
                    a.fcurves.remove(fc)
            acts[nm] = a
    kill_tree(objs)
    return acts


def pose_at(arm, act, frame):
    arm.data.pose_position = 'POSE'
    if not arm.animation_data:
        arm.animation_data_create()
    arm.animation_data.action = act
    bpy.context.scene.frame_set(int(frame))


def aim(arm, bone, target):
    """포즈 뼈를 target(뼈대 공간 점)으로 향하게 돌린다 (뼈 Y 축 = 머리→꼬리). 장면 코드의 팔 덧씌우기와 같은 계산."""
    pb = arm.pose.bones[bone]
    M = pb.matrix.copy()
    head = M.translation.copy()
    y = (M.to_3x3() @ Vector((0, 1, 0))).normalized()
    q = y.rotation_difference((Vector(target) - head).normalized())
    pb.matrix = Matrix.Translation(head) @ (q.to_matrix() @ M.to_3x3()).to_4x4()
    bpy.context.view_layer.update()


# 망치질 (뼈대 공간 Blender: 앞 -Y, 위 +Z, 오른쪽 -X; 발 = 원점) — realpeople.js 의 HAM 과 같은 값 (three (x, y, z) → Blender (x, -z, y))
#   든 자세: 오른손(손목)을 오른 어깨 위로, 자루는 위·뒤로 (머리가 어깨 뒤 위). 내리친 자세: 망치 머리가 앞 0.45 m·높이 0.85 m(모루 윗면)
HAMMER_HAND_UP = Vector((-0.3, 0.02, 1.72))
HAMMER_G_UP = Vector((0.05, 0.6, 0.8)).normalized()
HAMMER_G_DN = Vector((0.03, -0.87, -0.5)).normalized()
HAMMER_HAND_DN = Vector((-0.05, -0.45, 0.85)) - HAMMER_G_DN * 0.32
HAMMER_POLE = Vector((-0.75, 0.35, -0.25))


def ik_arm(arm, side, target, pole):
    """2뼈 IK: 어깨에서 손목 target 으로 (팔꿈치는 pole 쪽). realpeople.js 의 ik2 와 같은 계산."""
    pb = arm.pose.bones
    S = pb['upperarm_' + side].head.copy()
    a = (pb['lowerarm_' + side].head - S).length
    b2 = (pb['hand_' + side].head - pb['lowerarm_' + side].head).length
    d = target - S
    dist = min(a + b2 - 1e-3, max(abs(a - b2) + 1e-3, d.length))
    d.normalize()
    x = (a * a - b2 * b2 + dist * dist) / (2 * dist)
    h = math.sqrt(max(0.0, a * a - x * x))
    pl = (pole - d * pole.dot(d)).normalized()
    E = S + d * x + pl * h
    T = S + d * dist
    aim(arm, 'upperarm_' + side, E)
    aim(arm, 'lowerarm_' + side, T)
    return E, T


def hammer_pose(arm, raised=True):
    """미리보기·맞음 검사용 망치질 자세: Idle_Torch_Loop(왼손을 가슴 앞에 든 자세 = 집게 쥔 손) 위에 오른팔을 IK 로 든(raised) / 내리친 자세."""
    pose_at(arm, ACTS['Idle_Torch_Loop'], 10)
    arm.animation_data.action = None          # 지금 자세를 남기고 동작을 뗀다 (아니면 갱신 때 동작이 손댄 뼈를 덮어쓴다)
    bpy.context.view_layer.update()
    E, T = ik_arm(arm, 'r', HAMMER_HAND_UP if raised else HAMMER_HAND_DN, HAMMER_POLE)
    grip = T + (T - E).normalized() * 0.07
    return grip, (HAMMER_G_UP if raised else HAMMER_G_DN)


def place_hammer(arm, hp, grip, handle):
    """망치: 주먹 자리에 두고 자루(+Z)를 handle 쪽으로, 머리(X)는 휘두르는 면 안."""
    side = Vector((1, 0, 0))
    x = handle.cross(side).normalized()
    y = handle.cross(x).normalized()
    R = Matrix((x, y, handle)).transposed()
    hp.parent = arm
    hp.parent_type = 'OBJECT'
    hp.matrix_parent_inverse = Matrix.Identity(4)
    hp.matrix_basis = Matrix.Translation(grip) @ R.to_4x4()


# ───────────────────────── 뚫림 검사 ─────────────────────────
def fit_check(lod0, arm, act, frames):
    """자세마다 옷이 몸에 맞는지 센다 (LOD0). 바인드 자세에서 바깥 겹 옷이 덮던 정점(안옷·남은 몸)과 그 옷 면을 짝 짓는다.
    겹: 몸 0 < 각반 1 < 감은 띠·신 2 < 튜닉·소매 3 < 허리띠·앞치마·머리쓰개 4 < 망토 5 < 모자 6.
      뚫림: 안쪽 정점이 그 면 밖으로 3 mm 넘게 나옴 (거리 제한 없음)
      떨어짐: 몸에 붙어야 하는 옷(소매·감은 띠·각반·신·머리쓰개·허리띠, 'tight')의 면이 안쪽 정점에서 바인드 때보다 5 cm 넘게 멀어짐
    돌려주는 것: (짝 수, [프레임별 뚫림 수], [프레임별 떨어짐 수])"""
    me = lod0.data
    cloth_idx = [i for i, m in enumerate(me.materials) if m and m.name.startswith(('people_cloth', 'pv_cloth'))]
    arm.data.pose_position = 'REST'
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ev = lod0.evaluated_get(dg)
    m0 = ev.to_mesh()
    V0 = [v.co.copy() for v in m0.vertices]
    Nn = [v.normal.copy() for v in m0.vertices]
    polys = [list(p.vertices) for p in m0.polygons]
    pm = [p.material_index for p in m0.polygons]
    att = {}
    for nm in ('part', 'layer', 'tight'):
        arr = [0] * len(m0.vertices)
        m0.attributes[nm].data.foreach_get('value', arr)
        att[nm] = arr
    part, layer, tight = att['part'], att['layer'], att['tight']
    ev.to_mesh_clear()
    cpolys = [i for i, p in enumerate(polys) if pm[i] in cloth_idx]
    bvh0 = BVHTree.FromPolygons(V0, [polys[i] for i in cpolys])
    pairs = []
    for i, (p, n) in enumerate(zip(V0, Nn)):
        if part[i] > 100:                         # 눈·눈썹·머리카락: T 자세 바인드에서 소매 밑에 들어가 생기는 거짓 짝을 뺀다
            continue
        o, left = p + n * 0.003, 0.25
        for _ in range(4):
            loc, nrm, idx, dist = bvh0.ray_cast(o, n, left)
            if loc is None:
                break
            f = polys[cpolys[idx]]
            if part[f[0]] == part[i]:             # 제 조각에 맞으면 지나서 다시
                o, left = loc + n * 0.001, left - dist - 0.001
                continue
            if nrm.dot(n) >= 0.3 and layer[i] < layer[f[0]]:     # 바깥 겹 옷을 안쪽에서 맞혔다 = 그 옷 안에 있어야 한다
                c0 = sum((V0[k] for k in f), Vector()) / len(f)
                pairs.append((i, cpolys[idx], (V0[i] - c0).length))
            break
    pokes, drifts = [], []
    for fr in frames:
        if act:
            pose_at(arm, act, fr)
        dg = bpy.context.evaluated_depsgraph_get()
        ev = lod0.evaluated_get(dg)
        m1 = ev.to_mesh()
        V1 = [v.co.copy() for v in m1.vertices]
        ev.to_mesh_clear()
        bad, far = 0, 0
        kinds = {}
        for i, f, g0 in pairs:
            pts = [V1[k] for k in polys[f]]
            c = sum(pts, Vector()) / len(pts)
            nrm = (pts[1] - pts[0]).cross(pts[2] - pts[0])
            if nrm.length < 1e-9:
                continue
            nrm.normalize()
            gap = (V1[i] - c).length
            if tight[polys[f][0]] and gap - g0 > 0.05:
                far += 1
                key = 'drift %d>%d' % (part[i], part[polys[f][0]])
            elif (V1[i] - c).dot(nrm) > 0.003:
                bad += 1
                key = 'poke %d>%d' % (part[i], part[polys[f][0]])
            else:
                continue
            kinds[key] = kinds.get(key, 0) + 1
        pokes.append(bad)
        drifts.append(far)
        if os.environ.get('KIT_DEBUG') and kinds:
            log('  맞음 검사', getattr(act, 'name', 'pose'), fr, sorted(kinds.items(), key=lambda kv: -kv[1])[:8])
    return len(pairs), pokes, drifts


# ───────────────────────── 미리보기 렌더 ─────────────────────────
def render_previews(built):
    if ONLY:            # 확인용 부분 빌드: 배포 미리보기를 덮지 않는다
        K.PREVIEW = os.path.join(K.BUILD, 'preview_only')
        os.makedirs(K.PREVIEW, exist_ok=True)
    sc = bpy.context.scene
    K.setup_preview(sun_elev=28, sun_az=140, grass=os.path.join(K.TEX, 'leafy_grass_diff_1k.jpg'))
    sc.eevee.taa_render_samples = 24 if K.FAST else 64
    n = len(built)
    gap = 0.95
    for i, b in enumerate(built):
        root = b['root']
        root.location = ((i - (n - 1) / 2) * gap, 0, 0)
        if b['v'] == 'child':
            root.scale = (0.62, 0.62, 0.62)
        b['arm'].data.pose_position = 'POSE'
    for o in bpy.data.objects:
        if o.name.startswith('prop_'):
            o.hide_render = True
    for b in built:
        if b['v'] == 'child':
            hb = b['arm'].pose.bones['Head']
            hb.scale = (1.22, 1.22, 1.22)
    shots = []
    W = n * gap
    cam = K.camera_look('cam_people', (0.6, -W * 1.05 - 3.0, 1.3), (0.0, 0, 0.9), lens=50)
    # 1) 서기 (Idle_Loop)
    for b in built:
        pose_at(b['arm'], ACTS['Idle_Loop'], 12)
    K.render_to(cam, os.path.join(K.PREVIEW, PV + 'idle.png')); shots.append(PV + 'idle.png')
    # 2) 걷기 (Walk_Loop 한가운데: 다리 벌림이 큰 때)
    for b in built:
        pose_at(b['arm'], ACTS['Walk_Loop'], 8)
    cam2 = K.camera_look('cam_walk', (W * 0.55 + 2.2, -W * 0.8 - 2.4, 1.3), (0.0, 0, 0.9), lens=45)
    K.render_to(cam2, os.path.join(K.PREVIEW, PV + 'walk.png')); shots.append(PV + 'walk.png')
    if SA or EA:      # 얼굴 높이 가까이: 터번·머릿자락·갓·쪽 (서기 자세)
        for b in built:
            pose_at(b['arm'], ACTS['Idle_Loop'], 12)
        camh = K.camera_look('cam_heads', (0.0, -W * 1.05 - 1.2, 1.62), (0.0, 0, 1.5), lens=55)
        K.render_to(camh, os.path.join(K.PREVIEW, PV + 'heads.png')); shots.append(PV + 'heads.png')
        for b in built:
            pose_at(b['arm'], ACTS['Walk_Loop'], 8)
    if SA or EA:      # 가까이: 걷는 여자 둘·남자 둘 (사리 자락·도티·터번 / 깃·고름·치마가 보이게)
        cam2b = K.camera_look('cam_close', (1.2, -3.4, 1.45), (0.0, 0, 1.05), lens=50)
        K.render_to(cam2b, os.path.join(K.PREVIEW, PV + 'close.png')); shots.append(PV + 'close.png')
    if os.environ.get('KIT_DEBUG_CLOSE') == '1':     # 확인용: 변형마다 앞·뒤 가까이 (걷기 8 프레임·이야기 30 프레임)
        for b in built:
            x = b['root'].location.x
            for act, fr, tag in (('Walk_Loop', 8, 'walk'), ('Idle_Talking_Loop', 30, 'talk')):
                for o in built:
                    pose_at(o['arm'], ACTS[act], fr)
                for side, yy in (('front', -2.1), ('back', 2.1)):
                    cm = K.camera_look('cam_dbg', (x + 0.35, yy, 1.35), (x, 0, 1.1), lens=55)
                    nm = PV + 'dbg_%s_%s_%s.png' % (b['v'], tag, side)
                    K.render_to(cm, os.path.join(K.PREVIEW, nm)); shots.append(nm)
        for o in built:
            pose_at(o['arm'], ACTS['Walk_Loop'], 8)
    # 3) 망치질 (대장장이만 가까이): 든 자세
    sm = [b for b in built if b['v'] == 'm_smith']
    if sm:
        b = sm[0]
        for o in built:
            o['root'].hide_render = o is not b
            for c in o['root'].children_recursive:
                c.hide_render = (o is not b) or c is o['lod1']
        grip, handle = hammer_pose(b['arm'], True)
        hp = bpy.data.objects.get('prop_hammer')
        if hp:
            place_hammer(b['arm'], hp, grip, handle)
            hp.hide_render = False
        x = b['root'].location.x
        cam3 = K.camera_look('cam_ham', (x + 2.2, -3.0, 1.55), (x - 0.05, 0, 1.15), lens=40)
        nm3 = PV + ('work.png' if (SA or EA) else 'hammer.png')
        K.render_to(cam3, os.path.join(K.PREVIEW, nm3)); shots.append(nm3)
        for o in built:
            o['root'].hide_render = False
            for c in o['root'].children_recursive:
                c.hide_render = c is o['lod1']
    return shots


# ───────────────────────── 시작 ─────────────────────────
ACTS = {}


def main():
    t0 = time.time()
    if not (UBC and os.path.isdir(UBC)):
        raise RuntimeError('UBC_DIR 가 없다: Quaternius Universal Base Characters[Standard] 를 푼 폴더를 알려 달라 (SOURCES.md)')
    if not (UAL and os.path.isfile(UAL)):
        raise RuntimeError('UAL_GLB 가 없다: Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb 경로를 알려 달라')
    K.reset_scene()
    for a in list(bpy.data.actions):
        bpy.data.actions.remove(a)
    fams = {'m': Family('m'), 'f': Family('f')}
    hairs = {h: hair_obj(h) for h in ('Hair_SimpleParted', 'Hair_Buzzed', 'Hair_Beard', 'Hair_Buns', 'Hair_BuzzedFemale') + (('Hair_Long',) if SA else ())}
    for h in hairs.values():
        h.hide_render = True
    for F in fams.values():
        for o in (F.arm, F.body, F.eyes, F.brows):
            o.hide_render = True
    col, nor = build_atlas(fams)
    det, cnor = build_cloth_tex()
    mats = {'skin': mat_skin(col, nor), 'cloth': mat_cloth(det, cnor), 'tool': mat_tool()}
    built = []
    for v, fk in VARIANTS:
        if ONLY and v not in ONLY:
            continue
        root, arm, lod0, lod1, parts, info = assemble(v, fams[fk], mats, hairs)
        built.append({'v': v, 'root': root, 'arm': arm, 'lod0': lod0, 'lod1': lod1, 'info': info})
    props = build_props(mats)
    # 원본(몸·머리카락·뼈대)은 내보내지 않는다
    for F in fams.values():
        kill_tree([F.body, F.eyes, F.brows])
    kill_tree(list(hairs.values()))
    ACTS.update(load_actions())
    report = {'variants': {b['v']: b['info'] for b in built}}
    if not NOEXPORT:
        report['export'] = export_all(built, props)
    # 뚫림 검사 (LOD0, 서기·걷기·망치질)
    # 맞음 검사: 변형 × 동작마다 [뚫림 최대, 떨어짐 최대] (프레임 가운데 가장 나쁜 것)
    poke = {}
    for b in built:
        r = {}
        for nm, act, frames in (('walk', 'Walk_Loop', [0, 4, 8, 12, 16, 20, 24, 28]), ('idle', 'Idle_Loop', [0, 20, 40]),
                                ('talk', 'Idle_Talking_Loop', [0, 30, 60]), ('kneel', 'Fixing_Kneeling', [40, 80, 120]), ('sit', 'Sitting_Idle_Loop', [0, 20])):
            n, pk, dr = fit_check(b['lod0'], b['arm'], ACTS[act], frames)
            r[nm] = [max(pk), max(dr)]
            r['pairs'] = n
        hp, hd = [], []
        for raised in (True, False):
            hammer_pose(b['arm'], raised)
            _, pk, dr = fit_check(b['lod0'], b['arm'], None, [0])
            hp += pk; hd += dr
        r['hammer'] = [max(hp), max(hd)]
        poke[b['v']] = r
        b['arm'].data.pose_position = 'REST'
    report['fit'] = poke
    log('맞음 검사 [뚫림, 떨어짐]', json.dumps(poke))
    if not NOPREVIEW:
        for b in built:
            if os.environ.get('KIT_DEBUG') != '3':
                preview_materials(b['v'], [b['lod0']], mats)
            b['lod1'].hide_render = True
        report['previews'] = render_previews(built)
    log('끝 %.0fs' % (time.time() - t0), json.dumps(report, ensure_ascii=False))


def export_all(built, props):
    """변형 뿌리(v_*: 뼈대 + LOD0·LOD1) + 소품을 glb 로 내보내고 pack_people.mjs 로 압축한다. UAL 동작 묶음(anims.glb)도 함께 만든다."""
    raw = os.path.join(K.BUILD, 'villagers_raw.glb')
    for b in built:
        b['arm'].data.pose_position = 'REST'
        if b['arm'].animation_data:
            b['arm'].animation_data.action = None
    for o in bpy.context.scene.objects:
        o.select_set(False)
    for b in built:
        b['root'].select_set(True)
        for c in b['root'].children_recursive:
            c.select_set(True)
    for p in props:
        p.parent = None
        p.matrix_world = Matrix.Identity(4)
        p.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=raw, export_format='GLB', use_selection=True, export_apply=True,
        export_texcoords=True, export_normals=True, export_tangents=False, export_materials='EXPORT', export_image_format='AUTO',
        export_vertex_color='ACTIVE', export_all_vertex_colors=False, export_active_vertex_color_when_no_material=True,
        export_skins=True, export_def_bones=False, export_influence_nb=4, export_all_influences=False, export_rest_position_armature=True,
        export_animations=False, export_cameras=False, export_lights=False, export_yup=True, export_extras=False,
        export_copyright='CC0 — past-life villagers (Quaternius Universal Base Characters CC0 + Blender script)')
    log('raw glb', '%.0f KB' % (os.path.getsize(raw) / 1024))
    gltft = next((p for p in K.GLTFT_CANDIDATES if p and os.path.isdir(os.path.join(p, 'node_modules', '@gltf-transform'))), None)
    if not gltft:
        raise RuntimeError('gltf-transform 을 찾지 못했다 (GLTFT 환경변수). 배포 glb 를 덮지 않았다.')
    ubc = os.path.join(UBC, 'Base Characters', 'Godot - UE')
    env = dict(os.environ, GLTFT=gltft)
    args = ['node', PACK, raw, OUT, os.path.join(ubc, 'Superhero_Male_FullBody.gltf'), os.path.join(ubc, 'Superhero_Female_FullBody.gltf'), UAL, ANIMS_OUT, ','.join(CLIPS)]
    r = subprocess.run(args, env=env, capture_output=True, text=True, encoding='utf-8')
    if r.returncode != 0:
        log('!! pack_people 실패', r.stdout, r.stderr)
        raise RuntimeError('pack_people failed')
    info = [json.loads(l) for l in r.stdout.splitlines() if l.startswith('{')]
    log('압축', json.dumps(info, ensure_ascii=False))
    return info


if __name__ == '__main__':
    main()
