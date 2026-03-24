import { useRef, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  CssBaseline,
  Divider,
  useTheme,
  useMediaQuery,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Alert,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Logout,
  Home,
  AccountBalanceWallet,
  Settings,
} from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { collection, addDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import dayjs from "dayjs";
import { parseFile } from "../services/parsers/parseFile";
import { ingestTransactionsList } from "../services/ingestion/ingestTransactionsList";

const drawerWidth = 240;
const categories = ["Food", "Utilities", "Income", "Entertainment", "Health", "Other"];

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [selectedBank, setSelectedBank] = useState("");
  const [error, setError] = useState(null);
  const [fabOpen, setFabOpen] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));

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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

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

    setFile(selectedFile);
    setError(null);

    try {
      const parsedTransactions = await parseFile(selectedFile, selectedBank);

      if (Array.isArray(parsedTransactions) && parsedTransactions.length > 0) {
        await ingestTransactionsList(parsedTransactions);
        alert("✅ Transactions imported successfully!");
      } else {
        alert("⚠️ No valid transactions found in file.");
      }

      setUploadDialogOpen(false);
    } catch (err) {
      console.error("File ingestion or parsing failed:", err);
      setError(err.message || "An unexpected error occurred.");
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

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      const householdId = userSnap.data()?.householdId;
      if (!householdId) return alert("User has no household");

      if (!formData.description || !formData.amount || !formData.category || !formData.classification || !formData.date) {
        return alert("Please fill in all required fields.");
      }

      await addDoc(collection(db, "transactions"), {
        ...formData,
        amount: parseFloat(formData.amount),
        parcel: parseInt(formData.parcel),
        parcels: parseInt(formData.parcels),
        responsible: formData.responsible || user.displayName || user.email,
        card: formData.method === "credit card" ? formData.card || "" : "",
        householdId,
        createdAt: serverTimestamp(),
      });

      alert("Transaction added!");
      setManualDialogOpen(false);
    } catch (error) {
      console.error("Error adding transaction:", error);
      alert("Error adding transaction — check console");
    }
  };

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Typography variant="h5" sx={{ my: 2, textAlign: "center", fontWeight: 700, color: "primary.main" }}>
        Guaiaca 💰
      </Typography>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate("/home")}>
            <ListItemIcon><Home color="primary" /></ListItemIcon>
            <ListItemText primary="Overview" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate("/home/transactions")}>
            <ListItemIcon><AccountBalanceWallet color="primary" /></ListItemIcon>
            <ListItemText primary="Transactions" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate("/home/settings")}>
            <ListItemIcon><Settings color="primary" /></ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider sx={{ mt: "auto" }} />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon><Logout color="error" /></ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${isMobile ? 0 : drawerWidth}px)` },
          ml: { sm: isMobile ? 0 : `${drawerWidth}px` },
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {isMobile && (
              <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" noWrap>{getPageTitle()}</Typography>
            <TextField
              type="month"
              size="small"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              sx={{ minWidth: 150 }}
            />
          </Box>
          {isMobile && (
            <IconButton color="error" onClick={handleLogout}><Logout /></IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      {!isMobile && (
        <Box component="nav" sx={{ width: drawerWidth, flexShrink: 0 }}>
          <Drawer
            variant="permanent"
            sx={{ display: { xs: "none", sm: "block" }, "& .MuiDrawer-paper": { width: drawerWidth } }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, width: { sm: `calc(100% - ${drawerWidth}px)` }, mt: 8, mb: 10 }}
      >
        <Outlet context={{ selectedMonth, setSelectedMonth }} />
      </Box>

      {/* SpeedDial (outside main Box so it won't get clipped) */}
      {!location.pathname.includes("login") && (
        <SpeedDial
          ariaLabel="Add transaction options"
          sx={{
            position: "fixed",
            bottom: 90,
            right: 16,
            zIndex: 1500,
            "& .MuiSpeedDial-fab": {
              bgcolor: theme.palette.primary.main,
              color: "#fff",
              "&:hover": { bgcolor: theme.palette.primary.dark },
            },
          }}
          icon={<SpeedDialIcon icon={<AddIcon />} />}
          onOpen={() => setFabOpen(true)}
          onClose={() => setFabOpen(false)}
          open={fabOpen}
        >
          <SpeedDialAction
            key="Upload File"
            icon={<UploadFileIcon />}
            tooltipTitle="Upload File"
            onClick={() => setUploadDialogOpen(true)}
          />
          <SpeedDialAction
            key="Add Manually"
            icon={<EditNoteIcon />}
            tooltipTitle="Add Manually"
            onClick={() => setManualDialogOpen(true)}
          />
        </SpeedDial>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)}>
        <DialogTitle>Upload Transaction File</DialogTitle>
        <DialogContent>
          <input type="file" onChange={handleFileChange} ref={fileInputRef} />
          {error && <Alert severity="error">{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Manual Transaction Dialog */}
      <Dialog open={manualDialogOpen} onClose={() => setManualDialogOpen(false)}>
        <DialogTitle>Add Transaction Manually</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 300 }}>
          {["description", "amount", "category", "date", "parcel", "parcels"].map((field) => (
            <TextField
              key={field}
              label={field.charAt(0).toUpperCase() + field.slice(1)}
              name={field}
              type={field === "amount" || field === "parcel" || field === "parcels" ? "number" : "text"}
              value={formData[field]}
              onChange={handleFormChange}
            />
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManualDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleManualSubmit}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Bottom Navigation for mobile */}
      {isMobile && (
        <Paper sx={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 1000 }} elevation={3}>
          <BottomNavigation
            showLabels
            value={getNavIndex()}
            onChange={(e, newValue) => {
              if (newValue === 0) navigate("/home");
              else if (newValue === 1) navigate("/home/transactions");
              else if (newValue === 2) navigate("/home/settings");
            }}
          >
            <BottomNavigationAction label="Overview" icon={<Home />} />
            <BottomNavigationAction label="Transactions" icon={<AccountBalanceWallet />} />
            <BottomNavigationAction label="Settings" icon={<Settings />} />
          </BottomNavigation>
        </Paper>
      )}
    </Box>
  );
}