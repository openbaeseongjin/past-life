# 「한 영혼의 여정」을 보내기 쉬운 HTML 파일 하나로 묶는다 (우리 모듈 전부). three.js·애드온·ez-tree 와 글꼴은 인터넷(importmap), 3D 세트(assets/real)는 그 파일 옆 assets/ 에서 받는다
# 사용: python build_share.py [--out 폴더]
#   기본 -> ../../전생시뮬_공유/플레이/pastlife-play.html (카톡용) + ../share/pastlife-play-artifact.html (웹 링크용)
#   --out 폴더 -> 그 폴더에 pastlife-play.html · pastlife-play-artifact.html (공유 파일을 덮지 않고 시험할 때)
# 모듈 차례는 main.js 에서 import 를 따라가며 저절로 정한다 (앞 모듈이 뒤 모듈을 쓰지 않게). 예전처럼 손으로 적은 ORDER 가 모자라 깨지지 않게
import base64, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
read = lambda *p: open(os.path.join(HERE, *p), encoding='utf-8').read()

OURS = re.compile(r"^import \{([^}]*)\} from '\./(\w+)\.js';\s*$", re.M)
THREE = "import * as THREE from 'three';"
# 우리 모듈이 아닌 정적 import (three 애드온 등): 묶음 맨 위로 올린다 (importmap 이 푼다)
BARE = re.compile(r"^import [^;]*? from '(?!\./)[^']+';\s*$", re.M)


def order_from(entry):
    out, seen = [], set()

    def visit(name, path):
        if name in out:
            return
        assert name not in seen, '돌고 도는 import: ' + ' → '.join(path + [name])
        seen.add(name)
        for dep in OURS.findall(read(name + '.js')):
            visit(dep[1], path + [name])
        out.append(name)
    visit(entry, [])
    return out[:-1]   # main 은 맨 끝에 따로


ORDER = order_from('main')
hoisted = []


def convert(src):
    src = src.replace(THREE + '\n', '').replace(THREE, '')
    for line in BARE.finditer(src):
        s = line.group(0).strip()
        if s not in hoisted:
            hoisted.append(s)
    src = BARE.sub('', src)
    assert not re.search(r"^import .* from '(?!\./)", src, re.M), 'unexpected import'
    # import { t as tr } → const { t: tr } (구조 분해에서는 as 대신 :)
    return OURS.sub(lambda m: f"const {{{re.sub(r'(\w+)\s+as\s+(\w+)', r'\1: \2', m.group(1))}}} = __{m.group(2)};", src)


for k, name in enumerate(ORDER + ['main']):
    for dep in OURS.findall(read(name + '.js')):
        assert dep[1] in ORDER[:k], f'{name}.js 가 쓰는 {dep[1]}.js 가 ORDER 에 없거나 뒤에 있다'

parts = []
for name in ORDER:
    body = convert(read(name + '.js'))
    names = re.findall(r'^export (?:async )?(?:function|const|let|class) (\w+)', body, re.M)
    body = re.sub(r'^export ', '', body, flags=re.M)
    assert 'export ' not in re.sub(r'//.*', '', body), name
    parts.append(f"// ----- {name}.js -----\nconst __{name} = (() => {{\n{body}\nreturn {{ {', '.join(names)} }};\n}})();\n")
main_js = convert(read('main.js'))
# 같은 이름을 두 번 들여오면 모듈이 서지 않는다 (예: 두 모듈이 GLTFLoader 를 따로 import)
seen_names = {}
for s in hoisted:
    for n in re.findall(r'\{([^}]*)\}', s)[:1]:
        for x in n.split(','):
            x = x.strip().split(' as ')[-1].strip()
            if x:
                assert x not in seen_names or seen_names[x] == s, f'같은 이름 {x} 를 두 곳에서 들여온다: {seen_names[x]} / {s}'
                seen_names[x] = s
bundle = THREE + '\n' + '\n'.join(hoisted) + '\n' + '\n'.join(parts) + '// ----- main.js -----\n' + main_js

html = read('index.html')
src_tag = '<script type="module" src="./main.js"></script>'
assert src_tag in html
tag = ''
if 'assets' in ORDER:   # 옛 KayKit 육각 섬(assets.js)을 쓰면 hex.glb 를 base64 로 싣는다
    hexb = base64.b64encode(open(os.path.join(HERE, 'assets', 'hex.glb'), 'rb').read()).decode('ascii')
    tag = '<script>window.__HEX = ' + json.dumps(hexb) + ';</script>\n'
html = html.replace(src_tag, tag + '<script type="module">\n' + bundle.replace('</script>', '<\\/script>') + '</script>')

args = sys.argv[1:]
out_dir = args[args.index('--out') + 1] if '--out' in args else None
out1 = os.path.join(out_dir, 'pastlife-play.html') if out_dir else os.path.join(ROOT, '전생시뮬_공유', '플레이', 'pastlife-play.html')
os.makedirs(os.path.dirname(out1), exist_ok=True)
open(out1, 'w', encoding='utf-8', newline='\n').write(html)
print(out1, round(os.path.getsize(out1) / 1024), 'KB', '·', len(ORDER), 'modules')

# 웹 링크(Artifact)용: 바깥 틀과 charset·viewport 메타는 게시할 때 씌워지므로 뺀다. <title> 은 맨 앞으로
art = html
for t in ['<!doctype html>', '<html lang="ko">', '<head>', '</head>', '<body>', '</body>', '</html>', '<meta charset="utf-8">',
          '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">']:
    assert t in art, t
    art = art.replace(t, '', 1)
title = re.search(r'<title>.*?</title>\n?', art).group(0)
art = '<title>한 영혼의 여정</title>\n' + art.replace(title, '', 1).strip() + '\n'
out2 = os.path.join(out_dir, 'pastlife-play-artifact.html') if out_dir else os.path.join(ROOT, 'docs', 'share', 'pastlife-play-artifact.html')
open(out2, 'w', encoding='utf-8', newline='\n').write(art)
print(out2, round(os.path.getsize(out2) / 1024), 'KB')
