import { useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  IconButton,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";

import { useEffect } from "react";
import AddGoalDialog from "../components/AddGoalDialog";
import { useAccount } from "../context/AccountContext";

export default function Goals() {
  const { currentAccount } = useAccount();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!currentAccount?.id) return;

    const q = query(
      collection(db, "goals"),
      where("accountId", "==", currentAccount.id)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setGoals(data);
      setLoading(false);
    });

    return () => unsub();
  }, [currentAccount?.id]);

  if (!currentAccount?.id) {
    return (
      <Box textAlign="center" mt={6}>
        <Typography color="text.secondary">
          Select an account to view goals
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  const progress = (g) =>
    g.targetAmount ? (g.currentAmount / g.targetAmount) * 100 : 0;

  return (
    <Box sx={{ p: 2 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Goals</Typography>

        <IconButton onClick={() => setOpen(true)}>
          <AddIcon />
        </IconButton>
      </Box>

      {/* Empty state */}
      {!goals.length && (
        <Typography color="text.secondary">
          No goals yet. Create your first one.
        </Typography>
      )}

      {/* List */}
      <Stack spacing={2}>
        {goals.map((g) => (
          <Card key={g.id} variant="outlined">
            <CardContent>
              <Typography fontWeight={600}>
                {g.title}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {g.type}
              </Typography>

              <Box mt={2}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(progress(g), 100)}
                />
              </Box>

              <Typography mt={1} variant="body2">
                R$ {g.currentAmount || 0} / R$ {g.targetAmount}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <AddGoalDialog open={open} onClose={() => setOpen(false)} />
    </Box>
  );
}