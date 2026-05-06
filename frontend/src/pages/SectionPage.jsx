import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import api, { SECTION_LABELS } from "../lib/api";
import { ArticleCard } from "../components/ArticleCard";

const SectionPage = () => {
  const { section } = useParams();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const isValid = Boolean(SECTION_LABELS[section]);

  useEffect(() => {
    if (!isValid) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/articles?section=${section}`);
        setArticles(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [section, isValid]);

  if (!isValid) {
    return <Navigate to="/" replace />;
  }

  return (
    <div data-testid={`section-page-${section}`}>
      <header className="bg-[#F0EBE1] paper-grain">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20">
          <p className="text-xs tracking-[0.4em] text-[#987239] uppercase mb-4">
            قسم
          </p>
          <h1 className="font-display text-5xl md:text-6xl text-[#2D332F]">
            {SECTION_LABELS[section]}
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        {loading && (
          <p className="text-center text-[#5C6660]">جارٍ التحميل...</p>
        )}
        {!loading && articles.length === 0 && (
          <p
            className="text-center text-[#5C6660] py-20"
            data-testid="section-empty"
          >
            لا توجد مقالات في هذا القسم بعد. عُد قريباً!
          </p>
        )}
        {!loading && articles.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
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
