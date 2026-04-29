import { useMemo, type ReactNode } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import { CacheProvider } from '@emotion/react'
import createCache from '@emotion/cache'
import { prefixer } from 'stylis'
import rtlPlugin from 'stylis-plugin-rtl'
import CssBaseline from '@mui/material/CssBaseline'
import { useAppStore } from '@/store/appStore'
import { buildMuiTheme } from '@/theme/muiTheme'

// ============================================================
// RTL-aware Theme Provider
// Creates separate Emotion caches for LTR and RTL.
// Swaps automatically when language changes.
// ============================================================

const ltrCache = createCache({ key: 'ltr' })
const rtlCache = createCache({
  key:     'rtl',
  stylisPlugins: [prefixer, rtlPlugin],
})

interface BrandThemeProviderProps {
  children: ReactNode
}

const BrandThemeProvider = ({ children }: BrandThemeProviderProps) => {
  const direction = useAppStore((s) => s.direction)

  const theme = useMemo(
    () => buildMuiTheme(direction),
    [direction]
  )

  return (
    <CacheProvider value={direction === 'rtl' ? rtlCache : ltrCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  )
}

export default BrandThemeProvider
