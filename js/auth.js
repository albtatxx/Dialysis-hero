/**
 * ==============================================================================
 * إدارة هوية المستخدم والمصادقة مع Firebase Auth - منصة نبض الأمل
 * Firebase Authentication & User State Management
 * ==============================================================================
 */

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authListeners = [];
    this.demoUserKey = 'hope_current_user';
    this.init();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.updateHeaderProfile());
    } else {
      this.updateHeaderProfile();
    }
  }

  get isLive() {
    return window.AppFirebase && !window.AppFirebase.isDemoMode && window.AppFirebase.auth;
  }

  init() {
    if (this.isLive) {
      window.AppFirebase.auth.onAuthStateChanged((user) => {
        if (user) {
          this.currentUser = {
            uid: user.uid,
            displayName: user.displayName || user.email.split('@')[0],
            email: user.email,
            photoURL: user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
            isAnonymous: user.isAnonymous
          };
        } else {
          this.currentUser = null;
        }
        this._notifyAuthChange();
      });
    } else {
      // استرجاع المستخدم التجريبي إن وجد
      const savedUser = localStorage.getItem(this.demoUserKey);
      if (savedUser) {
        try {
          this.currentUser = JSON.parse(savedUser);
        } catch (e) {
          this.currentUser = null;
        }
      }
      setTimeout(() => this._notifyAuthChange(), 100);
    }
  }

  onAuthChanged(callback) {
    this.authListeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.authListeners = this.authListeners.filter(cb => cb !== callback);
    };
  }

  _notifyAuthChange() {
    this.authListeners.forEach(cb => {
      try { cb(this.currentUser); } catch(e) { console.error(e); }
    });
    this.updateHeaderProfile();
  }

  async loginWithEmail(email, password) {
    if (this.isLive) {
      try {
        const cred = await window.AppFirebase.auth.signInWithEmailAndPassword(email, password);
        return { success: true, user: cred.user };
      } catch (err) {
        return { success: false, error: this._translateAuthError(err) };
      }
    } else {
      // تسجيل دخول تجريبي
      this.currentUser = {
        uid: 'user_' + Date.now(),
        displayName: email.split('@')[0],
        email: email,
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        isAnonymous: false
      };
      localStorage.setItem(this.demoUserKey, JSON.stringify(this.currentUser));
      this._notifyAuthChange();
      return { success: true, user: this.currentUser, demo: true };
    }
  }

  async registerWithEmail(name, email, password) {
    if (this.isLive) {
      try {
        const cred = await window.AppFirebase.auth.createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: name });
        return { success: true, user: cred.user };
      } catch (err) {
        return { success: false, error: this._translateAuthError(err) };
      }
    } else {
      // تسجيل حساب تجريبي
      this.currentUser = {
        uid: 'user_' + Date.now(),
        displayName: name,
        email: email,
        photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        isAnonymous: false
      };
      localStorage.setItem(this.demoUserKey, JSON.stringify(this.currentUser));
      this._notifyAuthChange();
      return { success: true, user: this.currentUser, demo: true };
    }
  }

  async loginWithGoogle() {
    if (this.isLive) {
      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        const cred = await window.AppFirebase.auth.signInWithPopup(provider);
        return { success: true, user: cred.user };
      } catch (err) {
        return { success: false, error: this._translateAuthError(err) };
      }
    } else {
      // محاكاة تسجيل الدخول بحساب Google
      this.currentUser = {
        uid: 'google_user_' + Date.now(),
        displayName: 'متبرع كريم (Google)',
        email: 'donor@gmail.com',
        photoURL: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCX814XS9vkZ6qJ8BxBvb0nKtuPcYcnY5nNZ-cKLLc4wew90KQLFOI9cJe7CIRdr3TU7yy4_APAXKUpnLJpMiWslHuH-Ay4UUP7CJqnUUms9IG1KCL28U0qcVkV-q_hbAgoHnUtsCZV7o4GjiE91F3fA3Q77O04NFkdWiF0rvBnqjIhm8BsrpB-jINRKJNuvpxgsNyqj8gETzBDacsSZBvLfJNfEkmYUEECKNfWvW0',
        isAnonymous: false
      };
      localStorage.setItem(this.demoUserKey, JSON.stringify(this.currentUser));
      this._notifyAuthChange();
      return { success: true, user: this.currentUser, demo: true };
    }
  }

  async logout() {
    if (this.isLive) {
      try {
        await window.AppFirebase.auth.signOut();
      } catch(e) {
        console.error(e);
      }
    }
    this.currentUser = null;
    localStorage.removeItem(this.demoUserKey);
    this._notifyAuthChange();
    return { success: true };
  }

  updateHeaderProfile() {
    const profileContainers = document.querySelectorAll('.user-profile-widget');
    profileContainers.forEach(container => {
      if (this.currentUser) {
        container.innerHTML = `
          <button type="button" onclick="window.hopeAuthService.openProfileModal()" class="flex items-center gap-2 px-2.5 py-1.5 rounded-full hover:bg-surface-container-high transition-colors text-right">
            <img src="${this.currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}" 
                 alt="${this.currentUser.displayName}" 
                 class="w-8 h-8 rounded-full object-cover ring-2 ring-primary">
            <div class="hidden sm:flex flex-col text-right">
              <span class="text-xs font-bold text-on-surface line-clamp-1">${this.currentUser.displayName || 'متبرع كريم'}</span>
              <span class="text-[10px] text-primary font-medium">حساب مسجل</span>
            </div>
          </button>
        `;
      } else {
        container.innerHTML = `
          <button type="button" onclick="window.hopeAuthService.openAuthModal()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-bold transition-all">
            <span class="material-symbols-outlined text-[18px] text-primary">account_circle</span>
            <span>دخول / تسجيل</span>
          </button>
        `;
      }
    });
  }

  openAuthModal(initialTab = 'login') {
    const modal = document.getElementById('authModal');
    if (modal) {
      modal.classList.remove('hidden');
      this.switchAuthTab(initialTab);
    }
  }

  closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  switchAuthTab(tab) {
    const loginTab = document.getElementById('tabLoginBtn');
    const registerTab = document.getElementById('tabRegisterBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (!loginTab || !registerTab) return;

    if (tab === 'login') {
      loginTab.classList.add('bg-surface-container-lowest', 'text-primary', 'shadow-sm');
      loginTab.classList.remove('text-on-surface-variant');
      registerTab.classList.remove('bg-surface-container-lowest', 'text-primary', 'shadow-sm');
      registerTab.classList.add('text-on-surface-variant');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    } else {
      registerTab.classList.add('bg-surface-container-lowest', 'text-primary', 'shadow-sm');
      registerTab.classList.remove('text-on-surface-variant');
      loginTab.classList.remove('bg-surface-container-lowest', 'text-primary', 'shadow-sm');
      loginTab.classList.add('text-on-surface-variant');
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
    }
  }

  openProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal && this.currentUser) {
      document.getElementById('profileModalName').textContent = this.currentUser.displayName || 'فاعل خير';
      document.getElementById('profileModalEmail').textContent = this.currentUser.email || 'غير مسجل';
      document.getElementById('profileModalAvatar').src = this.currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
      
      // إظهار تبرعات هذا المستخدم إن وجدت
      const donations = window.hopeDataService ? window.hopeDataService.getLocalDonations() : [];
      const userDonations = donations.filter(d => d.donorEmail === this.currentUser.email || d.donorName === this.currentUser.displayName);
      const listContainer = document.getElementById('userDonationsList');
      if (listContainer) {
        if (userDonations.length > 0) {
          listContainer.innerHTML = userDonations.map(d => `
            <div class="flex items-center justify-between p-3 rounded-xl bg-surface-container-low border border-outline-variant/30">
              <div class="flex items-center gap-3">
                <span class="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <span class="material-symbols-outlined text-[18px]">favorite</span>
                </span>
                <div class="flex flex-col">
                  <span class="font-bold text-sm text-on-surface">${d.type}</span>
                  <span class="text-xs text-on-surface-variant">${new Date(d.createdAt).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>
              <span class="font-bold text-primary">${d.amount} ر.س</span>
            </div>
          `).join('');
        } else {
          listContainer.innerHTML = `
            <p class="text-center py-4 text-xs text-on-surface-variant">لم تقم بإجراء تبرعات مسجلة حتى الآن. تبرعك الأول سيصنع فارقاً عظيماً!</p>
          `;
        }
      }
      modal.classList.remove('hidden');
    }
  }

  closeProfileModal() {
    const modal = document.getElementById('profileModal');
    if (modal) modal.classList.add('hidden');
  }

  _translateAuthError(err) {
    if (!err) return "حدث خطأ غير معروف";
    if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
    }
    if (err.code === 'auth/email-already-in-use') {
      return "البريد الإلكتروني مسجل بالفعل مسبقاً.";
    }
    if (err.code === 'auth/weak-password') {
      return "كلمة المرور ضعيفة، يرجى كتابة 6 أحرف على الأقل.";
    }
    return err.message || "حدث خطأ في المصادقة";
  }
}

// إنشاء النسخة العامة
window.hopeAuthService = new AuthService();
