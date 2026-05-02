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

export default function AddTransactionDialog({
  open,
  onClose,
  currentAccount,
  members = [],
  currentUserId,
  initialData = null,
  mode = "create",
}) {
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

  // ✅ LOCAL DATE FORMATTER (NO UTC BUG)
  const formatLocalDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // ✅ HYDRATE FORM (FIXED)
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
        date: formatLocalDate(date), // ✅ FIXED
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

  // 🧠 INLINE VALIDATION
  const validation = useMemo(() => {
    const errors = {};

    if (!formData.amount || Number(formData.amount) <= 0) {
      errors.amount = "Enter a valid amount";
    }

    if (!formData.date) {
      errors.date = "Select a date";
    }

    if (formData.installmentsEnabled) {
      const total = Number(formData.installmentsTotal);
      const current = Number(formData.installmentsCurrent);

      if (total < 2) {
        errors.installmentsTotal = "Min 2";
      }

      if (current < 1 || current > total) {
        errors.installmentsCurrent = "Invalid";
      }
    }

    return errors;
  }, [formData]);

  const isValid = Object.keys(validation).length === 0;

  // 🔄 DIFF TRACKING
  const diff = useMemo(() => {
    if (!isEdit || !initialData) return null;

    const changes = [];

    if (Number(formData.amount) !== initialData.amount) {
      changes.push(`Amount: ${initialData.amount} → ${formData.amount}`);
    }

    if (formData.category !== initialData.category) {
      changes.push(`Category: ${initialData.category} → ${formData.category}`);
    }

    if (formData.date !== formatLocalDate(
      typeof initialData.date?.toDate === "function"
        ? initialData.date.toDate()
        : new Date(initialData.date)
    )) {
      changes.push(`Date changed`);
    }

    return changes;
  }, [formData, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ SAFE DATE CREATION (NO TIMEZONE BUG)
  const buildLocalDate = (dateString) => {
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day, 12); // midday = safest
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
        date: Timestamp.fromDate(localDate), // ✅ FIXED
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

      <DialogContent
        sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      >
        {error && <Alert severity="error">{error}</Alert>}

        {/* DIFF */}
        {diff && diff.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Changes:
            </Typography>
            {diff.map((d, i) => (
              <Typography key={i} variant="caption">
                {d}
              </Typography>
            ))}
          </Box>
        )}

        <TextField
          label="Amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          error={!!validation.amount}
          helperText={validation.amount}
          autoFocus
        />

        <TextField
          label="Date"
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          error={!!validation.date}
          helperText={validation.date}
        />

        <TextField
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />

        <TextField
          label="Category"
          name="category"
          value={formData.category}
          onChange={handleChange}
        />

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

        {/* INSTALLMENTS */}
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
                  error={!!validation.installmentsTotal}
                  helperText={validation.installmentsTotal}
                />

                <TextField
                  label="Current"
                  name="installmentsCurrent"
                  value={formData.installmentsCurrent}
                  onChange={handleChange}
                  error={!!validation.installmentsCurrent}
                  helperText={validation.installmentsCurrent}
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
          {loading
            ? "Saving..."
            : isEdit
            ? "Save changes"
            : "Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}