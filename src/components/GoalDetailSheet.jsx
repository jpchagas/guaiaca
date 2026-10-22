import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  LinearProgress,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DeleteOutline, EditOutlined, Close } from "@mui/icons-material";

import Sheet from "./ui/Sheet";
import Money from "./ui/Money";
import ConfirmActionDialog from "./ConfirmActionDialog";
import { finance } from "../theme";
import { GOAL_TYPES, getGoalBalance } from "../utils/goalTypes";
import { formatCurrency, formatShortDate, getFirstName, parseAmountInput, toDate } from "../utils/format";
import { addContribution, deleteGoal, removeContribution } from "../services/goals/goalService";

/** A goal's progress and history, with deposits/withdrawals, edit and delete. */
export default function GoalDetailSheet({ open, onClose, goal, members = [], currentUserId, onEdit }) {
  const [direction, setDirection] = useState("deposit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setDirection("deposit");
      setAmount("");
      setNote("");
      setError(null);
    }
  }, [open, goal?.id]);

  if (!goal) return null;

  const type = GOAL_TYPES[goal.type] || GOAL_TYPES.savings;
  const balance = getGoalBalance(goal);
  const target = Number(goal.targetAmount) || 0;
  const progress = target ? Math.min((balance / target) * 100, 100) : 0;
  const parsed = parseAmountInput(amount);
  const canAdd = parsed > 0 && !saving;

  const history = [...(goal.contributions || [])].sort(
    (a, b) => (toDate(b.date) || 0) - (toDate(a.date) || 0)
  );

  const nameOf = (uid) => {
    if (!uid) return null;
    if (uid === currentUserId) return "Você";
    const m = members.find((x) => x.id === uid);
    return m ? getFirstName(m.name, m.email) : null;
  };

  const handleAdd = async () => {
    if (!canAdd) return;
    setSaving(true);
    setError(null);
    try {
      await addContribution(goal.id, {
        amount: direction === "deposit" ? parsed : -parsed,
        note: note.trim(),
      });
      setAmount("");
      setNote("");
    } catch (err) {
      console.error(err);
      setError("Não foi possível registrar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (contribution) => {
    try {
      await removeContribution(goal.id, contribution);
    } catch (err) {
      console.error(err);
      setError("Não foi possível remover o lançamento.");
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await deleteGoal(goal.id);
      setConfirmDelete(false);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Não foi possível excluir a meta.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={goal.title}
        subtitle={type.label}
        actions={
          <>
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
            <Button fullWidth variant="outlined" startIcon={<EditOutlined />} onClick={onEdit} disabled={saving}>
              Editar meta
            </Button>
          </>
        }
      >
        <Box display="flex" flexDirection="column" gap={2.5}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* PROGRESS */}
          <Box>
            <Box display="flex" alignItems="baseline" gap={1} flexWrap="wrap">
              <Money value={balance} sx={{ fontSize: 28, fontWeight: 700, letterSpacing: "-0.02em" }} />
              <Typography variant="body2" color="text.secondary">
                de {formatCurrency(target)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 10, my: 1.25, "& .MuiLinearProgress-bar": { backgroundColor: type.color } }}
            />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {balance >= target
                ? "Meta atingida 🎉"
                : `Faltam ${formatCurrency(target - balance)} · ${Math.round(progress)}%`}
            </Typography>
          </Box>

          {/* NEW CONTRIBUTION */}
          <Box
            sx={{
              p: 2,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <ToggleButtonGroup
              value={direction}
              exclusive
              fullWidth
              size="small"
              onChange={(_, v) => v && setDirection(v)}
              sx={{ gap: 1, "& .MuiToggleButtonGroup-grouped": { border: "1px solid", borderColor: "divider", borderRadius: "10px !important", m: 0 } }}
            >
              {[
                { value: "deposit", label: "Guardar", color: finance.revenue },
                { value: "withdraw", label: "Retirar", color: finance.expense },
              ].map((o) => (
                <ToggleButton
                  key={o.value}
                  value={o.value}
                  sx={{
                    "&.Mui-selected, &.Mui-selected:hover": {
                      color: o.color,
                      borderColor: `${alpha(o.color, 0.5)} !important`,
                      backgroundColor: alpha(o.color, 0.08),
                    },
                  }}
                >
                  {o.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <TextField
              size="small"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputProps={{ inputMode: "decimal", "aria-label": "Valor" }}
              InputProps={{
                startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                sx: { fontVariantNumeric: "tabular-nums" },
              }}
            />
            <TextField
              size="small"
              placeholder="Observação (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button variant="contained" onClick={handleAdd} disabled={!canAdd}>
              {saving ? "Salvando…" : direction === "deposit" ? "Registrar depósito" : "Registrar retirada"}
            </Button>
          </Box>

          {/* HISTORY */}
          <Box>
            <Typography variant="overline" color="text.secondary">
              Histórico
            </Typography>
            {history.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Nenhum depósito ainda.
                {Number(goal.currentAmount) > 0 && ` Começou com ${formatCurrency(goal.currentAmount)}.`}
              </Typography>
            ) : (
              history.map((c, i) => (
                <Box key={c.id || i}>
                  {i > 0 && <Divider />}
                  <Box display="flex" alignItems="center" gap={1.5} py={1}>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {c.note || (c.amount >= 0 ? "Depósito" : "Retirada")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[formatShortDate(c.date), nameOf(c.by)].filter(Boolean).join(" · ")}
                      </Typography>
                    </Box>
                    <Money
                      value={Math.abs(c.amount)}
                      sign={c.amount >= 0 ? "plus" : "minus"}
                      variant="body2"
                      fontWeight={600}
                      sx={{ color: c.amount >= 0 ? finance.revenue : finance.expense }}
                    />
                    <IconButton size="small" aria-label="Remover lançamento" onClick={() => handleRemove(c)}>
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Sheet>

      <ConfirmActionDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        loading={saving}
        title="Excluir meta"
        description={`"${goal.title}" e todo o seu histórico serão excluídos. Essa ação não pode ser desfeita.`}
        confirmText="Excluir"
      />
    </>
  );
}
