import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Venues from "./pages/Venues";
import Devices from "./pages/Devices";
import Videos from "./pages/Videos";
import Playlists from "./pages/Playlists";
import CreateAIVideo from "./pages/CreateAIVideo";
import Player from "./pages/Player";
import Companies from "./pages/Companies";
import CompanyForm from "./pages/CompanyForm";
import Settings from "./pages/Settings";
import { toast } from "sonner";

const queryClient = new QueryClient();

// Protected route wrapper
function ProtectedRoute({ children, requireSuperAdmin = false }: { children: React.ReactNode; requireSuperAdmin?: boolean }) {
  const { user, profile, company, loading, isSuperAdmin, checkAccess, signOut } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    toast.error("Access denied. Super admin privileges required.");
    return <Navigate to="/dashboard" replace />;
  }

  if (!isSuperAdmin && !checkAccess()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 p-8 border rounded-lg max-w-md">
          <h1 className="text-2xl font-bold">Subscription Inactive</h1>
          <p className="text-muted-foreground">
            Your Cyberyard subscription is not active. Please contact support.
          </p>
          {company && (
            <div className="text-sm text-muted-foreground">
              <p>Company: {company.name}</p>
              <p>Status: {company.status}</p>
            </div>
          )}
          <button
            onClick={signOut}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/venues"
              element={
                <ProtectedRoute>
                  <Venues />
                </ProtectedRoute>
              }
            />
            <Route
              path="/devices"
              element={
                <ProtectedRoute>
                  <Devices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/videos"
              element={
                <ProtectedRoute>
                  <Videos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/videos/create-ai"
              element={
                <ProtectedRoute>
                  <CreateAIVideo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/playlists"
              element={
                <ProtectedRoute>
                  <Playlists />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/companies"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <Companies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/companies/new"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <CompanyForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/companies/:id"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <CompanyForm />
                </ProtectedRoute>
              }
            />
            <Route path="/player/:deviceId" element={<Player />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
