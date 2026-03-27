import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Box, Button, Typography, Paper, Alert, CircularProgress } from "@mui/material";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

export default function JoinAccount() {
  const [searchParams] = useSearchParams();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [joined, setJoined] = useState(false);
  const navigate = useNavigate();

  const accountId = searchParams.get("accountId"); // changed

  useEffect(() => {
    const fetchAccount = async () => {
      if (!accountId) {
        setMessage("❌ Invalid or missing account ID.");
        setLoading(false);
        return;
      }

      try {
        const accountRef = doc(db, "accounts", accountId); // changed
        const snap = await getDoc(accountRef);
        if (snap.exists()) {
          setAccount({ id: snap.id, ...snap.data() });
        } else {
          setMessage("❌ Account not found.");
        }
      } catch (err) {
        console.error("Error fetching account:", err);
        setMessage("❌ Failed to load account.");
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [accountId]);

  const handleJoin = async () => {
    const user = auth.currentUser;
    if (!user) {
      setMessage("⚠️ You need to log in first.");
      navigate("/");
      return;
    }

    try {
      // Add account to user's array
      await updateDoc(doc(db, "users", user.uid), {
        accounts: arrayUnion(accountId),
      });

      // Add user to account members
      await updateDoc(doc(db, "accounts", accountId), {
        members: arrayUnion(user.uid),
      });

      setJoined(true);
      setMessage("✅ You’ve successfully joined this account!");
      localStorage.setItem("currentAccountId", accountId);

      setTimeout(() => navigate("/home"), 1500);
    } catch (err) {
      console.error("Error joining account:", err);
      setMessage("❌ Failed to join account. Please try again.");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 500, mx: "auto", mt: 8 }}>
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h5" mb={2}>
          Join Account
        </Typography>

        {message && (
          <Alert severity={message.startsWith("✅") ? "success" : "info"} sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        {account && !joined && (
          <>
            <Typography mb={3}>
              You’ve been invited to join <strong>{account.name}</strong>
            </Typography>
            <Button variant="contained" onClick={handleJoin}>
              Join Account
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}