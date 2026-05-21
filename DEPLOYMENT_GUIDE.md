# دليل النشر المجّاني للمجلة (GitHub + MongoDB Atlas + Render + Netlify)

## المتطلّبات (لديكِ كلها)
- ✅ حساب GitHub
- ✅ حساب MongoDB Atlas (مجاني)
- ✅ حساب Render (مجاني)
- ✅ حساب Netlify (مجاني)

---

## الخطوة 1 — تنزيل الكود ورفعه على GitHub
1. من Emergent، نزّلي الكود (Download code) كملف ZIP
2. فكّي الضغط على جهازك
3. أنشئي مستودعاً جديداً على GitHub (مثلاً `magazine-school56`)
4. ارفعي محتويات `/app` فقط (مجلد `backend/` و`frontend/`)

---

## الخطوة 2 — قاعدة البيانات على MongoDB Atlas
1. ادخلي MongoDB Atlas → اضغطي **+ Create** → اختاري **M0 Free**
2. سمّي الكلستر `magazine-cluster`
3. **Database Access** → أضيفي مستخدماً جديداً (اسم + كلمة مرور)
4. **Network Access** → اضغطي **Add IP** → اختاري **Allow Access from Anywhere** (0.0.0.0/0)
5. **Connect** → **Drivers** → انسخي connection string، مثل:
   ```
   mongodb+srv://USER:PASSWORD@cluster.xxxxx.mongodb.net/?retryWrites=true
   ```

---

## الخطوة 3 — نشر الـ Backend على Render
1. ادخلي Render → **+ New** → **Web Service**
2. اربطي حسابك بـ GitHub واختاري المستودع
3. الإعدادات:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables** (مهم جداً):
   ```
   MONGO_URL = <connection string من Atlas>
   DB_NAME = magazine
   CORS_ORIGINS = *
   ADMIN_USERNAME = admin
   ADMIN_PASSWORD = School2025!
   ```
5. اضغطي **Create Web Service** → انتظري انتهاء النشر
6. انسخي الرابط الناتج، مثلاً: `https://magazine-api.onrender.com`

⚠️ **ملاحظة:** Render free يُوقف الخدمة عند عدم الاستخدام لـ 15 دقيقة. أول طلب بعد فترة قد يستغرق 30-60 ثانية. هذا طبيعي.

---

## الخطوة 4 — تحديث ملف _redirects
في `/frontend/public/_redirects`، استبدلي `YOUR-RENDER-APP.onrender.com` برابط Render الفعلي:
```
/api/*  https://magazine-api.onrender.com/api/:splat  200
/*      /index.html                                   200
```

---

## الخطوة 5 — بناء الـ Frontend
في مجلد `frontend/`:
```bash
yarn install
yarn build
```
سيُنشأ مجلد `build/`.

⚠️ **مهم:** لا تضعي `REACT_APP_BACKEND_URL` في الـ `.env` قبل البناء (اتركيه فارغاً أو احذفي السطر). هكذا سيستخدم نفس الدومين، و`_redirects` يتولّى توجيه `/api/*` إلى Render.

---

## الخطوة 6 — نشر الـ Frontend على Netlify
**الأسهل (سحب وإفلات):**
1. ادخلي netlify.com/drop
2. اسحبي مجلد `build/` كاملاً
3. سيُنشَأ موقع جديد فوراً برابط مثل: `https://stunning-rabbit-12345.netlify.app`
4. من إعدادات الموقع، يمكنكِ تغيير الاسم الفرعي إلى `magazine-56` فيصبح `magazine-56.netlify.app`

---

## الخطوة 7 — تجربة الموقع
- افتحي رابط Netlify
- تأكّدي من تسجيل الدخول للوحة الإدارة بـ `admin` / `School2025!`
- جرّبي إضافة مشاركة في أي قسم
- جرّبي رفع صورة وفيديو ورابط

---

## ⚠️ ملاحظات مهمّة

### رفع الملفات (صور/فيديو)
Render free tier filesystem **مؤقت**: أي ملف ترفعينه يُفقد عند restart (كل 15 دقيقة من عدم الاستخدام). الحل الدائم:
- استعملي روابط صور خارجية (Unsplash، Imgur...) بدل الرفع المباشر
- أو ترقية Render لخطّة مدفوعة فيها قرص ثابت
- أو ربط خدمة تخزين سحابية (Cloudinary مجاني للحجوم الصغيرة)

### تجديد الكلستر
MongoDB Atlas M0 يبقى نشطاً للأبد ما دامت قاعدة البيانات مُستخدَمة. لا يوجد timeout.

### مشكلة Safari/iPad cross-origin cookies
لا توجد هنا لأن استعمال `_redirects` يجعل كل شيء على نفس الدومين (same-origin)، فلا توجد كوكيز عبر مواقع.

---

## النتيجة النهائية
- 🌐 **رابط دائم مجّاني:** `magazine-56.netlify.app` (أو ما تختاريه)
- 🔗 **مختصرة بـ bit.ly:** `bit.ly/madrasa56` مثلاً
- 💰 **التكلفة:** صفر

بالتوفيق 🌟
