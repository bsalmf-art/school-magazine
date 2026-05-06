import { useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { Mail, CheckCircle2 } from "lucide-react";

const SubscribePage = () => {
  const [form, setForm] = useState({ name: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) {
      toast.error("يرجى إدخال البريد الإلكتروني");
      return;
    }
    setLoading(true);
    try {
      await api.post("/subscriptions", form);
      toast.success("تم الاشتراك بنجاح");
      setDone(true);
      setForm({ name: "", email: "" });
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        "حدث خطأ، تحقّق من البريد وحاول مرّة أخرى";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="subscribe-page">
      <header className="bg-[#C2A878] text-[#2D332F] paper-grain">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-20">
          <Mail size={36} className="mb-6" />
          <p className="text-xs tracking-[0.4em] uppercase mb-3 text-[#2D332F]/70">
            ابقَ على اطّلاع
          </p>
          <h1 className="font-display text-5xl md:text-6xl mb-5">
            الاشتراك في المجلة
          </h1>
          <p className="text-lg leading-loose max-w-2xl text-[#2D332F]/90">
            نُرسل إليك كلّ عدد جديد فور صدوره، مع أبرز المقالات والتنبيهات
            المهمّة من المدرسة، مباشرةً إلى البريد.
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 lg:px-10 py-16">
        {done ? (
          <div
            className="bg-white border border-[#E2DAC8] rounded-2xl p-10 text-center"
            data-testid="subscribe-success"
          >
            <CheckCircle2 size={56} className="text-[#8B9D83] mx-auto mb-4" />
            <h2 className="font-display text-3xl text-[#2D332F] mb-3">
              تمّ الاشتراك بنجاح
            </h2>
            <p className="text-[#5C6660] leading-loose mb-6">
              تم تسجيل البريد في قائمة المشتركين. سنوافيك بكلّ جديد بإذن الله.
            </p>
            <button
              onClick={() => setDone(false)}
              data-testid="subscribe-another"
              className="btn-pill btn-outline"
            >
              تسجيل بريد آخر
            </button>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="space-y-5 bg-white border border-[#E2DAC8] rounded-2xl p-8 lg:p-10"
            data-testid="subscribe-form"
          >
            <div>
              <label className="block text-sm font-semibold text-[#2D332F] mb-2">
                الاسم (اختياري)
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                data-testid="subscribe-name"
                className="w-full px-4 py-3 rounded-lg bg-[#FAF8F5] border border-[#E2DAC8] focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 outline-none"
                placeholder="الاسم"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2D332F] mb-2">
                البريد الإلكتروني <span className="text-[#987239]">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                data-testid="subscribe-email"
                className="w-full px-4 py-3 rounded-lg bg-[#FAF8F5] border border-[#E2DAC8] focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 outline-none"
                placeholder="example@email.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              data-testid="subscribe-submit"
              className="btn-pill btn-primary w-full justify-center disabled:opacity-50"
            >
              {loading ? "جارٍ الاشتراك..." : "اشترك الآن"}
            </button>
            <p className="text-xs text-[#5C6660] text-center leading-loose">
              لن نُشارك البريد مع أحد، ويمكنك إلغاء الاشتراك في أي وقت.
            </p>
          </form>
        )}
      </main>
    </div>
  );
};

export default SubscribePage;
