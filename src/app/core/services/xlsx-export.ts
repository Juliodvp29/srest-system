import { Injectable } from '@angular/core';
import { ColumnConfig } from '@shared/components/dynamic-table/dynamic-table';
import * as XLSX from 'xlsx';

export interface ExportOptions {
  data: any[];
  columns: ColumnConfig[];
  selectedColumns?: string[];
  filename?: string;
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'ISO';
  includeFilterSummary?: boolean;
  filterInfo?: {
    searchTerm?: string;
    activeFilters?: { [key: string]: any };
    sortConfig?: { key: string; direction: 'asc' | 'desc' };
  };
}

@Injectable({
  providedIn: 'root',
})
export class XlsxExportService {
  /**
   * Main export method - generates and downloads XLSX file
   */
  exportToXlsx(options: ExportOptions): void {
    const {
      data,
      columns,
      selectedColumns,
      filename,
      dateFormat = 'DD/MM/YYYY',
      includeFilterSummary = false,
      filterInfo,
    } = options;

    // Filter columns based on selection
    const columnsToExport = selectedColumns
      ? columns.filter((col) => selectedColumns.includes(col.key))
      : columns;

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create main data worksheet
    const dataWorksheet = this.createWorksheet(data, columnsToExport, dateFormat);
    XLSX.utils.book_append_sheet(workbook, dataWorksheet, 'Data');

    // Create filter summary worksheet if requested
    if (includeFilterSummary && filterInfo) {
      const summaryWorksheet = this.createFilterSummarySheet(filterInfo);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Filter Summary');
    }

    // Generate filename and download
    const finalFilename = this.generateFilename(filename || 'export');
    XLSX.writeFile(workbook, finalFilename);
  }

  /**
   * Creates a worksheet from data and columns
   */
  private createWorksheet(
    data: any[],
    columns: ColumnConfig[],
    dateFormat: string,
  ): XLSX.WorkSheet {
    // Prepare headers
    const headers = columns.map((col) => col.label);

    // Prepare data rows
    const rows = data.map((row) => {
      return columns.map((col) => this.formatCellValue(row[col.key], col, dateFormat));
    });

    // Create worksheet from array of arrays
    const worksheetData = [headers, ...rows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Apply column styles and widths
    this.applyColumnStyles(worksheet, columns);

    return worksheet;
  }

  /**
   * Formats a cell value based on column type and options
   */
  private formatCellValue(value: any, column: ColumnConfig, dateFormat: string): any {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return '';
    }

    // Handle different column types
    switch (column.type) {
      case 'date':
        return this.formatDate(value, dateFormat);

      case 'currency':
        // Return as number for Excel to handle formatting
        return typeof value === 'number' ? value : parseFloat(value) || 0;

      case 'badge':
        // Convert boolean badges to text
        if (typeof value === 'boolean') {
          return value ? 'Activo' : 'Inactivo';
        }
        return String(value);

      case 'image':
        // For images, return the URL or empty string
        return value || '';

      case 'custom':
        // If custom render function exists, use it
        if (column.render) {
          return column.render(value, {});
        }
        return String(value);

      default:
        return String(value);
    }
  }

  /**
   * Formats date according to specified format
   */
  private formatDate(date: any, format: string): string {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'ISO':
        return d.toISOString();
      default:
        return `${day}/${month}/${year}`;
    }
  }

  /**
   * Creates a filter summary worksheet
   */
  private createFilterSummarySheet(filterInfo: {
    searchTerm?: string;
    activeFilters?: { [key: string]: any };
    sortConfig?: { key: string; direction: 'asc' | 'desc' };
  }): XLSX.WorkSheet {
    const summaryData: any[][] = [['Filter Type', 'Value']];

    // Add search term
    if (filterInfo.searchTerm) {
      summaryData.push(['Search Term', filterInfo.searchTerm]);
    }

    // Add active filters
    if (filterInfo.activeFilters) {
      Object.entries(filterInfo.activeFilters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          summaryData.push([`Filter: ${key}`, String(value)]);
        }
      });
    }

    // Add sort configuration
    if (filterInfo.sortConfig && filterInfo.sortConfig.key) {
      const sortText = `${filterInfo.sortConfig.key} (${filterInfo.sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'})`;
      summaryData.push(['Sort By', sortText]);
    }

    // Add export timestamp
    summaryData.push(['Exported At', new Date().toLocaleString()]);

    return XLSX.utils.aoa_to_sheet(summaryData);
  }

  /**
   * Generates a unique filename with timestamp
   */
  private generateFilename(baseName: string): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '')
      .replace('T', '_');

    // Remove any existing .xlsx extension
    const cleanBaseName = baseName.replace(/\.xlsx$/i, '');

    return `${cleanBaseName}_${timestamp}.xlsx`;
  }

  /**
   * Applies column styles and auto-sizing
   */
  private applyColumnStyles(worksheet: XLSX.WorkSheet, columns: ColumnConfig[]): void {
    // Auto-size columns
    const columnWidths = columns.map((col) => {
      // Estimate width based on label length
      const labelWidth = col.label.length;
      return { wch: Math.max(labelWidth + 5, 15) };
    });

    worksheet['!cols'] = columnWidths;

    // Apply header row styling (bold)
    // Note: XLSX library has limited styling support in free version
    // For advanced styling, consider using xlsx-style or similar
  }
}
