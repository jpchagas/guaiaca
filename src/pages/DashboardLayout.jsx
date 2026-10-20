import { useState } from "react";
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
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  CircularProgress,
} from "@mui/material";

import {
  Logout,
  HomeOutlined,
  Home,
  ReceiptLongOutlined,
  ReceiptLong,
  DonutLargeOutlined,
  DonutLarge,
  FlagOutlined,
  Flag,
  Add as AddIcon,
} from "@mui/icons-material";

import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

import CreateAccountDialog from "../components/CreateAccountDialog";
import ContextHeader from "../components/ContextHeader";
import AccountSwitcher from "../components/AccountSwitcher";
import DateSwitcher from "../components/DateSwitcher";
import AddBudgetDialog from "../components/AddBudgetDialog";
import AddGoalDialog from "../components/AddGoalDialog";
import TransactionEntryDialog from "../components/TransactionEntryDialog";

import { useAccount } from "../context/AccountContext";
import { getFirstName, getInitials } from "../utils/format";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Início", icon: HomeOutlined, activeIcon: Home },
  { path: "/dashboard/transactions", label: "Transações", icon: ReceiptLongOutlined, activeIcon: ReceiptLong },
  { path: "/dashboard/budget", label: "Orçamento", icon: DonutLargeOutlined, activeIcon: DonutLarge },
  { path: "/dashboard/goals", label: "Metas", icon: FlagOutlined, activeIcon: Flag },
];

const FAB_LABELS = {
  transaction: "Nova transação",
  budget: "Novo orçamento",
  goal: "Nova meta",
};

export default function DashboardLayout() {
  // Which create/edit sheet is open: "transaction" | "budget" | "goal" | null
  const [activeSheet, setActiveSheet] = useState(null);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [accountDrawerOpen, setAccountDrawerOpen] = useState(false);
  const [dateDrawerOpen, setDateDrawerOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

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

  const currentUser = auth.currentUser;
  const currentUserId = currentUser?.uid;
  const me = members.find((m) => m.id === currentUserId);
  const displayName = me?.name || currentUser?.displayName || "";
  const email = me?.email || currentUser?.email || "";

  const handleLogout = async () => {
    setUserMenuAnchor(null);
    await signOut(auth);
    navigate("/");
  };

  /* -------------------- Pages -------------------- */

  const navIndex = Math.max(
    NAV_ITEMS.findIndex((item, i) =>
      i === 0
        ? location.pathname === "/dashboard" ||
          location.pathname === "/dashboard/"
        : location.pathname.startsWith(item.path)
    ),
    0
  );

  const pageTitle =
    navIndex === 0
      ? `Olá${getFirstName(displayName, email) ? `, ${getFirstName(displayName, email)}` : ""}`
      : NAV_ITEMS[navIndex].label;

  const fabAction =
    navIndex === 2 ? "budget" : navIndex === 3 ? "goal" : "transaction";

  const openCreate = (kind) => {
    if (!currentAccount?.id) return;
    setActiveSheet(kind);
  };

  if (loading) {
    return (
      <Box
        sx={{
          height: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <CircularProgress size={28} />
        <Typography variant="body2" color="text.secondary">
          Carregando suas contas…
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      {/* APP BAR */}
      <AppBar position="sticky">
        <Container maxWidth="sm" disableGutters>
          <Toolbar sx={{ minHeight: { xs: 56 }, pt: 0.5 }}>
            <Typography variant="h6" fontWeight={700} noWrap sx={{ flex: 1 }}>
              {pageTitle}
            </Typography>

            <IconButton
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              aria-label="Menu da conta"
              sx={{ p: 0.5, mr: -0.5 }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  fontSize: 14,
                  fontWeight: 700,
                  bgcolor: "secondary.main",
                }}
              >
                {getInitials(displayName, email)}
              </Avatar>
            </IconButton>
          </Toolbar>

          <Box sx={{ px: 2, pb: 1.5 }}>
            <ContextHeader
              onOpenAccount={() => setAccountDrawerOpen(true)}
              onOpenDate={() => setDateDrawerOpen(true)}
            />
          </Box>
        </Container>
      </AppBar>

      <Menu
        anchorEl={userMenuAnchor}
        open={!!userMenuAnchor}
        onClose={() => setUserMenuAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 240, mt: 1 } } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" noWrap>
            {displayName || "Sua conta"}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ py: 1.25, mt: 0.5 }}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Sair
        </MenuItem>
      </Menu>

      {/* CONTENT */}
      <Box sx={{ flex: 1, pt: 2, pb: "calc(140px + env(safe-area-inset-bottom))" }}>
        <Container maxWidth="sm">
          <Outlet context={{ openCreate }} />
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
      <Paper
        square
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          borderTop: "1px solid",
          borderColor: "divider",
          pb: "env(safe-area-inset-bottom)",
          backgroundColor: "rgba(255,255,255,0.92)",
          backdropFilter: "saturate(180%) blur(14px)",
        }}
      >
        <Container maxWidth="sm" disableGutters>
          <BottomNavigation
            showLabels
            value={navIndex}
            onChange={(e, newValue) => navigate(NAV_ITEMS[newValue].path)}
          >
            {NAV_ITEMS.map((item, i) => {
              const Icon = i === navIndex ? item.activeIcon : item.icon;
              return (
                <BottomNavigationAction
                  key={item.path}
                  label={item.label}
                  icon={<Icon />}
                />
              );
            })}
          </BottomNavigation>
        </Container>
      </Paper>

      {/* FAB */}
      <Fab
        color="primary"
        onClick={() => openCreate(fabAction)}
        disabled={!currentAccount?.id}
        aria-label={FAB_LABELS[fabAction]}
        sx={{
          position: "fixed",
          bottom: "calc(84px + env(safe-area-inset-bottom))",
          right: { xs: 20, sm: "calc(50% - 280px)" },
        }}
      >
        <AddIcon />
      </Fab>

      {/* DIALOGS */}
      <CreateAccountDialog
        open={createAccountOpen}
        onClose={() => setCreateAccountOpen(false)}
        onSuccess={(id) => switchAccount(id)}
      />

      <TransactionEntryDialog
        open={activeSheet === "transaction"}
        onClose={() => setActiveSheet(null)}
        currentAccount={currentAccount}
        members={members}
        currentUserId={currentUserId}
      />

      <AddBudgetDialog
        open={activeSheet === "budget"}
        onClose={() => setActiveSheet(null)}
        currentAccount={currentAccount}
      />

      <AddGoalDialog
        open={activeSheet === "goal"}
        onClose={() => setActiveSheet(null)}
      />
    </Box>
  );
}
