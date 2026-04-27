import React from "react";
import { useAuth } from "../context/AuthContext";

type SectionHeader = { kind: "section"; label: string };
type NavLink = { kind: "link"; label: string; page: string };
type NavItem = SectionHeader | NavLink;

const employeeNav: NavItem[] = [
  { kind: "section", label: "Overview" },
  { kind: "link", label: "Dashboard", page: "dashboard" },
  { kind: "section", label: "Leave Management" },
  { kind: "link", label: "Apply for Leave", page: "apply-leave" },
  { kind: "link", label: "Leaves", page: "leaves" },
  { kind: "link", label: "Holiday Calendar", page: "holiday-calendar" },
  { kind: "section", label: "Account" },
  { kind: "link", label: "Change Password", page: "change-password" },
];

const managerNav: NavItem[] = [
  { kind: "section", label: "Overview" },
  { kind: "link", label: "Dashboard", page: "dashboard" },
  { kind: "section", label: "Leave Management" },
  { kind: "link", label: "Apply for Leave", page: "apply-leave" },
  { kind: "link", label: "Leaves", page: "leaves" },
  { kind: "link", label: "Holiday Calendar", page: "holiday-calendar" },
  { kind: "link", label: "Leave Approvals", page: "leave-approvals" },
  { kind: "section", label: "Account" },
  { kind: "link", label: "Change Password", page: "change-password" },
];

const adminNav: NavItem[] = [
  { kind: "section", label: "Administration" },
  { kind: "link", label: "Admin Panel", page: "admin-panel" },
  { kind: "section", label: "Account" },
  { kind: "link", label: "Change Password", page: "change-password" },
];

interface LayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}

export default function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const { user, logout } = useAuth();

  const navItems =
    user?.role === "admin" ? adminNav
    : user?.role === "manager" ? managerNav
    : employeeNav;



  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shadow-sm shrink-0">
        <div className="px-5 py-5 border-b border-slate-100">
          <p className="font-semibold text-slate-800 text-sm">{user?.name ?? "—"}</p>
          <p className="text-xs text-emerald-600 font-medium mt-0.5">{user?.email ?? ""}</p>
          
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item, i) => {
            if (item.kind === "section") {
              return <p key={i} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-2 pt-4 pb-1 first:pt-1">{item.label}</p>;
            }
            const isActive = currentPage === item.page;
            return (
              <button key={i} onClick={() => onNavigate(item.page)}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-all duration-150 font-medium ${
                  isActive ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200" : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}>
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-slate-200 px-8 py-3.5 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            {currentPage === "dashboard" && (
              <button onClick={() => onNavigate("apply-leave")}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
                <span className="text-lg leading-none">+</span> Apply leave
              </button>
            )}
          </div>
          <button onClick={logout}
            className="text-sm font-semibold text-rose-500 hover:text-rose-600 border border-rose-200 hover:border-rose-300 px-4 py-1.5 rounded-lg transition-colors">
            Logout
          </button>
        </header>

        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}