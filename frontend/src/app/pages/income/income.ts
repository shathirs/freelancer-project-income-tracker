import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChartData, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Navbar } from '../../layout/navbar/navbar';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Client, ClientService } from '../../core/client.service';
import { Income as IncomeRecord, IncomeService } from '../../core/income.service';
import { Project, ProjectService } from '../../core/project.service';

@Component({
  selector: 'app-income',
  imports: [Sidebar, Navbar, BaseChartDirective, RouterLink, ReactiveFormsModule],
  templateUrl: './income.html',
  styleUrl: './income.css',
})
export class Income {
  private readonly incomeService = inject(IncomeService);
  private readonly clientService = inject(ClientService);
  private readonly projectService = inject(ProjectService);
  private readonly formBuilder = inject(FormBuilder);

  readonly records = signal<IncomeRecord[]>([]);
  readonly clients = signal<Client[]>([]);
  readonly statusFilter = signal('');
  readonly clientFilter = signal('');
  readonly from = signal(this.monthStart());
  readonly to = signal(this.today());
  readonly chartType = signal<'bar' | 'line'>('bar');
  readonly showAll = signal(false);
  readonly projects = signal<Project[]>([]);
  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly incomeToDelete = signal<IncomeRecord | null>(null);
  readonly incomeToView = signal<IncomeRecord | null>(null);
  readonly exportOpen = signal(false);

  readonly form = this.formBuilder.nonNullable.group({
    project: ['', Validators.required],
    type: this.formBuilder.nonNullable.control<'Payment' | 'Invoice'>('Payment', Validators.required),
    amount: [0, [Validators.required, Validators.min(0)]],
    status: this.formBuilder.nonNullable.control<'Paid' | 'Pending'>('Paid', Validators.required),
    date: ['', Validators.required],
  });

  readonly rangeLabel = computed(
    () => `${this.formatDate(this.from())} – ${this.formatDate(this.to())}`,
  );

  readonly visible = computed(() => {
    const status = this.statusFilter();
    const clientId = this.clientFilter();
    const start = new Date(this.from());
    const end = new Date(this.to());
    end.setHours(23, 59, 59, 999);

    return this.records().filter((record) => {
      const dated = new Date(record.date);
      const matchesStatus = !status || record.status === status;
      const matchesClient = !clientId || record.project.client._id === clientId;
      return matchesStatus && matchesClient && dated >= start && dated <= end;
    });
  });

  readonly recent = computed(() => (this.showAll() ? this.visible() : this.visible().slice(0, 5)));

  readonly totalIncome = computed(() => this.sum(this.visible(), 'Paid'));
  readonly pendingPayments = computed(() => this.sum(this.visible(), 'Pending'));
  readonly paidThisMonth = computed(() => this.sum(this.inMonth(0), 'Paid'));
  readonly paidLastMonth = computed(() => this.sum(this.inMonth(-1), 'Paid'));
  readonly pendingThisMonth = computed(() => this.sum(this.inMonth(0), 'Pending'));
  readonly pendingLastMonth = computed(() => this.sum(this.inMonth(-1), 'Pending'));
  readonly countThisMonth = computed(() => this.inMonth(0).length);
  readonly countLastMonth = computed(() => this.inMonth(-1).length);
  readonly transactionCount = computed(() => this.visible().length);

  readonly monthlyChartData = computed<ChartData<'bar' | 'line'>>(() => {
    const months = this.lastMonths(6);
    return {
      labels: months.map((month) => month.label),
      datasets: [
        {
          data: months.map((month) => this.sum(this.paidIn(month.year, month.month), 'Paid')),
          backgroundColor: '#3b82f6',
          borderColor: '#3b82f6',
          borderRadius: 8,
          tension: 0.3,
        },
      ],
    };
  });

  readonly monthlyChartOptions: ChartOptions<'bar' | 'line'> = {
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
    const top = sorted.slice(0, 4);
    const other = sorted.slice(4).reduce((sum, [, amount]) => sum + amount, 0);
    const slices = top.map(([name, amount]) => ({ name, amount }));
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
    this.loadIncome();
    this.clientService.list().subscribe({
      next: (response) => this.clients.set(response.clients),
    });
    this.projectService.list().subscribe({
      next: (response) => this.projects.set(response.projects),
    });
  }

  loadIncome(): void {
    this.incomeService.list().subscribe({
      next: (response) => this.records.set(response.income),
    });
  }

  onFrom(value: string): void {
    this.from.set(value);
  }

  onTo(value: string): void {
    this.to.set(value);
  }

  onStatus(value: string): void {
    this.statusFilter.set(value);
  }

  onClient(value: string): void {
    this.clientFilter.set(value);
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

  private sum(records: IncomeRecord[], status: 'Paid' | 'Pending'): number {
    return records
      .filter((record) => record.status === status)
      .reduce((total, record) => total + record.amount, 0);
  }

  private inMonth(offset: number): IncomeRecord[] {
    const now = new Date();
    const month = now.getMonth() + offset;
    const year = now.getFullYear() + Math.floor(month / 12);
    const normalized = ((month % 12) + 12) % 12;
    return this.records().filter((record) => {
      const dated = new Date(record.date);
      return dated.getMonth() === normalized && dated.getFullYear() === year;
    });
  }

  private paidIn(year: number, month: number): IncomeRecord[] {
    return this.records().filter((record) => {
      const dated = new Date(record.date);
      return dated.getFullYear() === year && dated.getMonth() === month;
    });
  }

  private lastMonths(count: number): { label: string; year: number; month: number }[] {
    const now = new Date();
    return Array.from({ length: count }, (_, index) => {
      const dated = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
      return {
        label: dated.toLocaleDateString('en-US', { month: 'short' }),
        year: dated.getFullYear(),
        month: dated.getMonth(),
      };
    });
  }

  private dateInput(value: string): string {
    return value ? value.slice(0, 10) : '';
  }

  openCreate(): void {
    this.editingId.set(null);
    this.errorMessage.set('');
    this.form.reset({
      project: '',
      type: 'Payment',
      amount: 0,
      status: 'Paid',
      date: '',
    });
    this.formOpen.set(true);
  }

  openEdit(record: IncomeRecord): void {
    this.editingId.set(record._id);
    this.errorMessage.set('');
    this.form.reset({
      project: record.project._id,
      type: record.type,
      amount: record.amount,
      status: record.status,
      date: this.dateInput(record.date),
    });
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
    this.errorMessage.set('');
  }

  saveIncome(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    const id = this.editingId();
    const request = id
      ? this.incomeService.update(id, payload)
      : this.incomeService.create(payload);

    request.subscribe({
      next: () => {
        this.closeForm();
        this.loadIncome();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message ?? 'Could not save income');
      },
    });
  }

  askDelete(record: IncomeRecord): void {
    this.incomeToDelete.set(record);
  }

  cancelDelete(): void {
    this.incomeToDelete.set(null);
  }

  openView(record: IncomeRecord): void {
    this.incomeToView.set(record);
  }

  closeView(): void {
    this.incomeToView.set(null);
  }

  toggleExport(): void {
    this.exportOpen.update((open) => !open);
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
    this.downloadFile('income.csv', [header.join(','), ...lines].join('\n'), 'text/csv');
    this.exportOpen.set(false);
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
          <title>Income</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>Income</h1>
          <p>${this.escapeHtml(this.rangeLabel())}</p>
          <table>
            <thead>
              <tr><th>Date</th><th>Project</th><th>Client</th><th>Type</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6">No income records.</td></tr>'}</tbody>
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
    this.exportOpen.set(false);
    setTimeout(() => frame.remove(), 1000);
  }

  private downloadFile(name: string, contents: string, type: string): void {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  confirmDelete(): void {
    const record = this.incomeToDelete();
    if (!record) {
      return;
    }

    this.incomeService.delete(record._id).subscribe({
      next: () => {
        this.incomeToDelete.set(null);
        this.loadIncome();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message ?? 'Could not delete income');
        this.incomeToDelete.set(null);
      },
    });
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
