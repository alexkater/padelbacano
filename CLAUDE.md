# PádelBacano — Claude/Agent Quick Reference

@AGENTS.md

## Key Paths
- Config: `src/padelbacano.config.ts`
- Schema: `src/infra/db/schema.ts`
- Seed: `seed.ts`
- DB: `data/padel.db`
- Repos: `src/infra/db/repositories/`
- API: `src/app/api/`
- Modules: `src/modules/`

## One-Command Build & Verify
```bash
cd /Users/openclaw-runner/padelbacano && sudo -u openclaw-runner npx next build
```

## One-Command Seed
```bash
cd /Users/openclaw-runner/padelbacano && sudo -u openclaw-runner rm -f data/padel.db* && sudo -u openclaw-runner node --require node_modules/tsx/dist/cli.mjs seed.ts
```

## Git Operations
```bash
sudo -u openclaw-runner git -C /Users/openclaw-runner/padelbacano <cmd>
```
