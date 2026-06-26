import { expect, type APIRequestContext, test } from "@playwright/test";
import { z } from "zod";

const MARKETPLACE_DATE = "2026-10-01";
const KNOWN_CITY = "Bogotá";
const VERIFIED_CITY = "Medellín";

const searchClubSchema = z.object({
  city: z.string(),
  courtCount: z.number(),
  id: z.string(),
  isVerified: z.boolean(),
  minPriceCents: z.number(),
  name: z.string(),
  slug: z.string(),
});

const pageInfoSchema = z.object({
  hasNextPage: z.boolean(),
  page: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

const searchResponseSchema = z.object({
  data: z.object({
    pageInfo: pageInfoSchema,
    results: z.array(searchClubSchema),
    total: z.number(),
  }),
  success: z.literal(true),
});

const availabilityResponseSchema = z.object({
  data: z.array(z.object({
    courtId: z.string(),
    slots: z.array(z.object({
      courtId: z.string(),
      endTime: z.string(),
      isAvailable: z.boolean(),
      priceInCents: z.number(),
      startTime: z.string(),
    })),
  })),
  success: z.literal(true),
});

type SearchClub = z.infer<typeof searchClubSchema>;

async function searchClubs(request: APIRequestContext, city: string, limit = 12) {
  const params = new URLSearchParams({ city, date: MARKETPLACE_DATE, limit: String(limit) });
  const response = await request.get(`/api/marketplace/search?${params.toString()}`);
  expect(response.status()).toBe(200);
  return searchResponseSchema.parse(await response.json()).data;
}

async function knownClub(request: APIRequestContext): Promise<SearchClub> {
  const result = await searchClubs(request, KNOWN_CITY, 1);
  expect(result.results.length).toBeGreaterThan(0);
  const [club] = result.results;
  expect(club).toBeDefined();
  return club;
}

async function verifiedClub(request: APIRequestContext): Promise<SearchClub> {
  const result = await searchClubs(request, VERIFIED_CITY, 12);
  const club = result.results.find((candidate) => candidate.isVerified) ?? result.results[0];
  expect(club).toBeDefined();
  expect(club.isVerified).toBe(true);
  return club;
}

test.describe("Suite 2: Marketplace search UI", () => {
  test("search page loads with hero text and form", async ({ page }) => {
    await page.goto("/buscar");
    await expect(page.getByRole("heading", { name: /encuentra tu partido de pádel en colombia/i })).toBeVisible();
    await expect(page.getByText("Buscar disponibilidad")).toBeVisible();
    await expect(page.getByLabel("Ciudad")).toBeVisible();
    await expect(page.getByLabel("Fecha")).toBeVisible();
    await expect(page.getByRole("button", { name: /buscar canchas/i })).toBeVisible();
  });

  test("search with valid city and date redirects to results", async ({ page }) => {
    await page.goto("/buscar");
    await page.getByLabel("Ciudad").fill(KNOWN_CITY);
    await page.getByLabel("Fecha").fill(MARKETPLACE_DATE);
    await page.getByRole("button", { name: /buscar canchas/i }).click();
    await page.waitForURL(/\/buscar\/resultados\?/, { waitUntil: "commit" });
    await expect(page).toHaveURL(/city=Bogot%C3%A1/);
    await expect(page.getByRole("heading", { name: /clubes disponibles en bogotá/i })).toBeVisible();
  });

  test("search without city shows validation error", async ({ page }) => {
    await page.goto("/buscar");
    await page.getByLabel("Ciudad").fill("");
    await page.getByLabel("Fecha").fill(MARKETPLACE_DATE);
    await page.getByRole("button", { name: /buscar canchas/i }).click();
    await expect(page.getByText("Elige una ciudad para buscar canchas.")).toBeVisible();
    await expect(page).toHaveURL(/\/buscar$/);
  });

  test("advanced filters submit indoor court type and price range", async ({ page }) => {
    await page.goto("/buscar");
    await page.getByLabel("Ciudad").fill(KNOWN_CITY);
    await page.getByLabel("Fecha").fill(MARKETPLACE_DATE);
    await page.getByText("Más filtros").click();
    await page.getByLabel("Precio mínimo COP").fill("60000");
    await page.getByLabel("Precio máximo COP").fill("160000");
    await page.getByLabel("Tipo de cancha").click();
    await page.getByRole("option", { name: "Cristal" }).click();
    await page.getByLabel("Cubierta").click();
    await page.getByRole("option", { name: "Indoor", exact: true }).click();
    await page.getByRole("button", { name: /buscar canchas/i }).click();
    await page.waitForURL(/\/buscar\/resultados\?/, { waitUntil: "commit" });
    await expect(page).toHaveURL(/courtType=glass/);
    await expect(page).toHaveURL(/indoor=true/);
    await expect(page).toHaveURL(/priceMin=6000000/);
    await expect(page).toHaveURL(/priceMax=16000000/);
  });
});

test.describe("Suite 2: Marketplace results", () => {
  test("results page shows club cards for known city", async ({ page }) => {
    await page.goto(`/buscar/resultados?city=${encodeURIComponent(KNOWN_CITY)}&date=${MARKETPLACE_DATE}`);
    await expect(page.getByRole("heading", { name: /clubes disponibles en bogotá/i })).toBeVisible();
    await expect(page.getByText(/clubes encontrados/i)).toBeVisible({ timeout: 10000 });
    await expect(page.locator('a[href^="/clubes/"]').first()).toBeVisible();
    await expect(page.getByText("Canchas").first()).toBeVisible();
    await expect(page.getByText("Precio").first()).toBeVisible();
  });

  test("search with unknown city shows empty state", async ({ page }) => {
    await page.goto(`/buscar/resultados?city=CiudadInexistenteT19&date=${MARKETPLACE_DATE}`);
    await expect(page.getByText(/no encontramos clubes en ciudadinexistentet19/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("link", { name: /volver al buscador/i })).toBeVisible();
  });

  test("verified badge visible on verified club results", async ({ page, request }) => {
    const club = await verifiedClub(request);
    await page.goto(`/buscar/resultados?city=${encodeURIComponent(club.city)}&date=${MARKETPLACE_DATE}`);
    await expect(page.getByRole("link", { name: `Ver detalle de ${club.name}` })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Club verificado").first()).toBeVisible();
  });

  test("pagination works for major city when more than 20 results exist", async ({ page, request }) => {
    const result = await searchClubs(request, KNOWN_CITY, 12);
    expect(result.total).toBeGreaterThan(20);
    expect(result.pageInfo.hasNextPage).toBe(true);
    await page.goto(`/buscar/resultados?city=${encodeURIComponent(KNOWN_CITY)}&date=${MARKETPLACE_DATE}`);
    await expect(page.getByText(/clubes encontrados/i)).toBeVisible({ timeout: 10000 });
    const pageTwo = page.getByRole("link", { name: "2", exact: true });
    if (result.pageInfo.totalPages > 3) {
      await pageTwo.click();
      await expect(page).toHaveURL(/page=2/);
      await expect(page.locator('a[aria-current="page"]')).toHaveText("2");
    } else {
      await page.getByRole("button", { name: /ver más/i }).click();
      await expect(page.locator('a[href^="/clubes/"]')).toHaveCount(24, { timeout: 10000 });
    }
  });
});

test.describe("Suite 2: Marketplace club detail and availability", () => {
  test("club detail page loads via seeded slug", async ({ page, request }) => {
    const club = await knownClub(request);
    await page.goto(`/clubes/${club.slug}`);
    await expect(page.getByRole("heading", { name: club.name })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(`${club.city}, Colombia`)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Canchas" })).toBeVisible();
  });

  test("club detail shows courts and pricing", async ({ page, request }) => {
    const club = await knownClub(request);
    await page.goto(`/clubes/${club.slug}`);
    await expect(page.getByText(/cancha 1/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/precios/i).first()).toBeVisible();
    await expect(page.getByText(/lun-vie horario valle/i)).toBeVisible();
    await expect(page.getByText(/COP/i).first()).toBeVisible();
  });

  test("availability API returns slots for known club and date", async ({ request }) => {
    const club = await knownClub(request);
    const response = await request.get(`/api/marketplace/availability?clubId=${club.id}&date=${MARKETPLACE_DATE}`);
    expect(response.status()).toBe(200);
    const body = availabilityResponseSchema.parse(await response.json());
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.some((court) => court.slots.length > 0)).toBe(true);
    expect(body.data.flatMap((court) => court.slots).some((slot) => slot.isAvailable)).toBe(true);
  });
});

test.describe("Suite 2: Marketplace mobile", () => {
  test("mobile viewport renders search and results correctly", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/buscar");
    await expect(page.getByRole("heading", { name: /encuentra tu partido/i })).toBeVisible();
    await expect(page.getByLabel("Ciudad")).toBeVisible();
    await page.goto(`/buscar/resultados?city=${encodeURIComponent(KNOWN_CITY)}&date=${MARKETPLACE_DATE}`);
    await expect(page.getByRole("heading", { name: /clubes disponibles en bogotá/i })).toBeVisible();
    await expect(page.locator('a[href^="/clubes/"]').first()).toBeVisible({ timeout: 10000 });
  });
});
