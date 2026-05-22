import { Link } from "react-router-dom";
import { Mail, MessageCircle, Star } from "lucide-react";

const Footer = () => {
  return (
    <footer
      className="mt-24 bg-[#2D332F] text-[#FAF8F5]"
      data-testid="main-footer"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid md:grid-cols-3 gap-10">
        <div>
          <p className="font-display text-3xl mb-3">معاً نبني جسوراً نحو النجاح</p>
          <p className="text-sm text-[#C2A878] leading-loose">
            مجلة إلكترونية تُعنى بالتواصل مع أولياء أمور الطالبات، وتحرص على
            بناء شراكة حقيقية بين البيت والمدرسة لصياغة مستقبل واعد.
          </p>
        </div>

        <div>
          <p className="font-display text-xl mb-4 text-[#D4A373]">روابط سريعة</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                to="/section/awareness"
                className="hover:text-[#D4A373] transition-colors"
                data-testid="footer-link-awareness"
              >
                نحو طريق واعٍ
              </Link>
            </li>
            <li>
              <Link
                to="/section/news"
                className="hover:text-[#D4A373] transition-colors"
                data-testid="footer-link-news"
              >
                آخر الأخبار
              </Link>
            </li>
            <li>
              <Link
                to="/section/excellence"
                className="hover:text-[#D4A373] transition-colors"
                data-testid="footer-link-excellence"
              >
                بصمة تميّز
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="font-display text-xl mb-4 text-[#D4A373]">صوتك يصل إلينا</p>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <MessageCircle size={16} className="text-[#C2A878]" />
              <Link to="/section/voice" className="hover:text-[#D4A373]">
                صوتك مسموع
              </Link>
            </li>
            <li className="flex items-center gap-3">
              <Star size={16} className="text-[#C2A878]" />
              <Link to="/opinion" className="hover:text-[#D4A373]">
                رأيك يهمنا
              </Link>
            </li>
            <li className="flex items-center gap-3">
              <Mail size={16} className="text-[#C2A878]" />
              <Link to="/subscribe" className="hover:text-[#D4A373]">
                اشترك في المجلة
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#FAF8F5]/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#C2A878]">
          <p>© {new Date().getFullYear()} المجلة الإلكترونية — جميع الحقوق محفوظة.</p>
          <p>ابتكار وإعداد: أ. بثينة الفاضل</p>
          <p>تُصدر بحبٍّ، وتُقرأ بشغف.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
