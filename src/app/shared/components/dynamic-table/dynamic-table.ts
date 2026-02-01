import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { XlsxExportService } from '@app/core/services/xlsx-export.service';
import { ExportDialog, ExportDialogOptions } from '../export-dialog/export-dialog';

export interface ColumnConfig {
  key: string;
  label: string;
  type?: 'text' | 'badge' | 'image' | 'date' | 'currency' | 'custom';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: any) => string;
  badgeColors?: { [key: string]: string };
}

export interface FilterConfig {
  type: 'select' | 'dateRange' | 'numberRange' | 'text';
  label: string;
  key: string;
  options?: { label: string; value: any }[];
}

export interface ActionButton {
  label: string;
  icon?: string;
  onClick: (row: any) => void;
  class?: string;
  condition?: (row: any) => boolean;
}

@Component({
  selector: 'app-dynamic-table',
  imports: [CommonModule, FormsModule, ExportDialog],
  templateUrl: './dynamic-table.html',
  styleUrl: './dynamic-table.css',
})
export class DynamicTable {
  // Services
  private exportService = inject(XlsxExportService);

  // Inputs
  data = input.required<any[]>();
  columns = input.required<ColumnConfig[]>();
  title = input<string>('Dynamic Table');
  description = input<string>('');
  searchPlaceholder = input<string>('Search...');
  filters = input<FilterConfig[]>([]);
  actions = input<ActionButton[]>([]);
  pageSize = input<number>(10);
  trackBy = input<string>('id');
  showAddButton = input<boolean>(false);
  addButtonLabel = input<string>('Add New');
  emptyMessage = input<string>('No data found');
  enableExport = input<boolean>(true);
  exportFilename = input<string>('');

  // Outputs
  onAdd = output<void>();
  onRowClick = output<any>();

  // State signals
  searchTerm = signal<string>('');
  activeFilters = signal<{ [key: string]: any }>({});
  sortConfig = signal<{ key: string; direction: 'asc' | 'desc' }>({ key: '', direction: 'asc' });
  currentPage = signal<number>(1);
  isExportDialogOpen = signal<boolean>(false);

  // Math para el template
  Math = Math;

  // Computed signals
  filteredData = computed(() => {
    let result = [...this.data()];

    // Apply search
    const search = this.searchTerm().toLowerCase().trim();
    if (search) {
      result = result.filter((row) => {
        // 1. Check all defined columns
        const inColumns = this.columns().some((col) => {
          const value = row[col.key];
          if (value === null || value === undefined) return false;
          return value.toString().toLowerCase().includes(search);
        });

        // 2. Check common name fields (even if not in columns key)
        const commonFields = ['name', 'title', 'description'];
        const inCommon = commonFields.some((field) => {
          const value = row[field];
          if (value === null || value === undefined) return false;
          return value.toString().toLowerCase().includes(search);
        });

        return inColumns || inCommon;
      });
    }

    // Apply filters
    const filters = this.activeFilters();
    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      if (value === null || value === undefined || value === '') return;

      // Apply date range filters
      if (key.endsWith('_start')) {
        const fieldKey = key.replace('_start', '');
        result = result.filter((row) => {
          const rowDate = new Date(row[fieldKey]);
          const filterDate = new Date(value);
          return rowDate >= filterDate;
        });
      } else if (key.endsWith('_end')) {
        const fieldKey = key.replace('_end', '');
        result = result.filter((row) => {
          const rowDate = new Date(row[fieldKey]);
          const filterDate = new Date(value);
          return rowDate <= filterDate;
        });
      }
      // Apply number range filters
      else if (key.endsWith('_min')) {
        const fieldKey = key.replace('_min', '');
        result = result.filter((row) => row[fieldKey] >= value);
      } else if (key.endsWith('_max')) {
        const fieldKey = key.replace('_max', '');
        result = result.filter((row) => row[fieldKey] <= value);
      }
      // Apply selection filters
      else {
        result = result.filter((row) => row[key] === value);
      }
    });

    // Apply sorting
    const sort = this.sortConfig();
    if (sort.key) {
      result.sort((a, b) => {
        const aVal = a[sort.key];
        const bVal = b[sort.key];

        if (aVal === bVal) return 0;

        const comparison = aVal > bVal ? 1 : -1;
        return sort.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredData().length / this.pageSize());
  });

  paginatedData = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredData().slice(start, end);
  });

  hasActiveFilters = computed(() => {
    return Object.keys(this.activeFilters()).some((key) => {
      const value = this.activeFilters()[key];
      return value !== null && value !== undefined && value !== '';
    });
  });

  constructor() {
    // Reset page when filters or search change
    effect(() => {
      this.searchTerm();
      this.activeFilters();
      this.currentPage.set(1);
    });
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  onFilterChange(key: string, event: Event): void {
    const target = event.target as HTMLInputElement | HTMLSelectElement;
    const value = target.value;

    this.activeFilters.update((filters) => ({
      ...filters,
      [key]: value,
    }));
  }

  clearFilters(): void {
    this.activeFilters.set({});
  }

  onSort(key: string): void {
    this.sortConfig.update((current) => {
      if (current.key === key) {
        return {
          key,
          direction: current.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'asc' };
    });
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update((p) => p - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update((p) => p + 1);
    }
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  getPageNumbers(): (number | string)[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: (number | string)[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (current > 3) {
        pages.push('...');
      }

      const start = Math.max(2, current - 1);
      const end = Math.min(total - 1, current + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 2) {
        pages.push('...');
      }

      pages.push(total);
    }

    return pages;
  }

  getBadgeClass(column: ColumnConfig, value: string): string {
    const baseClass = 'px-3 py-1 rounded-full text-xs font-medium inline-block';
    const colors = column.badgeColors || {
      Active: 'bg-green-100 text-green-800',
      Inactive: 'bg-gray-100 text-gray-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Completed: 'bg-blue-100 text-blue-800',
    };

    return `${baseClass} ${colors[value] || 'bg-gray-100 text-gray-800'}`;
  }

  getInitials(row: any): string {
    const name = row.name || row.title || '';
    return name
      .split(' ')
      .map((word: string) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  formatDate(date: any): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(amount: any): string {
    if (!amount && amount !== 0) return '';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
    }).format(amount);
  }

  getVisibleActions(row: any): ActionButton[] {
    return this.actions().filter((action) => {
      if (action.condition) {
        return action.condition(row);
      }
      return true;
    });
  }

  openExportDialog(): void {
    this.isExportDialogOpen.set(true);
  }

  onExport(options: ExportDialogOptions): void {
    // Determine data to export based on scope
    let dataToExport: any[];

    switch (options.scope) {
      case 'current':
        dataToExport = this.paginatedData();
        break;
      case 'range':
        const start = Math.max(0, (options.rangeStart || 1) - 1);
        const end = Math.min(this.filteredData().length, options.rangeEnd || 100);
        dataToExport = this.filteredData().slice(start, end);
        break;
      default:
        dataToExport = this.filteredData();
    }

    this.exportService.exportToXlsx({
      data: dataToExport,
      columns: this.columns(),
      selectedColumns: options.selectedColumns,
      filename: options.filename || this.exportFilename() || this.title(),
      dateFormat: options.dateFormat,
      includeFilterSummary: options.includeFilterSummary,
      filterInfo: {
        searchTerm: this.searchTerm(),
        activeFilters: this.activeFilters(),
        sortConfig: this.sortConfig(),
      },
    });

    this.isExportDialogOpen.set(false);
  }
}
