import { Typography, Container, Button } from "@mui/material";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

function Home() {

    const navigate = useNavigate();
    
    const handleLogout = async () => {
        await signOut(auth);
        navigate("/");
    };

    return (
        <Container sx={{ textAlign: "center", mt: 10 }}>
            <Typography variant="h4" color="primary"> Welcome to Guaiaca 💰</Typography>
            <Button variant="outlined" color="warning" sx={{ mt: 4 }} onClick={handleLogout}> Logout </Button>
        </Container>
    );
}

export default Home;
