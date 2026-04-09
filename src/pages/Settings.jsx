import {
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";

import { useAccount } from "../context/AccountContext";

export default function Settings() {
  const {
    currentAccount,
    account,
    members,
    loading,
  } = useAccount();

  // ⏳ LOADING
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  // 🚫 NO ACCOUNT
  if (!currentAccount?.id) {
    return (
      <Box textAlign="center" mt={8}>
        <Typography color="text.secondary">
          Select an account to manage settings
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Account Settings
      </Typography>

      {/* 🏦 ACCOUNT INFO */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Account Name
        </Typography>

        <Typography variant="h6">
          {account?.name || "Unnamed Account"}
        </Typography>
      </Box>

      {/* 👥 MEMBERS (READ-ONLY NOW) */}
      <Typography variant="subtitle1" gutterBottom>
        Members
      </Typography>

      {!members.length ? (
        <Typography color="text.secondary">
          No members yet.
        </Typography>
      ) : (
        <List dense>
          {members.map((m, i) => (
            <Box key={m.id}>
              <ListItem>
                <ListItemText
                  primary={m.name || "Unnamed User"}
                  secondary={m.email || m.id}
                />
              </ListItem>
              {i < members.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}
    </Box>
  );
}