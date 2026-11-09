import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { ChatMessage, ChatContentType } from '../models/chat.model';
import { ApiResponse } from '../models/api.model';

@Injectable({
  providedIn: 'root'
})
export class ChatService implements OnDestroy {
  private socket: Socket;
  private readonly SOCKET_URL = 'http://localhost:5000';
  private readonly API_URL = 'http://localhost:5000/api/v1/chat';

  private messageSubject = new Subject<ChatMessage>();
  public message$ = this.messageSubject.asObservable();

  private isConnectedSubject = new Subject<boolean>();
  public isConnected$ = this.isConnectedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.socket = io(this.SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('[WebSocket Client] Conectado exitosamente');
      this.isConnectedSubject.next(true);
      this.socket.emit('join_room', 'comunidad_general');
    });

    this.socket.on('disconnect', () => {
      console.log('[WebSocket Client] Desconectado');
      this.isConnectedSubject.next(false);
    });

    this.socket.on('receive_message', (msg: ChatMessage) => {
      this.messageSubject.next(msg);
    });
  }

  getHistory(sala: string = 'comunidad_general'): Observable<ApiResponse<ChatMessage[]>> {
    return this.http.get<ApiResponse<ChatMessage[]>>(`${this.API_URL}/history?sala=${sala}`);
  }

  sendMessage(payload: {
    usuarioId: string;
    nombreUsuario: string;
    rolUsuario?: 'user' | 'admin';
    mensaje?: string;
    tipoContenido?: ChatContentType;
    mediaUrl?: string;
    sala?: string;
  }): void {
    const text = payload.mensaje?.trim() || '';
    const media = payload.mediaUrl?.trim() || '';

    // Debe contener texto o archivo multimedia
    if (!text && !media) return;

    this.socket.emit('send_message', {
      usuarioId: payload.usuarioId,
      nombreUsuario: payload.nombreUsuario,
      rolUsuario: payload.rolUsuario || 'user',
      mensaje: text,
      tipoContenido: payload.tipoContenido || (media ? 'imagen' : 'texto'),
      mediaUrl: media,
      sala: payload.sala || 'comunidad_general'
    });
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
