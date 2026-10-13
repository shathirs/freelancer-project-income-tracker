import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';

export interface NotificationSettings {
  projectUpdates: boolean;
  paymentReceived: boolean;
  clientMessages: boolean;
  marketing: boolean;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  notifications: NotificationSettings;
  theme: 'light' | 'dark' | 'system';
  language: string;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:5000/api/auth';

  readonly token = signal<string | null>(localStorage.getItem('token'));
  readonly user = signal<AuthUser | null>(this.readStoredUser());
  private activeTheme: AuthUser['theme'] = 'light';

  constructor() {
    this.applyTheme(this.user()?.theme ?? 'light');
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.activeTheme === 'system') {
        this.applyTheme('system');
      }
    });
  }

  applyTheme(theme: AuthUser['theme']): void {
    this.activeTheme = theme;
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const dark = theme === 'dark' || (theme === 'system' && systemDark);
    document.documentElement.classList.toggle('dark', dark);
  }

  register(name: string, email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/register`, { name, email, password })
      .pipe(tap((response) => this.saveSession(response)));
  }

  login(email: string, password: string) {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(tap((response) => this.saveSession(response)));
  }

  updateProfile(name: string, email: string, phone: string) {
    return this.http
      .put<{ user: AuthUser }>(`${this.apiUrl}/profile`, { name, email, phone })
      .pipe(tap((response) => this.saveUser(response.user)));
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http.put<{ message: string }>(`${this.apiUrl}/password`, {
      currentPassword,
      newPassword,
    });
  }

  updatePreferences(
    notifications: NotificationSettings,
    theme: AuthUser['theme'],
    language: string,
  ) {
    return this.http
      .put<{ user: AuthUser }>(`${this.apiUrl}/preferences`, { notifications, theme, language })
      .pipe(tap((response) => this.saveUser(response.user)));
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.token.set(null);
    this.user.set(null);
    this.applyTheme('light');
  }

  loadCurrentUser(): void {
    if (!this.token()) {
      return;
    }

    this.http.get<{ user: AuthUser }>(`${this.apiUrl}/me`).subscribe({
      next: (response) => this.saveUser(response.user),
      error: () => this.logout(),
    });
  }

  private saveSession(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    this.token.set(response.token);
    this.saveUser(response.user);
  }

  private saveUser(user: AuthUser): void {
    const saved = this.withDefaults(user);
    localStorage.setItem('user', JSON.stringify(saved));
    this.user.set(saved);
    this.applyTheme(saved.theme);
  }

  private readStoredUser(): AuthUser | null {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      return null;
    }

    try {
      return this.withDefaults(JSON.parse(storedUser) as AuthUser);
    } catch {
      return null;
    }
  }

  private withDefaults(user: AuthUser): AuthUser {
    return {
      ...user,
      phone: user.phone ?? '',
      notifications: {
        projectUpdates: user.notifications?.projectUpdates ?? true,
        paymentReceived: user.notifications?.paymentReceived ?? true,
        clientMessages: user.notifications?.clientMessages ?? true,
        marketing: user.notifications?.marketing ?? false,
      },
      theme: user.theme === 'dark' || user.theme === 'system' ? user.theme : 'light',
      language: user.language || 'English',
    };
  }
}