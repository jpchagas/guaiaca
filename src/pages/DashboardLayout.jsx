import { useRef, useState } from "react";
import {
AppBar,
Toolbar,
Typography,
IconButton,
Box,
BottomNavigation,
BottomNavigationAction,
Paper,
Fab,
Container,
} from "@mui/material";

import {
Logout,
Home,
AccountBalanceWallet,
Settings,
} from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";

import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

import { parseFile } from "../services/parsers/parseFile";
import { ingestTransactionsList } from "../services/ingestion/ingestTransactionsList";

import CreateAccountDialog from "../components/CreateAccountDialog";
import ContextHeader from "../components/ContextHeader";
import AccountSwitcher from "../components/AccountSwitcher";
import DateSwitcher from "../components/DateSwitcher";
import AddTransactionDialog from "../components/AddTransactionDialog";

import { useAccount } from "../context/AccountContext";

export default function DashboardLayout() {
const [manualDialogOpen, setManualDialogOpen] = useState(false);
const [createAccountOpen, setCreateAccountOpen] = useState(false);

const [accountDrawerOpen, setAccountDrawerOpen] = useState(false);
const [dateDrawerOpen, setDateDrawerOpen] = useState(false);

const {
accounts = [],
currentAccount,
currentAccountId,
switchAccount,
loading,
members,
} = useAccount();

const navigate = useNavigate();
const location = useLocation();
const fileInputRef = useRef(null);

const currentUserId = auth.currentUser?.uid;

const handleLogout = async () => {
await signOut(auth);
navigate("/");
};

const getPageTitle = () => {
if (location.pathname.includes("transactions")) return "Transactions";
if (location.pathname.includes("settings")) return "Settings";
return "Overview";
};

const getNavIndex = () => {
if (location.pathname.includes("transactions")) return 1;
if (location.pathname.includes("settings")) return 2;
return 0;
};

if (loading) {
return ( <Box display="flex" justifyContent="center" mt={10}> <Typography>Loading account...</Typography> </Box>
);
}

return (
<Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}> <AppBar position="fixed"> <Toolbar> <Typography variant="h6" fontWeight={600}>
{getPageTitle()} </Typography>


      <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <ContextHeader
          onOpenAccount={() => setAccountDrawerOpen(true)}
          onOpenDate={() => setDateDrawerOpen(true)}
        />
      </Box>

      <IconButton onClick={handleLogout}>
        <Logout />
      </IconButton>
    </Toolbar>
  </AppBar>

  <Box sx={{ flex: 1, mt: 8, mb: 12 }}>
    <Container maxWidth="sm">
      <Outlet />
    </Container>
  </Box>

  <AccountSwitcher
    accounts={accounts}
    currentAccountId={currentAccountId}
    onChange={switchAccount}
    onCreateAccount={() => setCreateAccountOpen(true)}
    loading={loading}
    open={accountDrawerOpen}
    onClose={() => setAccountDrawerOpen(false)}
  />

  <DateSwitcher
    open={dateDrawerOpen}
    onClose={() => setDateDrawerOpen(false)}
  />

  <Paper sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}>
    <BottomNavigation
      value={getNavIndex()}
      onChange={(e, newValue) => {
        if (newValue === 0) navigate("/dashboard");
        if (newValue === 1) navigate("/dashboard/transactions");
        if (newValue === 2) navigate("/dashboard/settings");
      }}
    >
      <BottomNavigationAction label="Overview" icon={<Home />} />
      <BottomNavigationAction label="Transactions" icon={<AccountBalanceWallet />} />
      <BottomNavigationAction label="Settings" icon={<Settings />} />
    </BottomNavigation>
  </Paper>

  <Fab
    onClick={() => setManualDialogOpen(true)}
    disabled={!currentAccount?.id}
    sx={{ position: "fixed", bottom: 88, right: 20 }}
  >
    <AddIcon />
  </Fab>

  <CreateAccountDialog
    open={createAccountOpen}
    onClose={() => setCreateAccountOpen(false)}
    onSuccess={(id) => switchAccount(id)}
  />

  <AddTransactionDialog
    open={manualDialogOpen}
    onClose={() => setManualDialogOpen(false)}
    currentAccount={currentAccount}
    members={members}
    currentUserId={currentUserId}
  />
</Box>


);
}
