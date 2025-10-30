import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuthStore } from "./stores/useAuthStore";
import ProtectedRoute from "./components/auth/ProtectedRoute";

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

function App() {
    const { initialize } = useAuthStore();

    useEffect(() => {
        initialize();
    }, [initialize]);

    return (
        <>
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<Landing />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
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
                    <Route path="leads" element={<Leads />} />
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
        </>
    );
}

export default App;
