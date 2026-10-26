/* ===================== CLASS OF 2026 — SETTINGS (edit only this file) =====================
   Every value is plain text. Multi-line values: one item per line, fields separated by |
   Icons: use a 3D icon name from assets/icons (without the extension), e.g. graduation_cap, stethoscope, hot_beverage,
   or type any normal emoji. Full guide: README.md */
window.SITE = {
  name: "طب الأزهر دمياط",
  logo: "assets/logo.webp",                             // e.g. assets/logo.webp  (empty = "YOUR LOGO" placeholder)
  frame: "assets/frame.png",             // square (1:1) PNG with a transparent middle — visitors upload a photo that sits behind it
  frameOpens: "2026-12-10T14:00:00",     // Frame tool stays locked with a "coming soon" overlay until this date/time. Leave "" to unlock it right away.
  date: "2026-12-19T13:00:00",           // graduation date & time
  since: "2021-10-10",                   // "days since" counter
  music: "assets/audio/music1.mp3",       // put your mp3 here (plays with the intro)
  gradsound: "assets/audio/grad.mp3",                         // graduation-day sound, e.g. assets/audio/grad.mp3
  milestones: ``,                        // countdown sounds, one per line: 50=assets/audio/50days.mp3
  /* cinematic ambient light around the photo in the viewer (moving glow made from the photo's own colours, kept dark / grey):  "on"  or  "off"  */
  cinematic: "on",
  /* staff badges: the small round mark next to the name of messages sent from the #founder link / the #admin link (tap it -> a tiny popup: المؤسس / تيم التخرج).
     Put the image in assets/ (square, any size). Empty = the class logo is used. */
  founderBadge: "assets/badge-logo.webp",                   // messages sent from  yoursite/#founder
  teamBadge: "assets/badge-logo.webp",                      // messages sent from  yoursite/#admin  (change this later to your second image, e.g. assets/team-badge.png)
  backend: "https://script.google.com/macros/s/AKfycbxxac1s8H7W7_yz2noqiedX4I1vd0hKnt0SJKqe_vPN9iaTvCwvSh0aO9-FtCuvWmIg/exec",                           // Google Apps Script Web app URL (see README.md)

  /* ===== تسجيل الدخول بجوجل (Firebase) — مطلوب فقط لكتابة رسالة أو رفع صورة. تصفح الموقع مفتوح للجميع بدون حساب.
     املأ القيم من Firebase console > Project settings > Your apps > Web app (الخطوات في FIREBASE_SETUP.md).
     لو سيبتها فاضية: الموقع يشتغل زي الأول بالظبط (بدون تسجيل دخول). ===== */
  firebase: {
    apiKey: "AIzaSyBnxQuNCt-I3BwhPJJ_xCtoAQ1cCHd6Z3w",
    authDomain: "aud2026.firebaseapp.com",
    projectId: "aud2026",
    appId: "1:177036832691:web:e840471f7954af7b74a5c6"
  },

  intro: `SENIORS 2026
5 years. 10 semesters. One dream.
A thousand memories.
THE LAST CHAPTER BEGINS`,

  ticker: `graduation_cap | SENIORS 2026
hot_beverage | COFFEE: ∞
stethoscope | OSCE SURVIVORS
books | JUST ONE MORE CHAPTER
sleeping_face | SLEEP IS OPTIONAL
brain | WHAT WAS THAT MNEMONIC AGAIN?
party_popper | WE MADE IT`,

  /* ===== المشروع الخيري للدفعة (Charity project) — كل شيء هنا ===== */
  charityTitle: `المشروع الخيري للدفعة`,
  charityText: `شاركنا في المشروع الخيري للدفعة. كل مساهمة، مهما كانت بسيطة، بتفرق.`,
  charityImage: `assets/charity.webp`,                      // ضع صورة التصميم في assets/ واكتب مسارها هنا، مثال: assets/charity.jpg  (فاضي = تظهر "التصميم قريبًا")
  /* وسائل التبرع — سطر لكل وسيلة:   النوع | الاسم الظاهر | الرقم | لينك التبرع (اختياري)
     النوع: vodafone أو instapay.
     • لو كتبت لينك: الضغط على الكارت بيفتح لينك التبرع مباشرة (وفيه زرار صغير لنسخ الرقم).
     • لو مفيش لينك: الضغط على الكارت بينسخ الرقم.
     • لو الرقم واللينك فاضيين: الكارت بيظهر "قريبًا".
     مثال إنستا باي:  instapay | InstaPay | 01012345678 | https://ipn.eg/S/username/instapay/xxxxxx */
  donate: `vodafone | Vodafone Cash | 01025696317 |
    vodafone | Vodafone Cash | 01019092741 |
instapay | InstaPay (1) | 01025696317 |
instapay | InstaPay (2) | 01274187463 |`,

  stats: `hot_beverage | Cups of coffee | ∞
sleeping_face | Hours of sleep we never got | ∞
brain | Facts memorized, then forgotten | ∞
stethoscope | Promises of "just one more chapter" | ∞`,

  social: `instagram=https://www.instagram.com/aud_med_2026/
facebook=https://www.facebook.com/profile.php?id=61583995127897
X=https://x.com/AudMed2026
telegram=`,

  events: `coat | Senior Jacket Day | 2026-11-07 12:00 | Arcadia space | Pick up your jacket and take the group photo.
party_popper | Graduation Ceremony | 2026-12-19 13:00 | College | The chapter is complete. Arrive by 12:00.`,

  announce: `Senior Jacket Day is coming! | SOON | | 2026-09-01 | 2026-11-07`,

  polls: `خد من الكلية ايه؟ | مدمن كافيين | اقرعيت من الصلع الوراثي | بتسف بنادول | ارق ومعرفش انام  
كام مره طبقت ف الامتحانات؟ | ولا مرة | مرتين او تلاتة | كتير | يعني ايه نوم  
دمياط هتوحشك | لا | no | Nein  | ممكن `,

  cats: `FIRST DAY, SENIOR JACKET, OSCE, LECTURES, HOSPITAL, SENIORS CHILD, FRIENDS, FUNNY MOMENTS, GRADUATION`,

  /* exam roadmap: icon | Subject name | YYYY-MM-DD  — each gets an automatic ✓ once its exam
     day passes 2:00 PM. Icons here are the flat/grainy set in assets/icons (heart_pulse,
     family_group, book_open, scalpel, anesthesia_mask, bone_joint). */
  exams: `heart_pulse | Internal Medicine | 2026-10-24
family_group | Family Medicine | 2026-11-07
book_open | Elective | 2026-11-21
scalpel | Surgery | 2026-11-28
anesthesia_mask | Anesthesia | 2026-12-05
bone_joint | Orthopedics | 2026-12-19`,

  /* your own photos for the board: file | title | CATEGORY | date   (put files in assets/photos/) */
  photos: ``
  /* example:  assets/photos/01.jpg | Day one | FIRST DAY | 2021-10-10 */
};

