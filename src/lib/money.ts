const formatter = new Intl.NumberFormat("ro-RO", {
  style: "currency",
  currency: "RON",
  minimumFractionDigits: 2
});

export function roundMoney(value: number, precision = 2): number {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function formatMoney(value: number): string {
  // Safeguard against NaN or invalid values
  const numValue = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return formatter.format(roundMoney(numValue));
}

export function parseNumericInput(value: string | number | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (!value) return 0;
  const normalized = String(value).replace(/,/g, ".");
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
}
