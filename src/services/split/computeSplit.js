/**
 * Expense split for shared accounts.
 *
 * Account config (stored on the account doc, optional — defaults to equal):
 *   split: { mode: "equal" | "proportional" | "fixed", shares?: { [uid]: percent } }
 *
 * Everything else is derived from the month's transactions:
 *   - shared expenses  = transactions with classification "expense" (investments excluded)
 *   - income per member = "revenue" transactions by responsibleUserId
 *   - paid per member   = "expense" transactions by responsibleUserId
 *
 * Money is handled in cents so each member's share adds up exactly to the total.
 */

export const SPLIT_MODES = ["equal", "proportional", "fixed"];

const toCents = (value) => Math.round((Number(value) || 0) * 100);
const toReais = (cents) => cents / 100;

/** Splits totalCents by weights using the largest-remainder method. */
function allocate(totalCents, weights) {
  const weightSum = weights.reduce((s, w) => s + w, 0);
  if (!weightSum) return weights.map(() => 0);

  const raw = weights.map((w) => (totalCents * w) / weightSum);
  const result = raw.map(Math.floor);
  let leftover = totalCents - result.reduce((s, v) => s + v, 0);

  raw
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)
    .forEach(({ i }) => {
      if (leftover > 0) {
        result[i] += 1;
        leftover -= 1;
      }
    });

  return result;
}

/** Minimal list of transfers that settles everyone's balance. */
function settle(rows) {
  const creditors = rows
    .filter((r) => r.balanceCents > 0)
    .map((r) => ({ id: r.id, left: r.balanceCents }))
    .sort((a, b) => b.left - a.left);
  const debtors = rows
    .filter((r) => r.balanceCents < 0)
    .map((r) => ({ id: r.id, left: -r.balanceCents }))
    .sort((a, b) => b.left - a.left);

  const transfers = [];
  let c = 0;
  let d = 0;

  while (c < creditors.length && d < debtors.length) {
    const amount = Math.min(creditors[c].left, debtors[d].left);
    if (amount > 0) {
      transfers.push({ from: debtors[d].id, to: creditors[c].id, amount: toReais(amount) });
    }
    creditors[c].left -= amount;
    debtors[d].left -= amount;
    if (creditors[c].left === 0) c += 1;
    if (debtors[d].left === 0) d += 1;
  }

  return transfers;
}

/** Validates fixed shares for the given members: non-negative and summing to 100. */
export function validateFixedShares(memberIds, shares = {}) {
  const values = memberIds.map((id) => Number(shares[id]));
  if (values.some((v) => !Number.isFinite(v) || v < 0)) return false;
  const sum = values.reduce((s, v) => s + v, 0);
  return Math.abs(sum - 100) < 0.01;
}

/**
 * @param {object}   params
 * @param {string[]} params.memberIds     account.members
 * @param {object[]} params.transactions  the account's transactions for the month
 * @param {object}   params.config        account.split (optional)
 */
export function computeSplit({ memberIds = [], transactions = [], config }) {
  const mode = SPLIT_MODES.includes(config?.mode) ? config.mode : "equal";
  const isMember = (id) => memberIds.includes(id);

  const income = Object.fromEntries(memberIds.map((id) => [id, 0]));
  const paid = Object.fromEntries(memberIds.map((id) => [id, 0]));
  let totalCents = 0;
  let unassignedCents = 0;

  transactions.forEach((tx) => {
    const cents = toCents(Math.abs(Number(tx.amount) || 0));
    const owner = tx.responsibleUserId;

    if (tx.classification === "revenue") {
      if (isMember(owner)) income[owner] += cents;
    } else if (tx.classification === "expense") {
      totalCents += cents;
      if (isMember(owner)) paid[owner] += cents;
      else unassignedCents += cents;
    }
  });

  const totalIncomeCents = memberIds.reduce((s, id) => s + income[id], 0);

  let weights;
  let effectiveMode = mode;
  let warning = null;

  if (mode === "fixed") {
    if (validateFixedShares(memberIds, config?.shares)) {
      weights = memberIds.map((id) => Number(config.shares[id]));
    } else {
      warning = "invalidShares";
    }
  } else if (mode === "proportional") {
    if (totalIncomeCents > 0) {
      weights = memberIds.map((id) => income[id]);
    } else {
      warning = "noIncome";
    }
  }

  if (!weights) {
    weights = memberIds.map(() => 1);
    effectiveMode = "equal";
  }

  const weightSum = weights.reduce((s, w) => s + w, 0);
  const owed = allocate(totalCents, weights);

  const rows = memberIds.map((id, i) => {
    const balanceCents = paid[id] - owed[i];
    return {
      id,
      share: weightSum ? weights[i] / weightSum : 0,
      income: toReais(income[id]),
      owed: toReais(owed[i]),
      paid: toReais(paid[id]),
      balance: toReais(balanceCents),
      remaining: toReais(income[id] - owed[i]),
      balanceCents,
    };
  });

  return {
    mode,
    effectiveMode,
    warning,
    total: toReais(totalCents),
    totalIncome: toReais(totalIncomeCents),
    unassignedPaid: toReais(unassignedCents),
    rows: rows.map(({ balanceCents, ...row }) => row), // eslint-disable-line no-unused-vars
    transfers: settle(rows),
  };
}
