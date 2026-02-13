import { CommonModule, CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Reports } from '@app/core/services/reports';
import { Supabase } from '@app/core/services/supabase';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexPlotOptions,
  ApexXAxis,
  NgApexchartsModule,
} from 'ng-apexcharts';

export type Category = {
  id: string;
  name: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  min_stock: number;
  price: number;
  categoryName: string;
};

export type ChartOptions = {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  labels: string[];
  colors: string[];
};

@Component({
  selector: 'app-inventory-report',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  providers: [CurrencyPipe],
  templateUrl: './inventory-report.html',
  styleUrl: './inventory-report.css',
})
export class InventoryReport implements OnInit {
  private reportsService = inject(Reports);
  private supabase = inject(Supabase);

  loading = signal<boolean>(true);
  inventory = signal<InventoryItem[]>([]);

  // Metrics
  totalValuation = signal<number>(0);
  lowStockCount = signal<number>(0);
  totalItems = signal<number>(0);

  public pieChartOptions: Partial<ChartOptions> = {
    series: [],
    chart: {
      type: 'donut',
      height: 350,
      fontFamily: 'inherit',
    },
    labels: [],
    colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'],
    legend: { position: 'bottom' },
  };

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const user = await this.supabase.userProfile();
      if (!user?.branch_id) return;

      const rawData = (await this.reportsService.getInventoryData(user.branch_id)) as any[];

      const mappedData: InventoryItem[] = rawData.map((item) => {
        let catName = 'S/C';
        if (item.category) {
          if (Array.isArray(item.category)) {
            catName = item.category[0]?.name || 'S/C';
          } else {
            catName = (item.category as any).name || 'S/C';
          }
        }
        return {
          ...item,
          categoryName: catName,
        };
      });

      this.inventory.set(mappedData);

      // Calculate Metrics
      this.totalItems.set(mappedData.length);
      this.lowStockCount.set(mappedData.filter((i) => i.stock <= i.min_stock).length);
      this.totalValuation.set(mappedData.reduce((acc, i) => acc + i.price * i.stock, 0));

      // Category Breakdown
      const categories: Record<string, number> = {};
      mappedData.forEach((item) => {
        categories[item.categoryName] = (categories[item.categoryName] || 0) + 1;
      });

      this.pieChartOptions.series = Object.values(categories);
      this.pieChartOptions.labels = Object.keys(categories);
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      this.loading.set(false);
    }
  }

  getStockStatus(item: InventoryItem): string {
    if (item.stock <= 0) return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
    if (item.stock <= item.min_stock)
      return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
  }

  getStockLabel(item: InventoryItem): string {
    if (item.stock <= 0) return 'Agotado';
    if (item.stock <= item.min_stock) return 'Bajo Stock';
    return 'Saludable';
  }
}
