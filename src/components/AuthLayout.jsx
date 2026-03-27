import { Container, Paper, Typography, Stack } from "@mui/material";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <Container
      maxWidth="xs"
      sx={{
        mt: 8,
        px: 2, // better mobile padding
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 3,
        }}
      >
        <Stack spacing={2}>
          <Stack spacing={0.5} textAlign="center">
            <Typography variant="h5" fontWeight={600}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Stack>

          {children}
        </Stack>
      </Paper>
    </Container>
  );
}