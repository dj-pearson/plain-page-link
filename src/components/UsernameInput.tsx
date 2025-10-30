import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUsernameCheck } from "@/hooks/useUsernameCheck";
import { Check, X, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  currentUsername?: string;
}

export const UsernameInput = ({ value, onChange, currentUsername }: UsernameInputProps) => {
  const { checkUsername, isChecking, error, isAvailable } = useUsernameCheck();
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (value && value !== currentUsername) {
      checkUsername(value);
      setTouched(true);
    }
  }, [value, currentUsername, checkUsername]);

  const showSuccess = touched && isAvailable && !error && !isChecking && value !== currentUsername;
  const showError = touched && (error || isAvailable === false) && !isChecking;

  return (
    <div className="space-y-2">
      <Label htmlFor="username">Username</Label>
      <div className="relative">
        <Input
          id="username"
          value={value}
          onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
          placeholder="Enter username"
          className={`pr-10 ${
            showSuccess ? 'border-green-500' : showError ? 'border-red-500' : ''
          }`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isChecking && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {showSuccess && <Check className="h-4 w-4 text-green-500" />}
          {showError && <X className="h-4 w-4 text-red-500" />}
        </div>
      </div>
      
      {showError && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      {showSuccess && (
        <p className="text-sm text-green-500">Username is available!</p>
      )}

      <Alert>
        <AlertDescription className="text-sm">
          Your profile will be accessible at: <strong>agentbio.net/{value || 'username'}</strong>
        </AlertDescription>
      </Alert>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>Username requirements:</p>
        <ul className="list-disc list-inside ml-2">
          <li>3-30 characters</li>
          <li>Letters, numbers, hyphens, and underscores only</li>
          <li>No profanity or reserved words</li>
        </ul>
      </div>
    </div>
  );
};