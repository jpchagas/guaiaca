import { useState } from "react";
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Link,
  Divider,
  Stack,
  Alert,
} from "@mui/material";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";

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
      const { user } = await signInWithEmailAndPassword(auth, email, password);

      const userDocSnap = await getDoc(doc(db, "users", user.uid));
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();

        if (userData.householdId) {
          localStorage.setItem("householdId", userData.householdId);
        }

        navigate("/home");
      } else {
        setError("User data not found.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Invalid credentials. Please try again.");
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
          Welcome Back 👋
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sign in to access your dashboard
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <form onSubmit={handleLogin}>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>
          </Stack>
        </form>

        <Box textAlign="right">
          <Link
            component={RouterLink}
            to="/forgot-password"
            underline="hover"
            sx={{ fontWeight: 500 }}
          >
            Forgot password?
          </Link>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2">
          Don’t have an account?{" "}
          <Link component={RouterLink} to="/signup" underline="hover">
            Sign up
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
}