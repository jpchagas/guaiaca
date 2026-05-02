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
  Button,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";

import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

import { useAccount } from "../context/AccountContext";
import { useDate } from "../context/DateContext";

import AddTransactionDialog from "../components/AddTransactionDialog";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const { currentAccount } = useAccount();
  const { selectedMonth, selectedYear } = useDate();

  const [editingTx, setEditingTx] = useState(null);

  // 🔥 Snackbar with UNDO support
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    action: null,
  });

  // 🔥 REALTIME LISTENER
  useEffect(() => {
    if (!currentAccount?.id) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "transactions"),
      where("accountId", "==", currentAccount.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setTransactions(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setSnackbar({
          open: true,
          message: "Failed to fetch transactions.",
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentAccount?.id]);

  // 🔥 FILTER BY DATE
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
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
  }, [transactions, selectedMonth, selectedYear]);

  // 🎨 COLOR
  const getColor = (cls) =>
    cls === "revenue"
      ? "#2e7d32"
      : cls === "expense"
      ? "#d32f2f"
      : "#ed6c02";

  // 📅 FORMAT DATE
  const formatDate = (date) => {
    if (!date) return "—";

    const d =
      typeof date?.toDate === "function"
        ? date.toDate()
        : new Date(date);

    return d.toLocaleDateString();
  };

  // 🧠 OPTIMISTIC DELETE + UNDO
  const handleDelete = async (tx) => {
    const previous = transactions;

    // optimistic remove
    setTransactions((list) => list.filter((t) => t.id !== tx.id));

    let undone = false;

    setSnackbar({
      open: true,
      message: "Transaction deleted",
      action: (
        <Button
          color="secondary"
          size="small"
          onClick={() => {
            undone = true;
            setTransactions(previous);
            setSnackbar((s) => ({ ...s, open: false }));
          }}
        >
          UNDO
        </Button>
      ),
    });

    // wait before committing delete
    setTimeout(async () => {
      if (undone) return;

      try {
        await deleteDoc(doc(db, "transactions", tx.id));
      } catch (err) {
        console.error(err);
        setTransactions(previous);
      }
    }, 3000);
  };

  // ⏳ LOADING
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  // ❌ NO ACCOUNT
  if (!currentAccount?.id) {
    return (
      <Box textAlign="center" mt={8}>
        <Typography color="text.secondary">
          Select or create an account to see transactions
        </Typography>
      </Box>
    );
  }

  // 📭 EMPTY
  if (filteredTransactions.length === 0) {
    return (
      <Box textAlign="center" mt={8}>
        <Typography color="text.secondary">
          No transactions yet. Tap + to add one.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={1.5}>
        {filteredTransactions.map((tx) => {
          const amount = Number(tx.amount);

          const signedAmount =
            tx.classification === "revenue" ? amount : -amount;

          return (
            <Paper
              key={tx.id}
              onClick={() => setEditingTx(tx)}
              sx={{
                p: 2,
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                gap: 2,
                cursor: "pointer",
                transition: "0.2s",
                "&:hover": { boxShadow: 3 },
              }}
            >
              {/* DOT */}
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  backgroundColor: getColor(tx.classification),
                  flexShrink: 0,
                }}
              />

              {/* CONTENT */}
              <Box flex={1} minWidth={0}>
                <Typography fontWeight={600} noWrap>
                  {tx.description || "No description"}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  noWrap
                >
                  {tx.category || "Other"} • {tx.method || "—"}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {formatDate(tx.date)}
                </Typography>
              </Box>

              {/* AMOUNT */}
              <Box textAlign="right">
                <Typography
                  fontWeight={700}
                  sx={{
                    color: getColor(tx.classification),
                    fontSize: 16,
                  }}
                >
                  {signedAmount > 0 ? "+" : "-"}$
                  {Math.abs(amount || 0).toFixed(2)}
                </Typography>

                {tx.installment && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    {tx.installment.current}/
                    {tx.installment.total}
                  </Typography>
                )}
              </Box>

              {/* ACTIONS */}
              <Box display="flex">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingTx(tx);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>

                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(tx);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Paper>
          );
        })}
      </Stack>

      {/* ✏️ EDIT */}
      <AddTransactionDialog
        open={!!editingTx}
        onClose={() => setEditingTx(null)}
        initialData={editingTx}
        mode="edit"
      />

      {/* 🔔 SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar((s) => ({ ...s, open: false }))
        }
        action={snackbar.action}
      >
        <Alert severity="info">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}