import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
} from "@mui/material";

import { db } from "../firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { seedMockData } from "../utils/seedData";
import { useFilters } from "../context/FilterContext";

const COLORS = ["#4CAF50", "#FFB300", "#5E239D", "#1C1C1E", "#E5E5E5"];

export default function Overview() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { filters } = useFilters();

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      const householdId = localStorage.getItem("householdId");

      if (!householdId) {
        setTransactions([]);
        return;
      }

      const q = query(
        collection(db, "transactions"),
        where("householdId", "==", householdId)
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTransactions(data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  }

  // ✅ FILTERS
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filters?.dateFrom && tx.date < filters.dateFrom) return false;
      if (filters?.dateTo && tx.date > filters.dateTo) return false;
      return true;
    });
  }, [transactions, filters]);

  // ✅ AGGREGATIONS
  const { income, expenses, investments } = useMemo(() => {
    let income = 0;
    let expenses = 0;
    let investments = 0;

    filteredTransactions.forEach((t) => {
      const amount = Number(t.amount) || 0;

      if (t.classification === "revenue") income += amount;
      if (t.classification === "expense") expenses += amount;
      if (t.classification === "investment") investments += amount;
    });

    return { income, expenses, investments };
  }, [filteredTransactions]);

  const balance = income - expenses - investments;

  // ✅ PIE DATA
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

  // ---------- LOADING ----------
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // ---------- EMPTY ----------
  if (transactions.length === 0) {
    return (
      <Box textAlign="center" mt={8}>
        <Typography variant="h6" color="text.secondary" mb={2}>
          No transactions yet. Start by adding your first one!
        </Typography>

        <Button variant="contained" color="warning" onClick={seedMockData}>
          Seed Mock Data
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Overview
      </Typography>

      {/* ✅ Horizontal scroll cards (mobile-native) */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          overflowX: "auto",
          pb: 1,
        }}
      >
        {/* Balance */}
        <Paper sx={{ p: 2, minWidth: 160 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Balance
          </Typography>
          <Typography
            variant="h6"
            fontWeight="bold"
            sx={{ color: balance >= 0 ? "success.main" : "error.main" }}
          >
            ${balance.toFixed(2)}
          </Typography>
        </Paper>

        {/* Income */}
        <Paper sx={{ p: 2, minWidth: 160 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Income
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="success.main">
            ${income.toFixed(2)}
          </Typography>
        </Paper>

        {/* Expenses */}
        <Paper sx={{ p: 2, minWidth: 160 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Expenses
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="error.main">
            ${expenses.toFixed(2)}
          </Typography>
        </Paper>

        {/* Investments */}
        <Paper sx={{ p: 2, minWidth: 160 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Investments
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="warning.main">
            ${investments.toFixed(2)}
          </Typography>
        </Paper>
      </Box>

      {/* ✅ Chart */}
      <Paper
        sx={{
          p: 2,
          mt: 2,
          height: 320,
        }}
      >
        <Typography variant="subtitle1" mb={2}>
          Spending by Category
        </Typography>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {pieData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>

            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}