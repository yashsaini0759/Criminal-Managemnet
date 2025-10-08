import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useState, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useIsMobile } from "@/hooks/use-mobile";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Criminals from "@/pages/criminals";
import FirRecords from "@/pages/fir-records";
import Operators from "@/pages/operators";
import Reports from "@/pages/reports";
import CrimePrediction from "@/pages/crime-prediction";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  
  if (!user) {
    return <Redirect to="/" />;
  }
  
  return <>{children}</>;
}

function MainLayout({ children, title, breadcrumb }: { 
  children: React.ReactNode; 
  title: string;
  breadcrumb?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-64 min-h-screen">
        <TopBar 
          title={title}
          breadcrumb={breadcrumb}
          onMenuClick={() => setSidebarOpen(true)}
        />
        
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function Router() {
  const user = getCurrentUser();

  return (
    <Switch>
      <Route path="/">
        {user ? <Redirect to="/dashboard" /> : <Login />}
      </Route>
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <MainLayout title="Dashboard" breadcrumb="Home / Dashboard">
            <Dashboard />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/criminals">
        <ProtectedRoute>
          <MainLayout title="Criminal Records" breadcrumb="Home / Criminal Records">
            <Criminals />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/fir-records">
        <ProtectedRoute>
          <MainLayout title="FIR Records" breadcrumb="Home / FIR Records">
            <FirRecords />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/operators">
        <ProtectedRoute>
          <MainLayout title="Operators" breadcrumb="Home / Operators">
            <Operators />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/reports">
        <ProtectedRoute>
          <MainLayout title="Reports" breadcrumb="Home / Reports">
            <Reports />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/crime-prediction">
        <ProtectedRoute>
          <MainLayout title="Crime Prediction" breadcrumb="Home / Crime Prediction">
            <CrimePrediction />
          </MainLayout>
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
