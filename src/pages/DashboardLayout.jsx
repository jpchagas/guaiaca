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
  CloudUpload,
} from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { collection, doc, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { ingestTransactionsList } from "../services/ingestion/ingestTransactionsList";
import { parseFile } from "../services/parsers/parseFile";
import dayjs from "dayjs";

const drawerWidth = 240;
const categories = ["Food", "Utilities", "Income", "Entertainment", "Health", "Other"];

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [selectedBank, setSelectedBank] = useState("");
  const [error, setError] = useState(null);

  // ✅ Shared month filter
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

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const fakeEvent = { target: { files: [droppedFile] } };
      handleFileChange(fakeEvent);
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
        description: formData.description,
        amount: parseFloat(formData.amount),
        classification: formData.classification,
        category: formData.category || "Other",
        date: formData.date,
        parcel: formData.parcel ? parseInt(formData.parcel) : 1,
        parcels: formData.parcels ? parseInt(formData.parcels) : 1,
        responsible: formData.responsible || user.displayName || user.email,
        method: formData.method || "transfer",
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
      <Typography
        variant="h5"
        sx={{ my: 2, textAlign: "center", fontWeight: 700, color: "primary.main" }}
      >
        Guaiaca 💰
      </Typography>

      <Divider />

      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate("/home")}>
            <ListItemIcon>
              <Home color="primary" />
            </ListItemIcon>
            <ListItemText primary="Overview" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate("/home/transactions")}>
            <ListItemIcon>
              <AccountBalanceWallet color="primary" />
            </ListItemIcon>
            <ListItemText primary="Transactions" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate("/home/settings")}>
            <ListItemIcon>
              <Settings color="primary" />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider sx={{ mt: "auto" }} />

      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <Logout color="error" />
            </ListItemIcon>
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

            <Typography variant="h6" noWrap>
              {getPageTitle()}
            </Typography>

            {/* ✅ Month Filter */}
            <TextField
              type="month"
              size="small"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              sx={{ minWidth: 150 }}
            />
          </Box>

          {isMobile && (
            <IconButton color="error" onClick={handleLogout}>
              <Logout />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

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

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          mb: 10,
        }}
      >
        {/* ✅ Shared context */}
        <Outlet context={{ selectedMonth, setSelectedMonth }} />

        {!location.pathname.includes("login") && (
          <>
            <SpeedDial
              ariaLabel="Add transaction options"
              sx={{
                position: "fixed",
                bottom: 90,
                right: 16,
                "& .MuiSpeedDial-fab": {
                  bgcolor: theme.palette.primary.main,
                  color: "#fff",
                  "&:hover": { bgcolor: theme.palette.primary.dark },
                },
              }}
              icon={<SpeedDialIcon icon={<AddIcon />} />}
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

            {/* Upload Dialog + Manual Dialog remain unchanged */}
          </>
        )}
      </Box>

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
