import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemeProvider, CssBaseline } from '@mui/material'
import './styles.css'
import { FilterProvider } from "./context/FilterContext"
import { theme } from "./theme" // ✅ IMPORT

import { registerSW } from 'virtual:pwa-register'
registerSW()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <FilterProvider>
        <App />
      </FilterProvider>
    </ThemeProvider>
  </React.StrictMode>
)