import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/venues" element={<Venues />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/videos/create-ai" element={<CreateAIVideo />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/player/:deviceId" element={<Player />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
