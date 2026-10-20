import { useState } from "react";
import {
  Alert,
  Button,
  TextField,
  Stack,
  MenuItem,
  Box,
  InputAdornment,
  ListItemIcon,
  Typography,
} from "@mui/material";
import { Add } from "@mui/icons-material";

import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebaseConfig";
import { useCategories } from "../hooks/useCategories";
import Sheet from "./ui/Sheet";
import CategoryAvatar from "./ui/CategoryAvatar";
import { parseAmountInput } from "../utils/format";

export default function AddBudgetDialog({
  open,
  onClose,
  currentAccount,
}) {
  const categories = useCategories();

  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [newCategoryMode, setNewCategoryMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const parsedLimit = parseAmountInput(limit);

  const handleClose = () => {
    if (saving) return;

    setCategory("");
    setLimit("");
    setError(null);
    setNewCategoryMode(false);
    setNewCategoryName("");
    onClose();
  };

  const createCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const docRef = await addDoc(collection(db, "categories"), {
        name: newCategoryName.trim(),
        key: newCategoryName.trim().toLowerCase().replace(/\s+/g, "_"),
        createdAt: serverTimestamp(),
      });

      setCategory(docRef.id);
      setNewCategoryMode(false);
      setNewCategoryName("");
    } catch (err) {
      console.error(err);
      setError("Não foi possível criar a categoria.");
    }
  };

  const handleSubmit = async () => {
    if (!category) return;
    if (!parsedLimit || parsedLimit <= 0) return;
    if (!currentAccount?.id) return;

    try {
      setSaving(true);
      setError(null);

      await addDoc(collection(db, "budgets"), {
        accountId: currentAccount.id,
        category,
        limit: parsedLimit,
        period: "monthly",
        createdAt: serverTimestamp(),
      });

      setSaving(false);
      handleClose();
    } catch (err) {
      console.error("Error creating budget:", err);
      setError("Não foi possível salvar o orçamento. Tente novamente.");
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title="Novo orçamento"
      subtitle="Defina um limite mensal de gastos para uma categoria."
      actions={
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleSubmit}
          disabled={!category || !(parsedLimit > 0) || saving}
        >
          {saving ? "Salvando…" : "Criar orçamento"}
        </Button>
      }
    >
      <Stack spacing={2.25}>
        {error && <Alert severity="error">{error}</Alert>}

        {!newCategoryMode ? (
          <TextField
            select
            label="Categoria"
            value={category}
            onChange={(e) => {
              if (e.target.value === "__new__") {
                setNewCategoryMode(true);
                return;
              }
              setCategory(e.target.value);
            }}
            SelectProps={{
              MenuProps: { PaperProps: { sx: { maxHeight: 360 } } },
              renderValue: (id) => {
                const c = categories.find((x) => x.id === id);
                if (!c) return "";
                return (
                  <Box display="flex" alignItems="center" gap={1.25}>
                    <CategoryAvatar category={c} size={26} />
                    {c.name}
                  </Box>
                );
              },
            }}
          >
            {categories.map((c) => (
              <MenuItem key={c.id} value={c.id} sx={{ py: 1 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <CategoryAvatar category={c} size={28} />
                </ListItemIcon>
                {c.name}
              </MenuItem>
            ))}

            <MenuItem value="__new__" sx={{ py: 1.25, color: "primary.main", fontWeight: 600 }}>
              <ListItemIcon sx={{ minWidth: 40, color: "primary.main" }}>
                <Add />
              </ListItemIcon>
              Criar nova categoria
            </MenuItem>
          </TextField>
        ) : (
          <Box display="flex" gap={1} alignItems="flex-start">
            <TextField
              autoFocus
              label="Nome da categoria"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <Button onClick={createCategory} variant="contained" sx={{ height: 56, flexShrink: 0 }}>
              Criar
            </Button>
            <Button onClick={() => setNewCategoryMode(false)} sx={{ height: 56, flexShrink: 0 }}>
              Voltar
            </Button>
          </Box>
        )}

        <TextField
          label="Limite mensal"
          placeholder="0,00"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          inputProps={{ inputMode: "decimal" }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Typography fontWeight={600} color="text.secondary">R$</Typography>
              </InputAdornment>
            ),
            sx: { fontVariantNumeric: "tabular-nums" },
          }}
        />
      </Stack>
    </Sheet>
  );
}
