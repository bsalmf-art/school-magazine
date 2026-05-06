import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, BookOpen } from "lucide-react";
import { useState } from "react";
import { SECTIONS } from "../lib/api";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { to: "/", label: "الرئيسية" },
    ...SECTIONS.map((s) => ({ to: `/section/${s.key}`, label: s.label })),
    { to: "/opinion", label: "رأيك يهمنا" },
    { to: "/subscribe", label: "اشترك" },
  ];

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl bg-[#FAF8F5]/85 border-b border-[#E2DAC8]"
      data-testid="main-navbar"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-3 group"
          data-testid="navbar-logo-link"
          onClick={() => setOpen(false)}
        >
          <div className="w-10 h-10 rounded-full bg-[#2D332F] text-[#FAF8F5] flex items-center justify-center transition-colors group-hover:bg-[#987239]">
            <BookOpen size={18} />
          </div>
          <div className="leading-tight">
            <p className="font-display text-lg text-[#2D332F]">معاً نبني جسوراً</p>
            <p className="text-[10px] md:text-[11px] tracking-widest text-[#987239]">
              مجلة دورية إلكترونية
            </p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-7">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              data-testid={`nav-link-${item.to}`}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors hover:text-[#987239] ${
                  isActive ? "text-[#987239]" : "text-[#2D332F]"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={() => navigate("/admin/login")}
            data-testid="navbar-admin-button"
            className="text-xs px-4 py-2 rounded-full border border-[#2D332F] text-[#2D332F] hover:bg-[#2D332F] hover:text-[#FAF8F5] transition-colors"
          >
            إدارة المجلة
          </button>
        </nav>

        <button
          className="lg:hidden p-2 text-[#2D332F]"
          onClick={() => setOpen(!open)}
          data-testid="mobile-menu-toggle"
          aria-label="القائمة"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav
          className="lg:hidden border-t border-[#E2DAC8] bg-[#FAF8F5]"
          data-testid="mobile-nav"
        >
          <div className="px-6 py-4 flex flex-col gap-4">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                data-testid={`mobile-nav-link-${item.to}`}
                className={({ isActive }) =>
                  `text-sm font-medium ${
                    isActive ? "text-[#987239]" : "text-[#2D332F]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <button
              onClick={() => {
                setOpen(false);
                navigate("/admin/login");
              }}
              data-testid="mobile-nav-admin-button"
              className="text-xs self-start px-4 py-2 rounded-full border border-[#2D332F] text-[#2D332F]"
            >
              إدارة المجلة
            </button>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
