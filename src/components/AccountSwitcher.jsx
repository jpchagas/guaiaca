import {
  Box,
  Typography,
  CircularProgress,
  Drawer,
  Divider,
  Button,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useState, useMemo } from "react";

import { useAccount } from "../context/AccountContext";

export default function AccountSwitcher({
  accounts = [],
  currentAccountId,
  onChange,
  onCreateAccount,
  loading = false,
}) {
  const [open, setOpen] = useState(false);
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
    setOpen(false);
  };

  const getColor = (value) => {
    if (value > 0) return "success.main";
    if (value < 0) return "error.main";
    return "text.secondary";
  };

  return (
    <>
      {/* TRIGGER */}
      <Box
        onClick={() => !loading && setOpen(true)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 0.75,
          borderRadius: 3,
          cursor: loading ? "default" : "pointer",
        }}
      >
        {loading ? (
          <CircularProgress size={14} />
        ) : (
          <>
            <Box>
              <Typography variant="caption" sx={{ opacity: 0.6 }}>
                Account
              </Typography>

              <Typography variant="subtitle2" fontWeight={600}>
                {currentAccount?.name || "No account"}
              </Typography>
            </Box>

            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: getColor(
                  balancesByAccountId[currentAccountId]?.balance || 0
                ),
              }}
            >
              $
              {(
                balancesByAccountId[currentAccountId]?.balance || 0
              ).toFixed(2)}
            </Typography>

            <KeyboardArrowDownIcon fontSize="small" />
          </>
        )}
      </Box>

      {/* DRAWER */}
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
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
              setOpen(false);
              onCreateAccount?.();
            }}
          >
            + Create Account
          </Button>
        </Box>
      </Drawer>
    </>
  );
}