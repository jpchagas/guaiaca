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
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

export default function JoinHousehold() {
  const [searchParams] = useSearchParams();
  const [householdName, setHouseholdName] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
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
          setHouseholdName(snap.data().name || "Unnamed Household");
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
      return;
    }

    try {
      // Update user document
      await updateDoc(doc(db, "users", user.uid), {
        householdId,
      });

      // Add user to the household members list
      await updateDoc(doc(db, "households", householdId), {
        members: arrayUnion(user.uid),
      });

      setMessage("✅ Joined household successfully!");
      setTimeout(() => navigate("/home"), 1500);
    } catch (err) {
      console.error("Error joining household:", err);
      setMessage("❌ Failed to join household.");
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

        {message && <Alert severity="info" sx={{ mb: 2 }}>{message}</Alert>}

        {householdName && (
          <>
            <Typography mb={3}>
              You’ve been invited to join <strong>{householdName}</strong>
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
