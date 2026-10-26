import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  ListItemIcon,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { CheckCircle, DeleteOutline } from "@mui/icons-material";

import { useCategories } from "../hooks/useCategories";
import Sheet from "./ui/Sheet";
import CategoryAvatar from "./ui/CategoryAvatar";
import ConfirmActionDialog from "./ConfirmActionDialog";
import { MONTHS, formatShortDate, parseAmountInput, toAmountInput } from "../utils/format";
import {
  createBill,
  deleteBill,
  monthKey,
  setBillPaid,
  updateBill,
} from "../services/recurring/recurringBillService";

/**
 * Creates a recurring bill, or edits/deletes `bill` when given. In edit mode
 * it also shows the bill's payment for the selected month (`match` is the
 * transaction that paid it) and lets the user mark it paid by hand.
 */
export default function AddRecurringBillDialog({
  open,
  onClose,
  currentAccount,
  bill = null,
  match = null,
  year,
  month,
}) {
  const categories = useCategories();
  const isEdit = !!bill;

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [keyword, setKeyword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(bill?.name || "");
    setAmount(toAmountInput(bill?.amount));
    setCategory(bill?.category || "");
    setDueDay(bill?.dueDay ? String(bill.dueDay) : "");
    setKeyword(bill?.keyword || "");
    setSubmitted(false);
    setError(null);
  }, [open, bill]);

  const parsedAmount = parseAmountInput(amount);
  const parsedDay = Number(dueDay);
  const errors = {
    name: !name.trim() && "Dê um nome à conta",
    amount: !(parsedAmount > 0) && "Informe o valor esperado",
    category: !category && "Escolha uma categoria",
    dueDay: !(Number.isInteger(parsedDay) && parsedDay >= 1 && parsedDay <= 31) && "Entre 1 e 31",
  };
  const isValid = !Object.values(errors).some(Boolean);
  const showError = (field) => (submitted && errors[field]) || undefined;

  const key = year != null ? monthKey(year, month) : null;
  const manuallyPaid = !!(key && bill?.paid?.[key]);
  const monthName = month != null ? MONTHS[month].toLowerCase() : "";

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const run = async (action, message) => {
    try {
      setSaving(true);
      setError(null);
      await action();
      setSaving(false);
      return true;
    } catch (err) {
      console.error(err);
      setError(message);
      setSaving(false);
      return false;
    }
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!isValid || !currentAccount?.id || saving) return;

    const values = {
      name: name.trim(),
      amount: parsedAmount,
      category,
      dueDay: parsedDay,
      keyword: keyword.trim(),
    };
    const ok = await run(
      () => (isEdit ? updateBill(bill.id, values) : createBill({ accountId: currentAccount.id, ...values })),
      "Não foi possível salvar a conta fixa. Tente novamente."
    );
    if (ok) onClose();
  };

  const togglePaid = () =>
    run(() => setBillPaid(bill.id, key, !manuallyPaid), "Não foi possível atualizar o pagamento.");

  const handleDelete = async () => {
    const ok = await run(() => deleteBill(bill.id), "Não foi possível excluir a conta fixa.");
    setConfirmDelete(false);
    if (ok) onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title={isEdit ? "Editar conta fixa" : "Nova conta fixa"}
      subtitle={
        isEdit
          ? undefined
          : "Uma despesa de todo mês, como academia ou aluguel. Avisamos se ela não aparecer nas transações até o vencimento."
      }
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
          <Button variant="contained" size="large" fullWidth onClick={handleSubmit} disabled={saving}>
            {saving ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar conta fixa"}
          </Button>
        </>
      }
    >
      <Stack spacing={2.25}>
        {error && <Alert severity="error">{error}</Alert>}

        {/* THIS MONTH */}
        {isEdit && key && (
          <Box
            sx={(theme) => ({
              p: 1.75,
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              bgcolor: match || manuallyPaid ? alpha(theme.palette.primary.main, 0.07) : "rgba(13,31,24,0.035)",
            })}
          >
            {(match || manuallyPaid) && <CheckCircle color="primary" fontSize="small" />}
            <Box flex={1} minWidth={0}>
              <Typography variant="body2" fontWeight={600}>
                {match || manuallyPaid ? `Paga em ${monthName}` : `Ainda não paga em ${monthName}`}
              </Typography>
              <Typography variant="caption" color="text.secondary" component="div" noWrap>
                {match
                  ? `${match.description || "Transação"} · ${formatShortDate(match.date)}`
                  : manuallyPaid
                  ? "Marcada manualmente"
                  : "Nenhuma transação correspondente encontrada"}
              </Typography>
            </Box>
            {!match && (
              <Button size="small" onClick={togglePaid} disabled={saving} sx={{ flexShrink: 0 }}>
                {manuallyPaid ? "Desmarcar" : "Marcar como paga"}
              </Button>
            )}
          </Box>
        )}

        <TextField
          label="Nome"
          placeholder="Ex.: Academia"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={!!showError("name")}
          helperText={showError("name")}
        />

        <Box display="flex" gap={1.5}>
          <TextField
            label="Valor esperado"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={!!showError("amount")}
            helperText={showError("amount")}
            inputProps={{ inputMode: "decimal" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography fontWeight={600} color="text.secondary">R$</Typography>
                </InputAdornment>
              ),
              sx: { fontVariantNumeric: "tabular-nums" },
            }}
            sx={{ flex: 2 }}
          />
          <TextField
            label="Vence dia"
            placeholder="10"
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
            error={!!showError("dueDay")}
            helperText={showError("dueDay")}
            inputProps={{ inputMode: "numeric" }}
            sx={{ flex: 1 }}
          />
        </Box>

        <TextField
          select
          label="Categoria"
          value={categories.some((c) => c.id === category) ? category : ""}
          onChange={(e) => setCategory(e.target.value)}
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
          label="Texto no extrato (opcional)"
          placeholder="Ex.: SMARTFIT"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          helperText={
            keyword.trim()
              ? `Conta como paga quando uma despesa do mês tiver "${keyword.trim()}" na descrição.`
              : "Sem isso, conta como paga quando aparecer uma despesa desta categoria com valor parecido (±10%)."
          }
        />
      </Stack>

      <ConfirmActionDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        loading={saving}
        title="Excluir conta fixa"
        description={`A conta fixa${bill?.name ? ` ${bill.name}` : ""} deixará de ser acompanhada. Suas transações não são afetadas.`}
        confirmText="Excluir"
      />
    </Sheet>
  );
}
