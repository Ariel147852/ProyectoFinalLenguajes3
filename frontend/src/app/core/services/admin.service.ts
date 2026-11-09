import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { User } from '../models/user.model';

export interface AdminStats {
  totalUsers: number;
  totalTools: number;
  activeLoans: number;
  completedLoans: number;
  pendingPayments?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly API_URL = 'http://localhost:5000/api/v1/admin';

  constructor(private http: HttpClient) {}

  getStats(): Observable<ApiResponse<AdminStats>> {
    return this.http.get<ApiResponse<AdminStats>>(`${this.API_URL}/stats`);
  }

  getUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.API_URL}/users`);
  }

  toggleUserStatus(userId: string): Observable<ApiResponse<{ id: string; activo: boolean }>> {
    return this.http.patch<ApiResponse<{ id: string; activo: boolean }>>(`${this.API_URL}/users/${userId}/toggle-status`, {});
  }
}

