import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
} from "@mui/material";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAccount } from "../context/AccountContext";

export default function AddGoalDialog({ open, onClose }) {
  const { currentAccount } = useAccount();

  const [form, setForm] = useState({
    title: "",
    type: "savings",
    targetAmount: "",
  });

  const handleChange = (e) => {
    setForm((p) => ({
      ...p,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.targetAmount) return;

    await addDoc(collection(db, "goals"), {
      accountId: currentAccount.id,
      title: form.title,
      type: form.type,
      targetAmount: Number(form.targetAmount),
      currentAmount: 0,
      createdAt: serverTimestamp(),
    });

    onClose();
    setForm({ title: "", type: "savings", targetAmount: "" });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Create Goal</DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>
          <TextField
            label="Title"
            name="title"
            value={form.title}
            onChange={handleChange}
          />

          <TextField
            select
            label="Type"
            name="type"
            value={form.type}
            onChange={handleChange}
          >
            <MenuItem value="savings">Savings</MenuItem>
            <MenuItem value="purchase">Purchase</MenuItem>
            <MenuItem value="debt">Debt</MenuItem>
          </TextField>

          <TextField
            label="Target amount"
            name="targetAmount"
            type="number"
            value={form.targetAmount}
            onChange={handleChange}
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button variant="contained" onClick={handleSubmit}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}