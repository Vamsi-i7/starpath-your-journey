// Password strength validation utility

export interface PasswordRequirement {
  id: string;
  label: string;
  regex: RegExp;
  met: boolean;
}

export interface PasswordStrength {
  score: number; // 0-100
  level: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
  requirements: PasswordRequirement[];
  isValid: boolean;
}

export const PASSWORD_REQUIREMENTS = [
  {
    id: 'minLength',
    label: 'At least 8 characters',
    regex: /.{8,}/,
    met: false
  },
  {
    id: 'uppercase',
    label: 'One uppercase letter (A-Z)',
    regex: /[A-Z]/,
    met: false
  },
  {
    id: 'lowercase',
    label: 'One lowercase letter (a-z)',
    regex: /[a-z]/,
    met: false
  },
  {
    id: 'number',
    label: 'One number (0-9)',
    regex: /\d/,
    met: false
  },
  {
    id: 'special',
    label: 'One special character (!@#$%^&*)',
    regex: /[!@#$%^&*(),.?":{}|<>]/,
    met: false
  }
];

export const validatePasswordStrength = (password: string): PasswordStrength => {
  if (!password) {
    return {
      score: 0,
      level: 'weak',
      requirements: PASSWORD_REQUIREMENTS.map(req => ({ ...req, met: false })),
      isValid: false
    };
  }

  // Check each requirement
  const requirements = PASSWORD_REQUIREMENTS.map(req => ({
    ...req,
    met: req.regex.test(password)
  }));

  // Calculate score (20 points per requirement met)
  const metCount = requirements.filter(req => req.met).length;
  let score = (metCount / requirements.length) * 100;

  // Bonus points for length
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  
  // Cap at 100
  score = Math.min(100, score);

  // Determine level
  let level: 'weak' | 'fair' | 'good' | 'strong' | 'excellent';
  if (score < 40) level = 'weak';
  else if (score < 60) level = 'fair';
  else if (score < 80) level = 'good';
  else if (score < 95) level = 'strong';
  else level = 'excellent';

  // Password is valid if all basic requirements are met
  const isValid = requirements.every(req => req.met);

  return {
    score,
    level,
    requirements,
    isValid
  };
};

export const getPasswordStrengthColor = (level: string): string => {
  switch (level) {
    case 'weak':
      return 'bg-red-500';
    case 'fair':
      return 'bg-orange-500';
    case 'good':
      return 'bg-yellow-500';
    case 'strong':
      return 'bg-blue-500';
    case 'excellent':
      return 'bg-green-500';
    default:
      return 'bg-gray-300';
  }
};

export const getPasswordStrengthText = (level: string): string => {
  switch (level) {
    case 'weak':
      return 'Weak password';
    case 'fair':
      return 'Fair password';
    case 'good':
      return 'Good password';
    case 'strong':
      return 'Strong password';
    case 'excellent':
      return 'Excellent password!';
    default:
      return 'Enter password';
  }
};
