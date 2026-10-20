import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Divider,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  CloudUploadOutlined,
  InsertDriveFileOutlined,
  CheckCircle,
} from "@mui/icons-material";

import { parseFile } from "../services/importing/parseFile";
import Money from "./ui/Money";
import { formatShortDate } from "../utils/format";

const BANKS = [
  { id: "btg", name: "BTG Pactual", logo: "/btg_logo.png", formats: ".pdf,.xlsx", available: true },
  { id: "nubank", name: "Nubank", logo: "/nubank_logo.png", available: false },
  { id: "c6", name: "C6 Bank", logo: "/c6_logo.png", available: false },
  { id: "bradesco", name: "Bradesco", logo: "/bradesco_logo.png", available: false },
];

const formatParsedDate = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? formatShortDate(value)
    : value || "—";

export default function ImportTransactionsFlow() {
  const [bank, setBank] = useState("btg");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parsedTransactions, setParsedTransactions] = useState(null);

  const selectedBank = BANKS.find((b) => b.id === bank);

  const handleFile = (f) => {
    setFile(f);
    setParsedTransactions(null);
    setError(null);
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const transactions = await parseFile(file, bank);
      setParsedTransactions(transactions);
    } catch (err) {
      console.error(err);
      setError("Não conseguimos ler este arquivo. Confira se é uma fatura do banco selecionado.");
    } finally {
      setLoading(false);
    }
  };

  const total = (parsedTransactions || []).reduce(
    (sum, t) => sum + Math.abs(Number(t.amount) || 0),
    0
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* BANK */}
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: "block", mb: 1 }}>
          Banco da fatura
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1 }}>
          {BANKS.map((b) => {
            const active = bank === b.id;
            return (
              <ButtonBase
                key={b.id}
                disabled={!b.available}
                onClick={() => {
                  setBank(b.id);
                  handleFile(null);
                }}
                sx={(theme) => ({
                  p: 1.25,
                  gap: 1.25,
                  borderRadius: 3,
                  justifyContent: "flex-start",
                  border: "1px solid",
                  borderColor: active ? theme.palette.primary.main : "divider",
                  backgroundColor: active ? alpha(theme.palette.primary.main, 0.06) : "background.paper",
                  opacity: b.available ? 1 : 0.55,
                })}
              >
                <Box
                  component="img"
                  src={b.logo}
                  alt=""
                  sx={{ width: 32, height: 32, borderRadius: "8px", objectFit: "contain", bgcolor: "#fff" }}
                />
                <Box textAlign="left" minWidth={0}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {b.name}
                  </Typography>
                  {!b.available && (
                    <Typography variant="caption" color="text.secondary">
                      Em breve
                    </Typography>
                  )}
                </Box>
              </ButtonBase>
            );
          })}
        </Box>
      </Box>

      {/* FILE */}
      <ButtonBase
        component="label"
        sx={(theme) => ({
          p: 3,
          borderRadius: 4,
          border: "1.5px dashed",
          borderColor: file ? theme.palette.primary.main : "rgba(13,31,24,0.2)",
          backgroundColor: file ? alpha(theme.palette.primary.main, 0.04) : "transparent",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          textAlign: "center",
        })}
      >
        {file ? (
          <InsertDriveFileOutlined color="primary" />
        ) : (
          <CloudUploadOutlined sx={{ color: "text.secondary" }} />
        )}
        <Typography variant="body2" fontWeight={600}>
          {file ? file.name : "Selecionar fatura"}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {file ? "Toque para trocar o arquivo" : `Formatos aceitos: ${selectedBank?.formats?.replaceAll(".", "").toUpperCase().replace(",", ", ")}`}
        </Typography>
        <input
          hidden
          type="file"
          accept={selectedBank?.formats}
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />
      </ButtonBase>

      <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
        O arquivo é lido apenas no seu dispositivo e não é enviado para nenhum servidor.
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}
      {loading && <LinearProgress />}

      {!parsedTransactions && (
        <Button
          variant="contained"
          size="large"
          disabled={!file || loading}
          onClick={handleImport}
        >
          {loading ? "Lendo fatura…" : "Ler fatura"}
        </Button>
      )}

      {/* PREVIEW */}
      {parsedTransactions && (
        <Box display="flex" flexDirection="column" gap={1.5}>
          <Box display="flex" alignItems="center" gap={1}>
            <CheckCircle color="primary" fontSize="small" />
            <Typography variant="subtitle2" flex={1}>
              {parsedTransactions.length} transações encontradas
            </Typography>
            <Money value={total} variant="body2" fontWeight={700} />
          </Box>

          <Paper variant="outlined" sx={{ maxHeight: 280, overflowY: "auto" }}>
            {parsedTransactions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: "center" }}>
                Nenhuma transação encontrada neste arquivo.
              </Typography>
            ) : (
              parsedTransactions.map((t, i) => (
                <Box key={i}>
                  {i > 0 && <Divider />}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.25 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ width: 52, flexShrink: 0, fontVariantNumeric: "tabular-nums" }}
                    >
                      {formatParsedDate(t.date)}
                    </Typography>
                    <Box flex={1} minWidth={0}>
                      <Typography variant="body2" fontWeight={600} noWrap>
                        {t.description || "Sem descrição"}
                      </Typography>
                      {t.parcel && t.parcel !== "0/0" && (
                        <Typography variant="caption" color="text.secondary">
                          Parcela {t.parcel}
                        </Typography>
                      )}
                    </Box>
                    <Money value={Math.abs(Number(t.amount) || 0)} variant="body2" fontWeight={600} />
                  </Box>
                </Box>
              ))
            )}
          </Paper>

          <Alert severity="info" variant="outlined">
            Esta é uma pré-visualização. Salvar as transações importadas na conta ainda está em desenvolvimento.
          </Alert>

          <Button variant="outlined" onClick={() => handleFile(null)}>
            Ler outro arquivo
          </Button>
        </Box>
      )}
    </Box>
  );
}
