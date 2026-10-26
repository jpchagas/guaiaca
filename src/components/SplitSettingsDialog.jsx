import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { CheckCircle } from "@mui/icons-material";
import { doc, updateDoc } from "firebase/firestore";

import { db } from "../firebaseConfig";
import Sheet from "./ui/Sheet";
import {
  SPLIT_MODES,
  computeSplit,
  validateFixedShares,
} from "../services/split/computeSplit";
import { rebalanceIncomeShares } from "../services/split/sharedIncomeService";
import { useAccount } from "../context/AccountContext";
import { useDate } from "../context/DateContext";
import { SPLIT_MODE_INFO } from "../utils/splitModes";
import { formatCurrency, getFirstName } from "../utils/format";

function initialShares(memberIds, saved) {
  const even = Math.floor((100 / (memberIds.length || 1)) * 100) / 100;
  return Object.fromEntries(
    memberIds.map((id, i) => {
      if (saved?.[id] !== undefined) return [id, String(saved[id])];
      // Give any rounding remainder to the last member so defaults sum to 100
      const value = i === memberIds.length - 1 ? 100 - even * (memberIds.length - 1) : even;
      return [id, String(Math.round(value * 100) / 100)];
    })
  );
}

const parsePercent = (v) => Number(String(v).replace(",", "."));

export default function SplitSettingsDialog({
  open,
  onClose,
  account,
  members,
  monthTransactions,
  currentUserId,
}) {
  const { transactions } = useAccount();
  const { selectedMonth, selectedYear } = useDate();

  const memberIds = useMemo(() => account?.members || [], [account?.members]);

  const [mode, setMode] = useState("equal");
  const [shares, setShares] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load the saved config when the sheet opens; later account snapshots
  // must not wipe a draft in progress
  useEffect(() => {
    if (!open || !account) return;
    setMode(SPLIT_MODES.includes(account.split?.mode) ? account.split.mode : "equal");
    setShares(initialShares(memberIds, account.split?.shares));
    setError(null);
  }, [open, account?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const numericShares = useMemo(
    () => Object.fromEntries(memberIds.map((id) => [id, parsePercent(shares[id])])),
    [memberIds, shares]
  );
  const shareSum = memberIds.reduce((s, id) => s + (numericShares[id] || 0), 0);
  const sharesValid = validateFixedShares(memberIds, numericShares);
  const canSave = !saving && (mode !== "fixed" || sharesValid);

  const preview = useMemo(
    () =>
      computeSplit({
        memberIds,
        transactions: monthTransactions,
        config: { mode, shares: numericShares },
      }),
    [memberIds, monthTransactions, mode, numericShares]
  );

  const nameOf = (id) => {
    const m = members.find((x) => x.id === id);
    const name = getFirstName(m?.name, m?.email) || "Membro";
    return id === currentUserId ? `${name} (você)` : name;
  };

  const handleShareChange = (id, value) => {
    const cleaned = value.replace(/[^\d.,]/g, "");
    setShares((prev) => {
      const next = { ...prev, [id]: cleaned };
      // With two people, keep the other share as the complement
      if (memberIds.length === 2) {
        const other = memberIds.find((x) => x !== id);
        const n = parsePercent(cleaned);
        if (Number.isFinite(n) && n >= 0 && n <= 100) {
          next[other] = String(Math.round((100 - n) * 100) / 100);
        }
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!canSave || !account?.id) return;

    setSaving(true);
    setError(null);

    try {
      const split = mode === "fixed" ? { mode, shares: numericShares } : { mode };
      await updateDoc(doc(db, "accounts", account.id), { split });
      // Shared incomes of the month follow the new rule; past months keep theirs
      await rebalanceIncomeShares({
        account: { ...account, split },
        transactions,
        year: selectedYear,
        month: selectedMonth,
      }).catch(console.error);
      setSaving(false);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Não foi possível salvar a configuração. Tente novamente.");
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={saving ? undefined : onClose}
      title="Divisão de despesas"
      subtitle="Como as despesas desta conta são divididas entre os membros."
      actions={
        <Button variant="contained" size="large" fullWidth onClick={handleSave} disabled={!canSave}>
          {saving ? "Salvando…" : "Salvar divisão"}
        </Button>
      }
    >
      <Box display="flex" flexDirection="column" gap={2.5}>
        {error && <Alert severity="error">{error}</Alert>}

        {/* MODE */}
        <Box display="flex" flexDirection="column" gap={1}>
          {SPLIT_MODES.map((value) => {
            const info = SPLIT_MODE_INFO[value];
            const active = mode === value;
            return (
              <ButtonBase
                key={value}
                onClick={() => setMode(value)}
                sx={(theme) => ({
                  p: 1.75,
                  gap: 1.5,
                  borderRadius: 3,
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                  textAlign: "left",
                  border: "1px solid",
                  borderColor: active ? theme.palette.primary.main : "divider",
                  backgroundColor: active ? alpha(theme.palette.primary.main, 0.06) : "background.paper",
                })}
              >
                <Box
                  sx={(theme) => ({
                    width: 36,
                    height: 36,
                    borderRadius: "10px",
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    color: "primary.main",
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  })}
                >
                  <info.Icon fontSize="small" />
                </Box>
                <Box flex={1} minWidth={0}>
                  <Typography fontWeight={600}>{info.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {info.description}
                  </Typography>
                </Box>
                {active && <CheckCircle color="primary" sx={{ fontSize: 20, mt: 0.5 }} />}
              </ButtonBase>
            );
          })}
        </Box>

        {/* FIXED SHARES */}
        {mode === "fixed" && (
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} component="div" mb={1}>
              Percentual de cada pessoa
            </Typography>
            <Box display="flex" flexDirection="column" gap={1.5}>
              {memberIds.map((id) => (
                <TextField
                  key={id}
                  label={nameOf(id)}
                  value={shares[id] ?? ""}
                  onChange={(e) => handleShareChange(id, e.target.value)}
                  inputProps={{ inputMode: "decimal" }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    sx: { fontVariantNumeric: "tabular-nums" },
                  }}
                />
              ))}
            </Box>
            <Typography
              variant="caption"
              fontWeight={600}
              color={sharesValid ? "primary" : "error"}
              component="div"
              mt={1}
            >
              Total: {Math.round(shareSum * 100) / 100}%{sharesValid ? "" : " · precisa somar 100%"}
            </Typography>
          </Box>
        )}

        {mode === "proportional" && (
          <Typography variant="caption" color="text.secondary">
            A renda de cada pessoa é a soma das receitas lançadas nesta conta no mês, pelo campo
            Responsável. Sem receitas no mês, a divisão fica igual.
          </Typography>
        )}

        {/* PREVIEW */}
        <Box sx={{ p: 2, borderRadius: 3, bgcolor: "rgba(13,31,24,0.035)" }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} component="div" mb={1}>
            Prévia com as despesas deste mês ({formatCurrency(preview.total)})
          </Typography>
          {mode === "joint" ? (
            <Typography variant="body2">
              Renda de {formatCurrency(preview.totalIncome)} e despesas de {formatCurrency(preview.total)} no
              mesmo caixa: sobra {formatCurrency(preview.remaining)}, sem transferências entre vocês.
            </Typography>
          ) : (
            <Box display="flex" flexDirection="column" gap={0.75}>
              {preview.rows.map((row) => (
                <Box key={row.id} display="flex" justifyContent="space-between" gap={1}>
                  <Typography variant="body2" noWrap>
                    {nameOf(row.id)} · {`${Math.round(row.share * 1000) / 10}%`.replace(".", ",")}
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatCurrency(row.owed)}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
          {preview.warning === "noIncome" && (
            <Typography variant="caption" color="text.secondary" component="div" mt={1}>
              Ainda não há receitas com responsável neste mês. A prévia usa divisão igual.
            </Typography>
          )}
        </Box>
      </Box>
    </Sheet>
  );
}
