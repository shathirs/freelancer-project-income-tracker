import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Navbar } from '../../layout/navbar/navbar';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Client, ClientService } from '../../core/client.service';
import { Project, ProjectService } from '../../core/project.service';

@Component({
  selector: 'app-projects',
  imports: [Sidebar, Navbar, ReactiveFormsModule],
  templateUrl: './projects.html',
})
export class Projects {
  private readonly projectService = inject(ProjectService);
  private readonly clientService = inject(ClientService);
  private readonly formBuilder = inject(FormBuilder);

  readonly projects = signal<Project[]>([]);
  readonly clients = signal<Client[]>([]);
  readonly search = signal('');
  readonly statusFilter = signal('');
  readonly clientFilter = signal('');
  readonly sort = signal<'newest' | 'oldest'>('newest');
  readonly page = signal(1);
  readonly pageSize = 8;
  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly errorMessage = signal('');
  readonly projectToDelete = signal<Project | null>(null);
  readonly projectToView = signal<Project | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    client: ['', Validators.required],
    category: [''],
    status: this.formBuilder.nonNullable.control<'In Progress' | 'Completed' | 'On Hold'>(
      'In Progress',
      Validators.required,
    ),
    startDate: ['', Validators.required],
    endDate: [''],
    fee: [0, [Validators.required, Validators.min(0)]],
    feeNote: [''],
  });

  readonly filteredProjects = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();
    const clientId = this.clientFilter();

    const filtered = this.projects().filter((project) => {
      const clientName = project.client?.name ?? '';
      const matchesTerm =
        !term ||
        project.name.toLowerCase().includes(term) ||
        clientName.toLowerCase().includes(term);
      const matchesStatus = !status || project.status === status;
      const matchesClient = !clientId || project.client?._id === clientId;
      return matchesTerm && matchesStatus && matchesClient;
    });

    return [...filtered].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return this.sort() === 'oldest' ? diff : -diff;
    });
  });

  readonly pagedProjects = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredProjects().slice(start, start + this.pageSize);
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredProjects().length / this.pageSize)),
  );

  readonly inProgressCount = computed(
    () => this.projects().filter((project) => project.status === 'In Progress').length,
  );

  readonly onHoldCount = computed(
    () => this.projects().filter((project) => project.status === 'On Hold').length,
  );

  readonly completedCount = computed(
    () => this.projects().filter((project) => project.status === 'Completed').length,
  );

  readonly addedThisMonth = computed(() => this.countInMonth(0));
  readonly addedLastMonth = computed(() => this.countInMonth(-1));

  constructor() {
    this.loadProjects();
    this.clientService.list().subscribe({
      next: (response) => this.clients.set(response.clients),
    });
  }

  loadProjects(): void {
    this.projectService.list().subscribe({
      next: (response) => this.projects.set(response.projects),
    });
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  onStatus(value: string): void {
    this.statusFilter.set(value);
    this.page.set(1);
  }

  onClient(value: string): void {
    this.clientFilter.set(value);
    this.page.set(1);
  }

  onSort(value: string): void {
    this.sort.set(value === 'oldest' ? 'oldest' : 'newest');
    this.page.set(1);
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.page.update((value) => value - 1);
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages()) {
      this.page.update((value) => value + 1);
    }
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

  formatFee(project: Project): string {
    const amount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(project.fee);
    return project.feeNote ? `${amount} ${project.feeNote}` : amount;
  }

  monthChange(current: number): string {
    const diff = current - this.addedLastMonth();
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

  private dateInput(value: string | null): string {
    if (!value) {
      return '';
    }
    return value.slice(0, 10);
  }

  openCreate(): void {
    this.editingId.set(null);
    this.errorMessage.set('');
    this.form.reset({
      name: '',
      client: '',
      category: '',
      status: 'In Progress',
      startDate: '',
      endDate: '',
      fee: 0,
      feeNote: '',
    });
    this.formOpen.set(true);
  }

  openEdit(project: Project): void {
    this.editingId.set(project._id);
    this.errorMessage.set('');
    this.form.reset({
      name: project.name,
      client: project.client._id,
      category: project.category,
      status: project.status,
      startDate: this.dateInput(project.startDate),
      endDate: this.dateInput(project.endDate),
      fee: project.fee,
      feeNote: project.feeNote,
    });
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
    this.errorMessage.set('');
  }

  openView(project: Project): void {
    this.projectToView.set(project);
  }

  closeView(): void {
    this.projectToView.set(null);
  }

  saveProject(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      ...value,
      endDate: value.endDate ? value.endDate : null,
    };
    const id = this.editingId();
    const request = id
      ? this.projectService.update(id, payload)
      : this.projectService.create(payload);

    request.subscribe({
      next: () => {
        this.closeForm();
        this.loadProjects();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message ?? 'Could not save project');
      },
    });
  }

  askDelete(project: Project): void {
    this.projectToDelete.set(project);
  }

  cancelDelete(): void {
    this.projectToDelete.set(null);
  }

  confirmDelete(): void {
    const project = this.projectToDelete();
    if (!project) {
      return;
    }

    this.projectService.delete(project._id).subscribe({
      next: () => {
        this.projectToDelete.set(null);
        this.loadProjects();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message ?? 'Could not delete project');
        this.projectToDelete.set(null);
      },
    });
  }

  private countInMonth(offset: number): number {
    const now = new Date();
    const month = now.getMonth() + offset;
    const year = now.getFullYear();
    return this.projects().filter((project) => {
      const created = new Date(project.createdAt);
      return created.getMonth() === month && created.getFullYear() === year;
    }).length;
  }
}