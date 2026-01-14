import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex">
        <aside className="w-64 border-r border-white/10 bg-slate-900/70 p-6">
          <div className="mb-6 text-xl font-bold">SAAS Portal Admin</div>
          <nav className="space-y-3">
            <NavLink
              to="/admin/leads"
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 font-semibold ${
                  isActive
                    ? "bg-indigo-500 text-white"
                    : "text-slate-200 hover:bg-white/5"
                }`
              }>
              Leads
            </NavLink>
            <NavLink
              to="/admin/tenants"
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 font-semibold ${
                  isActive
                    ? "bg-indigo-500 text-white"
                    : "text-slate-200 hover:bg-white/5"
                }`
              }>
              Tenants
            </NavLink>
          </nav>
        </aside>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
