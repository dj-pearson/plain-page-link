import { useEffect, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuthStore } from "./stores/useAuthStore";
import { errorHandler } from "./lib/errorHandler";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { offlineStorage } from "./lib/offline-storage";
import { cleanupServiceWorkers } from "./lib/sw-cleanup";
import { OfflineIndicator } from "./components/mobile/OfflineIndicator";
import { FullPageLoader } from "./components/LoadingSpinner";
import LazyLoadErrorBoundary from "./components/LazyLoadErrorBoundary";
import { SkipNavLink } from "./components/ui/skip-nav";
import { AnnouncerProvider } from "./components/ui/live-region";
import { RouteAnnouncer } from "./components/ui/route-announcer";
import { AccessibilityWidget } from "./components/ui/accessibility-widget";

// Public pages (eager load for better UX on landing)
import Landing from "./pages/public/Landing";
import ProfilePage from "./pages/public/FullProfilePage";
import NotFound from "./pages/public/NotFound";

// Lazy load public review page
const SubmitReview = lazy(() => import("./pages/public/SubmitReview"));

// Auth pages (eager load for better UX)
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Lazy load auth recovery & callback pages
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const AuthCallback = lazy(() => import("./pages/auth/AuthCallback"));

// Lazy load onboarding
const OnboardingWizardPage = lazy(() => import("./pages/onboarding/OnboardingWizardPage"));

// Lazy load legal pages
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const DMCAPolicy = lazy(() => import("./pages/legal/DMCAPolicy"));
const AcceptableUse = lazy(() => import("./pages/legal/AcceptableUse"));
const AccessibilityStatement = lazy(() => import("./pages/legal/AccessibilityStatement"));

// Lazy load marketing pages
const Pricing = lazy(() => import("./pages/Pricing"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogCategory = lazy(() => import("./pages/BlogCategory"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const PublicPage = lazy(() => import("./pages/PublicPage"));

// Lazy load landing pages
const ForRealEstateAgents = lazy(() => import("./pages/landing/ForRealEstateAgents"));
const InstagramBioForRealtors = lazy(() => import("./pages/landing/InstagramBioForRealtors"));
const VsLinktree = lazy(() => import("./pages/landing/VsLinktree"));
const VsBeacons = lazy(() => import("./pages/landing/VsBeacons"));
const VsLater = lazy(() => import("./pages/landing/VsLater"));

// Lazy load location pages - Dynamic handler for all 22+ cities (programmatic SEO)
const DynamicLocationPage = lazy(() => import("./pages/landing/locations/DynamicLocationPage"));

// Lazy load feature pages
const PropertyListings = lazy(() => import("./pages/features/PropertyListings"));
const LeadCapture = lazy(() => import("./pages/features/LeadCapture"));
const CalendarBooking = lazy(() => import("./pages/features/CalendarBooking"));
const TestimonialsFeature = lazy(() => import("./pages/features/Testimonials"));
const AnalyticsFeature = lazy(() => import("./pages/features/Analytics"));

// Lazy load tools
const InstagramBioAnalyzer = lazy(() => import("./pages/tools/InstagramBioAnalyzer"));
const ListingDescriptionGenerator = lazy(() => import("./pages/tools/ListingDescriptionGenerator"));

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

// Lazy load workflow pages
const WorkflowsListPage = lazy(() => import("./pages/dashboard/workflows/WorkflowsListPage"));
const WorkflowBuilderPage = lazy(() => import("./pages/dashboard/workflows/WorkflowBuilderPage"));

// Lazy load SSO callback
const SSOCallback = lazy(() => import("./components/auth/sso/SSOCallback"));

// Lazy load admin pages (most users won't need these)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard").then(m => ({ default: m.AdminDashboard })));
const SEODashboard = lazy(() => import("./pages/SEODashboard"));

function App() {
    const { initialize, user } = useAuthStore();

    // Initialize auth and offline storage on mount
    useEffect(() => {
        // Clean up any interfering service workers first
        cleanupServiceWorkers();
        
        initialize();

        // Initialize offline storage (lightweight)
        offlineStorage.init();
    }, [initialize]);

    // Handle push notification registration when user logs in
    // Firebase is dynamically imported to avoid loading ~200KB on initial page load
    useEffect(() => {
        const initAndRegisterPushNotifications = async () => {
            if (user) {
                // Dynamically import push notifications only when user is logged in
                const { pushNotifications } = await import("./lib/push-notifications");
                await pushNotifications.init();
                const hasPermission = await pushNotifications.requestPermission();
                if (hasPermission) {
                    await pushNotifications.registerToken(user.id);
                }
            }
        };

        initAndRegisterPushNotifications();
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
        <AnnouncerProvider>
            {/* Skip Navigation for Keyboard Accessibility (WCAG 2.4.1) */}
            <SkipNavLink />

            {/* Route change announcements for screen readers (WCAG 2.4.2, 4.1.3) */}
            <RouteAnnouncer />

            {/* Offline Indicator */}
            <OfflineIndicator />

            <LazyLoadErrorBoundary>
                <Suspense fallback={<FullPageLoader text="Loading page..." />}>
                    <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<Landing />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/dmca" element={<DMCAPolicy />} />
                    <Route path="/acceptable-use" element={<AcceptableUse />} />
                    <Route path="/accessibility" element={<AccessibilityStatement />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/blog/category/:category" element={<BlogCategory />} />
                    <Route path="/blog/:slug" element={<BlogArticle />} />
                    <Route path="/p/:slug" element={<PublicPage />} />

                    {/* Landing pages */}
                    <Route path="/for-real-estate-agents" element={<ForRealEstateAgents />} />
                    <Route path="/instagram-bio-for-realtors" element={<InstagramBioForRealtors />} />
                    <Route path="/vs/linktree" element={<VsLinktree />} />
                    <Route path="/vs/beacons" element={<VsBeacons />} />
                    <Route path="/vs/later" element={<VsLater />} />

                    {/* Location pages - Dynamic route for all 22+ cities (programmatic SEO) */}
                    <Route path="/for/:slug" element={<DynamicLocationPage />} />

                    {/* Feature pages */}
                    <Route path="/features/property-listings" element={<PropertyListings />} />
                    <Route path="/features/lead-capture" element={<LeadCapture />} />
                    <Route path="/features/calendar-booking" element={<CalendarBooking />} />
                    <Route path="/features/testimonials" element={<TestimonialsFeature />} />
                    <Route path="/features/analytics" element={<AnalyticsFeature />} />

                    {/* Tools */}
                    <Route path="/tools/instagram-bio-analyzer" element={<InstagramBioAnalyzer />} />
                    <Route path="/tools/listing-description-generator" element={<ListingDescriptionGenerator />} />

                    {/* User profiles */}
                    <Route path="/:username/review" element={<SubmitReview />} />
                    <Route path="/:slug" element={<ProfilePage />} />

                    {/* Auth routes */}
                    <Route path="/auth/login" element={<Login />} />
                    <Route path="/auth/register" element={<Register />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                    <Route path="/auth/reset-password" element={<ResetPassword />} />
                    <Route path="/auth/sso/callback" element={<SSOCallback />} />

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
                        <Route path="workflows" element={<WorkflowsListPage />} />
                    </Route>

                    {/* Workflow Builder (full screen, outside dashboard layout) */}
                    <Route
                        path="/dashboard/workflows/:workflowId"
                        element={
                            <ProtectedRoute>
                                <WorkflowBuilderPage />
                            </ProtectedRoute>
                        }
                    />

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

            {/* Accessibility widget for user preferences (WCAG 1.4.4, 1.4.3, 2.3.3) */}
            <AccessibilityWidget />
        </AnnouncerProvider>
    );
}

export default App;
