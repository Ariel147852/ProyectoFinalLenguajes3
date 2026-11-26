import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { DatosFinancieros } from '../../core/models/user.model';

@Component({
  selector: 'app-financial-data',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './financial-data.html',
  styleUrls: ['./financial-data.css']
})
export class FinancialDataComponent implements OnInit {
  banco = 'Banco Pichincha';
  tipoCuenta = 'Cuenta de Ahorros';
  numeroCuenta = '';
  titular = '';
  telefonoDeUna = '';
  qrDeUnaUrl = '';
  qrFileName = '';

  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  feedbackMessage = signal<string>('');
  feedbackType = signal<'success' | 'error'>('success');

  bancosDisponibles = [
    'Banco Pichincha',
    'Banco Guayaquil',
    'Produbanco',
    'Banco del Pacífico',
    'Banco Bolivariano',
    'Cooperativa JEP',
    'Cooperativa Policía Nacional',
    'DeUna (Banco Pichincha)',
    'Otro Banco o Cooperativa'
  ];

  constructor(public authService: AuthService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    const user = this.authService.currentUser();
    if (user) {
      this.titular = user.nombre;
      this.telefonoDeUna = user.telefono || '';
    }

    this.authService.getDatosFinancieros().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          const d = res.data;
          this.banco = d.banco || 'Banco Pichincha';
          this.tipoCuenta = d.tipoCuenta || 'Cuenta de Ahorros';
          this.numeroCuenta = d.numeroCuenta || '';
          this.titular = d.titular || (user ? user.nombre : '');
          this.telefonoDeUna = d.telefonoDeUna || (user?.telefono || '');
          this.qrDeUnaUrl = d.qrDeUnaUrl || '';
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onQrSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      this.feedbackMessage.set('La imagen del QR no debe superar los 8 MB');
      this.feedbackType.set('error');
      target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.feedbackMessage.set('Por favor selecciona una imagen válida (PNG o JPG)');
      this.feedbackType.set('error');
      target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.qrDeUnaUrl = reader.result as string;
      this.qrFileName = file.name;
      this.feedbackMessage.set('');
    };
    reader.readAsDataURL(file);
  }

  // Bloquear caracteres no numéricos
  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode <= 31) {
      return true;
    }
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onNumeroCuentaInput(): void {
    // Solo números (máximo 20)
    this.numeroCuenta = this.numeroCuenta.replace(/\D/g, '').slice(0, 20);
  }

  onTelefonoDeUnaInput(): void {
    // Solo números (máximo 10)
    this.telefonoDeUna = this.telefonoDeUna.replace(/\D/g, '').slice(0, 10);
  }

  onTitularInput(): void {
    // Solo letras y espacios
    this.titular = this.titular.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
  }

  removeQr(): void {
    this.qrDeUnaUrl = '';
    this.qrFileName = '';
  }

  onSubmit(): void {
    this.feedbackMessage.set('');

    // Validación de Titular: solo letras
    if (!this.titular.trim() || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{3,60}$/.test(this.titular.trim())) {
      this.feedbackMessage.set('El nombre del titular debe contener únicamente letras (sin números ni símbolos)');
      this.feedbackType.set('error');
      return;
    }

    // Validación de Número de Cuenta: solo números
    this.onNumeroCuentaInput();
    if (this.numeroCuenta && (this.numeroCuenta.length < 6 || this.numeroCuenta.length > 20)) {
      this.feedbackMessage.set('El número de cuenta bancaria debe contener únicamente números (entre 6 y 20 dígitos)');
      this.feedbackType.set('error');
      return;
    }

    // Validación de Teléfono DeUna: exactamente 10 números
    this.onTelefonoDeUnaInput();
    if (this.telefonoDeUna && this.telefonoDeUna.length !== 10) {
      this.feedbackMessage.set(`El teléfono celular DeUna debe tener exactamente 10 dígitos numéricos (se ingresaron ${this.telefonoDeUna.length})`);
      this.feedbackType.set('error');
      return;
    }

    this.isSaving.set(true);

    const payload: DatosFinancieros = {
      banco: this.banco,
      tipoCuenta: this.tipoCuenta,
      numeroCuenta: this.numeroCuenta.trim(),
      titular: this.titular.trim(),
      telefonoDeUna: this.telefonoDeUna.trim(),
      qrDeUnaUrl: this.qrDeUnaUrl
    };

    this.authService.updateDatosFinancieros(payload).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.feedbackMessage.set('¡Datos financieros y Código QR DeUna guardados exitosamente!');
        this.feedbackType.set('success');
      },
      error: (err) => {
        this.isSaving.set(false);
        this.feedbackMessage.set(err.error?.message || 'Error al guardar los datos financieros');
        this.feedbackType.set('error');
      }
    });
  }
}

