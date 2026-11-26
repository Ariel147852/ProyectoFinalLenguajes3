import { Component, OnInit, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import * as L from 'leaflet';
import { ToolService } from '../../../core/services/tool.service';
import { PaymentService } from '../../../core/services/payment.service';
import { SubscriptionStatus } from '../../../core/models/payment.model';

@Component({
  selector: 'app-tool-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './tool-form.html',
  styleUrls: ['./tool-form.css']
})
export class ToolFormComponent implements OnInit, AfterViewInit, OnDestroy {
  nombre = '';
  descripcion = '';
  categoria = 'electricas';
  estadoFisico = 'bueno';
  imagenUrl = '';
  direccionZona = '';
  maxDiasPrestamo = 7;

  // Coordenadas iniciales (Quito)
  latitud = -0.1807;
  longitud = -78.4678;

  isLoading = false;
  errorMessage = '';
  subStatus = signal<SubscriptionStatus | null>(null);

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  categories = [
    { id: 'electricas', label: '⚡ Eléctricas' },
    { id: 'manuales', label: '🔨 Manuales' },
    { id: 'jardineria', label: '🌱 Jardinería' },
    { id: 'construccion', label: '🧱 Construcción' },
    { id: 'fontaneria', label: '🔧 Fontanería' },
    { id: 'pintura', label: '🎨 Pintura' },
    { id: 'otros', label: '📦 Otros' }
  ];

  constructor(
    private toolService: ToolService,
    private paymentService: PaymentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkSubscription();
  }

  checkSubscription(): void {
    this.paymentService.getMiEstadoSuscripcion().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.subStatus.set(res.data);
        }
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private createMarkerIcon(): L.DivIcon {
    return L.divIcon({
      className: 'custom-tool-pin-wrapper',
      html: `
        <div class="tool-map-pin">
          <div class="tool-map-pin-inner">📍</div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38]
    });
  }

  private initMap(): void {
    this.map = L.map('picker-map').setView([this.latitud, this.longitud], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    const pinIcon = this.createMarkerIcon();
    this.marker = L.marker([this.latitud, this.longitud], { draggable: true, icon: pinIcon }).addTo(this.map);

    this.marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      this.latitud = Number(pos.lat.toFixed(5));
      this.longitud = Number(pos.lng.toFixed(5));
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.latitud = Number(e.latlng.lat.toFixed(5));
      this.longitud = Number(e.latlng.lng.toFixed(5));
      if (this.marker) {
        this.marker.setLatLng([this.latitud, this.longitud]);
      }
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.latitud = Number(pos.coords.latitude.toFixed(5));
          this.longitud = Number(pos.coords.longitude.toFixed(5));
          if (this.map && this.marker) {
            this.map.setView([this.latitud, this.longitud], 14);
            this.marker.setLatLng([this.latitud, this.longitud]);
          }
        },
        () => {}
      );
    }
  }

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

  onSubmit(): void {
    if (!this.nombre.trim() || !this.descripcion.trim() || !this.direccionZona.trim()) {
      this.errorMessage = 'Por favor complete todos los campos obligatorios';
      return;
    }

    const dias = Number(this.maxDiasPrestamo);
    if (isNaN(dias) || dias < 1 || dias > 30 || !Number.isInteger(dias)) {
      this.errorMessage = 'El máximo de días de préstamo debe ser un número entero entre 1 y 30';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
      nombre: this.nombre,
      descripcion: this.descripcion,
      categoria: this.categoria,
      estadoFisico: this.estadoFisico,
      imagenes: this.imagenUrl ? [this.imagenUrl] : [],
      latitud: this.latitud,
      longitud: this.longitud,
      direccionZona: this.direccionZona,
      maxDiasPrestamo: Number(this.maxDiasPrestamo)
    };

    this.toolService.createTool(payload).subscribe({
      next: (res) => {
        this.isLoading = false;
        if (res.success) {
          this.router.navigate(['/tools', res.data._id]);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Error al publicar la herramienta';
      }
    });
  }
}
