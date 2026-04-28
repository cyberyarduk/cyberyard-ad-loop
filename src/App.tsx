import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { Capacitor } from "@capacitor/core";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";

import Devices from "./pages/Devices";
import Videos from "./pages/Videos";
import Playlists from "./pages/Playlists";
import CreateAIVideo from "./pages/CreateAIVideo";
import Player from "./pages/Player";
import Companies from "./pages/Companies";
import CompanyForm from "./pages/CompanyForm";
import CompanyDetail from "./pages/CompanyDetail";
import Settings from "./pages/Settings";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import CookiesPolicy from "./pages/CookiesPolicy";
import DataProcessingAddendum from "./pages/DataProcessingAddendum";
import RefundPolicy from "./pages/RefundPolicy";
import AcceptableUsePolicy from "./pages/AcceptableUsePolicy";
import SalesDashboard from "./pages/SalesDashboard";
import SalesClients from "./pages/SalesClients";
import AdminDashboard from "./pages/AdminDashboard";
import Salespeople from "./pages/Salespeople";
import NewSalesperson from "./pages/NewSalesperson";
import NewClientWizard from "./pages/NewClientWizard";
import SalespersonDetail from "./pages/SalespersonDetail";
import ResearchLeads from "./pages/ResearchLeads";
import NewResearchLead from "./pages/NewResearchLead";
import ResearchLeadDetail from "./pages/ResearchLeadDetail";
import ResearchAnalytics from "./pages/ResearchAnalytics";
import PostTrialSurvey from "./pages/PostTrialSurvey";
import { toast } from "sonner";

const queryClient = new QueryClient();
const isNativeApp = Capacitor.isNativePlatform();

function ProtectedRoute({
  children,
  requireSuperAdmin = false,
  requireSalesperson = false,
}: {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
  requireSalesperson?: boolean;
}) {
  const { user, profile, company, loading, isSuperAdmin, isSalesperson, checkAccess, signOut } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    toast.error("Access denied. Admin privileges required.");
    return <Navigate to="/dashboard" replace />;
  }

  if (requireSalesperson && !isSalesperson && !isSuperAdmin) {
    toast.error("Access denied. Salesperson access required.");
    return <Navigate to="/dashboard" replace />;
  }

  if (!isSuperAdmin && !isSalesperson && !checkAccess()) {
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
            <Route path="/" element={isNativeApp ? <Player /> : <Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Customer portal */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/venues" element={<Navigate to="/dashboard" replace />} />
            <Route path="/devices" element={<ProtectedRoute><Devices /></ProtectedRoute>} />
            <Route path="/videos" element={<ProtectedRoute><Videos /></ProtectedRoute>} />
            <Route path="/videos/create-ai" element={<ProtectedRoute><CreateAIVideo /></ProtectedRoute>} />
            <Route path="/playlists" element={<ProtectedRoute><Playlists /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

            {/* Salesperson portal */}
            <Route path="/sales" element={<ProtectedRoute requireSalesperson><SalesDashboard /></ProtectedRoute>} />
            <Route path="/sales/clients" element={<ProtectedRoute requireSalesperson><SalesClients /></ProtectedRoute>} />
            <Route path="/sales/new-client" element={<ProtectedRoute requireSalesperson><NewClientWizard variant="sales" /></ProtectedRoute>} />

            {/* Admin (super admin) portal */}
            <Route path="/admin" element={<ProtectedRoute requireSuperAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/salespeople" element={<ProtectedRoute requireSuperAdmin><Salespeople /></ProtectedRoute>} />
            <Route path="/admin/salespeople/new" element={<ProtectedRoute requireSuperAdmin><NewSalesperson /></ProtectedRoute>} />
            <Route path="/admin/salespeople/:id" element={<ProtectedRoute requireSuperAdmin><SalespersonDetail /></ProtectedRoute>} />
            <Route path="/admin/new-client" element={<ProtectedRoute requireSuperAdmin><NewClientWizard variant="admin" /></ProtectedRoute>} />
            <Route path="/admin/research" element={<ProtectedRoute requireSuperAdmin><ResearchLeads /></ProtectedRoute>} />
            <Route path="/admin/research/new" element={<ProtectedRoute requireSuperAdmin><NewResearchLead /></ProtectedRoute>} />
            <Route path="/admin/research/analytics" element={<ProtectedRoute requireSuperAdmin><ResearchAnalytics /></ProtectedRoute>} />
            <Route path="/admin/research/:id/post-trial" element={<ProtectedRoute requireSuperAdmin><PostTrialSurvey /></ProtectedRoute>} />
            <Route path="/admin/research/:id" element={<ProtectedRoute requireSuperAdmin><ResearchLeadDetail /></ProtectedRoute>} />

            {/* Existing super admin company management */}
            <Route path="/companies" element={<ProtectedRoute requireSuperAdmin><Companies /></ProtectedRoute>} />
            <Route path="/companies/new" element={<ProtectedRoute requireSuperAdmin><CompanyForm /></ProtectedRoute>} />
            <Route path="/companies/:id" element={<ProtectedRoute requireSuperAdmin><CompanyDetail /></ProtectedRoute>} />
            <Route path="/companies/:id/edit" element={<ProtectedRoute requireSuperAdmin><CompanyForm /></ProtectedRoute>} />

            <Route path="/player" element={<Player />} />
            <Route path="/player/:deviceId" element={<Player />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/cookies-policy" element={<CookiesPolicy />} />
            <Route path="/data-processing-addendum" element={<DataProcessingAddendum />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/acceptable-use-policy" element={<AcceptableUsePolicy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
