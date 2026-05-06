import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const SECTION_LABELS = {
  awareness: "نحو طريقٍ واعٍ",
  news: "آخر الأخبار",
  excellence: "بصمة تميّز",
  voice: "صوتك مسموع",
};

export const SECTION_DESCRIPTIONS = {
  awareness: "توجيهات تربوية للطالبات",
  news: "آخر مستجدّات المدرسة وأنشطتها",
  excellence: "تكريم الطالبات المتميّزات في مجالات مختلفة",
  voice: "مساحة لأولياء الأمور لكتابة المواضيع وتفاعل القارئات معها",
};

export const SECTIONS = [
  {
    key: "awareness",
    label: SECTION_LABELS.awareness,
    desc: SECTION_DESCRIPTIONS.awareness,
  },
  {
    key: "news",
    label: SECTION_LABELS.news,
    desc: SECTION_DESCRIPTIONS.news,
  },
  {
    key: "excellence",
    label: SECTION_LABELS.excellence,
    desc: SECTION_DESCRIPTIONS.excellence,
  },
  {
    key: "voice",
    label: SECTION_LABELS.voice,
    desc: SECTION_DESCRIPTIONS.voice,
  },
];

// Editorial cover images per section / page
export const SECTION_IMAGES = {
  awareness:
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1600&q=80",
  news: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=80",
  excellence:
    "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?auto=format&fit=crop&w=1600&q=80",
  voice:
    "https://images.unsplash.com/photo-1573497019418-b400bb3ab074?auto=format&fit=crop&w=1600&q=80",
};

export const PAGE_IMAGES = {
  hero: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1600&q=80",
  opinion:
    "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1600&q=80",
  subscribe:
    "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1600&q=80",
};

const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
