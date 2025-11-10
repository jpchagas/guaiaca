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
import { ingestCSVFile } from "../utils/fileIngestion";
import { parseFile } from "../services/parsers/parseFile";

const drawerWidth = 240;
const categories = ["Food", "Utilities", "Income", "Entertainment", "Health", "Other"];

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [file, setFile] = useState(null);
const [formData, setFormData] = useState({
  description: "",
  amount: "",
  classification: "expense", // default value (or "revenue", if you prefer)
  category: "",
  date: "",
  parcel: 1,
  parcels: 1,
  responsible: "",
  method: "transfer",
  card: "",
});
  const [selectedBank, setSelectedBank] = useState("");
  const [error, setError] = useState(null);

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

  // ==== File Upload ====
const handleFileChange = async (e) => {
  const selectedFile = e.target.files?.[0];
  if (!selectedFile) return;

  setFile(selectedFile);
  setError(null); // Clear previous error

  try {
    // parseFile might throw (e.g. unsupported bank)
    await parseFile(selectedFile, selectedBank);
    await ingestCSVFile(selectedFile);

    alert("File ingested successfully!");
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

  // ==== Add Transaction Manually ====
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

    // Validate required fields
    if (!formData.description || !formData.amount || !formData.category || !formData.classification || !formData.date) {
      return alert("Please fill in all required fields.");
    }

    await addDoc(collection(db, "transactions"), {
      description: formData.description,
      amount: parseFloat(formData.amount),
      classification: formData.classification, // revenue, expense, investment
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
    setFormData({
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
    setManualDialogOpen(false);
  } catch (error) {
    console.error("Error adding transaction:", error);
    alert("Error adding transaction — check console");
  }
};


  // ==== Drawer ====
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
        <ListItem button onClick={() => navigate("/home")}>
          <ListItemIcon><Home color="primary" /></ListItemIcon>
          <ListItemText primary="Overview" />
        </ListItem>
        <ListItem button onClick={() => navigate("/home/transactions")}>
          <ListItemIcon><AccountBalanceWallet color="primary" /></ListItemIcon>
          <ListItemText primary="Transactions" />
        </ListItem>
        <ListItem button onClick={() => navigate("/home/settings")}>
          <ListItemIcon><Settings color="primary" /></ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
      </List>
      <Divider sx={{ mt: "auto" }} />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon><Logout color="error" /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <CssBaseline />

      {/* AppBar */}
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
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {isMobile && (
              <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" noWrap component="div">{getPageTitle()}</Typography>
          </Box>
          {isMobile && <IconButton color="error" onClick={handleLogout}><Logout /></IconButton>}
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      {!isMobile && (
        <Box component="nav" sx={{ width: drawerWidth, flexShrink: 0 }}>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": { width: drawerWidth },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
      )}

      {/* Main Content */}
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
        <Outlet />

        {/* FAB */}
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

            {/* Upload Dialog */}
{/* Upload Dialog */}
<Dialog
  open={uploadDialogOpen}
  onClose={() => {
    setUploadDialogOpen(false);
    setFile(null);
    setError(null);
    setSelectedBank("");
  }}
  fullWidth
  maxWidth="sm"
>
  <DialogTitle>Upload Bank File</DialogTitle>

  {error && (
    <Alert severity="error" sx={{ mx: 3, mt: 2 }}>
      {error}
    </Alert>
  )}

  <DialogContent sx={{ mt: 1 }}>
    {/* STEP 1 — Bank Grid Selection */}
    {!selectedBank && (
      <Box>
        <Typography variant="body1" align="center" mb={2}>
          Select your bank to continue
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
            gap: 2,
          }}
        >
          {[
            { name: "BTG", logo: "/btg_logo.png" },
            { name: "C6", logo: "/c6_logo.png" },
            { name: "Bradesco", logo: "/bradesco_logo.png" },
            { name: "Nubank", logo: "/nubank_logo.png" },
            { name: "Banrisul", logo: "/banrisul_logo.png" },
            { name: "Caixa", logo: "/caixa_logo.png" },
            { name: "Caixa", logo: "/itau_logo.png" },
          ].map((bank) => (
            <Box
              key={bank.name}
              onClick={() => setSelectedBank(bank.name)}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                p: 2,
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                cursor: "pointer",
                transition: "all 0.2s ease",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              <Box
                component="img"
                src={bank.logo}
                alt={bank.name}
                sx={{
                  width: 48,
                  height: 48,
                  objectFit: "contain",
                  borderRadius: "50%",
                  mb: 1,
                }}
              />
              <Typography variant="body2" color="text.primary">
                {bank.name}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    )}

    {/* STEP 2 — Upload Area */}
    {selectedBank && (
      <>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Selected Bank: <strong>{selectedBank}</strong>
        </Typography>

        <Box
          sx={{
            mt: 2,
            p: 3,
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 2,
            textAlign: "center",
            cursor: "pointer",
            bgcolor: "background.default",
            transition: "0.2s",
            "&:hover": { bgcolor: "action.hover" },
          }}
          onClick={() => fileInputRef.current.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <CloudUpload sx={{ fontSize: 48, color: "text.secondary" }} />
          <Typography variant="body1" color="text.secondary" mt={1}>
            Drag & drop or tap to select a file
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Supported: .csv, .xlsx, .pdf
          </Typography>
        </Box>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.pdf,application/pdf,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        {file && (
          <Typography mt={2} color="text.primary">
            Selected file: {file.name}
          </Typography>
        )}

        <Button
          sx={{ mt: 2 }}
          onClick={() => setSelectedBank("")}
          startIcon={<UploadFileIcon />}
        >
          Choose another bank
        </Button>
      </>
    )}
  </DialogContent>

  <DialogActions>
    <Button
      onClick={() => {
        setUploadDialogOpen(false);
        setFile(null);
        setError(null);
        setSelectedBank("");
      }}
    >
      Cancel
    </Button>
  </DialogActions>
</Dialog>



{/* Manual Add Dialog */}
<Dialog open={manualDialogOpen} onClose={() => setManualDialogOpen(false)} fullWidth maxWidth="sm">
  <DialogTitle>Add Transaction</DialogTitle>
  <DialogContent>
    <TextField
      fullWidth
      margin="normal"
      label="Description"
      name="description"
      value={formData.description}
      onChange={handleFormChange}
    />

    <TextField
      fullWidth
      margin="normal"
      label="Amount"
      type="number"
      name="amount"
      value={formData.amount}
      onChange={handleFormChange}
    />

    <TextField
      fullWidth
      margin="normal"
      select
      label="Classification"
      name="classification"
      value={formData.classification}
      onChange={handleFormChange}
    >
      <MenuItem value="revenue">Revenue</MenuItem>
      <MenuItem value="expense">Expense</MenuItem>
      <MenuItem value="investment">Investment</MenuItem>
    </TextField>

    <TextField
      fullWidth
      margin="normal"
      select
      label="Category"
      name="category"
      value={formData.category}
      onChange={handleFormChange}
    >
      {categories.map((cat) => (
        <MenuItem key={cat} value={cat}>{cat}</MenuItem>
      ))}
    </TextField>

    <TextField
      fullWidth
      margin="normal"
      label="Date"
      type="date"
      name="date"
      value={formData.date}
      onChange={handleFormChange}
      InputLabelProps={{ shrink: true }}
    />

    <Box display="flex" gap={2}>
      <TextField
        fullWidth
        margin="normal"
        label="Parcel"
        type="number"
        name="parcel"
        value={formData.parcel}
        onChange={handleFormChange}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Parcels"
        type="number"
        name="parcels"
        value={formData.parcels}
        onChange={handleFormChange}
      />
    </Box>

    <TextField
      fullWidth
      margin="normal"
      label="Responsible"
      name="responsible"
      value={formData.responsible}
      onChange={handleFormChange}
    />

    <TextField
      fullWidth
      margin="normal"
      select
      label="Payment Method"
      name="method"
      value={formData.method}
      onChange={handleFormChange}
    >
      <MenuItem value="transfer">Transfer</MenuItem>
      <MenuItem value="credit card">Credit Card</MenuItem>
      <MenuItem value="debit card">Debit Card</MenuItem>
      <MenuItem value="cash">Cash</MenuItem>
      <MenuItem value="pix">Pix</MenuItem>
    </TextField>

    {formData.method === "credit card" && (
      <TextField
        fullWidth
        margin="normal"
        label="Card Name"
        name="card"
        value={formData.card}
        onChange={handleFormChange}
      />
    )}
  </DialogContent>

  <DialogActions>
    <Button onClick={() => setManualDialogOpen(false)}>Cancel</Button>
    <Button variant="contained" onClick={handleManualSubmit}>
      Add
    </Button>
  </DialogActions>
</Dialog>
          </>
        )}
      </Box>

      {/* Bottom Navigation */}
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
