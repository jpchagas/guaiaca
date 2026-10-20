const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const compactFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export const MONTHS_SHORT = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function formatCurrency(value) {
  return currencyFormatter.format(Number(value) || 0);
}

export function formatCurrencyCompact(value) {
  return compactFormatter.format(Number(value) || 0);
}

/**
 * Accepts Firestore Timestamps, Dates and legacy strings.
 * "YYYY-MM-DD" strings are read as local noon so they don't shift a day.
 */
export function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d, 12);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isInMonth(value, month, year) {
  const d = toDate(value);
  return !!d && d.getMonth() === month && d.getFullYear() === year;
}

export function toDateInputValue(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const dayFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** "Hoje", "Ontem" or "seg., 12 de out." */
export function formatDayLabel(value) {
  const d = toDate(value);
  if (!d) return "Sem data";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (sameDay(d, today)) return "Hoje";
  if (sameDay(d, yesterday)) return "Ontem";

  const label = dayFormatter.format(d);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "12 de out." */
export function formatShortDate(value) {
  const d = toDate(value);
  return d ? shortDateFormatter.format(d) : "—";
}

/** Parses user input like "1.234,56", "1234.56" or "12,5" into a number. */
export function parseAmountInput(value) {
  if (typeof value === "number") return value;
  const raw = String(value || "").replace(/[^\d.,]/g, "");
  if (!raw) return NaN;

  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;

  return Number(normalized);
}

/** Formats a stored number for an editable input: 1234.5 → "1234,50" */
export function toAmountInput(value) {
  const n = Number(value);
  if (!n) return "";
  return n.toFixed(2).replace(".", ",");
}

export function getInitials(name, email) {
  const source = (name || email || "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 1).toUpperCase();
}

export function getFirstName(name, email) {
  if (name) return name.trim().split(/\s+/)[0];
  if (email) return email.split("@")[0];
  return "";
}

export const CLASSIFICATION_LABELS = {
  revenue: "Receita",
  expense: "Despesa",
  investment: "Investimento",
};

export const METHOD_LABELS = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  transfer: "Transferência",
  cash: "Dinheiro",
};
