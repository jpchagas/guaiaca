import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
} from "@mui/material";

import { useOutletContext } from "react-router-dom";

import { db, auth } from "../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  serverTimestamp,
  arrayUnion,
  updateDoc,
  getDoc,
} from "firebase/firestore";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useFilters } from "../context/FilterContext";

const COLORS = ["#2E7D32", "#66BB6A", "#FFB300", "#E0E0E0"];

export default function Overview() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const { filters } = useFilters();

  // ✅ GLOBAL ACCOUNT CONTEXT
  const {
    currentAccountId,
    setCurrentAccountId,
    accounts,
  } = useOutletContext();

  // -------------------- FETCH USER --------------------
  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) return;

        const userData = userSnap.data();
        setUser({ id: currentUser.uid, ...userData });
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, []);

  // -------------------- FETCH TRANSACTIONS --------------------
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!currentAccountId) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const q = query(
          collection(db, "transactions"),
          where("accountId", "==", currentAccountId)
        );

        const snapshot = await getDocs(q);

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTransactions(data);
      } catch (err) {
        console.error("Error fetching transactions:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [currentAccountId]);

  // -------------------- FILTERS --------------------
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filters?.dateFrom && tx.date < filters.dateFrom) return false;
      if (filters?.dateTo && tx.date > filters.dateTo) return false;
      return true;
    });
  }, [transactions, filters]);

  // -------------------- TOTALS --------------------
  const { income, expenses, investments } = useMemo(() => {
    let income = 0,
      expenses = 0,
      investments = 0;

    filteredTransactions.forEach((t) => {
      const amount = Number(t.amount) || 0;

      if (t.classification === "revenue") income += amount;
      if (t.classification === "expense") expenses += amount;
      if (t.classification === "investment") investments += amount;
    });

    return { income, expenses, investments };
  }, [filteredTransactions]);

  const balance = income - expenses - investments;

  // -------------------- PIE DATA --------------------
  const pieData = useMemo(() => {
    const expenseTransactions = filteredTransactions.filter(
      (t) => t.classification === "expense"
    );

    const categoryTotals = expenseTransactions.reduce((acc, t) => {
      const key = t.category || "Other";
      acc[key] = (acc[key] || 0) + (Number(t.amount) || 0);
      return acc;
    }, {});

    return Object.entries(categoryTotals).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredTransactions]);

  // -------------------- CREATE ACCOUNT --------------------
  const handleCreateAccount = async () => {
    if (!user) return;

    try {
      const newAccountRef = doc(collection(db, "accounts"));

      await setDoc(newAccountRef, {
        name: `${user.name}'s Account`,
        members: [user.id],
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "users", user.id), {
        accounts: arrayUnion(newAccountRef.id),
      });

      // 🔥 update global state
      setCurrentAccountId(newAccountRef.id);

      // optional: refresh page state (Dashboard will handle accounts reload on next mount)
    } catch (err) {
      console.error("Failed to create account:", err);
    }
  };

  // -------------------- SWITCH ACCOUNT --------------------
  const handleSwitchAccount = (accountId) => {
    setCurrentAccountId(accountId);
    localStorage.setItem("currentAccountId", accountId); // keep persistence
  };

  // -------------------- LOADING --------------------
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  // -------------------- UI --------------------
  return (
    <Box>
      {/* 🔥 ACCOUNT HEADER */}
      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Select Account</InputLabel>
          <Select
            value={currentAccountId || ""}
            label="Select Account"
            onChange={(e) => handleSwitchAccount(e.target.value)}
          >
            {accounts.map((accId) => (
              <MenuItem key={accId} value={accId}>
                {accId}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleCreateAccount}>
          New Account
        </Button>
      </Stack>

      {/* EMPTY STATE (no account selected) */}
      {!currentAccountId && (
        <Box textAlign="center" mt={6}>
          <Typography color="text.secondary">
            Select or create an account to get started
          </Typography>
        </Box>
      )}

      {/* BALANCE */}
      {currentAccountId && (
        <>
          <Paper
            sx={{
              p: 3,
              mb: 3,
              backgroundColor: "primary.main",
              color: "white",
              borderRadius: 4,
            }}
          >
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Total Balance
            </Typography>

            <Typography variant="h4" fontWeight={700}>
              ${balance.toFixed(2)}
            </Typography>
          </Paper>

          {/* CARDS */}
          <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 1 }}>
            {[
              { label: "Income", value: income, color: "success.main" },
              { label: "Expenses", value: expenses, color: "error.main" },
              {
                label: "Investments",
                value: investments,
                color: "warning.main",
              },
            ].map((item) => (
              <Paper
                key={item.label}
                sx={{ p: 2, minWidth: 140, borderRadius: 3 }}
              >
                <Typography variant="body2" color="text.secondary">
                  {item.label}
                </Typography>

                <Typography
                  variant="h6"
                  fontWeight={600}
                  sx={{ color: item.color }}
                >
                  ${item.value.toFixed(2)}
                </Typography>
              </Paper>
            ))}
          </Box>

          {/* CHART */}
          <Paper sx={{ p: 2, mt: 3 }}>
            <Typography variant="subtitle1" mb={2}>
              Spending by Category
            </Typography>

            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" outerRadius={90}>
                    {pieData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </>
      )}
    </Box>
  );
}