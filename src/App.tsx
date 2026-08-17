import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Admin from "./pages/Admin.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";
import EurofarmaLogin from "./pages/empresas/EurofarmaLogin.tsx";
import EurofarmaChangePassword from "./pages/empresas/EurofarmaChangePassword.tsx";
import EurofarmaPortal from "./pages/empresas/EurofarmaPortal.tsx";
import EurofarmaPrices from "./pages/empresas/EurofarmaPrices.tsx";
import EurofarmaHistory from "./pages/empresas/EurofarmaHistory.tsx";
import EurofarmaForgotPassword from "./pages/empresas/EurofarmaForgotPassword.tsx";
import EurofarmaResetPassword from "./pages/empresas/EurofarmaResetPassword.tsx";
import EurofarmaProfile from "./pages/empresas/EurofarmaProfile.tsx";
import EurofarmaDashboard from "./pages/empresas/EurofarmaDashboard.tsx";
import Convenios from "./pages/empresas/Convenios.tsx";
import CampoBelo from "./pages/unidades/CampoBelo.tsx";
import Brooklin from "./pages/unidades/Brooklin.tsx";
import Loja from "./pages/Loja.tsx";
import Agendamento from "./pages/Agendamento.tsx";
import ProductDetail from "./pages/ProductDetail.tsx";
import { useCartSync } from "./hooks/useCartSync";

const queryClient = new QueryClient();

const AppRoutes = () => {
  useCartSync();
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/login" element={<Login />} />
      <Route path="/loja" element={<Loja />} />
      <Route path="/agendamento" element={<Agendamento />} />
      <Route path="/loja/:handle" element={<ProductDetail />} />
      <Route path="/empresas/eurofarma" element={<EurofarmaLogin />} />
      <Route path="/empresas/eurofarma/trocar-senha" element={<EurofarmaChangePassword />} />
      <Route path="/empresas/eurofarma/esqueci-senha" element={<EurofarmaForgotPassword />} />
      <Route path="/empresas/eurofarma/redefinir-senha" element={<EurofarmaResetPassword />} />
      <Route path="/empresas/eurofarma/portal" element={<EurofarmaPortal />} />
      <Route path="/empresas/eurofarma/perfil" element={<EurofarmaProfile />} />
      <Route path="/empresas/eurofarma/precos" element={<EurofarmaPrices />} />
      <Route path="/empresas/eurofarma/historico" element={<EurofarmaHistory />} />
      <Route path="/empresas/eurofarma/dashboard" element={<EurofarmaDashboard />} />
      <Route path="/empresas/convenios" element={<Convenios />} />
      <Route path="/unidades/campo-belo" element={<CampoBelo />} />
      <Route path="/unidades/brooklin" element={<Brooklin />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
