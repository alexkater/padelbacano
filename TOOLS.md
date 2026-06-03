# TOOLS.md — Herramientas y Configuración de PádelBacano

## Infraestructura
- **Hosting:** Vercel (preview/staging) + Hetzner (producción)
- **Base de datos:** SQLite por instancia (data/padel.db)
- **Auth:** NextAuth v5 con Google OAuth + credentials
- **Email:** SMTP (configurable por cliente)

## Dominios
- **Demo/Staging:** padelbacano.vercel.app
- **Producción por cliente:** [club].mogambo.xyz o dominio propio

## APIs y Servicios
- **Pagos Colombia:** PSE vía ePayco/PayU/Wompi, Nequi vía Bancolombia Connect
- **Facturación DIAN:** XML estándar UBL 2.1, numeración consecutiva
- **Mapas:** Google Maps (link en contacto del club)

## Comandos frecuentes
```bash
# Desarrollo
cd /Users/openclaw-runner/padelbacano
sudo -u openclaw-runner npx next dev -p 3001

# Build
sudo -u openclaw-runner npx next build

# Seed
sudo -u openclaw-runner node --require node_modules/tsx/dist/cli.mjs seed.ts

# SQLite queries
sudo -u openclaw-runner sqlite3 data/padel.db "SELECT * FROM clubs"

# Git
sudo -u openclaw-runner git -C /Users/openclaw-runner/padelbacano status
sudo -u openclaw-runner git -C /Users/openclaw-runner/padelbacano push origin main
```

## Variables de entorno (.env.local)
```
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_SECRET=
SMTP_HOST=
SMTP_PORT=
SMTP_FROM=
PSE_API_KEY=
NEQUI_API_KEY=
CARD_API_KEY=
DATABASE_URL=
```

## Skills del proyecto
- **task-runner:** Iniciar tareas de desarrollo desde tickets
- **swift-concurrency:** Diagnóstico de concurrencia (si hay componente iOS)
- **fleet-manager:** Gestión de múltiples despliegues por cliente
- **find-skills:** Descubrir nuevos skills útiles
