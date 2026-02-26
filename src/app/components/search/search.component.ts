import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Person } from '../../models/person.model';
import { FamilyService } from '../../services/family.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="search-page">
      <div class="search-bar">
        <input
          type="text"
          [(ngModel)]="query"
          (ngModelChange)="onSearch()"
          placeholder="Tìm theo tên, địa chỉ, SĐT, đời..."
          autofocus
        />
      </div>

      <div class="results" *ngIf="results.length > 0">
        <div
          class="result-card"
          *ngFor="let p of results"
          (click)="onSelect(p.id)"
        >
          <div class="result-avatar">
            <img *ngIf="p.hinhAnh" [src]="p.hinhAnh" />
            <span *ngIf="!p.hinhAnh" class="avatar-text">{{ getInitials(p.hoTen) }}</span>
          </div>
          <div class="result-info">
            <div class="result-name">{{ p.hoTen }}</div>
            <div class="result-meta">
              Đời {{ p.doiThu }}
              <span *ngIf="p.viTri"> · {{ p.viTri }}</span>
              <span class="result-id"> · {{ p.id }}</span>
            </div>
            <div class="result-meta" *ngIf="p.diaChiHienTai">{{ p.diaChiHienTai }}</div>
          </div>
        </div>
      </div>

      <div class="no-results" *ngIf="query.trim() && results.length === 0">
        <p>Không tìm thấy kết quả cho "{{ query }}"</p>
      </div>
    </div>
  `,
  styles: [`
    .search-page {
      padding: 16px;
      padding-bottom: 80px;
    }
    .search-bar {
      margin-bottom: 16px;
    }
    .search-bar input {
      width: 100%;
      padding: 14px 16px;
      border: 1.5px solid #ddd;
      border-radius: 12px;
      font-size: 16px;
      outline: none;
      box-sizing: border-box;
    }
    .search-bar input:focus {
      border-color: #8B0000;
    }
    .results {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .result-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      cursor: pointer;
      transition: background 0.2s;
    }
    .result-card:active {
      background: #f9f5f0;
    }
    .result-avatar {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: #f9f5f0;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
    }
    .result-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .avatar-text {
      font-size: 16px;
      font-weight: 600;
      color: #8B0000;
    }
    .result-info {
      flex: 1;
      min-width: 0;
    }
    .result-name {
      font-size: 16px;
      font-weight: 500;
      color: #333;
    }
    .result-meta {
      font-size: 13px;
      color: #888;
    }
    .result-id {
      font-size: 11px;
      color: #bbb;
    }
    .no-results {
      text-align: center;
      color: #888;
      padding: 32px 0;
    }
  `]
})
export class SearchComponent {
  @Output() personSelected = new EventEmitter<string>();

  query = '';
  results: Person[] = [];

  constructor(private familyService: FamilyService) {}

  onSearch(): void {
    this.results = this.familyService.searchPeople(this.query);
  }

  onSelect(id: string): void {
    this.personSelected.emit(id);
  }

  getInitials(name: string): string {
    const parts = name.split(' ');
    return parts.length > 1
      ? parts[parts.length - 1][0]
      : name[0] || '?';
  }
}
