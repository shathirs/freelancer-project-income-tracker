import { Component, inject } from '@angular/core';
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

  constructor() {
    this.auth.loadCurrentUser();
    this.loadNotifications();
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.loadNotifications();
    });
  }

  private loadNotifications(): void {
    if (!this.auth.token()) {
      return;
    }

    this.notifications.list().subscribe();
  }
}
