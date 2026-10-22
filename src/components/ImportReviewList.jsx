import { memo, useCallback } from "react";
import {
  Box,
  Checkbox,
  Divider,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from "@mui/material";

import CategoryAvatar from "./ui/CategoryAvatar";
import Money from "./ui/Money";
import { finance } from "../theme";
import { formatShortDate, getFirstName } from "../utils/format";
import { descriptionKey } from "../services/importing/suggestCategory";

const AMOUNT_COLORS = {
  revenue: finance.revenue,
  expense: undefined,
  investment: finance.investment,
};

const ReviewRow = memo(function ReviewRow({ draft, categories, holderLabel, onToggle, onCategory }) {
  const { row } = draft;
  const missing = draft.include && !draft.category;

  const details = [
    row.installment && `Parcela ${row.installment.current}/${row.installment.total}`,
    draft.purchaseDate && `compra em ${formatShortDate(draft.purchaseDate)}`,
    row.memo,
    holderLabel,
    draft.skipReason,
  ].filter(Boolean);

  return (
    <Box sx={{ px: 1, py: 1, opacity: draft.include ? 1 : 0.55 }}>
      <Box display="flex" alignItems="center" gap={0.5}>
        <Checkbox
          size="small"
          checked={draft.include}
          disabled={draft.alreadyImported}
          onChange={(e) => onToggle(draft.id, e.target.checked)}
          inputProps={{ "aria-label": `Importar ${row.description}` }}
        />
        <Box flex={1} minWidth={0}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {row.description}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="div">
            {[formatShortDate(draft.date), ...details].join(" · ")}
          </Typography>
        </Box>
        <Money
          value={row.amount}
          sign={draft.classification === "revenue" ? "plus" : "none"}
          variant="body2"
          fontWeight={600}
          sx={{ color: AMOUNT_COLORS[draft.classification], pr: 1 }}
        />
      </Box>

      {draft.include && (
        <TextField
          select
          size="small"
          fullWidth
          value={draft.category}
          onChange={(e) => onCategory(draft.id, e.target.value)}
          error={missing}
          SelectProps={{
            displayEmpty: true,
            MenuProps: { PaperProps: { sx: { maxHeight: 360 } } },
            renderValue: (id) => {
              const c = categories.find((x) => x.id === id);
              if (!c) {
                return (
                  <Typography variant="body2" color="error">
                    Escolha uma categoria
                  </Typography>
                );
              }
              return (
                <Box display="flex" alignItems="center" gap={1}>
                  <CategoryAvatar category={c} size={22} />
                  <Typography variant="body2">{c.name}</Typography>
                </Box>
              );
            },
          }}
          sx={{ mt: 0.75, pl: 5.25, pr: 1, "& .MuiSelect-select": { py: 0.75 } }}
        >
          {categories.map((c) => (
            <MenuItem key={c.id} value={c.id} sx={{ gap: 1.25 }}>
              <CategoryAvatar category={c} size={26} />
              {c.name}
            </MenuItem>
          ))}
        </TextField>
      )}
    </Box>
  );
});

/**
 * Review step for imported rows: include/exclude each one and set its
 * category. Picking a category also fills other uncategorized rows with the
 * same description.
 */
export default function ImportReviewList({ drafts, onChange, categories, holders, currentUserId, showHolder }) {
  const toggle = useCallback(
    (id, include) => onChange((list) => list.map((d) => (d.id === id ? { ...d, include } : d))),
    [onChange]
  );

  const setCategory = useCallback(
    (id, category) =>
      onChange((list) => {
        const key = descriptionKey(list.find((d) => d.id === id)?.row.description);
        return list.map((d) =>
          d.id === id || (d.include && !d.category && descriptionKey(d.row.description) === key)
            ? { ...d, category }
            : d
        );
      }),
    [onChange]
  );

  const holderLabel = (draft) => {
    if (!showHolder || !draft.row.holder) return null;
    const member = holders[draft.row.holder];
    if (!member) return draft.row.holder;
    return member.id === currentUserId ? "Você" : getFirstName(member.name, member.email);
  };

  return (
    <Paper variant="outlined" sx={{ maxHeight: 420, overflowY: "auto" }}>
      {drafts.map((d, i) => (
        <Box key={d.id}>
          {i > 0 && <Divider />}
          <ReviewRow
            draft={d}
            categories={categories}
            holderLabel={holderLabel(d)}
            onToggle={toggle}
            onCategory={setCategory}
          />
        </Box>
      ))}
    </Paper>
  );
}
