import { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { CircularProgress, Box } from "@mui/material";
import ForgotPassword from "./pages/ForgotPassword";
import Invite from "./pages/Invite";

// Lazy loading das páginas
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const DashboardLayout = lazy(() => import("./pages/DashboardLayout"));
const Overview = lazy(() => import("./pages/Overview"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Settings = lazy(() => import("./pages/Settings"));

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress color="success" />
      </Box>
    );
  }

  return (
    <BrowserRouter>
      <Suspense
        fallback={
          <Box
            sx={{
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CircularProgress color="success" />
          </Box>
        }
      >
        <Routes>
          <Route path="/" element={user ? <Navigate to="/home" /> : <Login />} />
          <Route
            path="/signup"
            element={user ? <Navigate to="/home" /> : <Signup />}
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/invite" element={<Invite />} />
          <Route
            path="/home"
            element={user ? <DashboardLayout /> : <Navigate to="/" />}
          >
            <Route index element={<Overview />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="settings" element={<Settings />} />

          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
