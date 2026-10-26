import { Box, ButtonBase, Typography } from "@mui/material";

import CategoryAvatar from "./ui/CategoryAvatar";
import Money from "./ui/Money";
import { finance } from "../theme";
import { METHOD_LABELS, formatCurrency } from "../utils/format";

/** "70% de R$ 10.000,00": this part's share of a split income (see split/incomeShare.js). */
function incomeSplitLabel({ part, pct, gross }) {
  const share = part === "shared" ? pct : 1 - pct;
  const percent = String(Math.round(share * 1000) / 10).replace(".", ",");
  return `${percent}% de ${formatCurrency(gross)}`;
}

/** `source` names the card or bank the money moved through (see utils/banks.js sourceLabel). */
export default function TransactionRow({ tx, category, onClick, showDate, source }) {
  const isRevenue = tx.classification === "revenue";
  const color = isRevenue
    ? finance.revenue
    : tx.classification === "investment"
    ? finance.investment
    : "text.primary";

  const meta = [
    category?.name || "Sem categoria",
    tx.method === "credit_card" ? "Cartão" : METHOD_LABELS[tx.method],
    source,
    tx.incomeSplit && incomeSplitLabel(tx.incomeSplit),
    tx.installment ? `${tx.installment.current}/${tx.installment.total}` : null,
    showDate,
  ].filter(Boolean);

  return (
    <ButtonBase
      onClick={onClick}
      disabled={!onClick}
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.5,
        textAlign: "left",
        "&:hover": { backgroundColor: "action.hover" },
      }}
    >
      <CategoryAvatar category={category} />

      <Box flex={1} minWidth={0}>
        <Typography fontWeight={600} noWrap>
          {tx.description || category?.name || "Sem descrição"}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap component="div">
          {meta.join(" · ")}
        </Typography>
      </Box>

      <Money
        value={tx.amount}
        sign={isRevenue ? "plus" : "minus"}
        fontWeight={600}
        sx={{ color }}
      />
    </ButtonBase>
  );
}
