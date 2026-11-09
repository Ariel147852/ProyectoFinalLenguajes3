import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
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
export class LoanDashboardComponent implements OnInit {
  activeTab = signal<'borrowed' | 'lent'>('borrowed');

  borrowedLoans = signal<Loan[]>([]);
  lentLoans = signal<Loan[]>([]);

  isLoading = signal<boolean>(true);
  feedback = signal<string>('');
  feedbackType = signal<'success' | 'error'>('success');

  constructor(
    private loanService: LoanService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.feedback.set('');

    if (this.activeTab() === 'borrowed') {
      this.loanService.getMyBorrowedLoans().subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.data) {
            this.borrowedLoans.set(res.data);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.feedback.set(err.error?.message || 'Error al cargar los préstamos solicitados');
          this.feedbackType.set('error');
          this.cdr.markForCheck();
        }
      });
    } else {
      this.loanService.getMyLentLoans().subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.data) {
            this.lentLoans.set(res.data);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isLoading.set(false);
          this.feedback.set(err.error?.message || 'Error al cargar las solicitudes de tus herramientas');
          this.feedbackType.set('error');
          this.cdr.markForCheck();
        }
      });
    }
  }

  switchTab(tab: 'borrowed' | 'lent'): void {
    this.activeTab.set(tab);
    this.loadData();
  }

  onRespond(loanId: string, accion: 'aprobar' | 'rechazar'): void {
    this.loanService.respondToLoan(loanId, accion).subscribe({
      next: (res) => {
        if (res.success) {
          this.feedback.set(`Préstamo ${accion === 'aprobar' ? 'aprobado' : 'rechazado'} con éxito`);
          this.feedbackType.set('success');
          this.loadData();
        }
      },
      error: (err) => {
        this.feedback.set(err.error?.message || 'Error al responder a la solicitud');
        this.feedbackType.set('error');
        this.cdr.markForCheck();
      }
    });
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
}
