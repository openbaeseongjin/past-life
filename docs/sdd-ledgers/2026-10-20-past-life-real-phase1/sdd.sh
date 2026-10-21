#!/usr/bin/env bash
# git 없이 쓰는 SDD 도우미 (실사 1단계): snap NAME (docs/past-life + tools/blender, assets·node_modules·.omc 빼고), pkg A B, brief N
set -euo pipefail
WS=/d/Users/admin/Desktop/indigame/.superpowers/sdd/2026-10-20-past-life-real-phase1
SRC=/d/Users/admin/Desktop/indigame/docs/past-life
TB=/d/Users/admin/Desktop/indigame/tools/blender
PLAN=/d/Users/admin/Desktop/indigame/docs/superpowers/plans/2026-10-20-past-life-real-phase1.md
SK="/c/Users/admin/.claude/plugins/cache/claude-plugins-official/superpowers/6.2.0/skills/subagent-driven-development/scripts"
case "$1" in
  snap) D="$WS/snap-$2"; rm -rf "$D"; mkdir -p "$D/tools_blender"; cp -r "$SRC/." "$D/"; rm -rf "$D/assets" "$D/node_modules" "$D/.omc"; if [ -d "$TB" ]; then cp -r "$TB/." "$D/tools_blender/"; fi; (cd "$SRC" && find assets -type f -printf '%s %p\n' 2>/dev/null | sort -k2 > "$D/ASSETS.txt" || true); echo "snap-$2: $(find "$D" -type f | wc -l) files";;
  pkg) out="$WS/review-$2..$3.diff"; { echo "# Review package: snapshot $2 -> $3 (docs/past-life + tools/blender; binary assets listed in ASSETS.txt only)"; echo; echo "## Files changed"; (cd "$WS" && diff -rqN -x node_modules "snap-$2" "snap-$3" || true); echo; echo "## Diff"; (cd "$WS" && diff -ruN -U8 -x node_modules "snap-$2" "snap-$3" || true); } > "$out"; echo "wrote $out: $(wc -c < "$out") bytes";;
  brief) bash "$SK/task-brief" "$PLAN" "$2" "$WS/task-$2-brief.md";;
esac
