import {
  createUnifiedTheme,
  palettes,
  genPageTheme,
  shapes,
} from '@backstage/theme';

const portalColors = {
  accent: '#3b82f6',
  accentSoft: 'rgba(59, 130, 246, 0.12)',
  accentStrong: '#2563eb',
  accentGradFrom: '#2563eb',
  accentGradTo: '#60a5fa',

  activeOrange: '#FF6B35',

  bgCanvas: '#f3f4f6',
  bgElevated: '#ffffff',
  bgPanel: '#ffffff',
  bgChip: 'rgba(148, 163, 184, 0.12)',
  bgHover: 'rgba(148, 163, 184, 0.12)',
  bgHoverSubtle: 'rgba(148, 163, 184, 0.06)',
  bgMuted: '#f9fafb',
  bgNavPill: '#e5e7eb',

  textMain: '#0f172a',
  textMuted: '#6b7280',
  textSoft: '#9ca3af',
  textLink: '#2563eb',

  borderSubtle: 'rgba(148, 163, 184, 0.45)',
  borderStrong: 'rgba(148, 163, 184, 0.8)',
  borderDefault: 'rgba(148, 163, 184, 0.45)',

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

  shadowSoft: '0 18px 40px rgba(148, 163, 184, 0.35)',
  shadowCard: '0 12px 28px rgba(148, 163, 184, 0.25)',
  shadowHover: '0 4px 14px rgba(15, 23, 42, 0.08)',
  shadowCardHover: '0 8px 24px rgba(148, 163, 184, 0.35)',
  shadowPill: '0 0 0 1px rgba(148, 163, 184, 0.8), 0 8px 18px rgba(148, 163, 184, 0.35)',
  shadowFocus: '0 0 0 3px rgba(37, 99, 235, 0.15)',

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
        '[class*="MuiIconButton"]': {
          color: `${portalColors.activeOrange} !important`,
        },
        '[class*="MuiIconButton"] svg': {
          color: `${portalColors.activeOrange} !important`,
        },
        '[aria-label="more"]': {
          color: `${portalColors.activeOrange} !important`,
        },
        '[aria-label="more"] svg': {
          color: `${portalColors.activeOrange} !important`,
        },
        '.MuiInputBase-root': {
          backgroundColor: `${portalColors.bgElevated} !important`,
          boxShadow: 'none !important',
          border: `1px solid ${portalColors.borderSubtle} !important`,
          borderRadius: `${portalColors.radiusSm} !important`,
        },
        '.MuiInputBase-root:hover': {
          borderColor: `${portalColors.borderStrong} !important`,
        },
        '.MuiInputBase-root.Mui-focused': {
          backgroundColor: `${portalColors.bgElevated} !important`,
          boxShadow: 'none !important',
          borderColor: `${portalColors.borderStrong} !important`,
        },
        '.MuiInputBase-input': {
          backgroundColor: 'transparent !important',
        },
        '.MuiFilledInput-root': {
          backgroundColor: `${portalColors.bgElevated} !important`,
          boxShadow: 'none !important',
        },
        '.MuiFilledInput-root:hover': {
          backgroundColor: `${portalColors.bgElevated} !important`,
        },
        '.MuiFilledInput-root.Mui-focused': {
          backgroundColor: `${portalColors.bgElevated} !important`,
          boxShadow: 'none !important',
        },
        '.MuiInput-underline:before, .MuiInput-underline:after': {
          borderBottom: 'none !important',
        },
        '.MuiFilledInput-underline:before, .MuiFilledInput-underline:after': {
          borderBottom: 'none !important',
        },
        '.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: `${portalColors.borderStrong} !important`,
          borderWidth: '1px !important',
        },
        '.MuiFormControl-root .MuiInputBase-root': {
          backgroundColor: `${portalColors.bgElevated} !important`,
        },
        'input:focus, textarea:focus, select:focus': {
          backgroundColor: `${portalColors.bgElevated} !important`,
          outline: 'none !important',
        },
        '.MuiSelect-select:focus': {
          backgroundColor: `${portalColors.bgElevated} !important`,
        },
        '.MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: `${portalColors.borderStrong} !important`,
        },
        '.MuiOutlinedInput-notchedOutline': {
          borderColor: `${portalColors.borderSubtle} !important`,
        },
        '.MuiAutocomplete-inputRoot.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: `${portalColors.borderStrong} !important`,
          borderWidth: '1px !important',
        },
        '.MuiAutocomplete-inputRoot:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: `${portalColors.borderStrong} !important`,
        },
        '.MuiStepIcon-root.Mui-active .MuiStepIcon-text': {
          fill: '#ffffff !important',
        },
        // Ensure input labels are visible - MUI v4 - aggressive
        'label, .MuiInputLabel-root, .MuiFormLabel-root': {
          color: `${portalColors.textMuted} !important`,
          opacity: '1 !important',
          visibility: 'visible !important',
          WebkitTextFillColor: `${portalColors.textMuted} !important`,
        },
        '.MuiInputLabel-outlined, .MuiInputLabel-formControl': {
          color: `${portalColors.textMuted} !important`,
          opacity: '1 !important',
          visibility: 'visible !important',
        },
        'label.Mui-focused, .MuiInputLabel-root.Mui-focused, .MuiFormLabel-root.Mui-focused': {
          color: `${portalColors.accent} !important`,
          WebkitTextFillColor: `${portalColors.accent} !important`,
        },
        '.MuiInputLabel-shrink, .MuiInputLabel-root.MuiInputLabel-shrink': {
          color: `${portalColors.textMain} !important`,
          WebkitTextFillColor: `${portalColors.textMain} !important`,
          backgroundColor: portalColors.bgElevated,
          padding: '0 4px',
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
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: portalColors.radiusMd,
          boxShadow: 'none',
          border: `1px solid ${portalColors.borderSubtle}`,
          backgroundColor: portalColors.bgElevated,
          transition: 'all 0.2s ease-out',
          '&:hover': {
            borderColor: portalColors.borderStrong,
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
          boxShadow: 'none',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: portalColors.borderStrong,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: portalColors.borderStrong,
            borderWidth: '1px',
          },
          '&.Mui-focused': {
            boxShadow: 'none',
          },
        },
        notchedOutline: {
          borderColor: portalColors.borderSubtle,
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
        select: {
          '&:focus': {
            backgroundColor: `${portalColors.bgElevated} !important`,
          },
        },
      },
    },
    MuiInput: {
      styleOverrides: {
        root: {
          '&:before': {
            borderBottom: 'none !important',
          },
          '&:after': {
            borderBottom: 'none !important',
          },
          '&:hover:not(.Mui-disabled):before': {
            borderBottom: 'none !important',
          },
        },
        underline: {
          '&:before': {
            borderBottom: 'none !important',
          },
          '&:after': {
            borderBottom: 'none !important',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          backgroundColor: `${portalColors.bgElevated} !important`,
          borderRadius: portalColors.radiusSm,
          border: `1px solid ${portalColors.borderSubtle}`,
          transition: 'border-color 0.15s ease-out',
          boxShadow: 'none !important',
          '&:hover': {
            backgroundColor: `${portalColors.bgElevated} !important`,
            borderColor: portalColors.borderStrong,
          },
          '&.Mui-focused': {
            backgroundColor: `${portalColors.bgElevated} !important`,
            boxShadow: 'none !important',
            borderColor: portalColors.borderStrong,
          },
          '&.Mui-error': {
            borderColor: portalColors.danger,
          },
        },
        input: {
          padding: '12px 14px',
          fontSize: '0.875rem',
          backgroundColor: 'transparent !important',
          '&::placeholder': {
            color: portalColors.textSoft,
            opacity: 1,
          },
          '&:-webkit-autofill': {
            WebkitBoxShadow: `0 0 0 100px ${portalColors.bgElevated} inset !important`,
            backgroundColor: `${portalColors.bgElevated} !important`,
          },
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          backgroundColor: `${portalColors.bgElevated} !important`,
          borderRadius: portalColors.radiusSm,
          border: `1px solid ${portalColors.borderSubtle}`,
          boxShadow: 'none !important',
          '&:before': {
            borderBottom: 'none !important',
          },
          '&:after': {
            borderBottom: 'none !important',
          },
          '&:hover': {
            backgroundColor: `${portalColors.bgElevated} !important`,
            borderColor: portalColors.borderSubtle,
          },
          '&.Mui-focused': {
            backgroundColor: `${portalColors.bgElevated} !important`,
            borderColor: `${portalColors.borderSubtle} !important`,
            borderWidth: '1px',
            boxShadow: 'none !important',
          },
          '&.Mui-disabled': {
            backgroundColor: `${portalColors.bgMuted} !important`,
          },
        },
        input: {
          padding: '25px 14px 8px 14px',
          backgroundColor: 'transparent !important',
        },
        underline: {
          '&:before': {
            borderBottom: 'none !important',
          },
          '&:after': {
            borderBottom: 'none !important',
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: portalColors.textMuted,
          fontWeight: 500,
          '&.Mui-focused': {
            color: portalColors.accent,
          },
          '&.Mui-error': {
            color: portalColors.danger,
          },
          '&.MuiInputLabel-shrink': {
            color: portalColors.textMain,
            backgroundColor: portalColors.bgElevated,
            padding: '0 4px',
          },
        },
        outlined: {
          // Ensure label is visible when inside the input (not shrunk)
          color: portalColors.textMuted,
          '&.MuiInputLabel-shrink': {
            color: portalColors.textMain,
          },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          color: portalColors.textMuted,
          fontSize: '0.75rem',
          marginTop: '6px',
          marginLeft: 0,
          '&.Mui-error': {
            color: portalColors.danger,
          },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          marginBottom: '16px',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            padding: '4px 12px',
          },
        },
        inputRoot: {
          borderRadius: portalColors.radiusSm,
        },
        paper: {
          borderRadius: portalColors.radiusSm,
          boxShadow: portalColors.shadowCard,
          border: `1px solid ${portalColors.borderSubtle}`,
        },
        option: {
          padding: '10px 14px',
          fontSize: '0.875rem',
          '&:hover': {
            backgroundColor: portalColors.bgHover,
          },
          '&[aria-selected="true"]': {
            backgroundColor: portalColors.accentSoft,
          },
        },
      },
    },
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
          '& .MuiIconButton-root': {
            color: portalColors.activeOrange,
          },
          '& .MuiIconButton-root svg': {
            color: portalColors.activeOrange,
          },
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
    CatalogReactUserListPicker: {
      styleOverrides: {
        root: {
          backgroundColor: portalColors.bgElevated,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: `${portalColors.activeOrange} !important`,
          borderRadius: portalColors.radiusSm,
          transition: 'all 0.15s ease',
          '&:hover': {
            backgroundColor: portalColors.bgHover,
          },
          '& svg': {
            color: `${portalColors.activeOrange} !important`,
          },
        },
        colorInherit: {
          color: `${portalColors.activeOrange} !important`,
        },
        colorPrimary: {
          color: `${portalColors.accent} !important`,
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
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
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: portalColors.accentSoft,
          color: portalColors.accent,
          fontWeight: 600,
        },
      },
    },
    MuiBadge: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: portalColors.accent,
        },
        colorSecondary: {
          backgroundColor: portalColors.accentStrong,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: portalColors.radiusPill,
          backgroundColor: portalColors.bgChip,
        },
        bar: {
          borderRadius: portalColors.radiusPill,
          backgroundColor: portalColors.accent,
        },
        colorPrimary: {
          backgroundColor: portalColors.bgChip,
        },
        barColorPrimary: {
          backgroundColor: portalColors.accent,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        colorPrimary: {
          color: portalColors.accent,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: portalColors.bgChip,
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          backgroundColor: 'transparent',
          padding: '24px 0',
        },
      },
    },
    MuiStep: {
      styleOverrides: {
        root: {
          padding: '0 16px',
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        root: {
          '&.Mui-disabled': {
            opacity: 0.5,
          },
        },
        label: {
          fontSize: '0.8rem',
          fontWeight: 500,
          color: portalColors.textMuted,
          marginTop: '8px',
          '&.Mui-active': {
            color: portalColors.textMain,
            fontWeight: 600,
          },
          '&.Mui-completed': {
            color: portalColors.success,
            fontWeight: 500,
          },
        },
        iconContainer: {
          paddingRight: 0,
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          width: '32px',
          height: '32px',
          color: '#9ca3af',
          '&.Mui-active': {
            color: portalColors.accent,
            '& .MuiStepIcon-text': {
              fill: '#ffffff',
            },
          },
          '&.Mui-completed': {
            color: portalColors.success,
          },
        },
        text: {
          fill: '#ffffff',
          fontSize: '0.8rem',
          fontWeight: 700,
        },
      },
    },
    MuiStepConnector: {
      styleOverrides: {
        root: {
          '&.Mui-active': {
            '& .MuiStepConnector-line': {
              borderColor: portalColors.accent,
            },
          },
          '&.Mui-completed': {
            '& .MuiStepConnector-line': {
              borderColor: portalColors.success,
            },
          },
        },
        line: {
          borderColor: portalColors.borderStrong,
          borderTopWidth: '2px',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        h1: {
          fontSize: '2rem',
          fontWeight: 600,
          color: portalColors.textMain,
          letterSpacing: '-0.02em',
        },
        h2: {
          fontSize: '1.5rem',
          fontWeight: 600,
          color: portalColors.textMain,
          letterSpacing: '-0.01em',
        },
        h3: {
          fontSize: '1.25rem',
          fontWeight: 600,
          color: portalColors.textMain,
        },
        h4: {
          fontSize: '1.1rem',
          fontWeight: 600,
          color: portalColors.textMain,
        },
        h5: {
          fontSize: '1rem',
          fontWeight: 600,
          color: portalColors.textMain,
        },
        h6: {
          fontSize: '0.875rem',
          fontWeight: 600,
          color: portalColors.textMain,
        },
        subtitle1: {
          fontSize: '0.9rem',
          color: portalColors.textMuted,
        },
        subtitle2: {
          fontSize: '0.8rem',
          color: portalColors.textMuted,
        },
        body1: {
          fontSize: '0.875rem',
          color: portalColors.textMain,
        },
        body2: {
          fontSize: '0.8rem',
          color: portalColors.textMuted,
        },
      },
    },
  },
});
