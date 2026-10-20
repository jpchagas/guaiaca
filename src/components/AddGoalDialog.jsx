import { useState } from "react";
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

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAccount } from "../context/AccountContext";
import Sheet from "./ui/Sheet";
import { GOAL_TYPES } from "../utils/goalTypes";
import { parseAmountInput } from "../utils/format";

const EMPTY_FORM = { title: "", type: "savings", targetAmount: "" };

export default function AddGoalDialog({ open, onClose }) {
  const { currentAccount } = useAccount();

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const target = parseAmountInput(form.targetAmount);
  const canSubmit = form.title.trim() && target > 0 && !saving;

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleClose = () => {
    if (saving) return;
    setForm(EMPTY_FORM);
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit || !currentAccount?.id) return;

    try {
      setSaving(true);
      setError(null);

      await addDoc(collection(db, "goals"), {
        accountId: currentAccount.id,
        title: form.title.trim(),
        type: form.type,
        targetAmount: target,
        currentAmount: 0,
        createdAt: serverTimestamp(),
      });

      setSaving(false);
      handleClose();
    } catch (err) {
      console.error(err);
      setError("Não foi possível criar a meta. Tente novamente.");
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title="Nova meta"
      subtitle="Defina um objetivo e acompanhe seu progresso."
      actions={
        <Button variant="contained" size="large" fullWidth onClick={handleSubmit} disabled={!canSubmit}>
          {saving ? "Salvando…" : "Criar meta"}
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
