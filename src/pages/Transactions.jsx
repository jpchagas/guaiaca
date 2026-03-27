import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  IconButton,
  Snackbar,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogActions,
  Button,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";

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
import { useOutletContext } from "react-router-dom"; // ✅ NEW

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { filters } = useFilters();
  const { currentAccountId } = useOutletContext(); // ✅ GLOBAL ACCOUNT

  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  const [deleteId, setDeleteId] = useState(null);

  // 🔥 FETCH TRANSACTIONS WHEN ACCOUNT CHANGES
  useEffect(() => {
    fetchTransactions();
  }, [currentAccountId]);

  async function fetchTransactions() {
    setLoading(true);

    try {
      if (!currentAccountId) {
        setTransactions([]);
        return;
      }

      const q = query(
        collection(db, "transactions"),
        where("accountId", "==", currentAccountId)
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setTransactions(data);
    } catch (err) {
      console.error(err);
      setSnackbar({
        open: true,
        severity: "error",
        message: "Failed to fetch transactions.",
      });
    } finally {
      setLoading(false);
    }
  }

  // 🔍 FILTERS
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (!tx.date) return false;

      const txDate = new Date(tx.date);

      if (filters?.dateFrom && txDate < new Date(filters.dateFrom))
        return false;

      if (filters?.dateTo && txDate > new Date(filters.dateTo))
        return false;

      return true;
    });
  }, [transactions, filters]);

  // 🗑 DELETE
  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, "transactions", deleteId));

      setTransactions((prev) => prev.filter((t) => t.id !== deleteId));

      setSnackbar({
        open: true,
        severity: "success",
        message: "Transaction deleted.",
      });
    } catch {
      setSnackbar({
        open: true,
        severity: "error",
        message: "Failed to delete transaction.",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const getColor = (cls) =>
    cls === "revenue"
      ? "success.main"
      : cls === "expense"
      ? "error.main"
      : "warning.main";

  // ⏳ LOADING
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  // 📭 EMPTY
  if (!currentAccountId) {
    return (
      <Box textAlign="center" mt={8}>
        <Typography color="text.secondary">
          Select or create an account to see transactions
        </Typography>
      </Box>
    );
  }

  if (filteredTransactions.length === 0) {
    return (
      <Box textAlign="center" mt={8}>
        <Typography color="text.secondary">
          No transactions found
        </Typography>
      </Box>
    );
  }

  // ✅ UI
  return (
    <Box>
      <Stack spacing={2}>
        {filteredTransactions.map((tx) => {
          const amount = Number(tx.amount) || 0;

          return (
            <Paper
              key={tx.id}
              sx={{ p: 2, borderRadius: 3, position: "relative" }}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 16,
                  width: 32,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: "primary.main",
                }}
              />

              <Box display="flex" justifyContent="space-between">
                <Typography fontWeight={600}>
                  {tx.description || "No description"}
                </Typography>

                <Typography
                  fontWeight={700}
                  sx={{ color: getColor(tx.classification) }}
                >
                  ${amount.toFixed(2)}
                </Typography>
              </Box>

              <Box mt={1}>
                <Typography variant="body2" color="text.secondary">
                  {tx.category || "Other"} • {tx.method || "—"}
                </Typography>
              </Box>

              <Box
                mt={1.5}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="caption" color="text.secondary">
                  {tx.date}
                </Typography>

                <IconButton
                  size="small"
                  onClick={() => setDeleteId(tx.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          );
        })}
      </Stack>

      {/* Confirm delete */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete this transaction?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" onClick={confirmDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar((s) => ({ ...s, open: false }))
        }
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}