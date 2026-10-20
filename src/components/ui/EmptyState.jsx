import { Box, Button, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}) {
  return (
    <Box
      sx={{
        textAlign: "center",
        py: compact ? 4 : 8,
        px: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      {Icon && (
        <Box
          sx={(theme) => ({
            width: 56,
            height: 56,
            borderRadius: "18px",
            display: "grid",
            placeItems: "center",
            mb: 1,
            color: "primary.main",
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
          })}
        >
          <Icon />
        </Box>
      )}

      <Typography variant="subtitle1">{title}</Typography>

      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ maxWidth: 320 }}
        >
          {description}
        </Typography>
      )}

      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction} sx={{ mt: 2 }}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
}
