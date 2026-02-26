import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-name-popup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="overlay">
      <div class="popup">
        <div class="popup-header">
          <h2>Gia Phả Họ Đỗ</h2>
          <p>Xuân Thượng</p>
        </div>
        <div class="popup-body">
          <label for="nameInput">Nhập họ tên của bạn</label>
          <input
            id="nameInput"
            type="text"
            [(ngModel)]="name"
            placeholder="VD: Đỗ Văn A"
            (keyup.enter)="submit()"
            autofocus
          />
          <button class="btn-primary" (click)="submit()" [disabled]="!name.trim()">
            Nhập
          </button>
          <p class="error-msg" *ngIf="errorMessage">{{ errorMessage }}</p>
          <button class="btn-secondary" (click)="browseAll()">
            Xem tất cả
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }
    .popup {
      background: #fff;
      border-radius: 16px;
      width: 100%;
      max-width: 380px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    }
    .popup-header {
      background: linear-gradient(135deg, #8B0000, #CD853F);
      color: #fff;
      padding: 24px 20px;
      text-align: center;
    }
    .popup-header h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
    }
    .popup-header p {
      margin: 4px 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .popup-body {
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    label {
      font-size: 14px;
      color: #555;
      font-weight: 500;
    }
    input {
      padding: 12px 14px;
      border: 1.5px solid #ddd;
      border-radius: 10px;
      font-size: 16px;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus {
      border-color: #8B0000;
    }
    .btn-primary {
      padding: 12px;
      background: #8B0000;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .error-msg {
      color: #c00;
      font-size: 13px;
      margin: 0;
      text-align: center;
      line-height: 1.4;
    }
    .btn-secondary {
      padding: 10px;
      background: transparent;
      color: #8B0000;
      border: 1.5px solid #8B0000;
      border-radius: 10px;
      font-size: 14px;
      cursor: pointer;
    }
  `]
})
export class NamePopupComponent {
  @Input() errorMessage = '';
  @Output() nameSubmitted = new EventEmitter<string>();
  @Output() browseAllClicked = new EventEmitter<void>();

  name = '';

  submit(): void {
    if (this.name.trim()) {
      this.nameSubmitted.emit(this.name.trim());
    }
  }

  browseAll(): void {
    this.browseAllClicked.emit();
  }
}
