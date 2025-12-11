import Papa from "papaparse";
import { db, auth } from "../firebaseConfig";
import { collection, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";

/**
 * Parse CSV file and insert transactions into Firestore.
 * Expected columns: date, description, category, amount
 */
export async function ingestCSVFile(file) {
  console.log("i'm inside the ingestCSVFile")
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const user = auth.currentUser;
          if (!user) throw new Error("User not authenticated");

          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          const householdId = userSnap.data()?.householdId;
          if (!householdId) throw new Error("No household assigned");

          const txCollection = collection(db, "transactions");

          for (const row of results.data) {
            const { date, description, category, amount } = row;
            if (!date || !amount) continue;

            await addDoc(txCollection, {
              date,
              description: description || "",
              category: category || "Other",
              amount: parseFloat(amount),
              householdId,
              createdAt: serverTimestamp(),
            });
          }

          alert("✅ CSV data imported successfully!");
          resolve();
        } catch (err) {
          console.error("Error processing CSV:", err);
          alert("❌ Error importing CSV file: " + err.message);
          reject(err);
        }
      },
      error: (error) => reject(error),
    });
  });
}
