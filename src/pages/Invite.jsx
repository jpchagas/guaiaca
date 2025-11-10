import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
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
      if (!householdId) return;
      const ref = doc(db, "households", householdId);
      const snap = await getDoc(ref);
      if (snap.exists()) setHousehold({ id: snap.id, ...snap.data() });
      setLoading(false);
    };
    fetchHousehold();
  }, [householdId]);

  const handleJoin = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("You need to log in first!");
      navigate("/");
      return;
    }

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { householdId });
    await updateDoc(doc(db, "households", householdId), {
      members: arrayUnion(user.uid),
    });

    setJoined(true);
    setTimeout(() => navigate("/home"), 2000);
  };

  if (loading) return <CircularProgress sx={{ m: 3 }} />;

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
      <Paper sx={{ p: 4, textAlign: "center" }}>
        {household ? (
          <>
            <Typography variant="h5" gutterBottom>
              Join Household: {household.name}
            </Typography>
            {joined ? (
              <Typography color="success.main">
                ✅ You’ve successfully joined this household!
              </Typography>
            ) : (
              <Button variant="contained" onClick={handleJoin}>
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
