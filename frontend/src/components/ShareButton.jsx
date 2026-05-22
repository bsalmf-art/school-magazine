import { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

// Reusable ShareButton component - shows a small popover with WhatsApp, X, Telegram, Facebook & Copy.
export const ShareButton = ({ articleId, title = "", size = "default" }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isLarge = size === "large";

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/articles/${articleId}`
      : `/articles/${articleId}`;
  const text = title ? `${title} — المجلة الإلكترونية` : "المجلة الإلكترونية";

  const targets = [
    {
      key: "whatsapp",
      label: "واتساب",
      bg: "bg-[#25D366]",
      href: `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M19.05 4.91A10 10 0 0 0 4.07 18.34L3 22l3.74-1A10 10 0 1 0 19.05 4.91zM12 20.13a8.13 8.13 0 0 1-4.14-1.13l-.3-.18-2.22.58.6-2.17-.2-.32a8.13 8.13 0 1 1 6.26 3.22zm4.7-6.1c-.26-.13-1.52-.75-1.76-.83-.24-.09-.41-.13-.59.13-.17.26-.67.83-.82 1-.15.17-.3.2-.56.07a6.65 6.65 0 0 1-1.95-1.2 7.36 7.36 0 0 1-1.36-1.68c-.14-.25 0-.38.12-.5.12-.12.26-.3.39-.45.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.07-.13-.59-1.42-.81-1.94-.21-.51-.43-.44-.59-.45h-.5a1 1 0 0 0-.73.34 3 3 0 0 0-.94 2.23c0 1.31.96 2.57 1.1 2.75.13.17 1.88 2.87 4.55 4 .64.27 1.13.44 1.52.56a3.67 3.67 0 0 0 1.68.1 2.74 2.74 0 0 0 1.8-1.27 2.25 2.25 0 0 0 .15-1.27c-.07-.11-.24-.18-.5-.3z" />
        </svg>
      ),
    },
    {
      key: "x",
      label: "X / تويتر",
      bg: "bg-black",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      key: "telegram",
      label: "تليجرام",
      bg: "bg-[#26A5E4]",
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
        </svg>
      ),
    },
    {
      key: "facebook",
      label: "فيسبوك",
      bg: "bg-[#1877F2]",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
          <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.51 1.49-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.45 2.9h-2.33v6.99A10 10 0 0 0 22 12z" />
        </svg>
      ),
    },
  ];

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Use native share on mobile when available
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // user cancelled — fall through to popover
      }
    }
    setOpen((v) => !v);
  };

  const copyLink = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("تم نسخ الرابط");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

  return (
    <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={handleShare}
        data-testid={`share-button-${articleId}`}
        aria-label="مشاركة"
        className={`inline-flex items-center gap-2 rounded-full transition-all border bg-[#F0EBE1] text-[#5C6660] border-[#E2DAC8] hover:bg-[#E2DAC8] ${
          isLarge ? "px-5 py-3 text-base" : "px-3 py-1.5 text-sm"
        }`}
      >
        <Share2 size={isLarge ? 20 : 16} />
        <span>مشاركة</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            data-testid={`share-popover-${articleId}`}
            className="absolute z-50 mt-2 left-1/2 -translate-x-1/2 bg-white border border-[#E2DAC8] rounded-xl shadow-lg p-2 min-w-[200px]"
          >
            {targets.map((t) => (
              <a
                key={t.key}
                href={t.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                data-testid={`share-${t.key}-${articleId}`}
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#F0EBE1] text-sm text-[#2D332F]"
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white ${t.bg}`}>
                  {t.icon}
                </span>
                <span>{t.label}</span>
              </a>
            ))}
            <button
              onClick={copyLink}
              data-testid={`share-copy-${articleId}`}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#F0EBE1] text-sm text-[#2D332F]"
            >
              <span className="w-7 h-7 rounded-full flex items-center justify-center bg-[#987239] text-white">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </span>
              <span>{copied ? "تم النسخ" : "نسخ الرابط"}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ShareButton;
