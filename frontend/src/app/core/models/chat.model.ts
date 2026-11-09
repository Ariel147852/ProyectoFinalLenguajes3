export interface ChatMessage {
  _id?: string;
  usuarioId: string | { _id: string; nombre: string; email?: string; rol?: string };
  nombreUsuario: string;
  rolUsuario: 'user' | 'admin';
  mensaje: string;
  sala: string;
  createdAt?: string;
  updatedAt?: string;
}
