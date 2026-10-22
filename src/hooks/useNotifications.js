import { useCallback, useEffect, useRef, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebaseConfig";

/**
 * Live list of users/{uid}/notifications (written by the Cloud Functions).
 * `onArrive` fires for notifications that show up while the app is open.
 */
export function useNotifications(uid, { onArrive } = {}) {
  const [items, setItems] = useState([]);
  const onArriveRef = useRef(onArrive);
  onArriveRef.current = onArrive;

  useEffect(() => {
    if (!uid) {
      setItems([]);
      return;
    }

    let initial = true;
    const q = query(
      collection(db, "users", uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        if (!initial) {
          snap.docChanges()
            .filter((c) => c.type === "added" && !c.doc.data().read)
            .forEach((c) => onArriveRef.current?.({ id: c.doc.id, ...c.doc.data() }));
        }
        initial = false;
      },
      (err) => console.error(err)
    );

    return () => unsubscribe();
  }, [uid]);

  const markAllRead = useCallback(async () => {
    const unread = items.filter((n) => !n.read);
    if (!uid || !unread.length) return;
    const batch = writeBatch(db);
    unread.forEach((n) => batch.update(doc(db, "users", uid, "notifications", n.id), { read: true }));
    await batch.commit();
  }, [items, uid]);

  return {
    items,
    unreadCount: items.filter((n) => !n.read).length,
    markAllRead,
  };
}
