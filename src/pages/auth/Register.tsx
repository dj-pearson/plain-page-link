import { Link, useNavigate } from "react-router-dom";
import { Home, Mail, Lock, User, AlertCircle, Loader2, Eye, EyeOff, ArrowLeft, Shield, Zap, BarChart3 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect, useState } from "react";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { useUsernameCheck } from "@/hooks/useUsernameCheck";
import { Check, X, Loader2 as UsernameLoader } from "lucide-react";
import { passwordSchema, usernameSchema, emailSchema } from "@/utils/validation";
import { OTPInput } from "@/components/auth/OTPInput";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

const registerSchema = z
    .object({
        username: usernameSchema,
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: emailSchema,
        password: passwordSchema,
        confirmPassword: z.string().min(1, "Please confirm your password"),
        agreedToTerms: z.boolean().refine((val) => val === true, {
            message: "You must agree to the terms to create an account",
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
    const navigate = useNavigate();
    const { signUp, signInWithGoogle, signInWithApple, isLoading, error, clearError, user, session } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordValue, setPasswordValue] = useState("");
    const { checkUsername, isChecking, error: usernameError, isAvailable } = useUsernameCheck();
    const [usernameTouched, setUsernameTouched] = useState(false);
    const [emailVerificationSent, setEmailVerificationSent] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    const [otpError, setOtpError] = useState("");
    const [resendCooldown, setResendCooldown] = useState(0);
    const { toast } = useToast();

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const usernameValue = watch("username");

    useEffect(() => {
        if (user && session) {
            navigate('/onboarding/wizard', { replace: true });
        }
    }, [user, session, navigate]);

    useEffect(() => {
        return () => {
            clearError();
        };
    }, [clearError]);

    useEffect(() => {
        if (usernameValue && usernameValue.length >= 3) {
            checkUsername(usernameValue);
            setUsernameTouched(true);
        }
    }, [usernameValue, checkUsername]);

    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const onSubmit = async (data: RegisterFormData) => {
        try {
            await signUp(data.email, data.password, data.username, data.name);

            const currentSession = await import('@/integrations/supabase/client').then(
                m => m.supabase.auth.getSession()
            );

            if (!currentSession.data.session) {
                setEmailVerificationSent(true);
                setRegisteredEmail(data.email);
                setResendCooldown(60);
            }
        } catch (error) {
            logger.error("Registration failed", error as Error);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();

        if (otpCode.length !== 6) {
            setOtpError("Please enter the 6-digit code");
            return;
        }

        setIsVerifyingOtp(true);
        setOtpError("");

        try {
            const { error } = await supabase.auth.verifyOtp({
                email: registeredEmail,
                token: otpCode,
                type: "signup",
            });

            if (error) {
                setOtpError(error.message || "Verification failed. Please check your code.");
                setIsVerifyingOtp(false);
                return;
            }

            toast({
                title: "Email Verified!",
                description: "Welcome to AgentBio. Setting up your profile...",
            });
        } catch (error: any) {
            setOtpError("Something went wrong. Please try again.");
            setIsVerifyingOtp(false);
        }
    };

    const handleResendCode = async () => {
        if (resendCooldown > 0) return;

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: registeredEmail,
            });

            if (error) {
                toast({
                    title: "Failed to Resend",
                    description: error.message,
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Code Resent",
                description: "Check your email for a new verification code.",
            });

            setResendCooldown(60);
            setOtpCode("");
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to resend code. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleBackToSignup = () => {
        setEmailVerificationSent(false);
        setRegisteredEmail("");
        setOtpCode("");
        setOtpError("");
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
        } catch (error) {
            logger.error("Google sign-in failed", error as Error);
        }
    };

    const handleAppleSignIn = async () => {
        try {
            await signInWithApple();
        } catch (error) {
            logger.error("Apple sign-in failed", error as Error);
        }
    };

    return (
        <main id="main-content" tabIndex={-1} className="min-h-screen flex">
            {/* Left Panel - Branding & Features */}
            <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
                {/* Animated gradient orbs */}
                <div className="absolute top-1/3 -left-16 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/3 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-2/3 left-1/4 w-56 h-56 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

                {/* Grid pattern */}
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

                    {/* Feature highlights */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
                                Start closing more deals{' '}
                                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                                    today
                                </span>
                            </h1>
                            <p className="mt-3 text-base text-blue-100/60 max-w-sm leading-relaxed">
                                Join thousands of top-performing agents who use AI-powered intelligence to dominate their market.
                            </p>
                        </div>

                        {/* Feature list */}
                        <div className="space-y-4">
                            {[
                                { icon: Zap, title: 'AI Lead Scoring', desc: 'ML-scored leads convert 2x better' },
                                { icon: BarChart3, title: 'Smart Analytics', desc: 'Track engagement patterns in real-time' },
                                { icon: Shield, title: 'Enterprise Security', desc: 'SOC 2 compliant with encrypted data' },
                            ].map((feature) => (
                                <div key={feature.title} className="flex items-start gap-4 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400/20 to-blue-600/20 flex items-center justify-center flex-shrink-0">
                                        <feature.icon className="h-5 w-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-semibold text-white">{feature.title}</div>
                                        <div className="text-xs text-blue-200/50 mt-0.5">{feature.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Social proof */}
                        <div className="flex items-center gap-4">
                            <div className="flex -space-x-2">
                                {['JD', 'MK', 'AL', 'RS'].map((initials, i) => (
                                    <div
                                        key={initials}
                                        className="w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white"
                                        style={{
                                            background: ['#3B82F6', '#8B5CF6', '#06B6D4', '#10B981'][i],
                                        }}
                                    >
                                        {initials}
                                    </div>
                                ))}
                            </div>
                            <div className="text-xs text-blue-200/50">
                                <span className="text-white font-semibold">2,500+</span> agents already growing
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

            {/* Right Panel - Register Form */}
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
                        <Link to="/auth/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                            Log In
                        </Link>
                    </div>
                </header>

                <div className="flex-1 flex items-center justify-center px-6 py-8">
                    <div className="w-full max-w-[440px]">

                        {/* OTP Verification Screen */}
                        {emailVerificationSent ? (
                            <div>
                                <button
                                    onClick={handleBackToSignup}
                                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors text-sm"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Back to Sign Up
                                </button>

                                <div className="text-center mb-8">
                                    <div className="mx-auto w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                                        <Mail className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        Check your email
                                    </h2>
                                    <p className="text-sm text-gray-500 mb-1">
                                        We've sent a 6-digit verification code to
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900 break-all">
                                        {registeredEmail}
                                    </p>
                                </div>

                                <form onSubmit={handleVerifyOtp} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                                            Enter Verification Code
                                        </label>
                                        <OTPInput
                                            length={6}
                                            value={otpCode}
                                            onChange={setOtpCode}
                                            disabled={isVerifyingOtp}
                                            error={!!otpError}
                                            autoFocus
                                        />
                                        {otpError && (
                                            <p className="mt-3 text-xs text-red-600 text-center">{otpError}</p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isVerifyingOtp || otpCode.length !== 6}
                                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                                    >
                                        {isVerifyingOtp ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Verifying...
                                            </>
                                        ) : (
                                            "Verify Email"
                                        )}
                                    </button>

                                    <div className="text-center">
                                        <p className="text-xs text-gray-500 mb-1.5">
                                            Didn't receive the code?
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleResendCode}
                                            disabled={resendCooldown > 0}
                                            className="text-xs text-blue-600 hover:text-blue-700 font-semibold disabled:text-gray-400 disabled:cursor-not-allowed"
                                        >
                                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                                        </button>
                                    </div>
                                </form>

                                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                    <p className="text-xs text-blue-700">
                                        <strong>Tip:</strong> Check your spam folder if you don't see the email. The code expires in 1 hour.
                                    </p>
                                </div>
                            </div>
                        ) : (
                        <>
                            {/* Header */}
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Create your account
                                </h2>
                                <p className="mt-2 text-sm text-gray-500">
                                    Get started with your AI-powered real estate profile
                                </p>
                            </div>

                            {/* OAuth Buttons */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    disabled={isLoading}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Google
                                </button>

                                <button
                                    type="button"
                                    onClick={handleAppleSignIn}
                                    disabled={isLoading}
                                    className="flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                    </svg>
                                    Apple
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

                            {/* Error */}
                            {error && (
                                <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-red-800">Registration Failed</p>
                                        <p className="text-xs text-red-600 mt-1">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Registration Form */}
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                {/* Username */}
                                <div>
                                    <label htmlFor="register-username" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Username
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            {...register("username")}
                                            id="register-username"
                                            type="text"
                                            placeholder="johndoe"
                                            autoComplete="username"
                                            className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                                                errors.username || (usernameTouched && usernameError)
                                                    ? "border-red-300"
                                                    : usernameTouched && isAvailable
                                                    ? "border-green-300"
                                                    : "border-gray-200"
                                            }`}
                                        />
                                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                            {isChecking && <UsernameLoader className="h-4 w-4 animate-spin text-blue-500" />}
                                            {!isChecking && usernameTouched && isAvailable && (
                                                <Check className="h-4 w-4 text-green-500" />
                                            )}
                                            {!isChecking && usernameTouched && (usernameError || isAvailable === false) && (
                                                <X className="h-4 w-4 text-red-500" />
                                            )}
                                        </div>
                                    </div>
                                    {errors.username && (
                                        <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>
                                    )}
                                    {!errors.username && usernameTouched && usernameError && (
                                        <p className="mt-1 text-xs text-red-600">{usernameError}</p>
                                    )}
                                    {!errors.username && usernameTouched && isAvailable && !isChecking && (
                                        <p className="mt-1 text-xs text-green-600">Username is available</p>
                                    )}
                                    <p className="mt-1 text-[11px] text-gray-400">
                                        agentbio.net/{usernameValue || 'username'}
                                    </p>
                                </div>

                                {/* Full Name */}
                                <div>
                                    <label htmlFor="register-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Full Name
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            {...register("name")}
                                            id="register-name"
                                            type="text"
                                            placeholder="John Doe"
                                            autoComplete="name"
                                            className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                                                errors.name ? "border-red-300" : "border-gray-200"
                                            }`}
                                        />
                                    </div>
                                    {errors.name && (
                                        <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            {...register("email")}
                                            id="register-email"
                                            type="email"
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                            className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                                                errors.email ? "border-red-300" : "border-gray-200"
                                            }`}
                                        />
                                    </div>
                                    {errors.email && (
                                        <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            {...register("password", {
                                                onChange: (e) => setPasswordValue(e.target.value)
                                            })}
                                            id="register-password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Create a strong password"
                                            autoComplete="new-password"
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
                                        <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                                    )}
                                    <PasswordStrengthIndicator password={passwordValue} />
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label htmlFor="register-confirm-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            {...register("confirmPassword")}
                                            id="register-confirm-password"
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Confirm your password"
                                            autoComplete="new-password"
                                            className={`w-full pl-10 pr-12 py-3 border-2 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                                                errors.confirmPassword ? "border-red-300" : "border-gray-200"
                                            }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
                                    )}
                                </div>

                                {/* Terms Agreement */}
                                <div className="border-2 border-gray-200 rounded-xl p-4 bg-gray-50/50">
                                    <label className="flex items-start cursor-pointer group">
                                        <input
                                            {...register("agreedToTerms")}
                                            type="checkbox"
                                            className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                                        />
                                        <span className="ml-2.5 text-xs text-gray-600 leading-relaxed">
                                            I agree to the{" "}
                                            <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium underline">
                                                Terms of Service
                                            </a>
                                            ,{" "}
                                            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium underline">
                                                Privacy Policy
                                            </a>
                                            , and{" "}
                                            <a href="/legal/acceptable-use" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 font-medium underline">
                                                Acceptable Use Policy
                                            </a>
                                            . I will comply with MLS photo restrictions and Fair Housing laws.
                                        </span>
                                    </label>
                                    {errors.agreedToTerms && (
                                        <p className="mt-2 text-xs text-red-600" role="alert">
                                            {errors.agreedToTerms.message}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Creating account...
                                        </>
                                    ) : (
                                        "Create Account"
                                    )}
                                </button>
                            </form>

                            {/* Login link */}
                            <p className="mt-6 text-center text-sm text-gray-500">
                                Already have an account?{" "}
                                <Link to="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                                    Sign in
                                </Link>
                            </p>
                        </>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
