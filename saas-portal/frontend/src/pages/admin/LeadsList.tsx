import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { env } from "../../environment";

type Lead = {
  id: string;
  schoolName: string;
  contactName: string;
  email: string;
  phone: string;
  note?: string | null;
  status: string;
  createdAt: string;
};

export default function LeadsList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalLead, setModalLead] = useState<Lead | null>(null);
  const [subdomain, setSubdomain] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${env.apiUrl}/api/leads`);
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error(err);
      setError("Không tải được danh sách leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const sorted = useMemo(
    () => [...leads].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [leads]
  );

  const handleConvert = async () => {
    if (!modalLead || !subdomain) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `${env.apiUrl}/api/admin/convert-lead/${modalLead.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subdomain }),
        }
      );
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const tenant = await res.json();
      setModalLead(null);
      setSubdomain("");
      setToast("Đã tạo hồ sơ");
      await fetchLeads();
      if (tenant?.id) {
        navigate(`/admin/tenants/${tenant.id}`);
      }
    } catch (err) {
      console.error(err);
      setError("Chuyển đổi thất bại, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-sm text-slate-300">
            Danh sách đăng ký từ landing page
          </p>
        </div>
        {loading && <span className="text-sm text-slate-400">Đang tải...</span>}
      </div>

      {toast && (
        <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {toast}
        </div>
      )}

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
                "Liên hệ",
                "Email",
                "Điện thoại",
                "Trạng thái",
                "Thao tác",
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
            {sorted.map((lead) => (
              <tr key={lead.id} className="hover:bg-white/5">
                <td className="px-4 py-3 text-sm text-white">
                  {lead.schoolName}
                </td>
                <td className="px-4 py-3 text-sm text-slate-200">
                  {lead.contactName}
                </td>
                <td className="px-4 py-3 text-sm text-slate-200">
                  {lead.email}
                </td>
                <td className="px-4 py-3 text-sm text-slate-200">
                  {lead.phone}
                </td>
                <td className="px-4 py-3 text-sm text-slate-200">
                  {lead.status}
                </td>
                <td className="px-4 py-3 text-sm">
                  {lead.status === "NEW" ? (
                    <button
                      onClick={() => {
                        setModalLead(lead);
                        setSubdomain("");
                      }}
                      className="rounded-lg bg-indigo-500 px-3 py-2 text-white transition hover:bg-indigo-400">
                      Review &amp; Create Profile
                    </button>
                  ) : (
                    <span className="text-slate-400">N/A</span>
                  )}
                </td>
              </tr>
            ))}
            {sorted.length === 0 && !loading && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-6 text-center text-sm text-slate-300">
                  Chưa có lead nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-white">
              Tạo hồ sơ khách hàng mới
            </h2>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-slate-100">
                Tên trường
              </label>
              <input
                value={modalLead.schoolName}
                disabled
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white opacity-80"
              />
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-slate-100">
                Subdomain dự kiến
              </label>
              <input
                value={subdomain}
                onChange={(e) => setSubdomain(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-white outline-none ring-2 ring-transparent transition focus:ring-indigo-500/60"
                placeholder="vd: truong-abc"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setModalLead(null)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/5">
                Huỷ
              </button>
              <button
                onClick={handleConvert}
                disabled={!subdomain || submitting}
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 disabled:opacity-60">
                {submitting ? "Đang tạo..." : "Xác nhận tạo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
