import { Component, Output, EventEmitter, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FamilyService } from '../../services/family.service';
import { BranchInfo } from '../../services/seed-data';

@Component({
  selector: 'app-family-tree',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tree-view">
      <!-- === IMAGE MODE === -->
      <ng-container *ngIf="mode === 'images'">
        <div class="tree-header">
          <h2>Tôn Đồ Họ Đỗ Xuân Thượng</h2>
          <p class="branch-label">{{ currentBranchInfo.label }}</p>
        </div>

        <!-- Static tree image from assets -->
        <div
          class="tree-image-container"
          *ngIf="currentBranchInfo.treeImage"
          (click)="openZoom(currentBranchInfo.treeImage)"
        >
          <img [src]="currentBranchInfo.treeImage" alt="Gia phả" class="tree-image" />
          <div class="zoom-hint">Nhấn để phóng to</div>
        </div>
      </ng-container>

      <!-- === GENERATIONS MODE === -->
      <ng-container *ngIf="mode === 'generations'">
        <div class="tree-header">
          <h2>Danh Sách Các Đời</h2>
          <p class="branch-label">{{ currentBranchInfo.label }}</p>
        </div>

        <div class="tree-text">
          <div *ngFor="let gen of generations" class="generation">
            <div class="gen-label">Đời {{ gen.doi }}</div>
            <div class="gen-members">
              <div
                *ngFor="let p of gen.people"
                class="member-chip"
                (click)="onPersonClick(p.id)"
              >
                <span class="member-name">{{ p.hoTen }}</span>
                <small *ngIf="p.viTri">{{ p.viTri }}</small>
              </div>
            </div>
          </div>
        </div>
      </ng-container>
    </div>

    <!-- === FULLSCREEN ZOOM OVERLAY === -->
    <div
      class="zoom-overlay"
      *ngIf="zoomImageSrc"
      (click)="onZoomOverlayClick($event)"
      (touchstart)="onTouchStart($event)"
      (touchmove)="onTouchMove($event)"
      (touchend)="onTouchEnd($event)"
      (wheel)="onWheel($event)"
    >
      <button class="zoom-close" (click)="closeZoom()">✕</button>
      <div class="zoom-controls">
        <button class="zoom-btn" (click)="zoomIn($event)">+</button>
        <button class="zoom-btn" (click)="resetZoom($event)">{{ Math.round(scale * 100) }}%</button>
        <button class="zoom-btn" (click)="zoomOut($event)">−</button>
      </div>
      <div class="zoom-image-wrapper">
        <img
          [src]="zoomImageSrc"
          class="zoom-image"
          [style.transform]="'translate(' + panX + 'px, ' + panY + 'px) scale(' + scale + ')'"
          draggable="false"
        />
      </div>
    </div>
  `,
  styles: [`
    .tree-view {
      padding: 16px;
      padding-bottom: 80px;
    }
    .tree-header {
      text-align: center;
      margin-bottom: 16px;
    }
    .tree-header h2 {
      color: #8B0000;
      font-size: 20px;
      margin: 0 0 4px;
    }
    .branch-label {
      color: #888;
      font-size: 14px;
      margin: 0 0 12px;
    }
    .tree-image-container {
      position: relative;
      margin-bottom: 12px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      cursor: pointer;
    }
    .tree-image {
      width: 100%;
      height: auto;
      display: block;
    }
    .zoom-hint {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0,0,0,0.5);
      color: #fff;
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 6px;
      pointer-events: none;
    }
    .tree-text {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .generation {
      background: #fff;
      border-radius: 10px;
      padding: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .gen-label {
      font-size: 13px;
      font-weight: 600;
      color: #8B0000;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #f0e8e0;
    }
    .gen-members {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .member-chip {
      display: inline-flex;
      flex-direction: column;
      padding: 8px 14px;
      background: #f9f5f0;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .member-chip:active {
      background: #e8d8c8;
    }
    .member-name {
      font-size: 14px;
      color: #333;
      font-weight: 500;
    }
    .member-chip small {
      font-size: 11px;
      color: #888;
    }

    /* Zoom overlay */
    .zoom-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(0,0,0,0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      touch-action: none;
      user-select: none;
    }
    .zoom-close {
      position: absolute;
      top: 12px;
      right: 12px;
      z-index: 1001;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: rgba(255,255,255,0.2);
      color: #fff;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .zoom-controls {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1001;
      display: flex;
      gap: 8px;
      background: rgba(0,0,0,0.6);
      border-radius: 10px;
      padding: 6px;
    }
    .zoom-btn {
      min-width: 44px;
      height: 36px;
      border: none;
      background: rgba(255,255,255,0.15);
      color: #fff;
      font-size: 16px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .zoom-image-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .zoom-image {
      max-width: 100%;
      max-height: 100%;
      transform-origin: center center;
      transition: transform 0.05s linear;
    }
  `]
})
export class FamilyTreeComponent implements OnInit, OnDestroy {
  @Input() mode: 'images' | 'generations' = 'images';
  @Output() personSelected = new EventEmitter<string>();

  currentBranchInfo!: BranchInfo;
  generations: { doi: number; people: any[] }[] = [];
  private branchSub?: Subscription;

  // Zoom state
  zoomImageSrc: string | null = null;
  scale = 1;
  panX = 0;
  panY = 0;
  Math = Math;

  // Touch tracking
  private lastTouchDist = 0;
  private lastTouchX = 0;
  private lastTouchY = 0;

  constructor(private familyService: FamilyService) {}

  ngOnInit(): void {
    this.refresh();
    this.branchSub = this.familyService.getPeopleObservable().subscribe(() => {
      this.refresh();
    });
  }

  ngOnDestroy(): void {
    this.branchSub?.unsubscribe();
  }

  refresh(): void {
    this.currentBranchInfo = this.familyService.getCurrentBranchInfo();
    if (this.mode === 'generations') {
      this.buildGenerations();
    }
  }

  buildGenerations(): void {
    const people = this.familyService.getAllPeople();
    const genMap = new Map<number, any[]>();
    for (const p of people) {
      const list = genMap.get(p.doiThu) || [];
      list.push(p);
      genMap.set(p.doiThu, list);
    }
    this.generations = Array.from(genMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([doi, people]) => ({ doi, people }));
  }

  onPersonClick(id: string): void {
    this.personSelected.emit(id);
  }

  // --- Zoom ---

  openZoom(src: string): void {
    this.zoomImageSrc = src;
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
  }

  closeZoom(): void {
    this.zoomImageSrc = null;
  }

  onZoomOverlayClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.classList.contains('zoom-overlay') || target.classList.contains('zoom-image-wrapper')) {
      this.closeZoom();
    }
  }

  zoomIn(event: Event): void {
    event.stopPropagation();
    this.scale = Math.min(this.scale * 1.3, 8);
  }

  zoomOut(event: Event): void {
    event.stopPropagation();
    this.scale = Math.max(this.scale / 1.3, 0.5);
  }

  resetZoom(event: Event): void {
    event.stopPropagation();
    this.scale = 1;
    this.panX = 0;
    this.panY = 0;
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.scale = Math.min(this.scale * 1.1, 8);
    } else {
      this.scale = Math.max(this.scale / 1.1, 0.5);
    }
  }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 2) {
      event.preventDefault();
      this.lastTouchDist = this.getTouchDistance(event);
      const mid = this.getTouchMidpoint(event);
      this.lastTouchX = mid.x;
      this.lastTouchY = mid.y;
    } else if (event.touches.length === 1 && this.scale > 1) {
      this.lastTouchX = event.touches[0].clientX;
      this.lastTouchY = event.touches[0].clientY;
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 2) {
      event.preventDefault();
      const dist = this.getTouchDistance(event);
      const ratio = dist / this.lastTouchDist;
      this.scale = Math.max(0.5, Math.min(8, this.scale * ratio));
      this.lastTouchDist = dist;

      const mid = this.getTouchMidpoint(event);
      this.panX += mid.x - this.lastTouchX;
      this.panY += mid.y - this.lastTouchY;
      this.lastTouchX = mid.x;
      this.lastTouchY = mid.y;
    } else if (event.touches.length === 1 && this.scale > 1) {
      event.preventDefault();
      const dx = event.touches[0].clientX - this.lastTouchX;
      const dy = event.touches[0].clientY - this.lastTouchY;
      this.panX += dx;
      this.panY += dy;
      this.lastTouchX = event.touches[0].clientX;
      this.lastTouchY = event.touches[0].clientY;
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.lastTouchX = event.touches[0].clientX;
      this.lastTouchY = event.touches[0].clientY;
    }
  }

  private getTouchDistance(event: TouchEvent): number {
    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private getTouchMidpoint(event: TouchEvent): { x: number; y: number } {
    return {
      x: (event.touches[0].clientX + event.touches[1].clientX) / 2,
      y: (event.touches[0].clientY + event.touches[1].clientY) / 2,
    };
  }
}
