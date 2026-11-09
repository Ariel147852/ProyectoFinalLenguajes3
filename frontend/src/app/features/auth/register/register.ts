import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['../login/login.css'] // Reutiliza estilos base de auth
})
export class RegisterComponent {
  nombre = '';
  email = '';
  password = '';
  telefono = '';
  direccionZona = '';
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.nombre || !this.email || !this.password) {
      this.errorMessage = 'Nombre, correo y contraseña son obligatorios';
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
        direccionZona: this.direccionZona || 'Comunidad Central'
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

