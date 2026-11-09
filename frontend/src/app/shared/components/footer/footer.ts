import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterModule],
  template: `
    <footer class="footer-container">
      <div class="footer-content">
        <div class="footer-grid">
          <div class="footer-col brand-col">
            <div class="footer-brand">
              <span class="footer-logo">⚡</span>
              <h4>Tool<strong>Library</strong></h4>
            </div>
            <p class="brand-desc">
              Plataforma comunitaria de préstamo de herramientas de uso ocasional.
              Fomentamos la economía circular, la reducción de residuos y la cooperación barrial.
            </p>
            <span class="academic-badge">Asignatura: Lenguajes de Programación III</span>
          </div>

          <div class="footer-col">
            <h5>Navegación</h5>
            <ul class="footer-links">
              <li><a routerLink="/">Inicio</a></li>
              <li><a routerLink="/catalog">Catálogo de Herramientas</a></li>
              <li><a routerLink="/map">Mapa Interactivo</a></li>
              <li><a routerLink="/loans">Gestión de Préstamos</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h5>Arquitectura Técnica</h5>
            <ul class="tech-tags">
              <li>Angular Standalone</li>
              <li>Node.js + Express</li>
              <li>MongoDB 2dsphere</li>
              <li>Leaflet + OpenStreetMap</li>
              <li>JWT Bearer & Bcrypt</li>
              <li>Signals Reactivos</li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© 2026 Tool Library. Desarrollado con arquitectura MVC limpia para Lenguajes de Programación III.</p>
          <span class="green-initiative">🌱 Iniciativa de Economía Circular y Residuos Cero</span>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer-container {
      background-color: #0f172a;
      color: #94a3b8;
      padding: 3.5rem 1.5rem 1.5rem;
      margin-top: 5rem;
      border-top: 1px solid #1e293b;
    }
    .footer-content {
      max-width: 1240px;
      margin: 0 auto;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1.5fr;
      gap: 3rem;
      margin-bottom: 2.5rem;
    }
    @media (max-width: 860px) {
      .footer-grid {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
    }
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.75rem;
    }
    .footer-logo {
      font-size: 1.5rem;
    }
    .footer-brand h4 {
      color: #ffffff;
      font-size: 1.35rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .footer-brand strong {
      color: #f59e0b;
    }
    .brand-desc {
      font-size: 0.92rem;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 1rem;
      max-width: 480px;
    }
    .academic-badge {
      display: inline-block;
      background: #1e293b;
      color: #cbd5e1;
      padding: 0.3rem 0.7rem;
      border-radius: 9999px;
      font-size: 0.78rem;
      font-weight: 600;
      border: 1px solid #334155;
    }
    .footer-col h5 {
      color: #f8fafc;
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    .footer-links {
      list-style: none;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
    }
    .footer-links a {
      color: #94a3b8;
      text-decoration: none;
      font-size: 0.9rem;
      transition: color 0.15s ease;
    }
    .footer-links a:hover {
      color: #f59e0b;
    }
    .tech-tags {
      list-style: none;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .tech-tags li {
      background: #1e293b;
      color: #94a3b8;
      font-size: 0.78rem;
      font-weight: 600;
      padding: 0.25rem 0.6rem;
      border-radius: 0.35rem;
      border: 1px solid #334155;
    }
    .footer-bottom {
      border-top: 1px solid #1e293b;
      padding-top: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.82rem;
      color: #64748b;
    }
    .green-initiative {
      color: #10b981;
      font-weight: 600;
    }
  `]
})
export class FooterComponent {}
