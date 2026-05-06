import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  MenuItem,
  Box,
} from "@mui/material";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebaseConfig";
import { useCategories } from "../hooks/useCategories";

export default function AddBudgetDialog({
  open,
  onClose,
  currentAccount,
}) {
  const categories = useCategories();

  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);

  const [newCategoryMode, setNewCategoryMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const handleClose = () => {
    if (saving) return;

    setCategory("");
    setLimit("");
    setNewCategoryMode(false);
    setNewCategoryName("");
    onClose();
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) return;

    const docRef = await addDoc(collection(db, "categories"), {
      name: newCategoryName.trim(),
      key: newCategoryName.trim().toLowerCase().replace(/\s+/g, "_"),
      createdAt: serverTimestamp(),
    });

    setCategory(docRef.id);
    setNewCategoryMode(false);
    setNewCategoryName("");
  };

  const handleSubmit = async () => {
    if (!category) return;
    if (!limit || Number(limit) <= 0) return;
    if (!currentAccount?.id) return;

    try {
      setSaving(true);

      await addDoc(collection(db, "budgets"), {
        accountId: currentAccount.id,
        category,
        limit: Number(limit),
        period: "monthly",
        createdAt: serverTimestamp(),
      });

      handleClose();
    } catch (err) {
      console.error("Error creating budget:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <DialogTitle>Create Budget</DialogTitle>

      <DialogContent>
        <Stack spacing={2} mt={1}>
          {!newCategoryMode ? (
            <TextField
              select
              label="Category"
              value={category}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setNewCategoryMode(true);
                  return;
                }
                setCategory(e.target.value);
              }}
              fullWidth
            >
              {categories.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.name}
                </MenuItem>
              ))}

              <MenuItem value="__new__">+ Create new category</MenuItem>
            </TextField>
          ) : (
            <Box display="flex" gap={1}>
              <TextField
                fullWidth
                label="New category"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <Button onClick={createCategory} variant="contained">
                Add
              </Button>
            </Box>
          )}

          <TextField
            label="Monthly Limit"
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!category || !limit || saving}
        >
          {saving ? "Saving..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}