import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { CurrentUser, LoginResponse } from '../models/auth.model';

const TOKEN_KEY = 'bq_token';
const USER_KEY = 'bq_user';

/**
 * Singleton (providedIn: 'root') holding the reactive auth state as a signal, backed by
 * localStorage for persistence across reloads — see front_end_preparation.md's state-management
 * pattern. Every component reads shared auth state by injecting this service and calling
 * currentUser() in its template; nothing subscribes to anything for this.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  currentUser = signal<CurrentUser | null>(this.loadUser());

  login(username: string, password: string) {
    return this.http.post<LoginResponse>('/api/v1/auth/login', { username, password }).pipe(
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.token);
        const user: CurrentUser = { username: res.username, role: res.role };
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'ADMIN';
  }

  initials(): string {
    const username = this.currentUser()?.username ?? '';
    const parts = username.split(/[.\s_-]+/).filter(Boolean);
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
  }

  private loadUser(): CurrentUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CurrentUser;
    } catch {
      return null;
    }
  }
}