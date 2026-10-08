import { Component } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Navbar } from '../../layout/navbar/navbar';
import { Sidebar } from '../../layout/sidebar/sidebar';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  imports: [Sidebar, Navbar, BaseChartDirective],
})
export class Dashboard {

  readonly incomeChartData: ChartData<'bar'> = {
    labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'],
    datasets: [
      {
        data: [1300, 1700, 1000, 1900, 1500, 1800, 2200],
        backgroundColor: '#3b82f6',
        borderRadius: 8,
      },
    ],
  };

  readonly incomeChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  readonly statusChartData: ChartData<'doughnut'> = {
    labels: ['Completed', 'In Progress', 'On Hold'],
    datasets: [
      {
        data: [2, 2, 1],
        backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  };

  readonly statusChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { legend: { display: false } },
  };
}
