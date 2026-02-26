import { Injectable, inject } from '@angular/core';
import { Auth, authState, signInWithPopup, GoogleAuthProvider, signOut, User } from '@angular/fire/auth';
import { Observable, map } from 'rxjs';

const ALLOWED_EMAILS: string[] = [
  'lethieuanh154@gmail.com','lethieuanhdn@gmail.com'
  // Thêm email được phép đăng nhập vào đây
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  currentUser$: Observable<User | null> = authState(this.auth);
  isLoggedIn$: Observable<boolean> = this.currentUser$.pipe(map(u => !!u));

  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    const email = result.user.email?.toLowerCase() || '';

    if (!ALLOWED_EMAILS.includes(email)) {
      await signOut(this.auth);
      throw new Error(`Email "${email}" không được phép đăng nhập.`);
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }
}
