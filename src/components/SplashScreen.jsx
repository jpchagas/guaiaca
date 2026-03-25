import { Box } from "@mui/material";
import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [exit, setExit] = useState(false);

  useEffect(() => {
    setVisible(true);

    const exitTimer = setTimeout(() => {
      setExit(true);
    }, 1500);

    return () => clearTimeout(exitTimer);
  }, []);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",

        background: "linear-gradient(135deg, #4CAF50, #1C1C1E)",

        opacity: exit ? 0 : 1,
        transform: exit ? "scale(1.05)" : "scale(1)",
        transition: "all 500ms ease",
      }}
    >
      <Box
        component="img"
        src="/guaiaca_logo.png" // 👉 change to your logo
        alt="Guaiaca Logo"
        sx={{
          width: 180,
          maxWidth: "70vw",
          filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.3))",

          animation: "pulse 1.8s ease-in-out infinite",

          "@keyframes pulse": {
            "0%": { transform: "scale(1)" },
            "50%": { transform: "scale(1.05)" },
            "100%": { transform: "scale(1)" },
          },
        }}
      />
    </Box>
  );
}