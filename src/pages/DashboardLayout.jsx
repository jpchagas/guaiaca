import { useRef, useState, useEffect } from "react";
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

import {
  Logout,
  Home,
  AccountBalanceWallet,
  Settings,
} from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";

import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebaseConfig";

import {
  collection,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import { parseFile } from "../services/parsers/parseFile";
import { ingestTransactionsList } from "../services/ingestion/ingestTransactionsList";

export default function DashboardLayout() {
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [error, setError] = useState(null);

  const [currentAccountId, setCurrentAccountId] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loadingAccount, setLoadingAccount] = useState(true);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    date: "",
  });

  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  // ✅ GLOBAL USER + ACCOUNT LOAD
  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          setLoadingAccount(false);
          return;
        }

        const userData = userSnap.data();
        const userAccounts = userData.accounts || [];

        setAccounts(userAccounts);

        const stored = localStorage.getItem("currentAccountId");

        const validAccount =
          stored && userAccounts.includes(stored)
            ? stored
            : userAccounts[0] || null;

        if (validAccount) {
          setCurrentAccountId(validAccount);
          localStorage.setItem("currentAccountId", validAccount);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoadingAccount(false);
      }
    };

    fetchUser();
  }, []);

  // 🔄 Sync if changed somewhere else (Overview)
  useEffect(() => {
    const handleStorageChange = () => {
      const accountId = localStorage.getItem("currentAccountId");
      setCurrentAccountId(accountId);
    };

    window.addEventListener("storage", handleStorageChange);

    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

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

  // ---------------- FILE UPLOAD ----------------
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!currentAccountId) {
      setError("No account selected");
      return;
    }

    setError(null);

    try {
      const parsedTransactions = await parseFile(selectedFile);

      if (parsedTransactions?.length) {
        const enriched = parsedTransactions.map((tx) => ({
          ...tx,
          accountId: currentAccountId,
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

  // ---------------- FORM ----------------
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleManualSubmit = async () => {
    try {
      if (!currentAccountId) {
        setError("No account selected");
        return;
      }

      await addDoc(collection(db, "transactions"), {
        ...formData,
        amount: parseFloat(formData.amount),
        accountId: currentAccountId,
        createdAt: serverTimestamp(),
      });

      setManualDialogOpen(false);
      setFormData({
        description: "",
        amount: "",
        category: "",
        date: "",
      });
    } catch (error) {
      setError("Error adding transaction");
    }
  };

  // ---------------- LOADING ----------------
  if (loadingAccount) {
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
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" fontWeight={600}>
            {getPageTitle()}
          </Typography>

          <IconButton onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* CONTENT */}
      <Box sx={{ flex: 1, mt: 8, mb: 12 }}>
        <Container maxWidth="sm" sx={{ px: 2 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Outlet
              context={{
                currentAccountId,
                setCurrentAccountId, // 🔥 allow children to update globally
                accounts,
              }}
            />
          </Box>
        </Container>
      </Box>

      {/* BOTTOM NAV */}
      <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}
        elevation={0}
      >
        <BottomNavigation
          value={getNavIndex()}
          onChange={(e, newValue) => {
            if (newValue === 0) navigate("/dashboard");
            if (newValue === 1) navigate("/dashboard/transactions");
            if (newValue === 2) navigate("/dashboard/settings");
          }}
        >
          <BottomNavigationAction label="Overview" icon={<Home />} />
          <BottomNavigationAction
            label="Transactions"
            icon={<AccountBalanceWallet />}
          />
          <BottomNavigationAction label="Settings" icon={<Settings />} />
        </BottomNavigation>
      </Paper>

      {/* FAB */}
      <Fab
        onClick={() => setManualDialogOpen(true)}
        sx={{ position: "fixed", bottom: 88, right: 20 }}
      >
        <AddIcon />
      </Fab>

      {/* DIALOG */}
      <Dialog
        open={manualDialogOpen}
        onClose={() => setManualDialogOpen(false)}
        fullWidth
      >
        <DialogTitle>Add Transaction</DialogTitle>

        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}
        >
          <Button
            variant="outlined"
            onClick={() => fileInputRef.current.click()}
          >
            Upload File
          </Button>

          <input
            type="file"
            hidden
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleFormChange}
          />

          <TextField
            label="Amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleFormChange}
          />

          <TextField
            label="Category"
            name="category"
            value={formData.category}
            onChange={handleFormChange}
          />

          <TextField
            label="Date"
            name="date"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={formData.date}
            onChange={handleFormChange}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setManualDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleManualSubmit}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}