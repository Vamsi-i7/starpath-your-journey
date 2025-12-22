export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  
  const commonPasswords = ['password', '123456', '12345678', 'qwerty', 'abc123', 'password1', 'admin123'];
  if (commonPasswords.includes(password.toLowerCase())) {
    return { valid: false, message: 'This password is too common. Please choose a stronger password' };
  }
  
  return { valid: true, message: '' };
};
