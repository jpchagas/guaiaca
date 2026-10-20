import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { Button, TextField, Typography, Link, Stack, Alert } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { getAuthErrorMessage } from "../utils/authErrors";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setMessage("Se houver uma conta com esse e-mail, você receberá um link para criar uma nova senha.");
    } catch (err) {
      setError(getAuthErrorMessage(err, "Não foi possível enviar o e-mail. Confira o endereço e tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Recuperar senha"
      subtitle="Informe seu e-mail e enviaremos um link para redefinir sua senha."
    >
      {message && <Alert severity="success">{message}</Alert>}
      {error && <Alert severity="error">{error}</Alert>}

      <form onSubmit={handleResetPassword}>
        <Stack spacing={2}>
          <TextField
            label="E-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" variant="contained" size="large" fullWidth disabled={loading}>
            {loading ? "Enviando…" : "Enviar link"}
          </Button>
        </Stack>
      </form>

      <Typography variant="body2" textAlign="center">
        <Link component={RouterLink} to="/" underline="hover" fontWeight={600}>
          Voltar para o login
        </Link>
      </Typography>
    </AuthLayout>
  );
}
