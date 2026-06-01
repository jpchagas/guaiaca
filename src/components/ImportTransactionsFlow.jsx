import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  LinearProgress,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import {parseFile} from "../services/importing/parseFile"

export default function ImportTransactionsFlow({
  currentAccount,
  onClose,
}) {
  const [bank, setBank] = useState("btg");

  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  const [parsedTransactions, setParsedTransactions] =
    useState([]);

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const transactions = await parseFile(
        file,
        bank
      );

      setParsedTransactions(transactions);

      console.log(
        "Parsed Transactions:",
        transactions
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message || "Failed to process file"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {loading && <LinearProgress />}

      {error && (
        <Alert severity="error">
          {error}
        </Alert>
      )}

      <TextField
        select
        label="Bank"
        value={bank}
        onChange={(e) =>
          setBank(e.target.value)
        }
      >
        <MenuItem value="btg">BTG</MenuItem>

        <MenuItem value="nubank">
          Nubank
        </MenuItem>

        <MenuItem value="c6">C6</MenuItem>

        <MenuItem value="bradesco">
          Bradesco
        </MenuItem>
      </TextField>

      <Button
        variant="outlined"
        component="label"
      >
        Select File

        <input
          hidden
          type="file"
          accept=".pdf,.xlsx,.csv"
          onChange={(e) =>
            setFile(e.target.files?.[0] || null)
          }
        />
      </Button>

      {file && (
        <Typography variant="body2">
          {file.name}
        </Typography>
      )}

      <Button
        variant="contained"
        disabled={!file || loading}
        onClick={handleImport}
      >
        {loading
          ? "Processing..."
          : "Process File"}
      </Button>

      {parsedTransactions.length > 0 && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            maxHeight: 300,
            overflow: "auto",
          }}
        >
          <Typography
            variant="subtitle2"
            gutterBottom
          >
            Parsed Transactions
          </Typography>

          <pre
            style={{
              margin: 0,
              fontSize: 12,
            }}
          >
            {JSON.stringify(
              parsedTransactions,
              null,
              2
            )}
          </pre>
        </Box>
      )}
    </Box>
  );
}