import {
  Box,
  Button,
  Dialog,
  Typography,
} from "@mui/material";

export default function ConfirmActionDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmColor = "error",
  loading = false,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={700} mb={1}>
          {title}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>

        <Box display="flex" gap={1.5} mt={3}>
          <Button fullWidth variant="outlined" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>

          <Button
            fullWidth
            variant="contained"
            color={confirmColor}
            onClick={onConfirm}
            disabled={loading}
          >
            {confirmText}
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
}
