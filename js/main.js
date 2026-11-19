/**
 * ==============================================================================
 * السلوكيات العامة المشتركة والتنقل - منصة نبض الأمل
 * Shared UI Controller & Navigation
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  injectModalsAndToasts();
  initFooterNewsletter();
  initFirebaseBadge();
});

/**
 * تحديد الرابط النشط في القائمة العلوية بناءً على مسار الصفحة
 */
function initNavigation() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('nav a, #mobileDrawer a');

  const pathToDataMap = {
    'index.html': 'home',
    '': 'home',
    'stories.html': 'heroes-stories',
    'calculator.html': 'donation-calculator',
    'partners.html': 'partners-and-hospitals',
    'about.html': 'about-initiative',
    'donate.html': 'quick-donate'
  };

  const currentDataPath = pathToDataMap[currentPath] || 'home';

  navLinks.forEach(link => {
    const linkPath = link.getAttribute('data-path');
    if (linkPath === currentDataPath) {
      link.classList.add('bg-primary-container', 'text-on-primary-container', 'font-semibold');
      link.classList.remove('text-on-surface-variant');
    } else {
      link.classList.remove('bg-primary-container', 'text-on-primary-container', 'font-semibold');
      link.classList.add('text-on-surface-variant');
    }
  });

  // التحكم في القائمة الجانبية للشاشات الصغيرة
  const mobileMenuBtn = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileDrawerClose = document.getElementById('mobileDrawerClose');
  const mobileOverlay = document.getElementById('mobileOverlay');

  if (mobileMenuBtn && mobileDrawer) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileDrawer.classList.remove('translate-x-full');
      mobileOverlay?.classList.remove('hidden');
    });
  }

  const closeDrawer = () => {
    mobileDrawer?.classList.add('translate-x-full');
    mobileOverlay?.classList.add('hidden');
  };

  mobileDrawerClose?.addEventListener('click', closeDrawer);
  mobileOverlay?.addEventListener('click', closeDrawer);
}

/**
 * حقن قوالب نوافذ الدخول والملف الشخصي والإشعارات
 */
function injectModalsAndToasts() {
  // 1. Toast Container
  if (!document.getElementById('toast-container')) {
    const toastBox = document.createElement('div');
    toastBox.id = 'toast-container';
    document.body.appendChild(toastBox);
  }

  // 2. Auth Modal
  if (!document.getElementById('authModal')) {
    const authModal = document.createElement('div');
    authModal.id = 'authModal';
    authModal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop hidden';
    authModal.innerHTML = `
      <div class="relative w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 lg:p-8 shadow-2xl modal-content">
        <!-- Close Button -->
        <button type="button" onclick="window.hopeAuthService.closeAuthModal()" class="absolute top-5 left-5 w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div class="flex items-center gap-3 mb-6">
          <div class="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-[22px]">favorite</span>
          </div>
          <div>
            <h3 class="font-headline-sm text-lg font-bold text-on-surface">بوابة المتبرعين والداعمين</h3>
            <p class="font-label-sm text-xs text-on-surface-variant">مربوطة بـ Firebase Authentication</p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="grid grid-cols-2 p-1 rounded-xl bg-surface-container-low font-label-md text-sm mb-6">
          <button id="tabLoginBtn" type="button" onclick="window.hopeAuthService.switchAuthTab('login')" class="py-2 rounded-lg bg-surface-container-lowest text-primary font-bold shadow-sm text-center transition-all">تسجيل الدخول</button>
          <button id="tabRegisterBtn" type="button" onclick="window.hopeAuthService.switchAuthTab('register')" class="py-2 rounded-lg text-on-surface-variant hover:text-on-surface text-center transition-all">إنشاء حساب جديد</button>
        </div>

        <!-- Google Quick Sign-in -->
        <button type="button" onclick="handleGoogleSignIn()" class="w-full py-3 px-4 rounded-xl border border-outline-variant/60 hover:bg-surface-container transition-all flex items-center justify-center gap-3 text-sm font-semibold text-on-surface mb-5">
          <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.36 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>
          <span>المتابعة عبر حساب Google</span>
        </button>

        <div class="relative flex items-center justify-center mb-5">
          <div class="border-t border-outline-variant/40 w-full"></div>
          <span class="bg-surface-container-lowest px-3 text-xs text-on-surface-variant font-medium">أو عبر البريد</span>
        </div>

        <!-- Login Form -->
        <form id="loginForm" onsubmit="handleLoginSubmit(event)" class="flex flex-col gap-4">
          <div>
            <label class="block text-xs font-semibold text-on-surface mb-1">البريد الإلكتروني</label>
            <input type="email" id="loginEmail" required placeholder="name@example.com" class="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-on-surface mb-1">كلمة المرور</label>
            <input type="password" id="loginPassword" required placeholder="••••••••" class="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-sm">
          </div>
          <button type="submit" class="w-full py-3 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-bold text-sm shadow-md transition-all mt-2">
            تسجيل الدخول
          </button>
        </form>

        <!-- Register Form -->
        <form id="registerForm" onsubmit="handleRegisterSubmit(event)" class="flex flex-col gap-4 hidden">
          <div>
            <label class="block text-xs font-semibold text-on-surface mb-1">الاسم الكريم / اللقب</label>
            <input type="text" id="regName" required placeholder="فاعل خير أو اسمك" class="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-on-surface mb-1">البريد الإلكتروني</label>
            <input type="email" id="regEmail" required placeholder="name@example.com" class="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-sm">
          </div>
          <div>
            <label class="block text-xs font-semibold text-on-surface mb-1">كلمة المرور</label>
            <input type="password" id="regPassword" required placeholder="6 أحرف على الأقل" class="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 focus:outline-none focus:border-primary text-sm">
          </div>
          <button type="submit" class="w-full py-3 rounded-xl bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container font-bold text-sm shadow-md transition-all mt-2">
            إنشاء الحساب
          </button>
        </form>
      </div>
    `;
    document.body.appendChild(authModal);
  }

  // 3. User Profile Modal
  if (!document.getElementById('profileModal')) {
    const profileModal = document.createElement('div');
    profileModal.id = 'profileModal';
    profileModal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop hidden';
    profileModal.innerHTML = `
      <div class="relative w-full max-w-lg bg-surface-container-lowest rounded-3xl p-6 lg:p-8 shadow-2xl modal-content">
        <button type="button" onclick="window.hopeAuthService.closeProfileModal()" class="absolute top-5 left-5 w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div class="flex items-center gap-4 mb-6 pb-6 border-b border-outline-variant/30">
          <img id="profileModalAvatar" src="" alt="Avatar" class="w-16 h-16 rounded-full object-cover ring-4 ring-primary-fixed">
          <div>
            <h3 id="profileModalName" class="font-headline-sm text-xl font-bold text-on-surface">فاعل خير</h3>
            <p id="profileModalEmail" class="font-body-sm text-sm text-on-surface-variant">user@example.com</p>
            <span class="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary-fixed/30 px-2.5 py-0.5 rounded-full mt-1">
              <span class="material-symbols-outlined text-[14px]">verified</span> كافل معتمد
            </span>
          </div>
        </div>

        <h4 class="font-headline-sm text-base font-bold text-on-surface mb-3 flex items-center gap-2">
          <span class="material-symbols-outlined text-secondary text-[20px]">receipt_long</span>
          <span>سجل تبرعاتك وكفالاتك الأخيرة</span>
        </h4>
        <div id="userDonationsList" class="flex flex-col gap-2.5 max-h-60 overflow-y-auto mb-6 pr-1">
          <!-- Loaded dynamically -->
        </div>

        <div class="flex items-center justify-between pt-4 border-t border-outline-variant/30">
          <button type="button" onclick="handleLogout()" class="px-4 py-2 rounded-xl text-error hover:bg-error-container/30 text-sm font-bold transition-colors flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px]">logout</span>
            <span>تسجيل الخروج</span>
          </button>
          <a href="donate.html" class="px-5 py-2.5 rounded-xl bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container text-sm font-bold transition-all">
            تبرع جديد 💛
          </a>
        </div>
      </div>
    `;
    document.body.appendChild(profileModal);
  }
}

/**
 * شارة حالة الاتصال بـ Firebase
 */
function initFirebaseBadge() {
  if (document.getElementById('firebaseStatusBadge')) return;

  const isLive = window.AppFirebase && !window.AppFirebase.isDemoMode;
  const badge = document.createElement('div');
  badge.id = 'firebaseStatusBadge';
  badge.className = 'fixed bottom-4 right-4 z-40 bg-surface-container-lowest/95 backdrop-blur-md border border-outline-variant/40 rounded-full py-1.5 px-3.5 shadow-lg flex items-center gap-2.5 text-xs font-semibold cursor-pointer transition-transform hover:scale-105';
  badge.title = 'اضغط لمعرفة تفاصيل الربط بـ Firebase';

  badge.innerHTML = isLive
    ? `<span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
       <span class="text-on-surface">متصل بـ Firebase Live</span>`
    : `<span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
       <span class="text-on-surface">Firebase: نمط المحاكاة الذكي</span>
       <span class="material-symbols-outlined text-[16px] text-secondary">info</span>`;

  badge.addEventListener('click', () => {
    window.showFirebaseInfoModal();
  });

  document.body.appendChild(badge);
}

/**
 * نافذة شرح إعدادات Firebase للمستخدم
 */
window.showFirebaseInfoModal = function() {
  const isLive = window.AppFirebase && !window.AppFirebase.isDemoMode;
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop';
  modal.innerHTML = `
    <div class="relative w-full max-w-lg bg-surface-container-lowest rounded-3xl p-6 lg:p-8 shadow-2xl modal-content">
      <button type="button" onclick="this.closest('.modal-backdrop').remove()" class="absolute top-5 left-5 w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors">
        <span class="material-symbols-outlined text-[20px]">close</span>
      </button>

      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
          <span class="material-symbols-outlined text-[24px]">database</span>
        </div>
        <div>
          <h3 class="font-headline-sm text-lg font-bold text-on-surface">حالة الاتصال بقاعدة بيانات Firebase</h3>
          <p class="text-xs text-on-surface-variant">Cloud Firestore & Authentication</p>
        </div>
      </div>

      <div class="p-4 rounded-2xl ${isLive ? 'bg-emerald-50 border border-emerald-200 text-emerald-900' : 'bg-amber-50 border border-amber-200 text-amber-900'} mb-5 text-sm leading-relaxed">
        ${isLive ? `
          <div class="font-bold mb-1 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-emerald-600">check_circle</span>
            <span>المنصة متصلة مباشرة بمشروع Firebase الخاص بك!</span>
          </div>
          <p class="text-xs">يتم تسجيل التبرعات فوراً في مجموعة <code>donations</code> والمستخدمين عبر <code>Firebase Auth</code>.</p>
        ` : `
          <div class="font-bold mb-1 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-amber-600">tips_and_updates</span>
            <span>المنصة جاهزة 100% وتعمل حالياً بالنمط الذكي التفاعلي!</span>
          </div>
          <p class="text-xs">كافة الإجراءات (التبرعات، الحاسبة، تسجيل الدخول) تحفظ محلياً بدقة وتتحدث آنياً. لربط مشروعك السحابي الخاص بك في أي لحظة:</p>
        `}
      </div>

      <div class="bg-surface-container-low p-4 rounded-2xl mb-6 text-xs text-on-surface space-y-2">
        <p class="font-bold text-primary">خطوات ربط مشروعك الشخصي:</p>
        <ol class="list-decimal list-inside space-y-1 text-on-surface-variant">
          <li>افتح ملف <code class="bg-surface-container px-1 py-0.5 rounded text-primary font-mono">js/firebase-config.js</code>.</li>
          <li>استبدل قيم <code class="font-mono">firebaseConfig</code> بمفاتيح مشروعك من Firebase Console.</li>
          <li>احفظ الملف وسيتصل الموقع مباشرة بالسحابة تلقائياً!</li>
        </ol>
      </div>

      <button type="button" onclick="this.closest('.modal-backdrop').remove()" class="w-full py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow transition-all">
        حسناً، فهمت ذلك
      </button>
    </div>
  `;
  document.body.appendChild(modal);
};

/**
 * نظام إظهار التنبيهات المنبثقة (Toast Notifications)
 */
window.showToast = function(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    info: 'bg-primary text-white'
  };

  const icons = {
    success: 'check_circle',
    error: 'error',
    info: 'info'
  };

  toast.className = `toast flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl ${bgColors[type] || bgColors.success}`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-[20px]">${icons[type] || 'info'}</span>
    <span class="font-label-md text-sm leading-snug font-medium">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

/**
 * معالجة تسجيل الدخول بحساب Google
 */
async function handleGoogleSignIn() {
  const res = await window.hopeAuthService.loginWithGoogle();
  if (res.success) {
    window.hopeAuthService.closeAuthModal();
    window.showToast(`مرحباً بك مجدداً يا ${window.hopeAuthService.currentUser.displayName}! 💛`, 'success');
  } else {
    window.showToast(res.error || 'فشل تسجيل الدخول عبر Google', 'error');
  }
}

/**
 * معالجة نموذج تسجيل الدخول بالبريد
 */
async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;

  const res = await window.hopeAuthService.loginWithEmail(email, pass);
  if (res.success) {
    window.hopeAuthService.closeAuthModal();
    window.showToast(`تم تسجيل الدخول بنجاح! أهلاً بك 🌸`, 'success');
  } else {
    window.showToast(res.error, 'error');
  }
}

/**
 * معالجة نموذج إنشاء حساب جديد
 */
async function handleRegisterSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pass = document.getElementById('regPassword').value;

  const res = await window.hopeAuthService.registerWithEmail(name, email, pass);
  if (res.success) {
    window.hopeAuthService.closeAuthModal();
    window.showToast(`تم إنشاء حسابك بنجاح! شكراً لانضمامك لعائلة نبض الأمل 🌟`, 'success');
  } else {
    window.showToast(res.error, 'error');
  }
}

/**
 * معالجة تسجيل الخروج
 */
async function handleLogout() {
  await window.hopeAuthService.logout();
  window.hopeAuthService.closeProfileModal();
  window.showToast('تم تسجيل الخروج بنجاح.', 'info');
}

/**
 * تهيئة نموذج النشرة البريدية في الفوتر
 */
function initFooterNewsletter() {
  const forms = document.querySelectorAll('.footer-newsletter-form');
  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (!input || !input.value.trim()) return;

      const email = input.value.trim();
      const res = await window.hopeDataService.subscribeNewsletter(email);
      if (res.success) {
        window.showToast('شكراً لاشتراكك! ستصلك قصص أبطالنا الملهمة دورياً 💌', 'success');
        input.value = '';
      }
    });
  });
}
