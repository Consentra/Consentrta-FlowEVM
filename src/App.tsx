
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AppLayout } from "@/components/AppLayout";
import { Index } from "@/pages/Index";
import { WalletAuth } from "@/components/WalletAuth";
import Dashboard from "@/pages/Dashboard";
import Proposals from "@/pages/Proposals";
import CreateProposal from "@/pages/CreateProposal";
import DAOs from "@/pages/DAOs";
import CreateDAO from "@/pages/CreateDAO";
import IdentityVerification from "@/pages/IdentityVerification";
import Settings from "@/pages/Settings";
import Analytics from "@/pages/Analytics";
import AICompanions from "@/pages/AICompanions";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <TooltipProvider>
          <AuthProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<WalletAuth />} />
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/proposals" element={<Proposals />} />
                  <Route path="/proposals/create" element={<CreateProposal />} />
                  <Route path="/daos" element={<DAOs />} />
                  <Route path="/daos/create" element={<CreateDAO />} />
                  <Route path="/verification" element={<IdentityVerification />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/ai-assistance" element={<AICompanions />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </Router>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
