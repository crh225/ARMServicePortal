import React, { useState } from 'react';
import { SignInPageProps, useApi } from '@backstage/core-plugin-api';
import { UserIdentity } from '@backstage/core-components';
import { auth0AuthApiRef } from '../../apis';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import LockIcon from '@material-ui/icons/Lock';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100%',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
  },
  card: {
    maxWidth: 420,
    width: '100%',
    margin: theme.spacing(2),
    borderRadius: 18,
    boxShadow: '0 12px 40px rgba(148, 163, 184, 0.25)',
    border: '1px solid rgba(148, 163, 184, 0.25)',
  },
  cardContent: {
    padding: theme.spacing(5),
    textAlign: 'center',
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    marginBottom: theme.spacing(3),
    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.25)',
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: theme.spacing(1),
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#64748b',
    marginBottom: theme.spacing(4),
  },
  button: {
    width: '100%',
    padding: theme.spacing(1.75, 3),
    borderRadius: 10,
    fontSize: '1rem',
    fontWeight: 600,
    textTransform: 'none' as const,
    background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
    color: '#fff',
    '&:hover': {
      background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
    },
  },
  guestButton: {
    width: '100%',
    marginTop: theme.spacing(2),
    padding: theme.spacing(1.5, 3),
    borderRadius: 10,
    textTransform: 'none' as const,
  },
  popupNotice: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing(3),
    padding: theme.spacing(1.5, 2),
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderRadius: 8,
  },
  error: {
    color: '#dc2626',
    marginTop: theme.spacing(2),
  },
}));

export const CustomSignInPage = (props: SignInPageProps) => {
  const classes = useStyles();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const authApi = useApi(auth0AuthApiRef);

  const handleAuth0Login = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!authApi) throw new Error('Auth0 API not configured');

      // Trigger OAuth popup
      const identityResponse = await authApi.getBackstageIdentity({
        instantPopup: true,
      });
      if (!identityResponse) throw new Error('Failed to get identity');

      // Get profile
      const profile = await authApi.getProfile();

      // Create UserIdentity with ALL THREE pieces
      // The authApi reference is CRITICAL - it's used for getCredentials() on every API request
      const identityApi = UserIdentity.create({
        identity: identityResponse.identity,
        authApi,
        profile,
      });

      props.onSignInSuccess(identityApi);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Guest uses backend endpoint directly
      const response = await fetch(
        'http://localhost:7007/api/auth/guest/refresh',
        { credentials: 'include' },
      );
      const data = await response.json();

      if (!data.backstageIdentity) {
        throw new Error('Guest login failed - no identity returned');
      }

      // For guest, create identity with mock authApi
      const identityApi = UserIdentity.create({
        identity: {
          type: 'user',
          userEntityRef: data.backstageIdentity.identity.userEntityRef,
          ownershipEntityRefs:
            data.backstageIdentity.identity.ownershipEntityRefs,
        },
        authApi: {
          getBackstageIdentity: async () => data.backstageIdentity,
          getProfile: async () => ({}),
          signOut: async () => {},
        } as any,
        profile: {},
      });

      props.onSignInSuccess(identityApi);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Guest login failed');
      setLoading(false);
    }
  };

  return (
    <Box className={classes.root}>
      <Card className={classes.card}>
        <CardContent className={classes.cardContent}>
          <Box className={classes.logoIcon}>
            <LockIcon style={{ fontSize: 32, color: '#fff' }} />
          </Box>

          <Typography className={classes.title}>ARM Service Portal</Typography>
          <Typography className={classes.subtitle}>
            Sign in to access your infrastructure resources.
          </Typography>

          {loading ? (
            <CircularProgress size={32} />
          ) : (
            <>
              <Button
                className={classes.button}
                onClick={handleAuth0Login}
                variant="contained"
              >
                Sign in with Auth0
                <OpenInNewIcon style={{ marginLeft: 8, fontSize: 18 }} />
              </Button>

              {isDevelopment && (
                <Button
                  className={classes.guestButton}
                  onClick={handleGuestLogin}
                  variant="outlined"
                >
                  Continue as Guest
                </Button>
              )}

              <Box className={classes.popupNotice}>
                <OpenInNewIcon
                  style={{ fontSize: 16, marginRight: 8, color: '#3b82f6' }}
                />
                <Typography style={{ fontSize: '0.8rem', color: '#475569' }}>
                  A popup window will open for authentication
                </Typography>
              </Box>

              {error && (
                <Typography className={classes.error}>{error}</Typography>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
