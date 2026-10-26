# تسجيل الدخول بجوجل (Firebase) — خطوات الإعداد

**اللي اتغيّر:** تصفح الموقع مفتوح للجميع بدون حساب. بس **كتابة رسالة** و**رفع صورة** محتاجين تسجيل دخول بجوجل (مرة واحدة، والموقع بيفتكر الحساب). إيميل واسم الحساب بيتسجلوا في الشيت (أعمدة `email` و `gname` و `guid` في تابّي **Messages** و **Photos**) ومبيظهروش لأي زائر. روابط `#admin` و `#founder` شغالة بالمفاتيح زي ما هي من غير جوجل.

**الأمان من الأعطال:** لو `firebase` في `config.js` فاضية، والـ `FIREBASE_*` في الباك اند فاضية، الموقع بيشتغل زي الأول بالظبط. يعني تقدر ترفع الملفات الأول وتفعّل بعدين.

## الترتيب الآمن (بدون ثانية توقف)
1. **Firebase** (الخطوات 1–4 تحت).
2. **الباك اند:** الصق `backend/Code.gs` الجديد (من غير تعديل أي حاجة، مفاتيحك زي ما هي) → Deploy → Manage deployments → Edit → New version. لسه مفيش أي تغيير في السلوك.
3. **GitHub:** ارفع `index.html`, `css/style.css`, `js/config.js` (بعد ما تملا `firebase`), `js/auth.js`, `js/app.js`. جرّب الموقع: زر "Sign in with Google" هيظهر فوق نموذج الرسالة.
4. **فعّل الإلزام:** Apps Script → Project Settings → Script properties → أضف:
   - `FIREBASE_PROJECT_ID` = projectId
   - `FIREBASE_API_KEY` = apiKey
   
   بعدها شغّل دالة `authCheck` مرة من المحرر (هيطلب صلاحية الاتصال بالإنترنت: وافق). لازم يطلع في الـ Logs: `OK: the API key works...`.
   
   **للتراجع في أي لحظة:** امسح الـ Property دي وارجع للوضع القديم فورًا (من غير Deploy).

## 1) Firebase console
1. <https://console.firebase.google.com> → **Add project** (أو اختار مشروع موجود).
2. **Build → Authentication → Get started → Sign-in method → Google → Enable** → اختار support email → Save.
3. **Authentication → Settings → Authorized domains → Add domain** وضيف دومين الموقع: `username.github.io` (بدون `https://` وبدون مسار). لو عندك دومين خاص ضيفه كمان.
4. **Project settings (⚙️) → General → Your apps → Web `</>`** → سجّل التطبيق (من غير Hosting) → انسخ `apiKey`, `authDomain`, `projectId`, `appId` في `js/config.js` جوه `firebase: { ... }`.

## 2) الشيت
مفيش حاجة تعملها: الأعمدة الجديدة بتتضاف لوحدها في آخر التابّين، والرسائل والصور القديمة زي ما هي (الأعمدة بتفضل فاضية ليها).

## Troubleshooting
| المشكلة | الحل |
|---|---|
| `auth/unauthorized-domain` | ضيف الدومين في Authorized domains (خطوة 3) |
| الزائر بيفتح من فيسبوك/انستجرام ومبيقدرش يسجّل | جوجل بتمنع الدخول من جوة متصفحات التطبيقات. الموقع بيقوله يفتح اللينك في Chrome/Safari وبينسخ اللينك لوحده |
| رسالة "Could not verify your Google account" (`authfail`) | شغّل `authCheck()` وشوف الـ Logs. لو 403: الـ API key عليه قيود HTTP referrer → إمّا شيل القيد، أو حط `SITE_ORIGIN` = `https://username.github.io` في Script properties |
| `You do not have permission to call UrlFetchApp.fetch` | شغّل `authCheck()` من المحرر ووافق على الصلاحيات، وبعدها Deploy → New version |
| ناس لسه بتشوف خطأ بعد التفعيل | صفحة قديمة متخزنة: Ctrl+F5 |
| `diagnose()` | بيطبع حالة اللوجين (ON/OFF) وآخر خطأ في السيرفر |

## ملاحظات
- الـ `apiKey` بتاع Firebase مش سر (بيتحط في الصفحة عادي). السر الحقيقي هو `ADMIN_KEY` / `FOUNDER_KEY`: لو الريبو public فهما ظاهرين لأي حد في `Code.gs`. الأفضل تنقلهم لـ Script properties بنفس الأسماء وتشيل القيم من الملف، وتغيّرهم.
- الحظر (Block) لسه بيشتغل على الجهاز زي ما هو. الإيميل في الشيت بيخليك تعرف مين صاحب الرسالة/الصورة.
