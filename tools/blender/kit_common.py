# Blender 4.2 세트 공통 도구 — 재료(CC0 텍스처), 조각 짓기, AO 굽기, glTF 내보내기·압축, 미리보기 렌더.
# kit_england.py 같은 세트 스크립트가 import 해서 쓴다 (Blender 안의 Python 에서만 돈다).
#
# 좌표 약속 (Blender, Z 위):
#   - 조각마다 바닥 가운데가 원점, 단위 미터.
#   - 건물의 긴 축(용마루)은 X, 앞면(문·트인 쪽)은 -Y. glTF/three.js 로 가면 앞면이 +Z, 긴 축이 X 가 된다.
#   - 조각 뿌리는 빈 노드(조각 이름), 그 아래 메시 '<이름>_mesh' 와 표시용 빈 노드(<이름>_smoke, smithy_forge, mill_wheel …).
# 결정성: 난수는 모두 random.Random(고정 씨앗), 장면은 매번 비우고 시작한다.
#   AO 는 Cycles(OptiX, RTX 2060)로 굽는다. 같은 PC·같은 장치에서는 glb 가 바이트까지 같지만,
#   다른 GPU 나 CPU 로 구우면 AO 아틀라스 화소가 조금 달라질 수 있다 (바이트 동일은 보장하지 않는다).
# 압축 도구: gltf-transform 이 깔린 폴더가 필요하다. 환경변수 GLTFT 가 먼저고, 없으면 docs/past-life/tools 를 본다:
#   npm i --prefix docs/past-life/tools @gltf-transform/core@4 @gltf-transform/functions@4 @gltf-transform/extensions@4 meshoptimizer@0.21 sharp
#   (docs/past-life/.gitignore 가 node_modules/ 를 뺀다). 못 찾으면 멈춘다 — 압축 안 된 glb 로 배포 파일을 덮지 않는다.
import bpy, bmesh, math, os, sys, random, subprocess, tempfile, json, hashlib, time
import numpy as np
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, '..', '..'))
PL = os.path.join(ROOT, 'docs', 'past-life')
TEX = os.path.join(PL, 'assets', 'real', 'tex')
KITS = os.path.join(PL, 'assets', 'real', 'kits')
PREVIEW = os.path.join(KITS, 'preview')
BUILD = os.path.join(tempfile.gettempdir(), 'pastlife_kit_build')
PACK_TOOL = os.path.join(PL, 'tools', 'pack_kit.mjs')
# gltf-transform 이 깔린 폴더 (저장소에 넣지 않는 개발 도구). 환경변수 GLTFT 가 먼저, 다음은 docs/past-life/tools.
GLTFT_CANDIDATES = [
    os.environ.get('GLTFT', ''),
    os.path.join(PL, 'tools'),
]

FAST = os.environ.get('KIT_FAST') == '1'      # 빠른 시험: 굽기 표본 적게


def log(*a):
    print('[kit]', *a, flush=True)


# ───────────────────────── 장면 ─────────────────────────
def reset_scene():
    """시작 장면을 통째로 비운다 (사용자 설정은 건드리지 않는다)."""
    if bpy.context.object and bpy.context.object.mode != 'OBJECT':
        bpy.ops.object.mode_set(mode='OBJECT')
    for coll in (bpy.data.objects, bpy.data.meshes, bpy.data.materials, bpy.data.images, bpy.data.node_groups,
                 bpy.data.cameras, bpy.data.lights, bpy.data.curves, bpy.data.textures, bpy.data.collections):
        for d in list(coll):
            coll.remove(d)
    sc = bpy.context.scene
    if sc.world is None:
        sc.world = bpy.data.worlds.new('World')
    sc.unit_settings.system = 'METRIC'
    sc.frame_set(1)
    os.makedirs(BUILD, exist_ok=True)
    os.makedirs(PREVIEW, exist_ok=True)


# ───────────────────────── 작은 잡음 (결정적) ─────────────────────────
def _h(ix, iy, s):
    h = (ix * 374761393 + iy * 668265263 + (s + 1) * 1442695041) & 0xffffffff
    h = ((h ^ (h >> 13)) * 1274126177) & 0xffffffff
    return ((h ^ (h >> 16)) & 0xffffffff) / 4294967296.0


def vnoise(x, y, s=0):
    ix, iy = math.floor(x), math.floor(y)
    fx, fy = x - ix, y - iy
    ux, uy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a, b, c, d = _h(ix, iy, s), _h(ix + 1, iy, s), _h(ix, iy + 1, s), _h(ix + 1, iy + 1, s)
    return ((a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy) * 2 - 1


def fbm(x, y, s=0, oct=3):
    v, a, f = 0.0, 0.5, 1.0
    for i in range(oct):
        v += a * vnoise(x * f, y * f, s + i * 7)
        f *= 2.03
        a *= 0.5
    return v


def smin(a, b, k):
    if k <= 0:
        return min(a, b)
    h = max(k - abs(a - b), 0.0) / k
    return min(a, b) - h * h * k * 0.25


def smax(a, b, k):
    return -smin(-a, -b, k)


# ───────────────────────── 텍스처 손질 (numpy) ─────────────────────────
def _load_np(path):
    img = bpy.data.images.load(path, check_existing=False)
    w, h = img.size
    a = np.empty(w * h * 4, np.float32)
    img.pixels.foreach_get(a)
    bpy.data.images.remove(img)
    return a.reshape(h, w, 4)


def _save_np(arr, path):
    h, w, _ = arr.shape
    img = bpy.data.images.new(os.path.basename(path), w, h, alpha=False)
    img.pixels.foreach_set(np.clip(arr, 0, 1).astype(np.float32).ravel())
    img.filepath_raw = path
    img.file_format = 'PNG'
    img.save()
    bpy.data.images.remove(img)


def _tile_v(arr, crop_top, blend):
    """위쪽 crop_top 비율을 잘라내고, 위아래를 blend 비율만큼 섞어 세로로 이어지게 한 뒤 원래 높이로 늘린다.
    (Blender 그림은 아래 행이 0 이다: '위'는 배열의 끝쪽)"""
    h = arr.shape[0]
    keep = arr[: int(h * (1 - crop_top))]
    n = keep.shape[0]
    b = int(n * blend)
    top, bot = keep[n - b:], keep[:b]
    t = np.linspace(0, 1, b, dtype=np.float32)[:, None, None]
    # 아래 b 행을 위쪽 b 행과 섞고, 위쪽 b 행은 버린다 → 이음매 없이 반복
    mixed = bot * t + top * (1 - t)
    out = np.concatenate([mixed, keep[b:n - b]], axis=0)
    # 세로 선형 보간으로 원래 높이로
    src = np.linspace(0, out.shape[0] - 1, h, dtype=np.float32)
    i0 = np.floor(src).astype(int)
    i1 = np.minimum(i0 + 1, out.shape[0] - 1)
    f = (src - i0)[:, None, None]
    return out[i0] * (1 - f) + out[i1] * f


def prep_texture(key, src, tint=(1, 1, 1), gain=1.0, sat=1.0, contrast=1.0, tile_v=None, stripes=None, normal=False):
    """CC0 원본 → 물들이고 손본 PNG (BUILD 폴더). 같은 입력이면 같은 출력."""
    out = os.path.join(BUILD, key + '.png')
    a = _load_np(os.path.join(TEX, src))
    if tile_v:
        a = _tile_v(a, *tile_v)
    if not normal:
        rgb = a[..., :3]
        lum = (rgb * np.array([0.2126, 0.7152, 0.0722], np.float32)).sum(-1, keepdims=True)
        rgb = lum + (rgb - lum) * sat
        m = float(lum.mean())
        rgb = m + (rgb - m) * contrast
        rgb = rgb * np.array(tint, np.float32) * gain
        if stripes:
            # 세로 줄무늬 (u 방향): stripes = (줄 수, 색1, 색2)
            n, c1, c2 = stripes
            w = a.shape[1]
            u = (np.arange(w, dtype=np.float32) / w * n) % 1.0
            sel = (u < 0.5).astype(np.float32)[None, :, None]
            l2 = lum / max(m, 1e-3)
            rgb = l2 * (np.array(c1, np.float32) * sel + np.array(c2, np.float32) * (1 - sel))
        a = np.concatenate([rgb, np.ones_like(a[..., :1])], -1)
    _save_np(a, out)
    return out


_img_cache = {}


def load_image(path, noncolor=False):
    if path in _img_cache:
        return _img_cache[path]
    img = bpy.data.images.load(path, check_existing=False)
    img.colorspace_settings.name = 'Non-Color' if noncolor else 'sRGB'
    _img_cache[path] = img
    return img


# ───────────────────────── 재료 ─────────────────────────
MATS = {}


def make_material(name, diff=None, nor=None, rough=0.9, nstr=1.0, color=(0.8, 0.8, 0.8), metal=0.0,
                  emit=None, emit_strength=0.0, double=False):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    m.use_backface_culling = not double     # glTF doubleSided = False
    nt = m.node_tree
    N, L = nt.nodes, nt.links
    bsdf = N['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = rough
    bsdf.inputs['Metallic'].default_value = metal
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    uv = N.new('ShaderNodeUVMap')
    uv.uv_map = 'UVMap'
    uv.location = (-900, 0)
    if diff:
        t = N.new('ShaderNodeTexImage')
        t.name = 'BASE'
        t.image = load_image(diff)
        t.location = (-600, 200)
        L.new(uv.outputs['UV'], t.inputs['Vector'])
        L.new(t.outputs['Color'], bsdf.inputs['Base Color'])
    if nor:
        t2 = N.new('ShaderNodeTexImage')
        t2.image = load_image(nor, noncolor=True)
        t2.location = (-600, -200)
        nm = N.new('ShaderNodeNormalMap')
        nm.uv_map = 'UVMap'
        nm.inputs['Strength'].default_value = nstr
        nm.location = (-300, -200)
        L.new(uv.outputs['UV'], t2.inputs['Vector'])
        L.new(t2.outputs['Color'], nm.inputs['Color'])
        L.new(nm.outputs['Normal'], bsdf.inputs['Normal'])
    if emit:
        bsdf.inputs['Emission Color'].default_value = (*emit, 1)
        bsdf.inputs['Emission Strength'].default_value = emit_strength
    MATS[name] = m
    return m


# ───────────────────────── 조각 짓기 ─────────────────────────
def box_vf(x0, x1, y0, y1, z0, z1):
    v = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)]
    f = [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]
    return v, f


def prism_vf(poly, axis, a0, a1):
    """2D 다각형(반시계)을 axis 방향으로 a0~a1 만큼 밀어낸 기둥. axis='y': poly=(x,z), 'x': poly=(y,z), 'z': poly=(x,y)."""
    n = len(poly)

    def P(p, a):
        if axis == 'y':
            return (p[0], a, p[1])
        if axis == 'x':
            return (a, p[0], p[1])
        return (p[0], p[1], a)
    v = [P(p, a0) for p in poly] + [P(p, a1) for p in poly]
    f = [tuple(range(n)), tuple(range(2 * n - 1, n - 1, -1))]
    for i in range(n):
        j = (i + 1) % n
        f.append((i, j, n + j, n + i))
    return v, f


def cyl_vf(r0, r1, h, n=12, z0=0.0, caps=True):
    v = []
    for k in range(n):
        a = 2 * math.pi * k / n
        v.append((r0 * math.cos(a), r0 * math.sin(a), z0))
    for k in range(n):
        a = 2 * math.pi * k / n
        v.append((r1 * math.cos(a), r1 * math.sin(a), z0 + h))
    f = [(k, (k + 1) % n, n + (k + 1) % n, n + k) for k in range(n)]
    if caps:
        f.append(tuple(range(n - 1, -1, -1)))
        f.append(tuple(range(n, 2 * n)))
    return v, f


def frame_between(p0, p1, up=(0, 0, 1)):
    """p0→p1 을 로컬 X 로 하는 행렬 (원점 p0)."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    L = d.length
    x = d / L
    u = Vector(up)
    if abs(x.dot(u)) > 0.98:
        u = Vector((0, 1, 0)) if abs(x.y) < 0.9 else Vector((1, 0, 0))
    y = u.cross(x).normalized()
    z = x.cross(y).normalized()
    M = Matrix((
        (x.x, y.x, z.x, p0.x),
        (x.y, y.y, z.y, p0.y),
        (x.z, y.z, z.z, p0.z),
        (0, 0, 0, 1)))
    return M, L


def bm_from(v, f):
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in v]
    for face in f:
        try:
            bm.faces.new([vs[i] for i in face])
        except ValueError:
            pass
    return bm


def uv_box(bm, uvl, tile=2.0, off=(0.0, 0.0), grain=None):
    """면마다 가장 큰 법선 축으로 투영 (미터 단위). grain='x' 면 X 를 결 방향으로 (기둥·보)."""
    tu = tile if not isinstance(tile, tuple) else tile[0]
    tv = tile if not isinstance(tile, tuple) else tile[1]
    for f in bm.faces:
        n = f.normal
        ax, ay, az = abs(n.x), abs(n.y), abs(n.z)
        for l in f.loops:
            p = l.vert.co
            if grain == 'x':
                # 나뭇결(텍스처 v 방향)을 부품의 X(길이) 방향으로: tile=(결 방향, 가로)
                if ax >= max(ay, az):
                    u, v = p.y / tv, p.z / tv
                elif ay >= az:
                    u, v = p.z / tv, p.x / tu
                else:
                    u, v = p.y / tv, p.x / tu
                l[uvl].uv = (u + off[0], v + off[1])
                continue
            if az >= max(ax, ay):
                u, v = p.x * (1 if n.z >= 0 else -1), p.y
            elif ax >= ay:
                u, v = p.y * (1 if n.x >= 0 else -1), p.z
            else:
                u, v = -p.x * (1 if n.y >= 0 else -1), p.z
            l[uvl].uv = (u / tu + off[0], v / tv + off[1])


class Piece:
    """조각 하나 = bmesh 하나 (재료별 면 번호). add* 로 부품을 붙이고 finish() 로 오브젝트를 만든다."""

    def __init__(self, name, seed=1):
        self.name = name
        self.bm = bmesh.new()
        self.uvl = self.bm.loops.layers.uv.new('UVMap')
        self.mats = []
        self.rng = random.Random(seed)
        self.markers = []       # (이름, (x,y,z))
        self.subs = []          # 따로 움직이는 하위 조각: (빈 노드 이름, 피벗, Piece)
        self.nofoot = False     # True 인 동안 붙인 부품은 바닥 크기(foot)에 넣지 않는다 (활짝 연 문짝 등)
        self.foot = [math.inf, -math.inf, math.inf, -math.inf]

    def mi(self, mat):
        if mat not in self.mats:
            self.mats.append(mat)
        return self.mats.index(mat)

    def _merge(self, src, mat, smooth, uvl_src):
        idx = self.mi(mat)
        vmap = {}
        for v in src.verts:
            vmap[v] = self.bm.verts.new(v.co)
            if not self.nofoot:
                fb = self.foot
                fb[0], fb[1] = min(fb[0], v.co.x), max(fb[1], v.co.x)
                fb[2], fb[3] = min(fb[2], v.co.y), max(fb[3], v.co.y)
        for f in src.faces:
            try:
                nf = self.bm.faces.new([vmap[v] for v in f.verts])
            except ValueError:
                continue
            nf.material_index = idx
            nf.smooth = smooth
            for ls, ld in zip(f.loops, nf.loops):
                ld[self.uvl].uv = ls[uvl_src].uv

    def add_bm(self, bm, mat, tile=2.0, matrix=None, bevel=0.0, seg=1, smooth=False, grain=None, uv=True, off=None):
        """bmesh 부품을 붙인다. UV 는 부품 자기 좌표에서 투영한 뒤 matrix 로 옮긴다."""
        bm.normal_update()
        if bevel > 0:
            bmesh.ops.bevel(bm, geom=list(bm.verts) + list(bm.edges), offset=bevel, offset_type='OFFSET',
                            segments=seg, profile=0.5, affect='EDGES', clamp_overlap=True)
            bm.normal_update()
        uvl = bm.loops.layers.uv.verify()
        if uv:
            if off is None:
                off = (self.rng.random() * 7.0, self.rng.random() * 7.0)
            uv_box(bm, uvl, tile, off, grain)
        if matrix is not None:
            bmesh.ops.transform(bm, matrix=matrix, verts=bm.verts)
        self._merge(bm, mat, smooth, uvl)
        bm.free()

    def box(self, x0, x1, y0, y1, z0, z1, mat, tile=2.0, bevel=0.0, matrix=None, grain=None, seg=1, off=None):
        v, f = box_vf(min(x0, x1), max(x0, x1), min(y0, y1), max(y0, y1), min(z0, z1), max(z0, z1))
        self.add_bm(bm_from(v, f), mat, tile, matrix, bevel, seg, grain=grain, off=off)

    def beam(self, p0, p1, w, h, mat='timber_dark', tile=(1.6, 0.8), bevel=0.012, up=(0, 0, 1), ext=0.0):
        """p0→p1 각재. w=가로(로컬 Y), h=세로(로컬 Z). ext 만큼 양끝을 늘린다."""
        M, L = frame_between(p0, p1, up)
        v, f = box_vf(-ext, L + ext, -w / 2, w / 2, -h / 2, h / 2)
        self.add_bm(bm_from(v, f), mat, tile, M, bevel, grain='x')

    def prism(self, poly, axis, a0, a1, mat, tile=2.0, matrix=None, bevel=0.0):
        v, f = prism_vf(poly, axis, a0, a1)
        self.add_bm(bm_from(v, f), mat, tile, matrix, bevel)

    def cyl(self, r0, r1, h, mat, n=12, matrix=None, tile=1.0, smooth=True, caps=True, z0=0.0):
        """원기둥: 옆면은 매끈하게, 뚜껑은 따로 (각진 이음)."""
        v, f = cyl_vf(r0, r1, h, n, z0, caps=False)
        bm = bm_from(v, f)
        bm.normal_update()
        uvl = bm.loops.layers.uv.verify()
        circ = 2 * math.pi * max(r0, r1)
        for face in bm.faces:
            for l in face.loops:
                p = l.vert.co
                a = math.atan2(p.y, p.x) / (2 * math.pi) % 1.0
                l[uvl].uv = (a * circ / tile, p.z / tile)
            # 이음매 고치기
            us = [l[uvl].uv.x for l in face.loops]
            if max(us) - min(us) > circ / tile * 0.5:
                for l in face.loops:
                    if l[uvl].uv.x < circ / tile * 0.5:
                        l[uvl].uv.x += circ / tile
        if matrix is not None:
            bmesh.ops.transform(bm, matrix=matrix, verts=bm.verts)
        self._merge(bm, mat, smooth, uvl)
        bm.free()
        if caps:
            for zz, rr, flip in ((z0, r0, True), (z0 + h, r1, False)):
                pts = [(rr * math.cos(2 * math.pi * k / n), rr * math.sin(2 * math.pi * k / n), zz) for k in range(n)]
                face = list(range(n - 1, -1, -1)) if flip else list(range(n))
                b2 = bm_from(pts, [face])
                self.add_bm(b2, mat, tile, matrix)

    def add_obj(self, obj, mat, uvmode='box', tile=2.0, smooth=False, matrix=None, keep_uv=False, grain=None, off=None):
        """모디파이어(불리언·두께·모서리)를 적용한 오브젝트를 부품으로 붙이고 지운다."""
        dg = bpy.context.evaluated_depsgraph_get()
        ev = obj.evaluated_get(dg)
        me = bpy.data.meshes.new_from_object(ev)
        bm = bmesh.new()
        bm.from_mesh(me)
        bm.normal_update()
        uvl = bm.loops.layers.uv.verify()
        if not keep_uv:
            if off is None:
                off = (self.rng.random() * 7.0, self.rng.random() * 7.0)
            uv_box(bm, uvl, tile, off, grain)
        if matrix is not None:
            bmesh.ops.transform(bm, matrix=matrix, verts=bm.verts)
        self._merge(bm, mat, smooth, uvl)
        bm.free()
        bpy.data.meshes.remove(me)
        kill(obj)

    def marker(self, name, co):
        self.markers.append((name, tuple(co)))

    def finish(self, location=(0, 0, 0)):
        """뿌리 빈 노드(이름) + 메시(<이름>_mesh) + 표시 노드 + 하위 조각을 만든다."""
        root = bpy.data.objects.new(self.name, None)
        root.empty_display_size = 0.5
        bpy.context.scene.collection.objects.link(root)
        me = bpy.data.meshes.new(self.name + '_mesh')
        bmesh.ops.remove_doubles(self.bm, verts=self.bm.verts, dist=0.0005)
        self.bm.normal_update()
        self.bm.to_mesh(me)
        self.bm.free()
        for m in self.mats:
            me.materials.append(MATS[m])
        ob = bpy.data.objects.new(self.name + '_mesh', me)
        bpy.context.scene.collection.objects.link(ob)
        ob.parent = root
        for name, co in self.markers:
            e = bpy.data.objects.new(name, None)
            e.empty_display_size = 0.3
            e.location = co
            bpy.context.scene.collection.objects.link(e)
            e.parent = root
        for ename, pivot, sub in self.subs:
            e = bpy.data.objects.new(ename, None)
            e.location = pivot
            bpy.context.scene.collection.objects.link(e)
            e.parent = root
            sroot = sub.finish()          # 하위 조각은 피벗 기준 좌표로 지었다
            for c in list(sroot.children):
                c.parent = e
            kill(sroot)
        root.location = location
        return root


def kill(obj):
    me = obj.data if obj.type == 'MESH' else None
    bpy.data.objects.remove(obj, do_unlink=True)
    if me is not None and me.users == 0:
        bpy.data.meshes.remove(me)


def temp_obj(v, f, name='tmp'):
    me = bpy.data.meshes.new(name)
    me.from_pydata(v, [], f)
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def boolean_cut(obj, cutters):
    """cutters: [(v,f), …] 를 한 덩어리로 모아 obj 에서 뺀다 (EXACT)."""
    if not cutters:
        return
    vs, fs = [], []
    for v, f in cutters:
        o = len(vs)
        vs += v
        fs += [tuple(i + o for i in face) for face in f]
    bm = bm_from(vs, fs)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    cme = bpy.data.meshes.new('cutter')
    bm.to_mesh(cme)
    bm.free()
    c = bpy.data.objects.new('cutter', cme)
    bpy.context.scene.collection.objects.link(c)
    c.hide_render = True
    mod = obj.modifiers.new('cut', 'BOOLEAN')
    mod.operation = 'DIFFERENCE'
    mod.solver = 'EXACT'
    mod.object = c
    dg = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev)
    old = obj.data
    obj.modifiers.clear()
    obj.data = me
    bpy.data.meshes.remove(old)
    kill(c)


def heightfield(fz, xs, ys, thick, bevel_w=0.0, bevel_seg=2, uvfn=None, keep=None, name='hf'):
    """높이장 지붕: z=fz(x,y) 격자 → 두께(아래로) + 둥근 모서리. uvfn(face 중심 x,y,z, 기울기) → 꼭짓점 UV 함수."""
    nx, ny = len(xs), len(ys)
    v = [(x, y, fz(x, y)) for y in ys for x in xs]
    f = []
    for j in range(ny - 1):
        for i in range(nx - 1):
            q = (j * nx + i, j * nx + i + 1, (j + 1) * nx + i + 1, (j + 1) * nx + i)
            if keep is None or keep(i, j):
                f.append(q)
    ob = temp_obj(v, f, name)
    me = ob.data
    if uvfn:
        uvl = me.uv_layers.new(name='UVMap')
        for poly in me.polygons:
            uvfn_poly = uvfn(me, poly)
            for li, uvv in zip(poly.loop_indices, uvfn_poly):
                uvl.data[li].uv = uvv
    sol = ob.modifiers.new('sol', 'SOLIDIFY')
    sol.thickness = thick
    sol.offset = -1.0
    sol.use_even_offset = True
    sol.use_quality_normals = True
    sol.use_rim = True
    if bevel_w > 0:
        bv = ob.modifiers.new('bev', 'BEVEL')
        bv.width = bevel_w
        bv.segments = bevel_seg
        bv.limit_method = 'ANGLE'
        bv.angle_limit = math.radians(55)
        bv.harden_normals = False
    return ob


def slope_uv(tile_u=2.0, tile_v=2.0, pitch=50.0, off=(0.0, 0.0)):
    """지붕 UV: v = 경사 따라 거리(z/sin), u = 등고선 방향 (면 기울기로 x 또는 y)."""
    sp = math.sin(math.radians(pitch))

    def fn(me, poly):
        vs = [me.vertices[i].co for i in poly.vertices]
        n = poly.normal
        out = []
        for p in vs:
            u = p.x if abs(n.y) >= abs(n.x) else p.y * (1 if n.x > 0 else -1)
            if abs(n.y) >= abs(n.x) and n.y < 0:
                u = -u
            out.append((u / tile_u + off[0], p.z / sp / tile_v + off[1]))
        return out
    return fn


# ───────────────────────── AO 굽기 (두 번째 UV 'AO' + 아틀라스 한 장) ─────────────────────────
def mesh_objects(roots):
    out = []
    for r in roots:
        for o in [r] + list(r.children_recursive):
            if o.type == 'MESH':
                out.append(o)
    return out


def make_ao_uvs(objs, margin=0.0016):
    t0 = time.time()
    for o in objs:
        me = o.data
        if 'AO' not in me.uv_layers:
            me.uv_layers.new(name='AO')
        me.uv_layers['UVMap'].active_render = True
        me.uv_layers.active = me.uv_layers['AO']
    vl = bpy.context.view_layer
    for o in bpy.context.scene.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    vl.objects.active = objs[0]
    ts = bpy.context.scene.tool_settings
    ts.use_uv_select_sync = True
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(62), island_margin=0.0, area_weight=0.0,
                             correct_aspect=True, scale_to_bounds=False)
    bpy.ops.uv.select_all(action='SELECT')
    bpy.ops.uv.pack_islands(udim_source='CLOSEST_UDIM', rotate=True, scale=True, margin_method='FRACTION',
                            margin=margin, shape_method='CONCAVE')
    bpy.ops.object.mode_set(mode='OBJECT')
    log('AO UV', len(objs), '개 메시, %.1fs' % (time.time() - t0))


def use_gpu():
    """Cycles 를 GPU(OptiX→CUDA)로. 사용자 설정 파일은 저장하지 않는다 (백그라운드는 자동 저장 안 함)."""
    try:
        cp = bpy.context.preferences.addons['cycles'].preferences
        for t in ('OPTIX', 'CUDA'):
            try:
                cp.compute_device_type = t
                cp.get_devices()
                gpus = [d for d in cp.devices if d.type == t]
                if gpus:
                    for d in cp.devices:
                        d.use = d.type == t
                    bpy.context.scene.cycles.device = 'GPU'
                    log('Cycles 장치', t, gpus[0].name)
                    return t
            except Exception:
                continue
    except Exception as e:
        log('GPU 못 씀', e)
    bpy.context.scene.cycles.device = 'CPU'
    return 'CPU'


def bake_ao(objs, size=2048, samples=256, distance=1.4, margin=8, ground=True):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    use_gpu()
    sc.cycles.samples = 24 if FAST else samples
    sc.cycles.use_denoising = False
    sc.cycles.seed = 0
    sc.world.light_settings.distance = distance
    img = bpy.data.images.new('kit_ao', size, size, alpha=False)
    img.colorspace_settings.name = 'Non-Color'
    img.generated_color = (1, 1, 1, 1)
    mats = set()
    for o in objs:
        for m in o.data.materials:
            mats.add(m)
    for m in mats:
        n = m.node_tree.nodes.new('ShaderNodeTexImage')
        n.name = '__bake'
        n.image = img
        m.node_tree.nodes.active = n
    gp = None
    if ground:
        # 땅: 벽 밑동이 어두워지게 (굽기에만 쓰고 지운다)
        gp = temp_obj([(-2000, -2000, 0), (2000, -2000, 0), (2000, 2000, 0), (-2000, 2000, 0)], [(0, 1, 2, 3)], 'bake_ground')
    for o in bpy.context.scene.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bk = sc.render.bake
    bk.margin = margin
    bk.margin_type = 'EXTEND'
    bk.use_clear = True
    bk.target = 'IMAGE_TEXTURES'
    t0 = time.time()
    bpy.ops.object.bake(type='AO', margin=margin, use_clear=True)
    log('AO 굽기 %.1fs (%d 표본)' % (time.time() - t0, sc.cycles.samples))
    if gp:
        kill(gp)
    for m in mats:
        m.node_tree.nodes.remove(m.node_tree.nodes['__bake'])
    # 잡음 줄이기: 3×3 흐림 한 번 + 너무 검은 곳 들어올리기
    a = np.empty(size * size * 4, np.float32)
    img.pixels.foreach_get(a)
    a = a.reshape(size, size, 4)
    g = a[..., 0]
    gp_ = np.pad(g, 1, mode='edge')
    g = sum(gp_[1 + dy:1 + dy + size, 1 + dx:1 + dx + size] for dy in (-1, 0, 1) for dx in (-1, 0, 1)) / 9.0
    g = 0.12 + 0.88 * np.clip(g, 0, 1)
    a[..., 0] = a[..., 1] = a[..., 2] = g
    a[..., 3] = 1
    img.pixels.foreach_set(a.ravel())
    path = os.path.join(BUILD, 'kit_ao.png')
    img.filepath_raw = path
    img.file_format = 'PNG'
    img.save()
    for o in objs:
        o.data.uv_layers.active = o.data.uv_layers['UVMap']
        o.data.uv_layers['UVMap'].active_render = True
    return img


def wire_ao(mats, img):
    """glTF 내보내기가 알아보는 'glTF Material Output' 묶음의 Occlusion 에 AO 아틀라스(UV 'AO')를 잇는다."""
    gname = 'glTF Material Output'
    grp = bpy.data.node_groups.get(gname)
    if grp is None:
        grp = bpy.data.node_groups.new(gname, 'ShaderNodeTree')
        grp.interface.new_socket('Occlusion', in_out='INPUT', socket_type='NodeSocketFloat')
        th = grp.interface.new_socket('Thickness', in_out='INPUT', socket_type='NodeSocketFloat')
        th.default_value = 0.0
        grp.nodes.new('NodeGroupOutput')
        gi = grp.nodes.new('NodeGroupInput')
        gi.location = (-200, 0)
    for m in mats:
        N, L = m.node_tree.nodes, m.node_tree.links
        uv = N.new('ShaderNodeUVMap')
        uv.uv_map = 'AO'
        uv.location = (-900, -500)
        t = N.new('ShaderNodeTexImage')
        t.name = 'AO'
        t.image = img
        t.location = (-600, -500)
        L.new(uv.outputs['UV'], t.inputs['Vector'])
        sep = N.new('ShaderNodeSeparateColor')
        sep.location = (-300, -500)
        L.new(t.outputs['Color'], sep.inputs['Color'])
        g = N.new('ShaderNodeGroup')
        g.node_tree = grp
        g.location = (0, -500)
        L.new(sep.outputs['Red'], g.inputs['Occlusion'])


def ao_into_basecolor(mats):
    """미리보기용: 구운 AO 를 바탕색에 곱한다 (Eevee 는 glTF Occlusion 을 안 쓴다). 내보낸 뒤에만 부른다."""
    for m in mats:
        N, L = m.node_tree.nodes, m.node_tree.links
        bsdf = N['Principled BSDF']
        if 'AO' not in N:
            continue
        mix = N.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        mix.blend_type = 'MULTIPLY'
        mix.inputs['Factor'].default_value = 1.0
        src = bsdf.inputs['Base Color'].links[0].from_socket if bsdf.inputs['Base Color'].is_linked else None
        if src is not None:
            L.new(src, mix.inputs['A'])
        else:
            mix.inputs['A'].default_value = bsdf.inputs['Base Color'].default_value
        L.new(N['AO'].outputs['Color'], mix.inputs['B'])
        L.new(mix.outputs['Result'], bsdf.inputs['Base Color'])


# ───────────────────────── 내보내기 + 압축 ─────────────────────────
def export_glb(roots, out_path):
    raw = os.path.join(BUILD, os.path.basename(out_path).replace('.glb', '_raw.glb'))
    for o in bpy.context.scene.objects:
        o.select_set(False)
    for r in roots:
        r.select_set(True)
        for c in r.children_recursive:
            c.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=raw, export_format='GLB', use_selection=True, export_apply=True,
        export_texcoords=True, export_normals=True, export_tangents=False,
        export_materials='EXPORT', export_image_format='AUTO', export_vertex_color='NONE',
        export_cameras=False, export_lights=False, export_yup=True, export_animations=False,
        export_extras=False, export_copyright='CC0 — past-life kit (Blender script)')
    log('raw glb', raw, '%.0f KB' % (os.path.getsize(raw) / 1024))
    gltft = next((p for p in GLTFT_CANDIDATES if p and os.path.isdir(os.path.join(p, 'node_modules', '@gltf-transform'))), None)
    if not gltft:
        raise RuntimeError(
            'gltf-transform 을 찾지 못했다. 환경변수 GLTFT=<node_modules 가 있는 폴더> 를 주거나 '
            'npm i --prefix docs/past-life/tools @gltf-transform/core@4 @gltf-transform/functions@4 '
            '@gltf-transform/extensions@4 meshoptimizer@0.21 sharp 로 깔아라. (압축 안 된 glb 로 %s 를 덮지 않았다)' % out_path)
    env = dict(os.environ, GLTFT=gltft)
    r = subprocess.run(['node', PACK_TOOL, raw, out_path], env=env, capture_output=True, text=True, encoding='utf-8')
    if r.returncode != 0:
        log('!! pack_kit 실패', r.stdout, r.stderr)
        raise RuntimeError('pack_kit failed')
    line = [l for l in r.stdout.splitlines() if l.startswith('{')][-1]
    info = json.loads(line)
    info['compressed'] = True
    log('압축', info)
    return info


def sha(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        h.update(f.read())
    return h.hexdigest()[:16]


def tri_count(obj):
    me = obj.data
    me.calc_loop_triangles()
    return len(me.loop_triangles)


# ───────────────────────── 미리보기 (Eevee) ─────────────────────────
def setup_preview(sun_elev=24.0, sun_az=125.0, grass=None):
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x, sc.render.resolution_y = 1280, 720
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = 'PNG'
    for a in dir(sc.render):          # PNG 에 날짜·렌더 시간 메타데이터를 넣지 않는다 (다시 돌려도 같은 파일)
        if a.startswith('use_stamp'):
            try:
                setattr(sc.render, a, False)
            except Exception:
                pass
    ee = sc.eevee
    ee.taa_render_samples = 32 if FAST else 64
    for attr, val in (('use_raytracing', True), ('use_shadows', True), ('shadow_ray_count', 2), ('shadow_step_count', 8),
                      ('use_gtao', True), ('gtao_distance', 1.0)):
        if hasattr(ee, attr):
            try:
                setattr(ee, attr, val)
            except Exception:
                pass
    try:
        ee.ray_tracing_options.resolution_scale = '1'
    except Exception:
        pass
    sc.view_settings.view_transform = 'AgX'
    try:
        sc.view_settings.look = 'AgX - Medium High Contrast'
    except Exception:
        pass
    sc.view_settings.exposure = 0.0
    w = sc.world
    w.use_nodes = True
    N, L = w.node_tree.nodes, w.node_tree.links
    N.clear()
    sky = N.new('ShaderNodeTexSky')
    sky.sky_type = 'NISHITA'
    sky.sun_elevation = math.radians(sun_elev)
    sky.sun_rotation = math.radians(sun_az)
    sky.air_density = 1.2
    sky.dust_density = 2.0
    sky.sun_disc = False
    bg = N.new('ShaderNodeBackground')
    bg.inputs['Strength'].default_value = 0.22
    out = N.new('ShaderNodeOutputWorld')
    L.new(sky.outputs['Color'], bg.inputs['Color'])
    L.new(bg.outputs['Background'], out.inputs['Surface'])
    ld = bpy.data.lights.new('sun', 'SUN')
    ld.energy = 4.2
    ld.angle = math.radians(1.2)
    ld.color = (1.0, 0.93, 0.82)
    sun = bpy.data.objects.new('sun', ld)
    bpy.context.scene.collection.objects.link(sun)
    # Nishita 의 해 방향과 맞춘다: 해 회전 = Z 축 둘레 (Y+ 에서 시계 반대)
    el, az = math.radians(sun_elev), math.radians(sun_az)
    d = Vector((math.sin(az) * math.cos(el), math.cos(az) * math.cos(el), math.sin(el)))
    sun.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    # 땅
    gm = bpy.data.materials.new('preview_ground')
    gm.use_nodes = True
    if grass:
        Ng, Lg = gm.node_tree.nodes, gm.node_tree.links
        t = Ng.new('ShaderNodeTexImage')
        t.image = load_image(grass)
        tc = Ng.new('ShaderNodeTexCoord')
        mp = Ng.new('ShaderNodeMapping')
        mp.inputs['Scale'].default_value = (0.3, 0.3, 0.3)
        Lg.new(tc.outputs['Object'], mp.inputs['Vector'])
        Lg.new(mp.outputs['Vector'], t.inputs['Vector'])
        mx = Ng.new('ShaderNodeMix')
        mx.data_type = 'RGBA'
        mx.blend_type = 'MULTIPLY'
        mx.inputs['Factor'].default_value = 1.0
        mx.inputs['B'].default_value = (0.62, 0.78, 0.38, 1)
        Lg.new(t.outputs['Color'], mx.inputs['A'])
        Lg.new(mx.outputs['Result'], Ng['Principled BSDF'].inputs['Base Color'])
        Ng['Principled BSDF'].inputs['Roughness'].default_value = 0.95
    g = temp_obj([(-400, -400, 0), (400, -400, 0), (400, 400, 0), (-400, 400, 0)], [(0, 1, 2, 3)], 'preview_ground')
    g.data.materials.append(gm)
    return sun


def camera_look(name, pos, target, lens=35.0):
    cd = bpy.data.cameras.new(name)
    cd.lens = lens
    cd.clip_start = 0.1
    cd.clip_end = 2000
    cam = bpy.data.objects.new(name, cd)
    bpy.context.scene.collection.objects.link(cam)
    cam.location = pos
    d = Vector(target) - Vector(pos)
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return cam


def render_to(cam, path):
    sc = bpy.context.scene
    sc.camera = cam
    sc.render.filepath = path
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    log('렌더', os.path.basename(path), '%.1fs' % (time.time() - t0))
