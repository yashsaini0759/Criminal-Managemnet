import { Link, useLocation } from "wouter";
import { Shield, Home, Users, FileText, UserCog, BarChart3, BrainCircuit, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { getCurrentUser, clearCurrentUser, isAdmin } from "@/lib/auth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const user = getCurrentUser();

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: Home },
    { path: "/criminals", label: "Criminal Records", icon: Users },
    { path: "/fir-records", label: "FIR Records", icon: FileText },
    ...(isAdmin(user) ? [{ path: "/operators", label: "Operators", icon: UserCog }] : []),
    { path: "/reports", label: "Reports", icon: BarChart3 },
    { path: "/crime-prediction", label: "Crime Prediction", icon: BrainCircuit },
  ];

  const handleLogout = () => {
    clearCurrentUser();
    window.location.href = "/";
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
          data-testid="sidebar-overlay"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out z-30 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        data-testid="sidebar"
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
              <Shield className="text-sm text-sidebar-primary-foreground" />
            </div>
            <h2 className="font-semibold text-sidebar-foreground">CMS</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onClose}
            data-testid="button-close-sidebar"
          >
            ×
          </Button>
        </div>

        {/* User Info */}
        {user && (
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-sidebar-primary/10 rounded-full flex items-center justify-center">
                <Users className="text-sidebar-primary" />
              </div>
              <div>
                <p className="font-medium text-sidebar-foreground" data-testid="text-user-name">
                  {user.name}
                </p>
                <p className="text-sm text-muted-foreground capitalize" data-testid="text-user-role">
                  {user.role}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path;
              
              return (
                <li key={item.path}>
                  <Link href={item.path}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => onClose()}
                      data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </Button>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-5 h-5 mr-3" />
                Light Mode
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 mr-3" />
                Dark Mode
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
