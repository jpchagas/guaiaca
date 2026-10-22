import { useEffect, useState } from "react";
import {
  Box,
  ButtonBase,
  Typography,
  CircularProgress,
  LinearProgress,
  Paper,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { FlagOutlined, PersonOutline } from "@mui/icons-material";
import { useOutletContext } from "react-router-dom";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";

import { auth } from "../firebaseConfig";
import { useAccount } from "../context/AccountContext";
import Money from "../components/ui/Money";
import EmptyState from "../components/ui/EmptyState";
import GoalDetailSheet from "../components/GoalDetailSheet";
import AddGoalDialog from "../components/AddGoalDialog";
import { formatCurrency } from "../utils/format";
import { GOAL_TYPES, getGoalBalance } from "../utils/goalTypes";

export default function Goals() {
  const { currentAccount, members } = useAccount();
  const { openCreate } = useOutletContext();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // By id, so the open sheet follows live updates (e.g. a new deposit)
  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const selected = goals.find((g) => g.id === selectedId) || null;

  useEffect(() => {
    if (!currentAccount?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, "goals"),
      where("accountId", "==", currentAccount.id)
    );

    const unsub = onSnapshot(q, (snap) => {
      setGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [currentAccount?.id]);

  if (!currentAccount?.id) {
    return (
      <EmptyState
        icon={PersonOutline}
        title="Nenhuma conta selecionada"
        description="Selecione uma conta para ver suas metas."
      />
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!goals.length) {
    return (
      <Paper variant="outlined">
        <EmptyState
          icon={FlagOutlined}
          title="Comece a planejar"
          description="Crie metas para uma reserva de emergência, uma compra importante ou para quitar uma dívida."
          actionLabel="Criar meta"
          onAction={() => openCreate("goal")}
        />
      </Paper>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      {goals.map((g) => {
        const type = GOAL_TYPES[g.type] || GOAL_TYPES.savings;
        const current = getGoalBalance(g);
        const target = Number(g.targetAmount) || 0;
        const progress = target ? Math.min((current / target) * 100, 100) : 0;
        const done = target > 0 && current >= target;

        return (
          <Paper
            key={g.id}
            variant="outlined"
            component={ButtonBase}
            onClick={() => {
              setSelectedId(g.id);
              setDetailOpen(true);
            }}
            sx={{ p: 2.5, display: "block", width: "100%", textAlign: "left" }}
          >
            <Box display="flex" alignItems="center" gap={1.5} mb={2}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: "14px",
                  display: "grid",
                  placeItems: "center",
                  color: type.color,
                  backgroundColor: alpha(type.color, 0.12),
                  flexShrink: 0,
                }}
              >
                <type.Icon />
              </Box>

              <Box flex={1} minWidth={0}>
                <Typography fontWeight={600} noWrap>
                  {g.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {type.label}
                </Typography>
              </Box>

              <Typography
                variant="subtitle1"
                fontWeight={700}
                color={done ? "primary" : "text.primary"}
                sx={{ fontVariantNumeric: "tabular-nums" }}
              >
                {Math.round(progress)}%
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 10, "& .MuiLinearProgress-bar": { backgroundColor: type.color } }}
            />

            <Box display="flex" justifyContent="space-between" alignItems="baseline" mt={1.25}>
              <Money value={current} variant="body2" fontWeight={700} />
              <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
                {done ? "Meta atingida" : `Meta: ${formatCurrency(target)}`}
              </Typography>
            </Box>
          </Paper>
        );
      })}

      <GoalDetailSheet
        open={detailOpen && !!selected}
        onClose={() => setDetailOpen(false)}
        goal={selected}
        members={members}
        currentUserId={auth.currentUser?.uid}
        onEdit={() => {
          setDetailOpen(false);
          setEditOpen(true);
        }}
      />

      <AddGoalDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        goal={selected}
      />
    </Box>
  );
}
