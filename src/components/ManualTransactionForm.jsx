import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  DialogActions,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField,
} from "@mui/material";

import { useCategories } from "../hooks/useCategories";

import {
  createTransaction,
  updateTransactionById,
} from "../services/transactions/transactionService";

const INITIAL_FORM = {
  description: "",
  amount: "",
  category: "",
  date: "",
  classification: "expense",
  method: "pix",
  responsibleUserId: "",
  installmentsEnabled: false,
  installmentsTotal: "2",
  installmentsCurrent: "1",
};

export default function ManualTransactionForm({
  onClose,
  currentAccount,
  currentUserId,
  initialData = null,
  mode = "create",
}) {
  const categories = useCategories();

  const isEdit = mode === "edit";

  const [formData, setFormData] = useState({
    ...INITIAL_FORM,
    responsibleUserId: currentUserId || "",
  });

  const [error, setError] = useState(null);

  const [loading, setLoading] = useState(false);

  const formatLocalDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
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
        classification:
          initialData.classification || "expense",
        method: initialData.method || "pix",
        responsibleUserId:
          initialData.responsibleUserId ||
          currentUserId,
        installmentsEnabled: !!initialData.installment,
        installmentsTotal: String(
          initialData.installment?.total || "2"
        ),
        installmentsCurrent: String(
          initialData.installment?.current || "1"
        ),
      });
    }
  }, [initialData, isEdit, currentUserId]);

  const validation = useMemo(() => {
    const errors = {};

    if (
      !formData.amount ||
      Number(formData.amount) <= 0
    ) {
      errors.amount = "Enter a valid amount";
    }

    if (!formData.date) {
      errors.date = "Select a date";
    }

    return errors;
  }, [formData]);

  const isValid =
    Object.keys(validation).length === 0;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!isValid || loading) return;

    setLoading(true);
    setError(null);

    try {
      if (isEdit) {
        await updateTransactionById({
          transactionId: initialData.id,
          formData,
          currentAccountId: currentAccount.id,
        });
      } else {
        await createTransaction({
          formData,
          currentAccountId: currentAccount.id,
        });
      }

      onClose();
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Failed to save transaction"
      );
    } finally {
      setLoading(false);
    }
  };

  const showInstallments =
    formData.method === "credit_card";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {error && (
        <Alert severity="error">
          {error}
        </Alert>
      )}

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
        select
        label="Category"
        name="category"
        value={formData.category}
        onChange={handleChange}
      >
        {categories.map((c) => (
          <MenuItem
            key={c.id}
            value={c.id}
          >
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
        <MenuItem value="revenue">
          Income
        </MenuItem>

        <MenuItem value="expense">
          Expense
        </MenuItem>

        <MenuItem value="investment">
          Investment
        </MenuItem>
      </TextField>

      <TextField
        select
        label="Payment Method"
        name="method"
        value={formData.method}
        onChange={handleChange}
      >
        <MenuItem value="pix">Pix</MenuItem>

        <MenuItem value="credit_card">
          Credit Card
        </MenuItem>

        <MenuItem value="transfer">
          Transfer
        </MenuItem>

        <MenuItem value="cash">
          Cash
        </MenuItem>
      </TextField>

      {showInstallments && (
        <>
          <FormControlLabel
            control={
              <Switch
                checked={
                  formData.installmentsEnabled
                }
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    installmentsEnabled:
                      e.target.checked,
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
                value={
                  formData.installmentsTotal
                }
                onChange={handleChange}
              />

              <TextField
                label="Current"
                name="installmentsCurrent"
                value={
                  formData.installmentsCurrent
                }
                onChange={handleChange}
              />
            </>
          )}
        </>
      )}

      <DialogActions sx={{ px: 0 }}>
        <Button onClick={onClose}>
          Cancel
        </Button>

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
    </Box>
  );
}