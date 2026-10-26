import { useMemo } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  ArrowForward,
  CheckCircleOutline,
  TuneOutlined,
} from "@mui/icons-material";

import Money from "./ui/Money";
import { computeSplit } from "../services/split/computeSplit";
import { SPLIT_MODE_INFO } from "../utils/splitModes";
import { formatCurrency, getFirstName, getInitials } from "../utils/format";

const pct = (share) => `${Math.round(share * 1000) / 10}%`.replace(".", ",");

export default function SplitSummaryCard({
  account,
  members,
  monthTransactions,
  currentUserId,
  onEdit,
}) {
  const memberIds = useMemo(() => account.members || [], [account.members]);

  const split = useMemo(
    () => computeSplit({ memberIds, transactions: monthTransactions, config: account.split }),
    [memberIds, monthTransactions, account.split]
  );

  const nameOf = (id) => {
    if (id === currentUserId) return "Você";
    const m = members.find((x) => x.id === id);
    return getFirstName(m?.name, m?.email) || "Membro";
  };
  const memberOf = (id) => members.find((x) => x.id === id);

  const modeInfo = SPLIT_MODE_INFO[split.mode];
  const isJoint = split.mode === "joint";

  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      {/* HEADER */}
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
        <Box minWidth={0}>
          <Typography variant="subtitle2">{isJoint ? "Caixa do mês" : "Divisão do mês"}</Typography>
          <Typography variant="caption" color="text.secondary">
            {isJoint ? "Despesas da conta" : "Despesas compartilhadas"}
          </Typography>
          <Money value={split.total} component="div" variant="h6" fontWeight={700} />
        </Box>

        <Button
          size="small"
          variant="outlined"
          startIcon={<TuneOutlined />}
          onClick={onEdit}
          sx={{ flexShrink: 0 }}
        >
          {modeInfo.short}
        </Button>
      </Box>

      {isJoint ? (
        <JointSummary split={split} nameOf={nameOf} memberOf={memberOf} />
      ) : memberIds.length < 2 ? (
        <Typography variant="body2" color="text.secondary" mt={2}>
          Convide outra pessoa para esta conta para dividir as despesas.
        </Typography>
      ) : (
        <>
          {split.warning === "noIncome" && (
            <Alert severity="info" variant="outlined" sx={{ mt: 2 }}>
              Nenhuma receita com responsável neste mês. Usando divisão igual até que as rendas sejam lançadas.
            </Alert>
          )}
          {split.warning === "invalidShares" && (
            <Alert
              severity="warning"
              variant="outlined"
              sx={{ mt: 2 }}
              action={<Button color="inherit" size="small" onClick={onEdit}>Revisar</Button>}
            >
              Os percentuais não somam 100%. Usando divisão igual.
            </Alert>
          )}

          {/* MEMBERS */}
          <Box display="flex" flexDirection="column" gap={2} mt={2.5}>
            {split.rows.map((row) => {
              const m = memberOf(row.id);
              return (
                <Box key={row.id}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar sx={{ width: 36, height: 36, fontSize: 14, fontWeight: 700, bgcolor: "secondary.main" }}>
                      {getInitials(m?.name, m?.email)}
                    </Avatar>

                    <Box flex={1} minWidth={0}>
                      <Typography fontWeight={600} noWrap>
                        {nameOf(row.id)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {pct(row.share)} das despesas
                      </Typography>
                    </Box>

                    <Box textAlign="right">
                      <Money value={row.owed} component="div" fontWeight={700} />
                      <Typography variant="caption" color="text.secondary">
                        parte a pagar
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      mt: 1,
                      ml: { xs: 0, sm: 6 },
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 1,
                      p: 1.25,
                      borderRadius: 2.5,
                      bgcolor: "rgba(13,31,24,0.035)",
                    }}
                  >
                    {[
                      { label: "Renda", value: row.income },
                      { label: "Já pagou", value: row.paid },
                      { label: "Sobra", value: row.income > 0 ? row.remaining : null },
                    ].map((item) => (
                      <Box key={item.label} minWidth={0}>
                        <Typography variant="caption" color="text.secondary" component="div">
                          {item.label}
                        </Typography>
                        {item.value === null ? (
                          <Typography variant="caption" color="text.secondary">—</Typography>
                        ) : (
                          <Money
                            value={item.value}
                            component="div"
                            variant="caption"
                            fontWeight={700}
                            sx={{
                              color: item.label === "Sobra" && item.value < 0 ? "error.main" : "text.primary",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          />
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* SETTLEMENT */}
          {split.total > 0 && (
            <>
              <Divider sx={{ my: 2.5 }} />

              <Typography variant="caption" color="text.secondary" fontWeight={600} component="div" mb={1}>
                Acerto de contas
              </Typography>

              {split.transfers.length === 0 ? (
                <Box display="flex" alignItems="center" gap={1} color="primary.main">
                  <CheckCircleOutline fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>
                    Contas equilibradas: ninguém precisa transferir nada.
                  </Typography>
                </Box>
              ) : (
                <Box display="flex" flexDirection="column" gap={1}>
                  {split.transfers.map((t) => (
                    <Box
                      key={`${t.from}-${t.to}`}
                      sx={(theme) => ({
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: alpha(theme.palette.primary.main, 0.07),
                      })}
                    >
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {nameOf(t.from)}
                      </Typography>
                      <ArrowForward sx={{ fontSize: 16, color: "primary.main" }} />
                      <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1 }}>
                        {nameOf(t.to)}
                      </Typography>
                      <Chip
                        label={formatCurrency(t.amount)}
                        color="primary"
                        size="small"
                        sx={{ fontVariantNumeric: "tabular-nums" }}
                      />
                    </Box>
                  ))}
                </Box>
              )}

              {split.unassignedPaid > 0 && (
                <Typography variant="caption" color="text.secondary" component="div" mt={1.5}>
                  {formatCurrency(split.unassignedPaid)} em despesas sem responsável entram no total, mas não contam como pagas por ninguém.
                </Typography>
              )}
            </>
          )}
        </>
      )}
    </Paper>
  );
}

/** Conta única: one pooled budget, so show the totals and who brought in / paid what. */
function JointSummary({ split, nameOf, memberOf }) {
  return (
    <>
      <Box
        sx={{
          mt: 2,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 1,
          p: 1.25,
          borderRadius: 2.5,
          bgcolor: "rgba(13,31,24,0.035)",
        }}
      >
        {[
          { label: "Renda", value: split.totalIncome },
          { label: "Despesas", value: split.total },
          { label: "Sobra", value: split.remaining },
        ].map((item) => (
          <Box key={item.label} minWidth={0}>
            <Typography variant="caption" color="text.secondary" component="div">
              {item.label}
            </Typography>
            <Money
              value={item.value}
              component="div"
              variant="body2"
              fontWeight={700}
              sx={{
                color: item.label === "Sobra" && item.value < 0 ? "error.main" : "text.primary",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            />
          </Box>
        ))}
      </Box>

      <Typography variant="caption" color="text.secondary" component="div" mt={2}>
        Tudo o que entra e sai é dos dois, então não há acerto de contas.
      </Typography>

      {split.rows.length > 1 && (
        <Box display="flex" flexDirection="column" gap={1.25} mt={1.5}>
          {split.rows.map((row) => {
            const m = memberOf(row.id);
            return (
              <Box key={row.id} display="flex" alignItems="center" gap={1.5}>
                <Avatar sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 700, bgcolor: "secondary.main" }}>
                  {getInitials(m?.name, m?.email)}
                </Avatar>
                <Typography variant="body2" fontWeight={600} noWrap sx={{ flex: 1 }}>
                  {nameOf(row.id)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  entrou {formatCurrency(row.income)} · pagou {formatCurrency(row.paid)}
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}
    </>
  );
}
