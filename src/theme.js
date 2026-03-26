// theme.ts
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2E7D32",
      dark: "#1B5E20",
      light: "#66BB6A",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#FAFAFA",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1C1C1E",
      secondary: "#6B7280",
    },
    warning: {
      main: "#FFB300",
    },
  },

  shape: {
    borderRadius: 14, // softer, more "object-like"
  },

  typography: {
    fontFamily: `"Inter", "Roboto", sans-serif`,
    h1: { fontWeight: 600 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },

  spacing: 8,

  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: "background.paper",
          boxShadow: "0px 4px 12px rgba(0,0,0,0.06)",
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: "10px 16px",
        },
        containedPrimary: {
          backgroundColor: "#2E7D32",
          "&:hover": {
            backgroundColor: "#1B5E20",
          },
        },
        outlinedPrimary: {
          borderColor: "#2E7D32",
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#FAFAFA",
          color: "#1C1C1E",
          boxShadow: "none",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        },
      },
    },

    MuiFab: {
      styleOverrides: {
        root: {
          backgroundColor: "#2E7D32",
          color: "#fff",
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#FAFAFA",
          margin: 0,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundImage: "none", // removes weird MUI gradients
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
          borderRadius: 10,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(0,0,0,0.06)",
        },
      },
    },
  },
});