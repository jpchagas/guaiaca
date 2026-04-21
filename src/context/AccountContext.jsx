import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useDate } from "./DateContext";

const AccountContext = createContext();

export function AccountProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [currentAccountId, setCurrentAccountId] = useState(null);

  const [members, setMembers] = useState([]);

  const [transactions, setTransactions] = useState([]);
  const [balancesByAccountId, setBalancesByAccountId] = useState({});
  const [loading, setLoading] = useState(true);

  const { selectedMonth, selectedYear } = useDate();

  // ✅ DERIVED (THIS FIXES HALF YOUR BUGS)
  const currentAccount = useMemo(() => {
    return accounts.find((acc) => acc.id === currentAccountId) || null;
  }, [accounts, currentAccountId]);

  useEffect(() => {
    let unsubscribeAccounts = null;
    let unsubscribeTransactions = null;
    let unsubscribeMembers = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeAccounts) unsubscribeAccounts();
      if (unsubscribeTransactions) unsubscribeTransactions();
      if (unsubscribeMembers) unsubscribeMembers();

      if (!user) {
        setAccounts([]);
        setTransactions([]);
        setBalancesByAccountId({});
        setCurrentAccountId(null);
        setMembers([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      // 🔥 LOAD ACCOUNTS BY MEMBERSHIP
      const accountsQuery = query(
        collection(db, "accounts"),
        where("members", "array-contains", user.uid)
      );

      unsubscribeAccounts = onSnapshot(accountsQuery, (snapshot) => {
        const accountsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setAccounts(accountsData);

        // ✅ SAFE SELECTION LOGIC
        setCurrentAccountId((prev) => {
          const stored = localStorage.getItem("currentAccountId");

          const valid =
            accountsData.find((a) => a.id === prev)?.id ||
            accountsData.find((a) => a.id === stored)?.id ||
            accountsData[0]?.id ||
            null;

          if (valid) {
            localStorage.setItem("currentAccountId", valid);
          }

          return valid;
        });

        // 🔥 MEMBERS LISTENER
        if (unsubscribeMembers) unsubscribeMembers();

        const selected =
          accountsData.find((a) => a.id === currentAccountId) ||
          accountsData[0];

        const memberIds = selected?.members || [];

        if (!memberIds.length) {
          setMembers([]);
        } else {
          const usersQuery = query(
            collection(db, "users"),
            where("__name__", "in", memberIds.slice(0, 10))
          );

          unsubscribeMembers = onSnapshot(usersQuery, (snap) => {
            const users = snap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));
            setMembers(users);
          });
        }

        // 🔥 TRANSACTIONS LISTENER
        if (unsubscribeTransactions) unsubscribeTransactions();

        const accountIds = accountsData.map((acc) => acc.id);

        if (!accountIds.length) {
          setTransactions([]);
          setBalancesByAccountId({});
          setLoading(false);
          return;
        }

        const txQuery = query(
          collection(db, "transactions"),
          where("accountId", "in", accountIds.slice(0, 10))
        );

        unsubscribeTransactions = onSnapshot(txQuery, (snapshot) => {
          const txs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setTransactions(txs);

          const filteredTxs = txs.filter((tx) => {
            if (!tx.date) return false;

            const d =
              typeof tx.date?.toDate === "function"
                ? tx.date.toDate()
                : new Date(tx.date);

            return (
              d.getMonth() === selectedMonth &&
              d.getFullYear() === selectedYear
            );
          });

          const grouped = {};

          filteredTxs.forEach((tx) => {
            const accId = tx.accountId;
            const amount = Number(tx.amount) || 0;

            if (!grouped[accId]) {
              grouped[accId] = {
                income: 0,
                expenses: 0,
                investments: 0,
                balance: 0,
              };
            }

            switch (tx.classification) {
              case "revenue":
                grouped[accId].income += amount;
                grouped[accId].balance += amount;
                break;
              case "expense":
                grouped[accId].expenses += amount;
                grouped[accId].balance -= amount;
                break;
              case "investment":
                grouped[accId].investments += amount;
                grouped[accId].balance -= amount;
                break;
              default:
                break;
            }
          });

          setBalancesByAccountId(grouped);
        });

        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeAccounts) unsubscribeAccounts();
      if (unsubscribeTransactions) unsubscribeTransactions();
      if (unsubscribeMembers) unsubscribeMembers();
    };
  }, [selectedMonth, selectedYear, currentAccountId]);

  const switchAccount = (accountId) => {
    if (!accountId) return;
    setCurrentAccountId(accountId);
    localStorage.setItem("currentAccountId", accountId);
  };

  return (
    <AccountContext.Provider
      value={{
        accounts,
        currentAccount,      // ✅ CRITICAL FIX
        currentAccountId,
        switchAccount,
        loading,
        members,
        transactions,
        balancesByAccountId,
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