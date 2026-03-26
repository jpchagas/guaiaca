import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
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
import { auth, db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  serverTimestamp,
  arrayUnion,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch user and household on load
  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUser({ id: currentUser.uid, ...userData });

          if (userData.householdId) {
            const householdRef = doc(db, "households", userData.householdId);
            const householdSnap = await getDoc(householdRef);
            if (householdSnap.exists()) {
              const householdData = { id: householdSnap.id, ...householdSnap.data() };
              setHousehold(householdData);
              await fetchMembers(householdData.members);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching user/household:", err);
        setErrorMessage("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Fetch members info (name + email)
  const fetchMembers = async (memberIds) => {
    if (!memberIds?.length) return setMembers([]);
    const usersRef = collection(db, "users");

    // Firestore "in" query limit is 10
    const q = query(usersRef, where("__name__", "in", memberIds.slice(0, 10)));
    const querySnapshot = await getDocs(q);

    const fetchedMembers = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setMembers(fetchedMembers);
  };

  const handleCreateHousehold = async () => {
    if (!user) return;

    const householdName = `${user.name}'s Household`;

    try {
      const newHouseholdRef = doc(collection(db, "households"));
      await setDoc(newHouseholdRef, {
        name: householdName,
        members: [user.id],
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "users", user.id), {
        householdId: newHouseholdRef.id,
      });

      setHousehold({
        id: newHouseholdRef.id,
        name: householdName,
        members: [user.id],
      });
      setMembers([{ id: user.id, name: user.name, email: user.email }]);
      setSuccessMessage("✅ Household created!");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error(err);
      setErrorMessage("❌ Failed to create household.");
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  const handleAddMember = async () => {
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", inviteEmail.trim()));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setErrorMessage("No user found with this email.");
        setTimeout(() => setErrorMessage(""), 5000);
        return;
      }

      const invitedUserDoc = querySnapshot.docs[0];
      const invitedUserId = invitedUserDoc.id;

      // Update household
      const householdRef = doc(db, "households", household.id);
      await updateDoc(householdRef, {
        members: arrayUnion(invitedUserId),
      });

      // Update invited user
      await updateDoc(doc(db, "users", invitedUserId), {
        householdId: household.id,
      });

      setSuccessMessage("✅ User successfully added!");
      setInviteEmail("");

      // Refresh members
      const updatedSnap = await getDoc(householdRef);
      const updatedHousehold = { id: household.id, ...updatedSnap.data() };
      setHousehold(updatedHousehold);
      await fetchMembers(updatedHousehold.members);

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (error) {
      console.error(error);
      setErrorMessage("❌ Error adding member. Please try again.");
      setTimeout(() => setErrorMessage(""), 5000);
    }
  };

  const handleGenerateInviteLink = async () => {
    if (!household) return;

    const inviteLink = `${window.location.origin}/invite?householdId=${household.id}`;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setSuccessMessage("✅ Invite link copied to clipboard!");
    } catch {
      setErrorMessage("🔗 Invite link: " + inviteLink);
    } finally {
      setTimeout(() => {
        setSuccessMessage("");
        setErrorMessage("");
      }, 5000);
    }
  };

  // ---------- LOADING ----------
  if (loading)
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="60vh"
      >
        <CircularProgress />
        <Typography mt={2}>Loading settings...</Typography>
      </Box>
    );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      {!household ? (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="body1" mb={2}>
            You don’t have a household yet.
          </Typography>
          <Button variant="contained" onClick={handleCreateHousehold}>
            Create Household
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
        </Paper>
      ) : (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6">{household.name}</Typography>
          <Typography variant="body2" mb={2}>
            Household ID: <strong>{household.id}</strong>
          </Typography>

          <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
            <Button variant="outlined" onClick={() => setAddMemberOpen(true)}>
              Add Members
            </Button>
            <Button variant="outlined" onClick={handleGenerateInviteLink}>
              Invite via Email
            </Button>
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            Members:
          </Typography>
          {members.length > 0 ? (
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
          ) : (
            <Typography variant="body2" color="text.secondary">
              No members yet.
            </Typography>
          )}

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
        </Paper>
      )}

      {/* Add Member Dialog */}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMemberOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddMember}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}