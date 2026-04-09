import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Typography,
} from "@mui/material";

import { db, auth } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  getDoc,
} from "firebase/firestore";

export default function ShareAccountDialog({ open, onClose, accountId }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isOwner, setIsOwner] = useState(false);

  // ✅ Check if current user is owner
  useEffect(() => {
    if (!accountId) return;

    const checkOwner = async () => {
      try {
        const accountSnap = await getDoc(doc(db, "accounts", accountId));
        if (!accountSnap.exists()) {
          setError("Account not found");
          return;
        }

        const accountData = accountSnap.data();
        const currentUserId = auth.currentUser?.uid;

        setIsOwner(accountData.ownerId === currentUserId);
      } catch (err) {
        console.error(err);
        setError("Error fetching account info");
      }
    };

    checkOwner();
  }, [accountId]);

  const handleShare = async () => {
    setError("");
    setSuccess("");

    if (!email || !accountId) return;

    if (!isOwner) {
      setError("Only the owner can share this account.");
      return;
    }

    try {
      const q = query(
        collection(db, "users"),
        where("email", "==", email.trim())
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        setError("User not found");
        return;
      }

      const userId = snap.docs[0].id;

      // 🔥 Add member to account
      await updateDoc(doc(db, "accounts", accountId), {
        members: arrayUnion(userId),
      });

      // 🔥 Add account to user's list
      await updateDoc(doc(db, "users", userId), {
        accounts: arrayUnion(accountId),
      });

      setSuccess("User added!");
      setEmail("");
    } catch (err) {
      console.error(err);
      setError("Error sharing account");
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Share Account</DialogTitle>

      <DialogContent>
        {!isOwner ? (
          <Typography color="text.secondary">
            Only the owner can share this account.
          </Typography>
        ) : (
          <TextField
            fullWidth
            label="User Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
          />
        )}

        {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 1 }}>{success}</Alert>}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {isOwner && (
          <Button variant="contained" onClick={handleShare}>
            Share
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}