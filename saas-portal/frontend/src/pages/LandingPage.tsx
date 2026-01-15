import { type FormEvent, useMemo, useState, useEffect } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  School,
  BookOpen,
  Library,
  Shield, // For 'Security' feature
  Users, // For 'Management' feature
  Zap, // For 'AI' feature
  Menu,
  X,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { env } from "../environment";
import { useNavigate } from "react-router-dom";

// --- Types & Form Logic (Preserved) ---
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll effect for navbar
  const { scrollY } = useScroll();
  const headerBgOpacity = useTransform(scrollY, [0, 50], [0, 0.9]);
  const headerBackdropBlur = useTransform(scrollY, [0, 50], ["0px", "8px"]);
  const headerShadow = useTransform(
    scrollY,
    [0, 50],
    ["none", "0 4px 6px -1px rgb(0 0 0 / 0.1)"]
  );

  const isValid = useMemo(
    () => form.schoolName && form.contactName && form.email && form.phone,
    [form]
  );

  const handleChange = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const navigate = useNavigate();

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

  const scrollToRegister = () => {
    document.getElementById("register")?.scrollIntoView({ behavior: "smooth" });
  };

  const navigateToLogin = () => {
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-brand-bg text-slate-900 font-sans selection:bg-brand-primary/20">
      {/* 1. HEADER */}
      <motion.header
        style={{
          backgroundColor: useTransform(
            headerBgOpacity,
            (v) => `rgba(255, 255, 255, ${v})`
          ),
          backdropFilter: useTransform(headerBackdropBlur, (v) => `blur(${v})`),
          boxShadow: headerShadow,
        }}
        className="fixed top-0 left-0 right-0 z-50 h-20 transition-all border-b border-transparent data-[scrolled=true]:border-slate-200/50">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-primary text-white">
              <School size={20} />
            </div>
            <span className="text-xl font-bold text-brand-primary tracking-tight">
              EduSaaS
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a
              href="#features"
              className="hover:text-brand-primary transition-colors">
              Features
            </a>
            <a
              href="#pricing"
              className="hover:text-brand-primary transition-colors">
              Pricing
            </a>
            <a
              href="#about"
              className="hover:text-brand-primary transition-colors">
              About
            </a>
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={navigateToLogin}
              className="cursor-pointer text-sm font-semibold text-slate-600 hover:text-brand-primary transition-colors">
              Login
            </button>
            <button
              onClick={scrollToRegister}
              className="rounded-full bg-brand-accent px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-accent/20 transition-all hover:-translate-y-0.5 hover:shadow-brand-accent/40">
              Get Started
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-slate-600"
            onClick={() => setMobileMenuOpen(true)}>
            <Menu />
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            className="fixed inset-0 z-60 bg-white p-6 md:hidden">
            <div className="flex items-center justify-between mb-8">
              <span className="text-xl font-bold text-brand-primary">
                EduSaaS
              </span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="text-slate-600" />
              </button>
            </div>
            <div className="flex flex-col gap-6 text-lg font-medium text-slate-700">
              <a href="#features" onClick={() => setMobileMenuOpen(false)}>
                Features
              </a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>
                Pricing
              </a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)}>
                About
              </a>
              <hr className="border-slate-100" />
              <button className="text-left">Login</button>
              <button
                onClick={() => {
                  scrollToRegister();
                  setMobileMenuOpen(false);
                }}
                className="text-brand-accent font-bold">
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-20">
        {/* 2. HERO SECTION */}
        <section className="relative overflow-hidden pt-16 pb-24 lg:pt-32 lg:pb-40">
          {/* Background Gradient */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,var(--color-brand-secondary)_0%,transparent_60%)] -z-10 opacity-60" />

          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              {/* Text Content */}
              <motion.div
                className="flex-1 text-center lg:text-left"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}>
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-secondary/50 border border-brand-secondary px-3 py-1 text-xs font-bold text-brand-primary mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
                  </span>
                  New: AI Assistant v2.0
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-brand-primary leading-[1.15] mb-6">
                  Chuyển đổi số trường học với nền tảng an toàn tuyệt đối
                </h1>
                <p className="text-lg lg:text-xl text-slate-500 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Giải pháp giao tiếp và quản lý tập trung. Triển khai trong 5
                  phút. Tích hợp công cụ hỗ trợ giảng dạy AI thế hệ mới.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <button
                    onClick={scrollToRegister}
                    className="w-full sm:w-auto h-12 px-8 rounded-full bg-brand-accent text-white font-bold text-lg shadow-xl shadow-brand-accent/20 transition-transform hover:-translate-y-1 flex items-center justify-center gap-2">
                    Bắt đầu ngay <ChevronRight size={18} />
                  </button>
                  <button className="w-full sm:w-auto h-12 px-8 rounded-full bg-white text-slate-700 font-semibold border border-slate-200 hover:bg-slate-50 transition-colors">
                    Xem Demo
                  </button>
                </div>
              </motion.div>

              {/* Visual/Mockup */}
              <motion.div
                className="flex-1 w-full max-w-xl lg:max-w-none"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}>
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 6,
                    ease: "easeInOut",
                  }}
                  className="relative aspect-4/3 rounded-2xl bg-white shadow-2xl border border-slate-100 p-2 lg:p-4">
                  {/* Fake UI Dashboard */}
                  <div className="h-full w-full rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex flex-col">
                    <div className="h-10 border-b border-slate-200 bg-white flex items-center px-4 gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80"></div>
                      </div>
                      <div className="ml-4 w-32 h-4 rounded-full bg-slate-100"></div>
                    </div>
                    <div className="flex-1 flex">
                      <div className="w-16 border-r border-slate-200 bg-white hidden sm:flex flex-col items-center py-4 gap-4">
                        <div className="w-8 h-8 rounded-lg bg-brand-primary/10"></div>
                        <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
                        <div className="w-8 h-8 rounded-lg bg-slate-100"></div>
                      </div>
                      <div className="flex-1 p-6">
                        <div className="flex justify-between items-center mb-6">
                          <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
                          <div className="h-8 w-24 bg-brand-secondary rounded-lg"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="h-24 bg-white rounded-xl shadow-sm border border-slate-100 p-4"></div>
                          <div className="h-24 bg-white rounded-xl shadow-sm border border-slate-100 p-4"></div>
                        </div>
                        <div className="h-32 bg-white rounded-xl shadow-sm border border-slate-100 p-4"></div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Badge */}
                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{
                      repeat: Infinity,
                      duration: 4,
                      ease: "easeInOut",
                      delay: 1,
                    }}
                    className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-4 flex items-center gap-3 border border-slate-50">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <LayoutDashboard size={20} />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-semibold uppercase">
                        Active Tenants
                      </div>
                      <div className="text-lg font-bold text-slate-800">
                        100+
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* 3. TRUST/LOGOS */}
        <section className="py-10 border-y border-slate-100 bg-slate-50/50">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-8">
              Tin cậy bởi 100+ tổ chức giáo dục hàng đầu
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-60 grayscale transition-all duration-500 hover:grayscale-0 hover:opacity-100">
              <div className="flex items-center gap-2">
                <School size={32} />
                <span className="text-xl font-bold">EduTech</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={32} />
                <span className="text-xl font-bold">UniStack</span>
              </div>
              <div className="flex items-center gap-2">
                <Library size={32} />
                <span className="text-xl font-bold">AcademyPlus</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={32} />
                <span className="text-xl font-bold">SchoolHub</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. FEATURES GRID */}
        <section id="features" className="py-24 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold text-brand-primary mb-4">
                Mọi thứ bạn cần để vận hành
              </h2>
              <p className="text-slate-500 text-lg">
                Hệ sinh thái công cụ toàn diện giúp tối ưu hóa quy trình quản lý
                và nâng cao trải nghiệm giảng dạy.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Shield,
                  title: "An toàn tuyệt đối",
                  desc: "Dữ liệu mỗi trường được mã hóa và lưu trữ độc lập (Multi-tenant isolation). Tuân thủ GDPR.",
                },
                {
                  icon: Users,
                  title: "Quản lý tập trung",
                  desc: "Dashboard trực quan cho phép quản trị viên theo dõi toàn bộ hoạt động của giáo viên và học sinh.",
                },
                {
                  icon: Zap,
                  title: "Tích hợp AI",
                  desc: "Trợ lý ảo hỗ trợ soạn bài giảng, tự động trả lời câu hỏi phụ huynh và tổng hợp báo cáo.",
                },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -5 }}
                  className="bg-brand-bg rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-brand-secondary/40 transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl bg-brand-secondary text-brand-primary flex items-center justify-center mb-6">
                    <feature.icon size={24} strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-500 leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. REGISTRATION (REDESIGNED) */}
        <section
          id="register"
          className="py-24 bg-slate-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-secondary/30 -skew-x-12 translate-x-32" />

          <div className="mx-auto max-w-5xl px-6 relative z-10">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
              <div className="grid lg:grid-cols-5">
                <div className="lg:col-span-2 bg-brand-primary p-10 text-white flex flex-col justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">
                      Sẵn sàng trải nghiệm?
                    </h2>
                    <p className="text-white/80 leading-relaxed mb-6">
                      Đăng ký ngay hôm nay để nhận tư vấn và dùng thử miễn phí
                      trong 14 ngày.
                    </p>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />{" "}
                        Setup trong 5 phút
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />{" "}
                        Không cần thẻ tín dụng
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />{" "}
                        Hỗ trợ 24/7
                      </li>
                    </ul>
                  </div>
                  <div className="mt-8 text-white/40 text-sm">
                    © EduSaaS Inc.
                  </div>
                </div>

                <div className="lg:col-span-3 p-10">
                  {success ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                        <Shield size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">
                        Đăng ký thành công!
                      </h3>
                      <p className="text-slate-500">{success}</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Tên trường
                          </label>
                          <input
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all placeholder:text-slate-300"
                            placeholder="VD: THPT Marie Curie"
                            value={form.schoolName}
                            onChange={(e) =>
                              handleChange("schoolName")(e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Người liên hệ
                          </label>
                          <input
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all placeholder:text-slate-300"
                            placeholder="Nguyễn Văn A"
                            value={form.contactName}
                            onChange={(e) =>
                              handleChange("contactName")(e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Email làm việc
                          </label>
                          <input
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all placeholder:text-slate-300"
                            type="email"
                            placeholder="name@school.edu.vn"
                            value={form.email}
                            onChange={(e) =>
                              handleChange("email")(e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Số điện thoại
                          </label>
                          <input
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all placeholder:text-slate-300"
                            placeholder="0912..."
                            value={form.phone}
                            onChange={(e) =>
                              handleChange("phone")(e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Nhu cầu (Tùy chọn)
                        </label>
                        <textarea
                          rows={3}
                          className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 outline-none transition-all placeholder:text-slate-300"
                          placeholder="Chúng tôi đang cần..."
                          value={form.note}
                          onChange={(e) => handleChange("note")(e.target.value)}
                        />
                      </div>

                      {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                          {error}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={!isValid || submitting}
                        className="w-full py-3 px-6 rounded-xl bg-brand-primary text-white font-bold text-base shadow-lg hover:bg-brand-primary/90 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {submitting ? "Đang xử lý..." : "Gửi thông tin đăng ký"}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 6. FOOTER */}
      <footer className="bg-brand-primary text-white pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
                  <School size={20} />
                </div>
                <span className="text-xl font-bold">EduSaaS</span>
              </div>
              <p className="text-white/70 max-w-sm">
                Nền tảng công nghệ giáo dục tiên phong, mang lại trải nghiệm
                quản lý và học tập tốt nhất cho tương lai.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Sản phẩm</h4>
              <ul className="space-y-2 text-white/70">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Tính năng
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Bảo mật
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Bảng giá
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Tích hợp AI
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Công ty</h4>
              <ul className="space-y-2 text-white/70">
                <li>
                  <a href="#" className="hover:text-white transition">
                    Về chúng tôi
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Liên hệ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Điều khoản
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition">
                    Chính sách
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm">
              © 2024 EduSaaS Platform. All rights reserved.
            </p>
            <div className="flex gap-4">
              {/* Social icons placeholders */}
              <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 transition cursor-pointer"></div>
              <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 transition cursor-pointer"></div>
              <div className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 transition cursor-pointer"></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
