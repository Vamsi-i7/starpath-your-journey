import React from 'react';
import { vi } from 'vitest';

// Mock user data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {
    full_name: 'Test User',
    avatar_url: null,
  },
};

// Mock Auth Context
export const mockAuthContext = {
  user: mockUser,
  profile: {
    id: 'test-user-id',
    username: 'testuser',
    full_name: 'Test User',
    avatar_url: null,
    bio: null,
    level: 1,
    xp: 0,
    streak: 0,
    user_code: 'TEST123',
    is_public: true,
    theme: 'dark',
    notifications_enabled: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  session: { user: mockUser },
  isLoading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
};

// Mock AuthProvider for testing
export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const AuthContext = React.createContext(mockAuthContext);
  return <AuthContext.Provider value={mockAuthContext}>{children}</AuthContext.Provider>;
};

// Hook to use in mocking useAuth
export const useAuthMock = () => mockAuthContext;
