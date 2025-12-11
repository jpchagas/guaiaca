// src/pages/Transactions.jsx
import { useEffect, useState, useRef } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TablePagination,
  CircularProgress,
  Chip,
  Tooltip,
  TextField,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";

import {
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "../firebaseConfig";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

const CLASSIFICATIONS = [
  { value: "revenue", label: "Revenue" },
  { value: "expense", label: "Expense" },
  { value: "investment", label: "Investment" },
];

const CATEGORIES = [
  "Food",
  "Utilities",
  "Income",
  "Entertainment",
  "Health",
  "Transport",
  "Rent",
  "Shopping",
  "Other",
];

const METHODS = ["transfer", "credit card", "debit card", "cash", "pix"];

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [editing, setEditing] = useState({});
  const [activeCell, setActiveCell] = useState(null);
  const inputRef = useRef(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const householdId = localStorage.getItem("householdId");
      if (!householdId) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "transactions"),
        where("householdId", "==", householdId)
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setTransactions(data);
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: "Failed to fetch transactions.",
      });
    } finally {
      setLoading(false);
    }
  }

  const deleteTransaction = async (id) => {
    try {
      await deleteDoc(doc(db, "transactions", id));

      setTransactions((prev) => prev.filter((t) => t.id !== id));

      setSnackbar({
        open: true,
        severity: "success",
        message: "Transaction deleted.",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: "Failed to delete transaction.",
      });
    }
  };

  const startEdit = (id, field) => {
    const tx = transactions.find((t) => t.id === id);
    setEditing((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...tx } }));
    setActiveCell({ id, field });
    setTimeout(() => inputRef.current?.focus?.(), 40);
  };

  const cancelEdit = (id) => {
    setEditing((prev) => {
      const x = { ...prev };
      delete x[id];
      return x;
    });
    setActiveCell(null);
  };

  const handleLocalChange = (id, field, value) => {
    setEditing((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
  };

  const saveRow = async (id) => {
    const edited = editing[id];
    if (!edited) return cancelEdit(id);

    const original = transactions.find((t) => t.id === id);
    const updatePayload = {};

    const fields = [
      "description",
      "amount",
      "classification",
      "category",
      "date",
      "parcel",
      "parcels",
      "responsible",
      "method",
      "card",
    ];

    for (let f of fields) {
      let val = edited[f];
      if (val === "") val = null;

      if (f === "amount" && val !== null) val = Number(val);
      if ((f === "parcel" || f === "parcels") && val !== null) val = Number(val);

      if (String(original[f]) !== String(val)) updatePayload[f] = val;
    }

    if (Object.keys(updatePayload).length === 0) {
      setSnackbar({
        open: true,
        severity: "info",
        message: "No changes to save.",
      });
      return cancelEdit(id);
    }

    try {
      await updateDoc(doc(db, "transactions", id), updatePayload);

      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updatePayload } : t))
      );

      setSnackbar({
        open: true,
        severity: "success",
        message: "Saved!",
      });

      cancelEdit(id);
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: "Save failed.",
      });
    }
  };

  const handleKeyDown = (e, id) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveRow(id);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit(id);
    }
  };

  const getColorByClassification = (cls) => {
    return cls === "revenue"
      ? "success.main"
      : cls === "expense"
      ? "error.main"
      : cls === "investment"
      ? "warning.main"
      : "text.primary";
  };

  const EditableCell = ({ tx, field }) => {
    const id = tx.id;
    const isActive = activeCell?.id === id && activeCell.field === field;
    const local = editing[id] || {};
    const value = isActive ? (local[field] ?? "") : tx[field];

    if (!isActive) {
      if (field === "classification") {
        return (
          <Chip
            label={value ?? "—"}
            size="small"
            sx={{
              bgcolor: getColorByClassification(value),
              color: "white",
              textTransform: "capitalize",
            }}
          />
        );
      }

      if (field === "method") {
        return (
          <Tooltip title={tx.card || ""}>
            <Chip label={value ?? "—"} size="small" variant="outlined" />
          </Tooltip>
        );
      }

      if (field === "amount") {
        const amt = Number(value) || 0;
        return amt < 0
          ? `- $${Math.abs(amt).toFixed(2)}`
          : `$${amt.toFixed(2)}`;
      }

      return value ?? "—";
    }

    switch (field) {
      case "description":
      case "responsible":
      case "card":
        return (
          <TextField
            inputRef={inputRef}
            variant="standard"
            fullWidth
            value={value ?? ""}
            onChange={(e) => handleLocalChange(id, field, e.target.value)}
            onBlur={() => saveRow(id)}
            onKeyDown={(e) => handleKeyDown(e, id)}
          />
        );

      case "amount":
        return (
          <TextField
            inputRef={inputRef}
            variant="standard"
            type="number"
            fullWidth
            value={value ?? ""}
            onChange={(e) => handleLocalChange(id, field, e.target.value)}
            onBlur={() => saveRow(id)}
            onKeyDown={(e) => handleKeyDown(e, id)}
          />
        );

      case "classification":
        return (
          <Select
            inputRef={inputRef}
            variant="standard"
            value={value ?? ""}
            onChange={(e) => handleLocalChange(id, field, e.target.value)}
            onBlur={() => saveRow(id)}
            onKeyDown={(e) => handleKeyDown(e, id)}
          >
            {CLASSIFICATIONS.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {c.label}
              </MenuItem>
            ))}
          </Select>
        );

      case "category":
        return (
          <Select
            inputRef={inputRef}
            variant="standard"
            value={value ?? ""}
            onChange={(e) => handleLocalChange(id, field, e.target.value)}
            onBlur={() => saveRow(id)}
            onKeyDown={(e) => handleKeyDown(e, id)}
          >
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        );

      case "method":
        return (
          <Select
            inputRef={inputRef}
            variant="standard"
            value={value ?? ""}
            onChange={(e) => handleLocalChange(id, field, e.target.value)}
            onBlur={() => saveRow(id)}
            onKeyDown={(e) => handleKeyDown(e, id)}
          >
            {METHODS.map((m) => (
              <MenuItem key={m} value={m}>
                {m}
              </MenuItem>
            ))}
          </Select>
        );

      case "date":
        return (
          <TextField
            inputRef={inputRef}
            variant="standard"
            type="date"
            value={value ?? ""}
            onChange={(e) => handleLocalChange(id, field, e.target.value)}
            onBlur={() => saveRow(id)}
            onKeyDown={(e) => handleKeyDown(e, id)}
          />
        );

      case "parcel":
      case "parcels":
        return (
          <TextField
            inputRef={inputRef}
            variant="standard"
            type="number"
            value={value ?? ""}
            onChange={(e) => handleLocalChange(id, field, e.target.value)}
            onBlur={() => saveRow(id)}
            onKeyDown={(e) => handleKeyDown(e, id)}
          />
        );

      default:
        return value ?? "";
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (transactions.length === 0) {
    return (
      <Box textAlign="center" mt={8}>
        <Typography>No transactions found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Transactions
      </Typography>

      <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: "70vh" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Classification</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Responsible</TableCell>
                <TableCell>Method</TableCell>
                <TableCell align="right">Amount ($)</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {transactions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((tx) => (
                  <TableRow key={tx.id} hover>
                    {[
                      "date",
                      "description",
                      "classification",
                      "category",
                      "responsible",
                      "method",
                      "amount",
                    ].map((field) => (
                      <TableCell
                        key={field}
                        onClick={() => startEdit(tx.id, field)}
                        sx={{ cursor: "pointer", minWidth: 100 }}
                      >
                        <EditableCell tx={tx} field={field} />
                      </TableCell>
                    ))}

                    {/* DELETE BUTTON */}
                    <TableCell align="center">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => deleteTransaction(tx.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={transactions.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        />
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() =>
          setSnackbar((s) => ({
            ...s,
            open: false,
          }))
        }
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
