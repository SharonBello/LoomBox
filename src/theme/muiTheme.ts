import { createTheme, type Theme } from '@mui/material/styles'

// ============================================================
// LoomBox MUI Theme
// Applies brand tokens to MUI components.
// Direction is passed in at runtime based on language.
// ============================================================

export const buildMuiTheme = (direction: 'ltr' | 'rtl'): Theme =>
  createTheme({
    direction,

    palette: {
      mode: 'light',
      primary: {
        main:        '#c9954a',
        light:       '#e8c98a',
        dark:        '#9e7030',
        contrastText: '#ffffff',
      },
      secondary: {
        main:        '#1a1929',
        light:       '#3d3b52',
        dark:        '#0e0d18',
        contrastText: '#ffffff',
      },
      background: {
        default: '#faf8f4',
        paper:   '#ffffff',
      },
      text: {
        primary:   '#1a1929',
        secondary: '#9896a0',
        disabled:  '#c4c2cc',
      },
      divider: '#e8e4dc',
      error:   { main: '#e05c5c' },
      warning: { main: '#e8a04a' },
      success: { main: '#4caf82' },
    },

    typography: {
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      h1: {
        fontFamily:    "'Cormorant Garamond', Georgia, serif",
        fontSize:      '4rem',
        fontWeight:    500,
        lineHeight:    1.2,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontFamily:    "'Cormorant Garamond', Georgia, serif",
        fontSize:      '3rem',
        fontWeight:    500,
        lineHeight:    1.2,
        letterSpacing: '-0.02em',
      },
      h3: {
        fontFamily:    "'Cormorant Garamond', Georgia, serif",
        fontSize:      '2.375rem',
        fontWeight:    500,
        lineHeight:    1.25,
        letterSpacing: '-0.02em',
      },
      h4: {
        fontFamily:    "'Cormorant Garamond', Georgia, serif",
        fontSize:      '1.875rem',
        fontWeight:    500,
        lineHeight:    1.3,
        letterSpacing: '-0.01em',
      },
      h5: {
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        fontSize:   '1.5rem',
        fontWeight: 500,
        lineHeight: 1.35,
      },
      h6: {
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        fontSize:   '1.0625rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      body1: {
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        fontSize:   '0.9375rem',
        lineHeight: 1.6,
      },
      body2: {
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        fontSize:   '0.8125rem',
        lineHeight: 1.6,
      },
      caption: {
        fontFamily:    "'Plus Jakarta Sans', system-ui, sans-serif",
        fontSize:      '0.6875rem',
        lineHeight:    1.5,
        letterSpacing: '0.02em',
      },
      button: {
        fontFamily:    "'Plus Jakarta Sans', system-ui, sans-serif",
        fontSize:      '0.875rem',
        fontWeight:    600,
        letterSpacing: '0.01em',
        textTransform: 'none',
      },
    },

    shape: {
      borderRadius: 12,
    },

    spacing: 4,

    shadows: [
      'none',
      '0 1px 2px rgba(26,25,41,0.05)',
      '0 2px 8px rgba(26,25,41,0.07), 0 1px 2px rgba(26,25,41,0.04)',
      '0 4px 16px rgba(26,25,41,0.08), 0 2px 6px rgba(26,25,41,0.04)',
      '0 4px 20px rgba(26,25,41,0.09), 0 2px 6px rgba(26,25,41,0.04)',
      '0 8px 28px rgba(26,25,41,0.10), 0 3px 8px rgba(26,25,41,0.05)',
      '0 12px 40px rgba(26,25,41,0.11), 0 4px 12px rgba(26,25,41,0.05)',
      '0 12px 48px rgba(26,25,41,0.12), 0 4px 14px rgba(26,25,41,0.06)',
      '0 16px 56px rgba(26,25,41,0.12), 0 5px 16px rgba(26,25,41,0.06)',
      '0 20px 64px rgba(26,25,41,0.13), 0 6px 18px rgba(26,25,41,0.06)',
      '0 24px 72px rgba(26,25,41,0.14), 0 7px 20px rgba(26,25,41,0.07)',
      '0 24px 80px rgba(26,25,41,0.15), 0 8px 22px rgba(26,25,41,0.07)',
      '0 28px 88px rgba(26,25,41,0.15), 0 8px 24px rgba(26,25,41,0.07)',
      '0 28px 96px rgba(26,25,41,0.16), 0 9px 26px rgba(26,25,41,0.08)',
      '0 32px 100px rgba(26,25,41,0.16), 0 10px 28px rgba(26,25,41,0.08)',
      '0 32px 108px rgba(26,25,41,0.17), 0 10px 30px rgba(26,25,41,0.08)',
      '0 36px 112px rgba(26,25,41,0.17), 0 11px 32px rgba(26,25,41,0.09)',
      '0 36px 120px rgba(26,25,41,0.18), 0 12px 34px rgba(26,25,41,0.09)',
      '0 40px 124px rgba(26,25,41,0.18), 0 12px 36px rgba(26,25,41,0.09)',
      '0 40px 130px rgba(26,25,41,0.19), 0 13px 38px rgba(26,25,41,0.10)',
      '0 44px 134px rgba(26,25,41,0.19), 0 14px 40px rgba(26,25,41,0.10)',
      '0 44px 140px rgba(26,25,41,0.20), 0 14px 42px rgba(26,25,41,0.10)',
      '0 48px 144px rgba(26,25,41,0.20), 0 15px 44px rgba(26,25,41,0.10)',
      '0 48px 150px rgba(26,25,41,0.21), 0 16px 46px rgba(26,25,41,0.11)',
      '0 52px 156px rgba(26,25,41,0.22), 0 16px 48px rgba(26,25,41,0.11)',
    ],

    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius:  '10px',
            padding:       '10px 24px',
            fontWeight:    600,
            fontSize:      '0.875rem',
            letterSpacing: '0.01em',
            textTransform: 'none',
            transition:    'all 220ms cubic-bezier(0.4, 0, 0.2, 1)',
          },
          contained: {
            boxShadow: '0 2px 8px rgba(201,149,74,0.25)',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(201,149,74,0.35)',
              transform: 'translateY(-1px)',
            },
          },
          outlined: {
            borderColor: '#e8e4dc',
            '&:hover': {
              borderColor: '#c9954a',
              background:  'rgba(201,149,74,0.04)',
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined', size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '10px',
              background:   '#ffffff',
              '& fieldset': { borderColor: '#e8e4dc' },
              '&:hover fieldset':  { borderColor: '#c9954a' },
              '&.Mui-focused fieldset': {
                borderColor: '#c9954a',
                borderWidth: '1.5px',
              },
            },
          },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: '16px',
            border:       '1px solid #e8e4dc',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: '8px', fontWeight: 500 },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            borderRadius: '8px',
            fontSize:     '0.75rem',
            background:   '#1a1929',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: '20px',
            padding:      '8px',
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root:  { borderRadius: '999px', height: 6 },
          bar:   { borderRadius: '999px' },
        },
      },
    },
  })
