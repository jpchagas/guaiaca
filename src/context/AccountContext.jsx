import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const AccountContext = createContext();

export function AccountProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [currentAccountId, setCurrentAccountId] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentAccount =
    accounts.find((acc) => acc.id === currentAccountId) || null;

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    console.log("Auth state changed:", user);

    if (!user) {
      setAccounts([]);
      setCurrentAccountId(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      const accountIds = Array.isArray(userSnap.data()?.accounts)
        ? userSnap.data().accounts
        : [];

      console.log("Fetched account IDs:", accountIds);

      if (accountIds.length === 0) {
        setAccounts([]);
        setCurrentAccountId(null);
        setLoading(false);
        return;
      }

      // 🔥 Fetch accounts
      const snapshots = await Promise.all(
        accountIds.map((id) => getDoc(doc(db, "accounts", id)))
      );

      const accountsData = snapshots
        .map((snap, index) => {
          if (!snap.exists()) {
            console.warn(`Account not found: ${accountIds[index]}`);
            return null;
          }
          return { id: accountIds[index], ...snap.data() };
        })
        .filter(Boolean);

      console.log("Accounts loaded:", accountsData);

      setAccounts(accountsData);

      // 🔥 Restore selected account
      const storedId = localStorage.getItem("currentAccountId");

      const validAccountId =
        accountsData.find((acc) => acc.id === storedId)?.id ||
        accountsData[0]?.id ||
        null;

      setCurrentAccountId(validAccountId);
    } catch (error) {
      console.error("Error loading accounts:", error);
      setAccounts([]);
      setCurrentAccountId(null);
    } finally {
      setLoading(false);
    }
  });

  return () => unsubscribe();
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