import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import OfficialHeader from "@/components/OfficialHeader";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import ArticleDetail from "@/pages/ArticleDetail";
import SectionPage from "@/pages/SectionPage";
import VoicePage from "@/pages/VoicePage";
import OpinionPage from "@/pages/OpinionPage";
import SubscribePage from "@/pages/SubscribePage";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";

const Shell = () => {
  return (
    <>
      <OfficialHeader />
      <Navbar />
      <main className="min-h-[60vh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/articles/:id" element={<ArticleDetail />} />
          <Route path="/section/:section" element={<SectionPage />} />
          <Route path="/voice" element={<VoicePage />} />
          <Route path="/suggestions" element={<Navigate to="/voice" replace />} />
          <Route path="/opinion" element={<OpinionPage />} />
          <Route path="/subscribe" element={<SubscribePage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route
            path="*"
            element={
              <div className="max-w-3xl mx-auto px-6 py-32 text-center">
                <h2 className="font-display text-3xl text-[#2D332F] mb-2">
                  الصفحة غير موجودة
                </h2>
                <p className="text-[#5C6660]">
                  عُد إلى الرئيسية واستكشف المجلة.
                </p>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

function App() {
  return (
    <div className="App" dir="rtl">
      <BrowserRouter>
        <Shell />
        <Toaster
          position="top-center"
          richColors
          dir="rtl"
          toastOptions={{
            style: { fontFamily: "Cairo, sans-serif" },
          }}
        />
      </BrowserRouter>
    </div>
  );
}

export default App;
