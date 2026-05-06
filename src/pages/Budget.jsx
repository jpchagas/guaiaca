import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Divider,
} from "@mui/material";

import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

import { useAccount } from "../context/AccountContext";
import { useDate } from "../context/DateContext";

/* -------------------- Helpers -------------------- */

const getProgressColor = (percentage) => {
  if (percentage < 70) return "primary";
  if (percentage < 100) return "warning";
  return "error";
};

const formatCurrency = (value) => {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

/* -------------------- Component -------------------- */

export default function Budget() {
  const { currentAccount, transactions, loading } = useAccount();
  const { selectedMonth, selectedYear } = useDate();

  const [budgets, setBudgets] = useState([]);
  const [budgetsLoading, setBudgetsLoading] = useState(true);

  /* -------------------- Load Budgets -------------------- */
  useEffect(() => {
    if (!currentAccount?.id) return;

    const q = query(
      collection(db, "budgets"),
      where("accountId", "==", currentAccount.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setBudgets(data);
      setBudgetsLoading(false);
    });

    return () => unsubscribe();
  }, [currentAccount?.id]);

  /* -------------------- Derived Spending -------------------- */
  const spendingByCategory = useMemo(() => {
    const result = {};

    transactions.forEach((t) => {
      if (t.classification !== "expense") return;

      const date = t.date?.toDate?.();
      if (!date) return;

      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      if (month !== selectedMonth || year !== selectedYear) return;

      const category = t.category || "uncategorized";

      result[category] = (result[category] || 0) + t.amount;
    });

    return result;
  }, [transactions, selectedMonth, selectedYear]);

  /* -------------------- Loading -------------------- */
  if (loading || budgetsLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  /* -------------------- No Account -------------------- */
  if (!currentAccount?.id) {
    return (
      <Box textAlign="center" mt={8}>
        <Typography color="text.secondary">
          Select an account to view budgets
        </Typography>
      </Box>
    );
  }

  /* -------------------- No Budgets -------------------- */
  if (!budgets.length) {
    return (
      <Box textAlign="center" mt={8}>
        <Typography variant="h6" gutterBottom>
          No budgets yet
        </Typography>

        <Typography color="text.secondary">
          Create budgets to track your spending by category
        </Typography>
      </Box>
    );
  }

  /* -------------------- Sorted Budgets -------------------- */
  const sortedBudgets = [...budgets].sort((a, b) => {
    const spentA = spendingByCategory[a.category] || 0;
    const spentB = spendingByCategory[b.category] || 0;

    const percA = (spentA / a.limit) * 100;
    const percB = (spentB / b.limit) * 100;

    return percB - percA;
  });

  /* -------------------- UI -------------------- */
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Budget
      </Typography>

      <Stack spacing={2}>
        {sortedBudgets.map((budget, i) => {
          const spent = spendingByCategory[budget.category] || 0;
          const remaining = budget.limit - spent;
          const percentage = Math.min((spent / budget.limit) * 100, 100);

          return (
            <Paper key={budget.id} sx={{ p: 2 }}>
              <Stack spacing={1}>
                {/* Header */}
                <Box display="flex" justifyContent="space-between">
                  <Typography fontWeight={600}>
                    {budget.category}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {Math.round(percentage)}%
                  </Typography>
                </Box>

                {/* Progress */}
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  color={getProgressColor(percentage)}
                  sx={{ height: 8, borderRadius: 4 }}
                />

                {/* Values */}
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">
                    {formatCurrency(spent)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary">
                    {formatCurrency(budget.limit)}
                  </Typography>
                </Box>

                {/* Remaining */}
                <Typography
                  variant="caption"
                  color={remaining < 0 ? "error" : "text.secondary"}
                >
                  {remaining >= 0
                    ? `Remaining: ${formatCurrency(remaining)}`
                    : `Exceeded by ${formatCurrency(Math.abs(remaining))}`}
                </Typography>
              </Stack>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}