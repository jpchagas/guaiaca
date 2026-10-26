import { useMemo } from "react";
import { Box, Button, Divider, LinearProgress, Paper, Typography } from "@mui/material";
import { EditOutlined } from "@mui/icons-material";

import Sheet from "./ui/Sheet";
import BankAvatar from "./ui/BankAvatar";
import Money from "./ui/Money";
import SectionHeader from "./ui/SectionHeader";
import TransactionRow from "./TransactionRow";
import { billAmountOf, limitColor } from "../services/cards/cardService";
import { formatCurrency, formatShortDate, getFirstName, toDate } from "../utils/format";

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * One card's bill for the selected month: total and limit use, the split per
 * card number (additional / virtual cards), top categories and every entry.
 * `card` is null for card purchases not linked to any card.
 */
export default function CardDetailSheet({ open, onClose, card, bill, members = [], categoriesById, monthLabel, onEdit, onEditTx }) {
  const memberName = (id) => {
    const m = members.find((x) => x.id === id);
    return m ? getFirstName(m.name, m.email) : null;
  };

  const { byNumber, byCategory, items } = useMemo(() => {
    const txs = bill?.items || [];

    const numbers = {};
    txs.forEach((tx) => {
      const key = tx.import?.cardLast4 || "";
      const row = (numbers[key] = numbers[key] || { key, total: 0, people: new Set() });
      row.total += billAmountOf(tx);
      const person = memberName(tx.responsibleUserId) || tx.import?.holder;
      if (person) row.people.add(person);
    });

    const categories = {};
    txs.forEach((tx) => {
      categories[tx.category] = (categories[tx.category] || 0) + billAmountOf(tx);
    });

    const purchaseDate = (tx) => toDate(tx.import?.purchaseDate || tx.date) || 0;

    return {
      byNumber: Object.values(numbers).sort((a, b) => b.total - a.total),
      byCategory: Object.entries(categories)
        .map(([id, total]) => ({ id, total: round2(total) }))
        .filter((c) => c.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5),
      items: [...txs].sort((a, b) => purchaseDate(b) - purchaseDate(a)),
    };
    // memberName only reads members
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bill, members]);

  if (!bill) return null;

  const total = round2(bill.total);
  const limit = Number(card?.limit) || 0;
  const pct = limit ? Math.round((total / limit) * 100) : 0;
  const topCategory = byCategory[0]?.total || 1;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={card?.name || "Cartão não identificado"}
      subtitle={`Fatura de ${monthLabel}`}
      actions={
        card && (
          <Button variant="outlined" fullWidth startIcon={<EditOutlined />} onClick={onEdit}>
            Editar cartão
          </Button>
        )
      }
    >
      <Box display="flex" flexDirection="column" gap={3}>
        {/* TOTAL */}
        <Box display="flex" alignItems="center" gap={1.5}>
          <BankAvatar bank={card?.bank} size={48} fallback="card" />
          <Box flex={1} minWidth={0}>
            <Money value={total} component="div" variant="h5" fontWeight={700} />
            <Typography variant="caption" color="text.secondary" component="div">
              {card
                ? [
                    card.last4?.length ? `final ${card.last4.join(", ")}` : null,
                    card.dueDay ? `vence dia ${card.dueDay}` : null,
                    card.closingDay ? `fecha dia ${card.closingDay}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Defina o limite e o ciclo em Editar cartão"
                : "Edite cada transação para escolher o cartão."}
            </Typography>
          </Box>
        </Box>

        {limit > 0 && (
          <Box mt={-1.5}>
            <LinearProgress
              variant="determinate"
              value={Math.min(pct, 100)}
              color={limitColor(pct)}
              sx={{ height: 10 }}
            />
            <Box display="flex" justifyContent="space-between" mt={0.75}>
              <Typography variant="caption" color="text.secondary">
                {pct}% do limite
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
                Limite {formatCurrency(limit)}
              </Typography>
            </Box>
          </Box>
        )}

        {/* PER CARD NUMBER */}
        {byNumber.length > 1 && (
          <Box>
            <SectionHeader title="Por cartão" />
            <Paper variant="outlined" sx={{ overflow: "hidden" }}>
              {byNumber.map((row, i) => (
                <Box key={row.key}>
                  {i > 0 && <Divider />}
                  <Box display="flex" alignItems="center" gap={1.5} px={2} py={1.25}>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" fontWeight={600}>
                        {row.key ? `Final ${row.key}` : "Sem número"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap component="div">
                        {[...row.people].join(", ") || "—"}
                      </Typography>
                    </Box>
                    <Money value={round2(row.total)} variant="body2" fontWeight={600} />
                  </Box>
                </Box>
              ))}
            </Paper>
          </Box>
        )}

        {/* CATEGORIES */}
        {byCategory.length > 0 && (
          <Box>
            <SectionHeader title="Onde mais gastou" />
            <Box display="flex" flexDirection="column" gap={1.25}>
              {byCategory.map((c) => (
                <Box key={c.id}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2">{categoriesById[c.id]?.name || "Sem categoria"}</Typography>
                    <Money value={c.total} variant="body2" fontWeight={600} />
                  </Box>
                  <LinearProgress variant="determinate" value={(c.total / topCategory) * 100} sx={{ height: 6 }} />
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* ENTRIES */}
        <Box>
          <SectionHeader title={`${items.length} ${items.length === 1 ? "lançamento" : "lançamentos"}`} />
          <Paper variant="outlined" sx={{ overflow: "hidden" }}>
            {items.map((tx, i) => (
              <Box key={tx.id}>
                {i > 0 && <Divider sx={{ ml: 9 }} />}
                <TransactionRow
                  tx={tx}
                  category={categoriesById[tx.category]}
                  showDate={formatShortDate(tx.import?.purchaseDate || tx.date)}
                  onClick={() => onEditTx(tx)}
                />
              </Box>
            ))}
          </Paper>
        </Box>
      </Box>
    </Sheet>
  );
}
