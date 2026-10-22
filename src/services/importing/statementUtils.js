/**
 * Shared helpers for credit card statement parsers.
 *
 * Parsers work on "token text": every text item pdf.js returns, in content
 * order, one per line (see pdfText.js). Regexes use the `m` flag so `^`/`$`
 * anchor on item boundaries.
 */

export const AMOUNT = String.raw`[\d.]+,\d{2}`;

const MONTHS = {
  jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6,
  jul: 7, ago: 8, set: 9, out: 10, nov: 11, dez: 12,
};

const stripAccents = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/**
 * "1.234,56" → 1234.56. A leading "-", "−" (U+2212) or "(-)", or a trailing
 * "-" ("63,90-", mainframe style), makes it negative.
 */
export function parseBRL(raw) {
  const str = String(raw);
  const digits = str.match(/[\d.]+,\d{2}/);
  if (!digits) return NaN;
  const value = Number(digits[0].replace(/\./g, "").replace(",", "."));
  const negative =
    /[-−]/.test(str.slice(0, digits.index)) ||
    /^\s*-/.test(str.slice(digits.index + digits[0].length));
  return negative ? -value : value;
}

/** "Set", "SET", "set", "Setembro", "março" → 9 / 3. Numbers pass through. */
export function parseMonth(value) {
  if (/^\d+$/.test(value)) return Number(value);
  return MONTHS[stripAccents(value).toLowerCase().slice(0, 3)] || null;
}

/**
 * Statements print purchase dates without a year. Anything after the
 * reference month (due date / issue date) belongs to the previous year,
 * which also covers installments bought many months earlier.
 */
export function resolveDate(day, month, ref) {
  const m = parseMonth(month);
  const d = Number(day);
  if (!m || !d || !ref) return null;
  const year = m > ref.month ? ref.year - 1 : ref.year;
  return `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Builds { year, month } from regex captures; two-digit years are 20xx. */
export function toRef(month, year) {
  const m = parseMonth(month);
  let y = Number(year);
  if (y < 100) y += 2000;
  return m && y ? { year: y, month: m } : null;
}

export function toISODate(day, month, year) {
  const ref = toRef(month, year);
  if (!ref) return null;
  return `${ref.year}-${String(ref.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Pulls an installment marker off the end of a description, if valid. */
export function splitInstallment(description, pattern) {
  const match = description.match(pattern);
  if (match) {
    const current = Number(match[1]);
    const total = Number(match[2]);
    if (total >= 2 && current >= 1 && current <= total) {
      return {
        description: description.slice(0, match.index).trim(),
        installment: { current, total },
      };
    }
  }
  return { description, installment: null };
}

export const cleanText = (s) => s.replace(/\s+/g, " ").trim();

/** Bill payments and carried-over balances aren't spending, so they're skipped. */
const BILL_SETTLEMENT = /^(pagamento|pagto\b|pgto\b|inclus[aã]o de pagamento|saldo anterior|saldo restante)/i;
export const isBillSettlement = (description) => BILL_SETTLEMENT.test(description);

/** Sums every capture of `pattern` (first group is an amount). */
export function sumAmounts(text, pattern) {
  const matches = [...text.matchAll(pattern)];
  if (!matches.length) return null;
  return round2(matches.reduce((s, m) => s + parseBRL(m[1]), 0));
}

/** First amount found after `label`. */
export function amountAfter(text, label) {
  const i = text.indexOf(label);
  if (i < 0) return null;
  const match = text.slice(i + label.length).match(/[-−]?\s?(?:R\$\s?)?[\d.]+,\d{2}/);
  return match ? parseBRL(match[0]) : null;
}

export const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Runs `regex` over the text in order, handing each match's groups to
 * `handle` with a state object it can use to carry context (current date,
 * section, running balance…) between matches. Non-null returns are collected.
 */
export function scan(text, regex, handle) {
  const rows = [];
  const state = {};
  for (const match of text.matchAll(regex)) {
    const row = handle(match.groups, state);
    if (row) rows.push(row);
  }
  return rows;
}

/**
 * Card statements: matches with a `holder` group start a new card section;
 * the rest are handed to `toTransaction` along with the current section.
 */
export function scanSections(text, regex, toTransaction) {
  return scan(text, regex, (g, state) => {
    if (g.holder) {
      state.section = { holder: cleanText(g.holder), last4: g.last4 || null };
      return null;
    }
    return toTransaction(g, state.section || { holder: null, last4: null });
  });
}

/**
 * Card statement row: positive amount, settlement rows dropped,
 * negatives (refunds/chargebacks) flagged as credits.
 */
export function buildTransaction({ date, description, amount, installment, section, credit = false }) {
  const clean = cleanText(description);
  if (!date || !clean || !Number.isFinite(amount) || isBillSettlement(clean)) return null;

  return {
    date,
    description: clean,
    amount: Math.abs(amount),
    type: credit || amount < 0 ? "credit" : "expense",
    installment,
    holder: section.holder,
    cardLast4: section.last4,
  };
}

/** Paying a card bill from checking would double count the card's purchases. */
const CARD_BILL_PAYMENT = /pagamento de fatura|pgto\.? fat|fatura do cart[aã]o|gastos cart[aã]o de cr[eé]dito/i;

/**
 * Checking account row. `amount` is signed (money in > 0) unless `credit`
 * says otherwise. Card bill payments are kept but flagged.
 */
export function buildEntry({ date, description, amount, credit, memo = null, counterparty = null, holder = null, bankCategory = null }) {
  const clean = cleanText(description || memo || "");
  if (!date || !clean || !Number.isFinite(amount) || amount === 0) return null;
  const cleanMemo = memo ? cleanText(memo) : null;

  return {
    date,
    description: clean,
    amount: Math.abs(amount),
    type: (credit ?? amount > 0) ? "credit" : "expense",
    memo: cleanMemo && cleanMemo !== clean ? cleanMemo : null,
    counterparty: counterparty ? cleanText(counterparty) : null,
    holder: holder ? cleanText(holder) : null,
    bankCategory,
    flag: CARD_BILL_PAYMENT.test(`${clean} ${cleanMemo || ""}`) ? "bill_payment" : null,
  };
}

/** "09/09/2026" → "2026-09-09" */
export const fromBRDate = (s) => {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};
