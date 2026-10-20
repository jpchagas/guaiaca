import { Box, Container, Paper, Typography, Stack } from "@mui/material";
import { LockOutlined } from "@mui/icons-material";
import { brand } from "../theme";

export function BrandMark({ size = 56 }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: size * 0.28 + "px",
        bgcolor: "#fff",
        display: "grid",
        placeItems: "center",
        boxShadow: "0 10px 24px rgba(0,0,0,0.25)",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <Box
        component="img"
        src="/guaiaca_logo.png"
        alt="Guaiaca"
        sx={{ width: "118%", height: "118%", objectFit: "cover" }}
      />
    </Box>
  );
}

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <Box sx={{ minHeight: "100dvh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      {/* BRAND BAND */}
      <Box
        sx={{
          background: brand.heroGradient,
          color: "#fff",
          pt: "calc(48px + env(safe-area-inset-top))",
          pb: 12,
          px: 3,
        }}
      >
        <Container maxWidth="xs" disableGutters>
          <Stack direction="row" spacing={1.75} alignItems="center">
            <BrandMark />
            <Box>
              <Typography variant="h5" fontWeight={700} letterSpacing="-0.02em">
                Guaiaca
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.75 }}>
                Finanças pessoais e compartilhadas
              </Typography>
            </Box>
          </Stack>
        </Container>
      </Box>

      {/* CARD */}
      <Container maxWidth="xs" sx={{ mt: -8, px: 2, flex: 1 }}>
        <Paper
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: "24px",
            boxShadow: "0 18px 48px rgba(13, 31, 24, 0.12)",
          }}
        >
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  {subtitle}
                </Typography>
              )}
            </Box>

            {children}
          </Stack>
        </Paper>

        <Stack
          direction="row"
          spacing={0.75}
          alignItems="center"
          justifyContent="center"
          sx={{ mt: 3, mb: 4, color: "text.secondary" }}
        >
          <LockOutlined sx={{ fontSize: 14 }} />
          <Typography variant="caption">
            Conexão criptografada · Login via Firebase
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
