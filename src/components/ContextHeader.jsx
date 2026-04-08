import {
  Box,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import { useAccount } from "../context/AccountContext";
import { useDate } from "../context/DateContext";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

export default function ContextHeader({ onOpenAccount, onOpenDate }) {
  const {
    currentAccount,
    currentAccountId,
    balancesByAccountId,
  } = useAccount();

  const { selectedMonth, selectedYear } = useDate();

  const balance =
    balancesByAccountId[currentAccountId]?.balance || 0;

  const getColor = (value) => {
    if (value > 0) return "success.main";
    if (value < 0) return "error.main";
    return "text.secondary";
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: "pointer",
      }}
    >
      {/* ACCOUNT */}
      <Box
        onClick={onOpenAccount}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          {currentAccount?.name || "No account"}
        </Typography>

        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{ color: getColor(balance) }}
        >
          ${balance.toFixed(2)}
        </Typography>

        <KeyboardArrowDownIcon fontSize="small" />
      </Box>

      {/* DATE */}
      <Box
        onClick={onOpenDate}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          {MONTHS[selectedMonth]} {selectedYear}
        </Typography>

        <KeyboardArrowDownIcon fontSize="small" />
      </Box>
    </Box>
  );
}