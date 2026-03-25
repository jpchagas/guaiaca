import { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";

import ForgotPassword from "./pages/ForgotPassword";
import Invite from "./pages/Invite";
import SplashScreen from "./components/SplashScreen";

const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const DashboardLayout = lazy(() => import("./pages/DashboardLayout"));
const Overview = lazy(() => import("./pages/Overview"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Settings = lazy(() => import("./pages/Settings"));

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // ✅ Splash always first
  if (showSplash) {
    return <SplashScreen />;
  }

  // ✅ No spinner — just wait silently
  if (authLoading) {
    return null;
  }

  return (
    <BrowserRouter
  future={{
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  }}
>
  <Suspense fallback={null}>
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