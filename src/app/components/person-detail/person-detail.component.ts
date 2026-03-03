import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Person } from '../../models/person.model';
import { FamilyService } from '../../services/family.service';


@Component({
  selector: 'app-person-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="person-detail" *ngIf="person">
      <!-- Photo -->
      <div class="photo-section">
        <div class="photo-frame" (click)="canEditContact && fileInput.click()">
          <img *ngIf="person.hinhAnh" [src]="person.hinhAnh" alt="Ảnh" />
          <div *ngIf="!person.hinhAnh" class="photo-placeholder">
            <span class="icon">📷</span>
            <span>{{ canEditContact ? 'Thêm ảnh' : '' }}</span>
          </div>
          <div class="uploading-overlay" *ngIf="uploading">
            <span>Đang tải...</span>
          </div>
          <input
            #fileInput
            type="file"
            accept="image/*"
            (change)="onImageSelected($event)"
            hidden
          />
        </div>
      </div>

      <!-- Name & Generation -->
      <div class="header-info">
        <h2 class="person-name">{{ person.hoTen || 'Chưa có tên' }}</h2>
        <span class="badge">Đời thứ {{ person.doiThu }}</span>
        <span class="badge position" *ngIf="person.viTri">{{ person.viTri }}</span>
      </div>

      <!-- Action buttons -->
      <div class="edit-toggle" *ngIf="canEdit">
        <button class="btn-edit" (click)="editing = !editing">
          {{ editing ? 'Xong' : 'Chỉnh sửa' }}
        </button>
        <button class="btn-save" *ngIf="editing" (click)="save()">Lưu</button>
        <button class="btn-add" (click)="showAddChild = !showAddChild">Thêm con</button>
      </div>
      <div class="login-hint" *ngIf="!canEdit">
        <span>Đăng nhập để chỉnh sửa</span>
      </div>

      <!-- Add Child Form -->
      <div class="add-child-form" *ngIf="showAddChild && canEdit">
        <div class="info-card">
          <h3>Thêm con mới</h3>
          <div class="field">
            <label>Họ Tên</label>
            <input [(ngModel)]="newChildName" placeholder="Nhập họ tên con" />
          </div>
          <div class="field">
            <label>Vị trí</label>
            <input [(ngModel)]="newChildViTri" placeholder="Con cả, con thứ 2..." />
          </div>
          <div class="form-actions">
            <button class="btn-save" (click)="addChild()" [disabled]="!newChildName.trim()">Thêm</button>
            <button class="btn-edit" (click)="showAddChild = false">Hủy</button>
          </div>
        </div>
      </div>

      <!-- Info Fields -->
      <div class="info-card">
        <h3>Thông tin cá nhân</h3>

        <div class="field">
          <label>Họ Tên</label>
          <input *ngIf="editing" [(ngModel)]="person.hoTen" placeholder="Họ và tên" />
          <span *ngIf="!editing">{{ person.hoTen || '—' }}</span>
        </div>

        <div class="field">
          <label>Đời thứ</label>
          <input *ngIf="editing" type="number" [(ngModel)]="person.doiThu" min="1" max="30" />
          <span *ngIf="!editing">{{ person.doiThu }}</span>
        </div>

        <div class="field">
          <label>Ngày Sinh</label>
          <input *ngIf="editing" [(ngModel)]="person.ngaySinh" placeholder="DD/MM/YYYY" />
          <span *ngIf="!editing">{{ person.ngaySinh || '—' }}</span>
        </div>

        <div class="field">
          <label>Ngày Mất</label>
          <input *ngIf="editing" [(ngModel)]="person.ngayMat" placeholder="DD/MM/YYYY" />
          <span *ngIf="!editing">{{ person.ngayMat || '—' }}</span>
        </div>

        <div class="field">
          <label>Vị trí</label>
          <input *ngIf="editing" [(ngModel)]="person.viTri" placeholder="Con cả, con thứ 2..." />
          <span *ngIf="!editing">{{ person.viTri || '—' }}</span>
        </div>

        <div class="field">
          <label>Ghi chú</label>
          <input *ngIf="editing" [(ngModel)]="person.ghiChu" placeholder="Ghi chú" />
          <span *ngIf="!editing">{{ person.ghiChu || '—' }}</span>
        </div>
      </div>

      <!-- Family -->
      <div class="info-card">
        <h3>Gia đình</h3>

        <div class="field" *ngIf="father">
          <label>Cha</label>
          <a class="link" (click)="navigateTo.emit(father.id)">{{ father.hoTen }}</a>
        </div>

        <div class="field" *ngIf="mother">
          <label>Mẹ</label>
          <a class="link" (click)="navigateTo.emit(mother.id)">{{ mother.hoTen }}</a>
        </div>

        <div class="field" *ngIf="person.hoTenVoChong || spouse">
          <label>Vợ/Chồng</label>
          <a class="link" *ngIf="spouse" (click)="navigateTo.emit(spouse.id)">{{ spouse.hoTen }}</a>
          <span *ngIf="!spouse && person.hoTenVoChong && !editing" [class.creator-tag]="isCreatorSpouse()">
            {{ person.hoTenVoChong }}
            <span class="creator-badge" *ngIf="isCreatorSpouse()">App Creator</span>
          </span>
          <input *ngIf="editing && !spouse" [(ngModel)]="person.hoTenVoChong" placeholder="Tên vợ/chồng" />
        </div>
        <div class="field" *ngIf="!person.hoTenVoChong && !spouse && editing">
          <label>Vợ/Chồng</label>
          <input [(ngModel)]="person.hoTenVoChong" placeholder="Tên vợ/chồng" />
        </div>

        <div class="field" *ngIf="siblings.length > 0">
          <label>Anh Chị Em</label>
          <div class="family-list">
            <a
              class="link chip"
              *ngFor="let s of siblings"
              (click)="navigateTo.emit(s.id)"
            >
              {{ s.hoTen }}
              <small *ngIf="s.viTri">({{ s.viTri }})</small>
            </a>
          </div>
        </div>

        <div class="field" *ngIf="children.length > 0">
          <label>Con cái</label>
          <div class="family-list">
            <a
              class="link chip"
              *ngFor="let c of children"
              (click)="navigateTo.emit(c.id)"
            >
              {{ c.hoTen }}
              <small *ngIf="c.viTri">({{ c.viTri }})</small>
            </a>
          </div>
        </div>
      </div>

      <!-- Contact -->
      <div class="info-card">
        <div class="card-header">
          <h3>Liên hệ</h3>
          <button
            class="btn-self-edit"
            *ngIf="canEditContact && !editing"
            (click)="editingContact = !editingContact"
          >
            {{ editingContact ? 'Xong' : 'Sửa' }}
          </button>
        </div>

        <div class="field">
          <label>Địa chỉ</label>
          <input *ngIf="editing || editingContact" [(ngModel)]="person.diaChiHienTai" placeholder="Địa chỉ" />
          <span *ngIf="!editing && !editingContact">{{ person.diaChiHienTai || '—' }}</span>
        </div>

        <div class="field">
          <label>Số điện thoại</label>
          <input *ngIf="editing || editingContact" [(ngModel)]="person.soDienThoai" type="tel" placeholder="SĐT" />
          <a *ngIf="!editing && !editingContact && person.soDienThoai" [href]="'tel:' + person.soDienThoai">{{ person.soDienThoai }}</a>
          <span *ngIf="!editing && !editingContact && !person.soDienThoai">—</span>
        </div>

        <div class="field">
          <label>Facebook</label>
          <input *ngIf="editing || editingContact" [(ngModel)]="person.facebook" placeholder="Link Facebook" />
          <a *ngIf="!editing && !editingContact && person.facebook" [href]="person.facebook" target="_blank">{{ person.facebook }}</a>
          <span *ngIf="!editing && !editingContact && !person.facebook">—</span>
        </div>

        <div class="field">
          <label>Zalo</label>
          <input *ngIf="editing || editingContact" [(ngModel)]="person.zalo" placeholder="SĐT Zalo" />
          <span *ngIf="!editing && !editingContact">{{ person.zalo || '—' }}</span>
        </div>

        <div class="field">
          <label>Khác</label>
          <input *ngIf="editing || editingContact" [(ngModel)]="person.khac" placeholder="Thông tin khác" />
          <span *ngIf="!editing && !editingContact">{{ person.khac || '—' }}</span>
        </div>

        <button
          class="btn-save contact-save"
          *ngIf="editingContact && !editing"
          (click)="saveContactOnly()"
        >
          Lưu liên hệ
        </button>
      </div>

      <!-- Check-in -->
      <div class="info-card">
        <h3>Check-in <span class="checkin-count" *ngIf="person.checkInImages?.length">{{ person.checkInImages!.length }}/5</span></h3>

        <div class="checkin-gallery" *ngIf="person.checkInImages?.length">
          <div class="checkin-item" *ngFor="let img of person.checkInImages; let i = index">
            <div class="checkin-thumb" (click)="zoomedImage = img">
              <img [src]="img" alt="Check-in" />
            </div>
            <div class="checkin-date" *ngIf="person.checkInDates?.[i]">
              {{ person.checkInDates![i] }}
            </div>
            <button class="btn-checkin-delete" *ngIf="canEditContact" (click)="deleteCheckInImage(i)">Xóa</button>
          </div>
        </div>

        <div class="checkin-empty" *ngIf="!person.checkInImages?.length">
          <span>Chưa check-in</span>
        </div>

        <div class="checkin-actions" *ngIf="canEditContact && (person.checkInImages?.length || 0) < 5">
          <button class="btn-checkin" (click)="checkInInput.click()" [disabled]="checkingIn">
            {{ checkingIn ? 'Đang xử lý...' : 'Check-in' }}
          </button>
          <input
            #checkInInput
            type="file"
            accept="image/*"
            (change)="onCheckIn($event)"
            hidden
          />
        </div>
      </div>

      <!-- Zoom overlay -->
      <div class="zoom-overlay" *ngIf="zoomedImage" (click)="zoomedImage = null">
        <button class="zoom-close" (click)="zoomedImage = null">&times;</button>
        <img [src]="zoomedImage" alt="Phóng to" (click)="$event.stopPropagation()" />
      </div>
    </div>
  `,
  styles: [`
    .person-detail {
      padding: 16px;
      padding-bottom: 80px;
    }
    .photo-section {
      display: flex;
      justify-content: center;
      margin-bottom: 16px;
    }
    .photo-frame {
      width: 140px;
      height: 140px;
      border-radius: 16px;
      border: 3px solid #8B0000;
      overflow: hidden;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f9f5f0;
      position: relative;
    }
    .photo-frame img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      color: #999;
      font-size: 13px;
    }
    .photo-placeholder .icon {
      font-size: 32px;
    }
    .uploading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 13px;
    }
    .header-info {
      text-align: center;
      margin-bottom: 12px;
    }
    .person-name {
      margin: 0 0 8px;
      font-size: 22px;
      color: #8B0000;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      background: #f9f5f0;
      color: #8B0000;
      font-size: 13px;
      font-weight: 500;
      margin: 2px 4px;
    }
    .badge.position {
      background: #8B0000;
      color: #fff;
    }
    .edit-toggle {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .btn-edit, .btn-save, .btn-add, .btn-delete {
      padding: 8px 16px;
      border-radius: 8px;
      border: 1.5px solid #8B0000;
      font-size: 13px;
      cursor: pointer;
      background: #fff;
      color: #8B0000;
    }
    .btn-save {
      background: #8B0000;
      color: #fff;
    }
    .btn-add {
      border-color: #2e7d32;
      color: #2e7d32;
    }
    .btn-delete {
      border-color: #c62828;
      color: #c62828;
    }
    .btn-save:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .add-child-form {
      margin-bottom: 12px;
    }
    .form-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    .info-card {
      background: #fff;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }
    .info-card h3 {
      margin: 0 0 12px;
      font-size: 16px;
      color: #8B0000;
      border-bottom: 1px solid #f0e8e0;
      padding-bottom: 8px;
    }
    .field {
      display: flex;
      flex-direction: column;
      margin-bottom: 10px;
    }
    .field label {
      font-size: 12px;
      color: #888;
      margin-bottom: 2px;
      font-weight: 500;
    }
    .field span, .field a {
      font-size: 15px;
      color: #333;
    }
    .field input {
      padding: 8px 10px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 15px;
      outline: none;
    }
    .field input:focus {
      border-color: #8B0000;
    }
    .link {
      color: #8B0000;
      text-decoration: underline;
      cursor: pointer;
    }
    .family-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }
    .chip {
      display: inline-block;
      padding: 6px 12px;
      background: #f9f5f0;
      border-radius: 20px;
      font-size: 14px;
      text-decoration: none;
    }
    .chip small {
      color: #888;
      margin-left: 2px;
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 0 0 12px;
      border-bottom: 1px solid #f0e8e0;
      padding-bottom: 8px;
    }
    .card-header h3 {
      margin: 0;
      border-bottom: none;
      padding-bottom: 0;
    }
    .btn-self-edit {
      padding: 4px 12px;
      border-radius: 6px;
      border: 1px solid #8B0000;
      background: #fff;
      color: #8B0000;
      font-size: 12px;
      cursor: pointer;
    }
    .contact-save {
      width: 100%;
      margin-top: 8px;
    }
    .checkin-count {
      font-size: 13px;
      color: #888;
      font-weight: 400;
    }
    .checkin-gallery {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      justify-content: center;
    }
    .checkin-item {
      text-align: center;
      width: 120px;
    }
    .checkin-thumb {
      display: inline-block;
      width: 120px;
      height: 120px;
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      border: 2px solid #f0e8e0;
    }
    .checkin-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .checkin-date {
      font-size: 11px;
      color: #888;
      margin-top: 4px;
    }
    .btn-checkin-delete {
      margin-top: 4px;
      padding: 2px 10px;
      border-radius: 6px;
      border: 1px solid #c62828;
      background: #fff;
      color: #c62828;
      font-size: 11px;
      cursor: pointer;
    }
    .checkin-empty {
      text-align: center;
      color: #bbb;
      padding: 16px 0;
      font-size: 14px;
    }
    .checkin-actions {
      text-align: center;
      margin-top: 10px;
    }
    .btn-checkin {
      padding: 10px 24px;
      border-radius: 8px;
      border: 1.5px solid #8B0000;
      background: #8B0000;
      color: #fff;
      font-size: 14px;
      cursor: pointer;
    }
    .btn-checkin:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .zoom-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(0,0,0,0.9);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .zoom-overlay img {
      max-width: 95vw;
      max-height: 90vh;
      object-fit: contain;
      border-radius: 8px;
    }
    .zoom-close {
      position: absolute;
      top: 12px;
      right: 16px;
      background: none;
      border: none;
      color: #fff;
      font-size: 36px;
      cursor: pointer;
      line-height: 1;
    }
    .login-hint {
      text-align: center;
      margin-bottom: 16px;
      color: #888;
      font-size: 13px;
    }
    .creator-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: #1a73e8;
      font-weight: 600;
    }
    .creator-badge {
      display: inline-block;
      padding: 2px 8px;
      background: linear-gradient(135deg, #1a73e8, #6c47ff);
      color: #fff !important;
      font-size: 5px;
      font-weight: 700;
      border-radius: 10px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
  `]
})
export class PersonDetailComponent implements OnInit, OnChanges {
  @Input() person!: Person;
  @Input() canEdit = false;
  @Input() homePersonId?: string;
  @Output() navigateTo = new EventEmitter<string>();
  @Output() personSaved = new EventEmitter<Person>();
  @Output() personDeleted = new EventEmitter<void>();

  editing = false;
  editingContact = false;
  uploading = false;
  checkingIn = false;
  showAddChild = false;
  newChildName = '';
  newChildViTri = '';
  zoomedImage: string | null = null;

  get isSelf(): boolean {
    return !!this.homePersonId && this.person?.id === this.homePersonId;
  }

  get canEditContact(): boolean {
    return this.isSelf || this.canEdit;
  }

  father?: Person;
  mother?: Person;
  spouse?: Person;
  siblings: Person[] = [];
  children: Person[] = [];

  constructor(
    private familyService: FamilyService,
  ) {}

  ngOnInit(): void {
    this.migrateCheckIn();
    this.loadRelations();
  }

  ngOnChanges(): void {
    this.migrateCheckIn();
    this.loadRelations();
    this.editing = false;
    this.editingContact = false;
    this.showAddChild = false;
    this.zoomedImage = null;
  }

  /** Migrate dữ liệu cũ checkInImage → checkInImages */
  private migrateCheckIn(): void {
    if (!this.person) return;
    const p = this.person as any;
    if (p.checkInImage && !this.person.checkInImages?.length) {
      this.person.checkInImages = [p.checkInImage];
      this.person.checkInDates = p.checkInDate ? [p.checkInDate] : [];
      delete p.checkInImage;
      delete p.checkInDate;
    }
  }

  loadRelations(): void {
    if (!this.person) return;
    this.father = this.familyService.getFather(this.person.id);
    this.mother = this.familyService.getMother(this.person.id);
    this.spouse = this.person.voChongId
      ? this.familyService.getPersonById(this.person.voChongId)
      : undefined;
    this.siblings = this.familyService.getSiblings(this.person.id);
    this.children = this.familyService.getChildren(this.person.id);
    console.log(`[GP-DEBUG] loadRelations('${this.person.id}'): conIds=${JSON.stringify(this.person.conIds)}, children found=${this.children.length}`, this.children.map(c => c.id));
  }

  async onImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];

    this.uploading = true;
    try {
      const base64 = await this.compressImage(file, 600, 0.7);
      console.log(`[GP-DEBUG] Avatar image size: ${Math.round(base64.length / 1024)}KB`);
      this.person.hinhAnh = base64;
      await this.familyService.savePerson(this.person);
      this.personSaved.emit(this.person);
    } catch (e: any) {
      console.error('[GP-DEBUG] Avatar save error:', e);
      alert(e.message || 'Lỗi khi tải ảnh lên. Vui lòng thử lại.');
    } finally {
      this.uploading = false;
      input.value = '';
    }
  }

  async save(): Promise<void> {
    console.log(`[GP-DEBUG] PersonDetail.save() person='${this.person.id}'`, this.person);
    try {
      await this.familyService.savePerson(this.person);
      console.log(`[GP-DEBUG] PersonDetail.save() OK, emitting personSaved`);
      this.personSaved.emit(this.person);
      this.editing = false;
    } catch (e: any) {
      console.error(`[GP-DEBUG] PersonDetail.save() ERROR:`, e);
      alert(e.message || 'Lỗi khi lưu thông tin. Vui lòng thử lại.');
    }
  }

  async addChild(): Promise<void> {
    const name = this.newChildName.trim();
    if (!name) return;

    console.log(`[GP-DEBUG] PersonDetail.addChild() parent='${this.person.id}', childName='${name}'`);
    try {
      const child = await this.familyService.addChild(this.person.id, {
        hoTen: name,
        viTri: this.newChildViTri.trim() || undefined,
      });
      console.log(`[GP-DEBUG] PersonDetail.addChild() OK, child='${child.id}'`);
      this.newChildName = '';
      this.newChildViTri = '';
      this.showAddChild = false;
      // Cập nhật lại person từ service (đã cập nhật local state)
      const updated = this.familyService.getPersonById(this.person.id);
      console.log(`[GP-DEBUG] PersonDetail.addChild() updated parent:`, updated ? `conIds=${JSON.stringify(updated.conIds)}` : 'NOT FOUND');
      if (updated) {
        this.person = updated;
        this.personSaved.emit(this.person);
      }
      this.loadRelations();
    } catch (e: any) {
      console.error(`[GP-DEBUG] PersonDetail.addChild() ERROR:`, e);
      alert(e.message || 'Lỗi khi thêm con');
    }
  }

  async saveContactOnly(): Promise<void> {
    try {
      await this.familyService.savePerson(this.person);
      this.personSaved.emit(this.person);
      this.editingContact = false;
    } catch (e: any) {
      alert(e.message || 'Lỗi khi lưu liên hệ.');
    }
  }

  async onCheckIn(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];

    if ((this.person.checkInImages?.length || 0) >= 5) {
      alert('Tối đa 5 ảnh check-in.');
      input.value = '';
      return;
    }

    this.checkingIn = true;
    try {
      const base64 = await this.compressImage(file, 800, 0.6);
      if (!this.person.checkInImages) this.person.checkInImages = [];
      if (!this.person.checkInDates) this.person.checkInDates = [];
      this.person.checkInImages.push(base64);
      this.person.checkInDates.push(new Date().toLocaleDateString('vi-VN'));
      await this.familyService.savePerson(this.person);
      this.personSaved.emit(this.person);
    } catch (e: any) {
      alert(e.message || 'Lỗi khi check-in.');
    } finally {
      this.checkingIn = false;
      input.value = '';
    }
  }

  async deleteCheckInImage(index: number): Promise<void> {
    if (!confirm('Xóa ảnh check-in này?')) return;
    this.person.checkInImages?.splice(index, 1);
    this.person.checkInDates?.splice(index, 1);
    try {
      await this.familyService.savePerson(this.person);
      this.personSaved.emit(this.person);
    } catch (e: any) {
      alert(e.message || 'Lỗi khi xóa ảnh.');
    }
  }

  private compressImage(file: File, maxSize: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width;
          let h = img.height;
          if (w > maxSize || h > maxSize) {
            if (w > h) {
              h = Math.round(h * maxSize / w);
              w = maxSize;
            } else {
              w = Math.round(w * maxSize / h);
              h = maxSize;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Không đọc được ảnh'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('Không đọc được file'));
      reader.readAsDataURL(file);
    });
  }

  isCreatorSpouse(): boolean {
    return this.person?.id === 'n2c2-doi21-minhanh';
  }

  async confirmDelete(): Promise<void> {
    const ok = confirm(`Bạn có chắc muốn xóa "${this.person.hoTen}" khỏi gia phả?`);
    if (!ok) return;

    try {
      console.log(`[GP-DEBUG] confirmDelete('${this.person.id}') START`);
      await this.familyService.deletePerson(this.person.id);
      console.log(`[GP-DEBUG] confirmDelete: firestore OK, emitting personDeleted`);
      this.personDeleted.emit();
    } catch (e: any) {
      console.error('[GP-DEBUG] confirmDelete ERROR:', e);
      alert(e.message || 'Lỗi khi xóa');
    }
  }
}
