# KayKit Medieval Hexagon Pack 1.0 (CC0) 에서 쓰는 파일만 받는다 → assets/src/<원래 하위 폴더>/ (저장소에는 안 넣는다)
import json, os, urllib.request

BASE = 'https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Medieval-Hexagon-Pack-1.0/main/addons/kaykit_medieval_hexagon_pack/Assets/gltf/'
FILES = {
    'tiles/base': ['hex_grass', 'hex_water'],
    'tiles/roads': ['hex_road_A'],
    'tiles/rivers': ['hex_river_A'],
    'decoration/nature': ['tree_single_A', 'tree_single_B', 'rock_single_A', 'rock_single_C'],
    'decoration/props': ['barrel', 'sack', 'crate_A_big'],
    'buildings/yellow': ['building_home_A_yellow', 'building_home_B_yellow', 'building_church_yellow', 'building_well_yellow',
                         'building_market_yellow', 'building_windmill_yellow'],
}
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'src')

def get(url, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if not os.path.exists(path):
        urllib.request.urlretrieve(url, path)

for folder, names in FILES.items():
    for n in names:
        gltf = os.path.join(OUT, folder, n + '.gltf')
        get(BASE + folder + '/' + n + '.gltf', gltf)
        d = json.load(open(gltf, encoding='utf-8'))
        for u in [b['uri'] for b in d.get('buffers', [])] + [i['uri'] for i in d.get('images', [])]:
            get(BASE + folder + '/' + u, os.path.join(OUT, folder, u))
print('받음:', sum(len(v) for v in FILES.values()), '개')
