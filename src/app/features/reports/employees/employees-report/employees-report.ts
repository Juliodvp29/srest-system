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
  ApexPlotOptions,
  ApexTooltip,
  ApexXAxis,
  NgApexchartsModule,
} from 'ng-apexcharts';

export type EmployeePerformance = {
  name: string;
  sales: number;
  count: number;
};

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  plotOptions: ApexPlotOptions;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  colors: string[];
};

@Component({
  selector: 'app-employees-report',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, NgApexchartsModule],
  providers: [CurrencyPipe],
  templateUrl: './employees-report.html',
  styleUrl: './employees-report.css',
})
export class EmployeesReport implements OnInit {
  private reportsService = inject(Reports);
  private supabase = inject(Supabase);
  private currencyPipe = inject(CurrencyPipe);

  loading = signal<boolean>(true);

  // Filters
  startDate = signal<string>(
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
  );
  endDate = signal<string>(new Date().toISOString().split('T')[0]);

  performanceData = signal<EmployeePerformance[]>([]);

  public chartOptions: Partial<ChartOptions> = {
    series: [],
    chart: {
      height: 350,
      type: 'bar',
      toolbar: { show: false },
      fontFamily: 'inherit',
    },
    plotOptions: {
      bar: {
        columnWidth: '45%',
        distributed: true,
        borderRadius: 10,
        dataLabels: { position: 'top' },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: string | number | number[]) => {
        const num = Array.isArray(val) ? val[0] : val;
        return this.currencyPipe.transform(num, 'CAD', 'symbol-narrow', '1.0-0') || '';
      },
      offsetY: -20,
      style: { fontSize: '12px', colors: ['#304758'] },
    },
    xaxis: {
      categories: [],
      position: 'bottom',
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: { style: { colors: '#64748b', fontWeight: 500 } },
    },
    tooltip: { theme: 'light' },
    colors: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
    legend: { show: false },
  };

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const user = await this.supabase.userProfile();
      if (!user?.branch_id) return;

      const data = (await this.reportsService.getEmployeePerformance(
        user.branch_id,
        new Date(this.startDate()),
        new Date(this.endDate() + 'T23:59:59'),
      )) as EmployeePerformance[];

      this.performanceData.set(data);

      this.chartOptions.series = [
        {
          name: 'Ventas Totales',
          data: data.map((d) => d.sales),
        },
      ];

      this.chartOptions.xaxis = {
        ...this.chartOptions.xaxis,
        categories: data.map((d) => d.name),
      };
    } catch (err) {
      console.error('Error loading employee data:', err);
    } finally {
      this.loading.set(false);
    }
  }

  onFilterChange() {
    this.loadData();
  }
}
