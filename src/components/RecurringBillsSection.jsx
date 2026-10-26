import { useEffect, useMemo, useState } from "react";
import {
  Box,
  ButtonBase,
  Chip,
  Divider,
  Paper,
  Typography,
} from "@mui/material";
import { EventRepeatOutlined } from "@mui/icons-material";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";

import AddRecurringBillDialog from "./AddRecurringBillDialog";
import CategoryAvatar from "./ui/CategoryAvatar";
import EmptyState from "./ui/EmptyState";
import Money from "./ui/Money";
import SectionHeader from "./ui/SectionHeader";
import { formatShortDate } from "../utils/format";
import {
  billAppliesTo,
  billStatus,
  daysUntilDue,
  matchBills,
  monthExpenses,
} from "../services/recurring/recurringBillService";

const STATUS = {
  overdue: { label: () => "Atrasada", color: "error" },
  dueToday: { label: () => "Vence hoje", color: "warning" },
  dueSoon: {
    label: (days) => `Vence em ${days} ${days === 1 ? "dia" : "dias"}`,
    color: "warning",
  },
  upcoming: { label: (_, bill) => `Vence dia ${bill.dueDay}`, color: "default" },
  paid: { label: () => "Paga", color: "primary" },
};

// Most urgent first
const ORDER = ["overdue", "dueToday", "dueSoon", "upcoming", "paid"];

/** "Contas fixas" on the Orçamento page: which monthly bills are paid this month. */
export default function RecurringBillsSection({ currentAccount, transactions, categoriesById, year, month, onAdd }) {
  const [bills, setBills] = useState([]);

  // By id, so the open sheet follows live updates (e.g. marked as paid)
  const [selectedId, setSelectedId] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!currentAccount?.id) {
      setBills([]);
      return;
    }

    const q = query(collection(db, "recurringBills"), where("accountId", "==", currentAccount.id));
    const unsubscribe = onSnapshot(
      q,
      (snap) => setBills(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error(err)
    );

    return () => unsubscribe();
  }, [currentAccount?.id]);

  const rows = useMemo(() => {
    const active = bills.filter((b) => billAppliesTo(b, year, month));
    const matches = matchBills(active, monthExpenses(transactions, currentAccount?.id, year, month));
    const today = new Date();

    return active
      .map((bill) => {
        const match = matches[bill.id];
        const status = billStatus(bill, { match, year, month, today });
        return { bill, match, status, days: daysUntilDue(bill, year, month, today) };
      })
      .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || a.bill.dueDay - b.bill.dueDay);
  }, [bills, transactions, currentAccount?.id, year, month]);

  const selected = rows.find((r) => r.bill.id === selectedId) || null;
  const paidCount = rows.filter((r) => r.status === "paid").length;

  return (
    <Box>
      <SectionHeader title="Contas fixas" actionLabel="Adicionar" onAction={onAdd} />

      <Paper variant="outlined" sx={{ overflow: "hidden" }}>
        {rows.length === 0 ? (
          <EmptyState
            compact
            icon={EventRepeatOutlined}
            title="Nenhuma conta fixa"
            description="Cadastre despesas de todo mês, como academia ou aluguel, e avisamos se o pagamento não aparecer até o vencimento."
            actionLabel="Adicionar conta fixa"
            onAction={onAdd}
          />
        ) : (
          <>
            <Box px={2} pt={1.5} pb={0.5}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {paidCount} de {rows.length} {rows.length === 1 ? "paga" : "pagas"} neste mês
              </Typography>
            </Box>
            {rows.map(({ bill, match, status, days }, i) => {
              const info = STATUS[status];
              const category = categoriesById[bill.category];
              return (
                <Box key={bill.id}>
                  {i > 0 && <Divider />}
                  <ButtonBase
                    onClick={() => {
                      setSelectedId(bill.id);
                      setEditOpen(true);
                    }}
                    sx={{ p: 2, display: "flex", gap: 1.5, width: "100%", textAlign: "left" }}
                  >
                    <CategoryAvatar category={category} />
                    <Box flex={1} minWidth={0}>
                      <Typography fontWeight={600} noWrap>
                        {bill.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap component="div">
                        {match
                          ? `${match.description || "Transação"} · ${formatShortDate(match.date)}`
                          : status === "paid"
                          ? "Marcada como paga"
                          : `Dia ${bill.dueDay}${bill.keyword ? ` · “${bill.keyword}”` : ` · ${category?.name || "Sem categoria"}`}`}
                      </Typography>
                    </Box>
                    <Box textAlign="right" flexShrink={0}>
                      <Money value={bill.amount} component="div" variant="body2" fontWeight={600} />
                      <Chip
                        size="small"
                        label={info.label(days, bill)}
                        color={info.color}
                        variant={status === "upcoming" ? "outlined" : "filled"}
                        sx={{ mt: 0.5, height: 22, fontSize: 11 }}
                      />
                    </Box>
                  </ButtonBase>
                </Box>
              );
            })}
          </>
        )}
      </Paper>

      <AddRecurringBillDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        currentAccount={currentAccount}
        bill={selected?.bill || null}
        match={selected?.match || null}
        year={year}
        month={month}
      />
    </Box>
  );
}
