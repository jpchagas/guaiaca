import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AccountBalanceOutlined, CreditCardOutlined } from "@mui/icons-material";

import { bankInfo } from "../../utils/banks";

/** Bank logo, or a neutral icon for unknown banks ("card" shows a card instead). */
export default function BankAvatar({ bank, size = 40, fallback = "bank" }) {
  const info = bankInfo(bank);
  const Icon = fallback === "card" ? CreditCardOutlined : AccountBalanceOutlined;

  return (
    <Box
      sx={(theme) => ({
        width: size,
        height: size,
        borderRadius: `${Math.round(size * 0.3)}px`,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        bgcolor: info.logo ? "#fff" : alpha(theme.palette.secondary.main, 0.07),
        border: "1px solid",
        borderColor: "divider",
        color: "text.secondary",
      })}
    >
      {info.logo ? (
        <Box component="img" src={info.logo} alt={info.name} sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
      ) : (
        <Icon sx={{ fontSize: size * 0.5 }} />
      )}
    </Box>
  );
}
