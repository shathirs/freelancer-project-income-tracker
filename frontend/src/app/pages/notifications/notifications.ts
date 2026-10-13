import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { NotificationItem, NotificationService } from '../../core/notification.service';
import { Navbar } from '../../layout/navbar/navbar';
import { Sidebar } from '../../layout/sidebar/sidebar';

@Component({
  selector: 'app-notifications',
  imports: [Sidebar, Navbar],
  templateUrl: './notifications.html',
})
export class Notifications {
  private readonly notificationService = inject(NotificationService);

  readonly items = this.notificationService.items;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly message = signal('');

  constructor() {
    this.load();
  }

  load(): void {
    this.notificationService.list().subscribe({
      error: () => this.message.set('Could not load notifications'),
    });
  }

  markRead(item: NotificationItem): void {
    if (item.read) {
      return;
    }

    this.notificationService.markRead(item._id).subscribe({
      error: (error: HttpErrorResponse) => {
        this.message.set(error.error?.message ?? 'Could not update notification');
      },
    });
  }

  markAllRead(): void {
    if (this.unreadCount() === 0) {
      return;
    }

    this.notificationService.markAllRead().subscribe({
      error: (error: HttpErrorResponse) => {
        this.message.set(error.error?.message ?? 'Could not update notifications');
      },
    });
  }

  formatWhen(value: string): string {
    return new Date(value).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}
