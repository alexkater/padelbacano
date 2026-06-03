<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# PádelBacano — Agent Instructions

## Project Context
PádelBacano is a white-label SaaS platform for padel and tennis club management.
- **Stack:** Next.js 16.2 + TypeScript + Tailwind v4 + SQLite/Drizzle + NextAuth v5 + Radix UI
- **Architecture:** Clean architecture (entities → ports → use cases → infra) + feature-flagged modules
- **Repo:** github.com/alexkater/padelbacano
- **37 routes, 24 DB tables, ~8,500 LOC**

## How to Work on This Project

### File Ownership
ALL files are owned by `openclaw-runner`. Use `sudo -u openclaw-runner` for ALL file operations.

### Build First, Commit Later
```bash
cd /Users/openclaw-runner/padelbacano
sudo -u openclaw-runner npx next build  # Must pass before ANY commit
```

### Architecture Rules
- `padelbacano.config.ts` is the SINGLE file that changes per customer deployment
- New features → add entity + port + repo + API route (4 layers)
- Feature flags in `MODULE_FLAGS` within config
- Prices in cents (integers), never floats
- All modules are optional (gated by feature flags)

### Agent Team
This project has 6 specialized AI agents:
- **padelbacano** (orchestrator) → routes tasks to specialists
- **padelbacano-dev** → code implementation, debugging, features
- **padelbacano-sales** → market research, outreach, demos
- **padelbacano-support** → customer onboarding, technical support
- **padelbacano-strategy** → competitive analysis, pricing, market trends
- **padelbacano-content** → white-label customization, copywriting, SEO

When working autonomously, read `SOUL.md` and `IDENTITY.md` first.
