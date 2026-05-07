import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, {
  SECTIONS,
  SECTION_IMAGES,
  PAGE_IMAGES,
} from "../lib/api";
import { ArticleCard } from "../components/ArticleCard";
import { ArrowLeft, Sparkles, Mail } from "lucide-react";

const SectionImageCard = ({ section, count = 0 }) => (
  <Link
    to={`/section/${section.key}`}
    className="group relative overflow-hidden rounded-2xl border border-[#E2DAC8] block aspect-[4/3]"
    data-testid={`section-card-${section.key}`}
  >
    <img
      src={SECTION_IMAGES[section.key]}
      alt={section.label}
      className="zoom-img w-full h-full object-cover"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-[#2D332F]/95 via-[#2D332F]/45 to-[#2D332F]/10" />
    <div className="absolute inset-x-0 bottom-0 p-7 text-[#FAF8F5]">
      <h3 className="font-display text-3xl md:text-4xl leading-tight">
        {section.label}
      </h3>
      <p className="text-sm opacity-85 mt-2 leading-loose line-clamp-2">
        {section.desc}
      </p>
      <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-[#D4A373] group-hover:text-white transition-colors">
        الدخول للقسم
        <ArrowLeft size={14} className="rtl:rotate-180" />
      </span>
    </div>
    {count > 0 && (
      <span className="absolute top-5 start-5 bg-[#FAF8F5] text-[#2D332F] text-xs font-semibold px-3 py-1 rounded-full">
        {count} {count === 1 ? "مقال" : "مقالات"}
      </span>
    )}
  </Link>
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
  const sectionCount = (key) =>
    articles.filter((a) => a.section === key).length;

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
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.05] text-[#2D332F] mb-4">
              معاً نبني
              <br />
              <span className="text-[#987239]">جسوراً</span> نحو النجاح
            </h1>
            <p className="text-sm md:text-base tracking-[0.3em] text-[#987239] mb-8 uppercase">
              مجلة دورية إلكترونية
            </p>
            <p className="text-lg text-[#5C6660] leading-loose max-w-xl mb-10">
              منصّةُ تواصلٍ بين البيت والمدرسة، نحتفي فيها بإنجازات الطالبات،
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
                to="/section/voice"
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
                  {featuredCover.image_url ? (
                    <img
                      src={featuredCover.image_url}
                      alt={featuredCover.title}
                      className="zoom-img w-full h-[520px] object-cover"
                    />
                  ) : (
                    <img
                      src={PAGE_IMAGES.hero}
                      alt={featuredCover.title}
                      className="zoom-img w-full h-[520px] object-cover"
                    />
                  )}
                </div>
                <div className="absolute -bottom-8 -start-4 lg:-start-8 max-w-xs bg-[#FAF8F5] border border-[#E2DAC8] rounded-xl p-5 shadow-sm">
                  <p className="font-display text-xl text-[#2D332F] leading-snug group-hover:text-[#987239] transition-colors">
                    {featuredCover.title}
                  </p>
                </div>
              </Link>
            ) : (
              <div
                className="relative h-[520px] rounded-2xl overflow-hidden border border-[#E2DAC8] group"
                data-testid="hero-cover-placeholder"
              >
                <img
                  src={PAGE_IMAGES.hero}
                  alt="غلاف العدد"
                  className="zoom-img w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2D332F]/85 via-[#2D332F]/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-8 text-[#FAF8F5]">
                  <p className="font-display text-2xl leading-snug">
                    جسورُ الثقة بين البيت والمدرسة
                  </p>
                  <p className="text-sm opacity-90 mt-2 leading-loose">
                    حين تتلاقى الأيدي، يتسع الأفق لطالباتنا.
                  </p>
                </div>
              </div>
            )}
            <p className="mt-6 text-center text-xs tracking-[0.35em] text-[#987239] uppercase">
              مجلة دورية إلكترونية
            </p>
          </div>
        </div>
      </section>

      {/* SECTIONS GALLERY */}
      <section
        className="max-w-7xl mx-auto px-6 lg:px-10 py-20"
        data-testid="sections-gallery"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SECTIONS.map((s) => (
            <SectionImageCard
              key={s.key}
              section={s}
              count={sectionCount(s.key)}
            />
          ))}
        </div>
      </section>

      {/* PER-SECTION FEATURED ARTICLES (only sections that have content) */}
      {!loading &&
        SECTIONS.map((s, idx) => {
          const items = bySection(s.key);
          if (items.length === 0) return null;
          return (
            <section
              key={s.key}
              className="max-w-7xl mx-auto px-6 lg:px-10 py-16"
              data-testid={`home-section-${s.key}`}
            >
              <div className="flex items-end justify-between mb-10 border-b border-[#E2DAC8] pb-5">
                <div>
                  <h2 className="font-display text-3xl md:text-4xl text-[#2D332F]">
                    {s.label}
                  </h2>
                </div>
                <Link
                  to={`/section/${s.key}`}
                  className="text-sm text-[#2D332F] hover:text-[#987239] inline-flex items-center gap-2"
                  data-testid={`see-all-${s.key}`}
                >
                  جميع المقالات
                  <ArrowLeft size={14} className="rtl:rotate-180" />
                </Link>
              </div>

              {idx === 0 && items[0] ? (
                <div className="space-y-12">
                  <ArticleCard article={items[0]} variant="feature" />
                  {items.length > 1 && (
                    <div className="grid md:grid-cols-2 gap-10 pt-2">
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
              لا يفوتك العدد الجديد
            </h3>
            <p className="text-sm leading-loose opacity-90 max-w-md">
              اشترك بالبريد الإلكتروني، ويصلك إشعارٌ عند صدور كلّ عدد، مع أهمّ
              المقالات والتنبيهات من المدرسة.
            </p>
          </div>
          <div className="flex md:justify-end">
            <Link
              to="/subscribe"
              className="btn-pill bg-[#D4A373] text-[#2D332F] hover:bg-[#FAF8F5] hover:text-[#2D332F]"
              data-testid="subscribe-banner-cta"
            >
              اشترك الآن
              <ArrowLeft size={16} className="rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>

      {/* OPINION CTA */}
      <section
        className="max-w-7xl mx-auto px-6 lg:px-10 py-12"
        data-testid="cta-section"
      >
        <Link
          to="/opinion"
          className="group relative overflow-hidden rounded-2xl bg-[#987239] text-[#FAF8F5] p-10 lg:p-14 transition-transform hover:-translate-y-1 grid md:grid-cols-2 gap-8 items-center"
          data-testid="cta-opinion"
        >
          <div>
            <Sparkles size={32} className="mb-5" />
            <h3 className="font-display text-3xl md:text-4xl mb-3">رأيك يهمنا</h3>
            <p className="text-sm leading-loose opacity-90 max-w-md">
              تفاعل مع المجلة بنقرةٍ واحدة عبر أيقونات تعبيرية تختصر انطباعك،
              وشاهد تفاعل بقيّة القرّاء.
            </p>
          </div>
          <div className="flex md:justify-end">
            <span className="inline-flex items-center gap-2 text-sm font-semibold border-b border-[#FAF8F5]/40 pb-1">
              صوّت الآن
              <ArrowLeft size={14} className="rtl:rotate-180" />
            </span>
          </div>
        </Link>
      </section>
    </div>
  );
};

export default Home;
