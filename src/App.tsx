import { useEffect, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuthStore } from "./stores/useAuthStore";
import { errorHandler } from "./lib/errorHandler";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { offlineStorage } from "./lib/offline-storage";
import { pushNotifications } from "./lib/push-notifications";
import { OfflineIndicator } from "./components/mobile/OfflineIndicator";
import { LoadingSpinner } from "./components/LoadingSpinner";
import LazyLoadErrorBoundary from "./components/LazyLoadErrorBoundary";

// Public pages (eager load for better UX on landing)
import Landing from "./pages/public/Landing";
import ProfilePage from "./pages/public/FullProfilePage";
import NotFound from "./pages/public/NotFound";

// Lazy load public review page
const SubmitReview = lazy(() => import("./pages/public/SubmitReview"));

// Auth pages (eager load for better UX)
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Lazy load auth recovery pages
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

// Lazy load onboarding
const OnboardingWizardPage = lazy(() => import("./pages/onboarding/OnboardingWizardPage"));

// Lazy load legal pages
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const DMCAPolicy = lazy(() => import("./pages/legal/DMCAPolicy"));
const AcceptableUse = lazy(() => import("./pages/legal/AcceptableUse"));

// Lazy load marketing pages
const Pricing = lazy(() => import("./pages/Pricing"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogCategory = lazy(() => import("./pages/BlogCategory"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const PublicPage = lazy(() => import("./pages/PublicPage"));

// Lazy load dashboard pages (code splitting for better performance)
const DashboardLayout = lazy(() => import("./components/layout/DashboardLayout"));
const Overview = lazy(() => import("./pages/dashboard/Overview"));
const Listings = lazy(() => import("./pages/dashboard/Listings"));
const Leads = lazy(() => import("./pages/dashboard/Leads"));
const Profile = lazy(() => import("./pages/dashboard/Profile"));
const Theme = lazy(() => import("./pages/dashboard/Theme"));
const Links = lazy(() => import("./pages/dashboard/Links"));
const Testimonials = lazy(() => import("./pages/dashboard/Testimonials"));
const Analytics = lazy(() => import("./pages/dashboard/Analytics"));
const Settings = lazy(() => import("./pages/dashboard/Settings"));
const QuickActionsDashboard = lazy(() => import("./pages/QuickActionsDashboard"));
const LeadManagementDashboard = lazy(() => import("./pages/LeadManagementDashboard"));
const AnalyticsDashboard = lazy(() => import("./pages/AnalyticsDashboard"));
const PageBuilderEditor = lazy(() => import("./pages/PageBuilder"));

// Lazy load admin pages (most users won't need these)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const SEODashboard = lazy(() => import("./pages/SEODashboard"));

function App() {
    const { initialize, user } = useAuthStore();

    // Initialize auth and PWA on mount
    useEffect(() => {
        initialize();

        const initPWA = async () => {
            await offlineStorage.init();
            await pushNotifications.init();
        };

        initPWA();
    }, [initialize]);

    // Handle push notification registration when user logs in
    useEffect(() => {
        const registerPushNotifications = async () => {
            if (user) {
                const hasPermission = await pushNotifications.requestPermission();
                if (hasPermission) {
                    await pushNotifications.registerToken(user.id);
                }
            }
        };

        registerPushNotifications();
    }, [user]);


    // Set user context for error monitoring
    useEffect(() => {
        if (user) {
            errorHandler.setUser(user.id, user.email);
        } else {
            errorHandler.clearUser();
        }
    }, [user]);

    return (
        <>
            {/* Offline Indicator */}
            <OfflineIndicator />

            <LazyLoadErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/dmca" element={<DMCAPolicy />} />
                    <Route path="/acceptable-use" element={<AcceptableUse />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/category/:category" element={<BlogCategory />} />
                    <Route path="/blog/:slug" element={<BlogArticle />} />
                    <Route path="/p/:slug" element={<PublicPage />} />
                    <Route path="/:username/review" element={<SubmitReview />} />
                    <Route path="/:slug" element={<ProfilePage />} />

                    {/* Auth routes */}
                    <Route path="/auth/login" element={<Login />} />
                    <Route path="/auth/register" element={<Register />} />
                    <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                    <Route path="/auth/reset-password" element={<ResetPassword />} />

                    {/* Onboarding (protected) */}
                    <Route
                        path="/onboarding/wizard"
                        element={
                            <ProtectedRoute>
                                <OnboardingWizardPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Dashboard routes (protected) */}
                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Overview />} />
                        <Route path="listings" element={<Listings />} />
                        <Route
                            path="quick-actions"
                            element={<QuickActionsDashboard />}
                        />
                        <Route path="leads" element={<Leads />} />
                        <Route
                            path="lead-management"
                            element={<LeadManagementDashboard />}
                        />
                        <Route
                            path="analytics-advanced"
                            element={<AnalyticsDashboard />}
                        />
                        <Route
                            path="page-builder"
                            element={<PageBuilderEditor />}
                        />
                        <Route path="profile" element={<Profile />} />
                        <Route path="theme" element={<Theme />} />
                        <Route path="links" element={<Links />} />
                        <Route path="testimonials" element={<Testimonials />} />
                        <Route path="analytics" element={<Analytics />} />
                        <Route path="settings" element={<Settings />} />
                    </Route>

                    {/* Admin routes */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute>
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/seo"
                        element={
                            <ProtectedRoute>
                                <SEODashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* 404 */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
            </LazyLoadErrorBoundary>

            <Toaster position="top-right" richColors />
        </>
    );
}

export default App;
