"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import { useMemo, useState, type ChangeEvent, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from "react";
import type {
  OnboardingCourt,
  OnboardingPricingEntry,
  OnboardingStaffMember,
  OnboardingSubmission,
} from "@/core/entities";

const steps = ["Perfil", "Canchas", "Precios", "Horarios", "Staff", "Revisión"] as const;
const inputClass = "min-h-11 w-full rounded-[var(--pb-radius-md)] border border-[var(--pb-border-strong)] bg-[var(--pb-surface-primary)] px-[var(--pb-space-3)] py-[var(--pb-space-2)] text-[length:var(--pb-text-body-sm)] text-[var(--pb-text-primary)] outline-none transition focus:border-[var(--pb-brand-primary)] focus:shadow-[var(--pb-ring-focus)]";
const selectClass = `${inputClass} appearance-none`;
const cardClass = "rounded-[var(--pb-radius-xl)] border border-[var(--pb-border-subtle)] bg-[var(--pb-surface-primary)] p-[var(--pb-space-6)] shadow-[var(--pb-shadow-card)]";
const primaryButton = "min-h-11 rounded-[var(--pb-radius-md)] bg-[var(--pb-brand-primary)] px-[var(--pb-space-5)] text-[var(--pb-brand-foreground)] transition hover:bg-[var(--pb-brand-hover)] focus-visible:shadow-[var(--pb-ring-focus)] disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButton = "min-h-11 rounded-[var(--pb-radius-md)] border border-[var(--pb-border-strong)] px-[var(--pb-space-5)] text-[var(--pb-text-primary)] transition hover:bg-[var(--pb-surface-secondary)] focus-visible:shadow-[var(--pb-ring-focus)] disabled:cursor-not-allowed disabled:opacity-60";

type FormState = Omit<OnboardingSubmission, "step6"> & { readonly termsAccepted: boolean };

const initialCourt: OnboardingCourt = { name: "Cancha 1", sport: "padel", surface: "Panorámica", indoor: false, lighting: true };
const initialStaff: OnboardingStaffMember = { name: "", role: "Administrador", email: "", phone: "+57 " };

const initialState: FormState = {
  step1: { clubName: "", slug: "", city: "", department: "", nit: "", contactName: "", contactPhone: "+57 ", contactEmail: "" },
  step2: { courts: [initialCourt] },
  step3: { pricing: [{ courtIndex: 0, dayOfWeek: 1, startTime: "06:00", endTime: "22:00", peakPriceCents: 12000000, offPeakPriceCents: 8000000 }] },
  step4: { openingTime: "06:00", closingTime: "22:00", slotDuration: 60 },
  step5: { staffMembers: [initialStaff] },
  termsAccepted: false,
};

function slugify(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").replace(/^57/, "").slice(0, 10);
  return `+57 ${digits.slice(0, 3)}${digits.length > 3 ? ` ${digits.slice(3, 6)}` : ""}${digits.length > 6 ? ` ${digits.slice(6)}` : ""}`.trimEnd();
}

function pesosToCents(value: string): number {
  return Number.parseInt(value.replace(/\D/g, "") || "0", 10) * 100;
}

function centsToPesos(value: number): string {
  return String(Math.round(value / 100));
}

function validEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function stepValid(step: number, form: FormState): boolean {
  if (step === 0) return Object.values(form.step1).every((value) => value.trim().length > 0) && validEmail(form.step1.contactEmail);
  if (step === 1) return form.step2.courts.length > 0 && form.step2.courts.every((court) => court.name.trim().length > 0 && court.surface.trim().length > 0);
  if (step === 2) return form.step3.pricing.every((price) => price.peakPriceCents > 0 && price.offPeakPriceCents > 0);
  if (step === 3) return form.step4.openingTime < form.step4.closingTime;
  if (step === 4) return form.step5.staffMembers.every((member) => member.name.trim() && member.role.trim() && validEmail(member.email));
  return form.termsAccepted;
}

function Field(props: { readonly id: string; readonly label: string; readonly children: ReactNode }) {
  return <div className="grid gap-[var(--pb-space-2)]"><LabelPrimitive.Root htmlFor={props.id} className="text-[length:var(--pb-text-body-sm)] font-semibold text-[var(--pb-text-primary)]">{props.label}</LabelPrimitive.Root>{props.children}</div>;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const progress = `${Math.round(((step + 1) / steps.length) * 100)}%`;

  const payload = useMemo<OnboardingSubmission>(() => ({
    step1: form.step1,
    step2: form.step2,
    step3: form.step3,
    step4: form.step4,
    step5: form.step5,
    step6: { profile: form.step1, courts: form.step2, pricing: form.step3, schedule: form.step4, staff: form.step5, termsAccepted: form.termsAccepted },
  }), [form]);

  function updateProfile(field: keyof FormState["step1"], value: string): void {
    setForm((current) => ({ ...current, step1: { ...current.step1, [field]: value, slug: field === "clubName" ? slugify(value) : current.step1.slug } }));
  }

  function updateCourt(index: number, patch: Partial<OnboardingCourt>): void {
    setForm((current) => ({ ...current, step2: { courts: current.step2.courts.map((court, courtIndex) => courtIndex === index ? { ...court, ...patch } : court) } }));
  }

  function updatePricing(index: number, patch: Partial<OnboardingPricingEntry>): void {
    setForm((current) => ({ ...current, step3: { pricing: current.step3.pricing.map((price, priceIndex) => priceIndex === index ? { ...price, ...patch } : price) } }));
  }

  function updateStaff(index: number, patch: Partial<OnboardingStaffMember>): void {
    setForm((current) => ({ ...current, step5: { staffMembers: current.step5.staffMembers.map((member, memberIndex) => memberIndex === index ? { ...member, ...patch } : member) } }));
  }

  function addCourt(): void {
    setForm((current) => {
      const nextIndex = current.step2.courts.length;
      return { ...current, step2: { courts: [...current.step2.courts, { ...initialCourt, name: `Cancha ${nextIndex + 1}` }] }, step3: { pricing: [...current.step3.pricing, { courtIndex: nextIndex, dayOfWeek: 1, startTime: "06:00", endTime: "22:00", peakPriceCents: 12000000, offPeakPriceCents: 8000000 }] } };
    });
  }

  function removeCourt(index: number): void {
    setForm((current) => ({ ...current, step2: { courts: current.step2.courts.filter((_, courtIndex) => courtIndex !== index) }, step3: { pricing: current.step3.pricing.filter((price) => price.courtIndex !== index).map((price) => ({ ...price, courtIndex: price.courtIndex > index ? price.courtIndex - 1 : price.courtIndex })) } }));
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage("");
    if (step < steps.length - 1) { setStep((current) => current + 1); return; }
    setSubmitting(true);
    try {
      const response = await fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      setMessage(response.ok ? "¡Club creado! Pendiente de aprobación." : "No pudimos enviar la solicitud. Intenta de nuevo.");
    } catch (error) {
      if (error instanceof Error) setMessage("Error de conexión. Revisa tu internet e intenta de nuevo.");
      else throw error;
    } finally {
      setSubmitting(false);
    }
  }

  return <main className="min-h-[100dvh] bg-[var(--pb-surface-canvas)] px-[var(--pb-space-4)] py-[var(--pb-space-10)] text-[var(--pb-text-primary)]">
    <section className="mx-auto grid max-w-[var(--pb-layout-max)] gap-[var(--pb-space-8)]">
      <header className="grid gap-[var(--pb-space-3)]"><p className="text-[length:var(--pb-text-overline)] font-bold uppercase tracking-[0.11em] text-[var(--pb-energy-clay)]">Clubes PádelBacano</p><h1 className="text-[length:var(--pb-text-h1)] font-bold leading-none tracking-[-0.025em]">Registra tu club</h1><p className="max-w-3xl text-[length:var(--pb-text-body-lg)] text-[var(--pb-text-secondary)]">Completa seis pasos para entrar al marketplace nacional. Conservamos tu avance mientras revisas canchas, precios, horarios y staff antes de enviar.</p></header>
      <form onSubmit={submit} className={cardClass}>
        <nav aria-label="Progreso de onboarding" className="grid gap-[var(--pb-space-4)]"><div className="h-[var(--pb-space-2)] overflow-hidden rounded-[var(--pb-radius-full)] bg-[var(--pb-surface-secondary)]"><div className="h-full rounded-[var(--pb-radius-full)] bg-[var(--pb-brand-primary)] transition-[width] duration-[var(--pb-motion-standard)]" style={{ width: progress }} /></div><ol className="grid grid-cols-2 gap-[var(--pb-space-2)] md:grid-cols-6">{steps.map((label, index) => <li key={label} className={`rounded-[var(--pb-radius-sm)] border px-[var(--pb-space-2)] py-[var(--pb-space-2)] text-center text-[length:var(--pb-text-caption)] font-bold ${index === step ? "border-[var(--pb-brand-primary)] bg-[var(--pb-surface-secondary)] text-[var(--pb-brand-primary)]" : "border-[var(--pb-border-subtle)] text-[var(--pb-text-secondary)]"}`}>{index + 1}. {label}</li>)}</ol></nav>
        <div className="mt-[var(--pb-space-8)] grid gap-[var(--pb-space-6)]">{step === 0 && <ProfileStep form={form} updateProfile={updateProfile} />}{step === 1 && <CourtsStep courts={form.step2.courts} addCourt={addCourt} removeCourt={removeCourt} updateCourt={updateCourt} />}{step === 2 && <PricingStep courts={form.step2.courts} pricing={form.step3.pricing} updatePricing={updatePricing} />}{step === 3 && <ScheduleStep form={form} setForm={setForm} />}{step === 4 && <StaffStep members={form.step5.staffMembers} setForm={setForm} updateStaff={updateStaff} />}{step === 5 && <ReviewStep payload={payload} termsAccepted={form.termsAccepted} setForm={setForm} />}</div>
        {message && <p className={`mt-[var(--pb-space-6)] rounded-[var(--pb-radius-md)] border px-[var(--pb-space-4)] py-[var(--pb-space-3)] text-[length:var(--pb-text-body-sm)] ${message.startsWith("¡") ? "border-[var(--pb-status-success)] text-[var(--pb-status-success)]" : "border-[var(--pb-status-error)] text-[var(--pb-status-error)]"}`}>{message}</p>}
        <div className="mt-[var(--pb-space-8)] flex flex-col-reverse gap-[var(--pb-space-3)] sm:flex-row sm:justify-between"><button className={secondaryButton} type="button" disabled={step === 0 || submitting} onClick={() => setStep((current) => current - 1)}>Anterior</button><button className={primaryButton} type="submit" disabled={!stepValid(step, form) || submitting}>{step === steps.length - 1 ? (submitting ? "Enviando solicitud" : "Enviar solicitud") : "Siguiente"}</button></div>
      </form>
    </section>
  </main>;
}

function ProfileStep({ form, updateProfile }: { readonly form: FormState; readonly updateProfile: (field: keyof FormState["step1"], value: string) => void }) {
  const fields: readonly (readonly [keyof FormState["step1"], string, string])[] = [["clubName", "Nombre del club", "Club Central"], ["slug", "Slug público", "club-central"], ["city", "Ciudad", "Bogotá"], ["department", "Departamento", "Cundinamarca"], ["nit", "NIT", "901.123.456-7"], ["contactName", "Contacto", "María Pérez"], ["contactPhone", "Teléfono +57", "+57 300 123 4567"], ["contactEmail", "Email", "club@correo.com"]];
  return <section className="grid gap-[var(--pb-space-4)] md:grid-cols-2">{fields.map(([field, label, placeholder]) => <Field key={field} id={field} label={label}><input id={field} className={inputClass} value={form.step1[field]} placeholder={placeholder} type={field === "contactEmail" ? "email" : "text"} onChange={(event) => updateProfile(field, field === "contactPhone" ? maskPhone(event.target.value) : event.target.value)} readOnly={field === "slug"} required /></Field>)}</section>;
}

function CourtsStep(props: { readonly courts: readonly OnboardingCourt[]; readonly addCourt: () => void; readonly removeCourt: (index: number) => void; readonly updateCourt: (index: number, patch: Partial<OnboardingCourt>) => void }) {
  return <section className="grid gap-[var(--pb-space-4)]">{props.courts.map((court, index) => <div key={`${court.name}-${index}`} className="grid gap-[var(--pb-space-3)] rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] p-[var(--pb-space-4)] md:grid-cols-5"><Field id={`court-name-${index}`} label="Nombre"><input className={inputClass} id={`court-name-${index}`} value={court.name} onChange={(event) => props.updateCourt(index, { name: event.target.value })} /></Field><Field id={`sport-${index}`} label="Deporte"><select id={`sport-${index}`} className={selectClass} value={court.sport} onChange={(event: ChangeEvent<HTMLSelectElement>) => props.updateCourt(index, { sport: event.target.value === "tenis" ? "tenis" : "padel" })}><option value="padel">Pádel</option><option value="tenis">Tenis</option></select></Field><Field id={`surface-${index}`} label="Superficie"><input className={inputClass} id={`surface-${index}`} value={court.surface} onChange={(event) => props.updateCourt(index, { surface: event.target.value })} /></Field><label className="flex items-center gap-[var(--pb-space-2)] text-[length:var(--pb-text-body-sm)]"><input type="checkbox" checked={court.indoor} onChange={(event) => props.updateCourt(index, { indoor: event.target.checked })} /> Indoor</label><label className="flex items-center gap-[var(--pb-space-2)] text-[length:var(--pb-text-body-sm)]"><input type="checkbox" checked={court.lighting} onChange={(event) => props.updateCourt(index, { lighting: event.target.checked })} /> Iluminación</label><button type="button" className={secondaryButton} onClick={() => props.removeCourt(index)} disabled={props.courts.length === 1}>Quitar</button></div>)}<button type="button" className={secondaryButton} onClick={props.addCourt}>Agregar cancha</button></section>;
}

function PricingStep({ courts, pricing, updatePricing }: { readonly courts: readonly OnboardingCourt[]; readonly pricing: readonly OnboardingPricingEntry[]; readonly updatePricing: (index: number, patch: Partial<OnboardingPricingEntry>) => void }) {
  return <section className="grid gap-[var(--pb-space-4)]">{pricing.map((price, index) => <div key={`${price.courtIndex}-${index}`} className="grid gap-[var(--pb-space-3)] rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] p-[var(--pb-space-4)] md:grid-cols-4"><p className="font-semibold text-[var(--pb-text-primary)]">{courts[price.courtIndex]?.name ?? "Cancha"}</p><Field id={`peak-${index}`} label="Punta COP"><input id={`peak-${index}`} className={inputClass} inputMode="numeric" value={centsToPesos(price.peakPriceCents)} onChange={(event) => updatePricing(index, { peakPriceCents: pesosToCents(event.target.value) })} /></Field><Field id={`off-${index}`} label="Valle COP"><input id={`off-${index}`} className={inputClass} inputMode="numeric" value={centsToPesos(price.offPeakPriceCents)} onChange={(event) => updatePricing(index, { offPeakPriceCents: pesosToCents(event.target.value) })} /></Field><Field id={`day-${index}`} label="Día"><select id={`day-${index}`} className={selectClass} value={price.dayOfWeek} onChange={(event) => updatePricing(index, { dayOfWeek: Number(event.target.value) })}><option value={1}>Lunes a viernes</option><option value={6}>Sábado</option><option value={0}>Domingo</option></select></Field></div>)}</section>;
}

function ScheduleStep({ form, setForm }: { readonly form: FormState; readonly setForm: Dispatch<SetStateAction<FormState>> }) {
  return <section className="grid gap-[var(--pb-space-4)] md:grid-cols-3"><Field id="opening" label="Apertura"><input id="opening" type="time" className={inputClass} value={form.step4.openingTime} onChange={(event) => setForm((current) => ({ ...current, step4: { ...current.step4, openingTime: event.target.value } }))} /></Field><Field id="closing" label="Cierre"><input id="closing" type="time" className={inputClass} value={form.step4.closingTime} onChange={(event) => setForm((current) => ({ ...current, step4: { ...current.step4, closingTime: event.target.value } }))} /></Field><Field id="duration" label="Duración"><select id="duration" className={selectClass} value={form.step4.slotDuration} onChange={(event) => setForm((current) => ({ ...current, step4: { ...current.step4, slotDuration: event.target.value === "90" ? 90 : 60 } }))}><option value={60}>60 minutos</option><option value={90}>90 minutos</option></select></Field></section>;
}

function StaffStep(props: { readonly members: readonly OnboardingStaffMember[]; readonly setForm: Dispatch<SetStateAction<FormState>>; readonly updateStaff: (index: number, patch: Partial<OnboardingStaffMember>) => void }) {
  return <section className="grid gap-[var(--pb-space-4)]">{props.members.map((member, index) => <div key={`${member.role}-${index}`} className="grid gap-[var(--pb-space-3)] rounded-[var(--pb-radius-lg)] border border-[var(--pb-border-subtle)] p-[var(--pb-space-4)] md:grid-cols-4"><Field id={`staff-name-${index}`} label="Nombre"><input id={`staff-name-${index}`} className={inputClass} value={member.name} onChange={(event) => props.updateStaff(index, { name: event.target.value })} /></Field><Field id={`staff-role-${index}`} label="Rol"><input id={`staff-role-${index}`} className={inputClass} value={member.role} onChange={(event) => props.updateStaff(index, { role: event.target.value })} /></Field><Field id={`staff-email-${index}`} label="Email"><input id={`staff-email-${index}`} type="email" className={inputClass} value={member.email} onChange={(event) => props.updateStaff(index, { email: event.target.value })} /></Field><Field id={`staff-phone-${index}`} label="Teléfono"><input id={`staff-phone-${index}`} className={inputClass} value={member.phone} onChange={(event) => props.updateStaff(index, { phone: maskPhone(event.target.value) })} /></Field></div>)}<button type="button" className={secondaryButton} onClick={() => props.setForm((current) => ({ ...current, step5: { staffMembers: [...current.step5.staffMembers, initialStaff] } }))}>Agregar staff</button></section>;
}

function ReviewStep({ payload, termsAccepted, setForm }: { readonly payload: OnboardingSubmission; readonly termsAccepted: boolean; readonly setForm: Dispatch<SetStateAction<FormState>> }) {
  return <section className="grid gap-[var(--pb-space-4)]"><div className="grid gap-[var(--pb-space-3)] text-[length:var(--pb-text-body-sm)] text-[var(--pb-text-secondary)]"><p><strong className="text-[var(--pb-text-primary)]">Club:</strong> {payload.step1.clubName} en {payload.step1.city}, {payload.step1.department}</p><p><strong className="text-[var(--pb-text-primary)]">Contacto:</strong> {payload.step1.contactName}, {payload.step1.contactPhone}, {payload.step1.contactEmail}</p><p><strong className="text-[var(--pb-text-primary)]">Canchas:</strong> {payload.step2.courts.map((court) => `${court.name} (${court.sport})`).join(", ")}</p><p><strong className="text-[var(--pb-text-primary)]">Horario:</strong> {payload.step4.openingTime} a {payload.step4.closingTime}, slots de {payload.step4.slotDuration} minutos COT</p><p><strong className="text-[var(--pb-text-primary)]">Staff:</strong> {payload.step5.staffMembers.map((member) => `${member.name} - ${member.role}`).join(", ")}</p><p className="rounded-[var(--pb-radius-md)] border border-[var(--pb-status-warning)] p-[var(--pb-space-3)] text-[var(--pb-status-warning)]">Estado al enviar: pendiente de aprobación por PádelBacano.</p></div><label className="flex items-start gap-[var(--pb-space-2)] text-[length:var(--pb-text-body-sm)]"><input type="checkbox" checked={termsAccepted} onChange={(event) => setForm((current) => ({ ...current, termsAccepted: event.target.checked }))} /> Acepto términos, política de datos y contacto por WhatsApp para validar la solicitud.</label></section>;
}
