import {
  createUnifiedTheme,
  palettes,
  genPageTheme,
  shapes,
} from '@backstage/theme';

// ARM Portal inspired theme - clean, modern, light
const portalColors = {
  // Primary accent (blue)
  accent: '#2563eb',
  accentSoft: 'rgba(37, 99, 235, 0.12)',
  accentStrong: '#1d4ed8',
  accentGradFrom: '#2563eb',
  accentGradTo: '#0ea5e9',

  // Backgrounds
  bgCanvas: '#f3f4f6',
  bgElevated: '#ffffff',
  bgPanel: '#ffffff',
  bgChip: 'rgba(148, 163, 184, 0.12)',
  bgHover: 'rgba(148, 163, 184, 0.12)',
  bgHoverSubtle: 'rgba(148, 163, 184, 0.06)',
  bgMuted: '#f9fafb',

  // Text
  textMain: '#0f172a',
  textMuted: '#6b7280',
  textSoft: '#9ca3af',
  textLink: '#2563eb',

  // Borders
  borderSubtle: 'rgba(148, 163, 184, 0.45)',
  borderStrong: 'rgba(148, 163, 184, 0.8)',
  borderDefault: 'rgba(148, 163, 184, 0.45)',

  // Status colors
  success: '#16a34a',
  successBg: '#dcfce7',
  successBorder: '#22c55e',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  dangerBorder: '#f87171',
  warning: '#d97706',
  warningBg: '#fef3c7',
  warningBorder: '#fbbf24',
  info: '#0891b2',
  infoBg: '#e0f2fe',
  infoBorder: '#38bdf8',

  // Shadows
  shadowSoft: '0 18px 40px rgba(148, 163, 184, 0.35)',
  shadowCard: '0 12px 28px rgba(148, 163, 184, 0.25)',
  shadowHover: '0 4px 12px rgba(0, 0, 0, 0.08)',

  // Border radius
  radiusXl: '28px',
  radiusLg: '18px',
  radiusMd: '12px',
  radiusSm: '8px',
};

export const armPortalTheme = createUnifiedTheme({
  palette: {
    ...palettes.light,
    mode: 'light',
    primary: {
      main: portalColors.accent,
      light: portalColors.accentGradTo,
      dark: portalColors.accentStrong,
    },
    secondary: {
      main: portalColors.success,
      light: '#22c55e',
      dark: '#15803d',
    },
    background: {
      default: portalColors.bgCanvas,
      paper: portalColors.bgElevated,
    },
    text: {
      primary: portalColors.textMain,
      secondary: portalColors.textMuted,
    },
    navigation: {
      background: portalColors.bgElevated,
      indicator: portalColors.accent,
      color: portalColors.textMuted,
      selectedColor: portalColors.textMain,
      navItem: {
        hoverBackground: portalColors.bgHover,
      },
    },
    status: {
      ok: portalColors.success,
      warning: portalColors.warning,
      error: portalColors.danger,
      running: portalColors.info,
      pending: '#8b5cf6',
      aborted: portalColors.textSoft,
    },
    error: {
      main: portalColors.danger,
      light: '#ef4444',
    },
    success: {
      main: portalColors.success,
      light: '#22c55e',
    },
    info: {
      main: portalColors.info,
      light: '#06b6d4',
    },
    warning: {
      main: portalColors.warning,
      light: '#f59e0b',
    },
    divider: portalColors.borderSubtle,
  },
  defaultPageTheme: 'home',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
  pageTheme: {
    home: genPageTheme({
      colors: [portalColors.bgElevated, portalColors.bgCanvas],
      shape: shapes.wave,
    }),
    documentation: genPageTheme({
      colors: [portalColors.bgElevated, portalColors.bgCanvas],
      shape: shapes.wave,
    }),
    tool: genPageTheme({
      colors: [portalColors.bgElevated, portalColors.bgCanvas],
      shape: shapes.round,
    }),
    service: genPageTheme({
      colors: [portalColors.bgElevated, portalColors.bgCanvas],
      shape: shapes.wave,
    }),
    website: genPageTheme({
      colors: [portalColors.bgElevated, portalColors.bgCanvas],
      shape: shapes.wave,
    }),
    library: genPageTheme({
      colors: [portalColors.bgElevated, portalColors.bgCanvas],
      shape: shapes.wave,
    }),
    other: genPageTheme({
      colors: [portalColors.bgElevated, portalColors.bgCanvas],
      shape: shapes.wave,
    }),
    app: genPageTheme({
      colors: [portalColors.bgElevated, portalColors.bgCanvas],
      shape: shapes.wave,
    }),
    apis: genPageTheme({
      colors: [portalColors.bgElevated, portalColors.bgCanvas],
      shape: shapes.wave,
    }),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
          backgroundColor: portalColors.bgCanvas,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: portalColors.radiusSm,
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          padding: '8px 16px',
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${portalColors.accentGradFrom}, ${portalColors.accentGradTo})`,
          boxShadow: 'none',
          color: '#f9fafb',
          '&:hover': {
            background: `linear-gradient(135deg, ${portalColors.accentStrong}, ${portalColors.accent})`,
            boxShadow: portalColors.shadowHover,
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderColor: portalColors.borderDefault,
          color: portalColors.textMuted,
          '&:hover': {
            backgroundColor: portalColors.bgHoverSubtle,
            borderColor: portalColors.borderStrong,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: portalColors.radiusMd,
          boxShadow: 'none',
          border: `1px solid ${portalColors.borderSubtle}`,
          backgroundColor: portalColors.bgElevated,
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: portalColors.shadowHover,
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: portalColors.bgElevated,
        },
        rounded: {
          borderRadius: portalColors.radiusMd,
        },
        elevation1: {
          boxShadow: 'none',
          border: `1px solid ${portalColors.borderSubtle}`,
        },
        elevation2: {
          boxShadow: portalColors.shadowHover,
          border: `1px solid ${portalColors.borderSubtle}`,
        },
        elevation3: {
          boxShadow: portalColors.shadowCard,
          border: `1px solid ${portalColors.borderSubtle}`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: portalColors.radiusSm,
            backgroundColor: portalColors.bgElevated,
            '& fieldset': {
              borderColor: portalColors.borderStrong,
            },
            '&:hover fieldset': {
              borderColor: portalColors.textSoft,
            },
            '&.Mui-focused fieldset': {
              borderColor: portalColors.accent,
              boxShadow: `0 0 0 3px ${portalColors.accentSoft}`,
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: portalColors.radiusSm,
          backgroundColor: portalColors.bgElevated,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: portalColors.borderStrong,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: portalColors.textSoft,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: portalColors.accent,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        outlined: {
          borderRadius: portalColors.radiusSm,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '999px',
          fontSize: '0.75rem',
          fontWeight: 500,
          letterSpacing: '0.04em',
        },
        filled: {
          backgroundColor: portalColors.bgChip,
          border: `1px solid ${portalColors.borderSubtle}`,
        },
        colorSuccess: {
          backgroundColor: portalColors.successBg,
          borderColor: portalColors.successBorder,
          color: '#166534',
        },
        colorError: {
          backgroundColor: portalColors.dangerBg,
          borderColor: portalColors.dangerBorder,
          color: '#7f1d1d',
        },
        colorWarning: {
          backgroundColor: portalColors.warningBg,
          borderColor: portalColors.warningBorder,
          color: '#92400e',
        },
        colorInfo: {
          backgroundColor: portalColors.infoBg,
          borderColor: portalColors.infoBorder,
          color: '#0e7490',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${portalColors.borderSubtle}`,
          padding: '12px 16px',
        },
        head: {
          fontWeight: 600,
          color: portalColors.textMain,
          backgroundColor: portalColors.bgMuted,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s ease',
          '&:hover': {
            backgroundColor: portalColors.bgHoverSubtle,
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          color: portalColors.textMuted,
          minHeight: '48px',
          '&.Mui-selected': {
            color: portalColors.textMain,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: portalColors.accent,
          height: '2px',
          borderRadius: '1px',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: portalColors.radiusSm,
          border: '1px solid',
        },
        standardSuccess: {
          backgroundColor: portalColors.successBg,
          borderColor: portalColors.successBorder,
          color: '#166534',
        },
        standardError: {
          backgroundColor: portalColors.dangerBg,
          borderColor: portalColors.dangerBorder,
          color: '#7f1d1d',
        },
        standardWarning: {
          backgroundColor: portalColors.warningBg,
          borderColor: portalColors.warningBorder,
          color: '#92400e',
        },
        standardInfo: {
          backgroundColor: portalColors.infoBg,
          borderColor: portalColors.infoBorder,
          color: '#0e7490',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: portalColors.textLink,
          textDecoration: 'none',
          fontWeight: 500,
          '&:hover': {
            textDecoration: 'underline',
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: portalColors.radiusSm,
          '&:hover': {
            backgroundColor: portalColors.bgHover,
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: portalColors.bgElevated,
          border: `1px solid ${portalColors.borderSubtle}`,
          borderRadius: portalColors.radiusSm,
          boxShadow: portalColors.shadowCard,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          borderRadius: '6px',
          margin: '2px 4px',
          '&:hover': {
            backgroundColor: portalColors.bgHover,
          },
          '&.Mui-selected': {
            backgroundColor: portalColors.accentSoft,
            '&:hover': {
              backgroundColor: portalColors.accentSoft,
            },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: portalColors.textMain,
          color: '#ffffff',
          fontSize: '0.75rem',
          borderRadius: '6px',
          padding: '6px 10px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: portalColors.radiusLg,
          boxShadow: portalColors.shadowSoft,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: portalColors.bgElevated,
          borderRight: `1px solid ${portalColors.borderSubtle}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: portalColors.bgElevated,
          boxShadow: 'none',
          borderBottom: `1px solid ${portalColors.borderSubtle}`,
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          backgroundColor: portalColors.bgElevated,
        },
      },
    },
    BackstageHeader: {
      styleOverrides: {
        header: {
          backgroundImage: 'none',
          backgroundColor: portalColors.bgElevated,
          borderBottom: `1px solid ${portalColors.borderSubtle}`,
          boxShadow: 'none',
          paddingBottom: '16px',
        },
        title: {
          color: portalColors.textMain,
          fontWeight: 600,
          fontSize: '1.5rem',
        },
        subtitle: {
          color: portalColors.textMuted,
          fontSize: '0.9rem',
        },
      },
    },
    BackstageSidebar: {
      styleOverrides: {
        drawer: {
          backgroundColor: portalColors.bgElevated,
          borderRight: 'none',
          boxShadow: '1px 0 8px rgba(148, 163, 184, 0.15)',
        },
      },
    },
    BackstageSidebarItem: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          margin: '4px 12px',
          border: 'none',
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: portalColors.bgHover,
          },
        },
        selected: {
          backgroundColor: portalColors.accentSoft,
          border: 'none',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: '4px',
            top: '10px',
            bottom: '10px',
            width: '3px',
            borderRadius: '3px',
            backgroundColor: portalColors.accent,
          },
          '&:hover': {
            backgroundColor: portalColors.accentSoft,
          },
        },
        label: {
          fontWeight: 500,
        },
      },
    },
    BackstageSidebarDivider: {
      styleOverrides: {
        root: {
          background: 'transparent',
          margin: '8px 16px',
          height: '1px',
          backgroundColor: 'rgba(148, 163, 184, 0.2)',
        },
      },
    },
    BackstageItemCardHeader: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: portalColors.bgMuted,
          color: portalColors.textMain,
          padding: '16px 20px',
          borderBottom: `1px solid ${portalColors.borderSubtle}`,
          borderRadius: `${portalColors.radiusMd} ${portalColors.radiusMd} 0 0`,
        },
      },
    },
    BackstageInfoCard: {
      styleOverrides: {
        header: {
          borderBottom: `1px solid ${portalColors.borderSubtle}`,
        },
      },
    },
    BackstageTable: {
      styleOverrides: {
        root: {
          '& > div': {
            borderRadius: portalColors.radiusMd,
            border: `1px solid ${portalColors.borderSubtle}`,
            overflow: 'hidden',
          },
        },
      },
    },
  },
});
