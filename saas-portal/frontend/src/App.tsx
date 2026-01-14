import "./App.css";
import LandingPage from "./pages/LandingPage";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AdminLayout from "./layouts/AdminLayout";
import LeadsList from "./pages/admin/LeadsList";
import TenantsList from "./pages/admin/TenantsList";
import TenantDetail from "./pages/admin/TenantDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="leads" element={<LeadsList />} />
          <Route path="tenants" element={<TenantsList />} />
          <Route path="tenants/:tenantId" element={<TenantDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
