import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminService, AdminStats } from '../../../core/services/admin.service';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<AdminStats | null>(null);
  users = signal<User[]>([]);
  isLoading = signal<boolean>(true);
  actionMessage = signal<string>('');
  actionType = signal<'success' | 'error'>('success');

  constructor(
    private adminService: AdminService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAdminData();
  }

  loadAdminData(): void {
    this.isLoading.set(true);

    this.adminService.getStats().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.stats.set(res.data);
        }
      }
    });

    this.adminService.getUsers().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.users.set(res.data);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.actionMessage.set(err.error?.message || 'Error al cargar usuarios');
        this.actionType.set('error');
        this.cdr.markForCheck();
      }
    });
  }

  onToggleStatus(user: User): void {
    const targetId = user.id || (user as any)._id;
    if (!targetId) return;

    this.adminService.toggleUserStatus(targetId).subscribe({
      next: (res) => {
        if (res.success) {
          this.actionMessage.set(res.message || 'Estado de usuario actualizado');
          this.actionType.set('success');
          // Update local list
          this.users.update((current) =>
            current.map((u) => {
              const uId = u.id || (u as any)._id;
              if (uId === targetId) {
                return { ...u, activo: res.data?.activo };
              }
              return u;
            })
          );
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        this.actionMessage.set(err.error?.message || 'Error al cambiar estado');
        this.actionType.set('error');
        this.cdr.markForCheck();
      }
    });
  }
}

