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
MenuItem,
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
serverTimestamp,
addDoc,
} from "firebase/firestore";

import { parseFile } from "../services/parsers/parseFile";
import { ingestTransactionsList } from "../services/ingestion/ingestTransactionsList";

import CreateAccountDialog from "../components/CreateAccountDialog";
import ContextHeader from "../components/ContextHeader";
import AccountSwitcher from "../components/AccountSwitcher";
import DateSwitcher from "../components/DateSwitcher";

import { useAccount } from "../context/AccountContext";

export default function DashboardLayout() {
const [manualDialogOpen, setManualDialogOpen] = useState(false);
const [createAccountOpen, setCreateAccountOpen] = useState(false);
const [error, setError] = useState(null);

const [accountDrawerOpen, setAccountDrawerOpen] = useState(false);
const [dateDrawerOpen, setDateDrawerOpen] = useState(false);

const {
accounts = [],
currentAccount,
currentAccountId,
switchAccount,
loading,
} = useAccount();

const [formData, setFormData] = useState({
description: "",
amount: "",
category: "",
date: "",
classification: "expense", // ✅ default
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


if (!currentAccount?.id) {
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
} finally {
  e.target.value = null;
}


};

const handleFormChange = (e) => {
const { name, value } = e.target;
setFormData((prev) => ({ ...prev, [name]: value }));
};

const handleManualSubmit = async () => {
try {
if (!currentAccount?.id) {
setError("No account selected");
return;
}

  const amount = Math.abs(parseFloat(formData.amount) || 0);

  await addDoc(collection(db, "transactions"), {
    description: formData.description,
    amount,
    category: formData.category,
    date: formData.date,
    classification: formData.classification, // ✅ FIXED
    accountId: currentAccount.id,
    createdAt: serverTimestamp(),
  });

  setManualDialogOpen(false);
  setFormData({
    description: "",
    amount: "",
    category: "",
    date: "",
    classification: "expense",
  });
} catch (err) {
  console.error(err);
  setError("Error adding transaction");
}


};

if (loading) {
return ( <Box display="flex" justifyContent="center" mt={10}> <Typography>Loading account...</Typography> </Box>
);
}

return (
<Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
{/* TOP BAR */} <AppBar position="fixed"> <Toolbar> <Typography variant="h6" fontWeight={600}>
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

  {/* NAV */}
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

  {/* FAB */}
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

  {/* DIALOG */}
  <Dialog open={manualDialogOpen} onClose={() => setManualDialogOpen(false)} fullWidth>
    <DialogTitle>Add Transaction</DialogTitle>

    <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Button onClick={() => fileInputRef.current.click()}>
        Upload File
      </Button>

      <input type="file" hidden ref={fileInputRef} onChange={handleFileChange} />

      {error && <Alert severity="error">{error}</Alert>}

      <TextField
        select
        label="Type"
        name="classification"
        value={formData.classification}
        onChange={handleFormChange}
      >
        <MenuItem value="revenue">Income</MenuItem>
        <MenuItem value="expense">Expense</MenuItem>
        <MenuItem value="investment">Investment</MenuItem>
      </TextField>

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
