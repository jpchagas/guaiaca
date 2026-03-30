import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, collection, query, where} from "firebase/firestore";

const AccountContext = createContext();

export function AccountProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", user.uid));

        if (!userSnap.exists()) {
          setLoading(false);
          return;
        }

        const userData = userSnap.data();
        const accountIds = userData.accounts || [];

        // 🔥 Fetch account documents
        const accountsData = [];

        for (const id of accountIds) {
          const accSnap = await getDoc(doc(db, "accounts", id));

          if (accSnap.exists()) {
            accountsData.push({
              id,
              ...accSnap.data(),
            });
          }
        }

        setAccounts(accountsData);

        const stored = localStorage.getItem("currentAccountId");

        const valid =
          stored && accountIds.includes(stored)
            ? stored
            : accountIds[0] || null;

        setCurrentAccount(valid);
      } catch (err) {
        console.error("Error loading accounts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const switchAccount = (accountId) => {
    setCurrentAccount(accountId);
    localStorage.setItem("currentAccountId", accountId);
  };

  return (
    <AccountContext.Provider
      value={{
        accounts,
        currentAccount,
        switchAccount,
        setAccounts, // useful after creating account
        loading,
      }}
    >
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}