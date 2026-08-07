import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense, useEffect } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import AuthenticatedRealtimeNotifications from "./components/AuthenticatedRealtimeNotifications";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

const NotFound = lazy(() => import("./pages/NotFound"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const RandomChat = lazy(() => import("./pages/RandomChat"));
const VideoChat = lazy(() => import("./pages/VideoChat"));
const VoiceChat = lazy(() => import("./pages/VoiceChat"));
const Friends = lazy(() => import("./pages/Friends"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Profile = lazy(() => import("./pages/Profile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Messages = lazy(() => import("./pages/Messages"));
const Signup = lazy(() => import("./pages/Signup"));
const PasswordReset = lazy(() => import("./pages/PasswordReset"));
const EmailVerification = lazy(() => import("./pages/EmailVerification"));
const GuestLogin = lazy(() => import("./pages/GuestLogin"));
const AnonymousDashboard = lazy(() => import("./pages/AnonymousDashboard"));
const AnonymousChat = lazy(() => import("./pages/AnonymousChat"));
const Login = lazy(() => import("./pages/Login"));
const Groups = lazy(() => import("./pages/Groups"));
const GroupRoom = lazy(() => import("./pages/GroupRoom"));
const GroupCall = lazy(() => import("./pages/GroupCall"));
const MiniApps = lazy(() => import("./pages/MiniApps"));

function RealtimeLayer() {
  const [location] = useLocation();
  const protectedPrefixes = [
    "/dashboard",
    "/groups",
    "/random-chat",
    "/video-chat",
    "/voice-chat",
    "/friends",
    "/notifications",
    "/profile",
    "/messages",
    "/admin-dashboard",
  ];
  if (!protectedPrefixes.some(prefix => location.startsWith(prefix))) {
    return null;
  }
  return <AuthenticatedRealtimeNotifications />;
}

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);

  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <RealtimeLayer />
      <Suspense
        fallback={
          <div className="flex min-h-[100dvh] items-center justify-center bg-slate-950 text-white">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-purple-300 border-t-transparent"
              role="status"
              aria-label="Loading page"
            />
          </div>
        }
      >
        <Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/login"} component={Login} />
          <Route path={"/signup"} component={Signup} />
          <Route path={"/guest-login"} component={GuestLogin} />
          <Route path={"/guest"} component={AnonymousDashboard} />
          <Route path={"/guest/dashboard"} component={AnonymousDashboard} />
          <Route path={"/guest/chat"} component={AnonymousChat} />
          <Route path={"/password-reset"} component={PasswordReset} />
          <Route path={"/verify-email"} component={EmailVerification} />
          <Route path={"/dashboard"} component={Dashboard} />
          <Route path={"/rooms"} component={Groups} />
          <Route path={"/people"} component={Friends} />
          <Route path={"/apps"} component={MiniApps} />
          <Route path={"/random-chat"} component={RandomChat} />
          <Route path={"/video-chat"} component={VideoChat} />
          <Route path={"/friends"} component={Friends} />
          <Route path={"/notifications"} component={Notifications} />
          <Route path={"/profile"} component={Profile} />
          <Route path={"/admin-dashboard"} component={AdminDashboard} />
          <Route path={"/messages"} component={Messages} />
          <Route path={"/voice-chat"} component={VoiceChat} />
          <Route
            path={"/groups/:groupId/calls/:callId"}
            component={GroupCall}
          />
          <Route path={"/groups/:groupId"} component={GroupRoom} />
          <Route path={"/groups"} component={Groups} />
          <Route path={"/404"} component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster position="top-right" richColors closeButton />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
