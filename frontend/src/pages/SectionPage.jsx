import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Navigate } from "react-router-dom";
import api, {
  SECTION_LABELS,
  SECTION_DESCRIPTIONS,
  SECTION_IMAGES,
} from "../lib/api";
import { ArticleCard } from "../components/ArticleCard";
import { toast } from "sonner";
import { Send, Plus, ImagePlus, Smile, X } from "lucide-react";

const EMOJIS = [
  "💛", "🌟", "✨", "📚", "🌸", "🌷", "🌿", "💐", "🌼", "🌹",
  "🤍", "💞", "🌷", "🌟", "🎓", "🏫", "📖", "📝", "✍️", "💡",
  "🎉", "🎊", "🏆", "🥇", "👑", "💪", "🤝", "🙌", "👏", "❤️",
  "😊", "😍", "🥰", "🤩", "😇", "🌞", "☀️", "🌈", "🌊", "🦋",
];

const PostForm = ({ section, onCreated }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ author: "", title: "", content: "" });
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const contentRef = useRef(null);

  const reset = () => {
    setForm({ author: "", title: "", content: "" });
    setImageUrl("");
    setShowEmoji(false);
  };

  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("الحجم الأقصى للصورة 5 ميغابايت");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/uploads", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const fullUrl = process.env.REACT_APP_BACKEND_URL + res.data.url;
      setImageUrl(fullUrl);
      toast.success("تم رفع الصورة");
    } catch (err) {
      toast.error("تعذّر رفع الصورة");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const insertEmoji = (emoji) => {
    const el = contentRef.current;
    if (!el) {
      setForm({ ...form, content: form.content + emoji });
    } else {
      const start = el.selectionStart ?? form.content.length;
      const end = el.selectionEnd ?? form.content.length;
      const newContent =
        form.content.slice(0, start) + emoji + form.content.slice(end);
      setForm({ ...form, content: newContent });
      setTimeout(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = start + emoji.length;
      }, 0);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 3 || form.content.trim().length < 5) {
      toast.error("يُرجى كتابة عنوان وموضوع كافيَين");
      return;
    }
    setBusy(true);
    try {
      const res = await api.post(`/sections/${section}/posts`, {
        title: form.title.trim(),
        content: form.content.trim(),
        author: form.author.trim() || "ولي أمر",
        image_url: imageUrl || "",
      });
      toast.success("تم نشر مشاركتكِ");
      reset();
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
        data-testid="post-cta"
      >
        <div>
          <p className="font-display text-2xl text-[#2D332F] mb-1">
            أضيفي مشاركتكِ
          </p>
          <p className="text-sm text-[#5C6660]">
            ستظهر مشاركتكِ مع زرّ إعجاب يتفاعل به القارئات.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          data-testid="open-post-form"
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
      data-testid="post-form"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-2xl text-[#2D332F]">مشاركة جديدة</h3>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            reset();
          }}
          className="text-sm text-[#5C6660] hover:text-[#2D332F]"
          data-testid="close-post-form"
        >
          إلغاء
        </button>
      </div>

      <input
        type="text"
        placeholder="اسمكِ (اختياري)"
        value={form.author}
        onChange={(e) => setForm({ ...form, author: e.target.value })}
        data-testid="post-author"
        className="w-full px-4 py-3 rounded-lg bg-[#FAF8F5] border border-[#E2DAC8] focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 outline-none"
      />
      <input
        type="text"
        placeholder="عنوان الموضوع"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        data-testid="post-title"
        className="w-full px-4 py-3 rounded-lg bg-[#FAF8F5] border border-[#E2DAC8] focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 outline-none"
      />

      <div className="relative">
        <textarea
          ref={contentRef}
          rows={6}
          placeholder="اكتبي موضوعكِ..."
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          data-testid="post-content"
          className="w-full px-4 py-3 rounded-lg bg-[#FAF8F5] border border-[#E2DAC8] focus:border-[#8B9D83] focus:ring-2 focus:ring-[#8B9D83]/20 outline-none resize-none"
        />
        {showEmoji && (
          <div
            className="absolute z-10 mt-1 bg-white border border-[#E2DAC8] rounded-xl p-3 shadow-lg w-72"
            data-testid="emoji-picker"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-[#5C6660]">اختاري إيموجي</span>
              <button
                type="button"
                onClick={() => setShowEmoji(false)}
                className="text-[#5C6660] hover:text-[#2D332F]"
                aria-label="إغلاق"
              >
                <X size={14} />
              </button>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {EMOJIS.map((e, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => insertEmoji(e)}
                  className="text-xl p-1 rounded hover:bg-[#F0EBE1] transition-colors"
                  data-testid={`emoji-${i}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image preview */}
      {imageUrl && (
        <div className="relative inline-block" data-testid="image-preview">
          <img
            src={imageUrl}
            alt="معاينة"
            className="h-32 w-32 object-cover rounded-lg border border-[#E2DAC8]"
          />
          <button
            type="button"
            onClick={() => setImageUrl("")}
            className="absolute -top-2 -end-2 w-7 h-7 bg-[#2D332F] text-[#FAF8F5] rounded-full flex items-center justify-center"
            data-testid="remove-image"
            aria-label="إزالة الصورة"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#E2DAC8]">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={onUpload}
          className="hidden"
          data-testid="image-input"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          data-testid="add-image-button"
          className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-[#E2DAC8] hover:bg-[#F0EBE1] text-[#2D332F] disabled:opacity-50"
        >
          <ImagePlus size={16} className="text-[#987239]" />
          {uploading ? "جارٍ الرفع..." : "أضيفي صورة"}
        </button>
        <button
          type="button"
          onClick={() => setShowEmoji(!showEmoji)}
          data-testid="toggle-emoji"
          className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-[#E2DAC8] hover:bg-[#F0EBE1] text-[#2D332F]"
        >
          <Smile size={16} className="text-[#987239]" />
          إيموجي
        </button>
        <button
          type="submit"
          disabled={busy}
          data-testid="submit-post"
          className="btn-pill btn-primary disabled:opacity-50 ms-auto"
        >
          {busy ? "جارٍ النشر..." : "نشر المشاركة"}
          <Send size={16} />
        </button>
      </div>
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
        <PostForm
          section={section}
          onCreated={(post) => setArticles([post, ...articles])}
        />

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
              كوني أوّل مَن يكتب في هذا القسم ✨
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
