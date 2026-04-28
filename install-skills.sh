#!/bin/bash
set -e
cd "$(dirname "$0")"
bunx skills experimental_install
mkdir -p .claude/skills skills
for skill in .agents/skills/*/; do
  name="$(basename "$skill")"
  ln -sfn "../.agents/skills/$name" "skills/$name"
  ln -sfn "../../.agents/skills/$name" ".claude/skills/$name"
done
