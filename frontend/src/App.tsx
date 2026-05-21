import { useAuth, AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ApplyLeave from "./pages/ApplyLeave";
import Leaves from "./pages/Leaves";
import HolidayCalendar from "./pages/HolidayCalendar";
import LeaveApprovals from "./pages/LeaveApprovals";
import HrApprovals from "./pages/HrApprovals";
import AdminApprovals from "./pages/AdminApprovals";
import AdminUsers       from "./pages/admin/AdminUsers";
import AdminInvitations from "./pages/admin/AdminInvitations";
import AdminHierarchy   from "./pages/admin/AdminHierarchy";
import AdminPolicy      from "./pages/admin/AdminPolicy";
import AdminHolidays    from "./pages/admin/AdminHolidays";
import ChangePassword from "./pages/ChangePassword";
import InviteSetup from "./pages/InviteSetup";
import ForgotPassword from "./pages/ForgotPassword";
import LeaveCalendar from "./pages/LeaveCalendar";
import ReduxAuthBridge from "./store/ReduxAuthBridge";
import { useState, useEffect, useRef } from "react";


type Page =
  | "dashboard" | "apply-leave" | "leaves"
  | "holiday-calendar" | "leave-approvals" | "hr-approvals" | "admin-approvals"
  | "change-password" | "leave-calendar"
  | "admin-users" | "admin-invitations" | "admin-hierarchy" | "admin-policy" | "admin-holidays";


const VALID_DEEP_LINK_PAGES: Record<string, string> = {
  "leave-approvals": "",
  "hr-approvals": "hr",
  "admin-approvals": "admin",
  "leaves": "", 
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

  useEffect(() => {
    if (loading) return;
    if (deepLinkHandled.current) return;

    const params = new URLSearchParams(window.location.search);
    const targetPage = params.get("page");
    const intendedFor = params.get("for"); 

    if (!targetPage || !(targetPage in VALID_DEEP_LINK_PAGES)) return;

    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);

    deepLinkHandled.current = true;

    const proceed = () => {
      setCurrentPage(targetPage as Page);
    };

    if (user) {
      if (intendedFor && user.email.toLowerCase() !== intendedFor.toLowerCase()) {
        logout().then(() => {
          sessionStorage.setItem("deepLinkPage", targetPage);
        });
      } else {
        proceed();
      }
    } else {
      sessionStorage.setItem("deepLinkPage", targetPage);
    }
  }, [loading, user, logout]);

  useEffect(() => {
    if (!user) return;
    const saved = sessionStorage.getItem("deepLinkPage");
    if (!saved) return;
    sessionStorage.removeItem("deepLinkPage");
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

  const activePage = currentPage === "dashboard" && user.role === "admin" ? "admin-users" : currentPage;

  const ADMIN_PAGES = new Set(["admin-users", "admin-invitations", "admin-hierarchy", "admin-policy", "admin-holidays"]);

  const handleNavigate = (page: string) => {
    if (page === "leave-approvals" && user.role !== "manager" && !user.has_subordinates) return;
    if (page === "hr-approvals" && user.role !== "hr") return;
    if (page === "admin-approvals" && user.role !== "admin") return;
    if (ADMIN_PAGES.has(page) && user.role !== "admin") return;
    if (user.role === "admin" && !ADMIN_PAGES.has(page) && page !== "change-password" && page !== "admin-approvals" && page !== "leave-approvals" && page !== "apply-leave") return;
    if (page === "leave-calendar" && user.role === "admin") return;
    setCurrentPage(page as Page);
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":             return <Dashboard />;
      case "apply-leave":           return (user.role === "employee" || user.role === "manager" || user.role === "hr" || user.role === "admin") ? <ApplyLeave /> : <Dashboard />;
      case "leaves":                return <Leaves />;
      case "holiday-calendar":      return <HolidayCalendar />;
      case "leave-calendar":        return user.role !== "admin" ? <LeaveCalendar /> : <Dashboard />;
      case "leave-approvals":       return (user.role === "manager" || user.has_subordinates) ? <LeaveApprovals /> : <Dashboard />;
      case "hr-approvals":          return user.role === "hr" ? <HrApprovals /> : <Dashboard />;
      case "admin-approvals":       return user.role === "admin" ? <AdminApprovals /> : <Dashboard />;
      case "admin-users":           return user.role === "admin" ? <AdminUsers /> : <Dashboard />;
      case "admin-invitations":     return user.role === "admin" ? <AdminInvitations /> : <Dashboard />;
      case "admin-hierarchy":       return user.role === "admin" ? <AdminHierarchy /> : <Dashboard />;
      case "admin-policy":          return user.role === "admin" ? <AdminPolicy /> : <Dashboard />;
      case "admin-holidays":        return user.role === "admin" ? <AdminHolidays /> : <Dashboard />;
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
      <ReduxAuthBridge />
      <AppInner />
    </AuthProvider>
  );
}