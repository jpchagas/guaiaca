import { createTheme, alpha } from "@mui/material/styles";

/* -------------------- Brand tokens -------------------- */

export const brand = {
  ink: "#0D1F18", // near-black green, used for hero surfaces
  emerald: "#0B6E4F",
  emeraldDark: "#08503A",
  emeraldLight: "#3BA77C",
  gold: "#B7862F",
  canvas: "#F5F4EF", // warm off-white app background
  surface: "#FFFFFF",
  line: "rgba(13, 31, 24, 0.08)",
  heroGradient:
    "radial-gradient(120% 140% at 100% 0%, rgba(59,167,124,0.35) 0%, rgba(59,167,124,0) 55%), linear-gradient(135deg, #0D1F18 0%, #0B3D2E 55%, #0B6E4F 100%)",
};

// Colors that carry financial meaning across the app
export const finance = {
  revenue: "#1F8A5B",
  expense: "#C2413A",
  investment: "#B7862F",
};

const textPrimary = "#13201B";
const textSecondary = "#5E6B65";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: brand.emerald,
      dark: brand.emeraldDark,
      light: brand.emeraldLight,
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: brand.ink,
      contrastText: "#FFFFFF",
    },
    success: { main: finance.revenue },
    error: { main: finance.expense },
    warning: { main: brand.gold },
    background: {
      default: brand.canvas,
      paper: brand.surface,
    },
    text: {
      primary: textPrimary,
      secondary: textSecondary,
    },
    divider: brand.line,
  },

  shape: {
    borderRadius: 12,
  },

  typography: {
    fontFamily: `"Inter", "Roboto", "Helvetica", sans-serif`,
    h4: { fontWeight: 700, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.015em" },
    h6: { fontWeight: 600, letterSpacing: "-0.01em" },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    body2: { lineHeight: 1.5 },
    overline: {
      fontWeight: 600,
      letterSpacing: "0.08em",
      lineHeight: 1.6,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: 0,
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: brand.canvas,
          margin: 0,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        rounded: {
          borderRadius: 16,
        },
        outlined: {
          borderColor: brand.line,
        },
      },
    },

    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: {
        root: {
          borderRadius: 16,
          borderColor: brand.line,
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "10px 18px",
        },
        sizeLarge: {
          padding: "14px 22px",
          fontSize: "1rem",
        },
        outlined: {
          borderColor: brand.line,
          "&:hover": { borderColor: alpha(brand.emerald, 0.4) },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },

    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: "0 10px 24px rgba(11, 110, 79, 0.35)",
        },
      },
    },

    MuiAppBar: {
      defaultProps: { elevation: 0, color: "inherit" },
      styleOverrides: {
        root: {
          backgroundColor: alpha(brand.canvas, 0.86),
          backdropFilter: "saturate(180%) blur(14px)",
          color: textPrimary,
          borderBottom: `1px solid ${brand.line}`,
        },
      },
    },

    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 64,
          backgroundColor: "transparent",
        },
      },
    },

    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: textSecondary,
          minWidth: 0,
          "&.Mui-selected": { color: brand.emerald },
        },
        label: {
          fontSize: "0.72rem",
          fontWeight: 600,
          "&.Mui-selected": { fontSize: "0.72rem" },
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 20,
        },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: { fontWeight: 700, fontSize: "1.15rem" },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paperAnchorBottom: {
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        fullWidth: true,
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: brand.surface,
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(13, 31, 24, 0.14)",
          },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
        },
      },
    },

    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderColor: brand.line,
        },
      },
    },

    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: 999,
          backgroundColor: "rgba(13, 31, 24, 0.07)",
        },
        bar: {
          borderRadius: 999,
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },

    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: brand.ink,
        },
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: { borderColor: brand.line },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
          boxShadow: "0 12px 32px rgba(13, 31, 24, 0.14)",
        },
      },
    },
  },
});
