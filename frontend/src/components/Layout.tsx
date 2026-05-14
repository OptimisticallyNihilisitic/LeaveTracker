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
  { kind: "link", label: "Leave Calendar", page: "leave-calendar" },
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
  { kind: "link", label: "Leave Calendar", page: "leave-calendar" },
  { kind: "link", label: "Holiday Calendar", page: "holiday-calendar" },
  { kind: "link", label: "Leave Approvals", page: "leave-approvals" },
  { kind: "section", label: "Account" },
  { kind: "link", label: "Change Password", page: "change-password" },
];

const hrNav: NavItem[] = [
  { kind: "section", label: "Overview" },
  { kind: "link", label: "Dashboard", page: "dashboard" },
  { kind: "section", label: "Leave Management" },
  { kind: "link", label: "HR Approvals", page: "hr-approvals" },
  { kind: "link", label: "Leaves", page: "leaves" },
  { kind: "link", label: "Leave Calendar", page: "leave-calendar" },
  { kind: "link", label: "Holiday Calendar", page: "holiday-calendar" },
  { kind: "section", label: "Account" },
  { kind: "link", label: "Change Password", page: "change-password" },
];

const adminNav: NavItem[] = [
  { kind: "section", label: "Administration" },
  { kind: "link", label: "Users",               page: "admin-users" },
  { kind: "link", label: "Invitations",         page: "admin-invitations" },
  { kind: "link", label: "Reporting Hierarchy", page: "admin-hierarchy" },
  { kind: "link", label: "Leave Policy",        page: "admin-policy" },
  { kind: "link", label: "Holidays",            page: "admin-holidays" },
  { kind: "section", label: "Account" },
  { kind: "link", label: "Change Password",     page: "change-password" },
];

interface LayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}

export default function Layout({ currentPage, onNavigate, children }: LayoutProps) {
  const { user, logout } = useAuth();

  const navItems =
    user?.role === "admin"   ? adminNav
    : user?.role === "manager" ? managerNav
    : user?.role === "hr"      ? hrNav
    : employeeNav;



  return (
    <div className="min-h-screen bg-app flex font-sans">
      <aside className="w-64 bg-surface border-r border-border flex flex-col shadow-soft shrink-0">
        <div className="px-5 py-5 border-b border-white/5">
          <p className="font-semibold text-fg text-sm">{user?.name ?? "—"}</p>
          <p className="text-xs text-muted font-medium mt-0.5">{user?.email ?? ""}</p>
          
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item, i) => {
            if (item.kind === "section") {
              return <p key={i} className="text-[10px] font-bold uppercase tracking-widest text-muted/70 px-2 pt-4 pb-1 first:pt-1">{item.label}</p>;
            }
            const isActive = currentPage === item.page;
            return (
              <button key={i} onClick={() => onNavigate(item.page)}
                className={`w-full text-left text-sm px-3 py-2.5 rounded-xl transition-all duration-150 font-medium ${
                  isActive ? "bg-accent text-white shadow-soft-sm shadow-black/35 ring-1 ring-white/10" : "text-fg/80 hover:bg-white/5 hover:text-fg"
                }`}>
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-surface border-b border-border px-8 py-3.5 flex items-center justify-between shadow-soft-sm shadow-black/30">
          <div className="flex items-center gap-3">
            {currentPage === "dashboard" && (
              <button onClick={() => onNavigate("apply-leave")}
                className="app-btn-primary">
                <span className="text-lg leading-none">+</span> Apply leave
              </button>
            )}
          </div>
          <button onClick={logout}
            className="app-btn-danger px-4 py-2 rounded-xl">
            Logout
          </button>
        </header>

        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}