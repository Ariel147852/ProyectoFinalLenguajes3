import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { Loan } from '../models/loan.model';

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private readonly API_URL = 'http://localhost:5000/api/v1/loans';

  constructor(private http: HttpClient) {}

  requestLoan(payload: {
    herramientaId: string;
    fechaInicio: string;
    fechaFin: string;
    notasSolicitante?: string;
  }): Observable<ApiResponse<Loan>> {
    return this.http.post<ApiResponse<Loan>>(`${this.API_URL}/request`, payload);
  }

  respondToLoan(loanId: string, accion: 'aprobar' | 'rechazar', notasPropietario?: string): Observable<ApiResponse<Loan>> {
    return this.http.patch<ApiResponse<Loan>>(`${this.API_URL}/${loanId}/respond`, { accion, notasPropietario });
  }

  deliverLoan(loanId: string): Observable<ApiResponse<Loan>> {
    return this.http.patch<ApiResponse<Loan>>(`${this.API_URL}/${loanId}/deliver`, {});
  }

  returnLoan(loanId: string): Observable<ApiResponse<Loan>> {
    return this.http.patch<ApiResponse<Loan>>(`${this.API_URL}/${loanId}/return`, {});
  }

  getMyBorrowedLoans(): Observable<ApiResponse<Loan[]>> {
    return this.http.get<ApiResponse<Loan[]>>(`${this.API_URL}/my-borrowed`);
  }

  getMyLentLoans(): Observable<ApiResponse<Loan[]>> {
    return this.http.get<ApiResponse<Loan[]>>(`${this.API_URL}/my-lent`);
  }

  subirComprobantePago(
    loanId: string,
    payload: {
      comprobantePagoUrl: string;
      metodoPago: 'deuna' | 'transferencia';
      numeroReferenciaPago?: string;
    }
  ): Observable<ApiResponse<Loan>> {
    return this.http.post<ApiResponse<Loan>>(`${this.API_URL}/${loanId}/comprobante-pago`, payload);
  }

  validarPago(
    loanId: string,
    accion: 'validar' | 'rechazar',
    motivoRechazo?: string
  ): Observable<ApiResponse<Loan>> {
    return this.http.patch<ApiResponse<Loan>>(`${this.API_URL}/${loanId}/validar-pago`, {
      accion,
      motivoRechazo
    });
  }
}

