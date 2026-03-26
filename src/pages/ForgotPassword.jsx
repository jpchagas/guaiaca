import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebaseConfig";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Link,
  Stack,
  Alert,
  Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("✅ Password reset email sent! Check your inbox.");
    } catch (err) {
      console.error(err);
      setError("❌ Failed to send reset email. Please check your email address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 3,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h5" fontWeight={600}>
          Forgot Password
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter your email to receive a password reset link
        </Typography>

        {message && <Alert severity="success">{message}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        <form onSubmit={handleResetPassword}>
          <Stack spacing={2} mt={1}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Email"}
            </Button>
          </Stack>
        </form>

        <Divider sx={{ my: 2 }} />

        <Link
          component={RouterLink}
          to="/"
          underline="hover"
          sx={{ display: "block", mt: 1 }}
        >
          Back to Login
        </Link>
      </Paper>
    </Container>
  );
}