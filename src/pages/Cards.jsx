import { useMemo, useState } from "react";
import {
  Box,
  ButtonBase,
  CircularProgress,
  Divider,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import { CreditCardOutlined, PersonOutline } from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";

import { auth } from "../firebaseConfig";
import { useAccount } from "../context/AccountContext";
import { useDate } from "../context/DateContext";
import { useCategoryLookup } from "../hooks/useCategories";
import { useCards } from "../hooks/useCards";
import AddCardDialog from "../components/AddCardDialog";
import CardDetailSheet from "../components/CardDetailSheet";
import TransactionEntryDialog from "../components/TransactionEntryDialog";
import BankAvatar from "../components/ui/BankAvatar";
import EmptyState from "../components/ui/EmptyState";
import Money from "../components/ui/Money";
import SectionHeader from "../components/ui/SectionHeader";
import { billAmountOf, billMonthOf, limitColor } from "../services/cards/cardService";
import { bankInfo } from "../utils/banks";
import { MONTHS, MONTHS_SHORT, getFirstName, isInMonth } from "../utils/format";
import { finance } from "../theme";

// Card purchases not linked to any card (manual ones without a card, or a deleted card)
const UNASSIGNED = "__unassigned";
const NO_BANK = "__none";

const round2 = (n) => Math.round(n * 100) / 100;
const sameMonth = (ym, year, month) => !!ym && ym.year === year && ym.month === month;

/**
 * "Cartões": each card's bill for the selected month (purchases minus
 * refunds, against its limit and last month), plus spending per bank.
 */
export default function Cards() {
  const { currentAccount, members, transactions, accounts } = useAccount();
  const { selectedMonth, selectedYear } = useDate();
  const { byId: categoriesById } = useCategoryLookup();
  const { cards, byId: cardsById, loading } = useCards(accounts.map((a) => a.id));
  const { openCreate } = useOutletContext();
  const currentUserId = auth.currentUser?.uid;

  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editCardOpen, setEditCardOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [editTxOpen, setEditTxOpen] = useState(false);

  const prev = new Date(selectedYear, selectedMonth - 1, 1);

  /* -------------------- Bills per card -------------------- */
  const bills = useMemo(() => {
    const byCard = {};
    const billOf = (id) => (byCard[id] = byCard[id] || { id, items: [], total: 0, prevTotal: 0 });
    // This account's cards always show; other accounts' cards only when used here
    cards.filter((c) => c.accountId === currentAccount?.id).forEach((c) => billOf(c.id));

    transactions
      .filter((tx) => tx.accountId === currentAccount?.id && tx.method === "credit_card")
      .forEach((tx) => {
        const card = cardsById[tx.cardId];
        const ym = billMonthOf(tx, card);
        if (sameMonth(ym, selectedYear, selectedMonth)) {
          const bill = billOf(card ? card.id : UNASSIGNED);
          bill.items.push(tx);
          bill.total += billAmountOf(tx);
        } else if (sameMonth(ym, prev.getFullYear(), prev.getMonth())) {
          billOf(card ? card.id : UNASSIGNED).prevTotal += billAmountOf(tx);
        }
      });

    return Object.values(byCard)
      .filter((b) => b.id !== UNASSIGNED || b.items.length)
      .map((b) => ({ ...b, total: round2(b.total), prevTotal: round2(b.prevTotal) }))
      .sort((a, b) => Number(a.id === UNASSIGNED) - Number(b.id === UNASSIGNED) || b.total - a.total);
    // prev is derived from the selected month
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, cards, cardsById, currentAccount?.id, selectedMonth, selectedYear]);

  const billsTotal = round2(bills.reduce((s, b) => s + b.total, 0));

  /* -------------------- Spending per bank -------------------- */
  const banks = useMemo(() => {
    const totals = {};
    transactions
      .filter((tx) => tx.accountId === currentAccount?.id)
      .forEach((tx) => {
        let amount;
        if (tx.method === "credit_card") {
          if (!sameMonth(billMonthOf(tx, cardsById[tx.cardId]), selectedYear, selectedMonth)) return;
          amount = billAmountOf(tx);
        } else {
          if (tx.classification !== "expense" || !isInMonth(tx.date, selectedMonth, selectedYear)) return;
          amount = Number(tx.amount) || 0;
        }
        const bank = tx.bank || cardsById[tx.cardId]?.bank || NO_BANK;
        totals[bank] = (totals[bank] || 0) + amount;
      });

    return Object.entries(totals)
      .map(([bank, total]) => ({ bank, total: round2(total) }))
      .filter((b) => b.total > 0)
      .sort((a, b) => Number(a.bank === NO_BANK) - Number(b.bank === NO_BANK) || b.total - a.total);
  }, [transactions, cardsById, currentAccount?.id, selectedMonth, selectedYear]);

  const topBank = Math.max(...banks.map((b) => b.total), 1);

  const selectedBill = bills.find((b) => b.id === selectedId) || null;
  const selectedCard = cardsById[selectedId] || null;
  const memberName = (id) => {
    const m = members.find((x) => x.id === id);
    return m ? getFirstName(m.name, m.email) : null;
  };

  if (!currentAccount?.id) {
    return (
      <EmptyState
        icon={PersonOutline}
        title="Nenhuma conta selecionada"
        description="Selecione uma conta para ver seus cartões."
      />
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {/* CARDS */}
      {bills.length === 0 ? (
        <Paper variant="outlined">
          <EmptyState
            icon={CreditCardOutlined}
            title="Acompanhe seus cartões"
            description="Importe uma fatura ou cadastre um cartão para ver quanto cada um gastou no mês e quanto do limite já usou."
            actionLabel="Adicionar cartão"
            onAction={() => openCreate("card")}
          />
        </Paper>
      ) : (
        <Box>
          <Box display="flex" alignItems="baseline" justifyContent="space-between" mb={1.5}>
            <Typography variant="subtitle1">Faturas de {MONTHS[selectedMonth].toLowerCase()}</Typography>
            <Money value={billsTotal} variant="subtitle1" fontWeight={700} />
          </Box>

          <Box display="flex" flexDirection="column" gap={1.5}>
            {bills.map((bill) => {
              const card = cardsById[bill.id];
              const limit = Number(card?.limit) || 0;
              const pct = limit ? Math.round((bill.total / limit) * 100) : 0;
              const change = bill.prevTotal > 0 ? Math.round(((bill.total - bill.prevTotal) / bill.prevTotal) * 100) : null;
              const meta = card
                ? [
                    card.last4?.length ? `final ${card.last4.join(", ")}` : null,
                    memberName(card.ownerId),
                    card.dueDay ? `vence dia ${card.dueDay}` : null,
                  ].filter(Boolean)
                : ["Compras no cartão sem cartão definido"];

              return (
                <Paper
                  key={bill.id}
                  variant="outlined"
                  component={ButtonBase}
                  onClick={() => {
                    setSelectedId(bill.id);
                    setDetailOpen(true);
                  }}
                  sx={{ p: 2, display: "block", width: "100%", textAlign: "left" }}
                >
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <BankAvatar bank={card?.bank} fallback="card" />
                    <Box flex={1} minWidth={0}>
                      <Typography fontWeight={600} noWrap>
                        {card?.name || "Cartão não identificado"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap component="div">
                        {meta.join(" · ") || `${bill.items.length} lançamentos`}
                      </Typography>
                    </Box>
                    <Box textAlign="right" flexShrink={0}>
                      <Money value={bill.total} component="div" variant="subtitle1" fontWeight={700} />
                      {change !== null && (
                        <Typography
                          variant="caption"
                          fontWeight={600}
                          sx={{ color: change > 0 ? finance.expense : finance.revenue, fontVariantNumeric: "tabular-nums" }}
                        >
                          {change > 0 ? "▲" : "▼"} {Math.abs(change)}% vs {MONTHS_SHORT[prev.getMonth()].toLowerCase()}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {limit > 0 && (
                    <Box mt={1.75}>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(pct, 100)}
                        color={limitColor(pct)}
                        sx={{ height: 8 }}
                      />
                      <Typography variant="caption" color="text.secondary" component="div" mt={0.5}>
                        {pct}% do limite
                      </Typography>
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Box>
        </Box>
      )}

      {/* BANKS */}
      {banks.length > 0 && (
        <Box>
          <SectionHeader title="Gastos por banco" />
          <Paper variant="outlined" sx={{ overflow: "hidden" }}>
            {banks.map((b, i) => (
              <Box key={b.bank}>
                {i > 0 && <Divider sx={{ ml: 8 }} />}
                <Box display="flex" alignItems="center" gap={1.5} px={2} py={1.5}>
                  <BankAvatar bank={b.bank === NO_BANK ? "other" : b.bank} size={36} />
                  <Box flex={1} minWidth={0}>
                    <Box display="flex" justifyContent="space-between" mb={0.75}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {b.bank === NO_BANK ? "Banco não informado" : bankInfo(b.bank).name}
                      </Typography>
                      <Money value={b.total} variant="body2" fontWeight={600} />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(b.total / topBank) * 100}
                      sx={{ height: 6, opacity: b.bank === NO_BANK ? 0.5 : 1 }}
                    />
                  </Box>
                </Box>
              </Box>
            ))}
          </Paper>
          <Typography variant="caption" color="text.secondary" component="div" mt={1} px={0.5}>
            Despesas do mês por banco de origem; no cartão, a fatura do mês.
          </Typography>
        </Box>
      )}

      <CardDetailSheet
        open={detailOpen && !!selectedBill}
        onClose={() => setDetailOpen(false)}
        card={selectedCard}
        bill={selectedBill}
        members={members}
        categoriesById={categoriesById}
        monthLabel={`${MONTHS[selectedMonth].toLowerCase()} de ${selectedYear}`}
        onEdit={() => {
          setDetailOpen(false);
          setEditCardOpen(true);
        }}
        onEditTx={(tx) => {
          setEditingTx(tx);
          setEditTxOpen(true);
        }}
      />

      <AddCardDialog
        open={editCardOpen}
        onClose={() => setEditCardOpen(false)}
        currentAccount={currentAccount}
        members={members}
        currentUserId={currentUserId}
        card={selectedCard}
      />

      <TransactionEntryDialog
        open={editTxOpen}
        onClose={() => setEditTxOpen(false)}
        currentAccount={currentAccount}
        members={members}
        currentUserId={currentUserId}
        initialData={editingTx}
        mode="edit"
      />
    </Box>
  );
}
