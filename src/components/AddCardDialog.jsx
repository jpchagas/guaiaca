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
import { DeleteOutline } from "@mui/icons-material";

import Sheet from "./ui/Sheet";
import BankAvatar from "./ui/BankAvatar";
import ConfirmActionDialog from "./ConfirmActionDialog";
import { BANKS, bankInfo } from "../utils/banks";
import { parseAmountInput, toAmountInput } from "../utils/format";
import { createCard, deleteCard, updateCard } from "../services/cards/cardService";

const isDay = (n) => Number.isInteger(n) && n >= 1 && n <= 31;

/**
 * Creates a credit card, or edits/deletes `card` when given. Imports create
 * cards on their own; this is for naming them, setting the limit and the
 * bill cycle, or adding a card before its first bill.
 */
export default function AddCardDialog({ open, onClose, currentAccount, members = [], currentUserId, card = null }) {
  const isEdit = !!card;

  const [bank, setBank] = useState("");
  const [name, setName] = useState("");
  const [last4, setLast4] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [limit, setLimit] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBank(card?.bank || "");
    setName(card?.name || "");
    setLast4((card?.last4 || []).join(", "));
    setOwnerId(card?.ownerId || currentUserId || "");
    setLimit(toAmountInput(card?.limit));
    setClosingDay(card?.closingDay ? String(card.closingDay) : "");
    setDueDay(card?.dueDay ? String(card.dueDay) : "");
    setSubmitted(false);
    setError(null);
  }, [open, card, currentUserId]);

  const numbers = [...new Set(last4.split(/[^\d]+/).filter(Boolean))];
  const parsedLimit = limit.trim() ? parseAmountInput(limit) : null;
  const parsedClosing = closingDay ? Number(closingDay) : null;
  const parsedDue = dueDay ? Number(dueDay) : null;

  const errors = {
    bank: !bank && "Escolha o banco",
    last4: numbers.some((n) => n.length !== 4) && "Use os 4 últimos dígitos, separados por vírgula",
    limit: parsedLimit !== null && !(parsedLimit > 0) && "Informe um valor válido",
    closingDay: parsedClosing !== null && !isDay(parsedClosing) && "Entre 1 e 31",
    dueDay: parsedDue !== null && !isDay(parsedDue) && "Entre 1 e 31",
  };
  const isValid = !Object.values(errors).some(Boolean);
  const showError = (field) => (submitted && errors[field]) || undefined;

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
      bank,
      name: name.trim() || bankInfo(bank).name,
      last4: numbers,
      ownerId: ownerId || null,
      limit: parsedLimit,
      closingDay: parsedClosing,
      dueDay: parsedDue,
    };
    const ok = await run(
      () => (isEdit ? updateCard(card.id, values) : createCard({ accountId: currentAccount.id, ...values })),
      "Não foi possível salvar o cartão. Tente novamente."
    );
    if (ok) onClose();
  };

  const handleDelete = async () => {
    const ok = await run(() => deleteCard(card.id), "Não foi possível excluir o cartão.");
    setConfirmDelete(false);
    if (ok) onClose();
  };

  const dayField = (label, value, setValue, field) => (
    <TextField
      label={label}
      placeholder="Dia"
      value={value}
      onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 2))}
      error={!!showError(field)}
      helperText={showError(field)}
      inputProps={{ inputMode: "numeric" }}
      sx={{ flex: 1 }}
    />
  );

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title={isEdit ? "Editar cartão" : "Novo cartão"}
      subtitle={isEdit ? undefined : "Faturas importadas criam o cartão sozinhas. Cadastre aqui para definir o limite e o ciclo da fatura."}
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
            {saving ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar cartão"}
          </Button>
        </>
      }
    >
      <Stack spacing={2.25}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          select
          label="Banco"
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          error={!!showError("bank")}
          helperText={showError("bank")}
          SelectProps={{
            renderValue: (id) => (
              <Box display="flex" alignItems="center" gap={1.25}>
                <BankAvatar bank={id} size={26} fallback="card" />
                {bankInfo(id).name}
              </Box>
            ),
          }}
        >
          {Object.entries(BANKS).map(([id, b]) => (
            <MenuItem key={id} value={id} sx={{ py: 1 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <BankAvatar bank={id} size={28} fallback="card" />
              </ListItemIcon>
              {b.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Nome"
          placeholder={bank ? bankInfo(bank).name : "Ex.: Nubank da Rafa"}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <TextField
          label="Final do cartão (opcional)"
          placeholder="Ex.: 1866, 0819"
          value={last4}
          onChange={(e) => setLast4(e.target.value)}
          error={!!showError("last4")}
          helperText={showError("last4") || "Cartões adicionais e virtuais da mesma fatura entram aqui também."}
          inputProps={{ inputMode: "numeric" }}
        />

        {members.length > 1 && (
          <TextField select label="Titular" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            {members.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.id === currentUserId ? `${m.name || m.email} (você)` : m.name || m.email}
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          label="Limite (opcional)"
          placeholder="0,00"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
          error={!!showError("limit")}
          helperText={showError("limit")}
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
          <Box display="flex" gap={1.5}>
            {dayField("Fecha dia", closingDay, setClosingDay, "closingDay")}
            {dayField("Vence dia", dueDay, setDueDay, "dueDay")}
          </Box>
          <Typography variant="caption" color="text.secondary" component="div" mt={0.75}>
            Com os dois, compras lançadas à mão entram na fatura certa: depois do fechamento, vão para a seguinte.
          </Typography>
        </Box>
      </Stack>

      <ConfirmActionDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        loading={saving}
        title="Excluir cartão"
        description={`O cartão${card?.name ? ` ${card.name}` : ""} deixará de ser acompanhado. As transações continuam, como "cartão não identificado".`}
        confirmText="Excluir"
      />
    </Sheet>
  );
}
