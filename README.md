# PádelBacano 🏓

Plataforma white-label de gestión para clubes de pádel y tenis.
Soluciones a medida para clubes en Colombia y España.

## Stack
Next.js 16.2 + TypeScript + Tailwind CSS v4 + SQLite (Drizzle ORM) + NextAuth v5 + Radix UI

## Quick Start
```bash
npm install
cp .env.example .env.local  # Configure auth + payment keys
npm run seed                 # Creates demo DB with 2 clubs
npm run dev                  # http://localhost:3000
```

## Architecture
```
src/
├── padelbacano.config.ts   ← ONE file per customer deployment
├── core/                   ← Domain (entities, ports, use cases)
├── infra/                  ← Implementations (DB, auth, email, repos)
├── modules/                ← Feature-flagged modules
│   ├── social/             ← Partner board, announcements, open matches
│   └── payments/           ← PSE, Nequi, Daviplata, credit card, cash
├── app/
│   ├── (club)/             ← Public club pages
│   ├── admin/              ← Admin panel
│   └── api/                ← REST API (37 routes)
└── middleware.ts            ← Auth protection
```

## Modules (Feature Flags)
| Module | Flag | Description |
|--------|------|-------------|
| Social | `social` | Partner board, announcements, open matches |
| Payments | `payments` | PSE, Nequi, Daviplata, credit card, cash |
| Tournaments | `tournaments` | Single elim, round robin, americano, mexicano |
| Analytics | `analytics` | Revenue, occupancy, KPIs, charts |
| Invoicing | `invoicing` | DIAN e-invoicing, CUFE, PDF, IVA 19% |
| School | `school` | Coaches, classes, courses, enrollments |
| Loyalty | `loyalty` | Points, rewards (coming soon) |

## Selling to a New Club
1. Edit `padelbacano.config.ts` (name, colors, domain, modules)
2. `npm run seed`
3. AI personalizes content and images
4. Deploy to Vercel → `club.mogambo.xyz`
5. Estimated time: 15-30 min with AI

## AI Agents
This project is managed by a team of 6 specialized AI agents:
- **padelbacano** — orchestrator
- **padelbacano-dev** — development
- **padelbacano-sales** — sales & outreach
- **padelbacano-support** — customer onboarding
- **padelbacano-strategy** — market research & strategy
- **padelbacano-content** — white-label customization
