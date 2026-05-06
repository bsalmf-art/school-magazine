import { useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { Send, MessageCircle } from "lucide-react";

const SuggestionsPage = () => {
  const [form, setForm] = useState({
    parent_name: "",
    student_name: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm({ ...form, [k]: v });

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.parent_name.trim() || !form.subject.trim() || !form.message.trim()) {
      toast.error("يرجى تعبئة الحقول المطلوبة");
      return;
    }
    setLoading(true);
    try {
      await api.post("/suggestions", form);
      toast.success("تم إرسال اقتراحك بنجاح، شكراً لتواصلك معنا");
      setForm({ parent_name: "", student_name: "", subject: "", message: "" });
    } catch (err) {
      toast.error("حدث خطأ، حاول مرّة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="suggestions-page">
      <header className="bg-[#8B9D83] text-[#FAF8F5] paper-grain">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-20">
          <MessageCircle size={36} className="mb-6 opacity-80" />
          <p className="text-xs tracking-[0.4em] uppercase mb-3 opacity-80">
            صوتكم في قلب القرار
          </p>
          <h1 className="font-display text-5xl md:text-6xl mb-5">
            مقترحات أولياء الأمور
          </h1>
          <p className="text-lg leading-loose opacity-90 max-w-2xl">
            نُؤمن أن الشراكة بين البيت والمدرسة هي الأساس. شاركنا اقتراحك أو
            ملاحظتك، وسنناقشها بكلّ اهتمام.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 lg:px-10 py-16">
        <form
          onSubmit={onSubmit}
          className="space-y-6 bg-white border border-[#E2DAC8] rounded-2xl p-8 lg:p-10"
          data-testid="suggestions-form"
        >
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#2D332F] mb-2">
                اسم ولي الأمر <span className="text-[#987239]">*</span>
              </label>
              <input
                type="text"
                value={form.parent_name}
                onChange={(e) => update("parent_name", e.target.value)}
                data-testid="suggestion-parent-name"
                className="w-full px-4 py-3 rounded-lg bg-[#FAF8F5] border border-[#E2DAC8] focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 outline-none text-[#2D332F]"
                placeholder="الاسم الكريم"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#2D332F] mb-2">
                اسم الطالبة (اختياري)
              </label>
              <input
                type="text"
                value={form.student_name}
                onChange={(e) => update("student_name", e.target.value)}
                data-testid="suggestion-student-name"
                className="w-full px-4 py-3 rounded-lg bg-[#FAF8F5] border border-[#E2DAC8] focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 outline-none text-[#2D332F]"
                placeholder="اسم ابنتك"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2D332F] mb-2">
              عنوان الاقتراح <span className="text-[#987239]">*</span>
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              data-testid="suggestion-subject"
              className="w-full px-4 py-3 rounded-lg bg-[#FAF8F5] border border-[#E2DAC8] focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 outline-none text-[#2D332F]"
              placeholder="عنوان مختصر يصف اقتراحك"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2D332F] mb-2">
              تفاصيل الاقتراح <span className="text-[#987239]">*</span>
            </label>
            <textarea
              rows={7}
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              data-testid="suggestion-message"
              className="w-full px-4 py-3 rounded-lg bg-[#FAF8F5] border border-[#E2DAC8] focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 outline-none text-[#2D332F] resize-none"
              placeholder="اكتب اقتراحك أو ملاحظتك بحرّية..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            data-testid="suggestion-submit-button"
            className="btn-pill btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "جارٍ الإرسال..." : "إرسال الاقتراح"}
            <Send size={16} />
          </button>
        </form>

        <p className="mt-8 text-sm text-[#5C6660] text-center leading-loose">
          ستُعامَل بياناتك بسرّية تامّة، ولن تُستخدم إلا لأغراض التواصل ومتابعة
          الاقتراح.
        </p>
      </main>
    </div>
  );
};

export default SuggestionsPage;
