import { useState } from "react";
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
} from "firebase/firestore";

import { useAccount } from "../context/AccountContext"; // ✅ NEW

export default function ShareAccountDialog({ open, onClose, accountId }) {
  const { account } = useAccount(); // ✅ SOURCE OF TRUTH

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false); // ✅ NEW

  const currentUserId = auth.currentUser?.uid;

  // ✅ DERIVED (no state, no effect)
  const isOwner = account?.ownerId === currentUserId;

  const handleShare = async () => {
    setError("");
    setSuccess("");

    if (!email || !accountId) return;

    if (!isOwner) {
      setError("Only the owner can share this account.");
      return;
    }

    setLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();

      const q = query(
        collection(db, "users"),
        where("email", "==", trimmedEmail)
      );

      const snap = await getDocs(q);

      if (snap.empty) {
        setError("User not found");
        setLoading(false);
        return;
      }

      const userId = snap.docs[0].id;

      // ⚠️ Optional guard (nice UX improvement)
      if (userId === currentUserId) {
        setError("You already have access to this account.");
        setLoading(false);
        return;
      }

      // 🔥 Add member to account
      await updateDoc(doc(db, "accounts", accountId), {
        members: arrayUnion(userId),
      });

      setSuccess("User added!");
      setEmail("");
    } catch (err) {
      console.error(err);
      setError("Error sharing account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Share Account</DialogTitle>

      <DialogContent>
        {!account ? (
          <Typography color="text.secondary">
            Loading account...
          </Typography>
        ) : !isOwner ? (
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
            disabled={loading}
          />
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 1 }}>
            {success}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>

        {isOwner && (
          <Button
            variant="contained"
            onClick={handleShare}
            disabled={loading || !email}
          >
            {loading ? "Sharing..." : "Share"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}