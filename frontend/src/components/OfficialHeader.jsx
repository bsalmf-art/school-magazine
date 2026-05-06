import { useState } from "react";
import { GraduationCap, Landmark } from "lucide-react";

// Replace these constants with your actual logo URLs.
// Files are in /app/frontend/public/ — replace them to update the logos.
const SCHOOL_LOGO = "/school-logo.jpeg";
const MINISTRY_LOGO = "/ministry-logo.jpeg";

const LogoSlot = ({ src, alt, Fallback, label, testId }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-[#F0EBE1] border border-[#E2DAC8] flex flex-col items-center justify-center text-[#987239] shrink-0"
        data-testid={testId}
        aria-label={alt}
      >
        <Fallback size={22} />
        <span className="mt-1 text-[9px] tracking-wider">{label}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      data-testid={testId}
      onError={() => setFailed(true)}
      className="h-16 w-16 md:h-20 md:w-20 object-contain shrink-0"
    />
  );
};

const OfficialHeader = () => {
  return (
    <div
      className="bg-[#FAF8F5] border-b border-[#E2DAC8]"
      data-testid="official-header"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-10 py-3 md:py-4 flex items-center justify-between gap-4">
        {/* Ministry logo (right side in RTL) */}
        <LogoSlot
          src={MINISTRY_LOGO}
          alt="شعار وزارة التعليم"
          Fallback={Landmark}
          label="الوزارة"
          testId="ministry-logo"
        />

        {/* Center text */}
        <div className="text-center flex-1 text-[11px] md:text-sm leading-relaxed text-[#2D332F]">
          <p className="font-semibold">المملكة العربية السعودية</p>
          <p>وزارة التعليم</p>
          <p>إدارة تعليم الرياض</p>
          <p className="text-[#987239] font-semibold">الثانوية ٥٦ — مسارات</p>
        </div>

        {/* School logo (left side in RTL) */}
        <LogoSlot
          src={SCHOOL_LOGO}
          alt="شعار المدرسة"
          Fallback={GraduationCap}
          label="المدرسة"
          testId="school-logo"
        />
      </div>
    </div>
  );
};

export default OfficialHeader;
