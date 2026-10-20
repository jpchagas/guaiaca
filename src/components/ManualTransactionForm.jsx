import { useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  InputAdornment,
  ListItemIcon,
  MenuItem,
  Switch,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DeleteOutline } from "@mui/icons-material";

import { useCategories } from "../hooks/useCategories";
import CategoryAvatar from "./ui/CategoryAvatar";
import { finance } from "../theme";
import {
  METHOD_LABELS,
  parseAmountInput,
  toAmountInput,
  toDate,
  toDateInputValue,
} from "../utils/format";

import {
  createTransaction,
  updateTransactionById,
} from "../services/transactions/transactionService";

const CLASSIFICATIONS = [
  { value: "expense", label: "Despesa", color: finance.expense },
  { value: "revenue", label: "Receita", color: finance.revenue },
  { value: "investment", label: "Investimento", color: finance.investment },
];

const SUBMIT_LABELS = {
  expense: "Adicionar despesa",
  revenue: "Adicionar receita",
  investment: "Adicionar investimento",
};

function buildInitialForm(initialData, currentUserId) {
  if (!initialData) {
    return {
      description: "",
      amount: "",
      category: "",
      date: toDateInputValue(new Date()),
      classification: "expense",
      method: "pix",
      responsibleUserId: currentUserId || "",
      installmentsEnabled: false,
      installmentsTotal: "2",
      installmentsCurrent: "1",
    };
  }

  const date = toDate(initialData.date) || new Date();

  return {
    description: initialData.description || "",
    amount: toAmountInput(initialData.amount),
    category: initialData.category || "",
    date: toDateInputValue(date),
    classification: initialData.classification || "expense",
    method: initialData.method || "pix",
    responsibleUserId: initialData.responsibleUserId || currentUserId || "",
    installmentsEnabled: !!initialData.installment,
    installmentsTotal: String(initialData.installment?.total || "2"),
    installmentsCurrent: String(initialData.installment?.current || "1"),
  };
}

export default function ManualTransactionForm({
  onClose,
  currentAccount,
  members = [],
  currentUserId,
  initialData = null,
  mode = "create",
  onDelete,
}) {
  const categories = useCategories();
  const isEdit = mode === "edit";

  const [formData, setFormData] = useState(() =>
    buildInitialForm(isEdit ? initialData : null, currentUserId)
  );
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const showInstallments = formData.method === "credit_card";
  const activeClassification =
    CLASSIFICATIONS.find((c) => c.value === formData.classification) ||
    CLASSIFICATIONS[0];

  const validation = useMemo(() => {
    const errors = {};
    const amount = parseAmountInput(formData.amount);

    if (!amount || amount <= 0) errors.amount = "Informe um valor maior que zero";
    if (!formData.date) errors.date = "Escolha uma data";
    if (!formData.category) errors.category = "Escolha uma categoria";

    if (showInstallments && formData.installmentsEnabled) {
      const total = Number(formData.installmentsTotal);
      const current = Number(formData.installmentsCurrent);
      if (!Number.isInteger(total) || total < 2) {
        errors.installmentsTotal = "Mínimo de 2 parcelas";
      }
      if (!Number.isInteger(current) || current < 1 || current > total) {
        errors.installmentsCurrent = `Entre 1 e ${total >= 2 ? total : "o total"}`;
      }
    }

    return errors;
  }, [formData, showInstallments]);

  const isValid = Object.keys(validation).length === 0;
  const showError = (field) => submitted && validation[field];

  const setField = (name, value) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const handleChange = (e) => setField(e.target.name, e.target.value);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setSubmitted(true);
    if (!isValid || loading) return;

    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      amount: parseAmountInput(formData.amount),
      installmentsEnabled: showInstallments && formData.installmentsEnabled,
    };

    try {
      if (isEdit) {
        await updateTransactionById({
          transactionId: initialData.id,
          formData: payload,
          currentAccountId: currentAccount.id,
        });
      } else {
        await createTransaction({
          formData: payload,
          currentAccountId: currentAccount.id,
        });
      }

      onClose();
    } catch (err) {
      console.error(err);
      setError("Não foi possível salvar a transação. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    onDelete?.(initialData);
    onClose();
  };

  // Avoid MUI out-of-range warnings while categories load or for legacy values
  const categoryValue = categories.some((c) => c.id === formData.category)
    ? formData.category
    : "";

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      sx={{ display: "flex", flexDirection: "column", gap: 2.25 }}
    >
      {error && <Alert severity="error">{error}</Alert>}

      {/* TYPE */}
      <ToggleButtonGroup
        value={formData.classification}
        exclusive
        fullWidth
        size="small"
        onChange={(_, value) => value && setField("classification", value)}
        sx={{ gap: 1, "& .MuiToggleButtonGroup-grouped": { border: "1px solid", borderColor: "divider", borderRadius: "10px !important", m: 0 } }}
      >
        {CLASSIFICATIONS.map((c) => (
          <ToggleButton
            key={c.value}
            value={c.value}
            sx={{
              py: 1,
              "&.Mui-selected, &.Mui-selected:hover": {
                color: c.color,
                borderColor: `${alpha(c.color, 0.5)} !important`,
                backgroundColor: alpha(c.color, 0.08),
              },
            }}
          >
            {c.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {/* AMOUNT */}
      <TextField
        name="amount"
        placeholder="0,00"
        value={formData.amount}
        onChange={handleChange}
        autoFocus={!isEdit}
        error={!!showError("amount")}
        helperText={showError("amount")}
        inputProps={{ inputMode: "decimal", "aria-label": "Valor" }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Typography sx={{ fontSize: 22, fontWeight: 600, color: "text.secondary" }}>
                R$
              </Typography>
            </InputAdornment>
          ),
          sx: {
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
            color: activeClassification.color,
            py: 0.5,
          },
        }}
      />

      <TextField
        label="Descrição"
        name="description"
        placeholder="Ex.: Mercado do mês"
        value={formData.description}
        onChange={handleChange}
      />

      {/* CATEGORY */}
      <TextField
        select
        label="Categoria"
        name="category"
        value={categoryValue}
        onChange={handleChange}
        error={!!showError("category")}
        helperText={showError("category")}
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
      </TextField>

      <TextField
        label="Data"
        type="date"
        name="date"
        value={formData.date}
        onChange={handleChange}
        InputLabelProps={{ shrink: true }}
        error={!!showError("date")}
        helperText={showError("date")}
      />

      {/* METHOD */}
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: "block", mb: 1 }}>
          Forma de pagamento
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {Object.entries(METHOD_LABELS).map(([value, label]) => {
            const active = formData.method === value;
            return (
              <Chip
                key={value}
                label={label}
                onClick={() => setField("method", value)}
                color={active ? "primary" : "default"}
                variant={active ? "filled" : "outlined"}
              />
            );
          })}
        </Box>
      </Box>

      {/* RESPONSIBLE */}
      {members.length > 1 && (
        <TextField
          select
          label="Responsável"
          name="responsibleUserId"
          value={members.some((m) => m.id === formData.responsibleUserId) ? formData.responsibleUserId : ""}
          onChange={handleChange}
        >
          {members.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {m.id === currentUserId ? `${m.name || m.email} (você)` : m.name || m.email}
            </MenuItem>
          ))}
        </TextField>
      )}

      {/* INSTALLMENTS */}
      {showInstallments && (
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "rgba(13,31,24,0.02)",
          }}
        >
          <FormControlLabel
            sx={{ m: 0, width: "100%", justifyContent: "space-between" }}
            labelPlacement="start"
            control={
              <Switch
                checked={formData.installmentsEnabled}
                onChange={(e) => setField("installmentsEnabled", e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Compra parcelada
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Registre qual parcela é esta
                </Typography>
              </Box>
            }
          />

          {formData.installmentsEnabled && (
            <Box display="flex" gap={1.5} mt={2}>
              <TextField
                label="Parcela atual"
                name="installmentsCurrent"
                value={formData.installmentsCurrent}
                onChange={handleChange}
                inputProps={{ inputMode: "numeric" }}
                error={!!showError("installmentsCurrent")}
                helperText={showError("installmentsCurrent")}
              />
              <TextField
                label="Total de parcelas"
                name="installmentsTotal"
                value={formData.installmentsTotal}
                onChange={handleChange}
                inputProps={{ inputMode: "numeric" }}
                error={!!showError("installmentsTotal")}
                helperText={showError("installmentsTotal")}
              />
            </Box>
          )}
        </Box>
      )}

      {/* ACTIONS */}
      <Box display="flex" gap={1.5} mt={1}>
        {isEdit && onDelete && (
          <Button
            color="error"
            variant="outlined"
            onClick={handleDelete}
            disabled={loading}
            startIcon={<DeleteOutline />}
            sx={{ flexShrink: 0 }}
          >
            Excluir
          </Button>
        )}

        <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
          {loading
            ? "Salvando…"
            : isEdit
            ? "Salvar alterações"
            : SUBMIT_LABELS[formData.classification]}
        </Button>
      </Box>
    </Box>
  );
}
