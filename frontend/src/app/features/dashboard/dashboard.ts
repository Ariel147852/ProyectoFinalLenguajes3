import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

interface LoanSummary {
  _id: string;
  herramienta?: { nombre: string; categoria: string };
  solicitante?: { nombre: string };
  propietario?: { nombre: string };
  estado: string;
  fechaInicio: string;
  fechaDevolucion?: string;
}

interface ToolSummary {
  _id: string;
  nombre: string;
  categoria: string;
  disponible: boolean;
  imagenUrl?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  loans = signal<LoanSummary[]>([]);
  myTools = signal<ToolSummary[]>([]);
  isLoading = signal(true);

  get user() { return this.authService.currentUser(); }

  get activeLoans() {
    return this.loans().filter(l => l.estado === 'activo' || l.estado === 'aprobado');
  }
  get pendingLoans() {
    return this.loans().filter(l => l.estado === 'pendiente');
  }
  get completedLoans() {
    return this.loans().filter(l => l.estado === 'devuelto');
  }
  get availableTools() {
    return this.myTools().filter(t => t.disponible);
  }

  constructor(public authService: AuthService, private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData();
  }

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  loadData(): void {
    this.isLoading.set(true);
    const headers = this.authHeaders();

    this.http.get<any>('http://localhost:5000/api/v1/loans', { headers }).subscribe({
      next: res => {
        if (res.success && res.data) this.loans.set(res.data.slice(0, 10));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    this.http.get<any>('http://localhost:5000/api/v1/tools', { headers }).subscribe({
      next: res => {
        if (res.success && res.data) {
          const uid = this.user?.id || (this.user as any)?._id;
          const mine = res.data.filter((t: any) => {
            const pid = typeof t.propietario === 'object' ? t.propietario._id : t.propietario;
            return pid === uid;
          });
          this.myTools.set(mine.slice(0, 6));
        }
      }
    });
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      activo: 'badge-active',
      aprobado: 'badge-active',
      pendiente: 'badge-pending',
      devuelto: 'badge-done',
      rechazado: 'badge-rejected'
    };
    return map[estado] || 'badge-secondary';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      activo: '🟢 Activo',
      aprobado: '✅ Aprobado',
      pendiente: '⏳ Pendiente',
      devuelto: '✔ Devuelto',
      rechazado: '✗ Rechazado'
    };
    return map[estado] || estado;
  }
}
