import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
} from "@mui/material";
import { useState } from "react";
import { auth, db } from "../firebaseConfig";
import {
  collection,
  doc,
  serverTimestamp,
  setDoc,
  arrayUnion,
  updateDoc,
} from "firebase/firestore";

const COLORS = [
  "#4CAF50",
  "#2196F3",
  "#9C27B0",
  "#FF9800",
  "#F44336",
  "#009688",
];

export default function CreateAccountDialog({
  open,
  onClose,
  onSuccess,
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Account name is required");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("User not authenticated");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const randomColor =
        COLORS[Math.floor(Math.random() * COLORS.length)];

      const newAccountRef = doc(collection(db, "accounts"));

      await setDoc(newAccountRef, {
        name: name.trim(),
        type: "shared",
        members: [currentUser.uid],
        ownerId: currentUser.uid,   // ✅ 🔥 THIS IS THE FIX
        createdAt: serverTimestamp(),
      });

      onSuccess?.(newAccountRef.id);

      setName("");
      setError(null);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setName("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth>
      <DialogTitle>Create Account</DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Account Name"
          fullWidth
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>

        <Button
          variant="contained"
          onClick={handleCreate}
          disabled={loading || !name.trim()} // 🔥 small UX win
        >
          {loading ? "Creating..." : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}