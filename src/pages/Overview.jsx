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

import { useFilters } from "../context/FilterContext";
import { useAccount } from "../context/AccountContext";

const COLORS = ["#2E7D32", "#66BB6A", "#FFB300", "#E0E0E0"];

export default function Overview() {
  const { filters } = useFilters();
  const { transactions, currentAccount } = useAccount();

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.accountId !== currentAccount?.id) return false;
      if (!tx.date) return false;

      const txDate =
        typeof tx.date?.toDate === "function"
          ? tx.date.toDate()
          : new Date(tx.date);

      if (filters?.dateFrom && txDate < new Date(filters.dateFrom))
        return false;

      if (filters?.dateTo && txDate > new Date(filters.dateTo))
        return false;

      return true;
    });
  }, [transactions, filters, currentAccount]);

  const { income, expenses, investments } = useMemo(() => {
    let income = 0,
      expenses = 0,
      investments = 0;

    filteredTransactions.forEach((t) => {
      const amount = Number(t.amount) || 0;

      switch (t.classification) {
        case "revenue":
          income += amount;
          break;
        case "expense":
          expenses += amount;
          break;
        case "investment":
          investments += amount;
          break;
      }
    });

    return { income, expenses, investments };
  }, [filteredTransactions]);

  const balance = income - expenses - investments;

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
          Select or create an account to get started
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
          ${balance.toFixed(2)}
        </Typography>
      </Paper>

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
    </Box>
  );
}