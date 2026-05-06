import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BarChart2,
  Bell,
  FileText,
  Send,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const parentNav = [
  { to: "/dashboard/parent", label: "Dashboard", icon: LayoutDashboard, tab: "overview" },
  { to: "/dashboard/parent", label: "Children", icon: Users, tab: "children" },
  { to: "/dashboard/parent", label: "Marks", icon: BarChart2, tab: "marks" },
  { to: "/dashboard/parent", label: "Alerts", icon: Bell, tab: "alerts" },
  { to: "/dashboard/parent", label: "Reports", icon: FileText, tab: "reports" },
  { to: "/dashboard/parent", label: "Telegram", icon: Send, tab: "telegram" },
];

interface ParentDashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ParentDashboardLayout({
  children,
  activeTab,
  onTabChange,
}: ParentDashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    signOut();
  };

  const displayName = user?.username || `parent_${user?.phone || user?.id}`;

  return (
    <div className="min-h-screen bg-[#f4f6fb] flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Brand */}
            <div className="flex items-center gap-2.5 shrink-0">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow">
                <GraduationCap className="h-4 w-4" />
              </span>
              <span className="font-bold text-base tracking-tight text-gray-900">
                SmartAttend<span className="text-indigo-600">AI</span>
              </span>
            </div>

            {/* Nav items */}
            <nav className="hidden md:flex items-center gap-1 ml-6">
              {parentNav.map((item) => {
                const active = activeTab === item.tab;
                return (
                  <button
                    key={item.tab}
                    onClick={() => onTabChange(item.tab)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      active
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* User menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-xs">
                  {(user?.first_name?.[0] || user?.username?.[0] || "P").toUpperCase()}
                </span>
                <span className="hidden sm:block max-w-[160px] truncate">{displayName}</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-52 rounded-xl bg-white border border-gray-200 shadow-xl py-1 z-50">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-900 truncate">{displayName}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Parent Account</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile nav */}
          <div className="md:hidden flex gap-1 pb-2 overflow-x-auto scrollbar-none">
            {parentNav.map((item) => {
              const active = activeTab === item.tab;
              return (
                <button
                  key={item.tab}
                  onClick={() => onTabChange(item.tab)}
                  className={`flex shrink-0 items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    active
                      ? "bg-indigo-50 text-indigo-700 font-semibold"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="h-3 w-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6">{children}</div>
      </main>
    </div>
  );
}
