import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Supabase } from '@app/core/services/supabase';
import { ActiveOrders } from './widgets/active-orders/active-orders';
import { DailyStats } from './widgets/daily-stats/daily-stats';
import { LowStockAlert } from './widgets/low-stock-alert/low-stock-alert';
import { SalesSummary } from './widgets/sales-summary/sales-summary';

@Component({
  selector: 'app-home',
   changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SalesSummary, ActiveOrders, LowStockAlert, DailyStats],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private supabase = inject(Supabase);

  userProfile = computed(() => this.supabase.userProfile());
  role = computed(() => this.userProfile()?.role || '');

  // Role Checks
  isManager = computed(() => ['admin', 'manager'].includes(this.role()));
  isWaiter = computed(() => this.role() === 'waiter');
  isChef = computed(() => this.role() === 'chef');
  isCashier = computed(() => this.role() === 'cashier');
}
