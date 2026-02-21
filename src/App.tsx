import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Residents from "./pages/Residents";
import MealPlanner from "./pages/MealPlanner";
import Inventory from "./pages/Inventory";
import AuditLog from "./pages/AuditLog";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/residents" element={<ProtectedRoute><Residents /></ProtectedRoute>} />
            <Route path="/meal-planner" element={<ProtectedRoute><MealPlanner /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute allowedRoles={["kitchen_staff", "admin"]}><Inventory /></ProtectedRoute>} />
            <Route path="/audit-log" element={<ProtectedRoute allowedRoles={["kitchen_staff", "admin"]}><AuditLog /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
