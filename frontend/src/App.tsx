import { useAuth, AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ApplyLeave from "./pages/ApplyLeave";
import Leaves from "./pages/Leaves";
import HolidayCalendar from "./pages/HolidayCalendar";
import LeaveApprovals from "./pages/LeaveApprovals";
import AdminPanel from "./pages/AdminPanel";
import { useState } from "react";

type Page =
  | "dashboard" | "apply-leave" | "leaves"
  | "holiday-calendar" | "leave-approvals"
  | "admin-panel";

function AppInner() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-500 text-sm font-medium">Loading...</p>
      </div>
    );
  }

  if (!user) return <Login />;

  const activePage = currentPage === "dashboard" && user.role === "admin" ? "admin-panel" : currentPage;

  const handleNavigate = (page: string) => {
    // Guard manager-only pages
    if (page === "leave-approvals" && user.role !== "manager") return;
    // Guard admin-only pages
    if (page === "admin-panel" && user.role !== "admin") return;
    // Guard employee-only pages from admin
    if (user.role === "admin" && page !== "admin-panel") return;
    setCurrentPage(page as Page);
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":             return <Dashboard />;
      case "apply-leave":           return (user.role === "employee" || user.role === "manager") ? <ApplyLeave /> : <Dashboard />;
      case "leaves":                return <Leaves />;
      case "holiday-calendar":      return <HolidayCalendar />;
      case "leave-approvals":       return user.role === "manager" ? <LeaveApprovals /> : <Dashboard />;
      case "admin-panel":           return user.role === "admin" ? <AdminPanel /> : <Dashboard />;
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