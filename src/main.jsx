import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { ThemeProvider, CssBaseline } from '@mui/material'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
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