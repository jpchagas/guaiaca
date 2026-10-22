import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  TextField,
  Stack,
  MenuItem,
  Box,
  InputAdornment,
  ListItemIcon,
  Slider,
  Typography,
} from "@mui/material";
import { Add, DeleteOutline } from "@mui/icons-material";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useCategories } from "../hooks/useCategories";
import Sheet from "./ui/Sheet";
import CategoryAvatar from "./ui/CategoryAvatar";
import ConfirmActionDialog from "./ConfirmActionDialog";
import { formatCurrency, parseAmountInput, toAmountInput } from "../utils/format";
import {
  DEFAULT_ALERT_AT,
  budgetExists,
  createBudget,
  deleteBudget,
  updateBudget,
} from "../services/budgets/budgetService";

/** Creates a budget, or edits/deletes `budget` when given. */
export default function AddBudgetDialog({
  open,
  onClose,
  currentAccount,
  budget = null,
}) {
  const categories = useCategories();
  const isEdit = !!budget;

  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");
  const [alertAt, setAlertAt] = useState(DEFAULT_ALERT_AT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [newCategoryMode, setNewCategoryMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    if (!open) return;
    setCategory(budget?.category || "");
    setLimit(toAmountInput(budget?.limit));
    setAlertAt(budget?.alertAt || DEFAULT_ALERT_AT);
    setError(null);
    setNewCategoryMode(false);
    setNewCategoryName("");
  }, [open, budget]);

  const parsedLimit = parseAmountInput(limit);

  const handleClose = () => {
    if (saving) return;
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

      if (await budgetExists({ accountId: currentAccount.id, category, exceptId: budget?.id })) {
        setError("Já existe um orçamento para essa categoria. Edite o existente.");
        setSaving(false);
        return;
      }

      const values = { category, limit: parsedLimit, alertAt };
      if (isEdit) {
        await updateBudget(budget.id, values);
      } else {
        await createBudget({ accountId: currentAccount.id, ...values });
      }

      setSaving(false);
      onClose();
    } catch (err) {
      console.error("Error saving budget:", err);
      setError("Não foi possível salvar o orçamento. Tente novamente.");
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSaving(true);
      await deleteBudget(budget.id);
      setConfirmDelete(false);
      setSaving(false);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Não foi possível excluir o orçamento.");
      setConfirmDelete(false);
      setSaving(false);
    }
  };

  const categoryName = categories.find((c) => c.id === category)?.name;

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title={isEdit ? "Editar orçamento" : "Novo orçamento"}
      subtitle={isEdit ? undefined : "Defina um limite mensal de gastos para uma categoria."}
      actions={
        <>
          {isEdit && (
            <Button
              color="error"
              variant="outlined"
              startIcon={<DeleteOutline />}
              onClick={() => setConfirmDelete(true)}
              disabled={saving}
              sx={{ flexShrink: 0 }}
            >
              Excluir
            </Button>
          )}
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleSubmit}
            disabled={!category || !(parsedLimit > 0) || saving}
          >
            {saving ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar orçamento"}
          </Button>
        </>
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

        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="baseline">
            <Typography variant="body2" fontWeight={600}>
              Avisar ao atingir
            </Typography>
            <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: "tabular-nums" }}>
              {alertAt}%
            </Typography>
          </Box>
          <Slider
            value={alertAt}
            onChange={(_, v) => setAlertAt(v)}
            min={50}
            max={95}
            step={5}
            marks
            aria-label="Avisar ao atingir"
          />
          <Typography variant="caption" color="text.secondary">
            Os membros da conta recebem um aviso
            {parsedLimit > 0 ? ` ao passar de ${formatCurrency((parsedLimit * alertAt) / 100)}` : ""} e outro
            ao estourar o limite.
          </Typography>
        </Box>
      </Stack>

      <ConfirmActionDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        loading={saving}
        title="Excluir orçamento"
        description={`O orçamento${categoryName ? ` de ${categoryName}` : ""} será excluído. Suas transações não são afetadas.`}
        confirmText="Excluir"
      />
    </Sheet>
  );
}
