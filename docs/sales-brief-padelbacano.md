# PádelBacano — Brief de Ventas

## ¿Qué es PádelBacano?

Plataforma marketplace de pádel y tenis para Colombia. Conecta jugadores con clubes: los jugadores encuentran y reservan canchas, los clubes gestionan sus operaciones. Competidor directo de Playtomic en el mercado colombiano.

**Una sola plataforma. Dos caras:**

| Para jugadores | Para clubes |
|---|---|
| Buscar canchas por ciudad, fecha, precio | Gestionar reservas, canchas, precios |
| Reservar en 3 clics | Recibir pagos (fase 2) |
| Ver disponibilidad en tiempo real | Panel de analytics (ocupación, ingresos) |
| Torneos con brackets visuales | Torneos con brackets automatizados |
| App instalable (PWA) | Facturación electrónica DIAN-ready |
| Notificaciones por email y WhatsApp | Onboarding self-serve (sin papeleo) |

---

## Mercado

- **233+ clubes** de pádel en Colombia (53 ciudades)
- **39.5% crecimiento** del mercado
- Precios pico: **COP 120.000** por cancha
- **Bogotá**: 70 clubes | **Antioquia**: 42 | **Valle**: 20+
- **687 canchas** a nivel nacional (y creciendo)

---

## Ventajas competitivas vs Playtomic

| PádelBacano | Playtomic |
|---|---|
| 🇨🇴 100% Colombia (COP, COT, es-CO) | Genérico, sin adaptación local |
| 🆓 **Gratis para clubes** (v1) | 4 tiers de pago, precios quote-based |
| 📱 PWA instalable (sin app store) | App nativa + web |
| 🎨 Diseño moderno, simple, rápido | UX recargado, quejas de bugs |
| 🧾 DIAN-ready (PDF + XML UBL 2.1) | Sin facturación electrónica |
| 🏓 Torneos con bracket visual | Torneos limitados |
| 📊 Analytics en tiempo real | Analytics premium |

---

## Funcionalidades clave

### Para jugadores
- **Búsqueda inteligente**: ciudad, fecha, hora, tipo de cancha, precio, indoor/outdoor
- **Reserva en 3 pasos**: elegir cancha → confirmar → listo
- **Disponibilidad en tiempo real**: evita conflictos de doble reserva
- **Mis reservas**: historial, cancelación con política clara
- **Torneos**: single elimination y round robin con brackets visuales
- **Notificaciones**: email y WhatsApp para confirmaciones y recordatorios
- **App instalable**: funciona offline, notificaciones push

### Para clubes
- **Onboarding self-serve**: wizard de 6 pasos, sin tocar código
- **Panel admin**: dashboard, reservas, canchas, calendario
- **Gestión de precios**: tarifas por día/hora, peak/off-peak
- **Control de mantenimiento**: bloquear canchas por reparación
- **Facturación**: PDF profesional + XML DIAN-ready (UBL 2.1)
- **Analytics**: ocupación, ingresos, top canchas, jugadores activos
- **Torneos**: creación, inscripción, bracket automático
- **Multi-club**: mismo admin puede gestionar varias sedes

---

## Modelo de negocio

| Fase | Modelo | Timing |
|---|---|---|
| **V1 (ahora)** | **Gratis** — capturar clubes y jugadores | Lanzamiento inmediato |
| **V2** | Comisión por reserva o suscripción mensual | 3-6 meses post-lanzamiento |

**Estrategia**: primero audiencia, luego monetización. Mismo modelo que Playtomic usó en Europa.

---

## Tecnología

- **Stack**: Next.js 16, PostgreSQL, TypeScript, Tailwind CSS
- **PWA**: funciona en iOS, Android y desktop sin instalar nada
- **Escalable**: arquitectura multi-tenant, preparada para 500+ clubes
- **Seguridad**: autenticación con Google, roles (admin/jugador), tenant isolation
- **Open source**: el club puede auditar el código si quiere

---

## Pitch de 30 segundos

> "PádelBacano es el marketplace de pádel para Colombia. Como Playtomic, pero 100% local: precios en pesos, horarios de Bogotá, facturación electrónica lista para la DIAN. Los jugadores encuentran y reservan canchas en segundos. Los clubes gestionan todo desde un panel simple y profesional. **Y en el lanzamiento, es completamente gratis para los clubes.**"

---

## Lo que necesita un club para empezar

1. Entrar a `padelbacano.com/onboarding`
2. Llenar 6 pasos (nombre, canchas, precios, horarios, staff)
3. Esperar aprobación (24-48h)
4. **Listo.** Sus canchas aparecen en el marketplace nacional.

**Tiempo total: 10 minutos.**

---

## Preguntas frecuentes de ventas

**"¿Por qué gratis?"**
Estamos en fase de crecimiento. Queremos que los mejores clubes de Colombia estén en la plataforma antes de monetizar.

**"¿Y mis datos?"**
Cada club tiene su propio tenant aislado. Tus datos son tuyos. No compartimos información entre clubes.

**"¿Qué pasa si ya uso Playtomic?"**
Puedes tener ambos. Pero en PádelBacano los jugadores colombianos te encuentran más fácil, pagas en COP, y tienes facturación DIAN-ready que Playtomic no ofrece.

**"¿Tienen app?"**
Es una PWA: se instala en el teléfono como una app normal, funciona offline, recibe notificaciones push. Sin pasar por App Store o Play Store.

**"¿Soporte?"**
Soporte por email y WhatsApp. Tiempo de respuesta: mismo día hábil.

---

## Contacto

- **Web**: [padelbacano.com](https://padelbacano.com)
- **Email**: hola@padelbacano.com
- **WhatsApp**: +57 (contacto por definir)

---

*Última actualización: junio 2026. Versión para equipo de ventas.*
