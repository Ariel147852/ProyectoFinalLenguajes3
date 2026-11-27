import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { User, AuthResponse, DatosFinancieros } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `http://${window.location.hostname}:5000/api/v1/auth`;

  // Reactividad moderna con Angular Signals
  currentUser = signal<User | null>(this.getUserFromStorage());
  isAuthenticated = computed(() => this.currentUser() !== null);
  isAdmin = computed(() => this.currentUser()?.rol === 'admin');

  constructor(private http: HttpClient) {}

  private getUserFromStorage(): User | null {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  sendVerificationCode(email: string): Observable<ApiResponse<{ email: string; expiresInMinutes: number; devCode?: string }>> {
    return this.http.post<ApiResponse<{ email: string; expiresInMinutes: number; devCode?: string }>>(
      `${this.API_URL}/send-verification-code`,
      { email }
    );
  }

  verifyCode(email: string, code: string): Observable<ApiResponse<{ email: string; verified: boolean }>> {
    return this.http.post<ApiResponse<{ email: string; verified: boolean }>>(
      `${this.API_URL}/verify-code`,
      { email, code }
    );
  }

  register(payload: {
    nombre: string;
    email: string;
    password: string;
    telefono: string;
    direccionZona?: string;
    cedula: string;
    cedulaFrontalUrl: string;
    cedulaPosteriorUrl: string;
  }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/register`, payload).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data.token, res.data.user);
        }
      })
    );
  }

  login(credentials: { email: string; password: string }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data.token, res.data.user);
        }
      })
    );
  }

  getDatosFinancieros(): Observable<ApiResponse<DatosFinancieros>> {
    return this.http.get<ApiResponse<DatosFinancieros>>(`${this.API_URL}/datos-financieros`);
  }

  updateDatosFinancieros(payload: DatosFinancieros): Observable<ApiResponse<DatosFinancieros>> {
    return this.http.put<ApiResponse<DatosFinancieros>>(`${this.API_URL}/datos-financieros`, payload).pipe(
      tap(res => {
        if (res.success && res.data) {
          const user = this.currentUser();
          if (user) {
            const updated = { ...user, datosFinancieros: res.data };
            this.setSession(this.getToken() || '', updated);
          }
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }

  private setSession(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}

