import { forwardRef } from "react";
import {
  Box,
  Dialog,
  IconButton,
  Slide,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";

const SlideUp = forwardRef(function SlideUp(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * Consistent modal surface: a bottom sheet on phones, a centered dialog
 * on larger screens. `actions` render in a sticky footer.
 */
export default function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  actions,
  maxWidth = "sm",
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={maxWidth}
      TransitionComponent={isMobile ? SlideUp : undefined}
      PaperProps={{
        sx: isMobile
          ? {
              m: 0,
              position: "fixed",
              bottom: 0,
              width: "100%",
              maxWidth: "100%",
              maxHeight: "92dvh",
              borderRadius: "24px 24px 0 0",
            }
          : { maxHeight: "88dvh" },
      }}
    >
      {isMobile && (
        <Box
          sx={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: "divider",
            mx: "auto",
            mt: 1.25,
          }}
        />
      )}

      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: 1,
          px: 3,
          pt: isMobile ? 1.5 : 3,
          pb: 1,
        }}
      >
        <Box flex={1} minWidth={0}>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" mt={0.25}>
              {subtitle}
            </Typography>
          )}
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          aria-label="Fechar"
          sx={{ mt: -0.25, mr: -1, color: "text.secondary" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, pt: 1.5, pb: actions ? 2 : 3, overflowY: "auto" }}>
        {children}
      </Box>

      {actions && (
        <Box
          sx={{
            px: 3,
            pt: 1.5,
            pb: "calc(20px + env(safe-area-inset-bottom))",
            borderTop: "1px solid",
            borderColor: "divider",
            display: "flex",
            gap: 1.5,
          }}
        >
          {actions}
        </Box>
      )}
    </Dialog>
  );
}
