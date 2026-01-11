/**
 * Centralized error message mapping utility
 * Maps internal error details to user-friendly messages to prevent information leakage
 */

export type ErrorContext = 'auth' | 'database' | 'habit' | 'goal' | 'profile' | 'general';

export const getDisplayErrorMessage = (error: unknown, context: ErrorContext): string => {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  
  // Authentication context
  if (context === 'auth') {
    // Duplicate email/user already exists
    if (errorMessage.includes('already registered') || 
        errorMessage.includes('already exists') || 
        errorMessage.includes('duplicate') ||
        errorMessage.includes('user already registered') ||
        errorMessage.includes('email address is already registered')) {
      return 'This email is already registered. Please sign in instead, or use "Forgot Password" if you\'ve forgotten your password.';
    }
    // Invalid credentials
    if (errorMessage.includes('invalid login credentials') || 
        errorMessage.includes('invalid') && errorMessage.includes('password')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    // Email not confirmed
    if (errorMessage.includes('email not confirmed') || errorMessage.includes('confirm your email')) {
      return 'Please verify your email before signing in. Check your inbox (and spam folder) for the verification link.';
    }
    // Signup disabled
    if (errorMessage.includes('signups not allowed') || errorMessage.includes('signup disabled')) {
      return 'New signups are currently disabled. Please try again later.';
    }
    // Rate limiting
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many') || errorMessage.includes('exceeded')) {
      return 'Too many attempts. Please wait a few minutes and try again.';
    }
    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    // Weak password
    if (errorMessage.includes('password') && (errorMessage.includes('weak') || errorMessage.includes('short') || errorMessage.includes('strong'))) {
      return 'Password is too weak. Please use at least 8 characters with uppercase, lowercase, number, and special character.';
    }
    // Invalid email format
    if (errorMessage.includes('invalid email') || errorMessage.includes('email format')) {
      return 'Please enter a valid email address.';
    }
    // User not found
    if (errorMessage.includes('user not found') || errorMessage.includes('no user')) {
      return 'No account found with this email. Please check your email or sign up.';
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
