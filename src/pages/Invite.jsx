import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { Button, CircularProgress, Typography, Paper, Box } from "@mui/material";

export default function Invite() {
  const [searchParams] = useSearchParams();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const navigate = useNavigate();

  const accountId = searchParams.get("accountId"); // changed

  useEffect(() => {
    const fetchAccount = async () => {
      if (!accountId) {
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "accounts", accountId); // changed
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setAccount({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error("Error fetching account:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [accountId]);

  const handleJoin = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("⚠ You need to log in first!");
      navigate("/");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);

      // Add account to user's array of accounts
      await updateDoc(userRef, {
        accounts: arrayUnion(accountId),
      });

      // Add user to account members
      const accountRef = doc(db, "accounts", accountId);
      await updateDoc(accountRef, {
        members: arrayUnion(user.uid),
      });

      setJoined(true);

      // Save current account locally
      localStorage.setItem("currentAccountId", accountId);

      // Redirect after short delay
      setTimeout(() => navigate("/home"), 2000);
    } catch (err) {
      console.error("Failed to join account:", err);
      alert("❌ Failed to join account. Please try again.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
      <Paper sx={{ p: 4, textAlign: "center", minWidth: 300 }}>
        {account ? (
          <>
            <Typography variant="h5" gutterBottom>
              Join Account: {account.name}
            </Typography>

            {joined ? (
              <Typography color="success.main" sx={{ mt: 2 }}>
                ✅ You’ve successfully joined this account!
              </Typography>
            ) : (
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                onClick={handleJoin}
              >
                Join Account
              </Button>
            )}
          </>
        ) : (
          <Typography color="error">❌ Invalid or expired invite link.</Typography>
        )}
      </Paper>
    </Box>
  );
}