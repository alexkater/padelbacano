const COT_OFFSET_MINUTES = -5 * 60;
const MILLISECONDS_PER_MINUTE = 60_000;

const pad2 = (value: number): string => value.toString().padStart(2, "0");

export const COT_TIME_ZONE = "America/Bogota";
export const COT_OFFSET = "-05:00";

export function toCOT(date: Date): Date {
  return new Date(date.getTime() + COT_OFFSET_MINUTES * MILLISECONDS_PER_MINUTE);
}

export function formatCOT(date: Date, format: string): string {
  const cotDate = toCOT(date);
  return format
    .replaceAll("yyyy", cotDate.getUTCFullYear().toString())
    .replaceAll("MM", pad2(cotDate.getUTCMonth() + 1))
    .replaceAll("dd", pad2(cotDate.getUTCDate()))
    .replaceAll("HH", pad2(cotDate.getUTCHours()))
    .replaceAll("mm", pad2(cotDate.getUTCMinutes()))
    .replaceAll("ss", pad2(cotDate.getUTCSeconds()));
}

export function cotNow(): Date {
  return toCOT(new Date());
}

export function isTodayCOT(date: Date): boolean {
  return formatCOT(date, "yyyy-MM-dd") === formatCOT(new Date(), "yyyy-MM-dd");
}

export function weekdayCOT(date: Date): number {
  return toCOT(date).getUTCDay();
}
