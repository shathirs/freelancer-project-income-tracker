import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';

export interface NotificationItem {
  _id: string;
  type: 'project' | 'payment' | 'client' | 'marketing';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5000/api/notifications';

  readonly items = signal<NotificationItem[]>([]);
  readonly unreadCount = computed(() => this.items().filter((item) => !item.read).length);

  list() {
    return this.http.get<{ notifications: NotificationItem[] }>(this.apiUrl).pipe(
      tap((response) => this.items.set(response.notifications)),
    );
  }

  markRead(id: string) {
    return this.http.patch<{ notification: NotificationItem }>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap((response) => {
        this.items.update((current) =>
          current.map((row) => (row._id === id ? response.notification : row)),
        );
      }),
    );
  }

  markAllRead() {
    return this.http.patch<{ message: string }>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        this.items.update((current) => current.map((row) => ({ ...row, read: true })));
      }),
    );
  }
}
