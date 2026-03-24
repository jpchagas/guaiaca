import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import './styles.css'
import { FilterProvider } from "./context/FilterContext" // ✅ ADD THIS

import { registerSW } from 'virtual:pwa-register'
const updateSW = registerSW({})

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#4CAF50' },
    secondary: { main: '#5E239D' },
    background: { default: '#1C1C1E', paper: '#2C2C2E' },
    warning: { main: '#FFB300' },
  },
  shape: { borderRadius: 12 },
  typography: { fontFamily: 'Roboto, Inter, Arial, sans-serif' }
})

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <FilterProvider> {/* ✅ THIS FIXES EVERYTHING */}
        <App />
      </FilterProvider>
    </ThemeProvider>
  </React.StrictMode>
)