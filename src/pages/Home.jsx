import { useEffect, useState } from "react";
import { Typography, Container, Button, Box } from "@mui/material";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";

export default function Home() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");

  // 🔥 Fetch current user info (ONLY name now)
  useEffect(() => {
    const fetchUserData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserName(userData.name || "");
        }
      } catch (err) {
        console.error("Failed to fetch user data:", err);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        textAlign: "center",
        mt: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <Typography variant="h4" color="primary" gutterBottom>
        Welcome {userName} to Guaiaca 💰
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Button
          variant="contained"
          onClick={() => navigate("/home")}
        >
          Go to Overview
        </Button>

        <Button
          variant="outlined"
          onClick={() => navigate("/home/transactions")}
        >
          View Transactions
        </Button>

        <Button
          variant="outlined"
          color="warning"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>
    </Container>
  );
}