import { Component, OnInit, signal, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AdminService, AdminStats } from '../../../core/services/admin.service';
import { PaymentService } from '../../../core/services/payment.service';
import { User } from '../../../core/models/user.model';
import { PaymentReceipt } from '../../../core/models/payment.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<AdminStats | null>(null);
  users = signal<User[]>([]);
  receipts = signal<PaymentReceipt[]>([]);
  isLoading = signal<boolean>(true);
  actionMessage = signal<string>('');
  actionType = signal<'success' | 'error'>('success');

  // Pestaña activa ('usuarios' | 'pagos')
  activeTab = signal<'usuarios' | 'pagos'>('usuarios');
  paymentFilter = signal<string>('todos');

  // Modales
  activeReceiptModal = signal<PaymentReceipt | null>(null);
  rejectModalReceipt = signal<PaymentReceipt | null>(null);
  rejectReason = '';

  constructor(
    private adminService: AdminService,
    private paymentService: PaymentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAdminData();
    this.loadReceipts();
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

  loadReceipts(filter?: string): void {
    const f = filter !== undefined ? filter : this.paymentFilter();
    this.paymentFilter.set(f);

    this.paymentService.getTodosComprobantes(f).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.receipts.set(res.data);
        }
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
          // Actualizar lista local
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

  // Verificación de Comprobantes de Pago
  onApproveReceipt(receipt: PaymentReceipt): void {
    if (!receipt._id) return;

    if (!confirm(`¿Confirmas la aprobación del comprobante #${receipt.numeroComprobante} por $${receipt.monto.toFixed(2)} USD?`)) {
      return;
    }

    this.paymentService.verificarComprobante(receipt._id, 'aprobar').subscribe({
      next: (res) => {
        if (res.success) {
          this.actionMessage.set(res.message || 'Comprobante aprobado exitosamente');
          this.actionType.set('success');
          this.loadReceipts();
          this.loadAdminData();
        }
      },
      error: (err) => {
        this.actionMessage.set(err.error?.message || 'Error al verificar comprobante');
        this.actionType.set('error');
      }
    });
  }

  onOpenRejectModal(receipt: PaymentReceipt): void {
    this.rejectModalReceipt.set(receipt);
    this.rejectReason = 'Comprobante no reflejado en la cuenta bancaria';
  }

  onCloseRejectModal(): void {
    this.rejectModalReceipt.set(null);
    this.rejectReason = '';
  }

  onConfirmReject(): void {
    const r = this.rejectModalReceipt();
    if (!r || !r._id) return;

    this.paymentService.verificarComprobante(r._id, 'rechazar', this.rejectReason).subscribe({
      next: (res) => {
        if (res.success) {
          this.actionMessage.set('Comprobante rechazado correctamente');
          this.actionType.set('success');
          this.onCloseRejectModal();
          this.loadReceipts();
          this.loadAdminData();
        }
      },
      error: (err) => {
        this.actionMessage.set(err.error?.message || 'Error al rechazar comprobante');
        this.actionType.set('error');
      }
    });
  }

  openReceiptModal(receipt: PaymentReceipt): void {
    this.activeReceiptModal.set(receipt);
  }

  closeReceiptModal(): void {
    this.activeReceiptModal.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.activeReceiptModal()) this.closeReceiptModal();
    if (this.rejectModalReceipt()) this.onCloseRejectModal();
  }
}
