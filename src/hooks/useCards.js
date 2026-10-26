import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Credit cards (see services/cards/cardService.js) of the given accounts, by
 * name, plus an id → card map. Pass all the user's accounts where a card can
 * be referenced from another account (a shared card's purchase moved to a
 * personal account). Firestore `in` takes 10 ids.
 */
export function useCards(accountIds = []) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const key = accountIds.filter(Boolean).slice(0, 10).sort().join(",");

  useEffect(() => {
    if (!key) {
      setCards([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, "cards"), where("accountId", "in", key.split(",")));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setCards(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.name || "").localeCompare(b.name || "", "pt-BR"))
        );
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [key]);

  const byId = useMemo(() => Object.fromEntries(cards.map((c) => [c.id, c])), [cards]);

  return { cards, byId, loading };
}
