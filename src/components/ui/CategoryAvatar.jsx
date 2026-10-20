import { Box } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { getCategoryVisual } from "../../utils/categoryVisuals";

export default function CategoryAvatar({ category, size = 40 }) {
  const { Icon, color } = getCategoryVisual(category);

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: size * 0.32 + "px",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        color,
        backgroundColor: alpha(color, 0.12),
      }}
    >
      <Icon sx={{ fontSize: size * 0.5 }} />
    </Box>
  );
}
