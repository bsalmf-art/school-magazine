import { useEffect, useState } from "react";
import api from "../lib/api";
import { toast } from "sonner";
import { Heart, Sparkles, BookOpen, Handshake, Lightbulb } from "lucide-react";

const REACTIONS = [
  {
    key: "love",
    label: "معجبة بالمحتوى",
    icon: Heart,
    color: "#D4A373",
    bg: "#FBE7D5",
  },
  {
    key: "inspired",
    label: "ملهمة",
    icon: Sparkles,
    color: "#987239",
    bg: "#F0E5D0",
  },
  {
    key: "useful",
    label: "مفيدة",
    icon: BookOpen,
    color: "#8B9D83",
    bg: "#E5EAE0",
  },
  {
    key: "partnership",
    label: "شراكة فعّالة",
    icon: Handshake,
    color: "#5C6660",
    bg: "#E2DAC8",
  },
  {
    key: "innovative",
    label: "فكرة جديدة",
    icon: Lightbulb,
    color: "#C2A878",
    bg: "#F4ECDB",
  },
];

const STORAGE_KEY = "voted_reactions";

const getVoted = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
};

const OpinionPage = () => {
  const [counts, setCounts] = useState({});
  const [voted, setVoted] = useState(getVoted());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    try {
      const res = await api.get("/reactions");
      const map = {};
      res.data.forEach((r) => (map[r.key] = r.count));
      setCounts(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const onClick = async (key) => {
    if (busy) return;
    setBusy(key);
    const isVoted = !!voted[key];
    try {
      const endpoint = isVoted ? `/reactions/${key}/decrement` : `/reactions/${key}`;
      const res = await api.post(endpoint);
      setCounts({ ...counts, [key]: res.data.count });
      const newVoted = { ...voted };
      if (isVoted) {
        delete newVoted[key];
        toast("تم سحب تصويتك");
      } else {
        newVoted[key] = true;
        toast.success("شكراً لتفاعلك!");
      }
      setVoted(newVoted);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newVoted));
    } catch (err) {
      toast.error("حدث خطأ، حاول مرّة أخرى");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div data-testid="opinion-page">
      <header className="bg-[#2D332F] text-[#FAF8F5] paper-grain">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-20">
          <Sparkles size={36} className="mb-6 text-[#D4A373]" />
          <p className="text-xs tracking-[0.4em] uppercase mb-3 text-[#C2A878]">
            رأيك يصنع الفرق
          </p>
          <h1 className="font-display text-5xl md:text-6xl mb-5">رأيك يهمنا</h1>
          <p className="text-lg leading-loose opacity-90 max-w-2xl">
            انقري على الأيقونة التي تُعبّر عن انطباعك بعد قراءة المجلة. تصويتك
            يُساعدنا في تطوير المحتوى ليكون أقرب إلى قلبك.
          </p>
          {!loading && (
            <p
              className="mt-6 text-sm text-[#C2A878]"
              data-testid="reactions-total"
            >
              مجموع التفاعلات حتى الآن: <span className="font-bold">{total}</span>
            </p>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-10 py-16">
        {loading ? (
          <p className="text-center text-[#5C6660]">جارٍ التحميل...</p>
        ) : (
          <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6"
            data-testid="reactions-grid"
          >
            {REACTIONS.map((r) => {
              const Icon = r.icon;
              const count = counts[r.key] || 0;
              const isVoted = !!voted[r.key];
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <button
                  key={r.key}
                  onClick={() => onClick(r.key)}
                  disabled={busy === r.key}
                  data-testid={`reaction-${r.key}`}
                  className={`group relative overflow-hidden rounded-2xl p-7 border-2 transition-all duration-300 hover:-translate-y-1 ${
                    isVoted
                      ? "border-[#2D332F] bg-white shadow-lg"
                      : "border-[#E2DAC8] bg-white hover:border-[#C2A878]"
                  }`}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: r.bg }}
                  >
                    <Icon
                      size={26}
                      style={{ color: r.color }}
                      fill={isVoted ? r.color : "none"}
                    />
                  </div>
                  <p className="font-display text-lg text-[#2D332F] mb-2">
                    {r.label}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-3xl font-bold"
                      style={{ color: r.color }}
                      data-testid={`reaction-count-${r.key}`}
                    >
                      {count}
                    </span>
                    {total > 0 && (
                      <span className="text-xs text-[#5C6660]">
                        ({pct}%)
                      </span>
                    )}
                  </div>
                  {isVoted && (
                    <span className="absolute top-3 start-3 text-[10px] tracking-widest text-[#2D332F] uppercase">
                      ✓ صوّتت
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <p className="mt-12 text-sm text-[#5C6660] text-center leading-loose">
          يمكنك التصويت لأي عدد من الأيقونات. انقري مرّة أخرى لسحب تصويتك.
        </p>
      </main>
    </div>
  );
};

export default OpinionPage;
