import { type FormEvent, useMemo, useState } from "react";
import { env } from "../environment";

type FormState = {
  schoolName: string;
  contactName: string;
  email: string;
  phone: string;
  note?: string;
};

export default function LandingPage() {
  const [form, setForm] = useState<FormState>({
    schoolName: "",
    contactName: "",
    email: "",
    phone: "",
    note: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isValid = useMemo(
    () => form.schoolName && form.contactName && form.email && form.phone,
    [form]
  );

  const handleChange = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${env.apiUrl}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        throw new Error(`Server responded ${res.status}`);
      }

      setSuccess("Cảm ơn bạn, chúng tôi sẽ liên hệ sớm!");
      setForm({
        schoolName: "",
        contactName: "",
        email: "",
        phone: "",
        note: "",
      });
    } catch (err) {
      setError("Gửi đăng ký thất bại, vui lòng thử lại.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-indigo-600/30 via-sky-500/20 to-emerald-400/10 blur-3xl" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 pb-20 pt-16 text-center">
          <p className="mb-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm font-medium text-slate-200">
            Nền tảng giao tiếp số cho trường học
          </p>
          <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl">
            Nền tảng Giao tiếp Số cho Trường học
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-200">
            Kết nối giáo viên, phụ huynh và học sinh trong một không gian an
            toàn, quản lý tập trung, tích hợp AI hỗ trợ.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#register"
              className="rounded-full bg-indigo-500 px-6 py-3 text-lg font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:bg-indigo-400">
              Đăng ký ngay
            </a>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-16 md:grid-cols-3">
        {[
          {
            title: "An toàn",
            desc: "Mã hóa và phân tách dữ liệu theo tenant.",
          },
          {
            title: "Quản lý tập trung",
            desc: "Quản trị người dùng, lớp học, thông báo từ một bảng điều khiển.",
          },
          {
            title: "Tích hợp AI",
            desc: "Gợi ý nội dung, trả lời nhanh, tổng hợp báo cáo thông minh.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 backdrop-blur">
            <h3 className="text-xl font-semibold text-white">{item.title}</h3>
            <p className="mt-3 text-slate-200">{item.desc}</p>
          </div>
        ))}
      </section>

      <section
        id="register"
        className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 px-6 py-10 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white">Đăng ký nhận tư vấn</h2>
          <p className="mt-2 text-slate-200">
            Điền thông tin để chúng tôi liên hệ và thiết lập thử nghiệm cho
            trường bạn.
          </p>
        </div>

        {success && (
          <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-100">
              Tên trường
            </label>
            <input
              value={form.schoolName}
              onChange={(e) => handleChange("schoolName")(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-indigo-500/60"
              placeholder="Trường THPT Ví Dụ"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-100">
              Người liên hệ
            </label>
            <input
              value={form.contactName}
              onChange={(e) => handleChange("contactName")(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-indigo-500/60"
              placeholder="Nguyễn Văn A"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-100">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email")(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-indigo-500/60"
              placeholder="contact@example.edu.vn"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-100">
              Số điện thoại
            </label>
            <input
              value={form.phone}
              onChange={(e) => handleChange("phone")(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-indigo-500/60"
              placeholder="0901 234 567"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-semibold text-slate-100">
              Ghi chú (tuỳ chọn)
            </label>
            <textarea
              value={form.note}
              onChange={(e) => handleChange("note")(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none ring-2 ring-transparent transition focus:ring-indigo-500/60"
              placeholder="Nhu cầu cụ thể của trường..."
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-lg font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? "Đang gửi..." : "Đăng ký ngay"}
            </button>
          </div>
        </form>
      </section>

      <footer className="mt-12 pb-12 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} SAAS Portal. All rights reserved.
      </footer>
    </div>
  );
}
