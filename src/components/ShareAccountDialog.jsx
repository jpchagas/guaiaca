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

export default function ShareAccountDialog({ open, onClose, account }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const currentUserId = auth.currentUser?.uid;

  // ✅ DEBUG
  console.log("ShareDialog account:", account);

  // ✅ DERIVED
  const isOwner = account?.ownerId === currentUserId;
  const isSharedAccount = account?.type === "shared";

  const handleShare = async () => {
    setError("");
    setSuccess("");

    // ✅ BASIC GUARD
    if (!email || !account?.id) return;

    // 🔒 TYPE PROTECTION
    if (!isSharedAccount) {
      setError("This account cannot be shared.");
      return;
    }

    // 🔒 OWNER PROTECTION
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

      // Optional UX guard
      if (userId === currentUserId) {
        setError("You already have access to this account.");
        setLoading(false);
        return;
      }

      // Optional: prevent duplicate add (extra safety)
      if (account.members?.includes(userId)) {
        setError("User already has access.");
        setLoading(false);
        return;
      }

      // ✅ FIRESTORE UPDATE
      await updateDoc(doc(db, "accounts", account.id), {
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
        {!account?.id ? (
          <Typography color="text.secondary">
            Loading account...
          </Typography>
        ) : !isSharedAccount ? (
          <Typography color="text.secondary">
            This is a personal account and cannot be shared.
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

        {isOwner && isSharedAccount && (
          <Button
            variant="contained"
            onClick={handleShare}
            disabled={loading || !email || !account?.id}
          >
            {loading ? "Sharing..." : "Share"}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}