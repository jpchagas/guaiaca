import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TablePagination,
  CircularProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const householdId = localStorage.getItem("householdId");
        if (!householdId) {
          console.warn("No householdId found in localStorage.");
          setTransactions([]);
          return;
        }

        const q = query(collection(db, "transactions"), where("householdId", "==", householdId));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getColorByClassification = (classification) => {
    switch (classification) {
      case "revenue":
        return "success.main";
      case "expense":
        return "error.main";
      case "investment":
        return "warning.main";
      default:
        return "text.primary";
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (transactions.length === 0) {
    return (
      <Box textAlign="center" mt={8}>
        <Typography variant="h6" color="text.secondary">
          No transactions found.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 0, sm: 2 }, py: 1 }}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Transactions
      </Typography>

      <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: { xs: "60vh", md: "70vh" } }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Classification</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Responsible</TableCell>
                <TableCell>Method</TableCell>
                <TableCell align="right">Amount ($)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell>{tx.date}</TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell>
                      <Chip
                        label={tx.classification}
                        size="small"
                        color={
                          tx.classification === "revenue"
                            ? "success"
                            : tx.classification === "expense"
                            ? "error"
                            : tx.classification === "investment"
                            ? "warning"
                            : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>{tx.category || "—"}</TableCell>
                    <TableCell>{tx.responsible || "—"}</TableCell>
                    <TableCell>
                      <Tooltip title={tx.card || ""}>
                        <Chip label={tx.method} size="small" variant="outlined" />
                      </Tooltip>
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: getColorByClassification(tx.classification) }}
                    >
                      {tx.amount < 0
                        ? `- $${Math.abs(tx.amount).toFixed(2)}`
                        : `$${tx.amount.toFixed(2)}`}
                      {tx.parcels > 1 && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Parcel {tx.parcel}/{tx.parcels}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={transactions.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Paper>
    </Box>
  );
}
