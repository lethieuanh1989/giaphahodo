import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NamePopupComponent } from './components/name-popup/name-popup.component';
import { PersonDetailComponent } from './components/person-detail/person-detail.component';
import { FamilyTreeComponent } from './components/family-tree/family-tree.component';
import { SearchComponent } from './components/search/search.component';
import { TimelineComponent } from './components/timeline/timeline.component';
import { FamilyService } from './services/family.service';
import { AuthService } from './services/auth.service';
import { Person } from './models/person.model';
import { BranchInfo, BranchKey } from './services/seed-data';

type View = 'popup' | 'detail' | 'tree' | 'generations' | 'search' | 'timeline';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    NamePopupComponent,
    PersonDetailComponent,
    FamilyTreeComponent,
    SearchComponent,
    TimelineComponent,
  ],
  template: `
    <!-- Name Popup -->
    <app-name-popup
      *ngIf="currentView === 'popup'"
      [errorMessage]="nameError"
      (nameSubmitted)="onNameSubmitted($event)"
      (browseAllClicked)="onBrowseAll()"
    ></app-name-popup>

    <!-- Top bar -->
    <header class="top-bar" *ngIf="currentView !== 'popup'">
      <button class="back-btn" *ngIf="historyStack.length > 0" (click)="goBack()">
        ‹
      </button>
      <h1 class="top-title">{{ getTitle() }}</h1>

      <!-- Auth area -->
      <div class="auth-area" *ngIf="!isLoggedIn">
        <button class="auth-btn login" (click)="login()">Đăng nhập</button>
      </div>
      <div class="auth-area" *ngIf="isLoggedIn">
        <img
          *ngIf="userPhotoURL"
          [src]="userPhotoURL"
          class="user-avatar"
          [title]="userName"
        />
        <button class="auth-btn logout" (click)="logout()">Thoát</button>
      </div>
    </header>

    <!-- Main Content -->
    <main class="content" *ngIf="currentView !== 'popup'">
      <app-person-detail
        *ngIf="currentView === 'detail' && currentPerson"
        [person]="currentPerson"
        [canEdit]="true"
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

    <!-- Bottom Navigation -->
    <nav class="bottom-nav" *ngIf="currentView !== 'popup'">
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
    .user-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,0.5);
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
  currentView: View = 'popup';
  currentPerson?: Person;
  historyStack: { view: View; personId?: string }[] = [];
  homePerson?: Person;

  // Auth
  isLoggedIn = false;
  userName = '';
  userPhotoURL = '';
  private authSub?: Subscription;
  private dataSub?: Subscription;

  // Branch
  branches: BranchInfo[];
  currentBranchKey: BranchKey;
  currentBranchLabel: string;
  showBranchDropdown = false;

  nameError = '';

  constructor(
    private familyService: FamilyService,
    private authService: AuthService,
  ) {
    this.branches = this.familyService.getBranches();
    this.currentBranchKey = this.familyService.getCurrentBranch();
    this.currentBranchLabel = this.familyService.getCurrentBranchInfo().label;
  }

  ngOnInit(): void {
    this.authSub = this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.userName = user?.displayName || '';
      this.userPhotoURL = user?.photoURL || '';
    });

    // Auto-refresh currentPerson khi Firestore data thay đổi
    this.dataSub = this.familyService.getAllPeopleObservable().subscribe((allPeople) => {
      console.log(`[GP-DEBUG] AppComponent dataSub: ${allPeople.length} people, view='${this.currentView}', person='${this.currentPerson?.id || 'none'}'`);
      if (this.currentPerson && this.currentView === 'detail') {
        const updated = this.familyService.getPersonById(this.currentPerson.id);
        if (updated) {
          const oldJson = JSON.stringify(this.currentPerson);
          const newJson = JSON.stringify(updated);
          if (oldJson !== newJson) {
            console.log(`[GP-DEBUG] AppComponent: currentPerson REFRESHED '${updated.id}'`);
            this.currentPerson = { ...updated };
          }
        } else {
          console.warn(`[GP-DEBUG] AppComponent: currentPerson '${this.currentPerson.id}' NOT FOUND after data update!`);
        }
      }
    });

    // Dọn duplicate documents từ bug trước (chạy 1 lần, delay để subscriptions load xong)
    setTimeout(async () => {
      await this.familyService.cleanupDuplicates();
      // Xóa duplicate "Đỗ Anh Dũng" tạo ra do bug trước đó
      const deleted = await this.familyService.cleanupDuplicatesByName('Đỗ Anh Dũng');
      if (deleted > 0) {
        console.log(`[GP-DEBUG] Đã xóa ${deleted} bản duplicate "Đỗ Anh Dũng"`);
      }
    }, 5000);
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.dataSub?.unsubscribe();
  }

  async login(): Promise<void> {
    try {
      await this.authService.signInWithGoogle();
    } catch (e: any) {
      alert(e.message || 'Đăng nhập thất bại');
    }
  }

  async logout(): Promise<void> {
    await this.authService.logout();
  }

  onNameSubmitted(name: string): void {
    this.nameError = '';
    let person = this.familyService.getPersonByName(name);
    if (!person) {
      const results = this.familyService.searchPeople(name);
      if (results.length === 1) {
        person = results[0];
      } else if (results.length > 1) {
        this.currentView = 'search';
        return;
      } else {
        this.nameError = `Không tìm thấy "${name}" trong gia phả. Có thể "${name}" chưa được thêm, hãy tìm tên Cha-Mẹ. Vui lòng kiểm tra lại hoặc nhấn "Xem tất cả".`;
        return;
      }
    }
    this.homePerson = person;
    this.currentPerson = { ...person };
    this.currentView = 'detail';
  }

  onBrowseAll(): void {
    this.currentView = 'generations';
  }

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
    this.currentView = 'popup';
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
