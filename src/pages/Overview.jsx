import { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
} from "@mui/material";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { useAccount } from "../context/AccountContext";
import { useDate } from "../context/DateContext"; // ✅ NEW

const COLORS = ["#2E7D32", "#66BB6A", "#FFB300", "#E0E0E0"];

export default function Overview() {
  const {
    transactions,
    currentAccount,
    balancesByAccountId,
  } = useAccount();

  const { selectedMonth, selectedYear } = useDate(); // ✅ NEW

  const balanceData =
    balancesByAccountId[currentAccount?.id] || {
      income: 0,
      expenses: 0,
      investments: 0,
      balance: 0,
    };

  // ✅ FILTER BY ACCOUNT + DATE
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.accountId !== currentAccount?.id) return false;
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
  }, [transactions, currentAccount, selectedMonth, selectedYear]);

  // ✅ PIE DATA FROM FILTERED
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

  if (!currentAccount?.id) {
    return (
      <Box textAlign="center" mt={6}>
        <Typography color="text.secondary">
          Select or create an account
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
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
          ${balanceData.balance.toFixed(2)}
        </Typography>
      </Paper>

      <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 1 }}>
        {[
          { label: "Income", value: balanceData.income, color: "success.main" },
          { label: "Expenses", value: balanceData.expenses, color: "error.main" },
          { label: "Investments", value: balanceData.investments, color: "warning.main" },
        ].map((item) => (
          <Paper key={item.label} sx={{ p: 2, minWidth: 140, borderRadius: 3 }}>
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

      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="subtitle1" mb={2}>
          Spending by Category
        </Typography>

        <Box sx={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" outerRadius={90}>
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}