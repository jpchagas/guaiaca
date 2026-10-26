// One-off: moves the global `categories` collection onto the new taxonomy.
//
//   node scripts/migrateCategories.js --project guaiaca-cd777            # dry run
//   node scripts/migrateCategories.js --project guaiaca-cd777 --apply    # write
//
// Needs admin credentials (`gcloud auth application-default login`), or
// FIRESTORE_EMULATOR_HOST to run against the emulator.
//
// One-to-one renames update the category doc in place, so transactions and
// budgets keep their category id. Merged categories have their transactions
// and budgets re-pointed (two budgets for the same account end up as one,
// with the limits added) and are then deleted. Categories not in the plan,
// e.g. ones created from the budget dialog, are left alone.
/* global process */
import { initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

// Same order as src/scripts/seedCategories.js
const FINAL = [
  "Salário",
  "Receita de negócios",
  "Investimentos",
  "Reembolsos",
  "Moradia",
  "Alimentação",
  "Restaurantes e delivery",
  "Transporte",
  "Veículo",
  "Saúde",
  "Academia e esportes",
  "Cuidados pessoais",
  "Lazer e entretenimento",
  "Viagens",
  "Assinaturas",
  "Educação",
  "Pets",
  "Presentes e doações",
  "Família e filhos",
  "Impostos e taxas",
  "Compras",
  "Empréstimos e dívidas",
  "Outros",
];

// Old category → new one. Several old names on the same target are merged.
const MOVES = {
  "Condomínio": "Moradia",
  "Energia elétrica": "Moradia",
  "Água": "Moradia",
  "Gás": "Moradia",
  "Internet": "Moradia",
  "Manutenção": "Moradia",
  "Telefone": "Moradia",
  "Supermercado": "Alimentação",
  "Restaurantes": "Restaurantes e delivery",
  "Bares": "Restaurantes e delivery",
  "Saúde & Bem-estar": "Saúde",
  "Cuidados Pessoais": "Cuidados pessoais",
  "Entretenimento & Lazer": "Lazer e entretenimento",
  "Doações & Presentes": "Presentes e doações",
  "Família & Filhos": "Família e filhos",
  "Impostos": "Impostos e taxas",
  "Tarifas bancárias": "Impostos e taxas",
  "Empréstimos / financiamentos": "Empréstimos e dívidas",
  "Animais de Estimação": "Pets",
};

// Same as normalizeCategoryKey in src/utils/categoryVisuals.js
const keyOf = (str = "") =>
  str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const projectId = args[args.indexOf("--project") + 1];
if (!args.includes("--project") || !projectId) {
  console.error("Usage: node scripts/migrateCategories.js --project <id> [--apply]");
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

async function main() {
  console.log(`${apply ? "APPLYING" : "DRY RUN"} on ${process.env.FIRESTORE_EMULATOR_HOST ? "emulator" : projectId}\n`);

  const snap = await db.collection("categories").get();
  const docs = snap.docs.map((d) => ({ id: d.id, ref: d.ref, name: d.data().name || "" }));

  const finalByKey = Object.fromEntries(FINAL.map((n) => [keyOf(n), n]));
  const moveByKey = Object.fromEntries(Object.entries(MOVES).map(([from, to]) => [keyOf(from), keyOf(to)]));
  const targetKeyOf = (doc) => {
    const k = keyOf(doc.name);
    return finalByKey[k] ? k : moveByKey[k] || null;
  };

  // Canonical doc per final category: one already named right wins over a
  // rename source; everything else that maps there gets merged into it
  const canonical = {};
  [...docs]
    .sort((a, b) => Number(!finalByKey[keyOf(a.name)]) - Number(!finalByKey[keyOf(b.name)]))
    .forEach((doc) => {
      const target = targetKeyOf(doc);
      if (target && !canonical[target]) canonical[target] = doc;
    });

  const renames = [];
  const merges = [];
  const untouched = [];
  docs.forEach((doc) => {
    const target = targetKeyOf(doc);
    if (!target) return untouched.push(doc);
    if (canonical[target] !== doc) return merges.push({ from: doc, into: canonical[target] });
    if (doc.name !== finalByKey[target]) renames.push({ doc, name: finalByKey[target] });
  });
  const creates = FINAL.filter((n) => !canonical[keyOf(n)]);

  renames.forEach(({ doc, name }) => console.log(`rename  ${doc.name} → ${name}`));
  creates.forEach((name) => console.log(`create  ${name}`));

  const txOps = [];
  const budgetOps = [];
  for (const { from, into } of merges) {
    const txs = await db.collection("transactions").where("category", "==", from.id).get();
    console.log(`merge   ${from.name} → ${finalByKey[targetKeyOf(into)]} (${txs.size} transactions)`);
    txs.docs.forEach((d) => txOps.push((b) => b.update(d.ref, { category: into.id })));
  }

  // Budgets: re-point, folding duplicates per account into one
  const intoIdOf = Object.fromEntries(merges.map(({ from, into }) => [from.id, into.id]));
  const affected = new Set([...merges.map((m) => m.from.id), ...merges.map((m) => m.into.id)]);
  const budgets = (await db.collection("budgets").get()).docs.filter((d) => affected.has(d.data().category));
  const byAccountCategory = {};
  budgets.forEach((d) => {
    const category = intoIdOf[d.data().category] || d.data().category;
    const key = `${d.data().accountId}|${category}`;
    (byAccountCategory[key] = byAccountCategory[key] || []).push(d);
  });
  Object.values(byAccountCategory).forEach((group) => {
    const category = intoIdOf[group[0].data().category] || group[0].data().category;
    // Keep the budget already on the target category when there is one
    group.sort((a, b) => Number(a.data().category !== category) - Number(b.data().category !== category));
    const [keep, ...rest] = group;
    const limit = group.reduce((s, d) => s + (Number(d.data().limit) || 0), 0);
    if (rest.length) {
      console.log(`budget  account ${keep.data().accountId}: ${group.length} budgets merged, limit ${limit}`);
    } else if (keep.data().category !== category) {
      console.log(`budget  account ${keep.data().accountId}: re-pointed`);
    }
    if (rest.length || keep.data().category !== category) {
      budgetOps.push((b) => b.update(keep.ref, { category, limit: Math.round(limit * 100) / 100 }));
    }
    rest.forEach((d) => budgetOps.push((b) => b.delete(d.ref)));
  });

  untouched.forEach((doc) => console.log(`keep    ${doc.name} (not in the plan)`));

  if (!apply) {
    console.log("\nNothing written. Re-run with --apply.");
    return;
  }

  await commitInChunks([
    ...renames.map(({ doc, name }) => (b) => b.update(doc.ref, { name, key: keyOf(name) })),
    ...creates.map((name) => (b) =>
      b.set(db.collection("categories").doc(), { name, key: keyOf(name), createdAt: FieldValue.serverTimestamp() })
    ),
  ]);
  await commitInChunks([...txOps, ...budgetOps]);
  // Delete merged categories last, once nothing points at them
  await commitInChunks(merges.map(({ from }) => (b) => b.delete(from.ref)));

  console.log("\n✅ Done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
