import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import Sheet from "./ui/Sheet";

export default function CreateAccountDialog({
  open,
  onClose,
  onSuccess,
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Dê um nome para a conta.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("Sua sessão expirou. Entre novamente.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const newAccountRef = doc(collection(db, "accounts"));

      await setDoc(newAccountRef, {
        name: name.trim(),
        type: "shared",
        members: [currentUser.uid],
        ownerId: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      onSuccess?.(newAccountRef.id);

      setName("");
      setError(null);
      setLoading(false);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Não foi possível criar a conta. Tente novamente.");
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setName("");
    setError(null);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={handleClose}
      title="Nova conta compartilhada"
      subtitle="Organize as finanças da casa, de um casal ou de um projeto com outras pessoas."
      actions={
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleCreate}
          disabled={loading || !name.trim()}
        >
          {loading ? "Criando…" : "Criar conta"}
        </Button>
      }
    >
      <Stack spacing={2}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Nome da conta"
          placeholder="Ex.: Casa, Viagem 2027"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        />

        <Typography variant="caption" color="text.secondary">
          Você será o titular e poderá convidar membros depois.
        </Typography>
      </Stack>
    </Sheet>
  );
}
