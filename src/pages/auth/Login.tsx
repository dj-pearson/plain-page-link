import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Home, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { emailSchema, sanitizeURL } from "@/utils/validation";
import { validateRedirectPath } from "@/utils/navigation";
import { useToast } from "@/hooks/use-toast";
import { cleanupAndReload } from "@/lib/sw-cleanup";
import {
    checkLoginThrottle,
    recordLoginAttempt,
    formatBlockedUntil,
    getDeviceFingerprint,
} from "@/hooks/useLoginSecurity";

const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { signIn, signInWithGoogle, signInWithApple, isLoading, error, clearError, user } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [isThrottled, setIsThrottled] = useState(false);
    const [throttleMessage, setThrottleMessage] = useState<string | null>(null);
    const { toast } = useToast();

    const rawRedirect = searchParams.get("redirect") || "/dashboard";
    const sanitizedRedirect = sanitizeURL(rawRedirect);
    const redirectTo = validateRedirectPath(sanitizedRedirect, "/dashboard");

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    useEffect(() => {
        if (user) {
            localStorage.removeItem('lastVisitedRoute');
            navigate(redirectTo, { replace: true });
        }
    }, [user, navigate, redirectTo]);

    useEffect(() => {
        return () => {
            clearError();
        };
    }, [clearError]);

    const onSubmit = async (data: LoginFormData) => {
        const email = data.email.toLowerCase().trim();

        try {
            const throttleResult = await checkLoginThrottle(email);

            if (throttleResult.blocked) {
                const timeLeft = throttleResult.blockedUntil
                    ? formatBlockedUntil(throttleResult.blockedUntil)
                    : '15 minutes';
                setIsThrottled(true);
                setThrottleMessage(`Too many login attempts. Please try again in ${timeLeft}.`);
                toast({
                    title: "Account Temporarily Locked",
                    description: `Too many failed login attempts. Try again in ${timeLeft}.`,
                    variant: "destructive",
                });
                return;
            }
        } catch (throttleError) {
            console.error("Throttle check failed:", throttleError);
        }

        setIsThrottled(false);
        setThrottleMessage(null);

        try {
            await signIn(email, data.password);
            await recordLoginAttempt(email, true, undefined, undefined, getDeviceFingerprint());
        } catch (error: any) {
            const isNetworkError = error?.message?.includes('fetch') ||
                                    error?.message?.includes('network') ||
                                    error?.name === 'AuthRetryableFetchError';

            if (isNetworkError) {
                toast({
                    title: "Connection Issue Detected",
                    description: "Your browser cache may be interfering. Try refreshing the page or clearing your browser cache.",
                    variant: "destructive",
                });
                setTimeout(() => {
                    cleanupAndReload();
                }, 3000);
            }

            await recordLoginAttempt(
                email,
                false,
                undefined,
                isNetworkError ? 'network_error' : 'invalid_credentials',
                getDeviceFingerprint()
            );
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Google sign-in failed:", error);
            toast({
                title: "Google Sign-In Failed",
                description: "Unable to sign in with Google. Please try again or use email/password.",
                variant: "destructive",
            });
        }
    };

    const handleAppleSignIn = async () => {
        try {
            await signInWithApple();
        } catch (error) {
            console.error("Apple sign-in failed:", error);
            toast({
                title: "Apple Sign-In Failed",
                description: "Unable to sign in with Apple. Please try again or use email/password.",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding & Social Proof */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
                {/* Animated gradient orbs */}
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

                {/* Grid pattern overlay */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                    backgroundSize: '60px 60px'
                }} />

                <div className="relative z-10 flex flex-col justify-between p-12 w-full">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <Home className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                            AgentBio
                        </span>
                    </Link>

                    {/* Main hero content */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                                Turn every click into a{' '}
                                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                                    closed deal
                                </span>
                            </h1>
                            <p className="mt-4 text-lg text-blue-100/60 max-w-md leading-relaxed">
                                AI-powered intelligence that transforms your real estate business with predictive lead scoring and smart property matching.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-6">
                            {[
                                { value: '2x', label: 'Lead Conversion' },
                                { value: '5+', label: 'Hours Saved/Week' },
                                { value: '30%', label: 'Faster Close' },
                            ].map((stat) => (
                                <div key={stat.label} className="space-y-1">
                                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                                    <div className="text-xs text-blue-200/50 uppercase tracking-wider">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Testimonial */}
                        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                            <p className="text-blue-100/80 text-sm leading-relaxed italic">
                                "AgentBio completely changed how I manage leads. The AI scoring alone saved me hours every week and my conversion rate doubled in the first month."
                            </p>
                            <div className="mt-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                                    SM
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">Sarah Mitchell</div>
                                    <div className="text-xs text-blue-200/50">Top Producer, Miami</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-6 text-xs text-blue-200/30">
                        <Link to="/privacy" className="hover:text-blue-200/60 transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-blue-200/60 transition-colors">Terms</Link>
                        <span>AgentBio Intelligence</span>
                    </div>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 flex flex-col bg-white">
                {/* Mobile header */}
                <header className="lg:hidden bg-white border-b border-gray-100 sticky top-0 z-50">
                    <div className="px-4 py-3 flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <Home className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-lg font-bold text-gray-900">AgentBio</span>
                        </Link>
                        <Link to="/auth/register" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                            Sign Up
                        </Link>
                    </div>
                </header>

                <div className="flex-1 flex items-center justify-center px-6 py-12">
                    <div className="w-full max-w-[420px]">
                        {/* Header */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Welcome back
                            </h2>
                            <p className="mt-2 text-sm text-gray-500">
                                Sign in to your account to continue
                            </p>
                        </div>

                        {/* OAuth Buttons */}
                        <div className="space-y-3 mb-6">
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Continue with Google
                            </button>

                            <button
                                type="button"
                                onClick={handleAppleSignIn}
                                disabled={isLoading}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                </svg>
                                Continue with Apple
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-3 bg-white text-gray-400 uppercase tracking-wider">or</span>
                            </div>
                        </div>

                        {/* Throttle warning */}
                        {isThrottled && throttleMessage && (
                            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-800">Account Temporarily Locked</p>
                                    <p className="text-xs text-amber-600 mt-1">{throttleMessage}</p>
                                </div>
                            </div>
                        )}

                        {/* Error message */}
                        {error && !isThrottled && (
                            <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-red-800">Login Failed</p>
                                    <p className="text-xs text-red-600 mt-1">
                                        Invalid email or password. Please check your credentials and try again.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Login Form */}
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div>
                                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email address
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        {...register("email")}
                                        id="login-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                        className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                                            errors.email ? "border-red-300" : "border-gray-200"
                                        }`}
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.email.message}</p>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <Link
                                        to="/auth/forgot-password"
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                        {...register("password")}
                                        id="login-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
                                        className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                                            errors.password ? "border-red-300" : "border-gray-200"
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1.5 text-xs text-red-600">{errors.password.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || isThrottled}
                                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Signing in...
                                    </>
                                ) : isThrottled ? (
                                    "Account Locked"
                                ) : (
                                    "Sign In"
                                )}
                            </button>
                        </form>

                        {/* Sign up link */}
                        <p className="mt-8 text-center text-sm text-gray-500">
                            Don't have an account?{" "}
                            <Link to="/auth/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                                Create account
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
