# 남아시아 마을 미리보기 꾸밈 — kit_southasia.py 의 미리보기(내보낸 뒤)에서만 부른다. 내보내는 glb 에는 들어가지 않는다.
# 소품·가축(kit_props_southasia.py)과 야자·바나나·대나무·풀(kit_trees_southasia.py)을 같은 장면에 지어 마을 한 모퉁이처럼 늘어놓는다.
# 넓은잎 나무(반얀·망고·님 …)는 장면에서 ez-tree 로 짓는 것이라 여기 없다 (tools/trees_preview.html 미리보기).
import math
import kit_props_southasia as PS
import kit_trees_southasia as TS

# (조각, x, y, 돌림) — 길은 x 방향 y = 0, 남쪽 집은 앞(+y)이 길을 본다
PLACE = [
    ('cart_bullock', -10.6, -3.0, 0.25), ('cow_zebu', -16.2, -2.6, -0.5), ('buffalo', -6.6, -3.6, 2.7), ('goat', -1.6, -4.0, 0.9), ('goat', -0.6, -4.8, 2.2),
    ('chicken', 3.6, -1.8, 2.0), ('chicken', 4.1, -2.4, 0.4), ('charpai', -4.6, -3.7, 0.08), ('water_pot', -7.3, 2.6, 0.0), ('lota', -7.75, 2.2, 0.0),
    ('haystack_sa', -18.5, -10.5, 0.0), ('dung_cakes', -11.0, -9.8, 0.0), ('basket_sa', 2.9, 1.7, 0.2), ('sacks_sa', -1.3, 4.6, 0.3),
    ('chulha', -1.1, -5.6, 3.3), ('trough_sa', -14.6, -2.0, 0.1), ('loom', 12.6, 2.2, 0.15),
    ('fence_bamboo', -19.0, -3.6, 0.0), ('fence_bamboo', -17.0, -3.6, 0.0), ('wall_mud', 10.0, -3.6, 0.0), ('wall_mud', 12.0, -3.6, 0.0), ('wall_mud', 14.0, -3.6, 0.0),
    ('palm_coconut', -21.0, 4.5, 0.4), ('palm_coconut', -17.5, 8.5, 2.1), ('palm_coconut', 22.0, -4.0, 1.0), ('palm_areca', 13.5, -2.4, 0.0), ('palm_areca', 15.0, -2.0, 1.3),
    ('banana', -0.6, -9.2, 0.6), ('banana', -7.4, -12.0, 1.9), ('bamboo_clump', -24.0, -6.0, 0.0), ('grass_tall', -19.0, 1.2, 0.0), ('grass_tall', 4.8, 5.8, 1.0),
    ('grass_dry', 2.0, -3.2, 0.0),
]


def populate(by_buildings):
    """소품·식생 재료를 만들고 PLACE 대로 지어 놓는다. 돌려주는 것: 새로 만든 뿌리 노드들 (미리보기 뒤 숨긴다)."""
    PS.setup_materials()
    TS.setup_materials()
    builders = {b.__name__: b for b in PS.BUILDERS + TS.BUILDERS}
    out = []
    for name, x, y, rz in PLACE:
        P = builders[name]()
        root = P.finish()
        root.location = (x, y, 0.0)
        root.rotation_euler = (0.0, 0.0, rz)
        out.append(root)
        out += list(root.children_recursive)
    return out
