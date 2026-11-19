/**
 * ==============================================================================
 * خدمة البيانات وعمليات Firebase - منصة نبض الأمل
 * Unified Firebase Data & Storage Service
 * ==============================================================================
 */

// البيانات الافتراضية الأولية لمحاكاة النظام وعرض النبض الحي
const INITIAL_DEMO_DONATIONS = [
  {
    id: "don_101",
    donorName: "فاعل خير",
    donorEmail: "anonymous@hope.org",
    amount: 1000,
    type: "كفالة علاجية شهرية",
    frequency: "monthly",
    targetHero: "الطفلة سارة",
    message: "نسأل الله لها الشفاء العاجل والتوفيق",
    paymentMethod: "Apple Pay",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    id: "don_102",
    donorName: "د. عبد الرحمن السبيعي",
    donorEmail: "abdulrahman@example.com",
    amount: 500,
    type: "كفالة جلستين غسيل",
    frequency: "once",
    targetHero: "عام",
    message: "أعانكم الله وبارك في جهودكم الطبية",
    paymentMethod: "Mada",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: "don_103",
    donorName: "مجموعة فاعل خير للبر",
    donorEmail: "group@charity.org",
    amount: 250,
    type: "كفالة جلسة غسيل كاملة",
    frequency: "once",
    targetHero: "الطفل عمر",
    message: "كل الحب لبطلنا عمر",
    paymentMethod: "Visa",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    id: "don_104",
    donorName: "أم عبد الله",
    donorEmail: "omabdullah@example.com",
    amount: 100,
    type: "سلة ألعاب ورسم أثناء الجلسة",
    frequency: "once",
    targetHero: "الطفل ريان",
    message: "صناع البسمة لأغلى أطفال",
    paymentMethod: "Apple Pay",
    createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString()
  }
];

class FirebaseDataService {
  constructor() {
    this.storageKey = 'hope_vitality_donations';
    this.partnerStorageKey = 'hope_vitality_partners';
    this.newsletterStorageKey = 'hope_vitality_newsletters';
    this.listeners = [];
    this.statsListeners = [];

    // تهيئة البيانات المحلية إن لم تكن موجودة
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify(INITIAL_DEMO_DONATIONS));
    }
  }

  get isLive() {
    return window.AppFirebase && !window.AppFirebase.isDemoMode && window.AppFirebase.db;
  }

  /**
   * إنشاء تبرع جديد وتوثيقه في Firebase Firestore
   */
  async createDonation(data) {
    const donation = {
      donorName: data.donorName || "فاعل خير",
      donorEmail: data.donorEmail || "anonymous@hope.org",
      donorPhone: data.donorPhone || "",
      amount: Number(data.amount) || 100,
      type: data.type || "تبرع عام",
      frequency: data.frequency || "once",
      targetHero: data.targetHero || "عام",
      message: data.message || "",
      paymentMethod: data.paymentMethod || "Mada",
      status: "completed",
      createdAt: new Date().toISOString()
    };

    if (this.isLive) {
      try {
        const docRef = await window.AppFirebase.db.collection('donations').add({
          ...donation,
          createdAt: (typeof firebase !== 'undefined' && firebase.firestore?.FieldValue?.serverTimestamp)
            ? firebase.firestore.FieldValue.serverTimestamp()
            : new Date()
        });
        donation.id = docRef.id;
        console.log("Firebase Firestore: تم حفظ التبرع بنجاح برقم:", docRef.id);
        this._saveLocalDonation(donation, false);
        return { success: true, id: docRef.id, donation, mode: 'firebase' };
      } catch (err) {
        console.error("Firebase error writing donation (falling back to local):", err);
        return this._saveLocalDonation(donation, true);
      }
    } else {
      return this._saveLocalDonation(donation, true);
    }
  }

  _saveLocalDonation(donation, notify = true) {
    const local = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    if (!donation.id) {
      donation.id = 'don_' + Date.now();
    }
    // تجنب التكرار
    const existingIndex = local.findIndex(item => item.id === donation.id);
    if (existingIndex >= 0) {
      local[existingIndex] = donation;
    } else {
      local.unshift(donation);
    }
    localStorage.setItem(this.storageKey, JSON.stringify(local));

    if (notify) {
      this._notifyListeners();
    }
    return { success: true, id: donation.id, donation, mode: 'local' };
  }

  /**
   * الاستماع للتبرعات الحيّة
   */
  subscribeDonations(callback) {
    if (this.isLive) {
      try {
        const unsubscribe = window.AppFirebase.db.collection('donations')
          .orderBy('createdAt', 'desc')
          .limit(20)
          .onSnapshot((snapshot) => {
            const donations = [];
            snapshot.forEach(doc => {
              const d = doc.data();
              donations.push({
                id: doc.id,
                ...d,
                createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (d.createdAt || new Date().toISOString())
              });
            });
            if (donations.length > 0) {
              callback(donations);
            } else {
              callback(this.getLocalDonations());
            }
          }, (error) => {
            console.warn("Firestore onSnapshot error, fallback to local:", error);
            callback(this.getLocalDonations());
          });

        return unsubscribe;
      } catch (e) {
        console.warn("Firebase query setup exception:", e);
        callback(this.getLocalDonations());
      }
    } else {
      this.listeners.push(callback);
      callback(this.getLocalDonations());
      return () => {
        this.listeners = this.listeners.filter(cb => cb !== callback);
      };
    }
  }

  /**
   * حساب الإحصائيات المباشرة (عدد الجلسات، المبلغ، نسبة الهدف)
   */
  subscribeStats(callback) {
    const compute = (donations) => {
      const baseSessions = 1420;
      const targetSessions = 2000;
      const sessionCost = 250;

      const newDonationsTotal = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
      const additionalSessions = Math.floor(newDonationsTotal / sessionCost);
      const totalSessions = Math.min(targetSessions, baseSessions + additionalSessions);
      const percentage = Math.min(100, Math.round((totalSessions / targetSessions) * 100));
      const remainingSessions = Math.max(0, targetSessions - totalSessions);

      return {
        baseSessions,
        totalSessions,
        targetSessions,
        remainingSessions,
        percentage,
        totalDonationsAmount: newDonationsTotal,
        totalDonorsCount: donations.length + 840
      };
    };

    if (this.isLive) {
      return this.subscribeDonations((donations) => {
        callback(compute(donations));
      });
    } else {
      this.statsListeners.push(callback);
      callback(compute(this.getLocalDonations()));
      return () => {
        this.statsListeners = this.statsListeners.filter(cb => cb !== callback);
      };
    }
  }

  _notifyListeners() {
    const donations = this.getLocalDonations();
    this.listeners.forEach(cb => {
      try { cb(donations); } catch(e) { console.error(e); }
    });
    this.statsListeners.forEach(cb => {
      try {
        const totalAmount = donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
        const totalSessions = Math.min(2000, 1420 + Math.floor(totalAmount / 250));
        cb({
          totalSessions,
          targetSessions: 2000,
          remainingSessions: Math.max(0, 2000 - totalSessions),
          percentage: Math.min(100, Math.round((totalSessions / 2000) * 100)),
          totalDonationsAmount: totalAmount,
          totalDonorsCount: donations.length + 840
        });
      } catch(e) { console.error(e); }
    });
  }

  getLocalDonations() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    } catch(e) {
      return INITIAL_DEMO_DONATIONS;
    }
  }

  /**
   * حفظ طلب شراكة مستشفى أو جهة راعية في Firestore
   */
  async submitPartnership(partnerData) {
    const payload = {
      ...partnerData,
      submittedAt: new Date().toISOString()
    };

    if (this.isLive) {
      try {
        const docRef = await window.AppFirebase.db.collection('partnerships').add({
          ...payload,
          createdAt: (typeof firebase !== 'undefined' && firebase.firestore?.FieldValue?.serverTimestamp)
            ? firebase.firestore.FieldValue.serverTimestamp()
            : new Date()
        });
        return { success: true, id: docRef.id, mode: 'firebase' };
      } catch(err) {
        console.error("Firestore partner error:", err);
      }
    }

    // حفظ محلي في النمط التجريبي
    const local = JSON.parse(localStorage.getItem(this.partnerStorageKey) || '[]');
    local.push(payload);
    localStorage.setItem(this.partnerStorageKey, JSON.stringify(local));
    return { success: true, id: 'part_' + Date.now(), mode: 'local' };
  }

  /**
   * الاشتراك في النشرة البريدية
   */
  async subscribeNewsletter(email) {
    const payload = {
      email,
      subscribedAt: new Date().toISOString()
    };

    if (this.isLive) {
      try {
        await window.AppFirebase.db.collection('newsletter_subscribers').add({
          ...payload,
          createdAt: (typeof firebase !== 'undefined' && firebase.firestore?.FieldValue?.serverTimestamp)
            ? firebase.firestore.FieldValue.serverTimestamp()
            : new Date()
        });
        return { success: true, mode: 'firebase' };
      } catch(err) {
        console.error("Firestore newsletter error:", err);
      }
    }

    const local = JSON.parse(localStorage.getItem(this.newsletterStorageKey) || '[]');
    local.push(payload);
    localStorage.setItem(this.newsletterStorageKey, JSON.stringify(local));
    return { success: true, mode: 'local' };
  }
}

// تصدير كائن الخدمة العام
window.hopeDataService = new FirebaseDataService();
