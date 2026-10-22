import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  InputAdornment,
  TextField,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useAccount } from "../context/AccountContext";
import Sheet from "./ui/Sheet";
import { GOAL_TYPES } from "../utils/goalTypes";
import { parseAmountInput, toAmountInput } from "../utils/format";
import { createGoal, updateGoal } from "../services/goals/goalService";

const EMPTY_FORM = { title: "", type: "savings", targetAmount: "", currentAmount: "" };

const toForm = (goal) =>
  goal
    ? {
        title: goal.title || "",
        type: goal.type || "savings",
        targetAmount: toAmountInput(goal.targetAmount),
        currentAmount: toAmountInput(goal.currentAmount),
      }
    : EMPTY_FORM;

const moneyAdornment = {
  startAdornment: (
    <InputAdornment position="start">
      <Typography fontWeight={600} color="text.secondary">R$</Typography>
    </InputAdornment>
  ),
  sx: { fontVariantNumeric: "tabular-nums" },
};

/** Creates a goal, or edits `goal` when given. */
export default function AddGoalDialog({ open, onClose, goal = null }) {
  const { currentAccount } = useAccount();
  const isEdit = !!goal;
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(toForm(goal));
      setError(null);
    }
  }, [open, goal]);

  const target = parseAmountInput(form.targetAmount);
  const start = form.currentAmount ? parseAmountInput(form.currentAmount) : 0;
  const canSubmit = form.title.trim() && target > 0 && start >= 0 && !saving;

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleClose = () => {
    if (saving) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit || !currentAccount?.id) return;

    const values = {
      title: form.title.trim(),
      type: form.type,
      targetAmount: target,
      currentAmount: start,
    };

    try {
      setSaving(true);
      setError(null);

      if (isEdit) {
        await updateGoal(goal.id, values);
      } else {
        await createGoal({ accountId: currentAccount.id, ...values });
      }

      setSaving(false);
      onClose();
    } catch (err) {
      console.error(err);
      setError(`Não foi possível ${isEdit ? "salvar" : "criar"} a meta. Tente novamente.`);
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title={isEdit ? "Editar meta" : "Nova meta"}
      subtitle={isEdit ? undefined : "Defina um objetivo e acompanhe seu progresso."}
      actions={
        <Button variant="contained" size="large" fullWidth onClick={handleSubmit} disabled={!canSubmit}>
          {saving ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar meta"}
        </Button>
      }
    >
      <Stack spacing={2.25}>
        {error && <Alert severity="error">{error}</Alert>}

        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: "block", mb: 1 }}>
            Tipo de meta
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
            {Object.entries(GOAL_TYPES).map(([value, goalType]) => {
              const { label, Icon, color } = goalType;
              const active = form.type === value;
              return (
                <ButtonBase
                  key={value}
                  onClick={() => setForm((p) => ({ ...p, type: value }))}
                  sx={{
                    py: 1.5,
                    px: 1,
                    borderRadius: 3,
                    flexDirection: "column",
                    gap: 0.75,
                    border: "1px solid",
                    borderColor: active ? color : "divider",
                    backgroundColor: active ? alpha(color, 0.08) : "background.paper",
                    color: active ? color : "text.secondary",
                  }}
                >
                  <Icon />
                  <Typography variant="caption" fontWeight={600} color={active ? "inherit" : "text.primary"}>
                    {label}
                  </Typography>
                </ButtonBase>
              );
            })}
          </Box>
        </Box>

        <TextField
          label="Nome da meta"
          name="title"
          placeholder="Ex.: Reserva de emergência"
          value={form.title}
          onChange={handleChange}
        />

        <TextField
          label="Valor da meta"
          name="targetAmount"
          placeholder="0,00"
          value={form.targetAmount}
          onChange={handleChange}
          inputProps={{ inputMode: "decimal" }}
          InputProps={moneyAdornment}
        />

        <TextField
          label="Já guardado"
          name="currentAmount"
          placeholder="0,00"
          value={form.currentAmount}
          onChange={handleChange}
          helperText="Quanto você já tinha separado antes de criar a meta. Depósitos e retiradas são registrados na própria meta."
          inputProps={{ inputMode: "decimal" }}
          InputProps={moneyAdornment}
        />
      </Stack>
    </Sheet>
  );
}
