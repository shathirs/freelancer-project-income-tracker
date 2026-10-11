import { Component, computed, inject, signal } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Navbar } from '../../layout/navbar/navbar';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Income, IncomeService } from '../../core/income.service';
import { Project, ProjectService } from '../../core/project.service';

@Component({
  selector: 'app-reports',
  imports: [Sidebar, Navbar, BaseChartDirective],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports {
  private readonly incomeService = inject(IncomeService);
  private readonly projectService = inject(ProjectService);

  readonly records = signal<Income[]>([]);
  readonly projects = signal<Project[]>([]);
  readonly from = signal(this.monthStart());
  readonly to = signal(this.today());
  readonly period = signal<'daily' | 'weekly' | 'monthly'>('monthly');
  readonly showAll = signal(false);

  readonly rangeLabel = computed(
    () => `${this.formatDate(this.from())} – ${this.formatDate(this.to())}`,
  );

  readonly visible = computed(() => {
    const start = this.rangeStart();
    const end = this.rangeEnd();
    return this.records()
      .filter((record) => {
        const dated = new Date(record.date);
        return dated >= start && dated <= end;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  readonly recent = computed(() => (this.showAll() ? this.visible() : this.visible().slice(0, 5)));

  readonly totalIncome = computed(() => this.sumPaid(this.visible()));
  readonly transactionCount = computed(() => this.visible().length);
  readonly paidThisMonth = computed(() => this.sumPaid(this.incomeInMonth(0)));
  readonly paidLastMonth = computed(() => this.sumPaid(this.incomeInMonth(-1)));
  readonly countThisMonth = computed(() => this.incomeInMonth(0).length);
  readonly countLastMonth = computed(() => this.incomeInMonth(-1).length);

  readonly projectsInRange = computed(() =>
    this.projects().filter((project) => this.inRange(new Date(project.startDate))),
  );

  readonly projectCount = computed(() => this.projectsInRange().length);
  readonly projectsThisMonth = computed(() => this.projectsInMonth(0).length);
  readonly projectsLastMonth = computed(() => this.projectsInMonth(-1).length);

  readonly averageDuration = computed(() => this.averageMonths(this.projects()));
  readonly durationThisMonth = computed(() => this.averageMonths(this.projectsInMonth(0)));
  readonly durationLastMonth = computed(() => this.averageMonths(this.projectsInMonth(-1)));

  readonly incomeChartData = computed<ChartData<'line'>>(() => {
    const buckets = this.chartBuckets();
    return {
      labels: buckets.map((bucket) => bucket.label),
      datasets: [
        {
          data: buckets.map((bucket) => bucket.amount),
          borderColor: '#3b82f6',
          backgroundColor: '#3b82f6',
          tension: 0.35,
          pointRadius: 4,
        },
      ],
    };
  });

  readonly incomeChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  readonly projectSlices = computed(() => {
    const totals = new Map<string, number>();
    for (const record of this.visible()) {
      if (record.status !== 'Paid') {
        continue;
      }
      totals.set(record.project.name, (totals.get(record.project.name) ?? 0) + record.amount);
    }

    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    const slices = sorted.slice(0, 4).map(([name, amount]) => ({ name, amount }));
    const other = sorted.slice(4).reduce((sum, [, amount]) => sum + amount, 0);
    if (other > 0) {
      slices.push({ name: 'Others', amount: other });
    }

    const total = slices.reduce((sum, slice) => sum + slice.amount, 0) || 1;
    const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#94a3b8'];
    return slices.map((slice, index) => ({
      ...slice,
      percent: Math.round((slice.amount / total) * 100),
      color: colors[index] ?? '#94a3b8',
    }));
  });

  readonly projectChartData = computed<ChartData<'doughnut'>>(() => ({
    labels: this.projectSlices().map((slice) => slice.name),
    datasets: [
      {
        data: this.projectSlices().map((slice) => slice.amount),
        backgroundColor: this.projectSlices().map((slice) => slice.color),
        borderWidth: 0,
      },
    ],
  }));

  readonly projectChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: { legend: { display: false } },
  };

  constructor() {
    this.loadReport();
  }

  loadReport(): void {
    this.incomeService.list().subscribe({
      next: (response) => this.records.set(response.income),
    });
    this.projectService.list().subscribe({
      next: (response) => this.projects.set(response.projects),
    });
  }

  onFrom(value: string): void {
    this.from.set(value);
  }

  onTo(value: string): void {
    this.to.set(value);
  }

  setPeriod(period: 'daily' | 'weekly' | 'monthly'): void {
    this.period.set(period);
  }

  generateReport(): void {
    this.loadReport();
  }

  focusDateRange(input: HTMLInputElement): void {
    input.focus();
  }

  exportCsv(): void {
    const header = ['Date', 'Project', 'Client', 'Type', 'Amount', 'Status'];
    const lines = this.visible().map((record) =>
      [
        this.formatDate(record.date),
        record.project.name,
        record.project.client.name,
        record.type,
        String(record.amount),
        record.status,
      ]
        .map((value) => `"${value.replaceAll('"', '""')}"`)
        .join(','),
    );
    const contents = [header.join(','), ...lines].join('\n');
    const url = URL.createObjectURL(new Blob([contents], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'report.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  exportPdf(): void {
    const rows = this.visible()
      .map(
        (record) => `<tr>
          <td>${this.escapeHtml(this.formatDate(record.date))}</td>
          <td>${this.escapeHtml(record.project.name)}</td>
          <td>${this.escapeHtml(record.project.client.name)}</td>
          <td>${this.escapeHtml(record.type)}</td>
          <td>${this.escapeHtml(this.formatMoney(record.amount))}</td>
          <td>${this.escapeHtml(record.status)}</td>
        </tr>`,
      )
      .join('');
    const html = `<!DOCTYPE html>
      <html>
        <head>
          <title>Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>Report</h1>
          <p>${this.escapeHtml(this.rangeLabel())}</p>
          <table>
            <thead>
              <tr><th>Date</th><th>Project</th><th>Client</th><th>Type</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6">No income records in this range.</td></tr>'}</tbody>
          </table>
        </body>
      </html>`;
    const frame = document.createElement('iframe');
    frame.style.position = 'fixed';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    document.body.appendChild(frame);
    const doc = frame.contentDocument;
    const win = frame.contentWindow;
    if (!doc || !win) {
      frame.remove();
      return;
    }
    doc.open();
    doc.write(html);
    doc.close();
    win.focus();
    win.print();
    setTimeout(() => frame.remove(), 1000);
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDuration(months: number): string {
    return `${months.toFixed(1)} months`;
  }

  percentChange(current: number, previous: number): string {
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

  countChange(current: number, previous: number): string {
    const diff = current - previous;
    const count = Math.abs(diff);
    const word = count === 1 ? 'project' : 'projects';
    if (diff > 0) {
      return `${count} more ${word} than last month`;
    }
    if (diff < 0) {
      return `${count} fewer ${word} than last month`;
    }
    return 'Same as last month';
  }

  private chartBuckets(): { label: string; amount: number }[] {
    const start = this.rangeStart();
    const end = this.rangeEnd();
    const paid = this.visible().filter((record) => record.status === 'Paid');
    const period = this.period();

    if (period === 'daily') {
      return this.eachDay(start, end).map((day) => ({
        label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: this.sumPaid(paid.filter((record) => this.sameDay(new Date(record.date), day))),
      }));
    }

    if (period === 'weekly') {
      return this.eachWeek(start, end).map((week) => ({
        label: week.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: this.sumPaid(
          paid.filter((record) => this.sameWeek(new Date(record.date), week)),
        ),
      }));
    }

    return this.eachMonth(start, end).map((month) => ({
      label: month.toLocaleDateString('en-US', { month: 'short' }),
      amount: this.sumPaid(
        paid.filter((record) => {
          const dated = new Date(record.date);
          return dated.getFullYear() === month.getFullYear() && dated.getMonth() === month.getMonth();
        }),
      ),
    }));
  }

  private sumPaid(records: Income[]): number {
    return records
      .filter((record) => record.status === 'Paid')
      .reduce((total, record) => total + record.amount, 0);
  }

  private averageMonths(projects: Project[]): number {
    if (projects.length === 0) {
      return 0;
    }
    const total = projects.reduce((sum, project) => {
      const start = new Date(project.startDate).getTime();
      const end = project.endDate ? new Date(project.endDate).getTime() : Date.now();
      const months = (end - start) / (1000 * 60 * 60 * 24 * 30.44);
      return sum + Math.max(0, months);
    }, 0);
    return total / projects.length;
  }

  private incomeInMonth(offset: number): Income[] {
    const { year, month } = this.shiftedMonth(offset);
    return this.records().filter((record) => {
      const dated = new Date(record.date);
      return dated.getFullYear() === year && dated.getMonth() === month;
    });
  }

  private projectsInMonth(offset: number): Project[] {
    const { year, month } = this.shiftedMonth(offset);
    return this.projects().filter((project) => {
      const dated = new Date(project.startDate);
      return dated.getFullYear() === year && dated.getMonth() === month;
    });
  }

  private shiftedMonth(offset: number): { year: number; month: number } {
    const now = new Date();
    const monthIndex = now.getMonth() + offset;
    const year = now.getFullYear() + Math.floor(monthIndex / 12);
    const month = ((monthIndex % 12) + 12) % 12;
    return { year, month };
  }

  private inRange(date: Date): boolean {
    return date >= this.rangeStart() && date <= this.rangeEnd();
  }

  private rangeStart(): Date {
    return new Date(this.from());
  }

  private rangeEnd(): Date {
    const end = new Date(this.to());
    end.setHours(23, 59, 59, 999);
    return end;
  }

  private eachDay(start: Date, end: Date): Date[] {
    const days: Date[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cursor <= last && days.length < 31) {
      days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }

  private eachWeek(start: Date, end: Date): Date[] {
    const weeks: Date[] = [];
    const cursor = new Date(start);
    cursor.setDate(cursor.getDate() - cursor.getDay());
    while (cursor <= end && weeks.length < 12) {
      weeks.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
    }
    return weeks;
  }

  private eachMonth(start: Date, end: Date): Date[] {
    const months: Date[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cursor <= last && months.length < 12) {
      months.push(new Date(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return months;
  }

  private sameDay(left: Date, right: Date): boolean {
    return (
      left.getFullYear() === right.getFullYear() &&
      left.getMonth() === right.getMonth() &&
      left.getDate() === right.getDate()
    );
  }

  private sameWeek(date: Date, weekStart: Date): boolean {
    const start = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return date >= start && date < end;
  }

  private monthStart(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${month}-01`;
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
