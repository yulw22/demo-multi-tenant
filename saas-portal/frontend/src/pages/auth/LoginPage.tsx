import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  School,
  Building2,
  ShieldCheck,
  ArrowRight,
  Loader2,
} from "lucide-react";
import * as Tabs from "@radix-ui/react-tabs";
import { env } from "../../environment";

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("tenant");

  // --- Tenant Login State ---
  const [subdomain, setSubdomain] = useState("");

  // --- Provider Login State ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleTenantLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain) return;
    setLoading(true);

    // Simulate check or just redirect
    setTimeout(() => {
      // Setup redirection logic based on environment
      // In Dev: http://<subdomain>.localhost
      // In Prod: https://<subdomain>.yoursaas.com
      const protocol = window.location.protocol;
      const host = window.location.host; // e.g., localhost:5173 or app.saas.com

      // Simple logic for dev environment based on current context
      // Assuming port 80/443 mapping via Traefik or similar for subdomains
      const targetUrl = `${protocol}//${subdomain}.localhost`;

      window.location.href = targetUrl;
      setLoading(false);
    }, 1000);
  };

  const handleProviderLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock Login for Admin
    setTimeout(() => {
      // In a real app, verify credentials with backend here
      // const res = await fetch(`${env.apiUrl}/auth/login`, ...);

      // For now, redirect to Admin Dashboard
      navigate("/admin/leads");
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full flex bg-brand-bg font-sans">
      {/* 1. LEFT PANEL (50%) - Hidden on mobile */}
      <div className="hidden lg:flex w-1/2 bg-brand-primary relative flex-col justify-between p-12 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none">
            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
            <School size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight">EduSaaS</span>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 max-w-lg">
          <blockquote className="space-y-6">
            <div className="text-2xl font-medium leading-relaxed">
              &ldquo;Nền tảng này đã thay đổi hoàn toàn cách chúng tôi quản lý
              hồ sơ học sinh và tương tác với phụ huynh. Mọi thứ trở nên minh
              bạch và tức thời.&rdquo;
            </div>
            <footer className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <Building2 size={24} />
              </div>
              <div>
                <div className="font-bold text-lg">Nguyễn Văn Hiệu trưởng</div>
                <div className="text-brand-secondary">
                  THPT Chuyên Lê Quý Đôn
                </div>
              </div>
            </footer>
          </blockquote>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-sm text-white/50">
          © 2024 EduSaaS Platform. Secure Entra ID Integration available.
        </div>
      </div>

      {/* 2. RIGHT PANEL (Login Form) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-6 right-6 lg:hidden flex items-center gap-2 text-brand-primary">
          <School size={24} />
          <span className="font-bold text-xl">EduSaaS</span>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Chào mừng trở lại
            </h1>
            <p className="mt-2 text-slate-500">
              Vui lòng chọn vai trò để đăng nhập vào hệ thống.
            </p>
          </div>

          <Tabs.Root
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full">
            <Tabs.List className="flex w-full rounded-lg bg-slate-100 p-1 mb-8">
              <Tabs.Trigger
                value="tenant"
                className="flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium text-slate-500 transition-all hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50">
                <School size={16} />
                Nhà trường
              </Tabs.Trigger>
              <Tabs.Trigger
                value="provider"
                className="flex-1 flex items-center justify-center gap-2 rounded-md py-2.5 text-sm font-medium text-slate-500 transition-all hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-brand-primary data-[state=active]:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50">
                <ShieldCheck size={16} />
                Nhà cung cấp
              </Tabs.Trigger>
            </Tabs.List>

            {/* TAB: TENANT (SCHOOL) */}
            <Tabs.Content
              value="tenant"
              className="space-y-6 focus:outline-none">
              <form onSubmit={handleTenantLogin} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="school-domain"
                    className="block text-sm font-semibold text-slate-700">
                    Tên miền trường học
                  </label>
                  <div className="relative flex rounded-lg shadow-sm">
                    <input
                      id="school-domain"
                      type="text"
                      required
                      value={subdomain}
                      onChange={(e) => setSubdomain(e.target.value)}
                      className="block w-full rounded-l-lg border border-r-0 border-slate-300 py-3 px-4 text-slate-900 placeholder:text-slate-400 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary focus:z-10 outline-none transition-all sm:text-sm sm:leading-6"
                      placeholder="thpt-nguyentra..."
                    />
                    <span className="inline-flex items-center rounded-r-lg border border-l-0 border-slate-300 bg-slate-50 px-4 text-slate-500 sm:text-sm font-medium">
                      .edusaas.com
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Nhập subdomain trường của bạn để được chuyển hướng đến trang
                    đăng nhập riêng.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !subdomain}
                  className="group relative flex w-full justify-center rounded-lg bg-brand-primary px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-primary/30 hover:bg-brand-primary/90 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Tiếp tục đến trang trường
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </form>
            </Tabs.Content>

            {/* TAB: PROVIDER (ADMIN) */}
            <Tabs.Content
              value="provider"
              className="space-y-6 focus:outline-none">
              <form onSubmit={handleProviderLogin} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-slate-700 mb-2">
                    Email quản trị viên
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 py-3 px-4 text-slate-900 placeholder:text-slate-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all sm:text-sm sm:leading-6"
                    placeholder="admin@edusaas.com"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-slate-700">
                      Mật khẩu
                    </label>
                    <a
                      href="#"
                      className="text-sm font-semibold text-brand-primary hover:text-brand-primary/80">
                      Quên mật khẩu?
                    </a>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 py-3 px-4 text-slate-900 placeholder:text-slate-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all sm:text-sm sm:leading-6"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary cursor-pointer"
                  />
                  <label
                    htmlFor="remember-me"
                    className="ml-2 block text-sm text-slate-700 cursor-pointer">
                    Ghi nhớ thiết bị này
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email || !password}
                  className="flex w-full justify-center rounded-lg bg-brand-accent px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-accent/30 hover:bg-brand-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Đăng nhập Dashboard"
                  )}
                </button>
              </form>
            </Tabs.Content>
          </Tabs.Root>

          <div className="text-center text-sm text-slate-500">
            Bạn chưa có tài khoản?{" "}
            <a
              href="/"
              className="font-semibold text-brand-primary hover:text-brand-primary/80">
              Đăng ký dùng thử
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
