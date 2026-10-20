import { Box, ButtonBase, Typography } from "@mui/material";

import CategoryAvatar from "./ui/CategoryAvatar";
import Money from "./ui/Money";
import { finance } from "../theme";
import { METHOD_LABELS } from "../utils/format";

export default function TransactionRow({ tx, category, onClick, showDate }) {
  const isRevenue = tx.classification === "revenue";
  const color = isRevenue
    ? finance.revenue
    : tx.classification === "investment"
    ? finance.investment
    : "text.primary";

  const meta = [
    category?.name || "Sem categoria",
    tx.method === "credit_card" ? "Cartão" : METHOD_LABELS[tx.method],
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
