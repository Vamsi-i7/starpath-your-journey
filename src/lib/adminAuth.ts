// Admin Authentication and Authorization Logic
// Centralized admin detection for consistent behavior across the app

const ADMIN_EMAIL = 'vaniramesh3484@gmail.com';

/**
 * Check if a user email is an admin
 * This is the single source of truth for admin identification
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Check if the current user is an admin based on profile
 * Uses both email check and is_admin flag for redundancy
 */
export function isAdmin(profile: { email?: string; is_admin?: boolean } | null | undefined): boolean {
  if (!profile) return false;
  
  // Check both email and is_admin flag
  const emailMatch = isAdminEmail(profile.email);
  const flagSet = profile.is_admin === true;
  
  // Return true if either condition is met (for flexibility)
  return emailMatch || flagSet;
}

/**
 * Get admin email for documentation/UI purposes
 */
export function getAdminEmail(): string {
  return ADMIN_EMAIL;
}

/**
 * Verify admin access and throw error if not authorized
 * Use this in components/functions that require admin access
 */
export function requireAdmin(profile: { email?: string; is_admin?: boolean } | null | undefined): void {
  if (!isAdmin(profile)) {
    throw new Error('Unauthorized: Admin access required');
  }
}

/**
 * Check if admin verification is needed (for secondary auth)
 */
export function needsAdminVerification(): boolean {
  const verifiedAt = sessionStorage.getItem('admin_verified_at');
  if (!verifiedAt) return true;
  
  // Require re-verification every 30 minutes
  const verifiedTime = new Date(verifiedAt).getTime();
  const now = Date.now();
  const thirtyMinutes = 30 * 60 * 1000;
  
  return (now - verifiedTime) > thirtyMinutes;
}

/**
 * Mark admin as verified (after password re-entry)
 */
export function setAdminVerified(): void {
  sessionStorage.setItem('admin_verified_at', new Date().toISOString());
}

/**
 * Clear admin verification
 */
export function clearAdminVerification(): void {
  sessionStorage.removeItem('admin_verified_at');
}
