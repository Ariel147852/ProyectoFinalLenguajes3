import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ToolService } from '../../../core/services/tool.service';
import { LoanService } from '../../../core/services/loan.service';
import { AuthService } from '../../../core/services/auth.service';
import { Tool } from '../../../core/models/tool.model';
import { BlockedDateRange } from '../../../core/models/loan.model';

@Component({
  selector: 'app-tool-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tool-detail.html',
  styleUrls: ['./tool-detail.css']
})
export class ToolDetailComponent implements OnInit {
  tool = signal<Tool | null>(null);
  blockedRanges = signal<BlockedDateRange[]>([]);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);

  // Formulario de reserva
  fechaInicio = '';
  fechaFin = '';
  notasSolicitante = '';

  // Cálculos dinámicos
  calculatedDays = signal<number | null>(null);
  durationWarning = signal<string>('');

  feedbackMessage = signal<string>('');
  feedbackType = signal<'success' | 'error'>('success');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toolService: ToolService,
    private loanService: LoanService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadToolDetails(id);
      this.loadAvailability(id);
    }
  }

  loadToolDetails(id: string): void {
    this.toolService.getToolById(id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.tool.set(res.data);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  loadAvailability(id: string): void {
    this.toolService.getToolAvailability(id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.blockedRanges.set(res.data.fechasOcupadas);
        }
        this.cdr.markForCheck();
      }
    });
  }

  onDatesChanged(): void {
    if (!this.fechaInicio || !this.fechaFin) {
      this.calculatedDays.set(null);
      this.durationWarning.set('');
      return;
    }

    const start = new Date(this.fechaInicio);
    const end = new Date(this.fechaFin);

    if (end < start) {
      this.calculatedDays.set(null);
      this.durationWarning.set('La fecha de devolución no puede ser anterior a la de inicio');
      return;
    }

    const diffMs = end.getTime() - start.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
    this.calculatedDays.set(days);

    const maxAllowed = this.tool()?.maxDiasPrestamo || 30;
    if (days > maxAllowed) {
      this.durationWarning.set(`⚠️ Seleccionaste ${days} días, pero el límite de este equipo es de ${maxAllowed} días.`);
    } else {
      this.durationWarning.set('');
    }
  }

  onSubmitReservation(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    if (!this.fechaInicio || !this.fechaFin) {
      this.setFeedback('Por favor seleccione la fecha de inicio y de fin', 'error');
      return;
    }

    if (new Date(this.fechaFin) < new Date(this.fechaInicio)) {
      this.setFeedback('La fecha de fin no puede ser anterior a la de inicio', 'error');
      return;
    }

    if (this.durationWarning()) {
      this.setFeedback(this.durationWarning(), 'error');
      return;
    }

    this.isSubmitting.set(true);
    this.feedbackMessage.set('');

    this.loanService
      .requestLoan({
        herramientaId: this.tool()!._id,
        fechaInicio: this.fechaInicio,
        fechaFin: this.fechaFin,
        notasSolicitante: this.notasSolicitante
      })
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          if (res.success) {
            this.setFeedback('¡Solicitud de préstamo enviada exitosamente!', 'success');
            setTimeout(() => {
              this.router.navigate(['/loans']);
            }, 1800);
          }
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          const msg = err.error?.message || 'Error al solicitar el préstamo';
          this.setFeedback(msg, 'error');
          this.cdr.markForCheck();
        }
      });
  }

  private setFeedback(msg: string, type: 'success' | 'error'): void {
    this.feedbackMessage.set(msg);
    this.feedbackType.set(type);
  }
}
