import { Component, AfterViewInit, OnDestroy, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import * as L from 'leaflet';
import { ToolService } from '../../../core/services/tool.service';
import { Tool } from '../../../core/models/tool.model';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './map-view.html',
  styleUrls: ['./map-view.css']
})
export class MapViewComponent implements AfterViewInit, OnDestroy {
  // Centro inicial por defecto (Quito Metropolitano)
  userLat = -0.1807;
  userLng = -78.4678;
  radiusKm = 10;
  selectedCategory = 'todas';

  tools = signal<Tool[]>([]);
  isLoading = signal<boolean>(false);
  statusMessage = signal<string>('Obteniendo tu ubicación para buscar herramientas cercanas...');

  private map: L.Map | null = null;
  private userMarker: L.Marker | null = null;
  private radiusCircle: L.Circle | null = null;
  private toolsLayerGroup = L.layerGroup();

  categories = [
    { id: 'todas', label: 'Todas' },
    { id: 'electricas', label: '⚡ Eléctricas' },
    { id: 'manuales', label: '🔨 Manuales' },
    { id: 'jardineria', label: '🌱 Jardinería' },
    { id: 'construccion', label: '🧱 Construcción' },
    { id: 'fontaneria', label: '🔧 Fontanería' },
    { id: 'pintura', label: '🎨 Pintura' }
  ];

  constructor(
    private toolService: ToolService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.initMap();
    this.detectUserLocation();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    this.map = L.map('main-map').setView([this.userLat, this.userLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors | Tool Library'
    }).addTo(this.map);

    this.toolsLayerGroup.addTo(this.map);
  }

  private detectUserLocation(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.userLat = pos.coords.latitude;
          this.userLng = pos.coords.longitude;
          this.statusMessage.set('Ubicación detectada con éxito vía GPS.');
          this.updateUserVisuals();
          this.loadNearbyTools();
          this.cdr.markForCheck();
        },
        () => {
          this.statusMessage.set('Ubicación comunitaria por defecto activada.');
          this.updateUserVisuals();
          this.loadNearbyTools();
          this.cdr.markForCheck();
        }
      );
    } else {
      this.updateUserVisuals();
      this.loadNearbyTools();
    }
  }

  updateUserVisuals(): void {
    if (!this.map) return;

    this.map.setView([this.userLat, this.userLng], 13);

    if (this.userMarker) {
      this.userMarker.setLatLng([this.userLat, this.userLng]);
    } else {
      const userIcon = L.divIcon({
        className: 'user-pin-wrapper',
        html: '<div class="user-pulse-marker"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      this.userMarker = L.marker([this.userLat, this.userLng], { icon: userIcon })
        .addTo(this.map)
        .bindPopup('<strong>Tu ubicación actual</strong>');
    }

    if (this.radiusCircle) {
      this.radiusCircle.setLatLng([this.userLat, this.userLng]);
      this.radiusCircle.setRadius(this.radiusKm * 1000);
    } else {
      this.radiusCircle = L.circle([this.userLat, this.userLng], {
        radius: this.radiusKm * 1000,
        color: '#d97706',
        fillColor: '#f59e0b',
        fillOpacity: 0.12,
        weight: 2
      }).addTo(this.map);
    }
  }

  private getCategoryIcon(cat: string): string {
    const map: Record<string, string> = {
      electricas: '⚡',
      manuales: '🔨',
      jardineria: '🌱',
      construccion: '🧱',
      fontaneria: '🔧',
      pintura: '🎨',
      otros: '📦'
    };
    return map[cat] || '🛠️';
  }

  loadNearbyTools(): void {
    this.isLoading.set(true);
    this.toolsLayerGroup.clearLayers();

    this.toolService
      .getNearbyTools(this.userLat, this.userLng, this.radiusKm, this.selectedCategory)
      .subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success && res.data) {
            this.tools.set(res.data);
            this.renderToolMarkers();
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading.set(false);
          this.cdr.markForCheck();
        }
      });
  }

  private renderToolMarkers(): void {
    if (!this.map) return;

    this.tools().forEach((tool) => {
      const [lng, lat] = tool.ubicacion.coordinates;
      const emoji = this.getCategoryIcon(tool.categoria);

      const customPin = L.divIcon({
        className: 'custom-tool-pin-wrapper',
        html: `
          <div class="tool-map-pin">
            <div class="tool-map-pin-inner">${emoji}</div>
          </div>
        `,
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38]
      });

      const marker = L.marker([lat, lng], { icon: customPin });

      const popupContent = `
        <div style="font-family: inherit; min-width: 210px; padding: 4px;">
          <span style="font-size: 11px; font-weight: 800; color: #b45309; text-transform: uppercase;">
            ${emoji} ${tool.categoria}
          </span>
          <h4 style="margin: 4px 0 6px; font-size: 14px; font-weight: 700; color: #0f172a;">${tool.nombre}</h4>
          <p style="margin: 0 0 8px; font-size: 12px; color: #64748b;">📍 ${tool.direccionZona}</p>
          <div style="border-top: 1px solid #f1f5f9; padding-top: 8px;">
            <a href="/tools/${tool._id}" style="display: block; text-align: center; padding: 6px 12px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 700;">
              Ver y Reservar
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      this.toolsLayerGroup.addLayer(marker);
    });
  }

  onFiltersApply(): void {
    if (this.radiusCircle) {
      this.radiusCircle.setRadius(this.radiusKm * 1000);
    }
    this.loadNearbyTools();
  }
}
