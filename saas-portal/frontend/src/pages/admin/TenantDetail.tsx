import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { env } from "../../environment";

type ParsedConfig = {
  classes: { code: string; name: string; description: string }[];
  users: {
    email: string;
    username: string;
    password: string;
    fullname: string;
    role: string;
    classCode: string;
  }[];
};

type Tenant = {
  id: string;
  schoolName: string;
  subdomain: string;
  adminEmail: string;
  dbSchema: string;
  logoUrl: string | null;
  schoolConfig: ParsedConfig | null;
  containerId: string | null;
  deploymentStatus:
    | "DRAFT"
    | "READY"
    | "DEPLOYING"
    | "PROVISIONING"
    | "ACTIVE"
    | "ERROR";
  createdAt: string;
};

export default function TenantDetail() {
  const { tenantId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [progressStep, setProgressStep] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{
    visible: boolean;
    adminEmail?: string;
    adminPassword?: string;
  }>({ visible: false });

  const fetchTenant = async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${env.apiUrl}/tenants/${tenantId}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = (await res.json()) as Tenant;
      setTenant(data);
    } catch (err) {
      console.error(err);
      setError("Không tải được thông tin tenant");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, [tenantId]);

  const classUserCount = useMemo(() => {
    const counts: Record<string, number> = {};
    if (tenant?.schoolConfig?.users) {
      tenant.schoolConfig.users.forEach((u) => {
        if (u.classCode) counts[u.classCode] = (counts[u.classCode] ?? 0) + 1;
      });
    }
    return counts;
  }, [tenant]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (file?: File | null) => {
    if (!tenantId || !file) return;
    setUploading(true);
    setError(null);
    setToast(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(
        `${env.apiUrl}/tenants/${tenantId}/upload-config`,
        { method: "POST", body: form }
      );
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const parsed = (await res.json()) as ParsedConfig;
      setToast("Đã tải cấu hình thành công");
      setTenant((prev) =>
        prev
          ? {
              ...prev,
              schoolConfig: parsed,
              deploymentStatus: "READY",
            }
          : prev
      );
    } catch (err) {
      console.error(err);
      setError("Tải cấu hình thất bại, vui lòng thử lại.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeploy = async () => {
    if (!tenantId) return;
    setDeploying(true);
    setProgressStep("Starting Container...");
    setError(null);
    setToast(null);
    try {
      const res = await fetch(`${env.apiUrl}/tenants/${tenantId}/deploy`, {
        method: "POST",
      });
      setProgressStep("Seeding Data...");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setTenant((prev) =>
        prev
          ? {
              ...(data?.tenant ?? prev),
              deploymentStatus: data?.tenant?.deploymentStatus ?? "ACTIVE",
              containerId: data?.tenant?.containerId ?? prev.containerId,
            }
          : prev
      );
      setSuccessModal({
        visible: true,
        adminEmail: data?.adminCredentials?.email,
        adminPassword: data?.adminCredentials?.password,
      });
    } catch (err) {
      console.error(err);
      setError("Triển khai thất bại, vui lòng thử lại.");
    } finally {
      setDeploying(false);
      setProgressStep(null);
    }
  };

  if (loading) {
    return <div className="text-slate-200">Đang tải...</div>;
  }

  if (!tenant) {
    return <div className="text-slate-200">Không tìm thấy tenant.</div>;
  }

  const baseUrl = `http://${tenant.subdomain}.localhost`;
  const isDraft = tenant.deploymentStatus === "DRAFT";
  const isReady = tenant.deploymentStatus === "READY";

  return (
    <div className="space-y-6 text-white relative">
      {deploying && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur">
          <div className="rounded-2xl border border-white/10 bg-slate-900 px-8 py-6 text-center shadow-xl">
            <div className="text-2xl">🚀 Deploying...</div>
            <div className="mt-2 text-slate-200">{progressStep}</div>
          </div>
        </div>
      )}

      <button
        className="rounded-lg p-2 border border-emerald-500/40 bg-emerald-500/10 cursor-pointer"
        onClick={() => navigate(`/admin/tenants`)}>
        Quay lại
      </button>

      <div>
        <h1 className="text-2xl font-bold">Tenant: {tenant.schoolName}</h1>
        <p className="text-sm text-slate-300">Subdomain: {tenant.subdomain}</p>
        <p className="text-sm text-slate-300">
          Status: {tenant.deploymentStatus}
        </p>
      </div>

      {toast && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {toast}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      )}

      {(isDraft || isReady) && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Hồ sơ đang ở trạng thái {tenant.deploymentStatus}. Vui lòng tải cấu
          hình và triển khai.
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
        <h2 className="text-xl font-semibold">Upload Config</h2>
        <p className="mt-1 text-sm text-slate-300">
          Chọn file Excel (sheet Classes & Users) để chuẩn bị triển khai.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleUploadClick}
            disabled={uploading}
            className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:opacity-60">
            {uploading ? "Đang tải..." : "Upload Config Excel"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
        </div>

        {tenant.schoolConfig && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Danh sách lớp</h3>
            <div className="overflow-hidden rounded-lg border border-white/10">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/5">
                  <tr>
                    {["Mã", "Tên lớp", "Mô tả", "Số người"].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-2 text-left text-sm font-semibold text-slate-200">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {tenant.schoolConfig.classes.map((cls) => (
                    <tr key={cls.code}>
                      <td className="px-4 py-2 text-sm text-white">
                        {cls.code}
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-200">
                        {cls.name}
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-200">
                        {cls.description}
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-200">
                        {classUserCount[cls.code] ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              Tổng người dùng: {tenant.schoolConfig.users.length}
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20">
        <h2 className="text-xl font-semibold">Deploy</h2>
        {isReady ? (
          <button
            onClick={handleDeploy}
            disabled={deploying}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-lg font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:-translate-y-0.5 hover:bg-emerald-400 disabled:opacity-60">
            🚀 Deploy System
          </button>
        ) : (
          <button
            disabled
            title="Cần upload cấu hình trước"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-slate-700 px-6 py-3 text-lg font-semibold text-slate-300 opacity-70">
            🚀 Deploy System
          </button>
        )}
      </div>

      {successModal.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-white">
              Triển khai thành công
            </h3>
            <p className="mt-2 text-sm text-slate-200">
              Hệ thống đã sẵn sàng. Truy cập:{" "}
              <a
                href={baseUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-300 underline">
                {baseUrl}
              </a>
            </p>
            <div className="mt-4 space-y-2 text-sm text-slate-200">
              <div>
                Admin Username:{" "}
                {successModal.adminEmail ?? "sysadmin@example.com"}
              </div>
              <div>
                Password: {successModal.adminPassword ?? "Sys@dmin-sample1"}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() =>
                  setSuccessModal({
                    visible: false,
                    adminEmail: undefined,
                    adminPassword: undefined,
                  })
                }
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
