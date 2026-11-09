import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { BankDetails, PaymentReceipt, SubscriptionStatus } from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private readonly apiUrl = 'http://localhost:5000/api/v1/payments';

  constructor(private http: HttpClient) {}

  getDatosBancarios(): Observable<ApiResponse<BankDetails>> {
    return this.http.get<ApiResponse<BankDetails>>(`${this.apiUrl}/datos-bancarios`);
  }

  getMiEstadoSuscripcion(): Observable<ApiResponse<SubscriptionStatus>> {
    return this.http.get<ApiResponse<SubscriptionStatus>>(`${this.apiUrl}/mi-suscripcion`);
  }

  getMisPagos(): Observable<ApiResponse<PaymentReceipt[]>> {
    return this.http.get<ApiResponse<PaymentReceipt[]>>(`${this.apiUrl}/mis-pagos`);
  }

  enviarComprobante(payload: {
    tipoPago: 'suscripcion_mensual' | 'herramientas_extras';
    cantidadHerramientasExtras?: number;
    bancoOrigen: string;
    numeroComprobante: string;
    comprobanteUrl: string;
    notas?: string;
  }): Observable<ApiResponse<PaymentReceipt>> {
    return this.http.post<ApiResponse<PaymentReceipt>>(`${this.apiUrl}/comprobante`, payload);
  }

  // Métodos de Administración
  getTodosComprobantes(estado?: string): Observable<ApiResponse<PaymentReceipt[]>> {
    let params = new HttpParams();
    if (estado && estado !== 'todos') {
      params = params.set('estado', estado);
    }
    return this.http.get<ApiResponse<PaymentReceipt[]>>(`${this.apiUrl}/admin/comprobantes`, { params });
  }

  verificarComprobante(
    id: string,
    accion: 'aprobar' | 'rechazar',
    motivoRechazo?: string
  ): Observable<ApiResponse<PaymentReceipt>> {
    return this.http.put<ApiResponse<PaymentReceipt>>(`${this.apiUrl}/admin/comprobantes/${id}/verificar`, {
      accion,
      motivoRechazo
    });
  }
}

