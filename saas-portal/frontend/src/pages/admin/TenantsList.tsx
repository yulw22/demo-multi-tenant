import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { env } from "../../environment";

type Tenant = {
  id: string;
  schoolName: string;
  subdomain: string;
  adminEmail: string;
  dbSchema: string;
  deploymentStatus: string;
  createdAt: string;
};

export default function TenantsList() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${env.apiUrl}/tenants`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setTenants(data);
    } catch (err) {
      console.error(err);
      setError("Không tải được danh sách tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const sorted = useMemo(
    () => [...tenants].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [tenants]
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tenants</h1>
          <p className="text-sm text-slate-300">Danh sách khách hàng</p>
        </div>
        {loading && <span className="text-sm text-slate-400">Đang tải...</span>}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-lg shadow-black/20">
        <table className="min-w-full divide-y divide-white/10">
          <thead className="bg-white/5">
            <tr>
              {[
                "Trường",
                "Subdomain",
                "Admin Email",
                "Schema",
                "Trạng thái",
                "Tạo lúc",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-sm font-semibold text-slate-200">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {sorted.map((tenant) => (
              <tr
                key={tenant.id}
                className="cursor-pointer hover:bg-white/5"
                onDoubleClick={() => navigate(`/admin/tenants/${tenant.id}`)}>
                <td className="px-4 py-3 text-sm text-white">
                  {tenant.schoolName}
                </td>
                <td className="px-4 py-3 text-sm text-slate-200">
                  {tenant.subdomain}
                </td>
                <td className="px-4 py-3 text-sm text-slate-200">
                  {tenant.adminEmail}
                </td>
                <td className="px-4 py-3 text-sm text-slate-200">
                  {tenant.dbSchema}
                </td>
                <td className="px-4 py-3 text-sm text-slate-200">
                  {tenant.deploymentStatus}
                </td>
                <td className="px-4 py-3 text-sm text-slate-200">
                  {new Date(tenant.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-slate-300">
                  Chưa có tenant nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
