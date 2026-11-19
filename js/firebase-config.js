/**
 * ==============================================================================
 * إعدادات وتهيئة Firebase - منصة نبض الأمل
 * Firebase Configuration & Live Initialization
 * ==============================================================================
 */

// إعدادات مشروع Firebase المقدمة من المستخدم
const firebaseConfig = {
  apiKey: "AIzaSyDbxZS3gAO5JPeUdfbNXNjTrunI_MIMolo",
  authDomain: "new-folder-kk.firebaseapp.com",
  projectId: "new-folder-kk",
  storageBucket: "new-folder-kk.firebasestorage.app",
  messagingSenderId: "83000626912",
  appId: "1:83000626912:web:4c7afaac62c74d9edc0a85",
  measurementId: "G-V1K1EFGHSF"
};

// فحص وجود المفاتيح الحقيقية
const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes("YOUR_")
);

let app = null;
let auth = null;
let db = null;
let analytics = null;
let isDemoMode = false;

try {
  if (typeof firebase !== 'undefined' && isFirebaseConfigured) {
    // التحقق من عدم التهيئة مسبقاً
    if (!firebase.apps.length) {
      app = firebase.initializeApp(firebaseConfig);
    } else {
      app = firebase.app();
    }

    if (typeof firebase.auth === 'function') {
      auth = firebase.auth();
    }

    if (typeof firebase.firestore === 'function') {
      db = firebase.firestore();
      // محاولة تمكين التخزين المؤقت دون اتصال
      try {
        db.enablePersistence({ synchronizeTabs: true }).catch(() => {
          // تجاهل إن كان مفعلاً في تبويب آخر
        });
      } catch (e) {
        // تجاهل
      }
    }

    if (typeof firebase.analytics === 'function' && firebaseConfig.measurementId) {
      try {
        analytics = firebase.analytics();
      } catch (e) {
        console.info("Firebase Analytics initialized in supported environment");
      }
    }

    console.log("✅ تم الاتصال بنجاح بمشروع Firebase: " + firebaseConfig.projectId);
  } else {
    isDemoMode = true;
    console.info("ℹ️ مكتبة Firebase غير متوفرة بعد أو لم يتم تحميلها، النمط المحلي مفعل.");
  }
} catch (error) {
  console.warn("⚠️ تنبيه أثناء الاتصال بـ Firebase، سيتم التراجع للنمط المحلي الذكي:", error);
  isDemoMode = true;
}

// تصدير الكائن العام
window.AppFirebase = {
  config: firebaseConfig,
  isConfigured: isFirebaseConfigured,
  isDemoMode: isDemoMode,
  app: app,
  auth: auth,
  db: db,
  analytics: analytics
};
