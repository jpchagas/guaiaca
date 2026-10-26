// One-off: gives imported transactions saved before cards existed their
// `bank`, and links card purchases to a card.
//
//   node scripts/migrateTransactionSources.js --project guaiaca-cd777            # dry run
//   node scripts/migrateTransactionSources.js --project guaiaca-cd777 --apply    # write
//
// Needs admin credentials (`gcloud auth application-default login`), or
// FIRESTORE_EMULATOR_HOST to run against the emulator.
//
// Old rows don't have the card number, so card purchases are linked per
// account and bank: to that bank's only card, or to a new card with no
// numbers (the next imported bill of that bank adopts it and fills them in).
// When the account already has several cards of that bank the rows are left
// unlinked, and show as "Cartão não identificado" until edited.
/* global process */
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

// Same as BANKS in src/utils/banks.js
const BANK_NAMES = {
  btg: "BTG Pactual",
  nubank: "Nubank",
  c6: "C6 Bank",
  bradesco: "Bradesco",
  banrisul: "Banrisul",
  itau: "Itaú",
  caixa: "Caixa",
};

const bankIdOf = (parserId) => (parserId ? parserId.replace(/-checking$/, "") : null);

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const projectId = args[args.indexOf("--project") + 1];
if (!args.includes("--project") || !projectId) {
  console.error("Usage: node scripts/migrateTransactionSources.js --project <id> [--apply]");
  process.exit(1);
}

initializeApp({ projectId });
const db = getFirestore();

// Firestore caps a batch at 500 writes
async function commitInChunks(ops) {
  for (let i = 0; i < ops.length; i += 450) {
    const batch = db.batch();
    ops.slice(i, i + 450).forEach((op) => op(batch));
    await batch.commit();
  }
}

const mostCommon = (values) => {
  const counts = {};
  values.filter(Boolean).forEach((v) => (counts[v] = (counts[v] || 0) + 1));
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
};

async function main() {
  console.log(`${apply ? "APPLYING" : "DRY RUN"} on ${process.env.FIRESTORE_EMULATOR_HOST ? "emulator" : projectId}\n`);

  const txs = (await db.collection("transactions").get()).docs
    .map((d) => ({ ref: d.ref, ...d.data() }))
    .filter((t) => t.import?.bank && bankIdOf(t.import.bank));
  const cards = (await db.collection("cards").get()).docs.map((d) => ({ id: d.id, ...d.data() }));

  const ops = [];
  let bankOnly = 0;

  // Card purchases without a card, per account and bank
  const groups = {};
  txs.forEach((t) => {
    const bank = bankIdOf(t.import.bank);
    if (t.method === "credit_card" && t.import.kind === "credit_card" && !t.cardId) {
      const key = `${t.accountId}|${bank}`;
      (groups[key] = groups[key] || { accountId: t.accountId, bank, rows: [] }).rows.push(t);
    } else if (!t.bank) {
      ops.push((b) => b.update(t.ref, { bank }));
      bankOnly += 1;
    }
  });

  const newCards = [];
  Object.values(groups).forEach(({ accountId, bank, rows }) => {
    const existing = cards.filter((c) => c.accountId === accountId && c.bank === bank);
    const holders = [...new Set(rows.map((r) => r.import.holder).filter(Boolean))].join(", ") || "—";
    const label = `account ${accountId} · ${BANK_NAMES[bank] || bank}: ${rows.length} card rows (holders: ${holders})`;

    if (existing.length > 1) {
      console.log(`skip    ${label} — ${existing.length} cards of this bank, link by hand`);
      rows.filter((r) => !r.bank).forEach((r) => ops.push((b) => b.update(r.ref, { bank })));
      return;
    }

    const ref = existing[0] ? db.collection("cards").doc(existing[0].id) : db.collection("cards").doc();
    if (existing[0]) {
      console.log(`link    ${label} → card "${existing[0].name}"`);
    } else {
      console.log(`create  ${label} → new card "${BANK_NAMES[bank] || bank}"`);
      newCards.push((b) =>
        b.set(ref, {
          accountId,
          bank,
          name: BANK_NAMES[bank] || bank,
          last4: [],
          ownerId: mostCommon(rows.map((r) => r.responsibleUserId)),
          limit: null,
          closingDay: null,
          dueDay: null,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: null,
        })
      );
    }
    rows.forEach((r) => ops.push((b) => b.update(r.ref, { bank, cardId: ref.id })));
  });

  console.log(`\nbank    ${bankOnly} other imported rows get their bank`);

  if (!apply) {
    console.log("\nNothing written. Re-run with --apply.");
    return;
  }

  // Cards first, so no transaction points at a card that doesn't exist yet
  await commitInChunks(newCards);
  await commitInChunks(ops);

  console.log("\n✅ Done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
