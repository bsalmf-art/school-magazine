import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const SECTION_LABELS = {
  awareness: "نحو طريقٍ واعٍ",
  news: "آخر الأخبار",
  excellence: "بصمة تميّز",
};

export const SECTION_DESCRIPTIONS = {
  awareness: "توجيهات تربوية للطالبات",
  news: "آخر مستجدّات المدرسة وأنشطتها",
  excellence: "تكريم الطالبات المتميّزات في مجالات مختلفة",
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
