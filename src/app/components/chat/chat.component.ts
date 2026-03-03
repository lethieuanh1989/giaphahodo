import { Component, OnInit, OnDestroy, Input, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FirebaseService } from '../../services/firebase.service';

interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  text: string;
  createdAt: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit, OnDestroy {
  @Input() currentUid = '';
  @Input() currentUserName = '';
  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('messageInput') messageInput?: ElementRef<HTMLInputElement>;

  private firebaseService = inject(FirebaseService);
  private sub?: Subscription;

  isOpen = false;
  messages: ChatMessage[] = [];
  newMessage = '';
  unreadCount = 0;
  private lastSeenCount = 0;
  private isFirstLoad = true;

  ngOnInit(): void {
    this.sub = this.firebaseService.getChatMessages().subscribe(docs => {
      this.messages = (docs as ChatMessage[]).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      if (this.isFirstLoad) {
        this.lastSeenCount = this.messages.length;
        this.isFirstLoad = false;
      }

      if (!this.isOpen) {
        this.unreadCount = Math.max(0, this.messages.length - this.lastSeenCount);
      } else {
        this.lastSeenCount = this.messages.length;
        this.unreadCount = 0;
      }

      if (this.isOpen) {
        this.scrollToBottom();
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.unreadCount = 0;
      this.lastSeenCount = this.messages.length;
      this.scrollToBottom();
      setTimeout(() => this.messageInput?.nativeElement.focus(), 300);
    }
  }

  async sendMessage(): Promise<void> {
    const text = this.newMessage.trim();
    if (!text || !this.currentUid) return;

    const message: ChatMessage = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
      senderUid: this.currentUid,
      senderName: this.currentUserName || 'Ẩn danh',
      text,
      createdAt: new Date().toISOString(),
    };

    this.newMessage = '';
    await this.firebaseService.sendChatMessage(message as any);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  isOwnMessage(msg: ChatMessage): boolean {
    return msg.senderUid === this.currentUid;
  }

  formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Hôm nay';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua';
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  shouldShowDate(index: number): boolean {
    if (index === 0) return true;
    const curr = new Date(this.messages[index].createdAt).toDateString();
    const prev = new Date(this.messages[index - 1].createdAt).toDateString();
    return curr !== prev;
  }

  shouldShowName(index: number): boolean {
    const msg = this.messages[index];
    if (this.isOwnMessage(msg)) return false;
    if (index === 0) return true;
    return this.messages[index - 1].senderUid !== msg.senderUid;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = this.messagesContainer?.nativeElement;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }, 100);
  }
}
