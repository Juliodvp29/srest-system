import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Table } from '@app/core/models/database.types';
import { AlertService } from '@app/core/services/alert';
import { Supabase } from '@app/core/services/supabase';
import { Tables } from '@app/core/services/tables';

@Component({
  selector: 'app-tables-view',
  imports: [CommonModule],
  templateUrl: './tables-view.html',
  styleUrl: './tables-view.css',
})
export class TablesView implements OnInit, OnDestroy {
  private tablesService = inject(Tables);
  private router = inject(Router);
  private supabase = inject(Supabase);
  private alertService = inject(AlertService);

  tables = signal<Table[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Real-time subscription
  private tablesSubscription: any;
  private currentBranchId = '';

  async ngOnInit() {
    try {
      this.currentBranchId = this.supabase.userProfile()?.branch_id || '';
      if (!this.currentBranchId) {
        this.error.set('No active branch found');
        this.loading.set(false);
        return;
      }

      await this.loadTables();
      this.setupRealtimeSubscription();
    } catch (err) {
      console.error('Error initializing tables view:', err);
      this.error.set('Failed to load tables');
      this.loading.set(false);
    }
  }

  ngOnDestroy() {
    if (this.tablesSubscription) {
      this.tablesSubscription.unsubscribe();
    }
  }

  async loadTables() {
    this.loading.set(true);
    try {
      const data = await this.tablesService.getTablesByBranch(this.currentBranchId);
      this.tables.set(data);
    } catch (err) {
      console.error('Error loading tables:', err);
      this.error.set('Failed to load tables data');
    } finally {
      this.loading.set(false);
    }
  }

  setupRealtimeSubscription() {
    this.tablesSubscription = this.tablesService.subscribeToTables(
      this.currentBranchId,
      (payload) => {
        // Handle different event types
        if (payload.eventType === 'INSERT') {
          this.tables.update((current) => [...current, payload.new]);
        } else if (payload.eventType === 'UPDATE') {
          this.tables.update((current) =>
            current.map((t) => (t.id === payload.new.id ? payload.new : t)),
          );
        } else if (payload.eventType === 'DELETE') {
          this.tables.update((current) => current.filter((t) => t.id !== payload.old.id));
        }
      },
    );
  }

  async handleTableClick(table: Table) {
    if (table.status === 'available') {
      // Start new order flow
      await this.router.navigate(['/pos/new-order', table.id]);
    } else if (table.status === 'occupied') {
      // Find active order for this table
      try {
        const activeOrder = await this.tablesService.getActiveOrderByTable(table.id);
        if (activeOrder) {
          await this.router.navigate(['/pos/order-detail', activeOrder.id]);
        } else {
          // Fallback if marked occupied but no order found (edge case)
          // Maybe prompt to clear status or create new order?
          // For now, treat as new order but maybe warn?
          // Let's just navigate to new order which should handle "existing" check or creating new
          await this.router.navigate(['/pos/new-order', table.id]);
        }
      } catch (err) {
        console.error('Error finding active order:', err);
      }
    } else if (table.status === 'reserved') {
      // Check if we can open a reserved table
      // For now, allow opening it
      await this.router.navigate(['/pos/new-order', table.id]);
    }
  }

  get statusStats() {
    const list = this.tables();
    return {
      total: list.length,
      available: list.filter((t) => t.status === 'available').length,
      occupied: list.filter((t) => t.status === 'occupied').length,
      reserved: list.filter((t) => t.status === 'reserved').length,
    };
  }

  generateQR(table: Table) {
    // In a real app, this would use a library like qrcode.js or similar
    // For now, we'll construct the URL and show it to the user
    // The URL structure: [domain]/customer/menu/[table_id]
    const baseUrl = window.location.origin;
    const qrUrl = `${baseUrl}/customer/menu/${table.id}`;

    // Here we can use a modal or just show a nice alert with the link for now
    this.alertService.success('QR Generado', `URL para Mesa ${table.table_number}: ${qrUrl}`);

    // Tip: In production, we'd open a modal with the actual QR image for printing
    console.log('QR URL generated:', qrUrl);
  }
}
