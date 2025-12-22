/**
 * Centralized error message mapping utility
 * Maps internal error details to user-friendly messages to prevent information leakage
 */

export type ErrorContext = 'auth' | 'database' | 'habit' | 'goal' | 'profile' | 'general';

export const getDisplayErrorMessage = (error: unknown, context: ErrorContext): string => {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  // Authentication context
  if (context === 'auth') {
    if (errorMessage.includes('invalid') || errorMessage.includes('credentials') || errorMessage.includes('password')) {
      return 'Invalid email or password. Please try again.';
    }
    if (errorMessage.includes('email not confirmed')) {
      return 'Please verify your email before signing in.';
    }
    if (errorMessage.includes('already registered') || errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
      return 'An account with this email already exists.';
    }
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    return 'Authentication failed. Please try again.';
  }
  
  // Habit operations
  if (context === 'habit') {
    if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
      return 'A habit with this name already exists.';
    }
    if (errorMessage.includes('foreign key') || errorMessage.includes('reference')) {
      return 'Cannot complete operation due to related data.';
    }
    return 'Unable to complete habit operation. Please try again.';
  }
  
  // Goal operations
  if (context === 'goal') {
    if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
      return 'A goal with this name already exists.';
    }
    if (errorMessage.includes('foreign key') || errorMessage.includes('reference')) {
      return 'Cannot complete operation due to related data.';
    }
    return 'Unable to complete goal operation. Please try again.';
  }
  
  // Profile operations
  if (context === 'profile') {
    if (errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
      return 'This username is already taken.';
    }
    return 'Unable to update profile. Please try again.';
  }
  
  // General database operations
  if (context === 'database') {
    if (errorMessage.includes('unique constraint') || errorMessage.includes('duplicate')) {
      return 'This item already exists.';
    }
    if (errorMessage.includes('foreign key')) {
      return 'Cannot complete operation due to related data.';
    }
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    return 'Unable to save changes. Please try again.';
  }
  
  // Default generic message
  return 'An error occurred. Please try again.';
};
