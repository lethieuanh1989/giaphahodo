import { Injectable, inject } from '@angular/core';
import {
  Auth,
  authState,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signOut,
  User,
} from '@angular/fire/auth';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { FirebaseService } from './firebase.service';

export interface UserData {
  hoTen: string;
  soDienThoai: string;
  personId: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firebaseService = inject(FirebaseService);

  currentUser$: Observable<User | null> = authState(this.auth);
  isLoggedIn$: Observable<boolean> = this.currentUser$.pipe(map(u => !!u));

  get currentUser(): User | null {
    return this.auth.currentUser;
  }

  private phoneToEmail(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    return `${cleaned}@hodoxuanthuong.app`;
  }

  async register(hoTen: string, phone: string, password: string, personId: string): Promise<void> {
    const email = this.phoneToEmail(phone);
    let uid: string;

    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      uid = result.user.uid;
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        // Account Auth đã tồn tại (có thể do lần đăng ký trước bị lỗi giữa chừng)
        // Thử đăng nhập để kiểm tra và recovery
        try {
          const result = await signInWithEmailAndPassword(this.auth, email, password);
          uid = result.user.uid;
          const existingData = await this.firebaseService.getUserData(uid);
          if (existingData) {
            // Đã có đầy đủ data → thực sự đã đăng ký rồi
            await signOut(this.auth);
            throw e;
          }
          // Không có data → recovery: tiếp tục lưu data bên dưới
        } catch (signInErr: any) {
          if (signInErr.code === 'auth/email-already-in-use') throw signInErr;
          // Sai mật khẩu hoặc lỗi khác → throw lỗi gốc
          throw e;
        }
      } else {
        throw e;
      }
    }

    await this.firebaseService.saveUserData(uid, {
      hoTen,
      soDienThoai: phone,
      personId,
      createdAt: new Date().toISOString(),
    });
    // Không signOut ở đây - để doRegister() cập nhật person xong mới logout
  }

  async signInWithPhone(phone: string, password: string): Promise<UserData> {
    const email = this.phoneToEmail(phone);
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    const uid = result.user.uid;

    const userData = await this.firebaseService.getUserData(uid);
    if (!userData) {
      throw new Error('Không tìm thấy thông tin tài khoản.');
    }
    return userData as UserData;
  }

  async getUserData(uid: string): Promise<UserData | null> {
    const data = await this.firebaseService.getUserData(uid);
    return data as UserData | null;
  }

  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(this.auth, provider);
    const email = result.user.email?.toLowerCase() || '';

    if (!environment.allowedEmails.includes(email)) {
      await signOut(this.auth);
      throw new Error(`Email "${email}" không được phép đăng nhập.`);
    }
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }
}
