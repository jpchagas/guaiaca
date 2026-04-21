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
        email,
        password
      );

      // 🔥 1. Create personal account
      const accountRef = doc(collection(db, "accounts"));

      await setDoc(accountRef, {
        name: `${name}'s Account`,
        type: "personal",
        members: [user.uid],
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, "users", user.uid), {
        name,
        email: email.trim().toLowerCase(),
        createdAt: serverTimestamp(),
      });

      navigate("/dashboard");
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Sign up to start managing your finances"
    >
      {error && <Alert severity="error">{error}</Alert>}

      <form onSubmit={handleSignup}>
        <Stack spacing={2}>
          <TextField
            label="Your Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

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
            {loading ? "Creating Account..." : "Sign Up"}
          </Button>
        </Stack>
      </form>

      <Divider />

      <Typography variant="body2" textAlign="center">
        Already have an account?{" "}
        <Link component={RouterLink} to="/" underline="hover">
          Log in
        </Link>
      </Typography>
    </AuthLayout>
  );
}