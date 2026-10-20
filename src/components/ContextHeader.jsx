import { Box, ButtonBase, IconButton, Typography } from "@mui/material";
import {
  KeyboardArrowDown,
  ChevronLeft,
  ChevronRight,
  PersonOutline,
  GroupsOutlined,
} from "@mui/icons-material";

import { useAccount } from "../context/AccountContext";
import { useDate } from "../context/DateContext";
import { MONTHS_SHORT } from "../utils/format";

const pillSx = {
  display: "flex",
  alignItems: "center",
  gap: 0.75,
  height: 36,
  px: 1.5,
  borderRadius: 999,
  border: "1px solid",
  borderColor: "divider",
  backgroundColor: "background.paper",
};

export default function ContextHeader({ onOpenAccount, onOpenDate }) {
  const { currentAccount } = useAccount();
  const {
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
  } = useDate();

  const AccountIcon =
    currentAccount?.type === "personal" ? PersonOutline : GroupsOutlined;

  const shiftMonth = (delta) => {
    const next = new Date(selectedYear, selectedMonth + delta, 1);
    setSelectedMonth(next.getMonth());
    setSelectedYear(next.getFullYear());
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {/* ACCOUNT */}
      <ButtonBase
        onClick={onOpenAccount}
        sx={{ ...pillSx, minWidth: 0, flex: 1, justifyContent: "flex-start" }}
        aria-label="Trocar de conta"
      >
        <AccountIcon sx={{ fontSize: 18, color: "primary.main" }} />
        <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1, textAlign: "left" }}>
          {currentAccount?.name || "Selecione uma conta"}
        </Typography>
        <KeyboardArrowDown sx={{ fontSize: 18, color: "text.secondary" }} />
      </ButtonBase>

      {/* MONTH */}
      <Box sx={{ ...pillSx, px: 0.25, gap: 0 }}>
        <IconButton size="small" onClick={() => shiftMonth(-1)} aria-label="Mês anterior">
          <ChevronLeft fontSize="small" />
        </IconButton>

        <ButtonBase
          onClick={onOpenDate}
          sx={{ px: 0.5, borderRadius: 1, height: 28 }}
          aria-label="Escolher mês"
        >
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ minWidth: 64, textAlign: "center", fontVariantNumeric: "tabular-nums" }}
          >
            {MONTHS_SHORT[selectedMonth]} {selectedYear}
          </Typography>
        </ButtonBase>

        <IconButton size="small" onClick={() => shiftMonth(1)} aria-label="Próximo mês">
          <ChevronRight fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
