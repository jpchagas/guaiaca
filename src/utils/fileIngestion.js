import Papa from "papaparse";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export async function ingestCSVFile(file, accountId) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const user = auth.currentUser;
          if (!user) throw new Error("User not authenticated");
          if (!accountId) throw new Error("Missing accountId");

          const txCollection = collection(db, "transactions");

          for (const row of results.data) {
            const { date, description, category, amount } = row;

            const parsedAmount = Number(amount) || 0;
            if (!date || !parsedAmount) continue;

            await addDoc(txCollection, {
              description: description || "",
              category: category || "Other",
              amount: parsedAmount,

              // ✅ FIXED
              classification:
                parsedAmount >= 0 ? "revenue" : "expense",

              accountId,

              date:
                typeof date === "string"
                  ? date
                  : new Date(date).toISOString().split("T")[0],

              createdAt: serverTimestamp(),
            });
          }

          resolve();
        } catch (err) {
          console.error(err);
          reject(err);
        }
      },
      error: (error) => reject(error),
    });
  });
}