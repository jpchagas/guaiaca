import { useState } from "react";
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
} from "@mui/material";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function AddTransactionDialog({
open,
onClose,
currentAccount,
members = [],
currentUserId,
}) {
const [error, setError] = useState(null);

const [formData, setFormData] = useState({
description: "",
amount: "",
category: "",
date: "",
classification: "expense",
method: "pix",
responsibleUserId: currentUserId || "",
installmentsEnabled: false,
installments: 1,
});

const handleChange = (e) => {
const { name, value } = e.target;
setFormData((prev) => ({ ...prev, [name]: value }));
};

const handleToggleInstallments = (e) => {
setFormData((prev) => ({
...prev,
installmentsEnabled: e.target.checked,
installments: e.target.checked ? 2 : 1,
}));
};

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
installments: 1,
});
setError(null);
};

const handleSubmit = async () => {
try {
if (!currentAccount?.id) {
setError("No account selected");
return;
}


  const amount = Math.abs(parseFloat(formData.amount) || 0);

  const transactionData = {
    description: formData.description,
    amount,
    category: formData.category,
    date: formData.date,
    classification: formData.classification,
    method: formData.method,
    responsibleUserId: formData.responsibleUserId,
    accountId: currentAccount.id,
    createdAt: serverTimestamp(),
  };

  // ✅ Add installment object if enabled
  if (formData.installmentsEnabled && formData.installments > 1) {
    transactionData.installment = {
      current: 1,
      total: Number(formData.installments),
    };
  }

  await addDoc(collection(db, "transactions"), transactionData);

  resetForm();
  onClose();
} catch (err) {
  console.error(err);
  setError("Error adding transaction");
}


};

const showInstallments =
formData.method === "credit_card";

return ( <Dialog open={open} onClose={onClose} fullWidth> <DialogTitle>Add Transaction</DialogTitle>


  <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
    {error && <Alert severity="error">{error}</Alert>}

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
      label="Description"
      name="description"
      value={formData.description}
      onChange={handleChange}
    />

    <TextField
      label="Amount"
      name="amount"
      type="number"
      value={formData.amount}
      onChange={handleChange}
    />

    <TextField
      label="Date"
      name="date"
      type="date"
      InputLabelProps={{ shrink: true }}
      value={formData.date}
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

    <TextField
      select
      label="Responsible"
      name="responsibleUserId"
      value={formData.responsibleUserId}
      onChange={handleChange}
    >
      {members.map((m) => (
        <MenuItem key={m.id} value={m.id}>
          {m.name || m.email}
        </MenuItem>
      ))}
    </TextField>

    {/* 💳 INSTALLMENTS */}
    {showInstallments && (
      <>
        <FormControlLabel
          control={
            <Switch
              checked={formData.installmentsEnabled}
              onChange={handleToggleInstallments}
            />
          }
          label="Pay in installments"
        />

        {formData.installmentsEnabled && (
          <TextField
            label="Number of installments"
            name="installments"
            type="number"
            inputProps={{ min: 2, max: 48 }}
            value={formData.installments}
            onChange={handleChange}
          />
        )}
      </>
    )}
  </DialogContent>

  <DialogActions>
    <Button onClick={onClose}>Cancel</Button>
    <Button onClick={handleSubmit} variant="contained">
      Add
    </Button>
  </DialogActions>
</Dialog>


);
}
