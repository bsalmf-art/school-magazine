import { useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { Send, Star } from "lucide-react";

const OpinionPage = () => {
  const [form, setForm] = useState({ name: "", rating: 5, message: "" });
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      toast.error("يرجى تعبئة الاسم والرسالة");
      return;
    }
    setLoading(true);
    try {
      await api.post("/opinions", form);
      toast.success("شكراً لرأيك القيّم");
      setForm({ name: "", rating: 5, message: "" });
    } catch (err) {
      toast.error("حدث خطأ، حاول مرّة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="opinion-page">
      <header className="bg-[#2D332F] text-[#FAF8F5] paper-grain">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-20">
          <Star size={36} className="mb-6 text-[#D4A373]" />
          <p className="text-xs tracking-[0.4em] uppercase mb-3 text-[#C2A878]">
            رأيك يصنع الفرق
          </p>
          <h1 className="font-display text-5xl md:text-6xl mb-5">رأيك يهمنا</h1>
          <p className="text-lg leading-loose opacity-90 max-w-2xl">
            نسعى دائماً لتطوير هذه المجلة لتكون قريبةً منكم. أخبرنا عن تجربتك
            معنا في كلمات قصيرة.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 lg:px-10 py-16">
        <form
          onSubmit={onSubmit}
          className="space-y-6 bg-white border border-[#E2DAC8] rounded-2xl p-8 lg:p-10"
          data-testid="opinion-form"
        >
          <div>
            <label className="block text-sm font-semibold text-[#2D332F] mb-2">
              الاسم <span className="text-[#987239]">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              data-testid="opinion-name"
              className="w-full px-4 py-3 rounded-lg bg-[#FAF8F5] border border-[#E2DAC8] focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 outline-none"
              placeholder="اسمك"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2D332F] mb-3">
              التقييم
            </label>
            <div className="flex gap-2" data-testid="opinion-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setForm({ ...form, rating: star })}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  data-testid={`opinion-rating-${star}`}
                  aria-label={`${star} نجوم`}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={
                      (hover || form.rating) >= star
                        ? "fill-[#D4A373] text-[#D4A373]"
                        : "text-[#E2DAC8]"
                    }
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2D332F] mb-2">
              رسالتك <span className="text-[#987239]">*</span>
            </label>
            <textarea
              rows={6}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              data-testid="opinion-message"
              className="w-full px-4 py-3 rounded-lg bg-[#FAF8F5] border border-[#E2DAC8] focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 outline-none resize-none"
              placeholder="ما أعجبك؟ ما الذي يمكن تطويره؟"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="opinion-submit-button"
            className="btn-pill btn-primary disabled:opacity-50"
          >
            {loading ? "جارٍ الإرسال..." : "إرسال رأيك"}
            <Send size={16} />
          </button>
        </form>
      </main>
    </div>
  );
};

export default OpinionPage;
