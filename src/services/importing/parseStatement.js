import btg from "../parsers/btgParser";
import nubank from "../parsers/nubankParser";
import c6 from "../parsers/c6Parser";
import bradesco from "../parsers/bradescoParser";
import banrisul from "../parsers/banrisulParser";
import btgChecking from "../parsers/btgCheckingParser";
import nubankChecking from "../parsers/nubankCheckingParser";
import c6Checking from "../parsers/c6CheckingParser";
import bradescoChecking from "../parsers/bradescoCheckingParser";
import banrisulChecking from "../parsers/banrisulCheckingParser";
import { round2 } from "./statementUtils";

export const STATEMENT_PARSERS = [
  btg, nubank, c6, bradesco, banrisul,
  btgChecking, nubankChecking, c6Checking, bradescoChecking, banrisulChecking,
];

/** One entry per bank, for "supported banks" lists. */
export const SUPPORTED_BANKS = [
  ...new Map(STATEMENT_PARSERS.map((p) => [p.name, { name: p.name, logo: p.logo }])).values(),
];

export class StatementImportError extends Error {
  constructor(code, message) {
    super(message || code);
    this.code = code; // "unsupportedFile" | "scannedPdf" | "unknownBank" | "noTransactions"
  }
}

/** Identifies bank and statement type from the content (never the filename). */
export function detectBank(text) {
  return STATEMENT_PARSERS.find((parser) => parser.detect(text)) || null;
}

/**
 * Token text (see pdfText.js) or CSV text → normalized statement:
 * {
 *   kind: "credit_card" | "checking",
 *   bank: { id, name, logo },
 *   holders: string[],          // cardholders / account holders / who made each entry
 *   totals: { in, out },        // money in (credits) and out (expenses) we extracted
 *   check: { ok, expected, actual } | null,  // against the statement's own totals
 *   transactions: [{ date: "YYYY-MM-DD", description, amount (> 0),
 *                    type: "expense" | "credit", holder, ... }]
 *   ...parser extras (dueDate, issueDate, period, total)
 * }
 * Card rows add `installment` and `cardLast4`; checking rows add `memo`,
 * `counterparty`, `bankCategory` and `flag` ("bill_payment" | null).
 */
export function parseStatementText(text) {
  const parser = detectBank(text);
  if (!parser) throw new StatementImportError("unknownBank");

  const { transactions, expected: parsed, ...meta } = parser.parse(text);
  if (!transactions.length) throw new StatementImportError("noTransactions");

  const sum = (type) =>
    round2(transactions.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0));
  const totals = { in: sum("credit"), out: sum("expense") };
  const actual = { ...totals, net: round2(totals.in - totals.out) };

  // A card bill's printed total is what's owed: purchases minus refunds
  const expected = parser.kind === "credit_card"
    ? meta.total == null ? {} : { net: -meta.total }
    : parsed || {};
  const keys = Object.keys(expected);

  return {
    kind: parser.kind,
    bank: { id: parser.id, name: parser.name, logo: parser.logo },
    ...meta,
    holders: [...new Set([meta.holder, ...transactions.map((t) => t.holder)].filter(Boolean))],
    totals,
    check: keys.length
      ? { ok: keys.every((k) => Math.abs(expected[k] - actual[k]) < 0.01), expected, actual }
      : null,
    transactions,
  };
}
