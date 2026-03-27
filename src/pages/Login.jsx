import { useState } from "react";
import {
  Button,
  TextField,
  Typography,
  Link,
  Divider,
  Stack,
  Alert,
} from "@mui/material";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";

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

        // ⚡ Legacy householdId (keep temporarily)
        if (userData.householdId) {
          localStorage.setItem("householdId", userData.householdId);
        }

        // 🆕 Set currentAccountId (first account by default)
        if (userData.accounts && userData.accounts.length > 0) {
          localStorage.setItem("currentAccountId", userData.accounts[0]);
        } else {
          console.warn("User has no accounts yet");
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
    <AuthLayout
      title="Welcome Back 👋"
      subtitle="Sign in to access your dashboard"
    >
      {error && <Alert severity="error">{error}</Alert>}

      <form onSubmit={handleLogin}>
        <Stack spacing={2}>
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

      <Stack spacing={1} mt={2}>
        <Stack alignItems="flex-end">
          <Link component={RouterLink} to="/forgot-password" underline="hover">
            Forgot password?
          </Link>
        </Stack>

        <Divider />

        <Typography variant="body2" textAlign="center">
          Don’t have an account?{" "}
          <Link component={RouterLink} to="/signup" underline="hover">
            Sign up
          </Link>
        </Typography>
      </Stack>
    </AuthLayout>
  );
}