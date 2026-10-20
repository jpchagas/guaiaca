import { Typography } from "@mui/material";
import { formatCurrency } from "../../utils/format";

/**
 * Currency text with tabular numerals.
 * sign: "none" | "plus" | "minus" — prefixes an explicit +/− when set.
 */
export default function Money({
  value,
  sign = "none",
  sx,
  ...props
}) {
  const formatted = formatCurrency(Math.abs(Number(value) || 0));
  const prefix = sign === "plus" ? "+ " : sign === "minus" ? "− " : "";
  const negative = sign === "none" && Number(value) < 0 ? "− " : "";

  return (
    <Typography
      component="span"
      sx={{
        fontVariantNumeric: "tabular-nums",
        fontFeatureSettings: '"tnum"',
        whiteSpace: "nowrap",
        ...sx,
      }}
      {...props}
    >
      {prefix || negative}
      {formatted}
    </Typography>
  );
}
