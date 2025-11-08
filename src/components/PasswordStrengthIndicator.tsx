interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const getPasswordStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length === 0) return 0;

    // Length checks
    if (pwd.length >= 6) strength++;
    if (pwd.length >= 10) strength++;
    if (pwd.length >= 14) strength++;

    // Character variety checks
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++; // Mixed case
    if (/\d/.test(pwd)) strength++; // Numbers
    if (/[^a-zA-Z\d]/.test(pwd)) strength++; // Special characters

    return Math.min(strength, 5);
  };

  const strength = getPasswordStrength(password);

  const getStrengthLabel = (str: number): string => {
    if (str === 0) return '';
    if (str <= 2) return 'Weak';
    if (str === 3) return 'Fair';
    if (str === 4) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = (str: number): string => {
    if (str <= 2) return 'bg-red-500';
    if (str === 3) return 'bg-yellow-500';
    if (str === 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i < strength ? getStrengthColor(strength) : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between mt-2">
        <p className={`text-xs font-medium ${
          strength <= 2 ? 'text-red-600' :
          strength === 3 ? 'text-yellow-600' :
          strength === 4 ? 'text-blue-600' :
          'text-green-600'
        }`}>
          {getStrengthLabel(strength)}
        </p>
        <p className="text-xs text-muted-foreground">
          {strength < 3 && 'Try adding uppercase, numbers, and symbols'}
          {strength === 3 && 'Add special characters for better security'}
          {strength >= 4 && 'Great password!'}
        </p>
      </div>
    </div>
  );
};
