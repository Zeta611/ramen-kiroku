# 🍜 Ramen Kiroku

My public ramen logs... 😋

## Development

```bash
# Install dependencies
bun install

# Start dev server (Next.js + Convex)
bun dev
bunx convex dev  # in a separate terminal, when editing convex/

# Type check
bun typecheck

# Lint / format
bun lint
bun format
```

### AI agent skills

Skills are symlinked from `.agents/` and are not committed. Restore them from `skills-lock.json`:

```bash
./install-skills.sh
```
