import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/app/AppLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy load pages for code splitting
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AuthEntryPage = lazy(() => import("./pages/AuthEntryPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const AuthCallbackPage = lazy(() => import("./pages/AuthCallbackPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const HabitsPage = lazy(() => import("./pages/HabitsPage"));
const GoalsPage = lazy(() => import("./pages/GoalsPage"));
const ConstellationPage = lazy(() => import("./pages/ConstellationPage"));
const AnalyticsPage = lazy(() => import("./pages/AnalyticsPage"));
const ChatsPage = lazy(() => import("./pages/ChatsPage"));
const FriendsPage = lazy(() => import("./pages/FriendsPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AIToolsPage = lazy(() => import("./pages/AIToolsPage"));
const SubscriptionPage = lazy(() => import("./pages/SubscriptionPage"));
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const AIMentorPage = lazy(() => import("./pages/AIMentorPage"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient();

// Create router with future flags to silence warnings
const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <Suspense fallback={<PageLoader />}><LandingPage /></Suspense>,
    },
    {
      path: "/auth",
      element: <Suspense fallback={<PageLoader />}><AuthEntryPage /></Suspense>,
    },
    {
      path: "/login",
      element: <Suspense fallback={<PageLoader />}><LoginPage /></Suspense>,
    },
    {
      path: "/signup",
      element: <Suspense fallback={<PageLoader />}><SignupPage /></Suspense>,
    },
    {
      path: "/forgot-password",
      element: <Suspense fallback={<PageLoader />}><ForgotPasswordPage /></Suspense>,
    },
    {
      path: "/reset-password",
      element: <Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense>,
    },
    {
      path: "/auth/callback",
      element: <Suspense fallback={<PageLoader />}><AuthCallbackPage /></Suspense>,
    },
    {
      path: "/privacy",
      element: <Suspense fallback={<PageLoader />}><PrivacyPolicyPage /></Suspense>,
    },
    {
      path: "/terms",
      element: <Suspense fallback={<PageLoader />}><TermsOfServicePage /></Suspense>,
    },
    {
      path: "/app",
      element: (
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Suspense fallback={<PageLoader />}><DashboardPage /></Suspense> },
        { path: "habits", element: <Suspense fallback={<PageLoader />}><HabitsPage /></Suspense> },
        { path: "goals", element: <Suspense fallback={<PageLoader />}><GoalsPage /></Suspense> },
        { path: "constellation", element: <Suspense fallback={<PageLoader />}><ConstellationPage /></Suspense> },
        { path: "analytics", element: <Suspense fallback={<PageLoader />}><AnalyticsPage /></Suspense> },
        { path: "chats", element: <Suspense fallback={<PageLoader />}><ChatsPage /></Suspense> },
        { path: "friends", element: <Suspense fallback={<PageLoader />}><FriendsPage /></Suspense> },
        { path: "settings", element: <Suspense fallback={<PageLoader />}><SettingsPage /></Suspense> },
        { path: "profile", element: <Suspense fallback={<PageLoader />}><ProfilePage /></Suspense> },
        { path: "achievements", element: <Suspense fallback={<PageLoader />}><AchievementsPage /></Suspense> },
        { path: "ai-tools", element: <Suspense fallback={<PageLoader />}><AIToolsPage /></Suspense> },
        { path: "ai-mentor", element: <Suspense fallback={<PageLoader />}><AIMentorPage /></Suspense> },
        { path: "library", element: <Suspense fallback={<PageLoader />}><LibraryPage /></Suspense> },
        { path: "subscription", element: <Suspense fallback={<PageLoader />}><SubscriptionPage /></Suspense> },
      ],
    },
    {
      path: "*",
      element: <Suspense fallback={<PageLoader />}><NotFound /></Suspense>,
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  }
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RouterProvider router={router} />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
