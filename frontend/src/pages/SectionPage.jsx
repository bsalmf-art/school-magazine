import { useEffect, useState, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import api, {
  SECTION_LABELS,
  SECTION_DESCRIPTIONS,
  SECTION_IMAGES,
} from "../lib/api";
import { ArticleCard } from "../components/ArticleCard";
import { toast } from "sonner";
import { Send, Plus } from "lucide-react";

const VoicePostForm = ({ onCreated }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ author: "", title: "", content: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 3 || form.content.trim().length < 5) {
      toast.error("يُرجى كتابة عنوان وموضوع كافيَين");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post("/voice/posts", {
        title: form.title.trim(),
        content: form.content.trim(),
        author: form.author.trim() || "ولي أمر",
      });
      toast.success("تم نشر مشاركتكِ");
      setForm({ author: "", title: "", content: "" });
      setOpen(false);
      onCreated && onCreated(res.data);
    } catch (err) {
      toast.error("حدث خطأ، حاولي مرّة أخرى");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <div
        className="bg-[#F0EBE1] border border-[#E2DAC8] rounded-2xl p-6 lg:p-8 mb-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
        data-testid="voice-post-cta"
      >
        <div>
          <p className="font-display text-2xl text-[#2D332F] mb-1">
            اكتبي موضوعكِ
          </p>
          <p className="text-sm text-[#5C6660]">
            شاركي رأيكِ أو موضوعكِ مع بقيّة الأمهات، وستظهر تحته أزرار التصويت
            والإعجاب.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          data-testid="open-voice-post"
          className="btn-pill btn-primary shrink-0"
        >
          <Plus size={16} />
          مشاركة جديدة
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-[#E2DAC8] rounded-2xl p-6 lg:p-8 mb-12 space-y-4"
      data-testid="voice-post-form"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl text-[#2D332F]">مشاركة جديدة</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-[#5C6660] hover:text-[#2D332F]"
          data-testid="close-voice-post"
        >
          إلغاء
        </button>
      </div>
      <input
        type="text"
        placeholder="اسمكِ (اختياري)"
        value={form.author}
        onChange={(e) => setForm({ ...form, author: e.target.value })}
        data-testid="voice-author"
        className="w-full px-4 py-3 rounded-lg bg-[#FAF8F5] border border-[#E2DAC8] focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 outline-none"
      />
      <input
        type="text"
        placeholder="عنوان الموضوع"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        data-testid="voice-title"
        className="w-full px-4 py-3 rounded-lg bg-[#FAF8F5] border border-[#E2DAC8] focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 outline-none"
      />
      <textarea
        rows={6}
        placeholder="اكتبي موضوعكِ بحرّية..."
        value={form.content}
        onChange={(e) => setForm({ ...form, content: e.target.value })}
        data-testid="voice-content"
        className="w-full px-4 py-3 rounded-lg bg-[#FAF8F5] border border-[#E2DAC8] focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 outline-none resize-none"
      />
      <button
        type="submit"
        disabled={busy}
        data-testid="submit-voice-post"
        className="btn-pill btn-primary disabled:opacity-50"
      >
        {busy ? "جارٍ النشر..." : "نشر المشاركة"}
        <Send size={16} />
      </button>
    </form>
  );
};

const SectionPage = () => {
  const { section } = useParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const isValid = Boolean(SECTION_LABELS[section]);
  const isVoice = section === "voice";

  const load = useCallback(async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      const res = await api.get(`/articles?section=${section}`);
      setArticles(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [section, isValid]);

  useEffect(() => {
    load();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [load]);

  if (!isValid) {
    return <Navigate to="/" replace />;
  }

  return (
    <div data-testid={`section-page-${section}`}>
      <header className="relative paper-grain overflow-hidden">
        <img
          src={SECTION_IMAGES[section]}
          alt={SECTION_LABELS[section]}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[#2D332F]/85 via-[#2D332F]/55 to-[#2D332F]/85" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-24 text-[#FAF8F5]">
          <p className="text-xs tracking-[0.4em] text-[#D4A373] uppercase mb-4">
            قسم
          </p>
          <h1 className="font-display text-5xl md:text-6xl">
            {SECTION_LABELS[section]}
          </h1>
          <p className="mt-5 text-lg max-w-2xl leading-loose opacity-90">
            {SECTION_DESCRIPTIONS[section]}
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        {isVoice && (
          <VoicePostForm onCreated={(post) => setArticles([post, ...articles])} />
        )}

        {loading && (
          <p className="text-center text-[#5C6660]">جارٍ التحميل...</p>
        )}

        {!loading && articles.length === 0 && (
          <div
            className="rounded-2xl border border-[#E2DAC8] bg-white p-12 lg:p-16 text-center"
            data-testid="section-empty"
          >
            <h2 className="font-display text-3xl text-[#2D332F] mb-3">
              {SECTION_LABELS[section]}
            </h2>
            <p className="text-[#5C6660] max-w-md mx-auto leading-loose">
              {isVoice
                ? "كوني أوّل مَن يبدأ النقاش هنا ✨"
                : "ستظهر هنا المقالات فور إضافتها."}
            </p>
          </div>
        )}

        {!loading && articles.length > 0 && (
          <div
            className={
              isVoice
                ? "grid md:grid-cols-2 gap-6"
                : "grid md:grid-cols-2 lg:grid-cols-3 gap-12"
            }
          >
            {articles.map((a, i) => (
              <ArticleCard key={a.id} article={a} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SectionPage;
