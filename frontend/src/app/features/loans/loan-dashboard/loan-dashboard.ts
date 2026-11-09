import { Component, OnInit, OnDestroy, signal, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoanService } from '../../../core/services/loan.service';
import { Loan } from '../../../core/models/loan.model';

@Component({
  selector: 'app-loan-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './loan-dashboard.html',
  styleUrls: ['./loan-dashboard.css']
})
export class LoanDashboardComponent implements OnInit, OnDestroy {
  activeTab = signal<'borrowed' | 'lent'>('borrowed');

  borrowedLoans = signal<Loan[]>([]);
  lentLoans = signal<Loan[]>([]);

  isLoading = signal<boolean>(true);
  feedback = signal<string>('');
  feedbackType = signal<'success' | 'error'>('success');

  // Reloj de 15 minutos en tiempo real
  now = signal<number>(Date.now());
  private timerSubscription: any;

  // Modal para que el prestatario pague y suba comprobante
  activePaymentModal = signal<Loan | null>(null);
  metodoPago: 'deuna' | 'transferencia' = 'deuna';
  numeroReferencia = '';
  comprobantePagoUrl = '';
  comprobanteFileName = '';
  isUploadingReceipt = signal<boolean>(false);

  // Modal para ver comprobante en grande (tanto prestatario como prestador)
  activeVoucherModal = signal<{ url: string; title: string; meta?: string } | null>(null);

  constructor(
    private loanService: LoanService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
    // Reloj actualizador cada segundo
    this.timerSubscription = setInterval(() => {
      this.now.set(Date.now());
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      clearInterval(this.timerSubscription);
    }
  }

  // Control de pestaña inicial resuelta
  private initialTabResolved = false;

  get pendingLentValidationCount(): number {
    return this.lentLoans().filter(
      l => l.estadoPago === 'pendiente_validacion' || (l.estado === 'pendiente' && !!l.comprobantePagoUrl)
    ).length;
  }

  loadData(): void {
    this.isLoading.set(true);
    this.feedback.set('');

    let borrowedLoaded = false;
    let lentLoaded = false;

    const checkBothDone = () => {
      if (borrowedLoaded && lentLoaded) {
        this.isLoading.set(false);
        // Si el usuario no tiene préstamos como prestatario pero sí tiene solicitudes de sus herramientas, auto-abrir pestaña Prestamista
        if (!this.initialTabResolved) {
          this.initialTabResolved = true;
          if (this.borrowedLoans().length === 0 && this.lentLoans().length > 0) {
            this.activeTab.set('lent');
          }
        }
        this.cdr.markForCheck();
      }
    };

    this.loanService.getMyBorrowedLoans().subscribe({
      next: (res) => {
        borrowedLoaded = true;
        if (res.success && res.data) {
          this.borrowedLoans.set(res.data);
        }
        checkBothDone();
      },
      error: (err) => {
        borrowedLoaded = true;
        this.feedback.set(err.error?.message || 'Error al cargar los préstamos solicitados');
        this.feedbackType.set('error');
        checkBothDone();
      }
    });

    this.loanService.getMyLentLoans().subscribe({
      next: (res) => {
        lentLoaded = true;
        if (res.success && res.data) {
          this.lentLoans.set(res.data);
        }
        checkBothDone();
      },
      error: (err) => {
        lentLoaded = true;
        this.feedback.set(err.error?.message || 'Error al cargar las solicitudes de tus herramientas');
        this.feedbackType.set('error');
        checkBothDone();
      }
    });
  }

  switchTab(tab: 'borrowed' | 'lent'): void {
    this.activeTab.set(tab);
  }

  // Cuenta regresiva de 15 minutos
  getTimeRemaining(loan: Loan): { text: string; expired: boolean; percent: number } {
    if (!loan.fechaLimitePago) {
      return { text: '15:00', expired: false, percent: 100 };
    }

    const limit = new Date(loan.fechaLimitePago).getTime();
    const diff = limit - this.now();

    if (diff <= 0) {
      return { text: '00:00 - Expirado', expired: true, percent: 0 };
    }

    const totalDuration = 15 * 60 * 1000;
    const percent = Math.max(0, Math.min(100, (diff / totalDuration) * 100));

    const totalSeconds = Math.floor(diff / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return { text: `${formatted} min`, expired: false, percent };
  }

  // Abrir modal de pago para prestatario
  openPaymentModal(loan: Loan): void {
    this.activePaymentModal.set(loan);
    this.metodoPago = 'deuna';
    this.numeroReferencia = '';
    this.comprobantePagoUrl = '';
    this.comprobanteFileName = '';
  }

  closePaymentModal(): void {
    this.activePaymentModal.set(null);
  }

  onReceiptFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      this.feedback.set('El comprobante no debe superar los 8 MB');
      this.feedbackType.set('error');
      target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.comprobantePagoUrl = reader.result as string;
      this.comprobanteFileName = file.name;
      this.cdr.markForCheck();
    };
    reader.readAsDataURL(file);
  }

  onSubmitReceipt(): void {
    const loan = this.activePaymentModal();
    if (!loan || !this.comprobantePagoUrl) return;

    this.isUploadingReceipt.set(true);

    this.loanService
      .subirComprobantePago(loan._id, {
        comprobantePagoUrl: this.comprobantePagoUrl,
        metodoPago: this.metodoPago,
        numeroReferenciaPago: this.numeroReferencia.trim()
      })
      .subscribe({
        next: (res) => {
          this.isUploadingReceipt.set(false);
          this.closePaymentModal();
          this.feedback.set('¡Comprobante de pago enviado! El prestador validará el pago para confirmar la reserva.');
          this.feedbackType.set('success');
          this.loadData();
        },
        error: (err) => {
          this.isUploadingReceipt.set(false);
          this.feedback.set(err.error?.message || 'Error al subir el comprobante de pago');
          this.feedbackType.set('error');
          this.cdr.markForCheck();
        }
      });
  }

  // Validación de pago por el prestador
  onValidarPago(loanId: string, accion: 'validar' | 'rechazar'): void {
    this.loanService.validarPago(loanId, accion).subscribe({
      next: (res) => {
        if (res.success) {
          this.feedback.set(
            accion === 'validar'
              ? '✓ Pago validado exitosamente. Préstamo confirmado y aprobado.'
              : '✕ Pago rechazado. Herramienta liberada.'
          );
          this.feedbackType.set('success');
          this.loadData();
        }
      },
      error: (err) => {
        this.feedback.set(err.error?.message || 'Error al validar el pago');
        this.feedbackType.set('error');
        this.cdr.markForCheck();
      }
    });
  }

  // Ver comprobante en modal
  openVoucherModal(url: string, title: string, meta?: string): void {
    this.activeVoucherModal.set({ url, title, meta });
  }

  closeVoucherModal(): void {
    this.activeVoucherModal.set(null);
  }

  onDeliver(loanId: string): void {
    this.loanService.deliverLoan(loanId).subscribe({
      next: (res) => {
        if (res.success) {
          this.feedback.set('Entrega registrada: la herramienta está en curso de uso');
          this.feedbackType.set('success');
          this.loadData();
        }
      },
      error: (err) => {
        this.feedback.set(err.error?.message || 'Error al registrar entrega');
        this.feedbackType.set('error');
        this.cdr.markForCheck();
      }
    });
  }

  onReturn(loanId: string): void {
    this.loanService.returnLoan(loanId).subscribe({
      next: (res) => {
        if (res.success) {
          this.feedback.set('Devolución confirmada con éxito. ¡Gracias por compartir!');
          this.feedbackType.set('success');
          this.loadData();
        }
      },
      error: (err) => {
        this.feedback.set(err.error?.message || 'Error al registrar devolución');
        this.feedbackType.set('error');
        this.cdr.markForCheck();
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.activePaymentModal()) this.closePaymentModal();
    if (this.activeVoucherModal()) this.closeVoucherModal();
  }
}
