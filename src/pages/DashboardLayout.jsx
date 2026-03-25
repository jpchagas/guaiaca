import { useRef, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  CssBaseline,
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

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    classification: "expense",
    category: "",
    date: "",
    parcel: 1,
    parcels: 1,
    responsible: "",
    method: "transfer",
    card: "",
  });

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

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);

    try {
      const parsedTransactions = await parseFile(selectedFile);

      if (parsedTransactions?.length) {
        await ingestTransactionsList(parsedTransactions);
        alert("✅ Transactions imported!");
      } else {
        alert("⚠️ No valid transactions found.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Unexpected error");
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleManualSubmit = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return alert("User not logged in");

      const userSnap = await getDoc(doc(db, "users", user.uid));
      const householdId = userSnap.data()?.householdId;

      if (!householdId) return alert("No household");

      await addDoc(collection(db, "transactions"), {
        ...formData,
        amount: parseFloat(formData.amount),
        householdId,
        createdAt: serverTimestamp(),
      });

      alert("Transaction added!");
      setManualDialogOpen(false);
    } catch (error) {
      console.error(error);
      alert("Error adding transaction");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <CssBaseline />

      {/* TOP BAR */}
      <AppBar position="fixed" color="default">
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">{getPageTitle()}</Typography>
          <IconButton color="error" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* CONTENT */}
      <Box
        component="main"
        sx={{
          mt: 8,
          mb: 10,
          px: 2,
          width: "100%",
          maxWidth: 600,
          mx: "auto",
        }}
      >
        <Outlet />
      </Box>

      {/* BOTTOM NAV */}
      <Paper
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
        }}
        elevation={3}
      >
        <BottomNavigation
          value={getNavIndex()}
          onChange={(e, newValue) => {
            if (newValue === 0) navigate("/home");
            if (newValue === 1) navigate("/home/transactions");
            if (newValue === 2) navigate("/home/settings");
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

      {/* FAB (REPLACED SPEEDDIAL) */}
      <Fab
        color="primary"
        onClick={() => setManualDialogOpen(true)}
        sx={{
          position: "fixed",
          bottom: 80,
          right: 16,
        }}
      >
        <AddIcon />
      </Fab>

      {/* ADD TRANSACTION DIALOG */}
      <Dialog open={manualDialogOpen} onClose={() => setManualDialogOpen(false)}>
        <DialogTitle>Add Transaction</DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Upload option */}
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

          {/* Manual fields */}
          <TextField
            label="Description"
            name="description"
            onChange={handleFormChange}
          />
          <TextField
            label="Amount"
            name="amount"
            type="number"
            onChange={handleFormChange}
          />
          <TextField
            label="Category"
            name="category"
            onChange={handleFormChange}
          />
          <TextField
            label="Date"
            name="date"
            type="date"
            InputLabelProps={{ shrink: true }}
            onChange={handleFormChange}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setManualDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleManualSubmit} variant="contained">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}