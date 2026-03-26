import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { Button, CircularProgress, Typography, Paper, Box } from "@mui/material";

export default function Invite() {
  const [searchParams] = useSearchParams();
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const navigate = useNavigate();

  const householdId = searchParams.get("householdId");

  useEffect(() => {
    const fetchHousehold = async () => {
      if (!householdId) {
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "households", householdId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setHousehold({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error("Error fetching household:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHousehold();
  }, [householdId]);

  const handleJoin = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("⚠ You need to log in first!");
      navigate("/");
      return;
    }

    try {
      // Add householdId to user
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { householdId });

      // Add user to household members
      const householdRef = doc(db, "households", householdId);
      await updateDoc(householdRef, {
        members: arrayUnion(user.uid),
      });

      setJoined(true);

      // Redirect after short delay
      setTimeout(() => navigate("/home"), 2000);
    } catch (err) {
      console.error("Failed to join household:", err);
      alert("❌ Failed to join household. Please try again.");
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
        {household ? (
          <>
            <Typography variant="h5" gutterBottom>
              Join Household: {household.name}
            </Typography>

            {joined ? (
              <Typography color="success.main" sx={{ mt: 2 }}>
                ✅ You’ve successfully joined this household!
              </Typography>
            ) : (
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                onClick={handleJoin}
              >
                Join Household
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