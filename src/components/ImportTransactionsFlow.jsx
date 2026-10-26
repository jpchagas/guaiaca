import { useCallback, useMemo, useState } from "react";

import {
  Alert,
  Avatar,
  Box,
  Button,
  ButtonBase,
  Chip,
  LinearProgress,
  Paper,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  CloudUploadOutlined,
  InsertDriveFileOutlined,
  CheckCircle,
  ErrorOutline,
} from "@mui/icons-material";

import { parseStatementFile } from "../services/importing/parseFile";
import { SUPPORTED_BANKS } from "../services/importing/parseStatement";
import { matchCardholder } from "../services/importing/matchCardholder";
import { buildCategorySuggester } from "../services/importing/suggestCategory";
import { buildImportDrafts } from "../services/importing/importDrafts";
import { createImportedTransactions } from "../services/transactions/transactionService";
import { findCardForBill, resolveImportCard } from "../services/cards/cardService";
import { isSplitAccount, isSplitIncome, planIncomeSplit } from "../services/split/incomeShare";
import { defaultTarget, destinationOptions } from "../services/split/sharedIncomeService";
import { useAccount } from "../context/AccountContext";
import { useCategories } from "../hooks/useCategories";
import { useCards } from "../hooks/useCards";
import { bankIdOf, bankInfo } from "../utils/banks";
import ImportReviewList from "./ImportReviewList";
import Money from "./ui/Money";
import { finance } from "../theme";
import { normalizeCategoryKey } from "../utils/categoryVisuals";
import { formatCurrency, formatShortDate, getFirstName, getInitials } from "../utils/format";

const ERROR_MESSAGES = {
  unsupportedFile: "Envie o extrato ou a fatura em PDF (ou CSV, quando o banco oferecer).",
  scannedPdf: "Este PDF é uma imagem digitalizada, sem texto para ler. Exporte o extrato pelo app ou internet banking do seu banco.",
  unknownBank: `Não reconhecemos este arquivo. Bancos suportados: ${SUPPORTED_BANKS.map((b) => b.name).join(", ")}.`,
  noTransactions: "Reconhecemos o banco, mas não encontramos lançamentos neste arquivo.",
};

const CHECK_LABELS = { in: "entradas", out: "saídas", net: "total" };

export default function ImportTransactionsFlow({ currentAccount, members = [], currentUserId, onClose }) {
  const { transactions: existing, accounts } = useAccount();
  const categories = useCategories();
  const { cards } = useCards(accounts.map((a) => a.id));

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statement, setStatement] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(null);

  const handleFile = (f) => {
    setFile(f);
    setStatement(null);
    setDrafts([]);
    setError(null);
    setSavedCount(null);
  };

  const handleRead = async () => {
    if (!file || !currentAccount?.id) return;

    setLoading(true);
    setError(null);

    try {
      const parsed = await parseStatementFile(file);
      const suggest = buildCategorySuggester({ categories, history: existing });
      setDrafts(
        buildImportDrafts(parsed, {
          accountId: currentAccount.id,
          members,
          currentUserId,
          existingIds: new Set(existing.map((t) => t.id)),
          suggest,
        }).map((d) => ({ ...d, target: defaultTarget(currentAccount) }))
      );
      setStatement(parsed);
    } catch (err) {
      console.error(err);
      setError(
        ERROR_MESSAGES[err.code] ||
          "Não conseguimos ler este arquivo. Confira se é um extrato ou fatura do seu banco."
      );
    } finally {
      setLoading(false);
    }
  };

  const selected = drafts.filter((d) => d.include);
  // Rows left without a category are saved as "Outros" and can be edited later
  const fallbackCategory = categories.find((c) => normalizeCategoryKey(c.name) === "outros")?.id || "";
  const uncategorized = selected.filter((d) => !d.category).length;
  const skipped = drafts.filter((d) => d.skipReason).length;

  // A card bill goes to one card: an existing one of that bank sharing a card number, or a new one
  const isCard = statement?.kind === "credit_card";
  const bank = statement ? bankIdOf(statement.bank.id) : null;
  const billLast4s = useMemo(
    () => [...new Set((statement?.transactions || []).map((t) => t.cardLast4).filter(Boolean))],
    [statement]
  );
  const billCard = isCard ? findCardForBill(cards, bank, billLast4s) : null;

  // Shared or personal per row, in accounts that split per person (see split/incomeShare.js)
  const categoriesById = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const ctx = { currentAccount, accounts, members, transactions: existing, categoriesById };

  const destinationsFor = useCallback(
    (d) => destinationOptions({ currentAccount, accounts, members, responsibleUserId: d.responsibleUserId }),
    [currentAccount, accounts, members]
  );

  const splitLabelFor = useCallback(
    (d) => {
      const account = accounts.find((a) => a.id === d.target);
      if (
        !isSplitAccount(account) ||
        !isSplitIncome(d.classification, categoriesById[d.category]) ||
        !(account.members || []).includes(d.responsibleUserId)
      ) {
        return null;
      }
      const { shared, personal } = planIncomeSplit({
        account,
        responsibleUserId: d.responsibleUserId,
        amount: d.row.amount,
        date: d.date,
        transactions: existing,
        excludeIds: [d.id, `${d.id}_p`],
      });
      return `${formatCurrency(shared)} compartilhado · ${formatCurrency(personal)} pessoal`;
    },
    [accounts, categoriesById, existing]
  );

  const bulkTargets = destinationsFor({ responsibleUserId: currentUserId }).map((o) =>
    o.value === "personal" ? { ...o, label: "Pessoal", disabled: false } : o
  );

  // Rows that can't go somewhere (a partner without a personal account yet) keep their target
  const sendAllTo = (target) =>
    setDrafts((list) =>
      list.map((d) =>
        d.include && destinationsFor(d).some((o) => o.value === target && !o.disabled) ? { ...d, target } : d
      )
    );

  const handleSave = async () => {
    if (!selected.length || saving) return;

    setSaving(true);
    setError(null);

    try {
      const cardId = isCard
        ? await resolveImportCard({
            cards,
            accountId: currentAccount.id,
            bank,
            last4s: billLast4s,
            ownerId: matchCardholder(statement.holders[0], members)?.id || currentUserId || null,
          })
        : null;

      await createImportedTransactions({
        drafts: selected.map((d) => (d.category ? d : { ...d, category: fallbackCategory })),
        statement,
        currentAccountId: currentAccount.id,
        cardId,
        ctx,
      });
      setSavedCount(selected.length);
    } catch (err) {
      console.error(err);
      setError(
        err.code === "noPersonalAccount"
          ? "Alguém ainda não abriu o app desde a atualização, então a conta pessoal dessa pessoa não está disponível. Mova esses lançamentos para a conta compartilhada ou peça para abrir o app uma vez."
          : err.code === "permission-denied"
          ? "Sem permissão para salvar em uma das contas pessoais escolhidas."
          : "Não foi possível salvar as transações. Verifique sua conexão e tente novamente."
      );
    } finally {
      setSaving(false);
    }
  };

  // Name printed on the statement → account member
  const holders = useMemo(() => {
    const map = {};
    (statement?.holders || []).forEach((name) => {
      map[name] = matchCardholder(name, members);
    });
    return map;
  }, [statement, members]);

  const memberLabel = (m) =>
    m.id === currentUserId ? "Você" : getFirstName(m.name, m.email);

  const mismatch = statement?.check && !statement.check.ok
    ? Object.keys(statement.check.expected).find(
        (k) => Math.abs(statement.check.expected[k] - statement.check.actual[k]) >= 0.01
      )
    : null;

  /* -------------------- Done -------------------- */
  if (savedCount != null) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" gap={1.5} py={3} textAlign="center">
        <CheckCircle color="primary" sx={{ fontSize: 48 }} />
        <Typography variant="h6" fontWeight={700}>
          {savedCount} {savedCount === 1 ? "transação importada" : "transações importadas"}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isCard
            ? `Lançadas em ${formatShortDate(drafts[0]?.date)}, mês de vencimento da fatura.`
            : "Você pode editar qualquer uma delas na tela de transações."}
        </Typography>
        <Box display="flex" gap={1.5} width="100%" mt={1}>
          <Button fullWidth variant="outlined" onClick={() => handleFile(null)}>
            Importar outro
          </Button>
          <Button fullWidth variant="contained" onClick={onClose}>
            Concluir
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* FILE */}
      {!statement && (
        <>
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
              {file ? file.name : "Selecionar extrato ou fatura"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {file
                ? "Toque para trocar o arquivo"
                : "PDF ou CSV — o banco e o tipo de documento são identificados automaticamente"}
            </Typography>
            <input
              hidden
              type="file"
              accept=".pdf,.csv,application/pdf,text/csv"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
            />
          </ButtonBase>

          <Box display="flex" alignItems="center" gap={1} mt={-1}>
            <Typography variant="caption" color="text.secondary">
              Bancos suportados:
            </Typography>
            {SUPPORTED_BANKS.map((b) => (
              <Box
                key={b.name}
                component="img"
                src={b.logo}
                alt={b.name}
                title={b.name}
                sx={{ width: 22, height: 22, borderRadius: "6px", objectFit: "contain", bgcolor: "#fff" }}
              />
            ))}
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
            O arquivo é lido apenas no seu dispositivo e não é enviado para nenhum servidor.
          </Typography>
        </>
      )}

      {error && <Alert severity="error">{error}</Alert>}
      {(loading || saving) && <LinearProgress />}

      {!statement && (
        <Button
          variant="contained"
          size="large"
          disabled={!file || loading}
          onClick={handleRead}
        >
          {loading ? "Lendo arquivo…" : "Ler arquivo"}
        </Button>
      )}

      {/* REVIEW */}
      {statement && (
        <Box display="flex" flexDirection="column" gap={1.5}>
          {/* BANK + TOTALS */}
          <Paper variant="outlined" sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              component="img"
              src={statement.bank.logo}
              alt=""
              sx={{ width: 36, height: 36, borderRadius: "8px", objectFit: "contain", bgcolor: "#fff" }}
            />
            <Box flex={1} minWidth={0}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {isCard ? "Fatura" : "Extrato"} {statement.bank.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {statement.transactions.length} lançamentos
                {statement.dueDate && ` · vence ${formatShortDate(statement.dueDate)}`}
                {statement.period && ` · ${formatShortDate(statement.period[0])} a ${formatShortDate(statement.period[1])}`}
              </Typography>
            </Box>
            {isCard ? (
              <Money value={statement.totals.out - statement.totals.in} variant="body2" fontWeight={700} />
            ) : (
              <Box textAlign="right">
                <Money value={statement.totals.in} sign="plus" variant="caption" fontWeight={700} component="div" sx={{ color: finance.revenue }} />
                <Money value={statement.totals.out} sign="minus" variant="caption" fontWeight={700} component="div" sx={{ color: finance.expense }} />
              </Box>
            )}
          </Paper>

          {statement.check?.ok && (
            <Box display="flex" alignItems="center" gap={0.75} color="primary.main">
              <CheckCircle sx={{ fontSize: 16 }} />
              <Typography variant="caption" fontWeight={600}>
                Totais conferem com {isCard ? "a fatura" : "o extrato"}
              </Typography>
            </Box>
          )}
          {mismatch && (
            <Alert severity="warning" icon={<ErrorOutline fontSize="inherit" />}>
              {isCard ? "A fatura" : "O extrato"} informa {CHECK_LABELS[mismatch]} de{" "}
              {formatCurrency(Math.abs(statement.check.expected[mismatch]))}, mas somamos{" "}
              {formatCurrency(Math.abs(statement.check.actual[mismatch]))}. Alguns lançamentos podem não ter sido lidos.
            </Alert>
          )}

          {isCard && (
            <Typography variant="caption" color="text.secondary">
              {billCard
                ? `Vai para o cartão ${billCard.name}.`
                : `Vamos criar o cartão ${bankInfo(bank).name}${billLast4s[0] ? ` (final ${billLast4s.join(", ")})` : ""}. Você pode renomeá-lo e definir o limite na aba Cartões.`}
            </Typography>
          )}

          {/* HOLDERS */}
          {statement.holders.length > 0 && (
            <Box display="flex" flexWrap="wrap" gap={1}>
              {statement.holders.map((name) => {
                const member = holders[name];
                return (
                  <Chip
                    key={name}
                    size="small"
                    variant="outlined"
                    color={member ? "primary" : "default"}
                    avatar={
                      <Avatar sx={{ fontSize: 10 }}>
                        {member ? getInitials(member.name, member.email) : "?"}
                      </Avatar>
                    }
                    label={member ? `${name} · ${memberLabel(member)}` : `${name} · não é membro`}
                  />
                );
              })}
            </Box>
          )}

          {skipped > 0 && (
            <Typography variant="caption" color="text.secondary">
              {skipped} {skipped === 1 ? "lançamento ficou desmarcado" : "lançamentos ficaram desmarcados"}{" "}
              (pagamentos de fatura, transferências entre contas ou já importados). Marque se quiser incluir.
            </Typography>
          )}

          {uncategorized > 0 && (
            <Typography variant="caption" color="text.secondary">
              {uncategorized} {uncategorized === 1 ? "lançamento sem categoria vai" : "lançamentos sem categoria vão"} para
              "Outros". Você pode mudar depois, editando a transação.
            </Typography>
          )}

          {bulkTargets.length > 0 && (
            <Box display="flex" alignItems="center" flexWrap="wrap" gap={1}>
              <Typography variant="caption" color="text.secondary">
                Enviar todos para:
              </Typography>
              {bulkTargets.map((o) => (
                <Chip key={o.value} size="small" label={o.label} onClick={() => sendAllTo(o.value)} />
              ))}
            </Box>
          )}

          <ImportReviewList
            drafts={drafts}
            onChange={setDrafts}
            categories={categories}
            holders={holders}
            currentUserId={currentUserId}
            showHolder={statement.holders.length > 1}
            destinationsFor={destinationsFor}
            splitLabelFor={splitLabelFor}
          />

          <Box display="flex" gap={1.5}>
            <Button variant="outlined" onClick={() => handleFile(null)} disabled={saving} sx={{ flexShrink: 0 }}>
              Trocar
            </Button>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={handleSave}
              disabled={!selected.length || saving}
            >
              {saving
                ? "Importando…"
                : `Importar ${selected.length} ${selected.length === 1 ? "transação" : "transações"}`}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
