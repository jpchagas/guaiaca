import { Box, Button, Typography } from "@mui/material";

export default function SectionHeader({ title, actionLabel, onAction }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        mb: 1.5,
        minHeight: 36,
      }}
    >
      <Typography variant="subtitle1">{title}</Typography>

      {actionLabel && onAction && (
        <Button size="small" onClick={onAction} sx={{ px: 1.5, py: 0.5 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
