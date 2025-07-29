import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicRoute } from "./components/PublicRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import ManageUsers from "./pages/ManageUsers";
import NewTicket from "./pages/NewTicket";
import TicketRoute from "./pages/TicketRoute";
import TicketView from "./pages/TicketView";
import EditTicket from "./pages/EditTicket";
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
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={
              <PublicRoute>
                <Auth />
              </PublicRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/manage-users" element={
              <ProtectedRoute>
                <ManageUsers />
              </ProtectedRoute>
            } />
            <Route path="/new-ticket" element={
              <ProtectedRoute>
                <NewTicket />
              </ProtectedRoute>
            } />
            <Route path="/ticket/:template" element={
              <ProtectedRoute>
                <TicketRoute />
              </ProtectedRoute>
            } />
            <Route path="/view-ticket/:id" element={
              <ProtectedRoute>
                <TicketView />
              </ProtectedRoute>
            } />
            <Route path="/edit-ticket/:id" element={
              <ProtectedRoute>
                <EditTicket />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
