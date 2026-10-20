import { useEffect, useState } from "react";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { EditNoteOutlined, UploadFileOutlined } from "@mui/icons-material";

import Sheet from "./ui/Sheet";
import ManualTransactionForm from "./ManualTransactionForm";
import ImportTransactionsFlow from "./ImportTransactionsFlow";

export default function TransactionEntryDialog({
  open,
  onClose,
  currentAccount,
  members = [],
  currentUserId,
  initialData = null,
  mode = "create",
  onDelete,
}) {
  const isEdit = mode === "edit";
  const [entryMode, setEntryMode] = useState("manual");

  // Always reopen on the manual form
  useEffect(() => {
    if (open) setEntryMode("manual");
  }, [open]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar transação" : "Nova transação"}
      subtitle={currentAccount?.name ? `Conta: ${currentAccount.name}` : undefined}
    >
      {!isEdit && (
        <ToggleButtonGroup
          value={entryMode}
          exclusive
          onChange={(_, value) => value && setEntryMode(value)}
          fullWidth
          size="small"
          sx={{
            mb: 2.5,
            p: 0.5,
            gap: 0.5,
            borderRadius: 3,
            bgcolor: "rgba(13,31,24,0.05)",
            "& .MuiToggleButton-root": {
              border: 0,
              borderRadius: "10px !important",
              py: 0.9,
              gap: 0.75,
              color: "text.secondary",
            },
            "& .Mui-selected": {
              bgcolor: "background.paper !important",
              color: "text.primary !important",
              boxShadow: "0 1px 3px rgba(13,31,24,0.12)",
            },
          }}
        >
          <ToggleButton value="manual">
            <EditNoteOutlined fontSize="small" /> Manual
          </ToggleButton>
          <ToggleButton value="import">
            <UploadFileOutlined fontSize="small" /> Importar extrato
          </ToggleButton>
        </ToggleButtonGroup>
      )}

      <Box>
        {entryMode === "manual" && (
          <ManualTransactionForm
            onClose={onClose}
            currentAccount={currentAccount}
            members={members}
            currentUserId={currentUserId}
            initialData={initialData}
            mode={mode}
            onDelete={onDelete}
          />
        )}

        {entryMode === "import" && (
          <ImportTransactionsFlow />
        )}
      </Box>
    </Sheet>
  );
}
