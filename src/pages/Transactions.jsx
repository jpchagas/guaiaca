import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Chip,
  IconButton,
  Snackbar,
  Alert,
  Stack,
} from "@mui/material";

import {
  Delete as DeleteIcon,
} from "@mui/icons-material";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "../firebaseConfig";
import { useFilters } from "../context/FilterContext";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { filters } = useFilters();

  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    setLoading(true);
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
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));

      setTransactions(data);
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: "Failed to fetch transactions.",
      });
    } finally {
      setLoading(false);
    }
  }

  // ✅ FILTERS
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!tx.date) return false;

      const txDate = new Date(tx.date);

      if (filters?.dateFrom && txDate < new Date(filters.dateFrom)) return false;
      if (filters?.dateTo && txDate > new Date(filters.dateTo)) return false;

      return true;
    });
  }, [transactions, filters]);

  const deleteTransaction = async (id) => {
    try {
      await deleteDoc(doc(db, "transactions", id));

      setTransactions((prev) => prev.filter((t) => t.id !== id));

      setSnackbar({
        open: true,
        severity: "success",
        message: "Transaction deleted.",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: "Failed to delete transaction.",
      });
    }
  };

  const getColor = (cls) => {
    return cls === "revenue"
      ? "success.main"
      : cls === "expense"
      ? "error.main"
      : "warning.main";
  };

  // ---------- LOADING ----------
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  // ---------- EMPTY ----------
  if (filteredTransactions.length === 0) {
    return (
      <Box textAlign="center" mt={8}>
        <Typography>No transactions found.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Transactions
      </Typography>

      {/* ✅ Card List */}
      <Stack spacing={2}>
        {filteredTransactions.map((tx) => {
          const amount = Number(tx.amount) || 0;

          return (
            <Paper key={tx.id} sx={{ p: 2, borderRadius: 3 }}>
              {/* Top Row */}
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography fontWeight="bold">
                  {tx.description || "No description"}
                </Typography>

                <Typography
                  fontWeight="bold"
                  sx={{ color: getColor(tx.classification) }}
                >
                  ${amount.toFixed(2)}
                </Typography>
              </Box>

              {/* Middle */}
              <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                <Chip
                  label={tx.classification}
                  size="small"
                  sx={{
                    bgcolor: getColor(tx.classification),
                    color: "white",
                  }}
                />

                <Chip label={tx.category || "Other"} size="small" variant="outlined" />

                <Chip label={tx.method || "—"} size="small" variant="outlined" />
              </Box>

              {/* Bottom */}
              <Box
                mt={1}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="caption" color="text.secondary">
                  {tx.date}
                </Typography>

                <IconButton
                  size="small"
                  color="error"
                  onClick={() => deleteTransaction(tx.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          );
        })}
      </Stack>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}