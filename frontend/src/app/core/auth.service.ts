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
  readonly user = signal<AuthUser | null>(null);

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
    this.token.set(null);
    this.user.set(null);
  }

  private saveSession(response: AuthResponse): void {
    localStorage.setItem('token', response.token);
    this.token.set(response.token);
    this.user.set(response.user);
  }
}
