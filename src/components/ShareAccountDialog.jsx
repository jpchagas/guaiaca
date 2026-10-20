import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";

import { db, auth } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import Sheet from "./ui/Sheet";

export default function ShareAccountDialog({ open, onClose, account }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const currentUserId = auth.currentUser?.uid;
  const isOwner = account?.ownerId === currentUserId;
  const isSharedAccount = account?.type === "shared";
  const canShare = !!account?.id && isOwner && isSharedAccount;

  const handleClose = () => {
    if (loading) return;
    setEmail("");
    setError("");
    setSuccess("");
    onClose();
  };

  const handleShare = async () => {
    setError("");
    setSuccess("");

    if (!email || !canShare) return;

    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();

      const snap = await getDocs(
        query(collection(db, "users"), where("email", "==", trimmedEmail))
      );

      if (snap.empty) {
        setError("Não encontramos ninguém com esse e-mail no Guaiaca. Peça para a pessoa criar uma conta primeiro.");
        return;
      }

      const userId = snap.docs[0].id;

      if (userId === currentUserId) {
        setError("Você já tem acesso a esta conta.");
        return;
      }

      if (account.members?.includes(userId)) {
        setError("Essa pessoa já é membro desta conta.");
        return;
      }

      await updateDoc(doc(db, "accounts", account.id), {
        members: arrayUnion(userId),
      });

      setSuccess(`${trimmedEmail} agora tem acesso a esta conta.`);
      setEmail("");
    } catch (err) {
      console.error(err);
      setError("Não foi possível convidar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title="Convidar membro"
      subtitle={account?.name ? `Conta: ${account.name}` : undefined}
      actions={
        canShare ? (
          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleShare}
            disabled={loading || !email.trim()}
          >
            {loading ? "Convidando…" : "Dar acesso"}
          </Button>
        ) : null
      }
    >
      <Stack spacing={2}>
        {!account?.id ? (
          <Typography color="text.secondary">Carregando conta…</Typography>
        ) : !isSharedAccount ? (
          <Typography color="text.secondary">
            Contas pessoais não podem ser compartilhadas. Crie uma conta compartilhada para convidar pessoas.
          </Typography>
        ) : !isOwner ? (
          <Typography color="text.secondary">
            Apenas o titular pode convidar novos membros.
          </Typography>
        ) : (
          <>
            <TextField
              label="E-mail da pessoa"
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleShare()}
              disabled={loading}
            />

            <Box
              sx={{
                display: "flex",
                gap: 1.25,
                p: 1.5,
                borderRadius: 3,
                bgcolor: "rgba(13,31,24,0.04)",
              }}
            >
              <InfoOutlined sx={{ fontSize: 18, color: "text.secondary", mt: 0.25 }} />
              <Typography variant="caption" color="text.secondary">
                Membros podem ver e registrar transações, orçamentos e metas desta conta.
                Você pode remover o acesso a qualquer momento.
              </Typography>
            </Box>
          </>
        )}

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
      </Stack>
    </Sheet>
  );
}
