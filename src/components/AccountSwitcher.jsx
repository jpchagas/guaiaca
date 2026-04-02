import {
  Box,
  Typography,
  CircularProgress,
  Drawer,
  Divider,
  Button,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useState, useMemo, useEffect } from "react";

import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function AccountSwitcher({
  accounts = [],
  currentAccountId,
  onChange,
  onCreateAccount,
  loading = false,
}) {
  const [open, setOpen] = useState(false);
  const [balances, setBalances] = useState({});

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

  // 🔥 LIVE BALANCE LISTENER (per account)
  useEffect(() => {
    if (!accounts.length) return;

    const unsubscribes = accounts.map((acc) => {
      const q = query(
        collection(db, "transactions"),
        where("accountId", "==", acc.id)
      );

      return onSnapshot(q, (snapshot) => {
        let total = 0;

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const amount = Number(data.amount) || 0;

          if (data.classification === "expense") total -= amount;
          else total += amount;
        });

        setBalances((prev) => ({
          ...prev,
          [acc.id]: total,
        }));
      });
    });

    return () => unsubscribes.forEach((u) => u());
  }, [accounts]);

  return (
    <>
      {/* TRIGGER */}
      <Box
        onClick={() => !loading && setOpen(true)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 1.5,
          py: 0.75,
          borderRadius: 3,
          cursor: loading ? "default" : "pointer",
        }}
      >
        <Typography variant="caption" sx={{ opacity: 0.6 }}>
          Account
        </Typography>

        <Typography variant="subtitle2" fontWeight={600}>
          {loading ? (
            <CircularProgress size={14} />
          ) : currentAccount ? (
            currentAccount.name
          ) : (
            "No account"
          )}
        </Typography>

        {!loading && <KeyboardArrowDownIcon fontSize="small" />}
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
                const balance = balances[acc.id] || 0;

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
                      backgroundColor: selected
                        ? "rgba(0,0,0,0.06)"
                        : "transparent",
                    }}
                  >
                    <Box>
                      <Typography fontWeight={600}>
                        {acc.name || "Unnamed"}
                      </Typography>

                      <Typography variant="caption" opacity={0.6}>
                        ${balance.toFixed(2)}
                      </Typography>
                    </Box>

                    {selected && <Typography>✓</Typography>}
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