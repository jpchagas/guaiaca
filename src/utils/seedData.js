import { db, auth } from "../firebaseConfig";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";

export async function seedMockData() {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.warn("User not logged in — can't seed mock data.");
      return;
    }

    // Get or create household
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    let householdId = userSnap.data()?.householdId;

    if (!householdId) {
      const householdRef = doc(collection(db, "households"));
      await setDoc(householdRef, {
        name: "Chagas Family",
        members: [user.uid],
        createdAt: serverTimestamp(),
      });

      await setDoc(userRef, { householdId: householdRef.id }, { merge: true });
      householdId = householdRef.id;
    }

    // 💳 Mock transactions (new schema)
    const transactions = [
      {
        date: "2025-10-12",
        description: "Groceries - Zaffari",
        classification: "expense",
        category: "Food",
        amount: 180.45,
        parcel: 1,
        parcels: 1,
        responsible: "João",
        method: "credit_card",
        card: "Nubank Gold",
      },
      {
        date: "2025-10-10",
        description: "Internet Bill",
        classification: "expense",
        category: "Utilities",
        amount: 120.0,
        parcel: 1,
        parcels: 1,
        responsible: "Karina",
        method: "transfer",
      },
      {
        date: "2025-10-05",
        description: "Salary - Planta Maromba",
        classification: "revenue",
        category: "Income",
        amount: 5000.0,
        parcel: 1,
        parcels: 1,
        responsible: "João",
        method: "transfer",
      },
      {
        date: "2025-10-07",
        description: "Dinner Out",
        classification: "expense",
        category: "Restaurant",
        amount: 230.75,
        parcel: 1,
        parcels: 1,
        responsible: "Karina",
        method: "credit_card",
        card: "Nubank Gold",
      },
      {
        date: "2025-10-02",
        description: "Stocks Investment",
        classification: "investment",
        category: "Investment",
        amount: 500.0,
        parcel: 1,
        parcels: 1,
        responsible: "João",
        method: "transfer",
      },
    ];

    // 🧾 Add each transaction to Firestore
    for (const t of transactions) {
      await addDoc(collection(db, "transactions"), {
        ...t,
        householdId,
        createdAt: serverTimestamp(),
      });
    }

    console.log("✅ Mock data seeded successfully!");
    alert("✅ Mock data seeded successfully!");
  } catch (error) {
    console.error("Error seeding mock data:", error);
    alert("❌ Error seeding mock data — check console for details.");
  }
}
