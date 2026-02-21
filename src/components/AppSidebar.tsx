import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, CalendarDays, Package, UtensilsCrossed, ClipboardList, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

const allNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", roles: ["resident", "kitchen_staff", "admin"] as const },
  { icon: Users, label: "Residents", path: "/residents", roles: ["resident", "kitchen_staff", "admin"] as const },
  { icon: CalendarDays, label: "Meal Planner", path: "/meal-planner", roles: ["resident", "kitchen_staff", "admin"] as const },
  { icon: Package, label: "Inventory", path: "/inventory", roles: ["kitchen_staff", "admin"] as const },
  { icon: ClipboardList, label: "Audit Log", path: "/audit-log", roles: ["kitchen_staff", "admin"] as const },
];

const roleLabels = {
  resident: "Resident",
  kitchen_staff: "Kitchen Staff",
  admin: "Admin",
} as const;

const AppSidebar = () => {
  const location = useLocation();
  const { role, user, signOut } = useAuth();

  const navItems = allNavItems.filter(
    (item) => role && (item.roles as readonly string[]).includes(role)
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col z-50">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sidebar-primary flex items-center justify-center">
          <UtensilsCrossed className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-lg font-['DM_Sans']">MealTrack</h1>
          <p className="text-xs text-sidebar-foreground/60">Care Facility</p>
        </div>
      </div>

      <nav className="flex-1 px-3 mt-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mx-3 mb-2 rounded-xl bg-sidebar-accent">
        <p className="text-xs text-sidebar-foreground/60 mb-1">Signed in as</p>
        <p className="text-sm font-semibold truncate">{user?.email}</p>
        {role && (
          <Badge variant="outline" className="mt-1.5 text-xs border-sidebar-foreground/20 text-sidebar-foreground/80">
            {roleLabels[role]}
          </Badge>
        )}
      </div>

      <button
        onClick={signOut}
        className="mx-3 mb-4 flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all"
      >
        <LogOut className="w-5 h-5" />
        Sign Out
      </button>
    </aside>
  );
};

export default AppSidebar;
