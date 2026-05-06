import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Alert,
  FormControlLabel,
  Switch,
  Typography,
  Box,
} from "@mui/material";

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { db } from "../firebaseConfig";
import { useCategories } from "../hooks/useCategories";

export default function AddTransactionDialog({
  open,
  onClose,
  currentAccount,
  members = [],
  currentUserId,
  initialData = null,
  mode = "create",
}) {
  const categories = useCategories();
  const isEdit = mode === "edit";

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    date: "",
    classification: "expense",
    method: "pix",
    responsibleUserId: currentUserId || "",
    installmentsEnabled: false,
    installmentsTotal: "2",
    installmentsCurrent: "1",
  });

  const formatLocalDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (!open) return;

    if (isEdit && initialData) {
      const date =
        typeof initialData.date?.toDate === "function"
          ? initialData.date.toDate()
          : new Date(initialData.date);

      setFormData({
        description: initialData.description || "",
        amount: String(initialData.amount || ""),
        category: initialData.category || "",
        date: formatLocalDate(date),
        classification: initialData.classification || "expense",
        method: initialData.method || "pix",
        responsibleUserId:
          initialData.responsibleUserId || currentUserId,
        installmentsEnabled: !!initialData.installment,
        installmentsTotal: String(
          initialData.installment?.total || "2"
        ),
        installmentsCurrent: String(
          initialData.installment?.current || "1"
        ),
      });
    } else {
      resetForm();
    }
  }, [open, initialData]);

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category: "",
      date: "",
      classification: "expense",
      method: "pix",
      responsibleUserId: currentUserId || "",
      installmentsEnabled: false,
      installmentsTotal: "2",
      installmentsCurrent: "1",
    });
    setError(null);
  };

  const validation = useMemo(() => {
    const errors = {};

    if (!formData.amount || Number(formData.amount) <= 0) {
      errors.amount = "Enter a valid amount";
    }

    if (!formData.date) {
      errors.date = "Select a date";
    }

    return errors;
  }, [formData]);

  const isValid = Object.keys(validation).length === 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const buildLocalDate = (dateString) => {
    const [y, m, d] = dateString.split("-").map(Number);
    return new Date(y, m - 1, d, 12);
  };

  const handleSubmit = async () => {
    if (!isValid || loading) return;

    setLoading(true);
    setError(null);

    try {
      const amount = Math.abs(Number(formData.amount));
      const localDate = buildLocalDate(formData.date);

      const transactionData = {
        description: formData.description,
        amount,
        category: formData.category,
        classification: formData.classification,
        method: formData.method,
        responsibleUserId: formData.responsibleUserId,
        accountId: currentAccount.id,
        date: Timestamp.fromDate(localDate),
      };

      if (!isEdit) {
        transactionData.createdAt = serverTimestamp();
      }

      if (formData.installmentsEnabled) {
        transactionData.installment = {
          current: Number(formData.installmentsCurrent),
          total: Number(formData.installmentsTotal),
        };
      }

      if (isEdit) {
        await updateDoc(
          doc(db, "transactions", initialData.id),
          transactionData
        );
      } else {
        await addDoc(collection(db, "transactions"), transactionData);
      }

      onClose();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save transaction");
    } finally {
      setLoading(false);
    }
  };

  const showInstallments = formData.method === "credit_card";

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>
        {isEdit ? "Edit Transaction" : "Add Transaction"}
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          error={!!validation.amount}
          helperText={validation.amount}
        />

        <TextField
          label="Date"
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />

        {/* CATEGORY */}
        <TextField
          select
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
        >
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Type"
          name="classification"
          value={formData.classification}
          onChange={handleChange}
        >
          <MenuItem value="revenue">Income</MenuItem>
          <MenuItem value="expense">Expense</MenuItem>
          <MenuItem value="investment">Investment</MenuItem>
        </TextField>

        <TextField
          select
          label="Payment Method"
          name="method"
          value={formData.method}
          onChange={handleChange}
        >
          <MenuItem value="pix">Pix</MenuItem>
          <MenuItem value="credit_card">Credit Card</MenuItem>
          <MenuItem value="transfer">Transfer</MenuItem>
          <MenuItem value="cash">Cash</MenuItem>
        </TextField>

        {/* INSTALLMENTS (RESTORED) */}
        {showInstallments && (
          <>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.installmentsEnabled}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      installmentsEnabled: e.target.checked,
                    }))
                  }
                />
              }
              label="Installments"
            />

            {formData.installmentsEnabled && (
              <>
                <TextField
                  label="Total"
                  name="installmentsTotal"
                  value={formData.installmentsTotal}
                  onChange={handleChange}
                />

                <TextField
                  label="Current"
                  name="installmentsCurrent"
                  value={formData.installmentsCurrent}
                  onChange={handleChange}
                />
              </>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!isValid || loading}
        >
          {loading ? "Saving..." : isEdit ? "Save changes" : "Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}