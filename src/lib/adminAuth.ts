// Admin Authentication and Authorization Logic
// Centralized admin detection for consistent behavior across the app

/**
 * Check if the current user is an admin based on profile
 * Uses the is_admin flag from the database as the single source of truth
 */
export function isAdmin(profile: { is_admin?: boolean } | null | undefined): boolean {
  if (!profile) return false;
  return profile.is_admin === true;
}

/**
 * @deprecated Use isAdmin(profile) instead - admin status should come from database
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  console.warn('isAdminEmail is deprecated. Use isAdmin(profile) with the is_admin flag from database.');
  return false;
}

/**
 * @deprecated Admin emails should not be exposed in frontend code
 */
export function getAdminEmail(): string {
  console.warn('getAdminEmail is deprecated. Admin status should be managed via database.');
  return '';
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
