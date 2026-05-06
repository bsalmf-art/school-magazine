import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api, { SECTIONS, SECTION_LABELS } from "../lib/api";
import { toast } from "sonner";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "../components/ui/select";
import { Trash2, Plus, Edit, LogOut, Star, Mail } from "lucide-react";

const empty = {
  title: "",
  excerpt: "",
  content: "",
  section: "news",
  image_url: "",
  author: "هيئة التحرير",
  featured: false,
};

const AdminDashboard = () => {
  const [articles, setArticles] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const navigate = useNavigate();

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [art, sug, sub, rea] = await Promise.all([
        api.get("/articles"),
        api.get("/suggestions"),
        api.get("/subscriptions"),
        api.get("/reactions"),
      ]);
      setArticles(art.data);
      setSuggestions(sug.data);
      setSubscriptions(sub.data);
      setReactions(rea.data);
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("admin_token");
        navigate("/admin/login");
        return;
      }
      toast.error("تعذّر تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) {
      navigate("/admin/login");
      return;
    }
    loadAll();
  }, [loadAll, navigate]);

  const logout = async () => {
    try {
      await api.post("/admin/logout");
    } catch (e) {
      // intentionally ignore - token still cleared locally
    }
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  };

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setDialogOpen(true);
  };

  const openEdit = (a) => {
    setEditing(a);
    setForm({
      title: a.title,
      excerpt: a.excerpt,
      content: a.content,
      section: a.section,
      image_url: a.image_url,
      author: a.author,
      featured: a.featured,
    });
    setDialogOpen(true);
  };

  const saveArticle = async () => {
    if (!form.title || !form.excerpt || !form.content || !form.image_url) {
      toast.error("يرجى تعبئة جميع الحقول الأساسية");
      return;
    }
    try {
      if (editing) {
        await api.put(`/articles/${editing.id}`, form);
        toast.success("تم تحديث المقال");
      } else {
        await api.post("/articles", form);
        toast.success("تم نشر المقال");
      }
      setDialogOpen(false);
      loadAll();
    } catch (err) {
      toast.error("تعذّر الحفظ");
    }
  };

  const deleteArticle = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف المقال؟")) return;
    try {
      await api.delete(`/articles/${id}`);
      toast.success("تم الحذف");
      loadAll();
    } catch (err) {
      toast.error("تعذّر الحذف");
    }
  };

  const deleteSuggestion = async (id) => {
    if (!window.confirm("حذف الاقتراح؟")) return;
    try {
      await api.delete(`/suggestions/${id}`);
      loadAll();
    } catch {
      toast.error("تعذّر الحذف");
    }
  };

  const deleteSubscription = async (id) => {
    if (!window.confirm("حذف هذا الاشتراك؟")) return;
    try {
      await api.delete(`/subscriptions/${id}`);
      loadAll();
    } catch {
      toast.error("تعذّر الحذف");
    }
  };

  const totalReactions = reactions.reduce((a, b) => a + b.count, 0);

  return (
    <div className="bg-[#FAF8F5] min-h-screen" data-testid="admin-dashboard">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs tracking-[0.3em] text-[#987239] mb-2 uppercase">
              لوحة التحكم
            </p>
            <h1 className="font-display text-4xl text-[#2D332F]">
              إدارة المجلة
            </h1>
          </div>
          <button
            onClick={logout}
            data-testid="admin-logout-button"
            className="btn-pill btn-outline"
          >
            <LogOut size={16} />
            تسجيل الخروج
          </button>
        </div>

        <Tabs defaultValue="articles" dir="rtl">
          <TabsList
            className="bg-white border border-[#E2DAC8] mb-8 flex flex-wrap"
            data-testid="admin-tabs"
          >
            <TabsTrigger value="articles" data-testid="tab-articles">
              المقالات ({articles.length})
            </TabsTrigger>
            <TabsTrigger value="suggestions" data-testid="tab-suggestions">
              صوتك مسموع ({suggestions.length})
            </TabsTrigger>
            <TabsTrigger value="subscriptions" data-testid="tab-subscriptions">
              المُشتركات ({subscriptions.length})
            </TabsTrigger>
            <TabsTrigger value="reactions" data-testid="tab-reactions">
              التفاعلات ({totalReactions})
            </TabsTrigger>
          </TabsList>

          {/* Articles */}
          <TabsContent value="articles">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl text-[#2D332F]">
                إدارة المقالات
              </h2>
              <button
                onClick={openNew}
                data-testid="add-article-button"
                className="btn-pill btn-primary"
              >
                <Plus size={16} />
                مقال جديد
              </button>
            </div>

            {loading ? (
              <p className="text-center text-[#5C6660] py-10">جارٍ التحميل...</p>
            ) : articles.length === 0 ? (
              <p className="text-center text-[#5C6660] py-10">
                لا توجد مقالات.
              </p>
            ) : (
              <div className="bg-white border border-[#E2DAC8] rounded-xl overflow-hidden">
                <table className="w-full text-right">
                  <thead className="bg-[#F0EBE1]">
                    <tr className="text-sm text-[#2D332F]">
                      <th className="px-4 py-3 font-semibold">العنوان</th>
                      <th className="px-4 py-3 font-semibold">القسم</th>
                      <th className="px-4 py-3 font-semibold">الكاتب</th>
                      <th className="px-4 py-3 font-semibold">مميّز</th>
                      <th className="px-4 py-3 font-semibold">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map((a) => (
                      <tr
                        key={a.id}
                        className="border-t border-[#E2DAC8] text-sm"
                        data-testid={`admin-article-row-${a.id}`}
                      >
                        <td className="px-4 py-3 text-[#2D332F] max-w-md">
                          {a.title}
                        </td>
                        <td className="px-4 py-3 text-[#5C6660]">
                          {SECTION_LABELS[a.section]}
                        </td>
                        <td className="px-4 py-3 text-[#5C6660]">{a.author}</td>
                        <td className="px-4 py-3">
                          {a.featured ? (
                            <Star
                              size={16}
                              className="fill-[#D4A373] text-[#D4A373]"
                            />
                          ) : (
                            <span className="text-[#5C6660]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => openEdit(a)}
                              data-testid={`edit-article-${a.id}`}
                              className="p-2 rounded-lg hover:bg-[#F0EBE1]"
                              aria-label="تعديل"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deleteArticle(a.id)}
                              data-testid={`delete-article-${a.id}`}
                              className="p-2 rounded-lg hover:bg-red-50 text-red-700"
                              aria-label="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* Suggestions */}
          <TabsContent value="suggestions">
            <h2 className="font-display text-2xl text-[#2D332F] mb-6">
              صوتك مسموع — مقترحات أولياء الأمور
            </h2>
            {suggestions.length === 0 ? (
              <p className="text-center text-[#5C6660] py-10">لا توجد اقتراحات.</p>
            ) : (
              <div className="space-y-4">
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white border border-[#E2DAC8] rounded-xl p-6"
                    data-testid={`suggestion-card-${s.id}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-display text-lg text-[#2D332F]">
                          {s.subject}
                        </p>
                        <p className="text-sm text-[#5C6660] mt-1">
                          {s.parent_name}
                          {s.student_name ? ` · ولي أمر ${s.student_name}` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteSuggestion(s.id)}
                        data-testid={`delete-suggestion-${s.id}`}
                        className="p-2 text-red-700 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-[#3a3f3b] leading-loose whitespace-pre-line">
                      {s.message}
                    </p>
                    <p className="text-xs text-[#5C6660] mt-3">
                      {new Date(s.created_at).toLocaleString("ar")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Subscriptions */}
          <TabsContent value="subscriptions">
            <h2 className="font-display text-2xl text-[#2D332F] mb-6">
              قائمة المُشتركات في المجلة
            </h2>
            {subscriptions.length === 0 ? (
              <p className="text-center text-[#5C6660] py-10">
                لا يوجد مُشتركات بعد.
              </p>
            ) : (
              <div className="bg-white border border-[#E2DAC8] rounded-xl overflow-hidden">
                <table className="w-full text-right">
                  <thead className="bg-[#F0EBE1]">
                    <tr className="text-sm text-[#2D332F]">
                      <th className="px-4 py-3 font-semibold">الاسم</th>
                      <th className="px-4 py-3 font-semibold">البريد الإلكتروني</th>
                      <th className="px-4 py-3 font-semibold">تاريخ الاشتراك</th>
                      <th className="px-4 py-3 font-semibold">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((s) => (
                      <tr
                        key={s.id}
                        className="border-t border-[#E2DAC8] text-sm"
                        data-testid={`subscription-row-${s.id}`}
                      >
                        <td className="px-4 py-3 text-[#2D332F]">
                          {s.name || <span className="text-[#5C6660]">—</span>}
                        </td>
                        <td className="px-4 py-3 text-[#5C6660] inline-flex items-center gap-2">
                          <Mail size={14} />
                          {s.email}
                        </td>
                        <td className="px-4 py-3 text-[#5C6660]">
                          {new Date(s.created_at).toLocaleDateString("ar")}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => deleteSubscription(s.id)}
                            data-testid={`delete-subscription-${s.id}`}
                            className="p-2 rounded-lg hover:bg-red-50 text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>

          {/* Reactions */}
          <TabsContent value="reactions">
            <h2 className="font-display text-2xl text-[#2D332F] mb-2">
              تفاعلات القارئات (رأيك يهمنا)
            </h2>
            <p className="text-sm text-[#5C6660] mb-6">
              مجموع التفاعلات:{" "}
              <span className="font-bold text-[#2D332F]">{totalReactions}</span>
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {reactions.map((r) => {
                const pct = totalReactions
                  ? Math.round((r.count / totalReactions) * 100)
                  : 0;
                return (
                  <div
                    key={r.key}
                    className="bg-white border border-[#E2DAC8] rounded-xl p-6"
                    data-testid={`reaction-stat-${r.key}`}
                  >
                    <p className="text-xs tracking-[0.25em] text-[#987239] uppercase mb-2">
                      {r.key}
                    </p>
                    <p className="font-display text-xl text-[#2D332F] mb-3">
                      {r.label}
                    </p>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-3xl font-bold text-[#2D332F]">
                        {r.count}
                      </span>
                      <span className="text-sm text-[#5C6660]">
                        تفاعل ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-[#F0EBE1] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#8B9D83] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Article Editor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          dir="rtl"
          className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#FAF8F5]"
          data-testid="article-editor-dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-right">
              {editing ? "تعديل مقال" : "مقال جديد"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <input
              placeholder="العنوان"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              data-testid="form-title"
              className="w-full px-4 py-3 rounded-lg bg-white border border-[#E2DAC8] outline-none focus:border-[#8B9D83]"
            />
            <textarea
              placeholder="مقدّمة قصيرة (excerpt)"
              rows={2}
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              data-testid="form-excerpt"
              className="w-full px-4 py-3 rounded-lg bg-white border border-[#E2DAC8] outline-none focus:border-[#8B9D83] resize-none"
            />
            <textarea
              placeholder="نص المقال"
              rows={8}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              data-testid="form-content"
              className="w-full px-4 py-3 rounded-lg bg-white border border-[#E2DAC8] outline-none focus:border-[#8B9D83] resize-none"
            />
            <input
              placeholder="رابط الصورة"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              data-testid="form-image-url"
              className="w-full px-4 py-3 rounded-lg bg-white border border-[#E2DAC8] outline-none focus:border-[#8B9D83]"
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={form.section}
                onValueChange={(v) => setForm({ ...form, section: v })}
              >
                <SelectTrigger
                  data-testid="form-section-trigger"
                  className="bg-white border-[#E2DAC8]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((s) => (
                    <SelectItem
                      key={s.key}
                      value={s.key}
                      data-testid={`form-section-option-${s.key}`}
                    >
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <input
                placeholder="الكاتب"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                data-testid="form-author"
                className="w-full px-4 py-3 rounded-lg bg-white border border-[#E2DAC8] outline-none focus:border-[#8B9D83]"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#2D332F] cursor-pointer">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) =>
                  setForm({ ...form, featured: e.target.checked })
                }
                data-testid="form-featured"
                className="w-4 h-4 accent-[#8B9D83]"
              />
              تعيين كمقال مميّز (سيظهر في غلاف المجلة)
            </label>
          </div>
          <DialogFooter className="mt-6 flex-row-reverse gap-3">
            <button
              onClick={saveArticle}
              data-testid="form-save-button"
              className="btn-pill btn-primary"
            >
              {editing ? "تحديث" : "نشر"}
            </button>
            <button
              onClick={() => setDialogOpen(false)}
              type="button"
              className="btn-pill btn-outline"
              data-testid="form-cancel-button"
            >
              إلغاء
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
