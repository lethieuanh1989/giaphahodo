import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { PersonDetailComponent } from './components/person-detail/person-detail.component';
import { FamilyTreeComponent } from './components/family-tree/family-tree.component';
import { SearchComponent } from './components/search/search.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { ChatComponent } from './components/chat/chat.component';
import { FamilyService } from './services/family.service';
import { AuthService } from './services/auth.service';
import { Person } from './models/person.model';
import { BranchInfo, BranchKey } from './services/seed-data';

type View = 'login' | 'register' | 'detail' | 'tree' | 'generations' | 'search' | 'timeline';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LoginComponent,
    RegisterComponent,
    PersonDetailComponent,
    FamilyTreeComponent,
    SearchComponent,
    TimelineComponent,
    ChatComponent,
  ],
  template: `
    <!-- Auto-login loading -->
    <div class="loading-overlay" *ngIf="autoLoading">
      <div class="loading-card">
        <div class="loading-header">
          <h2>Gia Phả Họ Đỗ</h2>
          <p>Xuân Thượng</p>
        </div>
        <div class="loading-body">
          <div class="spinner"></div>
          <p>Đang đăng nhập...</p>
        </div>
      </div>
    </div>

    <!-- Login -->
    <app-login
      *ngIf="currentView === 'login' && !autoLoading"
      (loginSuccess)="onLoginAttempt($event)"
      (goToRegister)="currentView = 'register'"
    ></app-login>

    <!-- Register -->
    <app-register
      *ngIf="currentView === 'register'"
      (doRegister)="onRegisterAttempt($event)"
      (registerSuccess)="onRegisterSuccess()"
      (goToLogin)="currentView = 'login'"
    ></app-register>

    <!-- Top bar -->
    <header class="top-bar" *ngIf="isMainView()">
      <button class="back-btn" *ngIf="historyStack.length > 0" (click)="goBack()">
        ‹
      </button>
      <h1 class="top-title">{{ getTitle() }}</h1>

      <!-- Auth area -->
      <div class="auth-area">
        <button class="auth-btn logout" (click)="logout()">Thoát</button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="content" *ngIf="isMainView()">
      <app-person-detail
        *ngIf="currentView === 'detail' && currentPerson"
        [person]="currentPerson"
        [canEdit]="isLoggedIn"
        [homePersonId]="homePerson?.id"
        (navigateTo)="navigateToPerson($event)"
        (personSaved)="onPersonSaved($event)"
        (personDeleted)="onPersonDeleted()"
      ></app-person-detail>

      <app-family-tree
        *ngIf="currentView === 'tree'"
        mode="images"
      ></app-family-tree>

      <app-family-tree
        *ngIf="currentView === 'generations'"
        mode="generations"
        (personSelected)="navigateToPerson($event)"
      ></app-family-tree>

      <app-search
        *ngIf="currentView === 'search'"
        (personSelected)="navigateToPerson($event)"
      ></app-search>

      <app-timeline
        *ngIf="currentView === 'timeline'"
      ></app-timeline>
    </main>

    <!-- Branch Dropdown (appears above bottom nav) -->
    <div class="dropdown-overlay" *ngIf="showBranchDropdown" (click)="showBranchDropdown = false"></div>
    <div class="branch-dropdown" *ngIf="showBranchDropdown">
      <div
        class="branch-option"
        *ngFor="let b of branches"
        [class.selected]="b.key === currentBranchKey"
        (click)="selectBranch(b.key)"
      >
        <span class="branch-dot" [class.active]="b.key === currentBranchKey"></span>
        {{ b.label }}
      </div>
    </div>

    <!-- Chat Bubble -->
    <app-chat
      *ngIf="isMainView()"
      [currentUid]="currentUserUid"
      [currentUserName]="currentUserName"
    ></app-chat>

    <!-- Bottom Navigation -->
    <nav class="bottom-nav" *ngIf="isMainView()">
      <button
        class="nav-btn"
        [class.active]="currentView === 'detail'"
        (click)="goHome()"
      >
        <span class="nav-icon">👤</span>
        <span class="nav-label">Cá nhân</span>
      </button>
      <button
        class="nav-btn"
        [class.active]="currentView === 'tree'"
        (click)="showTree()"
      >
        <span class="nav-icon">🌳</span>
        <span class="nav-label">Gia phả</span>
      </button>
      <button
        class="nav-btn"
        [class.active]="currentView === 'generations' || showBranchDropdown"
        (click)="toggleBranchDropdown($event)"
      >
        <span class="nav-icon">📂</span>
        <span class="nav-label">{{ currentBranchLabel }}</span>
      </button>
      <button
        class="nav-btn"
        [class.active]="currentView === 'search'"
        (click)="showSearch()"
      >
        <span class="nav-icon">🔍</span>
        <span class="nav-label">Tìm kiếm</span>
      </button>
      <button
        class="nav-btn"
        [class.active]="currentView === 'timeline'"
        (click)="showTimeline()"
      >
        <span class="nav-icon">📅</span>
        <span class="nav-label">Timeline</span>
      </button>
    </nav>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #f5f0eb;
    }

    /* Auto-login loading */
    .loading-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }
    .loading-card {
      background: #fff;
      border-radius: 16px;
      width: 100%;
      max-width: 380px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .loading-header {
      background: linear-gradient(135deg, #8B0000, #CD853F);
      color: #fff;
      padding: 24px 20px;
      text-align: center;
    }
    .loading-header h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
    }
    .loading-header p {
      margin: 4px 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .loading-body {
      padding: 32px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }
    .loading-body p {
      margin: 0;
      font-size: 15px;
      color: #666;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #eee;
      border-top-color: #8B0000;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .top-bar {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      background: #8B0000;
      color: #fff;
      padding: 0 12px;
      height: 52px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }
    .back-btn {
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.15);
      border: none;
      border-radius: 50%;
      color: #fff;
      font-size: 22px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .top-title {
      flex: 1;
      text-align: center;
      font-size: 17px;
      font-weight: 600;
      margin: 0;
    }

    /* Auth */
    .auth-area {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .auth-btn {
      padding: 4px 10px;
      background: rgba(255,255,255,0.15);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 6px;
      color: #fff;
      font-size: 11px;
      cursor: pointer;
      white-space: nowrap;
    }

    .content {
      max-width: 480px;
      margin: 0 auto;
    }

    /* Branch Dropdown */
    .dropdown-overlay {
      position: fixed;
      inset: 0;
      z-index: 150;
    }
    .branch-dropdown {
      position: fixed;
      bottom: 64px;
      left: 50%;
      transform: translateX(-50%);
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.18);
      z-index: 200;
      min-width: 200px;
      overflow: hidden;
    }
    .branch-option {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 18px;
      font-size: 15px;
      color: #333;
      cursor: pointer;
      transition: background 0.15s;
    }
    .branch-option:not(:last-child) {
      border-bottom: 1px solid #f0e8e0;
    }
    .branch-option:active,
    .branch-option.selected {
      background: #f9f5f0;
    }
    .branch-option.selected {
      color: #8B0000;
      font-weight: 600;
    }
    .branch-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ddd;
      flex-shrink: 0;
    }
    .branch-dot.active {
      background: #8B0000;
    }

    /* Bottom Nav */
    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      background: #fff;
      border-top: 1px solid #eee;
      padding-bottom: env(safe-area-inset-bottom, 0);
      z-index: 100;
      box-shadow: 0 -1px 6px rgba(0,0,0,0.08);
    }
    .nav-btn {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 0 8px;
      border: none;
      background: none;
      cursor: pointer;
      color: #888;
      transition: color 0.2s;
    }
    .nav-btn.active {
      color: #8B0000;
    }
    .nav-icon {
      font-size: 22px;
      line-height: 1;
    }
    .nav-label {
      font-size: 11px;
      margin-top: 2px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 72px;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  currentView: View = 'login';
  currentPerson?: Person;
  historyStack: { view: View; personId?: string }[] = [];
  homePerson?: Person;

  @ViewChild(LoginComponent) loginComp?: LoginComponent;
  @ViewChild(RegisterComponent) registerComp?: RegisterComponent;

  // Auth
  isLoggedIn = false;
  autoLoading = false;
  currentUserUid = '';
  currentUserName = '';
  private authSub?: Subscription;
  private dataSub?: Subscription;

  // Branch
  branches: BranchInfo[];
  currentBranchKey: BranchKey;
  currentBranchLabel: string;
  showBranchDropdown = false;

  constructor(
    private familyService: FamilyService,
    private authService: AuthService,
  ) {
    this.branches = this.familyService.getBranches();
    this.currentBranchKey = this.familyService.getCurrentBranch();
    this.currentBranchLabel = this.familyService.getCurrentBranchInfo().label;
  }

  ngOnInit(): void {
    this.authSub = this.authService.currentUser$.subscribe(async user => {
      this.isLoggedIn = !!user;
      if (user && this.currentView === 'login') {
        // Auto-login: user đã đăng nhập trước đó
        this.currentUserUid = user.uid;
        this.autoLoading = true;
        await this.loadUserAndNavigate(user.uid);
      }
      if (!user && this.isMainView()) {
        // User đã logout → quay lại login
        this.currentView = 'login';
        this.homePerson = undefined;
        this.currentPerson = undefined;
        this.historyStack = [];
        this.currentUserUid = '';
        this.currentUserName = '';
      }
    });

    // Auto-refresh currentPerson khi Firestore data thay đổi
    this.dataSub = this.familyService.getAllPeopleObservable().subscribe(() => {
      if (this.currentPerson && this.currentView === 'detail') {
        const updated = this.familyService.getPersonById(this.currentPerson.id);
        if (updated) {
          const oldJson = JSON.stringify(this.currentPerson);
          const newJson = JSON.stringify(updated);
          if (oldJson !== newJson) {
            this.currentPerson = { ...updated };
          }
        }
      }
    });

    // Dọn duplicate documents từ bug trước
    setTimeout(async () => {
      await this.familyService.cleanupDuplicates();
      await this.familyService.cleanupDuplicatesByName('Đỗ Anh Dũng');
    }, 5000);
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.dataSub?.unsubscribe();
  }

  isMainView(): boolean {
    return this.currentView !== 'login' && this.currentView !== 'register';
  }

  // --- Login ---

  async onLoginAttempt(data: string): Promise<void> {
    const [phone, password] = data.split('|||');
    try {
      const userData = await this.authService.signInWithPhone(phone, password);
      this.currentUserUid = this.authService.currentUser?.uid || '';
      this.currentUserName = userData.hoTen || '';
      const person = this.familyService.getPersonById(userData.personId);
      if (person) {
        this.homePerson = person;
        this.currentPerson = { ...person };
        this.currentView = 'detail';
      } else {
        // Person chưa load xong, thử lại sau 2s
        setTimeout(() => {
          const p = this.familyService.getPersonById(userData.personId);
          if (p) {
            this.homePerson = p;
            this.currentPerson = { ...p };
            this.currentView = 'detail';
          } else {
            this.currentView = 'generations';
          }
          this.loginComp?.onLoginDone();
        }, 2000);
        return;
      }
      this.loginComp?.onLoginDone();
    } catch (e: any) {
      let msg = 'Đăng nhập thất bại.';
      if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
        msg = 'Số điện thoại hoặc mật khẩu không đúng.';
      } else if (e.code === 'auth/wrong-password') {
        msg = 'Mật khẩu không đúng.';
      } else if (e.code === 'auth/too-many-requests') {
        msg = 'Quá nhiều lần thử. Vui lòng thử lại sau.';
      } else if (e.message) {
        msg = e.message;
      }
      this.loginComp?.onLoginError(msg);
    }
  }

  // --- Register ---

  async onRegisterAttempt(data: { hoTen: string; phone: string; password: string }): Promise<void> {
    // Verify tên có trong gia phả
    const person = this.familyService.getPersonByName(data.hoTen);
    if (!person) {
      // Thử tìm gần đúng
      const results = this.familyService.searchPeople(data.hoTen);
      if (results.length === 0) {
        this.registerComp?.onRegisterError('Bạn không có tên trong gia phả họ Đỗ - Xuân Thượng hoặc dữ liệu của bạn chưa được thêm vào gia phả.');
        return;
      }
      if (results.length === 1) {
        // Tìm đúng 1 kết quả gần đúng → dùng luôn
        await this.doRegister(results[0], data.phone, data.password);
        return;
      }
      // Nhiều kết quả → yêu cầu nhập chính xác
      this.registerComp?.onRegisterError('Tìm thấy nhiều tên tương tự. Vui lòng nhập chính xác họ tên trong gia phả.');
      return;
    }

    await this.doRegister(person, data.phone, data.password);
  }

  private async doRegister(person: Person, phone: string, password: string): Promise<void> {
    try {
      await this.authService.register(person.hoTen, phone, password, person.id);

      // Cập nhật số điện thoại vào person (user vẫn còn authenticated)
      const updatedPerson = { ...person, soDienThoai: phone };
      await this.familyService.savePerson(updatedPerson);

      // Logout sau khi cập nhật xong
      await this.authService.logout();

      this.registerComp?.onRegisterDone();
    } catch (e: any) {
      let msg = 'Đăng ký thất bại.';
      if (e.code === 'auth/email-already-in-use') {
        msg = 'Số điện thoại này đã được đăng ký.';
      } else if (e.code === 'auth/weak-password') {
        msg = 'Mật khẩu phải có ít nhất 6 ký tự.';
      } else if (e.message) {
        msg = e.message;
      }
      this.registerComp?.onRegisterError(msg);
    }
  }

  onRegisterSuccess(): void {
    this.currentView = 'login';
  }

  // --- Auto-login helper ---

  private async loadUserAndNavigate(uid: string): Promise<void> {
    try {
      const userData = await this.authService.getUserData(uid);
      if (userData?.personId) {
        this.currentUserName = userData.hoTen || '';
        // Chờ data load xong (có thể Firestore chưa emit)
        const tryLoad = () => {
          const person = this.familyService.getPersonById(userData.personId);
          if (person) {
            this.homePerson = person;
            this.currentPerson = { ...person };
            this.currentView = 'detail';
            return true;
          }
          return false;
        };

        if (!tryLoad()) {
          // Thử lại sau 2s khi data đã load
          setTimeout(() => {
            if (!tryLoad()) {
              this.currentView = 'generations';
            }
            this.autoLoading = false;
          }, 2000);
          return; // autoLoading sẽ được clear trong setTimeout
        }
      }
    } catch {
      // Không có user data → có thể là admin Google login
    }
    this.autoLoading = false;
  }

  // --- Logout ---

  async logout(): Promise<void> {
    await this.authService.logout();
    this.homePerson = undefined;
    this.currentPerson = undefined;
    this.historyStack = [];
    this.currentUserUid = '';
    this.currentUserName = '';
    this.currentView = 'login';
  }

  // --- Navigation ---

  navigateToPerson(id: string): void {
    const person = this.familyService.getPersonById(id);
    if (!person) return;
    this.historyStack.push({
      view: this.currentView,
      personId: this.currentPerson?.id,
    });
    this.currentPerson = { ...person };
    this.currentView = 'detail';
  }

  goBack(): void {
    const prev = this.historyStack.pop();
    if (!prev) return;
    this.currentView = prev.view;
    if (prev.personId) {
      const person = this.familyService.getPersonById(prev.personId);
      if (person) this.currentPerson = { ...person };
    }
  }

  goHome(): void {
    this.showBranchDropdown = false;
    if (this.homePerson) {
      const p = this.familyService.getPersonById(this.homePerson.id);
      if (p) {
        this.currentPerson = { ...p };
        this.currentView = 'detail';
        this.historyStack = [];
        return;
      }
    }
    this.currentView = 'login';
  }

  showTree(): void {
    this.showBranchDropdown = false;
    if (this.currentView !== 'tree') {
      this.historyStack = [];
    }
    this.currentView = 'tree';
  }

  showSearch(): void {
    this.showBranchDropdown = false;
    if (this.currentView !== 'search') {
      this.historyStack = [];
    }
    this.currentView = 'search';
  }

  showTimeline(): void {
    this.showBranchDropdown = false;
    if (this.currentView !== 'timeline') {
      this.historyStack = [];
    }
    this.currentView = 'timeline';
  }

  toggleBranchDropdown(event: Event): void {
    event.stopPropagation();
    this.showBranchDropdown = !this.showBranchDropdown;
  }

  selectBranch(key: BranchKey): void {
    this.showBranchDropdown = false;
    if (key === this.currentBranchKey) return;

    this.familyService.switchBranch(key);
    this.currentBranchKey = key;
    this.currentBranchLabel = this.familyService.getCurrentBranchInfo().label;

    // Reset state
    this.historyStack = [];
    this.homePerson = undefined;
    this.currentPerson = undefined;

    // Go to generations view to show the new branch data
    this.currentView = 'generations';
  }

  onPersonSaved(person: Person): void {
    this.currentPerson = { ...person };
  }

  onPersonDeleted(): void {
    this.currentPerson = undefined;
    this.historyStack = [];
    this.currentView = 'generations';
  }

  getTitle(): string {
    switch (this.currentView) {
      case 'detail':
        return this.currentPerson?.hoTen || 'Thông tin';
      case 'tree':
        return 'Gia Phả';
      case 'generations':
        return this.currentBranchLabel;
      case 'search':
        return 'Tìm Kiếm';
      case 'timeline':
        return 'Timeline';
      default:
        return 'Gia Phả';
    }
  }
}
