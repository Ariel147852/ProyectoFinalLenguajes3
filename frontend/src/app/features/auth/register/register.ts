import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { validarCedulaEcuatoriana } from '../../../core/utils/cedula.validator';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  nombre = '';
  email = '';
  password = '';
  telefono = '';
  direccionZona = '';
  cedula = '';

  cedulaValida: boolean | null = null;
  cedulaMensaje = '';

  cedulaFrontalUrl = '';
  cedulaPosteriorUrl = '';
  frontalFileName = '';
  posteriorFileName = '';

  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Bloquear tipeo de caracteres no numéricos en inputs exclusivos de números
  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    // Permitir teclas especiales (backspace=8, tab=9, enter=13)
    if (charCode <= 31) {
      return true;
    }
    // Solo permitir caracteres entre '0' y '9' (códigos ASCII 48 a 57)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
      return false;
    }
    return true;
  }

  onNombreInput(): void {
    // Solo permitir letras y espacios en el nombre
    this.nombre = this.nombre.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
  }

  onCedulaInput(): void {
    // Sanitizar a únicamente dígitos numéricos y máximo 10
    this.cedula = this.cedula.replace(/\D/g, '').slice(0, 10);
    const clean = this.cedula.trim();

    if (!clean) {
      this.cedulaValida = null;
      this.cedulaMensaje = '';
      return;
    }

    if (clean.length < 10) {
      this.cedulaValida = false;
      this.cedulaMensaje = `Faltan ${10 - clean.length} números (debe tener 10 dígitos)`;
      return;
    }

    const res = validarCedulaEcuatoriana(clean);
    this.cedulaValida = res.valida;
    this.cedulaMensaje = res.valida ? '✓ Cédula ecuatoriana válida' : (res.mensaje || 'Cédula inválida');
  }

  onTelefonoInput(): void {
    // Sanitizar a únicamente números y máximo 10 dígitos
    this.telefono = this.telefono.replace(/\D/g, '').slice(0, 10);
  }

  onFileSelected(event: Event, lado: 'frontal' | 'posterior'): void {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      this.errorMessage = 'La foto no debe superar los 8 MB';
      target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Por favor selecciona un archivo de imagen (PNG, JPG, WEBP)';
      target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (lado === 'frontal') {
        this.cedulaFrontalUrl = dataUrl;
        this.frontalFileName = file.name;
      } else {
        this.cedulaPosteriorUrl = dataUrl;
        this.posteriorFileName = file.name;
      }
      this.errorMessage = '';
    };
    reader.readAsDataURL(file);
  }

  removeFile(lado: 'frontal' | 'posterior'): void {
    if (lado === 'frontal') {
      this.cedulaFrontalUrl = '';
      this.frontalFileName = '';
    } else {
      this.cedulaPosteriorUrl = '';
      this.posteriorFileName = '';
    }
  }

  onSubmit(): void {
    if (!this.nombre.trim() || !this.email.trim() || !this.password || !this.telefono.trim() || !this.cedula.trim()) {
      this.errorMessage = 'Por favor completa todos los datos obligatorios';
      return;
    }

    // Validación de Nombre
    if (this.nombre.trim().length < 3) {
      this.errorMessage = 'El nombre completo debe tener al menos 3 caracteres y solo contener letras';
      return;
    }

    // Validación de Email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(this.email.trim())) {
      this.errorMessage = 'Por favor ingresa un correo electrónico válido';
      return;
    }

    // Validación de Contraseña
    if (this.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    // Validación estricta de Cédula (10 números, Módulo 10)
    this.onCedulaInput();
    if (!this.cedulaValida) {
      this.errorMessage = this.cedulaMensaje || 'La cédula de identidad no es válida según el registro civil ecuatoriano';
      return;
    }

    // Validación de Teléfono (exactamente 10 números, sin letras)
    this.onTelefonoInput();
    if (this.telefono.length !== 10) {
      this.errorMessage = `El teléfono celular debe contener exactamente 10 dígitos numéricos (se ingresaron ${this.telefono.length})`;
      return;
    }

    if (!this.cedulaFrontalUrl || !this.cedulaPosteriorUrl) {
      this.errorMessage = 'Es obligatorio subir la fotografía de la cédula de ambos lados (frontal y posterior)';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService
      .register({
        nombre: this.nombre.trim(),
        email: this.email.trim().toLowerCase(),
        password: this.password,
        telefono: this.telefono.trim(),
        direccionZona: this.direccionZona.trim() || 'Comunidad Central',
        cedula: this.cedula.trim(),
        cedulaFrontalUrl: this.cedulaFrontalUrl,
        cedulaPosteriorUrl: this.cedulaPosteriorUrl
      })
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.success) {
            this.router.navigate(['/']);
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Error al registrar la cuenta';
        }
      });
  }
}
