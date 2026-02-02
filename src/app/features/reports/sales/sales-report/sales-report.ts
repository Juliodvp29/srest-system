import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Reports } from '@app/core/services/reports';
import { Supabase } from '@app/core/services/supabase';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexGrid,
  ApexStroke,
  ApexTheme,
  ApexTooltip,
  ApexXAxis,
  NgApexchartsModule,
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  theme: ApexTheme;
};

@Component({
  selector: 'app-sales-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  providers: [CurrencyPipe],
  templateUrl: './sales-report.html',
  styleUrl: './sales-report.css',
})
export class SalesReport implements OnInit {
  private reportsService = inject(Reports);
  private supabase = inject(Supabase);
  private currencyPipe = inject(CurrencyPipe);

  loading = signal<boolean>(true);

  // Filters
  startDate = signal<string>(
    new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
  );
  endDate = signal<string>(new Date().toISOString().split('T')[0]);

  // Stats
  totalSales = signal<number>(0);
  todaySales = signal<number>(0);
  orderCount = signal<number>(0);
  avgTicket = signal<number>(0);

  public chartOptions: Partial<ChartOptions> = {
    series: [],
    chart: {
      height: 350,
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false },
      fontFamily: 'inherit',
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    grid: {
      borderColor: '#e2e8f0',
      strokeDashArray: 4,
      padding: { left: 20, right: 20 },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        style: { colors: '#64748b', fontWeight: 500 },
      },
    },
    tooltip: {
      theme: 'light',
      x: { format: 'dd MMM yyyy' },
      y: {
        formatter: (val) => this.currencyPipe.transform(val, 'CAD', 'symbol-narrow', '1.0-0') || '',
      },
    },
    theme: {
      monochrome: {
        enabled: true,
        color: '#10b981',
        shadeTo: 'light',
        shadeIntensity: 0.65,
      },
    },
  };

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const user = await this.supabase.userProfile();
      if (!user?.branch_id) return;

      const data = await this.reportsService.getSalesData(
        user.branch_id,
        new Date(this.startDate()),
        new Date(this.endDate() + 'T23:59:59'),
      );

      // Process for chart
      const salesByDate = data.reduce((acc: any, order) => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + order.total;
        return acc;
      }, {});

      const seriesData = Object.entries(salesByDate)
        .map(([x, y]) => ({
          x: new Date(x).getTime(),
          y,
        }))
        .sort((a, b) => a.x - b.x);

      this.chartOptions.series = [{ name: 'Ventas', data: seriesData }];

      // Summary Stats
      const total = data.reduce((sum, o) => sum + o.total, 0);
      this.totalSales.set(total);
      this.orderCount.set(data.length);
      this.avgTicket.set(data.length > 0 ? total / data.length : 0);

      // Today's Sales (Local Time Comparison)
      const now = new Date();
      const todayTotal = data
        .filter((o) => {
          const orderDate = new Date(o.created_at);
          return (
            orderDate.getFullYear() === now.getFullYear() &&
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getDate() === now.getDate()
          );
        })
        .reduce((sum, o) => sum + o.total, 0);
      this.todaySales.set(todayTotal);
    } catch (err) {
      console.error('Error loading sales data:', err);
    } finally {
      this.loading.set(false);
    }
  }

  onFilterChange() {
    this.loadData();
  }
}
