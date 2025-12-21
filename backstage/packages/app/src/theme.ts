import {
  createUnifiedTheme,
  palettes,
  genPageTheme,
  shapes,
} from '@backstage/theme';

// GitHub-inspired theme colors
const githubColors = {
  // Primary accent (GitHub blue/green)
  accent: '#238636',
  accentHover: '#2ea043',
  accentEmphasis: '#1f6feb',

  // Backgrounds (GitHub dark)
  bgCanvas: '#0d1117',
  bgDefault: '#161b22',
  bgSubtle: '#21262d',
  bgMuted: '#30363d',
  bgInset: '#010409',

  // Backgrounds (overlays)
  bgOverlay: '#1c2128',

  // Text
  textPrimary: '#e6edf3',
  textSecondary: '#8d96a0',
  textMuted: '#6e7681',
  textLink: '#58a6ff',

  // Borders
  borderDefault: '#30363d',
  borderMuted: '#21262d',
  borderSubtle: 'rgba(240, 246, 252, 0.1)',

  // Status colors (GitHub style)
  success: '#238636',
  successEmphasis: '#2ea043',
  danger: '#da3633',
  dangerEmphasis: '#f85149',
  warning: '#9e6a03',
  warningEmphasis: '#d29922',
  info: '#1f6feb',
  infoEmphasis: '#58a6ff',

  // Special
  done: '#8957e5',
  sponsors: '#bf4b8a',
};

export const armPortalTheme = createUnifiedTheme({
  palette: {
    ...palettes.dark,
    mode: 'dark',
    primary: {
      main: githubColors.accentEmphasis,
      light: githubColors.infoEmphasis,
      dark: '#1158c7',
    },
    secondary: {
      main: githubColors.accent,
      light: githubColors.accentHover,
      dark: '#196c2e',
    },
    background: {
      default: githubColors.bgCanvas,
      paper: githubColors.bgDefault,
    },
    text: {
      primary: githubColors.textPrimary,
      secondary: githubColors.textSecondary,
    },
    navigation: {
      background: githubColors.bgDefault,
      indicator: githubColors.accentEmphasis,
      color: githubColors.textSecondary,
      selectedColor: githubColors.textPrimary,
      navItem: {
        hoverBackground: githubColors.bgSubtle,
      },
    },
    status: {
      ok: githubColors.success,
      warning: githubColors.warningEmphasis,
      error: githubColors.danger,
      running: githubColors.info,
      pending: githubColors.done,
      aborted: githubColors.textMuted,
    },
    error: {
      main: githubColors.danger,
      light: githubColors.dangerEmphasis,
    },
    success: {
      main: githubColors.success,
      light: githubColors.successEmphasis,
    },
    info: {
      main: githubColors.info,
      light: githubColors.infoEmphasis,
    },
    warning: {
      main: githubColors.warning,
      light: githubColors.warningEmphasis,
    },
    divider: githubColors.borderDefault,
  },
  defaultPageTheme: 'home',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
  pageTheme: {
    home: genPageTheme({
      colors: [githubColors.bgDefault, githubColors.bgSubtle],
      shape: shapes.wave,
    }),
    documentation: genPageTheme({
      colors: [githubColors.bgDefault, githubColors.bgSubtle],
      shape: shapes.wave,
    }),
    tool: genPageTheme({
      colors: [githubColors.bgDefault, githubColors.bgSubtle],
      shape: shapes.round,
    }),
    service: genPageTheme({
      colors: [githubColors.bgDefault, githubColors.bgSubtle],
      shape: shapes.wave,
    }),
    website: genPageTheme({
      colors: [githubColors.bgDefault, githubColors.bgSubtle],
      shape: shapes.wave,
    }),
    library: genPageTheme({
      colors: [githubColors.bgDefault, githubColors.bgSubtle],
      shape: shapes.wave,
    }),
    other: genPageTheme({
      colors: [githubColors.bgDefault, githubColors.bgSubtle],
      shape: shapes.wave,
    }),
    app: genPageTheme({
      colors: [githubColors.bgDefault, githubColors.bgSubtle],
      shape: shapes.wave,
    }),
    apis: genPageTheme({
      colors: [githubColors.bgDefault, githubColors.bgSubtle],
      shape: shapes.wave,
    }),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
          backgroundColor: githubColors.bgCanvas,
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
          backgroundColor: githubColors.accent,
          boxShadow: 'none',
          border: '1px solid rgba(240, 246, 252, 0.1)',
          '&:hover': {
            backgroundColor: githubColors.accentHover,
            boxShadow: 'none',
          },
        },
        outlined: {
          borderColor: githubColors.borderDefault,
          color: githubColors.textSecondary,
          '&:hover': {
            backgroundColor: githubColors.bgSubtle,
            borderColor: githubColors.textMuted,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          boxShadow: 'none',
          border: `1px solid ${githubColors.borderDefault}`,
          backgroundColor: githubColors.bgDefault,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: githubColors.bgDefault,
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
            backgroundColor: githubColors.bgCanvas,
            '& fieldset': {
              borderColor: githubColors.borderDefault,
            },
            '&:hover fieldset': {
              borderColor: githubColors.textMuted,
            },
            '&.Mui-focused fieldset': {
              borderColor: githubColors.accentEmphasis,
              boxShadow: `0 0 0 3px rgba(31, 111, 235, 0.3)`,
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          backgroundColor: githubColors.bgCanvas,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: githubColors.borderDefault,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: githubColors.textMuted,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: githubColors.accentEmphasis,
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
          backgroundColor: githubColors.bgSubtle,
          border: `1px solid ${githubColors.borderDefault}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${githubColors.borderDefault}`,
        },
        head: {
          fontWeight: 600,
          color: githubColors.textPrimary,
          backgroundColor: githubColors.bgSubtle,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: githubColors.bgSubtle,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          color: githubColors.textSecondary,
          '&.Mui-selected': {
            color: githubColors.textPrimary,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#f78166',
          height: '2px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          border: `1px solid ${githubColors.borderDefault}`,
        },
        standardSuccess: {
          backgroundColor: 'rgba(35, 134, 54, 0.15)',
          borderColor: 'rgba(46, 160, 67, 0.4)',
        },
        standardError: {
          backgroundColor: 'rgba(218, 54, 51, 0.15)',
          borderColor: 'rgba(248, 81, 73, 0.4)',
        },
        standardWarning: {
          backgroundColor: 'rgba(158, 106, 3, 0.15)',
          borderColor: 'rgba(210, 153, 34, 0.4)',
        },
        standardInfo: {
          backgroundColor: 'rgba(31, 111, 235, 0.15)',
          borderColor: 'rgba(88, 166, 255, 0.4)',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: githubColors.textLink,
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
            backgroundColor: githubColors.bgSubtle,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: githubColors.bgOverlay,
          border: `1px solid ${githubColors.borderDefault}`,
          boxShadow: '0 8px 24px rgba(1, 4, 9, 0.75)',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '14px',
          '&:hover': {
            backgroundColor: githubColors.bgSubtle,
          },
          '&.Mui-selected': {
            backgroundColor: githubColors.bgMuted,
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: githubColors.bgOverlay,
          border: `1px solid ${githubColors.borderDefault}`,
          color: githubColors.textPrimary,
          fontSize: '12px',
        },
      },
    },
    BackstageHeader: {
      styleOverrides: {
        header: {
          backgroundImage: 'none',
          backgroundColor: githubColors.bgDefault,
          borderBottom: `1px solid ${githubColors.borderDefault}`,
          boxShadow: 'none',
        },
        title: {
          color: githubColors.textPrimary,
        },
        subtitle: {
          color: githubColors.textSecondary,
        },
      },
    },
    BackstageSidebar: {
      styleOverrides: {
        drawer: {
          backgroundColor: githubColors.bgDefault,
          borderRight: `1px solid ${githubColors.borderDefault}`,
        },
      },
    },
    BackstageSidebarItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: githubColors.bgSubtle,
          },
        },
        selected: {
          backgroundColor: githubColors.bgSubtle,
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: '#f78166',
          },
          '&:hover': {
            backgroundColor: githubColors.bgMuted,
          },
        },
      },
    },
    BackstageItemCardHeader: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: githubColors.bgDefault,
          color: githubColors.textPrimary,
          padding: '16px 20px 12px',
          borderBottom: `1px solid ${githubColors.borderDefault}`,
        },
      },
    },
    BackstageInfoCard: {
      styleOverrides: {
        header: {
          borderBottom: `1px solid ${githubColors.borderDefault}`,
        },
      },
    },
  },
});
