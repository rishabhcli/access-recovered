import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LandingPage from "./pages/public/LandingPage";
import AuthPage from "./pages/auth/AuthPage";
import WorkspaceHomePage from "./pages/app/WorkspaceHomePage";
import RehearsalBoardPage from "./pages/app/RehearsalBoardPage";
import PublicReplayPage from "./pages/public/PublicReplayPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/app" element={<WorkspaceHomePage />} />
          <Route path="/app/rehearsal/:districtSlug" element={<RehearsalBoardPage />} />
          <Route path="/replay/bridge-reconnect" element={<PublicReplayPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
