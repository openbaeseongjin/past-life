# ez-tree 잎 카드에 갈아 끼우는 잎 그림을 만든다 (이 스크립트가 그린 것 = 이 저장소의 CC0 그림).
#   python docs/past-life/tools/make_leaf_tex.py  → docs/past-life/assets/real/tex/ea_persimmon_leaf.png
# ez-tree 1.1.0 잎 그림과 같은 꼴: 1024² RGBA, 아래 가운데에서 줄기가 위로 오르고 잎이 어긋나게 달린 잔가지 하나 (알파 = 잎 모양).
#   감나무 (kitdata.js TREES_EA persimmon 의 leafTex): 넓은 달걀꼴 짙은 윤기 잎 아홉 + 주황 감 셋(꼭지 넷 갈래).
# 결정성: 난수 없음 (모든 모양이 식으로 정해진다). 두 배 크기로 그려 2×2 평균으로 줄인다 (가장자리 부드럽게).
import os
import numpy as np
from PIL import Image

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'real', 'tex', 'ea_persimmon_leaf.png')
N = 2048
y, x = np.mgrid[0:N, 0:N].astype(np.float32)
rgb = np.zeros((N, N, 3), np.float32)
alpha = np.zeros((N, N), np.float32)


def put(mask, col):
    m = np.clip(mask, 0, 1)[..., None]
    rgb[:] = rgb * (1 - m) + col * m
    alpha[:] = np.maximum(alpha, m[..., 0])


def stem_at(t):
    """줄기 (t 0 = 아래, 1 = 위): 화소 좌표."""
    return 1024 + 60 * np.sin(t * 2.4) * t, 2040 - 1720 * t


# 줄기
for k in range(400):
    t = k / 399
    cx, cy = stem_at(t)
    r = 9 - 5 * t
    put(((x - cx) ** 2 + (y - cy) ** 2 < r * r).astype(np.float32), np.array([0.32, 0.24, 0.14]))


def leaf(t, ang, L, W, shade=1.0):
    bx, by = stem_at(t)
    ca, sa = np.cos(ang), np.sin(ang)
    dx, dy = x - bx, y - by
    u = dx * ca + dy * sa                     # 잎 축 (잎자루 → 끝)
    v = -dx * sa + dy * ca
    s = np.clip(u / L, 0, 1)
    half = W / 2 * np.sin(np.pi * np.clip(s * 0.92 + 0.04, 0, 1)) ** 0.75 * (1.0 - 0.15 * s)
    inside = (u > 0) & (u < L) & (np.abs(v) < half)
    edge = np.clip((half - np.abs(v)) / 3.0, 0, 1) * inside
    # 색: 밑동 쪽 짙고 끝 쪽 조금 밝게, 가운데 맥 밝게, 잎 반쪽마다 조금 다르게 (윤기 반사)
    base = np.array([0.15, 0.27, 0.08]) * (1 - s[..., None]) + np.array([0.27, 0.42, 0.13]) * s[..., None]
    mid = np.exp(-(v / 5.0) ** 2)[..., None]
    side = np.where(v > 0, 1.08, 0.9)[..., None]
    vein = (np.abs(np.sin((u * 0.6 - np.abs(v) * 0.55) * 0.045)) < 0.12) * (np.abs(v) < half * 0.85)
    col = base * side * shade + mid * np.array([0.12, 0.14, 0.06]) + vein[..., None] * np.array([0.03, 0.04, 0.015])
    m = edge.astype(np.float32)
    rgb[:] = rgb * (1 - m[..., None]) + col * m[..., None]
    np.maximum(alpha, m, out=alpha)
    # 잎자루
    for k in range(30):
        tt = k / 29 * 0.08
        put(((x - (bx + ca * L * tt)) ** 2 + (y - (by + sa * L * tt)) ** 2 < 25).astype(np.float32), np.array([0.3, 0.3, 0.12]))


def fruit(t, off, r):
    bx, by = stem_at(t)
    cx, cy = bx + off[0], by + off[1]
    d2 = (x - cx) ** 2 + ((y - cy) * 1.08) ** 2
    inside = d2 < r * r
    m = np.clip((r - np.sqrt(d2)) / 3.0, 0, 1) * inside
    nz = np.sqrt(np.clip(1 - d2 / (r * r), 0, 1))
    lx, ly = (x - cx) / r, (y - cy) / r
    light = np.clip(0.55 + 0.45 * (-0.5 * lx - 0.6 * ly + 0.62 * nz), 0, 1.2)
    spec = np.clip((-0.45 * lx - 0.55 * ly + 0.7 * nz) - 0.82, 0, 1) * 3.0
    col = np.array([0.88, 0.42, 0.06])[None, None] * light[..., None] + spec[..., None] * np.array([0.3, 0.25, 0.15])
    rgb[:] = rgb * (1 - m[..., None]) + col * m[..., None]
    np.maximum(alpha, m, out=alpha)
    # 꼭지 (네 갈래 초록 갈색) + 꼭지 줄기
    for k in range(4):
        a = k * np.pi / 2 + 0.4
        px, py = cx + np.cos(a) * r * 0.28, cy - r * 0.78 + np.sin(a) * r * 0.12
        put((((x - px) / (r * 0.24)) ** 2 + ((y - py) / (r * 0.1)) ** 2 < 1).astype(np.float32), np.array([0.3, 0.32, 0.12]))
    put(((x - cx) ** 2 + (y - (cy - r * 0.86)) ** 2 < (r * 0.12) ** 2).astype(np.float32), np.array([0.26, 0.2, 0.1]))


# 잎 (아래부터 어긋나게), 감 셋 (잎 사이에 매달림)
specs = [(0.12, -0.75, 300, 190, 0.92), (0.22, 3.95, 330, 210, 1.0), (0.33, -0.9, 350, 220, 0.95), (0.44, 4.1, 360, 225, 1.05),
         (0.55, -1.0, 340, 215, 1.0), (0.66, 4.25, 320, 205, 0.95), (0.76, -1.15, 290, 190, 1.05), (0.85, 4.35, 260, 170, 1.0), (0.94, -1.57, 240, 150, 1.0)]
fruit(0.38, (150, 40), 118)
for spec in specs[:5]:
    leaf(*spec)
fruit(0.6, (-170, 20), 110)
fruit(0.82, (130, 60), 96)
for spec in specs[5:]:
    leaf(*spec)

# 2×2 평균으로 줄인다 (미리 곱한 알파)
pm = rgb * alpha[..., None]
pm = pm.reshape(1024, 2, 1024, 2, 3).mean((1, 3))
al = alpha.reshape(1024, 2, 1024, 2).mean((1, 3))
col = np.where(al[..., None] > 1e-4, pm / np.maximum(al[..., None], 1e-4), np.array([0.2, 0.3, 0.1]))
img = np.concatenate([np.clip(col, 0, 1), al[..., None]], -1)
Image.fromarray((img * 255 + 0.5).astype(np.uint8), 'RGBA').save(OUT, optimize=False)
print('저장', os.path.normpath(OUT))
