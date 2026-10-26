/**
 * Personal vs shared money in accounts that split per person.
 *
 * In a shared account whose split mode is "equal", "proportional" or
 * "fixed", each transaction is either shared (saved in the shared account)
 * or personal (saved in the responsible member's personal account). An
 * earning sent to the shared account is split in two linked transactions:
 * the member's share of it in the shared account and the rest in their
 * personal account (see sharedIncomeService.js). The share follows the
 * split mode:
 *   - equal:        1 / members
 *   - fixed:        the member's %
 *   - proportional: the member's gross income ÷ everyone's, for the month
 * "joint" accounts pool everything, so none of this applies to them.
 */
import { normalizeCategoryKey } from "../../utils/categoryVisuals";
import { isInMonth, toDate } from "../../utils/format";
import { validateFixedShares } from "./computeSplit";

export const round2 = (n) => Math.round(n * 100) / 100;

export const isSplitAccount = (account) => account?.type === "shared" && account.split?.mode !== "joint";

// Earnings are split; other revenue (refunds, yields, reimbursements) goes whole to where it's sent
const SPLIT_INCOME_CATEGORIES = new Set(["salario", "receita_de_negocios"]);

export const isSplitIncome = (classification, category) =>
  classification === "revenue" && SPLIT_INCOME_CATEGORIES.has(normalizeCategoryKey(category?.name || ""));

/** A revenue's full amount: the gross of a split income, else its amount. */
export const grossOf = (tx) => Number(tx.incomeSplit?.gross ?? tx.amount) || 0;

/** Member → gross revenue in the account for the month, skipping `excludeIds`. */
export function grossIncomeByMember(transactions, accountId, year, month, excludeIds = []) {
  const byMember = {};
  transactions.forEach((t) => {
    if (t.accountId !== accountId || t.classification !== "revenue" || excludeIds.includes(t.id)) return;
    if (!t.responsibleUserId || !isInMonth(t.date, month, year)) return;
    byMember[t.responsibleUserId] = (byMember[t.responsibleUserId] || 0) + grossOf(t);
  });
  return byMember;
}

/** Fraction (0–1) of the member's income that goes to the shared account. */
export function incomeShareOf(account, memberId, grossByMember = {}) {
  const members = account.members || [];
  if (!members.includes(memberId)) return 1;

  const mode = account.split?.mode || "equal";
  if (mode === "fixed" && validateFixedShares(members, account.split.shares)) {
    return Number(account.split.shares[memberId]) / 100;
  }
  if (mode === "proportional") {
    const total = members.reduce((s, id) => s + (grossByMember[id] || 0), 0);
    if (total > 0) return (grossByMember[memberId] || 0) / total;
  }
  // Like computeSplit, anything unusable falls back to equal
  return 1 / members.length;
}

/** Shared and personal parts of a split income. */
export function splitAmounts(gross, pct) {
  const shared = round2(gross * pct);
  return { shared, personal: round2(gross - shared) };
}

/**
 * How a new or edited income of `amount` would be split: { pct, shared, personal }.
 * `excludeIds` leaves out the income's own current parts.
 */
export function planIncomeSplit({ account, responsibleUserId, amount, date, transactions, excludeIds = [] }) {
  const d = toDate(date) || new Date();
  const gross = grossIncomeByMember(transactions, account.id, d.getFullYear(), d.getMonth(), excludeIds);
  gross[responsibleUserId] = (gross[responsibleUserId] || 0) + amount;
  const pct = incomeShareOf(account, responsibleUserId, gross);
  return { pct, ...splitAmounts(amount, pct) };
}
