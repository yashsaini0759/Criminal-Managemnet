import { Button } from "@/components/ui/button";
import { Menu, Bell } from "lucide-react";

interface TopBarProps {
  title: string;
  breadcrumb?: string;
  onMenuClick: () => void;
}

export function TopBar({ title, breadcrumb, onMenuClick }: TopBarProps) {
  const currentTime = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="bg-card border-b border-border p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={onMenuClick}
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-card-foreground" data-testid="text-page-title">
              {title}
            </h1>
            {breadcrumb && (
              <p className="text-sm text-muted-foreground" data-testid="text-breadcrumb">
                {breadcrumb}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="relative" data-testid="button-notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full"></span>
          </Button>
          <div className="text-sm text-muted-foreground" data-testid="text-current-time">
            {currentTime}
          </div>
        </div>
      </div>
    </header>
  );
}
