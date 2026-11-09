import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatService } from '../../../core/services/chat.service';
import { AuthService } from '../../../core/services/auth.service';
import { ChatMessage, ChatContentType } from '../../../core/models/chat.model';

export interface PendingMedia {
  tipo: 'imagen' | 'video';
  url: string;
  name: string;
}

export interface LightboxData {
  tipo: 'imagen' | 'video';
  url: string;
  caption?: string;
  author?: string;
  time?: string;
}

@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './chat-widget.html',
  styleUrls: ['./chat-widget.css']
})
export class ChatWidgetComponent implements OnInit, OnDestroy {
  @ViewChild('messagesScroll') private messagesScrollContainer!: ElementRef;
  @ViewChild('fileInput') private fileInputRef!: ElementRef<HTMLInputElement>;

  isOpen = signal<boolean>(false);
  isConnected = signal<boolean>(false);
  messages = signal<ChatMessage[]>([]);
  newMessage = '';
  unreadCount = signal<number>(0);

  // Multimedia adjunta pendiente de envío
  pendingMedia = signal<PendingMedia | null>(null);
  uploadError = signal<string>('');

  // Vista en Pantalla Completa (Lightbox)
  activeLightbox = signal<LightboxData | null>(null);

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

  // Manejo de selección de archivo imagen/video
  onAttachClick(): void {
    if (this.fileInputRef) {
      this.fileInputRef.nativeElement.click();
    }
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    this.uploadError.set('');

    // Límite de tamaño: 8 MB
    const maxSizeBytes = 8 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      this.uploadError.set('El archivo excede el tamaño máximo permitido de 8 MB');
      target.value = '';
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isImage && !isVideo) {
      this.uploadError.set('Formato no compatible. Por favor sube una imagen o video.');
      target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.pendingMedia.set({
        tipo: isVideo ? 'video' : 'imagen',
        url: result,
        name: file.name
      });
      target.value = '';
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  cancelPendingMedia(): void {
    this.pendingMedia.set(null);
    this.uploadError.set('');
  }

  onSendMessage(): void {
    const text = this.newMessage.trim();
    const media = this.pendingMedia();

    if (!text && !media) return;

    const user = this.authService.currentUser();
    if (!user) return;

    const targetUserId = user.id || (user as any)._id;

    this.chatService.sendMessage({
      usuarioId: targetUserId,
      nombreUsuario: user.nombre,
      rolUsuario: user.rol,
      mensaje: text,
      tipoContenido: media ? media.tipo : 'texto',
      mediaUrl: media ? media.url : ''
    });

    this.newMessage = '';
    this.pendingMedia.set(null);
    this.uploadError.set('');
  }

  // Lightbox / Pantalla Grande
  openLightbox(msg: ChatMessage, tipo: 'imagen' | 'video'): void {
    if (!msg.mediaUrl) return;
    this.activeLightbox.set({
      tipo,
      url: msg.mediaUrl,
      caption: msg.mensaje,
      author: msg.nombreUsuario,
      time: msg.createdAt
    });
  }

  closeLightbox(): void {
    this.activeLightbox.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.activeLightbox()) {
      this.closeLightbox();
    }
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
