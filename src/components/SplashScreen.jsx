import { Box, CircularProgress, Typography } from "@mui/material";
import { brand } from "../theme";
import { BrandMark } from "./AuthLayout";

// Stays visible until App unmounts it (auth resolved), so slow connections
// never fall through to a blank screen.
export default function SplashScreen() {
  return (
    <Box
      sx={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 2.5,
        color: "#fff",
        background: brand.heroGradient,
      }}
    >
      <Box
        sx={{
          animation: "rise 700ms cubic-bezier(.2,.8,.2,1) both",
          "@keyframes rise": {
            from: { opacity: 0, transform: "translateY(12px) scale(0.96)" },
            to: { opacity: 1, transform: "none" },
          },
        }}
      >
        <BrandMark size={88} />
      </Box>

      <Box
        textAlign="center"
        sx={{
          animation: "fade 700ms 200ms ease both",
          "@keyframes fade": { from: { opacity: 0 }, to: { opacity: 1 } },
        }}
      >
        <Typography variant="h5" fontWeight={700} letterSpacing="-0.02em">
          Guaiaca
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          Finanças pessoais e compartilhadas
        </Typography>
      </Box>

      <CircularProgress
        size={20}
        thickness={5}
        sx={{
          color: "rgba(255,255,255,0.6)",
          mt: 2,
          animation: "fade 400ms 1200ms ease both",
        }}
      />
    </Box>
  );
}
