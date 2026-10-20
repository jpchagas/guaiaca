import { useState } from "react";
import {
  Button,
  TextField,
  Typography,
  Link,
  Stack,
  Alert,
} from "@mui/material";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import PasswordField from "../components/ui/PasswordField";
import { getAuthErrorMessage } from "../utils/authErrors";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password);

      const userDocSnap = await getDoc(doc(db, "users", user.uid));
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();

        // ⚡ Legacy householdId (keep temporarily)
        if (userData.householdId) {
          localStorage.setItem("householdId", userData.householdId);
        }

        if (userData.accounts && userData.accounts.length > 0) {
          localStorage.setItem("currentAccountId", userData.accounts[0]);
        } else {
          console.warn("User has no accounts yet");
        }

        navigate("/dashboard");
      } else {
        setError("Não encontramos os dados do seu perfil. Fale com o suporte.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(getAuthErrorMessage(err, "Não foi possível entrar. Tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Bem-vindo de volta"
      subtitle="Entre para acompanhar suas finanças."
    >
      {error && <Alert severity="error">{error}</Alert>}

      <form onSubmit={handleLogin}>
        <Stack spacing={2}>
          <TextField
            label="E-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <PasswordField
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Stack alignItems="flex-end" sx={{ mt: -0.5 }}>
            <Link component={RouterLink} to="/forgot-password" underline="hover" variant="body2" fontWeight={600}>
              Esqueci minha senha
            </Link>
          </Stack>

          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </Stack>
      </form>

      <Typography variant="body2" textAlign="center" color="text.secondary">
        Ainda não tem conta?{" "}
        <Link component={RouterLink} to="/signup" underline="hover" fontWeight={600}>
          Criar conta
        </Link>
      </Typography>
    </AuthLayout>
  );
}
