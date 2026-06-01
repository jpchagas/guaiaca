import { useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  ToggleButton,
  ToggleButtonGroup,
  Box,
} from "@mui/material";

import ManualTransactionForm from "./ManualTransactionForm"
import ImportTransactionsFlow from "./ImportTransactionsFlow";

export default function TransactionEntryDialog({
  open,
  onClose,
  currentAccount,
  members = [],
  currentUserId,
  initialData = null,
  mode = "create",
}) {
  const isEdit = mode === "edit";

  // Edit mode should ALWAYS stay manual
  const [entryMode, setEntryMode] = useState(
    isEdit ? "manual" : "manual"
  );

  const handleModeChange = (_, value) => {
    if (!value) return;

    // Prevent switching modes while editing
    if (isEdit) return;

    setEntryMode(value);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {isEdit ? "Edit Transaction" : "Add Transactions"}
      </DialogTitle>

      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 3,
          pt: 2,
        }}
      >
        {!isEdit && (
          <ToggleButtonGroup
            value={entryMode}
            exclusive
            onChange={handleModeChange}
            fullWidth
            size="small"
          >
            <ToggleButton value="manual">
              Manual
            </ToggleButton>

            <ToggleButton value="import">
              Import File
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
            />
          )}

          {entryMode === "import" && (
            <ImportTransactionsFlow
              currentAccount={currentAccount}
              onClose={onClose}
            />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}