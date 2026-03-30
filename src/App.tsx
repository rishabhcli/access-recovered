import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/supabase/auth-context";
import { ProtectedRoute } from "@/components/feedback/ProtectedRoute";
import LandingPage from "./pages/public/LandingPage";
import AuthPage from "./pages/auth/AuthPage";
import WorkspaceHomePage from "./pages/app/WorkspaceHomePage";
import DistrictOverviewPage from "./pages/app/DistrictOverviewPage";
import RehearsalBoardPage from "./pages/app/RehearsalBoardPage";
import RunDetailPage from "./pages/app/RunDetailPage";
import PublicReplayPage from "./pages/public/PublicReplayPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/app" element={<ProtectedRoute><WorkspaceHomePage /></ProtectedRoute>} />
            <Route path="/app/rehearsal/:districtSlug" element={<ProtectedRoute><RehearsalBoardPage /></ProtectedRoute>} />
            <Route path="/app/runs/:runId" element={<ProtectedRoute><RunDetailPage /></ProtectedRoute>} />
            <Route path="/replay/bridge-reconnect" element={<PublicReplayPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
