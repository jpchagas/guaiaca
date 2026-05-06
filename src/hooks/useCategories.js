import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebaseConfig";

export function useCategories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "categories"), orderBy("name"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCategories(data);
    });

    return () => unsubscribe();
  }, []);

  return categories;
}