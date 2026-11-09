import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { Tool } from '../models/tool.model';
import { ToolAvailabilityResponse } from '../models/loan.model';

@Injectable({
  providedIn: 'root'
})
export class ToolService {
  private readonly API_URL = 'http://localhost:5000/api/v1/tools';

  constructor(private http: HttpClient) {}

  getTools(categoria?: string, busqueda?: string, page: number = 1): Observable<ApiResponse<Tool[]>> {
    let params = new HttpParams().set('page', page.toString());
    if (categoria && categoria !== 'todas') {
      params = params.set('categoria', categoria);
    }
    if (busqueda && busqueda.trim()) {
      params = params.set('busqueda', busqueda.trim());
    }
    return this.http.get<ApiResponse<Tool[]>>(this.API_URL, { params });
  }

  getNearbyTools(lat: number, lng: number, maxDistanceKm: number = 10, categoria?: string): Observable<ApiResponse<Tool[]>> {
    let params = new HttpParams()
      .set('lat', lat.toString())
      .set('lng', lng.toString())
      .set('maxDistanceKm', maxDistanceKm.toString());

    if (categoria && categoria !== 'todas') {
      params = params.set('categoria', categoria);
    }

    return this.http.get<ApiResponse<Tool[]>>(`${this.API_URL}/nearby`, { params });
  }

  getToolById(id: string): Observable<ApiResponse<Tool>> {
    return this.http.get<ApiResponse<Tool>>(`${this.API_URL}/${id}`);
  }

  getToolAvailability(id: string): Observable<ApiResponse<ToolAvailabilityResponse>> {
    return this.http.get<ApiResponse<ToolAvailabilityResponse>>(`${this.API_URL}/${id}/availability`);
  }

  createTool(toolData: {
    nombre: string;
    descripcion: string;
    categoria: string;
    estadoFisico: string;
    imagenes: string[];
    latitud: number;
    longitud: number;
    direccionZona: string;
    maxDiasPrestamo: number;
  }): Observable<ApiResponse<Tool>> {
    return this.http.post<ApiResponse<Tool>>(this.API_URL, toolData);
  }

  updateTool(id: string, toolData: Partial<Tool>): Observable<ApiResponse<Tool>> {
    return this.http.put<ApiResponse<Tool>>(`${this.API_URL}/${id}`, toolData);
  }

  deleteTool(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
  }
}

