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
    category: "",
    date: "",
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
      } else {
        setError("No valid transactions found.");
      }
    } catch (err) {
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
      if (!user) return;

      const userSnap = await getDoc(doc(db, "users", user.uid));
      const householdId = userSnap.data()?.householdId;

      if (!householdId) return;

      await addDoc(collection(db, "transactions"), {
        ...formData,
        amount: parseFloat(formData.amount),
        householdId,
        createdAt: serverTimestamp(),
      });

      setManualDialogOpen(false);
    } catch (error) {
      setError("Error adding transaction");
    }
  };

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
            <Outlet />
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
            if (newValue === 0) navigate("/home");
            if (newValue === 1) navigate("/home/transactions");
            if (newValue === 2) navigate("/home/settings");
          }}
        >
          <BottomNavigationAction label="Overview" icon={<Home />} />
          <BottomNavigationAction label="Transactions" icon={<AccountBalanceWallet />} />
          <BottomNavigationAction label="Settings" icon={<Settings />} />
        </BottomNavigation>
      </Paper>

      {/* FAB */}
      <Fab
        onClick={() => setManualDialogOpen(true)}
        sx={{
          position: "fixed",
          bottom: 88,
          right: 20,
        }}
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
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            pt: 2,
          }}
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

          <TextField label="Description" name="description" onChange={handleFormChange} />
          <TextField label="Amount" name="amount" type="number" onChange={handleFormChange} />
          <TextField label="Category" name="category" onChange={handleFormChange} />
          <TextField
            label="Date"
            name="date"
            type="date"
            InputLabelProps={{ shrink: true }}
            onChange={handleFormChange}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setManualDialogOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleManualSubmit}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}