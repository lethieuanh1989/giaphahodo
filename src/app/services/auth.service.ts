import { Injectable, inject } from '@angular/core';
import {
  Auth,
  authState,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  User,
} from '@angular/fire/auth';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  currentUser$: Observable<User | null> = authState(this.auth);
  isLoggedIn$: Observable<boolean> = this.currentUser$.pipe(map(u => !!u));

  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  constructor() {
    // Xử lý redirect result khi quay lại từ Google Sign-In (mobile)
    this.handleRedirectResult();
  }

  private async handleRedirectResult(): Promise<void> {
    try {
      const result = await getRedirectResult(this.auth);
      if (result) {
        const email = result.user.email?.toLowerCase() || '';
        if (!environment.allowedEmails.includes(email)) {
          await signOut(this.auth);
          alert(`Email "${email}" không được phép đăng nhập.`);
        }
      }
    } catch (e: any) {
      console.error('[GP-DEBUG] handleRedirectResult error:', e);
    }
  }

  private isMobile(): boolean {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();

    if (this.isMobile()) {
      // Mobile: dùng redirect thay vì popup (popup bị chặn trên mobile)
      await signInWithRedirect(this.auth, provider);
      // Trang sẽ redirect, kết quả xử lý trong handleRedirectResult()
    } else {
      // Desktop: dùng popup
      const result = await signInWithPopup(this.auth, provider);
      const email = result.user.email?.toLowerCase() || '';

      if (!environment.allowedEmails.includes(email)) {
        await signOut(this.auth);
        throw new Error(`Email "${email}" không được phép đăng nhập.`);
      }
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }
}
