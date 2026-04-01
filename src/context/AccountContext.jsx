import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, collection, query, where, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const AccountContext = createContext();

export function AccountProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [currentAccountId, setCurrentAccountId] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentAccount =
    accounts.find((acc) => acc.id === currentAccountId) || null;

  useEffect(() => {
    let unsubscribeUser = null;
    let unsubscribeAccounts = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user);

      // 🔥 cleanup previous listeners
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeAccounts) unsubscribeAccounts();

      if (!user) {
        setAccounts([]);
        setCurrentAccountId(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      // 🔥 1. Listen to user doc (for accountIds)
      const userRef = doc(db, "users", user.uid);

      unsubscribeUser = onSnapshot(userRef, (userSnap) => {
        const accountIds = Array.isArray(userSnap.data()?.accounts)
          ? userSnap.data().accounts
          : [];

        console.log("Realtime account IDs:", accountIds);

        if (accountIds.length === 0) {
          setAccounts([]);
          setCurrentAccountId(null);
          setLoading(false);
          return;
        }

        // 🔥 cleanup previous accounts listener
        if (unsubscribeAccounts) unsubscribeAccounts();

        // 🔥 2. Listen to accounts in real-time
        const q = query(
          collection(db, "accounts"),
          where("__name__", "in", accountIds)
        );

        unsubscribeAccounts = onSnapshot(q, (snapshot) => {
          const accountsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          console.log("Realtime accounts:", accountsData);

          setAccounts(accountsData);

          // 🔥 Maintain selected account (CRITICAL)
          setCurrentAccountId((prevId) => {
            const storedId = localStorage.getItem("currentAccountId");

            const validId =
              accountsData.find((acc) => acc.id === prevId)?.id ||
              accountsData.find((acc) => acc.id === storedId)?.id ||
              accountsData[0]?.id ||
              null;

            if (validId) {
              localStorage.setItem("currentAccountId", validId);
            }

            return validId;
          });

          setLoading(false);
        });
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeAccounts) unsubscribeAccounts();
    };
  }, []);

  const switchAccount = (accountId) => {
    if (!accountId) return;
    console.log("Switching account to:", accountId);
    setCurrentAccountId(accountId);
    localStorage.setItem("currentAccountId", accountId);
  };

  return (
    <AccountContext.Provider
      value={{
        accounts,
        currentAccount,
        currentAccountId,
        switchAccount,
        setAccounts,
        loading,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used within AccountProvider");
  }
  return context;
}