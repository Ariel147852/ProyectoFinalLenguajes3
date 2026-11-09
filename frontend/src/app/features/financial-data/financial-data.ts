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

  removeQr(): void {
    this.qrDeUnaUrl = '';
    this.qrFileName = '';
  }

  onSubmit(): void {
    this.isSaving.set(true);
    this.feedbackMessage.set('');

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

