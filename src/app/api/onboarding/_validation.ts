import { z } from "zod";

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const NIT_PATTERN = /^\d{3}\.?\d{3}\.?\d{3}-?\d$/;
const COLOMBIA_PHONE_PATTERN = /^\+57[1-9]\d{9}$/;

type ReviewComparableSubmission = {
  readonly step1: unknown;
  readonly step2: unknown;
  readonly step3: unknown;
  readonly step4: unknown;
  readonly step5: unknown;
  readonly step6: {
    readonly profile: unknown;
    readonly courts: unknown;
    readonly pricing: unknown;
    readonly schedule: unknown;
    readonly staff: unknown;
  };
};

export function minutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

const courtSchema = z.object({
  name: z.string().trim().min(1, "Nombre de cancha requerido"),
  sport: z.enum(["padel", "tenis"]),
  surface: z.enum(["glass", "panoramic", "wall"]),
  indoor: z.boolean(),
  lighting: z.boolean(),
});

const pricingEntrySchema = z
  .object({
    courtIndex: z.number().int().min(0),
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(TIME_PATTERN, "Hora de inicio inválida"),
    endTime: z.string().regex(TIME_PATTERN, "Hora de fin inválida"),
    peakPriceCents: z.number().int().positive("Precio pico requerido en centavos"),
    offPeakPriceCents: z.number().int().positive("Precio valle requerido en centavos"),
  })
  .refine((entry) => minutes(entry.startTime) < minutes(entry.endTime), {
    message: "La hora de inicio debe ser anterior a la hora de fin",
    path: ["endTime"],
  });

const profileSchema = z.object({
  clubName: z.string().trim().min(2, "Nombre del club requerido"),
  slug: z.string().trim().toLowerCase().regex(SLUG_PATTERN, "Slug inválido"),
  city: z.string().trim().min(2, "Ciudad requerida"),
  department: z.string().trim().min(2, "Departamento requerido"),
  nit: z.string().trim().regex(NIT_PATTERN, "NIT inválido"),
  contactName: z.string().trim().min(2, "Nombre de contacto requerido"),
  contactPhone: z.string().trim().regex(COLOMBIA_PHONE_PATTERN, "Teléfono debe iniciar con +57"),
  contactEmail: z.email("Email de contacto inválido"),
});

const staffMemberSchema = z.object({
  name: z.string().trim().min(2, "Nombre de staff requerido"),
  role: z.string().trim().min(2, "Rol de staff requerido"),
  email: z.email("Email de staff inválido"),
  phone: z.string().trim().regex(COLOMBIA_PHONE_PATTERN, "Teléfono de staff debe iniciar con +57"),
});

const scheduleSchema = z
  .object({
    openingTime: z.string().regex(TIME_PATTERN, "Hora de apertura inválida"),
    closingTime: z.string().regex(TIME_PATTERN, "Hora de cierre inválida"),
    slotDuration: z.union([z.literal(60), z.literal(90)]),
  })
  .refine((schedule) => minutes(schedule.openingTime) < minutes(schedule.closingTime), {
    message: "La hora de apertura debe ser anterior al cierre",
    path: ["closingTime"],
  });

export const onboardingSubmissionSchema = z
  .object({
    step1: profileSchema,
    step2: z.object({ courts: z.array(courtSchema).min(1, "Agrega al menos una cancha") }),
    step3: z.object({ pricing: z.array(pricingEntrySchema).min(1, "Agrega precios") }),
    step4: scheduleSchema,
    step5: z.object({ staffMembers: z.array(staffMemberSchema) }),
    step6: z.object({
      profile: profileSchema,
      courts: z.object({ courts: z.array(courtSchema).min(1) }),
      pricing: z.object({ pricing: z.array(pricingEntrySchema).min(1) }),
      schedule: scheduleSchema,
      staff: z.object({ staffMembers: z.array(staffMemberSchema) }),
      termsAccepted: z.literal(true, { error: "Debes aceptar términos y condiciones" }),
    }),
  })
  .superRefine((submission, context) => {
    validatePricingCoverage(submission.step2.courts.length, submission.step3.pricing, context);
    validatePricingSchedule(submission.step3.pricing, submission.step4, context);
    validateReviewStep(submission, context);
  });

export type OnboardingSubmissionData = z.infer<typeof onboardingSubmissionSchema>;
export type OnboardingPricingEntry = z.infer<typeof pricingEntrySchema>;

export function validationDetails(error: z.ZodError): { readonly field: string; readonly message: string }[] {
  return error.issues.map((issue) => ({ field: issue.path.map(String).join("."), message: issue.message }));
}

function validatePricingCoverage(
  courtCount: number,
  pricing: readonly OnboardingPricingEntry[],
  context: z.RefinementCtx
): void {
  for (let courtIndex = 0; courtIndex < courtCount; courtIndex += 1) {
    for (const weekday of WEEKDAYS) {
      const hasPrice = pricing.some((entry) => entry.courtIndex === courtIndex && entry.dayOfWeek === weekday);
      if (!hasPrice) {
        context.addIssue({
          code: "custom",
          path: ["step3", "pricing"],
          message: `Falta precio para cancha ${courtIndex + 1}, día ${weekday}`,
        });
      }
    }
  }
}

function validatePricingSchedule(
  pricing: readonly OnboardingPricingEntry[],
  schedule: { readonly openingTime: string; readonly closingTime: string },
  context: z.RefinementCtx
): void {
  const opening = minutes(schedule.openingTime);
  const closing = minutes(schedule.closingTime);
  pricing.forEach((entry, index) => {
    if (minutes(entry.startTime) < opening || minutes(entry.endTime) > closing) {
      context.addIssue({
        code: "custom",
        path: ["step3", "pricing", index],
        message: "El precio debe estar dentro del horario del club",
      });
    }
  });
}

function validateReviewStep(submission: ReviewComparableSubmission, context: z.RefinementCtx): void {
  const mirrorsSubmission =
    JSON.stringify(submission.step6.profile) === JSON.stringify(submission.step1) &&
    JSON.stringify(submission.step6.courts) === JSON.stringify(submission.step2) &&
    JSON.stringify(submission.step6.pricing) === JSON.stringify(submission.step3) &&
    JSON.stringify(submission.step6.schedule) === JSON.stringify(submission.step4) &&
    JSON.stringify(submission.step6.staff) === JSON.stringify(submission.step5);

  if (!mirrorsSubmission) {
    context.addIssue({ code: "custom", path: ["step6"], message: "La revisión no coincide con los pasos anteriores" });
  }
}
