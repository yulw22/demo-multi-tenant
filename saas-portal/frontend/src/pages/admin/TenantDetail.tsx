import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { env } from "../../environment";

// 1. CẬP NHẬT TYPE CHO KHỚP VỚI BACKEND VÀ EXCEL HEADER
type ParsedConfig = {
  teams: {
    code: string;
    name: string;
    description: string;
  }[];
  channels: {
    code: string;
    name: string;
    type: string; // 'O' or 'P'
    description: string;
  }[];
  users: {
    email: string;
    username: string;
    fullname: string; // Excel header
    role: string;
    class_code: string; // Excel header là snake_case
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

  // 2. SỬA LOGIC ĐẾM USER (Dùng class_code)
  const classUserCount = useMemo(() => {
    const counts: Record<string, number> = {};
    if (tenant?.schoolConfig?.users) {
      tenant.schoolConfig.users.forEach((u) => {
        // Excel header là class_code
        if (u.class_code)
          counts[u.class_code] = (counts[u.class_code] ?? 0) + 1;
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
      setError("Tải cấu hình thất bại. Kiểm tra format Excel.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeploy = async () => {
    if (!tenantId) return;
    setDeploying(true);
    setProgressStep("Khởi tạo Server (Docker)...");
    setError(null);
    setToast(null);
    try {
      const res = await fetch(`${env.apiUrl}/tenants/${tenantId}/deploy`, {
        method: "POST",
      });

      // Giả lập loading step cho UX (Vì backend xử lý xong mới trả về)
      setProgressStep("Đang thiết lập dữ liệu (Seeding)...");

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();

      setTenant((prev) =>
        prev
          ? {
              ...(data?.tenant ?? prev),
              deploymentStatus: "ACTIVE", // Force active nếu thành công
              containerId: data?.credentials?.containerId ?? prev.containerId,
            }
          : prev
      );
      setSuccessModal({
        visible: true,
        adminEmail: data?.credentials?.adminUsername, // Backend trả về adminUsername
        adminPassword: data?.credentials?.adminPassword,
      });
    } catch (err) {
      console.error(err);
      setError("Triển khai thất bại. Vui lòng kiểm tra log Backend.");
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
  const isActive = tenant.deploymentStatus === "ACTIVE";

  return (
    <div className="space-y-6 text-white relative pb-20">
      {/* Overlay Loading Deploy */}
      {deploying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-slate-900 px-12 py-10 text-center shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent mb-4"></div>
            <div className="text-2xl font-bold text-white">
              🚀 Đang triển khai...
            </div>
            <div className="mt-2 text-indigo-300 animate-pulse">
              {progressStep}
            </div>
            <p className="mt-4 text-xs text-slate-500 max-w-xs">
              Quá trình này có thể mất 30-60s để khởi tạo Container và nhập
              liệu.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          onClick={() => navigate(`/admin/tenants`)}>
          ← Quay lại danh sách
        </button>
        {isActive && (
          <a
            href={baseUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium shadow-lg shadow-emerald-500/20 transition">
            Truy cập Website ↗
          </a>
        )}
      </div>

      <div className="flex items-start justify-between border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold">{tenant.schoolName}</h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-slate-300">
            <span className="bg-slate-800 px-2 py-1 rounded border border-white/10">
              {tenant.subdomain}.localhost
            </span>
            <span>|</span>
            <span>Admin: {tenant.adminEmail}</span>
          </div>
        </div>
        <div
          className={`px-4 py-1.5 rounded-full text-sm font-bold border ${
            isActive
              ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400"
              : isReady
              ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
              : "bg-slate-700 text-slate-300 border-transparent"
          }`}>
          {tenant.deploymentStatus}
        </div>
      </div>

      {toast && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100 flex items-center gap-2">
          ✓ {toast}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100 flex items-center gap-2">
          ⚠ {error}
        </div>
      )}

      {/* Config Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upload & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 shadow-lg">
            <h2 className="text-lg font-semibold mb-2">1. Cấu hình</h2>
            <p className="text-sm text-slate-400 mb-4">
              Upload file Excel chứa danh sách Lớp (Classes), Môn học (Subjects)
              và Người dùng (Users).
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleUploadClick}
                disabled={uploading || isActive} // Không cho upload lại khi đã Active để an toàn
                className="w-full py-2.5 rounded-lg border border-dashed border-indigo-500/50 hover:bg-indigo-500/10 text-indigo-300 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed">
                {uploading ? "Đang tải lên..." : "📂 Chọn file Excel Config"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div
            className={`rounded-xl border p-6 shadow-lg transition-all ${
              isReady
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-white/10 bg-white/5 opacity-70"
            }`}>
            <h2 className="text-lg font-semibold mb-2">2. Triển khai</h2>
            <p className="text-sm text-slate-400 mb-4">
              Hệ thống sẽ tạo Container và tự động nhập liệu.
            </p>

            <button
              onClick={handleDeploy}
              disabled={!isReady || deploying}
              className="w-full py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20 transition disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed">
              {isReady ? "🚀 Deploy System" : "Chưa sẵn sàng"}
            </button>
          </div>
        </div>

        {/* Right Column: Preview Data */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-white/5 p-6 shadow-lg min-h-125">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            Dữ liệu xem trước
            {tenant.schoolConfig && (
              <span className="text-xs bg-indigo-500 px-2 py-0.5 rounded text-white">
                Đã parse
              </span>
            )}
          </h2>

          {!tenant.schoolConfig ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-white/5 rounded-lg">
              <span className="text-4xl mb-2">📊</span>
              <p>Chưa có dữ liệu cấu hình.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Bảng Lớp học (Teams) */}
              <div>
                <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-3">
                  Danh sách Lớp (Teams):{" "}
                  {tenant.schoolConfig.teams?.length || 0}
                </h3>
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/10 text-slate-200">
                      <tr>
                        <th className="px-4 py-2">Mã Lớp</th>
                        <th className="px-4 py-2">Tên hiển thị</th>
                        <th className="px-4 py-2">Sĩ số (Excel)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {tenant.schoolConfig.teams?.map((team) => (
                        <tr key={team.code} className="hover:bg-white/5">
                          <td className="px-4 py-2 font-mono text-emerald-400">
                            {team.code}
                          </td>
                          <td className="px-4 py-2">{team.name}</td>
                          <td className="px-4 py-2 text-slate-400">
                            {classUserCount[team.code] ?? 0} TV
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bảng Môn học (Channels) */}
              <div>
                <h3 className="text-sm font-bold text-pink-400 uppercase tracking-wider mb-3">
                  Môn học & Kênh (Channels):{" "}
                  {tenant.schoolConfig.channels?.length || 0}
                </h3>
                <div className="overflow-x-auto rounded-lg border border-white/10">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/10 text-slate-200">
                      <tr>
                        <th className="px-4 py-2">Mã Kênh</th>
                        <th className="px-4 py-2">Tên Kênh</th>
                        <th className="px-4 py-2">Loại</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {tenant.schoolConfig.channels?.map((ch) => (
                        <tr key={ch.code} className="hover:bg-white/5">
                          <td className="px-4 py-2 font-mono text-pink-400">
                            {ch.code}
                          </td>
                          <td className="px-4 py-2">{ch.name}</td>
                          <td className="px-4 py-2">
                            {ch.type === "P" ? (
                              <span className="text-xs bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded">
                                Riêng tư (P)
                              </span>
                            ) : (
                              <span className="text-xs bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                                Công khai (O)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Thống kê User */}
              <div className="pt-4 border-t border-white/10 text-slate-400 text-sm">
                Tổng số người dùng trong file:{" "}
                <span className="text-white font-bold">
                  {tenant.schoolConfig.users?.length || 0}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal */}
      {successModal.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-emerald-500/30 bg-slate-900 p-8 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center gap-3 text-emerald-400 mb-4">
              <div className="p-2 bg-emerald-500/20 rounded-full text-2xl">
                🎉
              </div>
              <h3 className="text-2xl font-bold text-white">
                Triển khai thành công!
              </h3>
            </div>

            <p className="text-slate-300 mb-6">
              Website trường học đã được khởi tạo và nhập liệu tự động.
            </p>

            <div className="bg-black/30 rounded-xl p-4 space-y-3 border border-white/10">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-slate-400">URL truy cập:</span>
                <a
                  href={baseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 font-mono hover:underline">
                  {baseUrl}
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tài khoản Admin:</span>
                <span className="text-white font-mono select-all">
                  sysadmin
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Mật khẩu:</span>
                <span className="text-emerald-400 font-mono font-bold select-all">
                  {successModal.adminPassword}
                </span>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setSuccessModal({ visible: false })}
                className="rounded-lg bg-slate-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-600 transition">
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
