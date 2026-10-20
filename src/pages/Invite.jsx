import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import { CheckCircle, GroupsOutlined, LinkOff } from "@mui/icons-material";
import AuthLayout from "../components/AuthLayout";

export default function Invite() {
  const [searchParams] = useSearchParams();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const accountId = searchParams.get("accountId");

  useEffect(() => {
    const fetchAccount = async () => {
      if (!accountId) {
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "accounts", accountId));
        if (snap.exists()) {
          setAccount({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error("Error fetching account:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [accountId]);

  const handleJoin = async () => {
    const user = auth.currentUser;
    if (!user) {
      navigate("/");
      return;
    }

    setJoining(true);
    setError("");

    try {
      await updateDoc(doc(db, "users", user.uid), {
        accounts: arrayUnion(accountId),
      });

      await updateDoc(doc(db, "accounts", accountId), {
        members: arrayUnion(user.uid),
      });

      setJoined(true);
      localStorage.setItem("currentAccountId", accountId);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      console.error("Failed to join account:", err);
      setError("Não foi possível entrar na conta. Tente novamente.");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100dvh" }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (!account) {
    return (
      <AuthLayout title="Convite inválido" subtitle="Este link de convite expirou ou não existe.">
        <Box textAlign="center" color="text.secondary">
          <LinkOff sx={{ fontSize: 40 }} />
        </Box>
        <Button variant="contained" size="large" onClick={() => navigate("/")}>
          Ir para o início
        </Button>
      </AuthLayout>
    );
  }

  const isLoggedIn = !!auth.currentUser;

  return (
    <AuthLayout title="Você foi convidado" subtitle="Junte-se a uma conta compartilhada no Guaiaca.">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <GroupsOutlined color="primary" />
        <Typography fontWeight={600}>{account.name}</Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {joined ? (
        <Box display="flex" alignItems="center" gap={1} color="primary.main">
          <CheckCircle />
          <Typography fontWeight={600}>Pronto! Redirecionando…</Typography>
        </Box>
      ) : isLoggedIn ? (
        <Button variant="contained" size="large" onClick={handleJoin} disabled={joining}>
          {joining ? "Entrando…" : "Entrar na conta"}
        </Button>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary">
            Entre com sua conta Guaiaca para aceitar o convite.
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate("/")}>
            Fazer login
          </Button>
        </>
      )}
    </AuthLayout>
  );
}
