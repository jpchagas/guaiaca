import {
  Box,
  Menu,
  MenuItem,
  Typography,
  IconButton,
  Divider,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useState, useMemo } from "react";

export default function AccountSwitcher({
  accounts,
  currentAccountId,
  onChange,
  onCreateAccount,
}) {
  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  const currentAccount = useMemo(
    () => accounts.find((acc) => acc.id === currentAccountId),
    [accounts, currentAccountId]
  );

  const handleSelect = (accountId) => {
    onChange(accountId);
    handleClose();
  };

  const handleOpen = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Box display="flex" alignItems="center">
        <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
          Account
        </Typography>

        <Box display="flex" alignItems="center" ml={1}>
          <Typography variant="subtitle1" fontWeight={600}>
            {currentAccount?.name || "Select"}
          </Typography>

          <IconButton size="small" onClick={handleOpen}>
            <KeyboardArrowDownIcon />
          </IconButton>
        </Box>
      </Box>

      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {accounts.map((acc) => (
          <MenuItem
            key={acc.id}
            selected={acc.id === currentAccountId}
            onClick={() => handleSelect(acc.id)}
          >
            {acc.name || "Unnamed Account"}
          </MenuItem>
        ))}

        <Divider />

        <MenuItem
          onClick={() => {
            handleClose();
            onCreateAccount();
          }}
        >
          ➕ Create Account
        </MenuItem>
      </Menu>
    </>
  );
}