import { db, auth } from "../../firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export async function ingestTransactionsList(transactions) {
  console.log("🚀 Ingesting parsed transactions into Firestore");

  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const txCollection = collection(db, "transactions");

    for (const tx of transactions) {
      if (!tx?.accountId) continue;

      const amount = Number(tx.amount) || 0;
      if (!tx.date || !amount) continue;

      await addDoc(txCollection, {
        description: tx.description || "",
        category: tx.category || "Other",
        amount,

        // ✅ FIXED
        classification:
          tx.classification ||
          (amount >= 0 ? "revenue" : "expense"),

        accountId: tx.accountId,

        date:
          typeof tx.date === "string"
            ? tx.date
            : new Date(tx.date).toISOString().split("T")[0],

        bank: tx.bank || "Unknown",
        createdAt: serverTimestamp(),
      });
    }

    console.log(`✅ ${transactions.length} transactions imported.`);
  } catch (err) {
    console.error(err);
    throw err;
  }
}