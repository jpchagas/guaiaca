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
  ResponsiveContainer,
} from "recharts";

import { seedMockData } from "../utils/seedData";
import { useFilters } from "../context/FilterContext";

// ✅ USE THEME COLORS ONLY
const COLORS = ["#2E7D32", "#66BB6A", "#FFB300", "#E0E0E0"];

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
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (filters?.dateFrom && tx.date < filters.dateFrom) return false;
      if (filters?.dateTo && tx.date > filters.dateTo) return false;
      return true;
    });
  }, [transactions, filters]);

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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  if (transactions.length === 0) {
    return (
      <Box textAlign="center" mt={8}>
        <Typography variant="h6" color="text.secondary" mb={2}>
          No transactions yet
        </Typography>

        <Button variant="contained" onClick={seedMockData}>
          Add Sample Data
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* 🔥 HERO BALANCE (GAME CHANGER) */}
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

      {/* 💼 POCKET CARDS */}
      <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 1 }}>
        {[
          { label: "Income", value: income, color: "success.main" },
          { label: "Expenses", value: expenses, color: "error.main" },
          { label: "Investments", value: investments, color: "warning.main" },
        ].map((item) => (
          <Paper
            key={item.label}
            sx={{
              p: 2,
              minWidth: 140,
              borderRadius: 3,
            }}
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

      {/* 📊 CHART */}
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