import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";

import { db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  arrayUnion,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { useOutletContext } from "react-router-dom"; // ✅ NEW

export default function Settings() {
  const { currentAccountId } = useOutletContext(); // ✅ GLOBAL ACCOUNT

  const [account, setAccount] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 🔥 FETCH ACCOUNT + MEMBERS
  useEffect(() => {
    const fetchAccountAndMembers = async () => {
      if (!currentAccountId) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // 1. Get account doc
        const accountRef = doc(db, "accounts", currentAccountId);
        const accountSnap = await getDoc(accountRef);

        if (!accountSnap.exists()) {
          setLoading(false);
          return;
        }

        const accountData = {
          id: currentAccountId,
          ...accountSnap.data(),
        };

        setAccount(accountData);

        // 2. Get members
        if (!accountData.members?.length) {
          setMembers([]);
          setLoading(false);
          return;
        }

        const usersRef = collection(db, "users");

        const q = query(
          usersRef,
          where("__name__", "in", accountData.members.slice(0, 10)) // Firestore limit
        );

        const snapshot = await getDocs(q);

        const fetchedMembers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMembers(fetchedMembers);
      } catch (err) {
        console.error("Error fetching members:", err);
        setErrorMessage("Failed to fetch members.");
      } finally {
        setLoading(false);
      }
    };

    fetchAccountAndMembers();
  }, [currentAccountId]);

  // ➕ ADD MEMBER
  const handleAddMember = async () => {
    if (!account) return;

    setSuccessMessage("");
    setErrorMessage("");

    try {
      const usersRef = collection(db, "users");

      const q = query(
        usersRef,
        where("email", "==", inviteEmail.trim())
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setErrorMessage("No user found with this email.");
        return;
      }

      const invitedUserDoc = snapshot.docs[0];
      const invitedUserId = invitedUserDoc.id;

      // 1. Add to account
      const accountRef = doc(db, "accounts", account.id);

      await updateDoc(accountRef, {
        members: arrayUnion(invitedUserId),
      });

      // 2. Add account to user
      await updateDoc(doc(db, "users", invitedUserId), {
        accounts: arrayUnion(account.id),
      });

      setSuccessMessage("✅ User successfully added!");
      setInviteEmail("");

      // 🔄 Refresh members (simple way: refetch)
      const updatedSnap = await getDoc(accountRef);
      const updatedAccount = {
        id: account.id,
        ...updatedSnap.data(),
      };

      setAccount(updatedAccount);

      // trigger refetch logic
      const usersQuery = query(
        collection(db, "users"),
        where("__name__", "in", updatedAccount.members.slice(0, 10))
      );

      const usersSnap = await getDocs(usersQuery);

      setMembers(
        usersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    } catch (err) {
      console.error(err);
      setErrorMessage("❌ Error adding member.");
    }
  };

  // ⏳ LOADING
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
        <Typography ml={2}>Loading members...</Typography>
      </Box>
    );
  }

  // 🚫 NO ACCOUNT SELECTED
  if (!currentAccountId) {
    return (
      <Box textAlign="center" mt={8}>
        <Typography color="text.secondary">
          Select an account to manage members
        </Typography>
      </Box>
    );
  }

  // ✅ UI
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Account Members
      </Typography>

      {!members.length ? (
        <Typography>No members yet.</Typography>
      ) : (
        <List dense>
          {members.map((m, i) => (
            <Box key={m.id}>
              <ListItem>
                <ListItemText
                  primary={m.name || "Unnamed User"}
                  secondary={m.email || m.id}
                />
              </ListItem>
              {i < members.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      )}

      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={() => setAddMemberOpen(true)}
      >
        Add Member
      </Button>

      {successMessage && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {successMessage}
        </Alert>
      )}

      {errorMessage && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Dialog */}
      <Dialog open={addMemberOpen} onClose={() => setAddMemberOpen(false)}>
        <DialogTitle>Add Member</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            label="User Email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            margin="normal"
          />

          {successMessage && <Alert severity="success">{successMessage}</Alert>}
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setAddMemberOpen(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleAddMember}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}