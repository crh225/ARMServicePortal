import {
  createUnifiedTheme,
  palettes,
  genPageTheme,
  shapes,
} from '@backstage/theme';

// Light theme colors (GitHub light inspired)
const lightColors = {
  // Primary accent
  accent: '#238636',
  accentHover: '#2ea043',
  accentEmphasis: '#0969da',

  // Backgrounds (light)
  bgCanvas: '#ffffff',
  bgDefault: '#ffffff',
  bgSubtle: '#f6f8fa',
  bgMuted: '#eaeef2',
  bgInset: '#f6f8fa',

  // Backgrounds (overlays)
  bgOverlay: '#ffffff',

  // Text
  textPrimary: '#1f2328',
  textSecondary: '#59636e',
  textMuted: '#8b949e',
  textLink: '#0969da',

  // Borders
  borderDefault: '#d1d9e0',
  borderMuted: '#e1e4e8',
  borderSubtle: 'rgba(31, 35, 40, 0.15)',

  // Status colors
  success: '#1a7f37',
  successEmphasis: '#2da44e',
  danger: '#cf222e',
  dangerEmphasis: '#d1242f',
  warning: '#9a6700',
  warningEmphasis: '#bf8700',
  info: '#0969da',
  infoEmphasis: '#218bff',

  // Special
  done: '#8250df',
  sponsors: '#bf3989',
};

export const armPortalTheme = createUnifiedTheme({
  palette: {
    ...palettes.light,
    mode: 'light',
    primary: {
      main: lightColors.accentEmphasis,
      light: lightColors.infoEmphasis,
      dark: '#0550ae',
    },
    secondary: {
      main: lightColors.accent,
      light: lightColors.accentHover,
      dark: '#196c2e',
    },
    background: {
      default: lightColors.bgCanvas,
      paper: lightColors.bgDefault,
    },
    text: {
      primary: lightColors.textPrimary,
      secondary: lightColors.textSecondary,
    },
    navigation: {
      background: lightColors.bgSubtle,
      indicator: lightColors.accentEmphasis,
      color: lightColors.textSecondary,
      selectedColor: lightColors.textPrimary,
      navItem: {
        hoverBackground: lightColors.bgMuted,
      },
    },
    status: {
      ok: lightColors.success,
      warning: lightColors.warningEmphasis,
      error: lightColors.danger,
      running: lightColors.info,
      pending: lightColors.done,
      aborted: lightColors.textMuted,
    },
    error: {
      main: lightColors.danger,
      light: lightColors.dangerEmphasis,
    },
    success: {
      main: lightColors.success,
      light: lightColors.successEmphasis,
    },
    info: {
      main: lightColors.info,
      light: lightColors.infoEmphasis,
    },
    warning: {
      main: lightColors.warning,
      light: lightColors.warningEmphasis,
    },
    divider: lightColors.borderDefault,
  },
  defaultPageTheme: 'home',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
  pageTheme: {
    home: genPageTheme({
      colors: [lightColors.bgSubtle, lightColors.bgMuted],
      shape: shapes.wave,
    }),
    documentation: genPageTheme({
      colors: [lightColors.bgSubtle, lightColors.bgMuted],
      shape: shapes.wave,
    }),
    tool: genPageTheme({
      colors: [lightColors.bgSubtle, lightColors.bgMuted],
      shape: shapes.round,
    }),
    service: genPageTheme({
      colors: [lightColors.bgSubtle, lightColors.bgMuted],
      shape: shapes.wave,
    }),
    website: genPageTheme({
      colors: [lightColors.bgSubtle, lightColors.bgMuted],
      shape: shapes.wave,
    }),
    library: genPageTheme({
      colors: [lightColors.bgSubtle, lightColors.bgMuted],
      shape: shapes.wave,
    }),
    other: genPageTheme({
      colors: [lightColors.bgSubtle, lightColors.bgMuted],
      shape: shapes.wave,
    }),
    app: genPageTheme({
      colors: [lightColors.bgSubtle, lightColors.bgMuted],
      shape: shapes.wave,
    }),
    apis: genPageTheme({
      colors: [lightColors.bgSubtle, lightColors.bgMuted],
      shape: shapes.wave,
    }),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
          backgroundColor: lightColors.bgCanvas,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '14px',
        },
        containedPrimary: {
          backgroundColor: lightColors.accent,
          boxShadow: 'none',
          border: '1px solid rgba(31, 35, 40, 0.15)',
          '&:hover': {
            backgroundColor: lightColors.accentHover,
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: lightColors.borderDefault,
          color: lightColors.textSecondary,
          '&:hover': {
            backgroundColor: lightColors.bgSubtle,
            borderColor: lightColors.textMuted,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          boxShadow: 'none',
          border: `1px solid ${lightColors.borderDefault}`,
          backgroundColor: lightColors.bgDefault,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: lightColors.bgDefault,
        },
        rounded: {
          borderRadius: '6px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '6px',
            backgroundColor: lightColors.bgCanvas,
            '& fieldset': {
              borderColor: lightColors.borderDefault,
            },
            '&:hover fieldset': {
              borderColor: lightColors.textMuted,
            },
            '&.Mui-focused fieldset': {
              borderColor: lightColors.accentEmphasis,
              boxShadow: `0 0 0 3px rgba(9, 105, 218, 0.3)`,
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          backgroundColor: lightColors.bgCanvas,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: lightColors.borderDefault,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: lightColors.textMuted,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: lightColors.accentEmphasis,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderRadius: '6px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '2em',
          fontSize: '12px',
          fontWeight: 500,
        },
        filled: {
          backgroundColor: lightColors.bgSubtle,
          border: `1px solid ${lightColors.borderDefault}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${lightColors.borderDefault}`,
        },
        head: {
          fontWeight: 600,
          color: lightColors.textPrimary,
          backgroundColor: lightColors.bgSubtle,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: lightColors.bgSubtle,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          color: lightColors.textSecondary,
          '&.Mui-selected': {
            color: lightColors.textPrimary,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#fd8c73',
          height: '2px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          border: `1px solid ${lightColors.borderDefault}`,
        },
        standardSuccess: {
          backgroundColor: 'rgba(26, 127, 55, 0.1)',
          borderColor: 'rgba(45, 164, 78, 0.4)',
        },
        standardError: {
          backgroundColor: 'rgba(207, 34, 46, 0.1)',
          borderColor: 'rgba(209, 36, 47, 0.4)',
        },
        standardWarning: {
          backgroundColor: 'rgba(154, 103, 0, 0.1)',
          borderColor: 'rgba(191, 135, 0, 0.4)',
        },
        standardInfo: {
          backgroundColor: 'rgba(9, 105, 218, 0.1)',
          borderColor: 'rgba(33, 139, 255, 0.4)',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: lightColors.textLink,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: lightColors.bgSubtle,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: lightColors.bgOverlay,
          border: `1px solid ${lightColors.borderDefault}`,
          boxShadow: '0 8px 24px rgba(140, 149, 159, 0.2)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '14px',
          '&:hover': {
            backgroundColor: lightColors.bgSubtle,
          },
          '&.Mui-selected': {
            backgroundColor: lightColors.bgMuted,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: lightColors.textPrimary,
          border: 'none',
          color: lightColors.bgCanvas,
          fontSize: '12px',
        },
      },
    },
    BackstageHeader: {
      styleOverrides: {
        header: {
          backgroundImage: 'none',
          backgroundColor: lightColors.bgSubtle,
          borderBottom: `1px solid ${lightColors.borderDefault}`,
          boxShadow: 'none',
        },
        title: {
          color: lightColors.textPrimary,
        },
        subtitle: {
          color: lightColors.textSecondary,
        },
      },
    },
    BackstageSidebar: {
      styleOverrides: {
        drawer: {
          backgroundColor: lightColors.bgSubtle,
          borderRight: `1px solid ${lightColors.borderDefault}`,
        },
      },
    },
    BackstageSidebarItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: lightColors.bgMuted,
          },
        },
        selected: {
          backgroundColor: lightColors.bgMuted,
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: '#fd8c73',
          },
          '&:hover': {
            backgroundColor: lightColors.borderDefault,
          },
        },
      },
    },
    BackstageItemCardHeader: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: lightColors.bgSubtle,
          color: lightColors.textPrimary,
          padding: '16px 20px 12px',
          borderBottom: `1px solid ${lightColors.borderDefault}`,
        },
      },
    },
    BackstageInfoCard: {
      styleOverrides: {
        header: {
          borderBottom: `1px solid ${lightColors.borderDefault}`,
        },
      },
    },
  },
});
