import { db, auth } from "../../firebaseConfig";
import { collection, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";

/**
 * Ingest a parsed transaction list directly into Firestore.
 * @param {Array} transactions - Array of {date, description, amount, category, bank}
 */
export async function ingestTransactionsList(transactions) {
  console.log("🚀 Ingesting parsed transactions into Firestore");

  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    const householdId = userSnap.data()?.householdId;
    if (!householdId) throw new Error("No household assigned");

    const txCollection = collection(db, "transactions");

    // Batch insert (async sequentially)
    for (const tx of transactions) {
      const { date, description, category, amount, bank } = tx;
      if (!date || !amount) continue;

      await addDoc(txCollection, {
        date,
        description: description || "",
        category: category || "Other",
        amount: parseFloat(amount),
        bank: bank || "Unknown",
        householdId,
        createdAt: serverTimestamp(),
      });
    }

    console.log(`✅ ${transactions.length} transactions imported successfully.`);
  } catch (err) {
    console.error("❌ Error ingesting transactions:", err);
    throw err;
  }
}
