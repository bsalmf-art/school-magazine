# PRD — مجلة "معاً نبني جسوراً نحو النجاح"

## Original Problem Statement
"تقدر تصمم لي مجلة الكترونية" — User specified: مجلة بعنوان "معاً نبني جسوراً نحو النجاح" للتواصل مع أولياء أمور الطالبات. الأقسام: مقترحات أولياء الأمور، نحو طريق واعٍ، آخر الأخبار، بصمة تميز، رأيك يهمنا، وغيرها.

## Architecture
- Backend: FastAPI + Motor (MongoDB), all routes prefixed `/api`
- Frontend: React 19 + TailwindCSS + Shadcn UI components, Sonner for toasts
- Storage: MongoDB collections: `articles`, `suggestions`, `opinions`
- Auth: Simple in-memory token (admin-only) via `/api/admin/login`. Credentials in backend/.env.
- Direction/Lang: `dir="rtl"`, `lang="ar"`, fonts: Amiri (display) + Cairo (body)

## User Personas
- **Parent (Reader, public)**: browses articles, submits suggestions and opinions
- **Admin (Editor)**: logs in, manages articles (CRUD), reviews/deletes suggestions and opinions

## Core Requirements (static)
- Arabic RTL editorial magazine
- Sections: نحو طريق واعٍ (awareness), آخر الأخبار (news), بصمة تميّز (excellence)
- Public form: مقترحات أولياء الأمور
- Public form: رأيك يهمنا (with star rating 1-5)
- Admin dashboard with article CRUD and submissions review

## Implemented (Dec 2025)
- Backend models + endpoints for Articles (CRUD with section/featured filters), Suggestions (POST public, GET/DELETE admin), Opinions (POST public, GET/DELETE admin), Admin login/logout/me
- 6 seed articles (2 per section, 3 featured) on startup
- Frontend pages: Home (editorial hero + featured cover + per-section grids + CTA cards), Article Detail (with drop cap + related), Section pages, Suggestions form, Opinion form (star rating), Admin Login, Admin Dashboard (tabs + edit dialog with shadcn Select)
- Navbar with mobile menu, Footer, Sonner toasts
- All interactive elements include `data-testid`
- Test coverage: 25/25 backend pytest tests passed; full frontend e2e validated

## Backlog (Prioritised)
- **P1**: Email notification on new suggestion/opinion (e.g., Resend integration)
- **P1**: Pagination/search in admin article list
- **P2**: Image upload for articles (currently URL only)
- **P2**: Public-facing newsletter subscribe form
- **P2**: Multi-author roles, draft state, scheduled publishing
- **P2**: Rich text editor for article content (currently plain textarea)
- **P3**: Social share buttons on article pages
- **P3**: Reading-time estimation, view counter

## Credentials
- Admin: `admin / School2025!` (see `/app/memory/test_credentials.md`)
