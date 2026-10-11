import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Navbar } from '../../layout/navbar/navbar';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Client, ClientService } from '../../core/client.service';
import { Project, ProjectService } from '../../core/project.service';

@Component({
  selector: 'app-clients',
  imports: [Sidebar, Navbar, ReactiveFormsModule],
  templateUrl: './clients.html',
  styleUrl: './clients.css',
})
export class Clients {
  private readonly clientService = inject(ClientService);
  private readonly projectService = inject(ProjectService);
  private readonly formBuilder = inject(FormBuilder);

  readonly clients = signal<Client[]>([]);
  readonly projects = signal<Project[]>([]);
  readonly search = signal('');
  readonly statusFilter = signal('');
  readonly sort = signal<'newest' | 'oldest'>('newest');
  readonly page = signal(1);
  readonly pageSize = 4;
  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly clientToDelete = signal<Client | null>(null);
  readonly clientToView = signal<Client | null>(null);
  readonly errorMessage = signal('');

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    company: [''],
    phone: [''],
    status: this.formBuilder.nonNullable.control<'Active' | 'Inactive'>('Active', Validators.required),
  });

  readonly monthLabel = new Date().toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  readonly filteredClients = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();

    const filtered = this.clients().filter((client) => {
      const matchesTerm =
        !term ||
        client.name.toLowerCase().includes(term) ||
        client.email.toLowerCase().includes(term);
      const matchesStatus = !status || client.status === status;
      return matchesTerm && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return this.sort() === 'oldest' ? diff : -diff;
    });
  });

  readonly pagedClients = computed(() => {
    const start = (this.page() - 1) * this.pageSize;
    return this.filteredClients().slice(start, start + this.pageSize);
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredClients().length / this.pageSize)),
  );

  readonly activeCount = computed(
    () => this.clients().filter((client) => client.status === 'Active').length,
  );

  readonly inactiveCount = computed(
    () => this.clients().filter((client) => client.status === 'Inactive').length,
  );

  readonly newThisMonth = computed(() => {
    const now = new Date();
    return this.clients().filter((client) => {
      const created = new Date(client.createdAt);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
  });

  constructor() {
    this.loadClients();
    this.loadProjects();
  }

  loadClients(): void {
    this.clientService.list().subscribe({
      next: (response) => this.clients.set(response.clients),
    });
  }

  loadProjects(): void {
    this.projectService.list().subscribe({
      next: (response) => this.projects.set(response.projects),
    });
  }

  projectCount(clientId: string): number {
    return this.projectsFor(clientId).length;
  }

  totalEarned(clientId: string): string {
    const total = this.projectsFor(clientId).reduce((sum, project) => sum + project.fee, 0);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(total);
  }

  private projectsFor(clientId: string): Project[] {
    return this.projects().filter((project) => project.client._id === clientId);
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
  }

  onStatus(value: string): void {
    this.statusFilter.set(value);
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

  initials(name: string): string {
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  openCreate(): void {
    this.editingId.set(null);
    this.errorMessage.set('');
    this.form.reset({ name: '', email: '', company: '', phone: '', status: 'Active' });
    this.formOpen.set(true);
  }

  openEdit(client: Client): void {
    this.editingId.set(client._id);
    this.errorMessage.set('');
    this.form.reset({
      name: client.name,
      email: client.email,
      company: client.company,
      phone: client.phone,
      status: client.status,
    });
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
    this.editingId.set(null);
    this.errorMessage.set('');
  }

  openView(client: Client): void {
    this.clientToView.set(client);
  }

  closeView(): void {
    this.clientToView.set(null);
  }

  saveClient(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload = this.form.getRawValue();
    const id = this.editingId();
    const request = id
      ? this.clientService.update(id, payload)
      : this.clientService.create(payload);

    request.subscribe({
      next: () => {
        this.closeForm();
        this.loadClients();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message ?? 'Could not save client');
      },
    });
  }

  askDelete(client: Client): void {
    this.clientToDelete.set(client);
  }
  
  cancelDelete(): void {
    this.clientToDelete.set(null);
  }
  
  confirmDelete(): void {
    const client = this.clientToDelete();
    if (!client) {
      return;
    }
  
    this.clientService.delete(client._id).subscribe({
      next: () => {
        this.clientToDelete.set(null);
        this.loadClients();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage.set(error.error?.message ?? 'Could not delete client');
        this.clientToDelete.set(null);
      },
    });
  }
}