import { useState } from "react";
import {
  Button,
  TextField,
  Typography,
  Link,
  Stack,
  Alert,
} from "@mui/material";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import PasswordField from "../components/ui/PasswordField";
import { getAuthErrorMessage } from "../utils/authErrors";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      // 🔥 1. Create personal account
      const accountRef = doc(collection(db, "accounts"));

      await setDoc(accountRef, {
        name: "Pessoal",
        type: "personal",
        members: [user.uid],
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        createdAt: serverTimestamp(),
      });

      navigate("/dashboard");
    } catch (err) {
      console.error("Signup error:", err);
      setError(getAuthErrorMessage(err, "Não foi possível criar sua conta. Tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Criar conta"
      subtitle="Leva menos de um minuto. Você começa com uma conta pessoal."
    >
      {error && <Alert severity="error">{error}</Alert>}

      <form onSubmit={handleSignup}>
        <Stack spacing={2}>
          <TextField
            label="Seu nome"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <TextField
            label="E-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <PasswordField
            autoComplete="new-password"
            helperText="Mínimo de 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
            {loading ? "Criando conta…" : "Criar conta"}
          </Button>
        </Stack>
      </form>

      <Typography variant="body2" textAlign="center" color="text.secondary">
        Já tem uma conta?{" "}
        <Link component={RouterLink} to="/" underline="hover" fontWeight={600}>
          Entrar
        </Link>
      </Typography>
    </AuthLayout>
  );
}
