import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

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
        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
          const data = snap.data();
          const userAccounts = data.accounts || [];

          setAccounts(userAccounts);

          const stored = localStorage.getItem("currentAccountId");

          const active =
            stored && userAccounts.includes(stored)
              ? stored
              : userAccounts[0] || null;

          setCurrentAccount(active);
        }
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