# 실사 시험 장면(look-real)용 CC0 텍스처를 Poly Haven 에서 1K JPG 로 받는다.
# 사용: python tools/fetch_real.py   (이미 있는 파일은 건너뛴다)
# 사람 모델(assets/real/people/*.glb)은 Quaternius itch.io CC0 묶음으로 tools/blender/kit_clothes.py 가 짓는다 — SOURCES.md 참고.
import os, sys, urllib.request

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'real', 'tex')
# 이름: 받을 맵 (diff=색, nor_gl=노멀(OpenGL), arm=AO·거칠기·금속)
SETS = {
    'leafy_grass': ['diff', 'nor_gl'],        # 풀밭
    'farm_soil': ['diff', 'nor_gl'],          # 갈아엎은 밭
    'withered_grass': ['diff'],               # 밀밭·마른 풀 (금빛으로 물들여 씀)
    'brown_mud_dry': ['diff', 'nor_gl'],      # 흙길
    'river_small_rocks': ['diff'],            # 강바닥·물가
    'rustic_stone_wall': ['diff', 'nor_gl', 'arm'],   # 오두막·대장간·다리 막돌
    'castle_wall_slates': ['diff', 'nor_gl', 'arm'],  # 교회 돌
    'grey_plaster': ['diff', 'nor_gl'],       # 석회 회벽 (크림색으로 물들임)
    'old_planks_02': ['diff', 'nor_gl'],      # 기둥·보·문
    'thatch_roof_angled': ['diff', 'nor_gl', 'arm'],  # 초가 지붕
    'roof_slates_02': ['diff', 'nor_gl', 'arm'],      # 교회·대장간 슬레이트
    # ── Blender 건물 세트(tools/blender/kit_england.py)용 ──
    'reed_roof_04': ['diff', 'nor_gl'],       # 세트 초가 (위 띠를 잘라 이어 붙여 씀)
    'rough_wood': ['diff', 'nor_gl'],         # 세트 목골조 기둥·보 (어둡게 물들임)
    'white_rough_plaster': ['diff', 'nor_gl'],  # 세트 석회 회벽
    'clay_plaster': ['diff', 'nor_gl'],       # 세트 욋가지 흙벽(wattle & daub)
    'cobblestone_02': ['diff', 'nor_gl'],     # 세트 자갈 바닥(대장간·우물·교회 현관)
    'rough_linen': ['diff', 'nor_gl'],        # 세트 장터 천막 (줄무늬로 물들임)
    # ── Blender 소품 세트(tools/blender/kit_props.py)용 ──
    'bark_brown_02': ['diff', 'nor_gl'],      # 장작·통나무 껍질
    'stacked_stone_wall': ['diff', 'nor_gl'], # 막쌓은 돌담 (2 m 조각)
    'wool_boucle': ['nor_gl'],                # 양털 결 (노멀만: 색 그림은 체크 무늬라 안 씀)
    # ── Blender 사람 옷 세트(tools/blender/kit_clothes.py)용 ──
    'caban': ['diff', 'nor_gl'],              # 축융한 모직(튜닉·치마·두건·망토)의 결
    'brown_leather': ['albedo', 'nor_gl'],    # 가죽(신·허리띠·대장장이 앞치마)의 주름 (이 자산은 색 맵 이름이 albedo)
    # ── 남아시아 세트(tools/blender/kit_southasia.py · kit_props_southasia.py · kit_trees_southasia.py)용 ──
    'patterned_clay_plaster': ['diff', 'nor_gl'],     # 흙벽 바름 (맨흙·석회칠 흙집·안뜰집)
    'red_brick_plaster_patch_02': ['diff', 'nor_gl'], # 옛 벽돌 + 군데군데 석회 (두 층 읍내 집·곳간 기단)
    'sandstone_blocks_08': ['diff', 'nor_gl'],        # 사암 마름돌 (사원·가트 계단·우물 둘레)
    'clay_roof_tiles_02': ['diff', 'nor_gl'],         # 반원 기와 (읍내 집 차양)
    'bamboo_wall': ['diff', 'nor_gl'],                # 대나무 (툇마루 기둥·울·장대)
    'palm_tree_bark': ['diff', 'nor_gl'],             # 야자 줄기 (코코넛·빈랑)
    # ── 동아시아 세트(tools/blender/kit_eastasia.py · kit_props_eastasia.py)용 ──
    'grey_roof_tiles': ['diff', 'nor_gl'],            # 기와 풍화 결 (만든 골기와 무늬에 섞는다)
    'brick_wall_11': ['diff', 'nor_gl'],              # 가는 벽돌 (회색으로 물들여 중국 청벽돌)
    'japanese_stone_wall': ['diff', 'nor_gl'],        # 다듬은 돌 (기단·주춧돌·석탑 기단)
    'clay_block_wall': ['diff', 'nor_gl'],            # 다진 흙벽 (중국 판축 흙집·흙담)
    'weathered_plank_siding': ['diff', 'nor_gl'],     # 비바람 맞은 널벽 (일본 민가 판벽)
    'broken_wall': ['diff', 'nor_gl'],                # 막돌 (한국 돌담·굴뚝)
    'hinoki_planks': ['diff', 'nor_gl'],              # 밝은 마루널 (툇마루·엔가와·평상)
}
EXTRA = {
    # three.js 예제 물결 노멀 (MIT, three.js 저장소)
    'waternormals.jpg': 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/waternormals.jpg',
}

def get(url, dst):
    if os.path.exists(dst) and os.path.getsize(dst) > 0:
        return False
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as r, open(dst, 'wb') as f:
        f.write(r.read())
    return True

n = 0
for name, maps in SETS.items():
    for m in maps:
        url = f'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/{name}/{name}_{m}_1k.jpg'
        if get(url, os.path.join(ROOT, f'{name}_{m}_1k.jpg')):
            n += 1; print('받음', name, m)
for fn, url in EXTRA.items():
    if get(url, os.path.join(ROOT, fn)):
        n += 1; print('받음', fn)
print('새로 받은 파일', n, '개 →', os.path.normpath(ROOT))
