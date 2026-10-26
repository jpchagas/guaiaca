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

import { useAccount } from "../context/AccountContext";
import { useCategories } from "../hooks/useCategories";
import { useCards } from "../hooks/useCards";
import BankAvatar from "./ui/BankAvatar";
import CategoryAvatar from "./ui/CategoryAvatar";
import { finance } from "../theme";
import { BANKS } from "../utils/banks";
import { SPLIT_MODE_INFO } from "../utils/splitModes";
import {
  METHOD_LABELS,
  formatCurrency,
  getFirstName,
  parseAmountInput,
  toAmountInput,
  toDate,
  toDateInputValue,
} from "../utils/format";

import { saveTransaction } from "../services/transactions/transactionService";
import { isSplitAccount, isSplitIncome, planIncomeSplit } from "../services/split/incomeShare";
import {
  defaultTarget,
  destinationOptions,
  personalPartId,
  sharedPartId,
  targetOf,
} from "../services/split/sharedIncomeService";

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

function buildInitialForm(initialData, currentUserId, target) {
  if (!initialData) {
    return {
      description: "",
      amount: "",
      category: "",
      date: toDateInputValue(new Date()),
      classification: "expense",
      method: "pix",
      cardId: "",
      bank: "",
      responsibleUserId: currentUserId || "",
      target,
      installmentsEnabled: false,
      installmentsTotal: "2",
      installmentsCurrent: "1",
    };
  }

  const date = toDate(initialData.date) || new Date();

  return {
    description: initialData.description || "",
    // A split income is edited as a whole
    amount: toAmountInput(initialData.incomeSplit?.gross ?? initialData.amount),
    category: initialData.category || "",
    date: toDateInputValue(date),
    classification: initialData.classification || "expense",
    method: initialData.method || "pix",
    cardId: initialData.cardId || "",
    bank: initialData.bank || "",
    responsibleUserId: initialData.responsibleUserId || currentUserId || "",
    target,
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
  const { accounts, transactions } = useAccount();
  const { cards } = useCards(accounts.map((a) => a.id));
  const isEdit = mode === "edit";

  const [formData, setFormData] = useState(() =>
    buildInitialForm(
      isEdit ? initialData : null,
      currentUserId,
      isEdit ? targetOf(initialData, accounts) : defaultTarget(currentAccount)
    )
  );
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const showInstallments = formData.method === "credit_card";

  const categoriesById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const ctx = { currentAccount, accounts, members, transactions, categoriesById };

  // Shared or personal (accounts that split per person only)
  const destinations = destinationOptions({ ...ctx, responsibleUserId: formData.responsibleUserId });
  const targetAccount = accounts.find((a) => a.id === formData.target);

  // An earning sent to a split account: how much stays shared and how much goes to personal
  const incomeSplit = useMemo(() => {
    const amount = parseAmountInput(formData.amount);
    if (
      !(amount > 0) ||
      !isSplitAccount(targetAccount) ||
      !isSplitIncome(formData.classification, categoriesById[formData.category]) ||
      !(targetAccount.members || []).includes(formData.responsibleUserId)
    ) {
      return null;
    }
    const sharedId = isEdit ? sharedPartId(initialData) : null;
    return planIncomeSplit({
      account: targetAccount,
      responsibleUserId: formData.responsibleUserId,
      amount,
      date: formData.date,
      transactions,
      excludeIds: sharedId ? [sharedId, personalPartId(sharedId)] : [],
    });
  }, [formData, targetAccount, categoriesById, transactions, isEdit, initialData]);
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

  // A card purchase comes from the card's bank; with a single card, it's preselected
  const selectMethod = (method) =>
    setFormData((prev) => {
      if (method !== "credit_card") {
        // The bank came from the card; don't carry it over to a Pix or transfer
        return prev.method === "credit_card" ? { ...prev, method, cardId: "", bank: "" } : { ...prev, method };
      }
      if (prev.method === "credit_card") return prev;
      if (cards.length !== 1) return { ...prev, method, bank: "" };
      return { ...prev, method, cardId: cards[0].id, bank: cards[0].bank };
    });

  const selectCard = (cardId) =>
    setFormData((prev) => ({ ...prev, cardId, bank: cards.find((c) => c.id === cardId)?.bank || "" }));

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
      await saveTransaction({ formData: payload, initialData: isEdit ? initialData : null, ctx });
      onClose();
    } catch (err) {
      console.error(err);
      const owner = members.find((m) => m.id === formData.responsibleUserId);
      const name = getFirstName(owner?.name, owner?.email) || "Essa pessoa";
      setError(
        err.code === "noPersonalAccount"
          ? `${name} precisa abrir o app uma vez para receber lançamentos na conta pessoal.`
          : err.code === "permission-denied"
          ? `Sem permissão para salvar na conta pessoal de ${name}.`
          : "Não foi possível salvar a transação. Verifique sua conexão e tente novamente."
      );
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
                onClick={() => selectMethod(value)}
                color={active ? "primary" : "default"}
                variant={active ? "filled" : "outlined"}
              />
            );
          })}
        </Box>
      </Box>

      {/* CARD / BANK */}
      {formData.method === "credit_card" ? (
        <TextField
          select
          label="Cartão"
          value={cards.some((c) => c.id === formData.cardId) ? formData.cardId : ""}
          onChange={(e) => selectCard(e.target.value)}
          helperText={cards.length ? undefined : "Cadastre seus cartões na aba Cartões para acompanhar cada fatura."}
          SelectProps={{ displayEmpty: true, renderValue: (id) => cards.find((c) => c.id === id)?.name || "Não informar" }}
          InputLabelProps={{ shrink: true }}
        >
          <MenuItem value="">Não informar</MenuItem>
          {cards.map((c) => (
            <MenuItem key={c.id} value={c.id} sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <BankAvatar bank={c.bank} size={28} fallback="card" />
              </ListItemIcon>
              {c.name}
              {c.last4?.length > 0 && (
                <Typography component="span" variant="caption" color="text.secondary" ml={1}>
                  final {c.last4.join(", ")}
                </Typography>
              )}
            </MenuItem>
          ))}
        </TextField>
      ) : formData.method !== "cash" ? (
        <TextField
          select
          label="Banco"
          name="bank"
          value={BANKS[formData.bank] ? formData.bank : ""}
          onChange={handleChange}
          SelectProps={{ displayEmpty: true, renderValue: (id) => BANKS[id]?.name || "Não informar" }}
          InputLabelProps={{ shrink: true }}
        >
          <MenuItem value="">Não informar</MenuItem>
          {Object.entries(BANKS).map(([id, b]) => (
            <MenuItem key={id} value={id} sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <BankAvatar bank={id} size={28} />
              </ListItemIcon>
              {b.name}
            </MenuItem>
          ))}
        </TextField>
      ) : null}

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

      {/* SHARED / PERSONAL */}
      {destinations.length > 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: "block", mb: 1 }}>
            Conta
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {destinations.map((d) => {
              const active = formData.target === d.value;
              return (
                <Chip
                  key={d.value}
                  label={d.label}
                  onClick={() => setField("target", d.value)}
                  disabled={d.disabled && !active}
                  color={active ? "primary" : "default"}
                  variant={active ? "filled" : "outlined"}
                />
              );
            })}
          </Box>
          {destinations.some((d) => d.disabled) && (
            <Typography variant="caption" color="text.secondary" component="div" mt={0.75}>
              A conta pessoal fica disponível depois que a pessoa abrir o app uma vez.
            </Typography>
          )}
          {incomeSplit && (
            <Box
              sx={(theme) => ({
                mt: 1.25,
                p: 1.5,
                borderRadius: 2.5,
                bgcolor: alpha(theme.palette.primary.main, 0.06),
              })}
            >
              <Typography variant="body2" fontWeight={600}>
                {formatCurrency(incomeSplit.shared)} para {targetAccount.name || "a conta compartilhada"}
                {incomeSplit.personal > 0 && ` e ${formatCurrency(incomeSplit.personal)} para a conta pessoal`}
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div">
                {String(Math.round(incomeSplit.pct * 1000) / 10).replace(".", ",")}% da renda, pela divisão{" "}
                {SPLIT_MODE_INFO[targetAccount.split?.mode || "equal"].short.toLowerCase()}
                {targetAccount.split?.mode === "proportional" && " (recalculado quando entram outras rendas do mês)"}
              </Typography>
            </Box>
          )}
        </Box>
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
