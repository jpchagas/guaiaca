import {
  Box,
  Typography,
  CircularProgress,
  Drawer,
  Divider,
  Button,
} from "@mui/material";
import { useMemo } from "react";

import { useAccount } from "../context/AccountContext";

export default function AccountSwitcher({
  accounts = [],
  currentAccountId,
  onChange,
  onCreateAccount,
  loading = false,
  open,        // ✅ controlled
  onClose,     // ✅ controlled
}) {
  const { balancesByAccountId } = useAccount();

  const currentAccount = useMemo(
    () =>
      Array.isArray(accounts)
        ? accounts.find((acc) => acc.id === currentAccountId)
        : null,
    [accounts, currentAccountId]
  );

  const handleSelect = (accountId) => {
    if (accountId && accountId !== currentAccountId) {
      onChange(accountId);
    }
    onClose(); // ✅ close drawer
  };

  const getColor = (value) => {
    if (value > 0) return "success.main";
    if (value < 0) return "error.main";
    return "text.secondary";
  };

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          pb: 2,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} mb={1}>
          Select Account
        </Typography>

        {loading ? (
          <CircularProgress />
        ) : (
          <Box display="flex" flexDirection="column" gap={1}>
            {accounts.map((acc) => {
              const selected = acc.id === currentAccountId;
              const balance =
                balancesByAccountId[acc.id]?.balance || 0;

              return (
                <Box
                  key={acc.id}
                  onClick={() => handleSelect(acc.id)}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: selected
                      ? "rgba(0,0,0,0.06)"
                      : "transparent",
                    borderLeft: selected
                      ? "3px solid #1976d2"
                      : "3px solid transparent",
                  }}
                >
                  <Typography fontWeight={600}>
                    {acc.name || "Unnamed"}
                  </Typography>

                  <Typography
                    fontWeight={600}
                    sx={{ color: getColor(balance) }}
                  >
                    ${balance.toFixed(2)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        <Button
          fullWidth
          variant="outlined"
          onClick={() => {
            onClose(); // ✅ close first
            onCreateAccount?.();
          }}
        >
          + Create Account
        </Button>
      </Box>
    </Drawer>
  );
}