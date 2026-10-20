import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Divider,
  LinearProgress,
  Chip,
} from "@mui/material";
import {
  ArrowDownward,
  ArrowUpward,
  ShowChart,
  ReceiptLongOutlined,
  PieChartOutline,
  PersonOutline,
  GroupsOutlined,
} from "@mui/icons-material";
import { useNavigate, useOutletContext } from "react-router-dom";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

import { useAccount } from "../context/AccountContext";
import { useDate } from "../context/DateContext";
import { useCategoryLookup } from "../hooks/useCategories";

import AccountMembersBar from "../components/AccountMembersBar";
import ShareAccountDialog from "../components/ShareAccountDialog";
import SplitSummaryCard from "../components/SplitSummaryCard";
import SplitSettingsDialog from "../components/SplitSettingsDialog";
import ConfirmActionDialog from "../components/ConfirmActionDialog";
import TransactionRow from "../components/TransactionRow";
import Money from "../components/ui/Money";
import CategoryAvatar from "../components/ui/CategoryAvatar";
import EmptyState from "../components/ui/EmptyState";
import SectionHeader from "../components/ui/SectionHeader";

import { auth, db } from "../firebaseConfig";
import { doc, updateDoc, arrayRemove } from "firebase/firestore";

import { brand } from "../theme";
import { getCategoryVisual } from "../utils/categoryVisuals";
import { MONTHS, isInMonth, toDate, formatDayLabel } from "../utils/format";

const TOP_CATEGORIES = 5;

export default function Overview() {
  const {
    transactions,
    currentAccount,
    balancesByAccountId,
    members,
  } = useAccount();

  const { selectedMonth, selectedYear } = useDate();
  const { byId: categoriesById } = useCategoryLookup();
  const { openCreate } = useOutletContext();
  const navigate = useNavigate();
  const currentUserId = auth.currentUser?.uid;

  const [shareOpen, setShareOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({
    title: "",
    description: "",
  });

  const balanceData =
    balancesByAccountId[currentAccount?.id] || {
      income: 0,
      expenses: 0,
      investments: 0,
      balance: 0,
    };

  /* -------------------- Members -------------------- */

  const handleRemoveMember = (memberId) => {
    if (!currentAccount?.id || !memberId) return;

    const isOwner = currentUserId === currentAccount.ownerId;
    const isSelf = memberId === currentUserId;

    if (isOwner && isSelf) return;

    setSelectedMemberId(memberId);
    setConfirmConfig({
      title: isSelf ? "Sair da conta" : "Remover membro",
      description: isSelf
        ? "Você deixará de ver as transações, orçamentos e metas desta conta."
        : "Essa pessoa deixará de ter acesso às transações, orçamentos e metas desta conta.",
    });
    setConfirmOpen(true);
  };

  const confirmRemoveMember = async () => {
    if (!selectedMemberId || !currentAccount?.id) return;

    try {
      await updateDoc(doc(db, "accounts", currentAccount.id), {
        members: arrayRemove(selectedMemberId),
      });

      await updateDoc(doc(db, "users", selectedMemberId), {
        accounts: arrayRemove(currentAccount.id),
      });

      setConfirmOpen(false);
      setSelectedMemberId(null);
    } catch (err) {
      console.error(err);
    }
  };

  /* -------------------- Derived data -------------------- */

  const monthTransactions = useMemo(() => {
    return transactions
      .filter(
        (tx) =>
          tx.accountId === currentAccount?.id &&
          isInMonth(tx.date, selectedMonth, selectedYear)
      )
      .sort((a, b) => (toDate(b.date) || 0) - (toDate(a.date) || 0));
  }, [transactions, currentAccount, selectedMonth, selectedYear]);

  const spending = useMemo(() => {
    const totals = {};

    monthTransactions.forEach((t) => {
      if (t.classification !== "expense") return;
      const key = t.category || "__none__";
      totals[key] = (totals[key] || 0) + (Number(t.amount) || 0);
    });

    const total = Object.values(totals).reduce((s, v) => s + v, 0);

    const rows = Object.entries(totals)
      .map(([id, value]) => {
        const category = categoriesById[id];
        return {
          id,
          category,
          name: category?.name || "Sem categoria",
          value,
          color: getCategoryVisual(category).color,
        };
      })
      .sort((a, b) => b.value - a.value);

    if (rows.length > TOP_CATEGORIES) {
      const rest = rows.slice(TOP_CATEGORIES - 1);
      rows.splice(TOP_CATEGORIES - 1, rows.length, {
        id: "__others__",
        category: null,
        name: `Outras (${rest.length})`,
        value: rest.reduce((s, r) => s + r.value, 0),
        color: "#A3ADA8",
      });
    }

    return { rows, total };
  }, [monthTransactions, categoriesById]);

  const recent = monthTransactions.slice(0, 5);

  if (!currentAccount?.id) {
    return (
      <EmptyState
        icon={PersonOutline}
        title="Nenhuma conta selecionada"
        description="Selecione ou crie uma conta no topo da tela para começar."
      />
    );
  }

  const isShared = currentAccount.type !== "personal";
  const monthName = MONTHS[selectedMonth].toLowerCase();

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {/* 💰 HERO BALANCE */}
      <Paper
        sx={{
          p: 3,
          borderRadius: "24px",
          color: "#fff",
          background: brand.heroGradient,
          boxShadow: "0 18px 40px rgba(13, 31, 24, 0.28)",
          overflow: "hidden",
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
          <Typography variant="body2" sx={{ opacity: 0.75 }}>
            Saldo de {monthName}
          </Typography>

          <Chip
            size="small"
            icon={isShared ? <GroupsOutlined /> : <PersonOutline />}
            label={isShared ? "Compartilhada" : "Pessoal"}
            sx={{
              color: "#fff",
              backgroundColor: "rgba(255,255,255,0.12)",
              "& .MuiChip-icon": { color: "rgba(255,255,255,0.85)" },
            }}
          />
        </Box>

        <Money
          value={balanceData.balance}
          component="div"
          sx={{ fontSize: { xs: 34, sm: 40 }, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.2 }}
        />

        <Divider sx={{ borderColor: "rgba(255,255,255,0.14)", my: 2.5 }} />

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
          {[
            { label: "Receitas", value: balanceData.income, Icon: ArrowDownward, tint: "#7EE0B0" },
            { label: "Despesas", value: balanceData.expenses, Icon: ArrowUpward, tint: "#F4A39C" },
            { label: "Investido", value: balanceData.investments, Icon: ShowChart, tint: "#E9C77E" },
          ].map((stat) => {
            const { label, value, tint, Icon } = stat;
            return (
            <Box key={label} minWidth={0}>
              <Box display="flex" alignItems="center" gap={0.5} mb={0.25}>
                <Icon sx={{ fontSize: 14, color: tint }} />
                <Typography variant="caption" sx={{ opacity: 0.75 }}>
                  {label}
                </Typography>
              </Box>
              <Money
                value={value}
                component="div"
                variant="body2"
                fontWeight={600}
                sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
              />
            </Box>
            );
          })}
        </Box>
      </Paper>

      {/* 👥 MEMBERS */}
      {isShared && (
        <AccountMembersBar
          members={members}
          account={currentAccount}
          currentUserId={currentUserId}
          onAddClick={() => setShareOpen(true)}
          onRemoveMember={handleRemoveMember}
        />
      )}

      {/* ⚖️ SPLIT */}
      {isShared && (
        <SplitSummaryCard
          account={currentAccount}
          members={members}
          monthTransactions={monthTransactions}
          currentUserId={currentUserId}
          onEdit={() => setSplitOpen(true)}
        />
      )}

      {/* 🥧 SPENDING */}
      <Box>
        <SectionHeader title="Para onde foi o dinheiro" />

        <Paper variant="outlined" sx={{ p: 2.5 }}>
          {spending.rows.length === 0 ? (
            <EmptyState
              compact
              icon={PieChartOutline}
              title="Sem despesas neste mês"
              description="Quando você registrar despesas, mostraremos aqui como elas se dividem por categoria."
            />
          ) : (
            <>
              <Box sx={{ position: "relative", height: 180, mb: 2 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spending.rows}
                      dataKey="value"
                      innerRadius={62}
                      outerRadius={84}
                      paddingAngle={2}
                      stroke="none"
                      startAngle={90}
                      endAngle={-270}
                      isAnimationActive={false}
                    >
                      {spending.rows.map((row) => (
                        <Cell key={row.id} fill={row.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    pointerEvents: "none",
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    Total gasto
                  </Typography>
                  <Money value={spending.total} fontWeight={700} variant="subtitle1" />
                </Box>
              </Box>

              <Box display="flex" flexDirection="column" gap={1.75}>
                {spending.rows.map((row) => {
                  const pct = spending.total ? (row.value / spending.total) * 100 : 0;
                  return (
                    <Box key={row.id} display="flex" alignItems="center" gap={1.5}>
                      <CategoryAvatar category={row.category} size={34} />
                      <Box flex={1} minWidth={0}>
                        <Box display="flex" justifyContent="space-between" gap={1} mb={0.5}>
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {row.name}
                          </Typography>
                          <Money value={row.value} variant="body2" fontWeight={600} />
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{
                              flex: 1,
                              height: 6,
                              "& .MuiLinearProgress-bar": { backgroundColor: row.color },
                            }}
                          />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ width: 34, textAlign: "right", fontVariantNumeric: "tabular-nums" }}
                          >
                            {Math.round(pct)}%
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </>
          )}
        </Paper>
      </Box>

      {/* 🧾 RECENT */}
      <Box>
        <SectionHeader
          title="Atividade recente"
          actionLabel={monthTransactions.length > 0 ? "Ver todas" : undefined}
          onAction={() => navigate("/dashboard/transactions")}
        />

        <Paper variant="outlined" sx={{ overflow: "hidden" }}>
          {recent.length === 0 ? (
            <EmptyState
              compact
              icon={ReceiptLongOutlined}
              title={`Nada registrado em ${monthName}`}
              description="Adicione sua primeira transação do mês para acompanhar seu saldo."
              actionLabel="Adicionar transação"
              onAction={() => openCreate("transaction")}
            />
          ) : (
            recent.map((tx, i) => (
              <Box key={tx.id}>
                {i > 0 && <Divider sx={{ ml: 9 }} />}
                <TransactionRow
                  tx={tx}
                  category={categoriesById[tx.category]}
                  showDate={formatDayLabel(tx.date)}
                  onClick={() => navigate("/dashboard/transactions")}
                />
              </Box>
            ))
          )}
        </Paper>
      </Box>

      <ShareAccountDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        account={currentAccount}
      />

      <SplitSettingsDialog
        open={splitOpen}
        onClose={() => setSplitOpen(false)}
        account={currentAccount}
        members={members}
        monthTransactions={monthTransactions}
        currentUserId={currentUserId}
      />

      <ConfirmActionDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmRemoveMember}
        title={confirmConfig.title}
        description={confirmConfig.description}
        confirmText={selectedMemberId === currentUserId ? "Sair da conta" : "Remover"}
      />
    </Box>
  );
}
