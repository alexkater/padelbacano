// ─── Onboarding entity types ────────────────────────────────────────────────
// DTOs para el wizard de onboarding self-serve de clubes (6 pasos).
// Todos los precios en centavos COP (enteros), nunca floats.
// Domain context: registro de nuevos clubes en el marketplace Colombia-wide.

// ─── Step 1: Perfil del club ────────────────────────────────────────────────

export type OnboardingStep1 = {
  /** Nombre comercial del club */
  clubName: string;
  /** Slug único para URL (ej. "club-bogota") */
  slug: string;
  /** Ciudad del club */
  city: string;
  /** Departamento (ej. "Cundinamarca", "Antioquia") */
  department: string;
  /** NIT colombiano (ej. "901.123.456-7") */
  nit: string;
  /** Nombre del contacto principal */
  contactName: string;
  /** Teléfono del contacto (+57 Colombia) */
  contactPhone: string;
  /** Email del contacto */
  contactEmail: string;
};

// ─── Step 2: Canchas ────────────────────────────────────────────────────────

export type OnboardingCourt = {
  /** Nombre de la cancha (ej. "Cancha 1", "Central") */
  name: string;
  /** Deporte: padel o tenis */
  sport: "padel" | "tenis";
  /** Tipo de superficie (glass, panoramic, wall) */
  surface: string;
  /** Indoor (true) o outdoor (false) */
  indoor: boolean;
  /** ¿Tiene iluminación para juego nocturno? */
  lighting: boolean;
};

export type OnboardingStep2 = {
  /** Lista de canchas del club */
  courts: OnboardingCourt[];
};

// ─── Step 3: Precios ────────────────────────────────────────────────────────

export type OnboardingPricingEntry = {
  /** ID de la cancha (referencia al array de Step 2) */
  courtIndex: number;
  /** Día de la semana (0=domingo, 1=lunes, ..., 6=sábado) */
  dayOfWeek: number;
  /** Hora de inicio del rango (HH:mm, 24h) */
  startTime: string;
  /** Hora de fin del rango (HH:mm, 24h) */
  endTime: string;
  /** Precio hora punta en centavos COP */
  peakPriceCents: number;
  /** Precio hora valle en centavos COP */
  offPeakPriceCents: number;
};

export type OnboardingStep3 = {
  /** Configuración de precios por cancha/día/rango */
  pricing: OnboardingPricingEntry[];
};

// ─── Step 4: Horarios ───────────────────────────────────────────────────────

export type OnboardingStep4 = {
  /** Hora de apertura (HH:mm, 24h) */
  openingTime: string;
  /** Hora de cierre (HH:mm, 24h) */
  closingTime: string;
  /** Duración del slot en minutos (60 o 90) */
  slotDuration: 60 | 90;
};

// ─── Step 5: Staff ──────────────────────────────────────────────────────────

export type OnboardingStaffMember = {
  /** Nombre del miembro del staff */
  name: string;
  /** Rol (ej. "admin", "coach", "receptionist") */
  role: string;
  /** Email del staff */
  email: string;
  /** Teléfono del staff (+57 Colombia) */
  phone: string;
};

export type OnboardingStep5 = {
  /** Lista de miembros del staff */
  staffMembers: OnboardingStaffMember[];
};

// ─── Step 6: Revisión ───────────────────────────────────────────────────────

export type OnboardingStep6 = {
  /** Resumen del paso 1 (perfil) */
  profile: OnboardingStep1;
  /** Resumen del paso 2 (canchas) */
  courts: OnboardingStep2;
  /** Resumen del paso 3 (precios) */
  pricing: OnboardingStep3;
  /** Resumen del paso 4 (horarios) */
  schedule: OnboardingStep4;
  /** Resumen del paso 5 (staff) */
  staff: OnboardingStep5;
  /** Aceptación de términos y condiciones */
  termsAccepted: boolean;
};

// ─── Submission ─────────────────────────────────────────────────────────────

export type OnboardingSubmission = {
  /** Paso 1: Perfil del club */
  step1: OnboardingStep1;
  /** Paso 2: Canchas */
  step2: OnboardingStep2;
  /** Paso 3: Precios */
  step3: OnboardingStep3;
  /** Paso 4: Horarios */
  step4: OnboardingStep4;
  /** Paso 5: Staff */
  step5: OnboardingStep5;
  /** Paso 6: Revisión y confirmación */
  step6: OnboardingStep6;
};

// ─── Status & Response ──────────────────────────────────────────────────────

export type OnboardingStatus = "pending_approval" | "approved" | "rejected";

export type OnboardingResponse = {
  /** ID del club creado (solo si status=approved) */
  clubId: string | null;
  /** Estado actual de la solicitud */
  status: OnboardingStatus;
  /** Mensaje informativo para el usuario */
  message: string;
};
