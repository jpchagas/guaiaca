import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";

export default function JoinHousehold() {
  const [searchParams] = useSearchParams();
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [joined, setJoined] = useState(false);
  const navigate = useNavigate();

  const householdId = searchParams.get("householdId");

  useEffect(() => {
    const fetchHousehold = async () => {
      if (!householdId) {
        setMessage("❌ Invalid or missing household ID.");
        setLoading(false);
        return;
      }

      try {
        const householdRef = doc(db, "households", householdId);
        const snap = await getDoc(householdRef);
        if (snap.exists()) {
          setHousehold({ id: snap.id, ...snap.data() });
        } else {
          setMessage("❌ Household not found.");
        }
      } catch (err) {
        console.error("Error fetching household:", err);
        setMessage("❌ Failed to load household.");
      } finally {
        setLoading(false);
      }
    };

    fetchHousehold();
  }, [householdId]);

  const handleJoin = async () => {
    const user = auth.currentUser;
    if (!user) {
      setMessage("⚠️ You need to log in first.");
      navigate("/"); // redirect to login
      return;
    }

    try {
      // Add householdId to user
      await updateDoc(doc(db, "users", user.uid), { householdId });

      // Add user to household members
      await updateDoc(doc(db, "households", householdId), {
        members: arrayUnion(user.uid),
      });

      setJoined(true);
      setMessage("✅ You’ve successfully joined this household!");
      setTimeout(() => navigate("/home"), 1500);
    } catch (err) {
      console.error("Error joining household:", err);
      setMessage("❌ Failed to join household. Please try again.");
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
          Join Household
        </Typography>

        {message && (
          <Alert severity={message.startsWith("✅") ? "success" : "info"} sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        {household && !joined && (
          <>
            <Typography mb={3}>
              You’ve been invited to join <strong>{household.name}</strong>
            </Typography>
            <Button variant="contained" onClick={handleJoin}>
              Join Household
            </Button>
          </>
        )}
      </Paper>
    </Box>
  );
}