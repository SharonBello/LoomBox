import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import BrandThemeProvider from '@/theme/BrandThemeProvider'
import '@/i18n'
import '@/styles/globals.scss'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <BrandThemeProvider>
        <App />
      </BrandThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
