import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

export default function GrantAdminAccess() {
  const [isGranting, setIsGranting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const grantAdmin = async () => {
    if (!user) {
      setResult({ success: false, message: "You must be logged in" });
      return;
    }

    setIsGranting(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('grant-admin', {
        body: { userId: user.id }
      });

      if (error) throw error;

      if (data.success) {
        setResult({ success: true, message: data.message });
        // Refresh the page after 2 seconds to reload user roles
        setTimeout(() => {
          window.location.href = '/admin';
        }, 2000);
      } else {
        setResult({ success: false, message: data.error || 'Failed to grant admin access' });
      }
    } catch (error) {
      console.error("Error granting admin:", error);
      setResult({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error occurred' 
      });
    } finally {
      setIsGranting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-16 w-16 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Grant Admin Access</CardTitle>
          <CardDescription>
            Click the button below to grant admin privileges to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!user && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Please log in first</span>
            </div>
          )}

          {user && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-medium text-blue-900">Current User:</p>
              <p className="text-blue-700">{user.email}</p>
            </div>
          )}

          {result && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              result.success 
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {result.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{result.message}</span>
            </div>
          )}

          <Button
            onClick={grantAdmin}
            disabled={isGranting || !user || result?.success}
            className="w-full"
            size="lg"
          >
            {isGranting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Granting Admin Access...
              </>
            ) : result?.success ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Admin Access Granted! Redirecting...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Grant Admin Access
              </>
            )}
          </Button>

          {!user && (
            <Button
              variant="outline"
              onClick={() => navigate('/auth/login')}
              className="w-full"
            >
              Go to Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
