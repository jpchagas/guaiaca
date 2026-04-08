import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemeProvider, CssBaseline } from '@mui/material'
import './styles.css'
import { DateProvider } from "./context/DateContext";
import { AccountProvider } from "./context/AccountContext" // ✅ NEW
import { theme } from "./theme"

import { registerSW } from 'virtual:pwa-register'
registerSW()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
        <DateProvider>
          <AccountProvider>
            <App />
          </AccountProvider>
        </DateProvider>
    </ThemeProvider>
  </React.StrictMode>
)