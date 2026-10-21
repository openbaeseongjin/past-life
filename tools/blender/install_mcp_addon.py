# Blender 안에서 돌린다: blender-mcp 애드온(공식 저장소 addon.py, v1.8)을 설치·켜고 사용자 설정을 저장한다.
# 사용: blender --background --python tools/blender/install_mcp_addon.py -- <addon.py 경로>
import sys
import bpy

path = sys.argv[sys.argv.index('--') + 1]
bpy.ops.preferences.addon_install(filepath=path, overwrite=True)
bpy.ops.preferences.addon_enable(module='blender_mcp_addon')
bpy.ops.wm.save_userpref()
print('BLENDER_MCP_ADDON_ENABLED', 'blender_mcp_addon' in bpy.context.preferences.addons)
