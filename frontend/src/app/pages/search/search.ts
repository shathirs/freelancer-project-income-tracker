import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Client, ClientService } from '../../core/client.service';
import { Project, ProjectService } from '../../core/project.service';
import { Navbar } from '../../layout/navbar/navbar';
import { Sidebar } from '../../layout/sidebar/sidebar';

@Component({
  selector: 'app-search',
  imports: [Sidebar, Navbar, RouterLink],
  templateUrl: './search.html',
})
export class Search {
  private readonly route = inject(ActivatedRoute);
  private readonly clientsApi = inject(ClientService);
  private readonly projectsApi = inject(ProjectService);

  readonly query = signal('');
  readonly clients = signal<Client[]>([]);
  readonly projects = signal<Project[]>([]);
  readonly message = signal('');

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const term = params.get('q')?.trim() ?? '';
      this.query.set(term);
      this.load(term);
    });
  }

  private load(term: string): void {
    this.message.set('');
    if (!term) {
      this.clients.set([]);
      this.projects.set([]);
      return;
    }

    forkJoin({
      clients: this.clientsApi.list(term),
      projects: this.projectsApi.list(term),
    }).subscribe({
      next: (result) => {
        this.clients.set(result.clients.clients);
        this.projects.set(result.projects.projects);
      },
      error: () => this.message.set('Could not search'),
    });
  }
}
