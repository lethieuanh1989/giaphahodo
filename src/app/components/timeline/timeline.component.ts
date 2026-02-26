import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TimelineEvent {
  id: string;
  imageBase64: string;
  note: string;
  createdAt: string;
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="timeline-container">
      <div class="timeline-line"></div>

      <div class="timeline-item" *ngFor="let event of events; let i = index">
        <div class="timeline-node" (click)="toggleExpand(i)">
          <span class="node-dot" [class.has-image]="!!event.imageBase64"></span>
        </div>
        <div class="timeline-card" [class.expanded]="expandedIndex === i">
          <!-- Image area -->
          <div class="image-area" (click)="triggerFileInput(i)">
            <img *ngIf="event.imageBase64" [src]="event.imageBase64" class="timeline-image" />
            <div *ngIf="!event.imageBase64" class="image-placeholder">
              <span class="upload-icon">📷</span>
              <span class="upload-text">Chọn ảnh</span>
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            class="file-input"
            #fileInput
            (change)="onImageSelected($event, i)"
          />
          <!-- Note area -->
          <textarea
            class="note-input"
            [(ngModel)]="event.note"
            (blur)="saveEvents()"
            placeholder="Ghi chú..."
            rows="2"
          ></textarea>
          <!-- Delete button -->
          <button class="delete-btn" (click)="removeEvent(i, $event)">Xóa</button>
        </div>
      </div>

      <!-- Add button -->
      <div class="timeline-item add-item">
        <div class="timeline-node" (click)="addEvent()">
          <span class="node-dot add-dot">+</span>
        </div>
        <div class="add-label" (click)="addEvent()">Thêm sự kiện</div>
      </div>
    </div>
  `,
  styles: [`
    .timeline-container {
      position: relative;
      padding: 24px 16px 100px 48px;
    }

    .timeline-line {
      position: absolute;
      left: 30px;
      top: 24px;
      bottom: 100px;
      width: 3px;
      background: linear-gradient(to bottom, #8B0000, #d4a574);
      border-radius: 2px;
    }

    .timeline-item {
      position: relative;
      display: flex;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .timeline-node {
      position: absolute;
      left: -30px;
      top: 8px;
      cursor: pointer;
      z-index: 2;
    }

    .node-dot {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      border: 3px solid #8B0000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: transparent;
      transition: all 0.2s;
    }

    .node-dot.has-image {
      background: #8B0000;
      border-color: #8B0000;
    }

    .node-dot.add-dot {
      background: #8B0000;
      color: #fff;
      font-size: 14px;
      font-weight: bold;
      width: 22px;
      height: 22px;
    }

    .timeline-card {
      flex: 1;
      background: #fff;
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border: 1px solid #f0e8e0;
    }

    .image-area {
      width: 100%;
      min-height: 80px;
      border-radius: 8px;
      overflow: hidden;
      cursor: pointer;
      background: #faf6f1;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px dashed #d4a574;
      margin-bottom: 8px;
    }

    .image-area:has(img) {
      border: none;
      min-height: auto;
    }

    .timeline-image {
      width: 100%;
      max-height: 300px;
      object-fit: cover;
      display: block;
      border-radius: 6px;
    }

    .image-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 16px;
      color: #a08060;
    }

    .upload-icon {
      font-size: 28px;
    }

    .upload-text {
      font-size: 13px;
    }

    .file-input {
      display: none;
    }

    .note-input {
      width: 100%;
      border: 1px solid #e8e0d8;
      border-radius: 8px;
      padding: 8px 10px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      background: #faf8f5;
      color: #333;
      box-sizing: border-box;
    }

    .note-input:focus {
      outline: none;
      border-color: #8B0000;
      background: #fff;
    }

    .delete-btn {
      margin-top: 8px;
      padding: 4px 12px;
      background: none;
      border: 1px solid #ddd;
      border-radius: 6px;
      color: #999;
      font-size: 12px;
      cursor: pointer;
    }

    .delete-btn:active {
      background: #fee;
      border-color: #c00;
      color: #c00;
    }

    .add-item {
      display: flex;
      align-items: center;
    }

    .add-label {
      font-size: 14px;
      color: #8B0000;
      font-weight: 500;
      cursor: pointer;
      padding: 6px 0;
    }
  `]
})
export class TimelineComponent implements OnInit {
  events: TimelineEvent[] = [];
  expandedIndex = -1;
  private fileInputs: HTMLInputElement[] = [];
  private readonly STORAGE_KEY = 'timeline-events';

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      this.events = JSON.parse(data);
    }
  }

  saveEvents(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events));
  }

  addEvent(): void {
    const event: TimelineEvent = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
      imageBase64: '',
      note: '',
      createdAt: new Date().toISOString(),
    };
    this.events.push(event);
    this.expandedIndex = this.events.length - 1;
    this.saveEvents();
  }

  removeEvent(index: number, e: Event): void {
    e.stopPropagation();
    this.events.splice(index, 1);
    this.expandedIndex = -1;
    this.saveEvents();
  }

  toggleExpand(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? -1 : index;
  }

  triggerFileInput(index: number): void {
    const inputs = document.querySelectorAll<HTMLInputElement>('.file-input');
    if (inputs[index]) {
      inputs[index].click();
    }
  }

  onImageSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.events[index].imageBase64 = reader.result as string;
      this.saveEvents();
    };
    reader.readAsDataURL(file);
    input.value = '';
  }
}
