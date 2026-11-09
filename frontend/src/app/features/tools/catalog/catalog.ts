import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ToolService } from '../../../core/services/tool.service';
import { Tool } from '../../../core/models/tool.model';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './catalog.html',
  styleUrls: ['./catalog.css']
})
export class CatalogComponent implements OnInit {
  tools = signal<Tool[]>([]);
  isLoading = signal<boolean>(true);
  selectedCategory = signal<string>('todas');
  searchQuery = signal<string>('');
  errorMessage = signal<string>('');

  categories = [
    { id: 'todas', label: 'Todas las categorías' },
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
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['categoria']) {
        this.selectedCategory.set(params['categoria']);
      }
      this.loadTools();
    });
  }

  loadTools(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.toolService.getTools(this.selectedCategory(), this.searchQuery()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success && res.data) {
          this.tools.set(res.data);
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Error al cargar el catálogo de herramientas');
        this.cdr.markForCheck();
      }
    });
  }

  onFilterChange(category: string): void {
    this.selectedCategory.set(category);
    this.loadTools();
  }

  onSearch(): void {
    this.loadTools();
  }

  updateSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }
}
