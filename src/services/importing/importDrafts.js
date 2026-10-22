import { isInternalTransfer, matchCardholder } from "./matchCardholder";

/** Small, stable string hash (cyrb53) → hex. */
function hash(str) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

const INVESTMENT = /aplica[cç][aã]o|invest|cdb|tesouro/i;

function classify(row, kind) {
  if (row.type === "credit") return "revenue";
  if (kind === "checking" && INVESTMENT.test(`${row.description} ${row.memo || ""}`)) return "investment";
  return "expense";
}

function methodOf(row, kind) {
  if (kind === "credit_card") return "credit_card";
  return /\bpix\b/i.test(`${row.description} ${row.memo || ""}`) ? "pix" : "transfer";
}

/**
 * Parsed statement → editable drafts for the review step.
 * Each draft gets a deterministic document id, so importing the same file
 * again finds the rows already saved instead of duplicating them.
 *
 * Card rows are dated on the bill's due date (the month it's paid in);
 * the printed purchase date is kept as `purchaseDate`.
 */
export function buildImportDrafts(statement, { accountId, members = [], currentUserId, existingIds = new Set(), suggest }) {
  const { kind, bank } = statement;
  const billDate = kind === "credit_card" ? statement.dueDate || statement.issueDate : null;
  const seen = {};

  return statement.transactions.map((row) => {
    const key = [
      accountId, kind, bank.id, row.date, row.type, row.amount.toFixed(2),
      row.description, row.holder, row.cardLast4, row.installment?.current,
    ].join("|");
    seen[key] = (seen[key] || 0) + 1;
    const id = `imp_${hash(`${key}|${seen[key]}`)}`;

    const internal = kind === "checking" && isInternalTransfer(row.counterparty, { members, holders: statement.holders });
    const alreadyImported = existingIds.has(id);
    const skipReason = alreadyImported
      ? "Já importado"
      : row.flag === "bill_payment"
      ? "Pagamento de fatura"
      : internal
      ? "Entre contas"
      : null;

    return {
      id,
      row,
      include: !skipReason,
      alreadyImported,
      skipReason,
      date: billDate || row.date,
      purchaseDate: billDate && billDate !== row.date ? row.date : null,
      classification: classify(row, kind),
      method: methodOf(row, kind),
      category: suggest?.({ ...row, kind }) || "",
      responsibleUserId: matchCardholder(row.holder, members)?.id || currentUserId || "",
    };
  });
}
