import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebaseConfig";
import {
  doc,
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

  const [account, setAccount] = useState(null); // ✅ NEW
  const [members, setMembers] = useState([]);   // ✅ NEW

  const [transactions, setTransactions] = useState([]);
  const [balancesByAccountId, setBalancesByAccountId] = useState({});
  const [loading, setLoading] = useState(true);

  const { selectedMonth, selectedYear } = useDate();

  const currentAccount =
    accounts.find((acc) => acc.id === currentAccountId) || null;

  // 🔥 AUTH + DATA
  useEffect(() => {
    let unsubscribeUser = null;
    let unsubscribeAccounts = null;
    let unsubscribeTransactions = null;
    let unsubscribeMembers = null; // ✅ NEW

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeAccounts) unsubscribeAccounts();
      if (unsubscribeTransactions) unsubscribeTransactions();
      if (unsubscribeMembers) unsubscribeMembers();

      if (!user) {
        setAccounts([]);
        setTransactions([]);
        setBalancesByAccountId({});
        setCurrentAccountId(null);
        setAccount(null);
        setMembers([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const userRef = doc(db, "users", user.uid);

      unsubscribeUser = onSnapshot(userRef, (userSnap) => {
        const accountIds = Array.isArray(userSnap.data()?.accounts)
          ? userSnap.data().accounts
          : [];

        if (accountIds.length === 0) {
          setAccounts([]);
          setCurrentAccountId(null);
          setAccount(null);
          setMembers([]);
          setLoading(false);
          return;
        }

        if (unsubscribeAccounts) unsubscribeAccounts();

        const q = query(
          collection(db, "accounts"),
          where("__name__", "in", accountIds)
        );

        unsubscribeAccounts = onSnapshot(q, (snapshot) => {
          const accountsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setAccounts(accountsData);

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

          // 🔥 CURRENT ACCOUNT OBJECT
          const selected =
            accountsData.find((acc) => acc.id === currentAccountId) ||
            accountsData[0];

          setAccount(selected || null);

          // 🔥 MEMBERS LISTENER (NEW)
          if (unsubscribeMembers) unsubscribeMembers();

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

          // 🔥 TRANSACTIONS LISTENER (UNCHANGED)
          if (unsubscribeTransactions) unsubscribeTransactions();

          const txQuery = query(
            collection(db, "transactions"),
            where("accountId", "in", accountIds)
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
        });
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeAccounts) unsubscribeAccounts();
      if (unsubscribeTransactions) unsubscribeTransactions();
      if (unsubscribeMembers) unsubscribeMembers();
    };
  }, [selectedMonth, selectedYear]);

  const switchAccount = (accountId) => {
    if (!accountId) return;
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
        loading,

        // ✅ NEW
        account,
        members,

        // 🔥 GLOBAL DATA
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