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

  onCedulaInput(): void {
    const clean = this.cedula.trim();
    if (!clean) {
      this.cedulaValida = null;
      this.cedulaMensaje = '';
      return;
    }

    if (clean.length < 10) {
      this.cedulaValida = false;
      this.cedulaMensaje = `Faltan ${10 - clean.length} dígitos`;
      return;
    }

    const res = validarCedulaEcuatoriana(clean);
    this.cedulaValida = res.valida;
    this.cedulaMensaje = res.valida ? 'Cédula ecuatoriana válida' : (res.mensaje || 'Cédula inválida');
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
    if (!this.nombre || !this.email || !this.password || !this.telefono || !this.cedula) {
      this.errorMessage = 'Por favor completa todos los datos personales obligatorios';
      return;
    }

    this.onCedulaInput();
    if (!this.cedulaValida) {
      this.errorMessage = 'La cédula de identidad no es válida según el registro civil ecuatoriano';
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
        nombre: this.nombre,
        email: this.email,
        password: this.password,
        telefono: this.telefono,
        direccionZona: this.direccionZona || 'Comunidad Central',
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
