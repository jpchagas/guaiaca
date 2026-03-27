import React, { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp, collection } from "firebase/firestore";

import ForgotPassword from "./pages/ForgotPassword";
import Invite from "./pages/Invite";
import SplashScreen from "./components/SplashScreen";
import { Box, CircularProgress } from "@mui/material";

// Lazy pages
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const DashboardLayout = lazy(() => import("./pages/DashboardLayout"));
const Overview = lazy(() => import("./pages/Overview"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Settings = lazy(() => import("./pages/Settings"));

/* -------------------- Loader -------------------- */
function PageLoader() {
  return (
    <Box
      sx={{
        height: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <CircularProgress size={28} />
    </Box>
  );
}

/* -------------------- Error Boundary -------------------- */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3 }}>
          Something went wrong. Please reload the app.
        </Box>
      );
    }

    return this.props.children;
  }
}

/* -------------------- App -------------------- */
function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const start = Date.now();
    const MIN_SPLASH = 1200;

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(MIN_SPLASH - elapsed, 0);

      setTimeout(async () => {
        if (u) {
          try {
            const userDoc = await getDoc(doc(db, "users", u.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();

              // 🔹 Legacy householdId migration
              if ((!userData.accounts || userData.accounts.length === 0) && userData.householdId) {
                const accountRef = doc(collection(db, "accounts"));
                await setDoc(accountRef, {
                  name: "Family Account",
                  type: "household",
                  members: [u.uid],
                  createdAt: serverTimestamp(),
                });

                await setDoc(doc(db, "users", u.uid), {
                  ...userData,
                  accounts: [accountRef.id],
                }, { merge: true });

                localStorage.setItem("currentAccountId", accountRef.id);
                localStorage.setItem("householdId", userData.householdId);
              } else if (userData.accounts && userData.accounts.length > 0) {
                localStorage.setItem("currentAccountId", userData.accounts[0]);
              }

              setUser(u);
            } else {
              console.warn("User doc not found");
              setUser(null);
            }
          } catch (err) {
            console.error("Error fetching user data:", err);
            setUser(u);
          }
        } else {
          setUser(null);
        }

        setAuthLoading(false);
        setShowSplash(false);
      }, remaining);
    });

    return () => unsubscribe();
  }, []);

  // Splash first
  if (showSplash) return <SplashScreen />;

  if (authLoading) return null;

  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/" element={!user ? <Login /> : <Navigate to="/home" />} />
            <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/home" />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/invite" element={<Invite />} />

            {/* Private */}
            <Route path="/home" element={user ? <DashboardLayout /> : <Navigate to="/" />}>
              <Route index element={<Overview />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;