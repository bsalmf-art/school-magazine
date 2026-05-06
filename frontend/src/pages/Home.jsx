import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { SECTIONS, SECTION_LABELS } from "../lib/api";
import { ArticleCard } from "../components/ArticleCard";
import {
  ArrowLeft,
  Sparkles,
  MessageCircle,
  Mail,
  ImageIcon,
} from "lucide-react";

const SectionPlaceholder = ({ section }) => (
  <div
    className="rounded-2xl border-2 border-dashed border-[#E2DAC8] bg-[#FAF8F5] p-10 lg:p-14 text-center"
    data-testid={`section-empty-${section.key}`}
  >
    <div className="w-16 h-16 mx-auto rounded-full bg-[#F0EBE1] flex items-center justify-center mb-5">
      <ImageIcon size={26} className="text-[#987239]" />
    </div>
    <p className="font-display text-2xl text-[#2D332F] mb-2">
      محتوى هذا القسم قيد الإعداد
    </p>
    <p className="text-sm text-[#5C6660] max-w-md mx-auto leading-loose">
      ستجدين هنا قريباً مقالات قسم «{section.label}» — {section.desc}.
    </p>
  </div>
);

const Home = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/articles");
        setArticles(res.data);
      } catch (e) {
        console.error("Failed to load articles", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const featuredCover = articles.find((a) => a.featured) || articles[0];
  const bySection = (key) =>
    articles.filter((a) => a.section === key).slice(0, 3);

  return (
    <div data-testid="home-page">
      {/* HERO COVER */}
      <section
        className="relative paper-grain overflow-hidden"
        data-testid="hero-section"
      >
        <div className="absolute inset-0 bg-[#F0EBE1]" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-24 lg:pt-24 lg:pb-32 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 editorial-rise">
            <p className="text-xs tracking-[0.4em] text-[#987239] mb-6 uppercase">
              العدد الأول · مجلة دورية إلكترونية
            </p>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-[#2D332F] mb-4">
              معاً نبني
              <br />
              <span className="text-[#987239]">جسوراً</span> نحو النجاح
            </h1>
            <p className="text-sm md:text-base tracking-[0.3em] text-[#987239] mb-8 uppercase">
              مجلة دورية إلكترونية
            </p>
            <p className="text-lg text-[#5C6660] leading-loose max-w-xl mb-10">
              منصّةُ تواصلٍ بين البيت والمدرسة، نحتفي فيها بإنجازات بناتنا،
              ونُنصت لمقترحات أولياء الأمور، ونزرع وعياً يليق بأجيال الغد.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/section/news"
                className="btn-pill btn-primary"
                data-testid="hero-cta-read"
              >
                ابدأ التصفّح
                <ArrowLeft size={16} className="rtl:rotate-180" />
              </Link>
              <Link
                to="/voice"
                className="btn-pill btn-outline"
                data-testid="hero-cta-voice"
              >
                صوتك مسموع
              </Link>
            </div>
          </div>

          <div
            className="lg:col-span-5 editorial-rise"
            style={{ animationDelay: "120ms" }}
          >
            {featuredCover ? (
              <Link
                to={`/articles/${featuredCover.id}`}
                className="group block relative"
                data-testid="hero-featured-cover"
              >
                <div className="overflow-hidden rounded-2xl border border-[#E2DAC8]">
                  <img
                    src={featuredCover.image_url}
                    alt={featuredCover.title}
                    className="zoom-img w-full h-[520px] object-cover"
                  />
                </div>
                <div className="absolute -bottom-8 -start-4 lg:-start-8 max-w-xs bg-[#FAF8F5] border border-[#E2DAC8] rounded-xl p-5 shadow-sm">
                  <span className="text-[11px] tracking-[0.3em] text-[#987239] uppercase">
                    افتتاحية العدد
                  </span>
                  <p className="font-display text-xl text-[#2D332F] mt-2 leading-snug group-hover:text-[#987239] transition-colors">
                    {featuredCover.title}
                  </p>
                </div>
              </Link>
            ) : (
              <div
                className="relative h-[520px] rounded-2xl border-2 border-dashed border-[#C2A878] bg-[#FAF8F5] flex flex-col items-center justify-center p-10 text-center"
                data-testid="hero-cover-placeholder"
              >
                <div className="w-20 h-20 rounded-full bg-[#F0EBE1] flex items-center justify-center mb-6">
                  <ImageIcon size={32} className="text-[#987239]" />
                </div>
                <p className="font-display text-2xl text-[#2D332F] mb-3">
                  غلاف العدد الأول
                </p>
                <p className="text-sm text-[#5C6660] max-w-xs leading-loose">
                  سيظهر هنا غلاف العدد بعد إضافة أوّل مقال مميّز من لوحة الإدارة.
                </p>
              </div>
            )}
            <p className="mt-6 text-center text-xs tracking-[0.35em] text-[#987239] uppercase">
              مجلة دورية إلكترونية
            </p>
          </div>
        </div>
      </section>

      {/* QUICK SECTIONS BAR */}
      <section className="border-y border-[#E2DAC8] bg-[#FAF8F5]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs tracking-[0.3em] text-[#5C6660] uppercase">
            استكشف الأقسام
          </p>
          <div className="flex flex-wrap gap-3">
            {SECTIONS.map((s) => (
              <Link
                key={s.key}
                to={`/section/${s.key}`}
                data-testid={`quick-section-${s.key}`}
                className="px-5 py-2 rounded-full border border-[#E2DAC8] text-sm text-[#2D332F] hover:bg-[#2D332F] hover:text-[#FAF8F5] hover:border-[#2D332F] transition-colors"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION GRIDS (always render, with placeholders if empty) */}
      {loading && (
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 text-center text-[#5C6660]">
          جارٍ تحميل المحتوى...
        </div>
      )}

      {!loading &&
        SECTIONS.map((s, idx) => {
          const items = bySection(s.key);
          return (
            <section
              key={s.key}
              className="max-w-7xl mx-auto px-6 lg:px-10 py-20"
              data-testid={`home-section-${s.key}`}
            >
              <div className="flex items-end justify-between mb-12 border-b border-[#E2DAC8] pb-6">
                <div>
                  <p className="text-xs tracking-[0.3em] text-[#987239] mb-2 uppercase">
                    قسم
                  </p>
                  <h2 className="font-display text-4xl md:text-5xl text-[#2D332F]">
                    {s.label}
                  </h2>
                  <p className="mt-3 text-[#5C6660] text-base">{s.desc}</p>
                </div>
                {items.length > 0 && (
                  <Link
                    to={`/section/${s.key}`}
                    className="text-sm text-[#2D332F] hover:text-[#987239] inline-flex items-center gap-2"
                    data-testid={`see-all-${s.key}`}
                  >
                    جميع المقالات
                    <ArrowLeft size={14} className="rtl:rotate-180" />
                  </Link>
                )}
              </div>

              {items.length === 0 ? (
                <SectionPlaceholder section={s} />
              ) : idx === 0 && items[0] ? (
                <div className="space-y-16">
                  <ArticleCard article={items[0]} variant="feature" />
                  {items.length > 1 && (
                    <div className="grid md:grid-cols-2 gap-10 pt-4">
                      {items.slice(1).map((a, i) => (
                        <ArticleCard key={a.id} article={a} index={i} />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-10">
                  {items.map((a, i) => (
                    <ArticleCard key={a.id} article={a} index={i} />
                  ))}
                </div>
              )}
            </section>
          );
        })}

      {/* CTA SUBSCRIBE BANNER */}
      <section
        className="max-w-7xl mx-auto px-6 lg:px-10 py-16"
        data-testid="subscribe-banner"
      >
        <div className="rounded-2xl bg-[#2D332F] text-[#FAF8F5] p-10 lg:p-14 grid md:grid-cols-2 gap-10 items-center paper-grain relative overflow-hidden">
          <div>
            <Mail size={32} className="text-[#D4A373] mb-5" />
            <h3 className="font-display text-3xl md:text-4xl mb-4">
              لا يفوتكِ عددٌ جديد
            </h3>
            <p className="text-sm leading-loose opacity-90 max-w-md">
              اشتركي ببريدكِ، ويصلكِ أوّلاً إشعارٌ عند صدور كلّ عدد، مع أهمّ
              المقالات والتنبيهات من المدرسة.
            </p>
          </div>
          <div className="flex md:justify-end">
            <Link
              to="/subscribe"
              className="btn-pill bg-[#D4A373] text-[#2D332F] hover:bg-[#FAF8F5] hover:text-[#2D332F]"
              data-testid="subscribe-banner-cta"
            >
              اشتركي الآن
              <ArrowLeft size={16} className="rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>

      {/* CALL-TO-ACTION CARDS */}
      <section
        className="max-w-7xl mx-auto px-6 lg:px-10 py-12"
        data-testid="cta-section"
      >
        <div className="grid md:grid-cols-2 gap-8">
          <Link
            to="/voice"
            className="group relative overflow-hidden rounded-2xl bg-[#8B9D83] text-[#FAF8F5] p-10 transition-transform hover:-translate-y-1"
            data-testid="cta-voice"
          >
            <Sparkles className="absolute top-6 left-6 opacity-30" size={80} />
            <MessageCircle size={28} className="mb-5" />
            <h3 className="font-display text-3xl mb-3">صوتك مسموع</h3>
            <p className="text-sm leading-loose opacity-90 mb-6 max-w-md">
              مقترحات أولياء الأمور — صوتك جزء من قرارنا. شاركينا اقتراحك أو
              ملاحظتك، ونحن نُصغي بكلّ اهتمام.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold border-b border-[#FAF8F5]/40 pb-1">
              أرسلي صوتك
              <ArrowLeft size={14} className="rtl:rotate-180" />
            </span>
          </Link>

          <Link
            to="/opinion"
            className="group relative overflow-hidden rounded-2xl bg-[#987239] text-[#FAF8F5] p-10 transition-transform hover:-translate-y-1"
            data-testid="cta-opinion"
          >
            <Sparkles className="absolute top-6 left-6 opacity-20" size={80} />
            <Sparkles size={28} className="mb-5" />
            <h3 className="font-display text-3xl mb-3">رأيك يهمنا</h3>
            <p className="text-sm leading-loose opacity-90 mb-6 max-w-md">
              تفاعلي مع المجلة بنقرةٍ واحدة عبر أيقونات تعبيرية تختصر انطباعك،
              وشاهدي تفاعل بقيّة القارئات.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold border-b border-[#FAF8F5]/40 pb-1">
              صوّتي الآن
              <ArrowLeft size={14} className="rtl:rotate-180" />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
