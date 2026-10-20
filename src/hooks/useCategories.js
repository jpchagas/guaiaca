import { useEffect, useMemo, useState } from "react";
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

/** Categories plus an id → category map for resolving stored category IDs. */
export function useCategoryLookup() {
  const categories = useCategories();

  const byId = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [categories]);

  return { categories, byId };
}
