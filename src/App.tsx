import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuthStore } from "./stores/useAuthStore";
import { trackPageView } from "./lib/analytics";
import { errorHandler } from "./lib/errorHandler";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { pwaManager } from "./lib/pwa";
import { offlineStorage } from "./lib/offline-storage";
import { pushNotifications } from "./lib/push-notifications";

// Public pages
import Landing from "./pages/public/Landing";
import ProfilePage from "./pages/public/FullProfilePage";
import NotFound from "./pages/public/NotFound";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import Pricing from "./pages/Pricing";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Dashboard pages
import DashboardLayout from "./components/layout/DashboardLayout";
import Overview from "./pages/dashboard/Overview";
import Listings from "./pages/dashboard/Listings";
import Leads from "./pages/dashboard/Leads";
import Profile from "./pages/dashboard/Profile";
import Theme from "./pages/dashboard/Theme";
import Links from "./pages/dashboard/Links";
import Testimonials from "./pages/dashboard/Testimonials";
import Analytics from "./pages/dashboard/Analytics";
import Settings from "./pages/dashboard/Settings";
import QuickActionsDashboard from "./pages/QuickActionsDashboard";
import LeadManagementDashboard from "./pages/LeadManagementDashboard";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import PageBuilderEditor from "./pages/PageBuilder";
import PublicPage from "./pages/PublicPage";

function App() {
    const { initialize, user } = useAuthStore();
    const location = useLocation();

    useEffect(() => {
        initialize();

        // Initialize PWA features
        const initPWA = async () => {
            // Initialize offline storage
            await offlineStorage.init();

            // Initialize push notifications
            const notificationsInitialized = await pushNotifications.init();

            if (notificationsInitialized && user) {
                // Request notification permission if logged in
                const hasPermission =
                    await pushNotifications.requestPermission();
                if (hasPermission) {
                    await pushNotifications.registerToken(user.id);
                }
            }
        };

        initPWA();
    }, [initialize, user]);

    // Track page views on route change
    useEffect(() => {
        trackPageView(location.pathname);
    }, [location]);

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
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/p/:slug" element={<PublicPage />} />
                <Route path="/:slug" element={<ProfilePage />} />

                {/* Auth routes */}
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />

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

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
            </Routes>

            <Toaster position="top-right" richColors />
            <PWAInstallPrompt />
        </>
    );
}

export default App;
