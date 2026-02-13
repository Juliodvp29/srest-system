import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ColumnConfig } from '@shared/components/dynamic-table/dynamic-table';

export interface ExportDialogOptions {
  scope: 'full' | 'current' | 'range';
  selectedColumns: string[];
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'ISO';
  includeFilterSummary: boolean;
  filename: string;
  rangeStart?: number;
  rangeEnd?: number;
}

@Component({
  selector: 'app-export-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  templateUrl: './export-dialog.html',
  styleUrl: './export-dialog.css',
})
export class ExportDialog {
  // Inputs
  data = input.required<any[]>();
  currentPageData = input.required<any[]>();
  columns = input.required<ColumnConfig[]>();
  tableName = input<string>('Table');
  hasActiveFilters = input<boolean>(false);

  // Outputs
  onExport = output<ExportDialogOptions>();
  onCancel = output<void>();

  // State
  scope = signal<'full' | 'current' | 'range'>('full');
  selectedColumns = signal<Set<string>>(new Set());
  dateFormat = signal<'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'ISO'>('DD/MM/YYYY');
  includeFilterSummary = signal<boolean>(false);
  customFilename = signal<string>('');
  rangeStart = signal<number>(1);
  rangeEnd = signal<number>(100);
  columnSearchTerm = signal<string>('');

  // Computed
  filteredColumns = computed(() => {
    const search = this.columnSearchTerm().toLowerCase();
    if (!search) return this.columns();

    return this.columns().filter((col) => col.label.toLowerCase().includes(search));
  });

  allColumnsSelected = computed(() => {
    return this.selectedColumns().size === this.columns().length;
  });

  exportCount = computed(() => {
    switch (this.scope()) {
      case 'current':
        return this.currentPageData().length;
      case 'range':
        const start = Math.max(0, this.rangeStart() - 1);
        const end = Math.min(this.data().length, this.rangeEnd());
        return Math.max(0, end - start);
      default:
        return this.data().length;
    }
  });

  selectedColumnCount = computed(() => {
    return this.selectedColumns().size;
  });

  canExport = computed(() => {
    return this.selectedColumns().size > 0 && this.exportCount() > 0;
  });

  constructor() {
    // Initialize with all columns selected using effect
    effect(() => {
      const cols = this.columns();
      if (cols.length > 0 && this.selectedColumns().size === 0) {
        this.selectedColumns.set(new Set(cols.map((col) => col.key)));
      }
    });
  }

  toggleColumn(key: string): void {
    this.selectedColumns.update((selected) => {
      const newSet = new Set(selected);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }

  toggleAllColumns(): void {
    if (this.allColumnsSelected()) {
      this.selectedColumns.set(new Set());
    } else {
      this.selectedColumns.set(new Set(this.columns().map((col) => col.key)));
    }
  }

  handleExport(): void {
    if (!this.canExport()) return;

    const options: ExportDialogOptions = {
      scope: this.scope(),
      selectedColumns: Array.from(this.selectedColumns()),
      dateFormat: this.dateFormat(),
      includeFilterSummary: this.includeFilterSummary(),
      filename: this.customFilename() || this.tableName(),
    };

    if (this.scope() === 'range') {
      options.rangeStart = this.rangeStart();
      options.rangeEnd = this.rangeEnd();
    }

    this.onExport.emit(options);
  }

  handleCancel(): void {
    this.onCancel.emit();
  }

  onColumnSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.columnSearchTerm.set(target.value);
  }

  onFilenameChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.customFilename.set(target.value);
  }

  onRangeStartChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.rangeStart.set(parseInt(target.value) || 1);
  }

  onRangeEndChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.rangeEnd.set(parseInt(target.value) || 100);
  }
}
