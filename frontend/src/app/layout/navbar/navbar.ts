import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../core/notification.service';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
})
export class Navbar {
  private readonly router = inject(Router);

  readonly auth = inject(AuthService);
  readonly notifications = inject(NotificationService);
  readonly query = signal('');

  constructor() {
    this.auth.loadCurrentUser();
    this.loadNotifications();
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.loadNotifications();
      const term = this.router.parseUrl(this.router.url).queryParams['q'];
      if (this.router.url.startsWith('/search')) {
        this.query.set(typeof term === 'string' ? term : '');
      }
    });
  }

  search(event: Event): void {
    event.preventDefault();
    const term = this.query().trim();
    if (!term) {
      return;
    }
    void this.router.navigate(['/search'], { queryParams: { q: term } });
  }

  private loadNotifications(): void {
    if (!this.auth.token()) {
      return;
    }

    this.notifications.list().subscribe();
  }
}
