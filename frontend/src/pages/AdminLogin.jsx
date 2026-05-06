import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { toast } from "sonner";
import { Lock } from "lucide-react";

const AdminLogin = () => {
  const [creds, setCreds] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/admin/login", creds);
      localStorage.setItem("admin_token", res.data.token);
      toast.success("تم تسجيل الدخول");
      navigate("/admin");
    } catch (err) {
      toast.error("بيانات الدخول غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-[80vh] flex items-center justify-center px-6"
      data-testid="admin-login-page"
    >
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-white border border-[#E2DAC8] rounded-2xl p-10"
        data-testid="admin-login-form"
      >
        <div className="w-12 h-12 rounded-full bg-[#2D332F] text-[#FAF8F5] flex items-center justify-center mb-6">
          <Lock size={18} />
        </div>
        <h1 className="font-display text-3xl text-[#2D332F] mb-2">
          إدارة المجلة
        </h1>
        <p className="text-sm text-[#5C6660] mb-8">
          تسجيل الدخول للوحة التحكم
        </p>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#2D332F] mb-2">
              اسم المستخدم
            </label>
            <input
              type="text"
              value={creds.username}
              onChange={(e) => setCreds({ ...creds, username: e.target.value })}
              data-testid="admin-username"
              autoComplete="username"
              className="w-full px-4 py-3 rounded-lg bg-[#FAF8F5] border border-[#E2DAC8] focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#2D332F] mb-2">
              كلمة المرور
            </label>
            <input
              type="password"
              value={creds.password}
              onChange={(e) => setCreds({ ...creds, password: e.target.value })}
              data-testid="admin-password"
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-lg bg-[#FAF8F5] border border-[#E2DAC8] focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            data-testid="admin-login-submit"
            className="btn-pill btn-primary w-full justify-center disabled:opacity-50"
          >
            {loading ? "جارٍ الدخول..." : "تسجيل الدخول"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminLogin;
