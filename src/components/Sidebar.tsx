import {
  BarChart3,
  Brain,
  Headphones,
  LayoutDashboard,
  Settings,
  Waves,
  Clock3,
} from "lucide-react";

import { NavLink } from "react-router-dom";

const navItems = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Focus Session",
    path: "/focus",
    icon: Brain,
  },
  {
    name: "Analytics",
    path: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Soundscapes",
    path: "/soundscapes",
    icon: Headphones,
  },
  {
    name: "Session History",
    path: "/sessions",
    icon: Clock3,
  },
];

function Sidebar() {
  return (
    <aside className="flex min-h-screen w-64 flex-col border-r border-white/5 bg-[#0c1020]/90 px-4 py-6">

      {/* LOGO */}
      <div className="mb-10 flex items-center gap-3 px-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/20">
          <Waves size={23} />
        </div>

        <div>
          <h1 className="font-bold tracking-[0.18em] text-white">
            AURAVIBE
          </h1>

          <p className="mt-1 text-[10px] tracking-wider text-slate-500">
            ADAPTIVE FOCUS ENGINE
          </p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  isActive
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-900/30"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <Icon size={18} />
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      {/* SETTINGS */}
      <div className="mt-auto">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
              isActive
                ? "bg-violet-600 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`
          }
        >
          <Settings size={18} />
          Settings
        </NavLink>

        <div className="mt-5 rounded-xl border border-white/5 bg-white/[0.03] p-4">
          <p className="text-xs text-slate-500">
            SYSTEM STATUS
          </p>

          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-xs text-emerald-300">
              All systems operational
            </span>
          </div>
        </div>
      </div>

    </aside>
  );
}

export default Sidebar;