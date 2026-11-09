import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  returnUrl = '/';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  quickLogin(role: 'admin' | 'carlos' | 'lucia'): void {
    if (role === 'admin') {
      this.email = 'admin@toollibrary.org';
      this.password = 'AdminPassword123!';
    } else if (role === 'carlos') {
      this.email = 'carlos@vecino.org';
      this.password = 'UserPassword123!';
    } else if (role === 'lucia') {
      this.email = 'lucia@vecina.org';
      this.password = 'UserPassword123!';
    }
    this.onSubmit();
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor complete todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.router.navigateByUrl(this.returnUrl);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Error al iniciar sesión';
      }
    });
  }
}

