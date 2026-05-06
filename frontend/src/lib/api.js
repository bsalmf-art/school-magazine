import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const SECTION_LABELS = {
  awareness: "نحو طريق واعٍ",
  news: "آخر الأخبار",
  excellence: "بصمة تميّز",
};

export const SECTIONS = [
  { key: "awareness", label: SECTION_LABELS.awareness },
  { key: "news", label: SECTION_LABELS.news },
  { key: "excellence", label: SECTION_LABELS.excellence },
];

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
