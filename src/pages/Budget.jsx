import { useEffect, useMemo, useState } from "react";
import {
  Box,
  ButtonBase,
  Typography,
  CircularProgress,
  LinearProgress,
  Paper,
  Divider,
} from "@mui/material";
import { DonutLargeOutlined, PersonOutline } from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";

import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

import { useAccount } from "../context/AccountContext";
import { useDate } from "../context/DateContext";
import { useCategoryLookup } from "../hooks/useCategories";

import Money from "../components/ui/Money";
import CategoryAvatar from "../components/ui/CategoryAvatar";
import EmptyState from "../components/ui/EmptyState";
import SectionHeader from "../components/ui/SectionHeader";
import AddBudgetDialog from "../components/AddBudgetDialog";
import RecurringBillsSection from "../components/RecurringBillsSection";
import { DEFAULT_ALERT_AT } from "../services/budgets/budgetService";
import { MONTHS, formatCurrency, isInMonth } from "../utils/format";

/* -------------------- Helpers -------------------- */

const getProgressColor = (percentage, alertAt = DEFAULT_ALERT_AT) => {
  if (percentage < alertAt) return "primary";
  if (percentage < 100) return "warning";
  return "error";
};

/* -------------------- Component -------------------- */

export default function Budget() {
  const { currentAccount, transactions, loading } = useAccount();
  const { selectedMonth, selectedYear } = useDate();
  const { byId: categoriesById } = useCategoryLookup();
  const { openCreate } = useOutletContext();

  const [budgets, setBudgets] = useState([]);
  const [budgetsLoading, setBudgetsLoading] = useState(true);

  // Kept separate so the sheet keeps its content during the close animation
  const [editingBudget, setEditingBudget] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  /* -------------------- Load Budgets -------------------- */
  useEffect(() => {
    if (!currentAccount?.id) {
      setBudgetsLoading(false);
      return;
    }

    setBudgetsLoading(true);

    const q = query(
      collection(db, "budgets"),
      where("accountId", "==", currentAccount.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBudgets(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setBudgetsLoading(false);
    });

    return () => unsubscribe();
  }, [currentAccount?.id]);

  /* -------------------- Derived Spending -------------------- */
  const spendingByCategory = useMemo(() => {
    const result = {};

    transactions.forEach((t) => {
      if (t.accountId !== currentAccount?.id) return;
      if (t.classification !== "expense") return;
      if (!isInMonth(t.date, selectedMonth, selectedYear)) return;

      const category = t.category || "uncategorized";
      result[category] = (result[category] || 0) + (Number(t.amount) || 0);
    });

    return result;
  }, [transactions, currentAccount?.id, selectedMonth, selectedYear]);

  const rows = useMemo(() => {
    return budgets
      .map((budget) => {
        const limit = Number(budget.limit) || 0;
        const spent = spendingByCategory[budget.category] || 0;
        const percentage = limit ? (spent / limit) * 100 : 0;
        return { ...budget, limit, spent, percentage, remaining: limit - spent };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [budgets, spendingByCategory]);

  const summary = useMemo(() => {
    const limit = rows.reduce((s, r) => s + r.limit, 0);
    const spent = rows.reduce((s, r) => s + r.spent, 0);
    return {
      limit,
      spent,
      percentage: limit ? (spent / limit) * 100 : 0,
      over: rows.filter((r) => r.percentage >= 100).length,
    };
  }, [rows]);

  /* -------------------- Loading -------------------- */
  if (loading || budgetsLoading) {
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
        description="Selecione uma conta para ver os orçamentos."
      />
    );
  }

  const remaining = summary.limit - summary.spent;

  const billsSection = (
    <RecurringBillsSection
      currentAccount={currentAccount}
      transactions={transactions}
      categoriesById={categoriesById}
      year={selectedYear}
      month={selectedMonth}
      onAdd={() => openCreate("bill")}
    />
  );

  if (!budgets.length) {
    return (
      <Box display="flex" flexDirection="column" gap={3}>
        <Paper variant="outlined">
          <EmptyState
            icon={DonutLargeOutlined}
            title="Defina seus limites de gasto"
            description="Crie orçamentos mensais por categoria e acompanhe quanto ainda pode gastar."
            actionLabel="Criar orçamento"
            onAction={() => openCreate("budget")}
          />
        </Paper>

        {billsSection}
      </Box>
    );
  }

  /* -------------------- UI -------------------- */
  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {/* SUMMARY */}
      <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Typography variant="body2" color="text.secondary">
          Gasto em {MONTHS[selectedMonth].toLowerCase()}
        </Typography>

        <Box display="flex" alignItems="baseline" gap={1} mt={0.25} mb={1.5} flexWrap="wrap">
          <Money value={summary.spent} sx={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }} />
          <Typography variant="body2" color="text.secondary">
            de {formatCurrency(summary.limit)}
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={Math.min(summary.percentage, 100)}
          color={getProgressColor(summary.percentage)}
          sx={{ height: 10 }}
        />

        <Box display="flex" justifyContent="space-between" mt={1.25}>
          <Typography variant="caption" color={remaining < 0 ? "error" : "text.secondary"} fontWeight={600}>
            {remaining >= 0
              ? `Disponível: ${formatCurrency(remaining)}`
              : `Acima do planejado: ${formatCurrency(Math.abs(remaining))}`}
          </Typography>
          {summary.over > 0 && (
            <Typography variant="caption" color="error" fontWeight={600}>
              {summary.over} {summary.over === 1 ? "categoria estourada" : "categorias estouradas"}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* LIST */}
      <Box>
        <SectionHeader title="Por categoria" />

        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          {rows.map((budget, i) => {
            const category = categoriesById[budget.category];
            const color = getProgressColor(budget.percentage, budget.alertAt);

            return (
              <Box key={budget.id}>
                {i > 0 && <Divider />}
                <ButtonBase
                  onClick={() => {
                    setEditingBudget(budget);
                    setEditOpen(true);
                  }}
                  sx={{ p: 2, display: "flex", gap: 1.5, width: "100%", textAlign: "left", alignItems: "flex-start" }}
                >
                  <CategoryAvatar category={category} />

                  <Box flex={1} minWidth={0}>
                    <Box display="flex" justifyContent="space-between" alignItems="baseline" gap={1}>
                      <Typography fontWeight={600} noWrap>
                        {category?.name || "Categoria removida"}
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        color={color === "primary" ? "text.secondary" : `${color}.main`}
                        sx={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {Math.round(budget.percentage)}%
                      </Typography>
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={Math.min(budget.percentage, 100)}
                      color={color}
                      sx={{ my: 1 }}
                    />

                    <Box display="flex" justifyContent="space-between" gap={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
                        {formatCurrency(budget.spent)} de {formatCurrency(budget.limit)}
                      </Typography>
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color={budget.remaining < 0 ? "error" : "text.secondary"}
                        sx={{ fontVariantNumeric: "tabular-nums" }}
                      >
                        {budget.remaining >= 0
                          ? `Restam ${formatCurrency(budget.remaining)}`
                          : `+${formatCurrency(Math.abs(budget.remaining))}`}
                      </Typography>
                    </Box>
                  </Box>
                </ButtonBase>
              </Box>
            );
          })}
        </Paper>
      </Box>

      {/* RECURRING BILLS */}
      {billsSection}

      <AddBudgetDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        currentAccount={currentAccount}
        budget={editingBudget}
      />
    </Box>
  );
}
