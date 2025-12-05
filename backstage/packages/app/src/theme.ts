import {
  createUnifiedTheme,
  palettes,
  genPageTheme,
  shapes,
} from '@backstage/theme';

// ARM Portal theme colors matching portal/frontend/src/styles/variables.css
const armPortalColors = {
  // Primary accent
  accent: '#2563eb',
  accentSoft: 'rgba(37, 99, 235, 0.12)',
  accentStrong: '#1d4ed8',

  // Backgrounds
  bg: '#f3f4f6',
  bgElevated: '#ffffff',
  bgPanel: '#ffffff',
  bgHover: 'rgba(148, 163, 184, 0.12)',

  // Text
  textMain: '#0f172a',
  textMuted: '#6b7280',
  textSoft: '#9ca3af',

  // Borders
  borderSubtle: 'rgba(148, 163, 184, 0.45)',
  borderStrong: 'rgba(148, 163, 184, 0.8)',

  // Status colors
  success: '#16a34a',
  danger: '#dc2626',
  info: '#0891b2',
};

export const armPortalTheme = createUnifiedTheme({
  palette: {
    ...palettes.light,
    primary: {
      main: armPortalColors.accent,
      light: armPortalColors.accentSoft,
      dark: armPortalColors.accentStrong,
    },
    secondary: {
      main: armPortalColors.accent,
      light: armPortalColors.accentSoft,
      dark: armPortalColors.accentStrong,
    },
    background: {
      default: armPortalColors.bg,
      paper: armPortalColors.bgElevated,
    },
    text: {
      primary: armPortalColors.textMain,
      secondary: armPortalColors.textMuted,
    },
    navigation: {
      background: '#1e293b',
      indicator: armPortalColors.accent,
      color: '#e2e8f0',
      selectedColor: '#ffffff',
      navItem: {
        hoverBackground: 'rgba(255, 255, 255, 0.08)',
      },
    },
    status: {
      ok: armPortalColors.success,
      warning: '#f59e0b',
      error: armPortalColors.danger,
      running: armPortalColors.info,
      pending: '#8b5cf6',
      aborted: '#6b7280',
    },
    error: {
      main: armPortalColors.danger,
    },
    success: {
      main: armPortalColors.success,
    },
    info: {
      main: armPortalColors.info,
    },
    warning: {
      main: '#f59e0b',
    },
  },
  defaultPageTheme: 'home',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
  pageTheme: {
    home: genPageTheme({
      colors: ['#2563eb', '#0ea5e9'],
      shape: shapes.wave,
    }),
    documentation: genPageTheme({
      colors: ['#2563eb', '#0ea5e9'],
      shape: shapes.wave,
    }),
    tool: genPageTheme({
      colors: ['#2563eb', '#0ea5e9'],
      shape: shapes.round,
    }),
    service: genPageTheme({
      colors: ['#2563eb', '#0ea5e9'],
      shape: shapes.wave,
    }),
    website: genPageTheme({
      colors: ['#2563eb', '#0ea5e9'],
      shape: shapes.wave,
    }),
    library: genPageTheme({
      colors: ['#2563eb', '#0ea5e9'],
      shape: shapes.wave,
    }),
    other: genPageTheme({
      colors: ['#2563eb', '#0ea5e9'],
      shape: shapes.wave,
    }),
    app: genPageTheme({
      colors: ['#2563eb', '#0ea5e9'],
      shape: shapes.wave,
    }),
    apis: genPageTheme({
      colors: ['#2563eb', '#0ea5e9'],
      shape: shapes.wave,
    }),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 500,
        },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        rounded: {
          borderRadius: '12px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderRadius: '8px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
        },
        head: {
          fontWeight: 600,
          color: armPortalColors.textMain,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
    BackstageHeader: {
      styleOverrides: {
        header: {
          backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
          boxShadow: 'none',
        },
      },
    },
    BackstageSidebar: {
      styleOverrides: {
        drawer: {
          backgroundColor: '#1e293b',
        },
      },
    },
    BackstageSidebarItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
          },
        },
        selected: {
          backgroundColor: 'rgba(37, 99, 235, 0.2)',
          '&:hover': {
            backgroundColor: 'rgba(37, 99, 235, 0.25)',
          },
        },
      },
    },
    // Scaffolder Template Card Overrides - ARM Portal Blueprint style
    BackstageItemCardHeader: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#ffffff',
          color: armPortalColors.textMain,
          padding: '16px 20px 12px',
        },
      },
    },
  },
});
