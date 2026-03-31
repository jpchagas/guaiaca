import {
  Box,
  Menu,
  MenuItem,
  Typography,
  Divider,
  CircularProgress,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useState, useMemo } from "react";

export default function AccountSwitcher({
  accounts = [],
  currentAccountId,
  onChange,
  onCreateAccount,
  loading = false,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

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
    handleClose();
  };

  const handleOpen = (e) => {
    if (!loading) setAnchorEl(e.currentTarget); // 🔥 prevent opening while loading
  };

  const handleClose = () => setAnchorEl(null);

  return (
    <>
      {/* TRIGGER */}
      <Box
        onClick={handleOpen}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 1.5,
          py: 0.75,
          borderRadius: 3,
          cursor: loading ? "default" : "pointer",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: loading
              ? "transparent"
              : "rgba(255,255,255,0.08)",
          },
        }}
      >
        {/* Label */}
        <Typography
          variant="caption"
          sx={{ opacity: 0.6, mr: 0.5 }}
        >
          Account
        </Typography>

        {/* Name / Loading */}
        <Typography
          variant="subtitle2"
          fontWeight={600}
          sx={{
            maxWidth: 140,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
          }}
        >
          {loading ? (
            <CircularProgress size={14} />
          ) : currentAccount ? (
            currentAccount.name
          ) : (
            "No account"
          )}
        </Typography>

        {/* Arrow */}
        {!loading && (
          <KeyboardArrowDownIcon
            fontSize="small"
            sx={{ opacity: 0.7 }}
          />
        )}
      </Box>

      {/* MENU */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 220,
            borderRadius: 3,
            boxShadow: "0px 8px 24px rgba(0,0,0,0.12)",
          },
        }}
      >
        {/* 🔄 Loading state */}
        {loading ? (
          <MenuItem>
            <CircularProgress size={16} sx={{ mr: 1 }} />
            <Typography>Loading accounts...</Typography>
          </MenuItem>
        ) : accounts.length > 0 ? (
          /* 🏦 Accounts list */
          accounts.map((acc) => (
            <MenuItem
              key={acc.id}
              selected={acc.id === currentAccountId}
              onClick={() => handleSelect(acc.id)}
              sx={{
                fontWeight: acc.id === currentAccountId ? 600 : 400,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Typography noWrap>
                {acc.name || "Unnamed Account"}
              </Typography>

              {acc.id === currentAccountId && (
                <Typography
                  fontSize={12}
                  color="primary"
                  sx={{ ml: 1 }}
                >
                  ✓
                </Typography>
              )}
            </MenuItem>
          ))
        ) : (
          /* 🚫 Empty state */
          <MenuItem disabled>
            <Typography color="text.secondary">
              No accounts found
            </Typography>
          </MenuItem>
        )}

        <Divider />

        {/* ➕ Create Account */}
        <MenuItem
          onClick={() => {
            handleClose();
            onCreateAccount?.();
          }}
          sx={{
            color: "primary.main",
            fontWeight: 600,
          }}
        >
          ➕ Create Account
        </MenuItem>
      </Menu>
    </>
  );
}