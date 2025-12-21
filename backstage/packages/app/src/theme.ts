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

  // GitHub orange for active indicators
  activeOrange: '#f78166',

  // Backgrounds
  bgCanvas: '#f3f4f6',
  bgElevated: '#ffffff',
  bgPanel: '#ffffff',
  bgChip: 'rgba(148, 163, 184, 0.12)',
  bgHover: 'rgba(148, 163, 184, 0.12)',
  bgHoverSubtle: 'rgba(148, 163, 184, 0.06)',
  bgMuted: '#f9fafb',
  bgNavPill: '#e5e7eb',

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
  shadowHover: '0 4px 14px rgba(15, 23, 42, 0.08)',
  shadowCardHover: '0 8px 24px rgba(148, 163, 184, 0.35)',
  shadowPill: '0 0 0 1px rgba(148, 163, 184, 0.8), 0 8px 18px rgba(148, 163, 184, 0.35)',
  shadowFocus: '0 0 0 3px rgba(37, 99, 235, 0.15)',

  // Border radius
  radiusXl: '28px',
  radiusLg: '18px',
  radiusMd: '12px',
  radiusSm: '8px',
  radiusPill: '999px',
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
      indicator: portalColors.activeOrange,
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
  // Flat page themes - no shapes/waves for cleaner look
  pageTheme: {
    home: genPageTheme({
      colors: [portalColors.bgElevated, portalColors.bgElevated],
      shape: shapes.wave,
    }),
    documentation: genPageTheme({
      colors: [portalColors.bgElevated, portalColors.bgElevated],
      shape: shapes.wave,
    }),
    tool: genPageTheme({
      colors: [portalColors.bgElevated, portalColors.bgElevated],
      shape: shapes.wave,
    }),
    service: genPageTheme({
      colors: [portalColors.bgElevated, portalColors.bgElevated],
      shape: shapes.wave,
    }),
    website: genPageTheme({
      colors: [portalColors.bgElevated, portalColors.bgElevated],
      shape: shapes.wave,
    }),
    library: genPageTheme({
      colors: [portalColors.bgElevated, portalColors.bgElevated],
      shape: shapes.wave,
    }),
    other: genPageTheme({
      colors: [portalColors.bgElevated, portalColors.bgElevated],
      shape: shapes.wave,
    }),
    app: genPageTheme({
      colors: [portalColors.bgElevated, portalColors.bgElevated],
      shape: shapes.wave,
    }),
    apis: genPageTheme({
      colors: [portalColors.bgElevated, portalColors.bgElevated],
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
    // Buttons - gradient primary, clean outlined
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: portalColors.radiusPill,
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          padding: '8px 18px',
          transition: 'all 0.16s ease-out',
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
          borderColor: portalColors.borderStrong,
          color: portalColors.textMuted,
          backgroundColor: portalColors.bgElevated,
          '&:hover': {
            backgroundColor: portalColors.bgHover,
            borderColor: portalColors.textSoft,
            transform: 'translateY(-1px)',
          },
        },
        text: {
          color: portalColors.textMuted,
          '&:hover': {
            backgroundColor: portalColors.bgHover,
          },
        },
      },
    },
    // Cards - better hover effect like ARM Portal
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: portalColors.radiusMd,
          boxShadow: 'none',
          border: `1px solid ${portalColors.borderSubtle}`,
          backgroundColor: portalColors.bgElevated,
          transition: 'all 0.2s ease-out',
          '&:hover': {
            borderColor: portalColors.accentStrong,
            boxShadow: portalColors.shadowCardHover,
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
        elevation0: {
          boxShadow: 'none',
          border: 'none',
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
    // Inputs - better focus ring like ARM Portal
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: portalColors.radiusSm,
            backgroundColor: portalColors.bgElevated,
            transition: 'all 0.15s ease-out',
            '& fieldset': {
              borderColor: portalColors.borderStrong,
              transition: 'all 0.15s ease-out',
            },
            '&:hover fieldset': {
              borderColor: portalColors.textSoft,
            },
            '&.Mui-focused fieldset': {
              borderColor: portalColors.accent,
              borderWidth: '1px',
            },
            '&.Mui-focused': {
              boxShadow: portalColors.shadowFocus,
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
          transition: 'all 0.15s ease-out',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: portalColors.borderStrong,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: portalColors.textSoft,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: portalColors.accent,
            borderWidth: '1px',
          },
          '&.Mui-focused': {
            boxShadow: portalColors.shadowFocus,
          },
        },
        input: {
          padding: '10px 12px',
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
    // Chips - pill style with colored backgrounds
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: portalColors.radiusPill,
          fontSize: '0.75rem',
          fontWeight: 500,
          letterSpacing: '0.02em',
          height: '26px',
        },
        filled: {
          backgroundColor: portalColors.bgChip,
          border: `1px solid ${portalColors.borderSubtle}`,
        },
        colorSuccess: {
          backgroundColor: portalColors.successBg,
          border: `1px solid ${portalColors.successBorder}`,
          color: '#166534',
        },
        colorError: {
          backgroundColor: portalColors.dangerBg,
          border: `1px solid ${portalColors.dangerBorder}`,
          color: '#7f1d1d',
        },
        colorWarning: {
          backgroundColor: portalColors.warningBg,
          border: `1px solid ${portalColors.warningBorder}`,
          color: '#92400e',
        },
        colorInfo: {
          backgroundColor: portalColors.infoBg,
          border: `1px solid ${portalColors.infoBorder}`,
          color: '#0e7490',
        },
      },
    },
    // Tables - cleaner, white header
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${portalColors.borderSubtle}`,
          padding: '14px 16px',
          fontSize: '0.875rem',
        },
        head: {
          fontWeight: 600,
          color: portalColors.textMain,
          backgroundColor: portalColors.bgElevated,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          borderBottom: `2px solid ${portalColors.borderSubtle}`,
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
          '&:last-child td': {
            borderBottom: 'none',
          },
        },
      },
    },
    // Tabs - clean with orange underline
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          color: portalColors.textMuted,
          minHeight: '48px',
          padding: '12px 16px',
          transition: 'all 0.15s ease',
          border: 'none',
          '&:hover': {
            color: portalColors.textMain,
            backgroundColor: portalColors.bgHoverSubtle,
          },
          '&.Mui-selected': {
            color: portalColors.textMain,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: '48px',
          '& .MuiTabs-scroller': {
            borderBottom: 'none',
          },
        },
        indicator: {
          backgroundColor: portalColors.activeOrange,
          height: '3px',
          borderRadius: '3px 3px 0 0',
        },
        scroller: {
          borderBottom: 'none',
        },
      },
    },
    // Alerts
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: portalColors.radiusSm,
          border: '1px solid',
          padding: '12px 16px',
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
          transition: 'color 0.15s ease',
          '&:hover': {
            textDecoration: 'underline',
            color: portalColors.accentStrong,
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: portalColors.radiusSm,
          transition: 'background-color 0.15s ease',
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
          marginTop: '4px',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
          borderRadius: '6px',
          margin: '2px 6px',
          padding: '8px 12px',
          transition: 'all 0.15s ease',
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
          fontWeight: 500,
          borderRadius: '6px',
          padding: '8px 12px',
          boxShadow: portalColors.shadowHover,
        },
        arrow: {
          color: portalColors.textMain,
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
    MuiBreadcrumbs: {
      styleOverrides: {
        root: {
          fontSize: '0.875rem',
        },
        separator: {
          color: portalColors.textSoft,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: portalColors.borderSubtle,
        },
      },
    },
    // Backstage specific components
    BackstageHeader: {
      styleOverrides: {
        header: {
          backgroundImage: 'none',
          backgroundColor: portalColors.bgElevated,
          borderBottom: 'none',
          boxShadow: '0 2px 12px rgba(148, 163, 184, 0.15), 0 4px 24px rgba(148, 163, 184, 0.08)',
          paddingBottom: '20px',
          position: 'relative',
          zIndex: 1,
        },
        title: {
          color: portalColors.textMain,
          fontWeight: 600,
          fontSize: '1.5rem',
          letterSpacing: '-0.01em',
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
          boxShadow: '2px 0 12px rgba(148, 163, 184, 0.2), 4px 0 24px rgba(148, 163, 184, 0.1)',
        },
      },
    },
    BackstageSidebarItem: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          margin: '0',
          border: 'none',
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: portalColors.bgHover,
          },
        },
        selected: {
          backgroundColor: 'transparent',
          border: 'none',
          '& svg': {
            color: portalColors.activeOrange,
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '3px',
            borderRadius: 0,
            backgroundColor: portalColors.activeOrange,
          },
          '&:hover': {
            backgroundColor: portalColors.bgHover,
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
          margin: '12px 16px',
          height: '1px',
          backgroundColor: 'rgba(148, 163, 184, 0.15)',
        },
      },
    },
    BackstageItemCardHeader: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: portalColors.bgElevated,
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
    // Fix the sidebar filter/personal sections - make white instead of gray
    CatalogReactUserListPicker: {
      styleOverrides: {
        root: {
          backgroundColor: portalColors.bgElevated,
        },
      },
    },
    // Icon buttons
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: portalColors.activeOrange,
          borderRadius: portalColors.radiusSm,
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: portalColors.bgHover,
          },
          // Make sure the 3-dot menu is visible
          '& svg': {
            color: 'inherit',
          },
        },
        colorInherit: {
          color: portalColors.activeOrange,
        },
        colorPrimary: {
          color: portalColors.accent,
        },
      },
    },
    // Ensure icons are visible - inherit from parent by default
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          // Inherit color from parent (like MuiIconButton)
          color: 'inherit',
        },
        colorAction: {
          color: portalColors.textMuted,
        },
        colorDisabled: {
          color: portalColors.textSoft,
        },
        colorPrimary: {
          color: portalColors.accent,
        },
      },
    },
    // Avatars
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: portalColors.accentSoft,
          color: portalColors.accent,
          fontWeight: 600,
        },
      },
    },
    // Badges
    MuiBadge: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: portalColors.accent,
        },
        colorSecondary: {
          backgroundColor: portalColors.activeOrange,
        },
      },
    },
    // Progress indicators
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: portalColors.radiusPill,
          backgroundColor: portalColors.bgChip,
        },
        bar: {
          borderRadius: portalColors.radiusPill,
          backgroundColor: portalColors.activeOrange,
        },
        colorPrimary: {
          backgroundColor: portalColors.bgChip,
        },
        barColorPrimary: {
          backgroundColor: portalColors.activeOrange,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        colorPrimary: {
          color: portalColors.activeOrange,
        },
      },
    },
    // Skeleton loading
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: portalColors.bgChip,
        },
      },
    },
  },
});
