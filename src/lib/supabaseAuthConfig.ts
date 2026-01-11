// Supabase Auth Configuration
// This file configures OAuth providers

export const getAuthConfig = () => {
  return {
    google: {
      enabled: !!import.meta.env.VITE_GOOGLE_CLIENT_ID,
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    },
  };
};

export const getRedirectUrl = () => {
  // Use current origin for redirect
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  return 'http://localhost:8081/auth/callback';
};
