import { useEffect, useState, useMemo, useRef } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Snackbar,
  Button,
  Chip,
  Divider,
  InputAdornment,
  TextField,
} from "@mui/material";
import {
  ReceiptLongOutlined,
  Search,
  SearchOff,
  PersonOutline,
} from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";

import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";

import { useAccount } from "../context/AccountContext";
import { useDate } from "../context/DateContext";
import { useCategoryLookup } from "../hooks/useCategories";

import TransactionEntryDialog from "../components/TransactionEntryDialog";
import TransactionRow from "../components/TransactionRow";
import Money from "../components/ui/Money";
import EmptyState from "../components/ui/EmptyState";
import { finance } from "../theme";
import {
  MONTHS,
  formatDayLabel,
  isInMonth,
  toDate,
} from "../utils/format";

const FILTERS = [
  { value: "all", label: "Todas" },
  { value: "expense", label: "Despesas" },
  { value: "revenue", label: "Receitas" },
  { value: "investment", label: "Investimentos" },
];

const UNDO_WINDOW_MS = 4000;

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { currentAccount, members } = useAccount();
  const { selectedMonth, selectedYear } = useDate();
  const { byId: categoriesById } = useCategoryLookup();
  const { openCreate } = useOutletContext();
  const currentUserId = auth.currentUser?.uid;

  // Kept separate so the sheet keeps its content during the close animation
  const [editingTx, setEditingTx] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  // Deletions wait for the undo window before hitting Firestore
  const [pendingDeleteIds, setPendingDeleteIds] = useState([]);
  const deleteTimers = useRef({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", txId: null });

  /* -------------------- Realtime listener -------------------- */
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
        setTransactions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setSnackbar({ open: true, message: "Não foi possível carregar as transações.", txId: null });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentAccount?.id]);

  // Commit any pending deletes if the page unmounts
  useEffect(() => {
    const timers = deleteTimers.current;
    return () => {
      Object.entries(timers).forEach(([id, t]) => {
        clearTimeout(t);
        deleteDoc(doc(db, "transactions", id)).catch(console.error);
      });
    };
  }, []);

  /* -------------------- Derived -------------------- */

  const monthTransactions = useMemo(() => {
    return transactions
      .filter(
        (tx) =>
          !pendingDeleteIds.includes(tx.id) &&
          isInMonth(tx.date, selectedMonth, selectedYear)
      )
      .sort((a, b) => (toDate(b.date) || 0) - (toDate(a.date) || 0));
  }, [transactions, pendingDeleteIds, selectedMonth, selectedYear]);

  const totals = useMemo(() => {
    const t = { revenue: 0, expense: 0, investment: 0 };
    monthTransactions.forEach((tx) => {
      if (t[tx.classification] !== undefined) {
        t[tx.classification] += Number(tx.amount) || 0;
      }
    });
    return t;
  }, [monthTransactions]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return monthTransactions.filter((tx) => {
      if (filter !== "all" && tx.classification !== filter) return false;
      if (!term) return true;
      const categoryName = categoriesById[tx.category]?.name || "";
      return (
        (tx.description || "").toLowerCase().includes(term) ||
        categoryName.toLowerCase().includes(term)
      );
    });
  }, [monthTransactions, filter, search, categoriesById]);

  const groups = useMemo(() => {
    const map = new Map();
    visible.forEach((tx) => {
      const d = toDate(tx.date);
      const key = d ? d.toDateString() : "none";
      if (!map.has(key)) map.set(key, { key, label: formatDayLabel(d), items: [], net: 0 });
      const group = map.get(key);
      group.items.push(tx);
      const amount = Number(tx.amount) || 0;
      group.net += tx.classification === "revenue" ? amount : -amount;
    });
    return [...map.values()];
  }, [visible]);

  /* -------------------- Actions -------------------- */

  const openEdit = (tx) => {
    setEditingTx(tx);
    setEditOpen(true);
  };

  const handleDelete = (tx) => {
    setPendingDeleteIds((ids) => [...ids, tx.id]);
    setSnackbar({ open: true, message: "Transação excluída", txId: tx.id });

    deleteTimers.current[tx.id] = setTimeout(async () => {
      delete deleteTimers.current[tx.id];
      try {
        await deleteDoc(doc(db, "transactions", tx.id));
      } catch (err) {
        console.error(err);
        setSnackbar({ open: true, message: "Não foi possível excluir a transação.", txId: null });
      } finally {
        setPendingDeleteIds((ids) => ids.filter((id) => id !== tx.id));
      }
    }, UNDO_WINDOW_MS);
  };

  const handleUndo = () => {
    const id = snackbar.txId;
    if (!id) return;
    clearTimeout(deleteTimers.current[id]);
    delete deleteTimers.current[id];
    setPendingDeleteIds((ids) => ids.filter((x) => x !== id));
    setSnackbar((s) => ({ ...s, open: false }));
  };

  /* -------------------- Render -------------------- */

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!currentAccount?.id) {
    return (
      <EmptyState
        icon={PersonOutline}
        title="Nenhuma conta selecionada"
        description="Selecione ou crie uma conta para ver suas transações."
      />
    );
  }

  const monthName = MONTHS[selectedMonth].toLowerCase();

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {/* SUMMARY */}
      <Paper variant="outlined" sx={{ py: 1.5, px: 1, display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
        {[
          { label: "Entradas", value: totals.revenue, color: finance.revenue },
          { label: "Saídas", value: totals.expense, color: finance.expense },
          { label: "Investido", value: totals.investment, color: finance.investment },
        ].map((item, i) => (
          <Box
            key={item.label}
            sx={{
              px: 1,
              borderLeft: i > 0 ? "1px solid" : "none",
              borderColor: "divider",
              minWidth: 0,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              {item.label}
            </Typography>
            <Money
              value={item.value}
              component="div"
              fontWeight={700}
              sx={{ color: item.color, fontSize: { xs: 13, sm: 14 }, overflow: "hidden", textOverflow: "ellipsis" }}
            />
          </Box>
        ))}
      </Paper>

      {monthTransactions.length === 0 ? (
        <Paper variant="outlined">
          <EmptyState
            icon={ReceiptLongOutlined}
            title={`Nenhuma transação em ${monthName}`}
            description="Registre receitas, despesas e investimentos para acompanhar seu mês."
            actionLabel="Adicionar transação"
            onAction={() => openCreate("transaction")}
          />
        </Paper>
      ) : (
        <>
          {/* SEARCH + FILTERS */}
          <TextField
            size="small"
            placeholder="Buscar por descrição ou categoria"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: "flex", gap: 1, overflowX: "auto", mx: -2, px: 2, pb: 0.5 }}>
            {FILTERS.map((f) => {
              const active = filter === f.value;
              return (
                <Chip
                  key={f.value}
                  label={f.label}
                  onClick={() => setFilter(f.value)}
                  color={active ? "secondary" : "default"}
                  variant={active ? "filled" : "outlined"}
                  sx={{ flexShrink: 0, bgcolor: active ? undefined : "background.paper" }}
                />
              );
            })}
          </Box>

          {/* GROUPED LIST */}
          {groups.length === 0 ? (
            <EmptyState
              compact
              icon={SearchOff}
              title="Nenhum resultado"
              description="Tente outro termo de busca ou filtro."
            />
          ) : (
            groups.map((group) => (
              <Box key={group.key}>
                <Box display="flex" justifyContent="space-between" alignItems="baseline" px={0.5} mb={1}>
                  <Typography variant="overline" color="text.secondary">
                    {group.label}
                  </Typography>
                  <Money
                    value={group.net}
                    variant="caption"
                    color="text.secondary"
                    fontWeight={600}
                  />
                </Box>

                <Paper variant="outlined" sx={{ overflow: "hidden" }}>
                  {group.items.map((tx, i) => (
                    <Box key={tx.id}>
                      {i > 0 && <Divider sx={{ ml: 9 }} />}
                      <TransactionRow
                        tx={tx}
                        category={categoriesById[tx.category]}
                        onClick={() => openEdit(tx)}
                      />
                    </Box>
                  ))}
                </Paper>
              </Box>
            ))
          )}
        </>
      )}

      {/* ✏️ EDIT */}
      <TransactionEntryDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        currentAccount={currentAccount}
        members={members}
        currentUserId={currentUserId}
        initialData={editingTx}
        mode="edit"
        onDelete={handleDelete}
      />

      {/* 🔔 SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={UNDO_WINDOW_MS}
        onClose={(_, reason) => {
          if (reason === "clickaway") return;
          setSnackbar((s) => ({ ...s, open: false }));
        }}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: { xs: "calc(90px + env(safe-area-inset-bottom))" } }}
        action={
          snackbar.txId ? (
            <Button color="inherit" size="small" onClick={handleUndo} sx={{ color: "#7EE0B0" }}>
              Desfazer
            </Button>
          ) : null
        }
      />
    </Box>
  );
}
