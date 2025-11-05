import { Link, useNavigate } from "react-router-dom";
import { Home, Mail, Lock, User, AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect } from "react";

const registerSchema = z
    .object({
        username: z.string().min(3, "Username must be at least 3 characters").regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Please enter a valid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string(),
        terms: z.boolean().refine((val) => val === true, {
            message: "You must agree to the Terms of Service, Privacy Policy, DMCA Policy, and Acceptable Use Policy",
        }),
        photoOwnership: z.boolean().refine((val) => val === true, {
            message: "You must certify that you own or have authorization to upload photos",
        }),
        mlsAcknowledgment: z.boolean().refine((val) => val === true, {
            message: "You must acknowledge MLS photo restrictions",
        }),
        fairHousing: z.boolean().refine((val) => val === true, {
            message: "You must acknowledge Fair Housing compliance obligations",
        }),
        fullResponsibility: z.boolean().refine((val) => val === true, {
            message: "You must accept full legal responsibility for your content",
        }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
    const navigate = useNavigate();
    const { signUp, isLoading, error, clearError, user } = useAuthStore();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    useEffect(() => {
        if (user) {
            // Redirect to last visited route or default to dashboard
            const lastRoute = localStorage.getItem('lastVisitedRoute');
            const redirectTo = lastRoute && lastRoute !== '/auth/login' && lastRoute !== '/auth/register'
                ? lastRoute
                : '/dashboard';
            navigate(redirectTo, { replace: true });
        }
    }, [user, navigate]);

    useEffect(() => {
        return () => {
            clearError();
        };
    }, [clearError]);

    const onSubmit = async (data: RegisterFormData) => {
        try {
            await signUp(data.email, data.password, data.username, data.name);
        } catch (error) {
            // Error is handled by the store
            console.error("Registration failed:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
            {/* Header Navigation */}
            <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                        <Home className="h-6 w-6 text-blue-600" />
                        AgentBio.net
                    </Link>
                    <nav className="flex items-center gap-4 text-sm">
                        <Link to="/blog" className="text-gray-600 hover:text-gray-900">Blog</Link>
                        <Link to="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
                        <Link to="/auth/login" className="text-blue-600 hover:text-blue-700 font-semibold">Log In</Link>
                    </nav>
                </div>
            </header>

            <div className="flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Create Your Account
                        </h1>
                        <p className="text-gray-600">
                            Start building your real estate profile
                        </p>
                    </div>

                <div className="bg-white rounded-lg shadow-lg p-8">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-800">
                                    Registration Failed
                                </p>
                                <p className="text-sm text-red-600 mt-1">
                                    {error}
                                </p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    {...register("username")}
                                    type="text"
                                    placeholder="johndoe"
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        errors.username
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                />
                            </div>
                            {errors.username && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.username.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    {...register("name")}
                                    type="text"
                                    placeholder="John Doe"
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        errors.name
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                />
                            </div>
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    {...register("email")}
                                    type="email"
                                    placeholder="you@example.com"
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        errors.email
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                />
                            </div>
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.email.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    {...register("password")}
                                    type="password"
                                    placeholder="••••••••"
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        errors.password
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                />
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.password.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    {...register("confirmPassword")}
                                    type="password"
                                    placeholder="••••••••"
                                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                        errors.confirmPassword
                                            ? "border-red-300"
                                            : "border-gray-300"
                                    }`}
                                />
                            </div>
                            {errors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        {/* Simplified Legal Agreements Section */}
                        <div className="space-y-4 border border-gray-300 rounded-lg p-4 bg-gray-50">
                            <h3 className="font-semibold text-sm text-gray-900">Legal Agreements</h3>

                            {/* Consolidated Agreement */}
                            <div>
                                <label className="flex items-start cursor-pointer group">
                                    <input
                                        {...register("terms")}
                                        type="checkbox"
                                        className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        I agree to the{" "}
                                        <a
                                            href="/terms"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-700 font-medium underline"
                                        >
                                            Terms
                                        </a>,{" "}
                                        <a
                                            href="/privacy"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-700 font-medium underline"
                                        >
                                            Privacy Policy
                                        </a>,{" "}
                                        <a
                                            href="/dmca"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-700 font-medium underline"
                                        >
                                            DMCA
                                        </a>, and{" "}
                                        <a
                                            href="/acceptable-use"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-700 font-medium underline"
                                        >
                                            Acceptable Use Policy
                                        </a>
                                    </span>
                                </label>
                                {errors.terms && (
                                    <p className="mt-1 text-sm text-red-600" role="alert">
                                        {errors.terms.message}
                                    </p>
                                )}
                            </div>

                            {/* Photo & Content Responsibility - Consolidated */}
                            <div>
                                <label className="flex items-start cursor-pointer">
                                    <input
                                        {...register("photoOwnership")}
                                        type="checkbox"
                                        className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        I certify I own or have proper authorization for all content I upload, and I accept full legal responsibility for my listings and photos
                                    </span>
                                </label>
                                {errors.photoOwnership && (
                                    <p className="mt-1 text-sm text-red-600" role="alert">
                                        {errors.photoOwnership.message}
                                    </p>
                                )}
                            </div>

                            {/* MLS & Fair Housing - Consolidated */}
                            <div>
                                <label className="flex items-start cursor-pointer">
                                    <input
                                        {...register("mlsAcknowledgment")}
                                        type="checkbox"
                                        className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                                    />
                                    <span className="ml-2 text-sm text-gray-700">
                                        I understand MLS photo restrictions and will comply with Fair Housing laws
                                    </span>
                                </label>
                                {errors.mlsAcknowledgment && (
                                    <p className="mt-1 text-sm text-red-600" role="alert">
                                        {errors.mlsAcknowledgment.message}
                                    </p>
                                )}
                            </div>

                            {/* Combined Final Acknowledgment */}
                            <div className="hidden">
                                <input
                                    {...register("fairHousing")}
                                    type="checkbox"
                                    checked
                                    readOnly
                                />
                                <input
                                    {...register("fullResponsibility")}
                                    type="checkbox"
                                    checked
                                    readOnly
                                />
                            </div>

                            <p className="text-xs text-gray-500 italic mt-2">
                                By creating an account, you agree to use AgentBio.net responsibly and in compliance with all applicable laws.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Already have an account?{" "}
                            <Link
                                to="/auth/login"
                                className="text-blue-600 hover:text-blue-700 font-semibold"
                            >
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}
