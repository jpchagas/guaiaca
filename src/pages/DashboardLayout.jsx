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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Container,
} from "@mui/material";

import { Logout, Home, AccountBalanceWallet, Settings } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";

import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { collection, addDoc, doc, serverTimestamp, setDoc, arrayUnion, updateDoc } from "firebase/firestore";

import { parseFile } from "../services/parsers/parseFile";
import { ingestTransactionsList } from "../services/ingestion/ingestTransactionsList";

import AccountSwitcher from "../components/AccountSwitcher";
import { useAccount } from "../context/AccountContext";

export default function DashboardLayout() {
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [error, setError] = useState(null);
  const { accounts = [], currentAccount, switchAccount, setAccounts, loading } = useAccount();
  const [formData, setFormData] = useState({ description: "", amount: "", category: "", date: "" });

  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

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

  const handleCreateAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const newAccountRef = doc(collection(db, "accounts"));

      await setDoc(newAccountRef, {
        name: "New Account",
        members: [currentUser.uid],
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "users", currentUser.uid), {
        accounts: arrayUnion(newAccountRef.id),
      });

      // Update context safely
      setAccounts(prev => [...(prev || []), { id: newAccountRef.id, name: "New Account" }]);
      switchAccount(newAccountRef.id);
    } catch (err) {
      console.error("Error creating account:", err);
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!currentAccount) {
      setError("No account selected");
      return;
    }

    setError(null);

    try {
      const parsedTransactions = await parseFile(selectedFile);

      if (Array.isArray(parsedTransactions) && parsedTransactions.length > 0) {
        const enriched = parsedTransactions.map((tx) => ({
          ...tx,
          accountId: currentAccount.id,
          createdAt: serverTimestamp(),
        }));
        await ingestTransactionsList(enriched);
      } else {
        setError("No valid transactions found.");
      }
    } catch (err) {
      setError(err.message || "Unexpected error");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleManualSubmit = async () => {
    try {
      if (!currentAccount) {
        setError("No account selected");
        return;
      }

      await addDoc(collection(db, "transactions"), {
        ...formData,
        amount: parseFloat(formData.amount) || 0,
        accountId: currentAccount.id,
        createdAt: serverTimestamp(),
      });

      setManualDialogOpen(false);
      setFormData({ description: "", amount: "", category: "", date: "" });
    } catch (err) {
      console.error(err);
      setError("Error adding transaction");
    }
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
      {/* TOP BAR */}
      <AppBar position="fixed">
        <Toolbar sx={{ position: "relative" }}>
          <Typography variant="h6" fontWeight={600}>{getPageTitle()}</Typography>

          {/* Account Switcher */}
          <Box sx={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
            <AccountSwitcher
              accounts={accounts || []}
              currentAccountId={currentAccount?.id}
              onChange={switchAccount}
              onCreateAccount={handleCreateAccount}
            />
          </Box>

          <Box sx={{ marginLeft: "auto" }}>
            <IconButton onClick={handleLogout}><Logout /></IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* CONTENT */}
      <Box sx={{ flex: 1, mt: 8, mb: 12 }}>
        <Container maxWidth="sm" sx={{ px: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Outlet />
          </Box>
        </Container>
      </Box>

      {/* BOTTOM NAV */}
      <Paper sx={{ position: "fixed", bottom: 0, left: 0, right: 0, borderTop: "1px solid rgba(0,0,0,0.06)" }} elevation={0}>
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

      {/* FAB */}
      <Fab onClick={() => setManualDialogOpen(true)} sx={{ position: "fixed", bottom: 88, right: 20 }}>
        <AddIcon />
      </Fab>

      {/* DIALOG */}
      <Dialog open={manualDialogOpen} onClose={() => setManualDialogOpen(false)} fullWidth>
        <DialogTitle>Add Transaction</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <Button variant="outlined" onClick={() => fileInputRef.current.click()}>Upload File</Button>
          <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} />
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Description" name="description" value={formData.description} onChange={handleFormChange} />
          <TextField label="Amount" name="amount" type="number" value={formData.amount} onChange={handleFormChange} />
          <TextField label="Category" name="category" value={formData.category} onChange={handleFormChange} />
          <TextField label="Date" name="date" type="date" InputLabelProps={{ shrink: true }} value={formData.date} onChange={handleFormChange} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setManualDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleManualSubmit}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}