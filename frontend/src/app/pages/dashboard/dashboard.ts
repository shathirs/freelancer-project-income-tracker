import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { Client, ClientService } from '../../core/client.service';
import { Income, IncomeService } from '../../core/income.service';
import { Project, ProjectService } from '../../core/project.service';
import { Navbar } from '../../layout/navbar/navbar';
import { Sidebar } from '../../layout/sidebar/sidebar';

@Component({
  selector: 'app-dashboard',
  imports: [Sidebar, Navbar, BaseChartDirective, RouterLink],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly auth = inject(AuthService);
  private readonly clientsApi = inject(ClientService);
  private readonly projectsApi = inject(ProjectService);
  private readonly incomeApi = inject(IncomeService);

  readonly clients = signal<Client[]>([]);
  readonly projects = signal<Project[]>([]);
  readonly income = signal<Income[]>([]);

  readonly projectCount = computed(() => this.projects().length);
  readonly clientCount = computed(() => this.clients().length);
  readonly totalIncome = computed(() => this.sum(this.income(), 'Paid'));
  readonly pendingPayments = computed(() => this.sum(this.income(), 'Pending'));

  readonly recentProjects = computed(() =>
    [...this.projects()]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5),
  );

  readonly recentIncome = computed(() =>
    [...this.income()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5),
  );

  readonly statusSlices = computed(() => {
    const counts = [
      { label: 'Completed', count: this.countStatus('Completed'), color: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-600' },
      { label: 'In Progress', count: this.countStatus('In Progress'), color: 'text-blue-600', badge: 'bg-blue-50 text-blue-600' },
      { label: 'On Hold', count: this.countStatus('On Hold'), color: 'text-amber-600', badge: 'bg-amber-50 text-amber-600' },
    ];
    const total = counts.reduce((sum, slice) => sum + slice.count, 0) || 1;
    return counts.map((slice) => ({
      ...slice,
      percent: Math.round((slice.count / total) * 100),
    }));
  });

  readonly incomeChartData = computed<ChartData<'bar'>>(() => {
    const months = this.lastMonths(7);
    return {
      labels: months.map((month) => month.toLocaleDateString('en-US', { month: 'short' })),
      datasets: [
        {
          data: months.map((month) => this.sum(this.incomeInMonth(month), 'Paid')),
          backgroundColor: '#3b82f6',
          borderRadius: 8,
        },
      ],
    };
  });

  readonly incomeChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  readonly statusChartData = computed<ChartData<'doughnut'>>(() => ({
    labels: ['Completed', 'In Progress', 'On Hold'],
    datasets: [
      {
        data: [
          this.countStatus('Completed'),
          this.countStatus('In Progress'),
          this.countStatus('On Hold'),
        ],
        backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  }));

  readonly statusChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { legend: { display: false } },
  };

  constructor() {
    forkJoin({
      clients: this.clientsApi.list(),
      projects: this.projectsApi.list(),
      income: this.incomeApi.list(),
    }).subscribe({
      next: (result) => {
        this.clients.set(result.clients.clients);
        this.projects.set(result.projects.projects);
        this.income.set(result.income.income);
      },
    });
  }

  greeting(): string {
    const hour = new Date().getHours();
    const part = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    const name = this.auth.user()?.name;
    return name ? `Good ${part}, ${name}!` : `Good ${part}!`;
  }

  projectChange(): string {
    return this.countLine(
      this.projects().filter((project) => this.inMonth(project.startDate, 0)).length,
      this.projects().filter((project) => this.inMonth(project.startDate, -1)).length,
    );
  }

  clientChange(): string {
    return this.countLine(
      this.clients().filter((client) => this.inMonth(client.createdAt, 0)).length,
      this.clients().filter((client) => this.inMonth(client.createdAt, -1)).length,
    );
  }

  incomeChange(): string {
    return this.percentLine(this.paidInOffset(0), this.paidInOffset(-1));
  }

  pendingChange(): string {
    return this.percentLine(this.pendingInOffset(0), this.pendingInOffset(-1));
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDate(value: string | null): string {
    if (!value) {
      return 'Ongoing';
    }
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  statusClass(status: Project['status']): string {
    if (status === 'Completed') {
      return 'bg-emerald-50 text-emerald-600';
    }
    if (status === 'On Hold') {
      return 'bg-amber-50 text-amber-600';
    }
    return 'bg-blue-50 text-blue-600';
  }

  private countStatus(status: Project['status']): number {
    return this.projects().filter((project) => project.status === status).length;
  }

  private sum(records: Income[], status: Income['status']): number {
    return records
      .filter((record) => record.status === status)
      .reduce((total, record) => total + record.amount, 0);
  }

  private paidInOffset(offset: number): number {
    const { year, month } = this.shiftedMonth(offset);
    return this.sum(
      this.income().filter((record) => this.sameMonth(record.date, year, month)),
      'Paid',
    );
  }

  private pendingInOffset(offset: number): number {
    const { year, month } = this.shiftedMonth(offset);
    return this.sum(
      this.income().filter((record) => this.sameMonth(record.date, year, month)),
      'Pending',
    );
  }

  private incomeInMonth(month: Date): Income[] {
    return this.income().filter((record) =>
      this.sameMonth(record.date, month.getFullYear(), month.getMonth()),
    );
  }

  private lastMonths(count: number): Date[] {
    const now = new Date();
    return Array.from({ length: count }, (_, index) => {
      return new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    });
  }

  private inMonth(value: string, offset: number): boolean {
    const { year, month } = this.shiftedMonth(offset);
    return this.sameMonth(value, year, month);
  }

  private sameMonth(value: string, year: number, month: number): boolean {
    const dated = new Date(value);
    return dated.getFullYear() === year && dated.getMonth() === month;
  }

  private shiftedMonth(offset: number): { year: number; month: number } {
    const now = new Date();
    const monthIndex = now.getMonth() + offset;
    return {
      year: now.getFullYear() + Math.floor(monthIndex / 12),
      month: ((monthIndex % 12) + 12) % 12,
    };
  }

  private countLine(current: number, previous: number): string {
    const diff = current - previous;
    const count = Math.abs(diff);
    if (diff > 0) {
      return `${count} more than last month`;
    }
    if (diff < 0) {
      return `${count} fewer than last month`;
    }
    return 'Same as last month';
  }

  private percentLine(current: number, previous: number): string {
    if (previous === 0) {
      return current === 0 ? 'Same as last month' : 'New this month';
    }
    const percent = Math.round(((current - previous) / previous) * 100);
    if (percent > 0) {
      return `${percent}% more than last month`;
    }
    if (percent < 0) {
      return `${Math.abs(percent)}% less than last month`;
    }
    return 'Same as last month';
  }
}
