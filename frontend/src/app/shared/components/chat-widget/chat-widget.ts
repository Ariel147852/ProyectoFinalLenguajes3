import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  effect,
  ViewChild,
  ElementRef,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { ChatMessage } from '../../../core/models/chat.model';

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat-widget.html',
  styleUrls: ['./chat-widget.css']
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  @ViewChild('messagesScroll') private messagesScrollContainer!: ElementRef;

  isOpen = signal<boolean>(false);
  isConnected = signal<boolean>(false);
  messages = signal<ChatMessage[]>([]);
  newMessage = '';
  unreadCount = signal<number>(0);

  private subscriptions: Subscription = new Subscription();

  constructor(
    public chatService: ChatService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // 1. Cargar historial persistido desde MongoDB
    this.loadHistory();

    // 2. Suscribirse a mensajes entrantes por WebSocket en tiempo real
    const msgSub = this.chatService.message$.subscribe((newMsg: ChatMessage) => {
      this.messages.update((list) => [...list, newMsg]);

      if (!this.isOpen()) {
        this.unreadCount.update((c) => c + 1);
      }

      this.scrollToBottom();
      this.cdr.markForCheck();
    });

    const connSub = this.chatService.isConnected$.subscribe((connected: boolean) => {
      this.isConnected.set(connected);
      this.cdr.markForCheck();
    });

    this.subscriptions.add(msgSub);
    this.subscriptions.add(connSub);
  }

  loadHistory(): void {
    this.chatService.getHistory().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.messages.set(res.data);
          this.scrollToBottom();
          this.cdr.markForCheck();
        }
      }
    });
  }

  toggleChat(): void {
    const nextState = !this.isOpen();
    this.isOpen.set(nextState);

    if (nextState) {
      this.unreadCount.set(0);
      this.scrollToBottom();
    }
  }

  onSendMessage(): void {
    if (!this.newMessage.trim()) return;

    const user = this.authService.currentUser();
    if (!user) return;

    const targetUserId = user.id || (user as any)._id;

    this.chatService.sendMessage({
      usuarioId: targetUserId,
      nombreUsuario: user.nombre,
      rolUsuario: user.rol,
      mensaje: this.newMessage
    });

    this.newMessage = '';
  }

  isMyMessage(msg: ChatMessage): boolean {
    const user = this.authService.currentUser();
    if (!user) return false;
    const myId = user.id || (user as any)._id;
    const msgUserId = typeof msg.usuarioId === 'object' ? msg.usuarioId._id : msg.usuarioId;
    return myId === msgUserId;
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if (this.messagesScrollContainer) {
        const el = this.messagesScrollContainer.nativeElement;
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
