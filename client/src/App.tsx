import { MainLayout } from "@/components/MainLayout"; // Import MainLayout
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute"; // Import ProtectedRoute
import AddItem from "./pages/AddItem";
import { AddSubAdminPage } from "./pages/AddSubAdminPage";
import AuditLogs from "./pages/AuditLogs";
import Categories from "./pages/Categories";
import ConfirmedReplacementsPage from "./pages/ConfirmedReplacementsPage";
import Dashboard from "./pages/Dashboard";
import InventoryList from "./pages/InventoryList";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import PendingReplacementsPage from "./pages/PendingReplacementsPage";

import TransferredItemsList from "./pages/TransferredItemsList";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<MainLayout />}>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<InventoryList />} />
            <Route path="/add-item" element={<AddItem />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/transferred-items" element={<TransferredItemsList />} />
            <Route path="/pending-replacements" element={<PendingReplacementsPage />} />
            <Route path="/confirmed-replacements" element={<ConfirmedReplacementsPage />} />

          </Route>
          <Route element={<ProtectedRoute allowedRoles={['superadmin']} />}>
            <Route path="/add-subadmin" element={<AddSubAdminPage />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
