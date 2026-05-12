import { useAuth, AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ApplyLeave from "./pages/ApplyLeave";
import Leaves from "./pages/Leaves";
import HolidayCalendar from "./pages/HolidayCalendar";
import LeaveApprovals from "./pages/LeaveApprovals";
import HrApprovals from "./pages/HrApprovals";
import AdminPanel from "./pages/AdminPanel";
import ChangePassword from "./pages/ChangePassword";
import InviteSetup from "./pages/InviteSetup";
import ForgotPassword from "./pages/ForgotPassword";
import { useState, useEffect, useRef } from "react";


type Page =
  | "dashboard" | "apply-leave" | "leaves"
  | "holiday-calendar" | "leave-approvals" | "hr-approvals"
  | "admin-panel" | "change-password";

// Pages that deep-links from emails can target
const VALID_DEEP_LINK_PAGES: Record<string, string> = {
  "leave-approvals": "manager",
  "hr-approvals": "hr",
  "leaves": "", // any role can view their own leaves
};

function AppInner() {
  const { user, loading, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const deepLinkHandled = useRef(false);

  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle deep-link query params: ?page=leave-approvals&for=manager@email.com
  useEffect(() => {
    if (loading) return;
    if (deepLinkHandled.current) return;

    const params = new URLSearchParams(window.location.search);
    const targetPage = params.get("page");
    const intendedFor = params.get("for"); // email address the link was sent to

    if (!targetPage || !(targetPage in VALID_DEEP_LINK_PAGES)) return;

    // Strip the query params from the URL so they don't persist on refresh
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);

    deepLinkHandled.current = true;

    const proceed = () => {
      setCurrentPage(targetPage as Page);
    };

    if (user) {
      // If a DIFFERENT user is logged in, sign them out so the link recipient can log in
      if (intendedFor && user.email.toLowerCase() !== intendedFor.toLowerCase()) {
        logout().then(() => {
          // After logout the app re-renders to Login; store the intended page in sessionStorage
          sessionStorage.setItem("deepLinkPage", targetPage);
        });
      } else {
        proceed();
      }
    } else {
      // Not logged in yet – remember the page so we can navigate after login
      sessionStorage.setItem("deepLinkPage", targetPage);
    }
  }, [loading, user, logout]);

  // After successful login, navigate to the stored deep-link page if present
  useEffect(() => {
    if (!user) return;
    const saved = sessionStorage.getItem("deepLinkPage");
    if (!saved) return;
    sessionStorage.removeItem("deepLinkPage");
    // Only navigate if the user's role is allowed
    const requiredRole = VALID_DEEP_LINK_PAGES[saved];
    if (!requiredRole || user.role === requiredRole) {
      setCurrentPage(saved as Page);
    }
  }, [user]);

  if (currentPath.startsWith('/invite/')) {
    return <InviteSetup />;
  }

  if (currentPath === '/forgot-password') {
    return <ForgotPassword />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app">
        <p className="text-muted text-sm font-medium">Loading...</p>
      </div>
    );
  }
  
  if (!user) return <Login />;

  const activePage = currentPage === "dashboard" && user.role === "admin" ? "admin-panel" : currentPage;

  const handleNavigate = (page: string) => {
    // Guard manager-only pages
    if (page === "leave-approvals" && user.role !== "manager") return;
    // Guard HR-only pages
    if (page === "hr-approvals" && user.role !== "hr") return;
    // Guard admin-only pages
    if (page === "admin-panel" && user.role !== "admin") return;
    // Guard employee-only pages from admin
    if (user.role === "admin" && page !== "admin-panel" && page !== "change-password") return;
    setCurrentPage(page as Page);
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":             return <Dashboard />;
      case "apply-leave":           return (user.role === "employee" || user.role === "manager" || user.role === "hr") ? <ApplyLeave /> : <Dashboard />;
      case "leaves":                return <Leaves />;
      case "holiday-calendar":      return <HolidayCalendar />;
      case "leave-approvals":       return user.role === "manager" ? <LeaveApprovals /> : <Dashboard />;
      case "hr-approvals":          return user.role === "hr" ? <HrApprovals /> : <Dashboard />;
      case "admin-panel":           return user.role === "admin" ? <AdminPanel /> : <Dashboard />;
      case "change-password":       return <ChangePassword />;
      default:                      return <Dashboard />;
    }
  };

  return (
    <Layout currentPage={activePage} onNavigate={handleNavigate}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}