import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
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
  ApexResponsive,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis,
  NgApexchartsModule,
} from 'ng-apexcharts';

export type ProductReportData = {
  name: string;
  total: number;
  quantity: number;
};

export type BarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  dataLabels: ApexDataLabels;
  plotOptions: ApexPlotOptions;
  yaxis: ApexYAxis;
  xaxis: ApexXAxis;
  legend: ApexLegend;
  tooltip: ApexTooltip;
  colors: string[];
};

export type PieChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  colors: string[];
  legend: ApexLegend;
};

@Component({
  selector: 'app-products-report',
  standalone: true,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  providers: [CurrencyPipe],
  templateUrl: './products-report.html',
  styleUrl: './products-report.css',
})
export class ProductsReport implements OnInit {
  private reportsService = inject(Reports);
  private supabase = inject(Supabase);
  private currencyPipe = inject(CurrencyPipe);

  loading = signal<boolean>(true);

  // Filters
  startDate = signal<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
  );
  endDate = signal<string>(new Date().toISOString().split('T')[0]);

  topProducts = signal<ProductReportData[]>([]);

  public barChartOptions: Partial<BarChartOptions> = {
    series: [],
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false },
      fontFamily: 'inherit',
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        horizontal: true,
        barHeight: '70%',
        distributed: true,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: string | number | number[]) => {
        const num = Array.isArray(val) ? val[0] : val;
        return this.currencyPipe.transform(num, 'CAD', 'symbol-narrow', '1.0-0') || '';
      },
    },
    xaxis: {
      categories: [],
      labels: { style: { colors: '#64748b' } },
    },
    colors: [
      '#10b981',
      '#3b82f6',
      '#8b5cf6',
      '#f59e0b',
      '#ef4444',
      '#06b6d4',
      '#ec4899',
      '#f97316',
      '#14b8a6',
      '#6366f1',
    ],
    legend: { show: false },
    tooltip: { theme: 'light' },
  };

  public pieChartOptions: Partial<PieChartOptions> = {
    series: [],
    chart: {
      type: 'donut',
      height: 350,
      fontFamily: 'inherit',
    },
    labels: [],
    colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'],
    legend: { position: 'bottom' },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: 200 },
          legend: { position: 'bottom' },
        },
      },
    ],
  };

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const user = await this.supabase.userProfile();
      if (!user?.branch_id) return;

      const products = (await this.reportsService.getTopProducts(
        user.branch_id,
        new Date(this.startDate()),
        new Date(this.endDate() + 'T23:59:59'),
        10,
      )) as ProductReportData[];

      this.topProducts.set(products);

      // Process Bar Chart (Sales Amount)
      this.barChartOptions.series = [
        {
          name: 'Ventas',
          data: products.map((p) => p.total),
        },
      ];
      this.barChartOptions.xaxis = {
        ...this.barChartOptions.xaxis,
        categories: products.map((p) => p.name),
      };

      // Process Pie Chart (Quantity Distribution)
      this.pieChartOptions.series = products.slice(0, 5).map((p) => p.quantity);
      this.pieChartOptions.labels = products.slice(0, 5).map((p) => p.name);
    } catch (err) {
      console.error('Error loading product data:', err);
    } finally {
      this.loading.set(false);
    }
  }

  onFilterChange() {
    this.loadData();
  }
}
