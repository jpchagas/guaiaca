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
  PieChart,
  Flag, // ✅ NEW
} from "@mui/icons-material";

import AddIcon from "@mui/icons-material/Add";

import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

import CreateAccountDialog from "../components/CreateAccountDialog";
import ContextHeader from "../components/ContextHeader";
import AccountSwitcher from "../components/AccountSwitcher";
import DateSwitcher from "../components/DateSwitcher";
import AddBudgetDialog from "../components/AddBudgetDialog";
import TransactionEntryDialog from "../components/TransactionEntryDialog";

import { useAccount } from "../context/AccountContext";

export default function DashboardLayout() {
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
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

  const currentUserId = auth.currentUser?.uid;

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  /* -------------------- Pages -------------------- */

  const isTransactionsPage = location.pathname.includes("transactions");
  const isBudgetPage = location.pathname.includes("budget");
  const isGoalsPage = location.pathname.includes("goals"); // ✅ NEW

  const getPageTitle = () => {
    if (isTransactionsPage) return "Transactions";
    if (isBudgetPage) return "Budget";
    if (isGoalsPage) return "Goals";
    return "Overview";
  };

  const getNavIndex = () => {
    if (isTransactionsPage) return 1;
    if (isBudgetPage) return 2;
    if (isGoalsPage) return 3;
    return 0;
  };

  /* -------------------- FAB -------------------- */

  const handleFabClick = () => {
    if (isTransactionsPage) setManualDialogOpen(true);
    if (isBudgetPage) setBudgetDialogOpen(true);
    // Goals FAB can be added later
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <Typography>Loading account...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      {/* APP BAR */}
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" fontWeight={600}>
            {getPageTitle()}
          </Typography>

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

      {/* CONTENT */}
      <Box sx={{ flex: 1, mt: 8, mb: 12 }}>
        <Container maxWidth="sm">
          <Outlet />
        </Container>
      </Box>

      {/* DRAWERS */}
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

      {/* BOTTOM NAV */}
      <Paper sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}>
        <BottomNavigation
          value={getNavIndex()}
          onChange={(e, newValue) => {
            if (newValue === 0) navigate("/dashboard");
            if (newValue === 1) navigate("/dashboard/transactions");
            if (newValue === 2) navigate("/dashboard/budget");
            if (newValue === 3) navigate("/dashboard/goals"); // ✅ NEW
          }}
        >
          <BottomNavigationAction label="Overview" icon={<Home />} />
          <BottomNavigationAction
            label="Transactions"
            icon={<AccountBalanceWallet />}
          />
          <BottomNavigationAction label="Budget" icon={<PieChart />} />
          <BottomNavigationAction label="Goals" icon={<Flag />} /> {/* ✅ NEW */}
        </BottomNavigation>
      </Paper>

      {/* FAB */}
      {(isTransactionsPage || isBudgetPage) && (
        <Fab
          onClick={handleFabClick}
          disabled={!currentAccount?.id}
          sx={{ position: "fixed", bottom: 88, right: 20 }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* DIALOGS */}
      <CreateAccountDialog
        open={createAccountOpen}
        onClose={() => setCreateAccountOpen(false)}
        onSuccess={(id) => switchAccount(id)}
      />

      <TransactionEntryDialog
        open={manualDialogOpen}
        onClose={() => setManualDialogOpen(false)}
        currentAccount={currentAccount}
        members={members}
        currentUserId={currentUserId}
      />

      <AddBudgetDialog
        open={budgetDialogOpen}
        onClose={() => setBudgetDialogOpen(false)}
        currentAccount={currentAccount}
      />
    </Box>
  );
}