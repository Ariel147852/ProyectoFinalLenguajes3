import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PaymentService } from '../../core/services/payment.service';
import { AuthService } from '../../core/services/auth.service';
import { BankDetails, PaymentReceipt, SubscriptionStatus } from '../../core/models/payment.model';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './subscription.html',
  styleUrls: ['./subscription.css']
})
export class SubscriptionComponent implements OnInit {
  subStatus = signal<SubscriptionStatus | null>(null);
  bankDetails = signal<BankDetails | null>(null);
  myPayments = signal<PaymentReceipt[]>([]);
  isLoading = signal<boolean>(true);
  isSubmitting = signal<boolean>(false);

  feedbackMessage = signal<string>('');
  feedbackType = signal<'success' | 'error'>('success');
  copiedNotice = signal<boolean>(false);

  // Formulario de Pago
  tipoPago: 'suscripcion_mensual' | 'herramientas_extras' = 'suscripcion_mensual';
  cantidadHerramientasExtras = 1;
  bancoOrigen = 'Banco Pichincha';
  numeroComprobante = '';
  comprobanteUrl = '';
  comprobanteFileName = '';
  notas = '';

  // Modal para ver comprobante en pantalla completa
  activeReceiptModal = signal<PaymentReceipt | null>(null);

  bancosDisponibles = [
    'Banco Pichincha',
    'Banco Guayaquil',
    'Produbanco',
    'Banco del Pacífico',
    'Banco Bolivariano',
    'Cooperativa JEP',
    'Cooperativa Policía Nacional',
    'DeUna / Red Facilito',
    'Otro Banco o Cooperativa'
  ];

  constructor(
    public authService: AuthService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.isLoading.set(true);

    this.paymentService.getDatosBancarios().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.bankDetails.set(res.data);
        }
      }
    });

    this.paymentService.getMiEstadoSuscripcion().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.subStatus.set(res.data);
        }
      }
    });

    this.paymentService.getMisPagos().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.myPayments.set(res.data);
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  get totalPagar(): number {
    if (this.tipoPago === 'suscripcion_mensual') {
      return 5.0;
    }
    return Number((Math.max(1, this.cantidadHerramientasExtras) * 0.5).toFixed(2));
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      this.feedbackMessage.set('El comprobante no debe superar los 8 MB');
      this.feedbackType.set('error');
      target.value = '';
      return;
    }

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      this.feedbackMessage.set('Por favor sube una imagen (PNG, JPG, WEBP) del comprobante de transferencia');
      this.feedbackType.set('error');
      target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.comprobanteUrl = reader.result as string;
      this.comprobanteFileName = file.name;
    };
    reader.readAsDataURL(file);
  }

  removeSelectedFile(): void {
    this.comprobanteUrl = '';
    this.comprobanteFileName = '';
  }

  onSubmitPayment(): void {
    if (!this.bancoOrigen || !this.numeroComprobante.trim() || !this.comprobanteUrl) {
      this.feedbackMessage.set('Por favor completa todos los datos y adjunta la imagen del comprobante.');
      this.feedbackType.set('error');
      return;
    }

    this.isSubmitting.set(true);
    this.feedbackMessage.set('');

    const payload = {
      tipoPago: this.tipoPago,
      cantidadHerramientasExtras: this.tipoPago === 'herramientas_extras' ? this.cantidadHerramientasExtras : 0,
      bancoOrigen: this.bancoOrigen,
      numeroComprobante: this.numeroComprobante.trim(),
      comprobanteUrl: this.comprobanteUrl,
      notas: this.notas.trim()
    };

    this.paymentService.enviarComprobante(payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.feedbackMessage.set(
          '¡Comprobante enviado exitosamente! El administrador lo revisará a la brevedad para activar tu suscripción o cupos extras.'
        );
        this.feedbackType.set('success');

        // Limpiar formulario
        this.numeroComprobante = '';
        this.comprobanteUrl = '';
        this.comprobanteFileName = '';
        this.notas = '';

        // Recargar datos
        this.loadAllData();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.feedbackMessage.set(err.error?.message || 'Error al enviar el comprobante de pago');
        this.feedbackType.set('error');
      }
    });
  }

  copyBankInfo(): void {
    const details = this.bankDetails();
    if (!details) return;

    const textToCopy = `Banco: ${details.banco}\nTipo: ${details.tipoCuenta}\nNúmero: ${details.numeroCuenta}\nTitular: ${details.titular}\nRUC: ${details.identificacion}\nCorreo: ${details.emailNotificacion}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.copiedNotice.set(true);
      setTimeout(() => this.copiedNotice.set(false), 3000);
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
    if (this.activeReceiptModal()) {
      this.closeReceiptModal();
    }
  }
}
