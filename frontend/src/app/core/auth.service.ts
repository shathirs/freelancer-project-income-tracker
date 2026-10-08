import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
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

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.token.set(null);
    this.user.set(null);
  }

  loadCurrentUser(): void {
    if (!this.token()) {
      return;
    }

    this.http.get<{ user: AuthUser }>(`${this.apiUrl}/me`).subscribe({
      next: (response) => {
        localStorage.setItem('user', JSON.stringify(response.user));
        this.user.set(response.user);
      },
      error: () => this.logout(),
    });
  }

  private saveSession(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.token.set(response.token);
    this.user.set(response.user);
  }

  private readStoredUser(): AuthUser | null {
    const storedUser = localStorage.getItem('user');

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as AuthUser;
    } catch {
      return null;
    }
  }
}
