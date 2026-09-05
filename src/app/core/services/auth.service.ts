import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, firstValueFrom, of, tap } from 'rxjs';
import { CurrentUser, LoginResponse } from '../models/auth.model';

const USER_KEY = 'bq_user';

/**
 * Singleton (providedIn: 'root') holding the reactive auth state as a signal. The JWT itself lives in
 * an httpOnly cookie set by the backend (see plan_secure_token_storage.md) — this service never reads
 * or stores it directly, since that's exactly the point of httpOnly (closes the XSS token-theft
 * vector that a localStorage-held token had). `USER_KEY` only caches the non-sensitive display fields
 * (username/role) so a page reload doesn't briefly flash a "logged out" state before the `/me` check
 * below resolves — it's a UX convenience, never the source of truth for whether someone is logged in.
 * Every component reads shared auth state by injecting this service and calling currentUser() in its
 * template; nothing subscribes to anything for this.
 *
 * `ready()` exists because the `/me` check is asynchronous but route guards need a yes/no answer
 * about `currentUser` — without waiting on this, a guard evaluated the instant the app boots would
 * always see the pre-check value and could wrongly bounce an actually-logged-in user to `/login` on
 * every full page reload, only for `currentUser` to get corrected a moment later with nothing left to
 * re-check it. `authGuard`/`adminGuard` await this before reading `currentUser()`.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  currentUser = signal<CurrentUser | null>(this.loadCachedUser());
  sessionChecked = signal(false);

  private sessionReady: Promise<void>;

  constructor() {
    // Deferred by one microtask deliberately: calling refreshSession() synchronously here would fire
    // the /me request before this constructor call (and Angular's registration of this instance as
    // the completed singleton) has returned. error.interceptor.ts injects AuthService too, and Angular
    // throws NG0200 (circular dependency) for a token re-requested while it's still mid-construction —
    // caught silently by refreshSession()'s own catchError, which made every session look logged-out
    // regardless of cookie validity. Deferring past the current call stack sidesteps that entirely.
    this.sessionReady = Promise.resolve().then(() => this.refreshSession());
  }

  /** Resolves once the initial `/me` check has settled (success or failure) — awaited by the guards
   *  before they read `currentUser()`, so they never act on the pre-check placeholder value. */
  ready(): Promise<void> {
    return this.sessionReady;
  }

  login(username: string, password: string) {
    return this.http.post<LoginResponse>('/api/v1/auth/login', { username, password }).pipe(
      tap((res) => {
        const user: CurrentUser = { username: res.username, role: res.role };
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    // Best-effort: the frontend already forgot the session either way, but this tells the backend to
    // clear the httpOnly cookie too, rather than leaving it to expire naturally.
    this.http.post('/api/v1/auth/logout', {}).subscribe({ error: () => {} });
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'ADMIN';
  }

  initials(): string {
    const username = this.currentUser()?.username ?? '';
    const parts = username.split(/[.\s_-]+/).filter(Boolean);
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
  }

  private refreshSession(): Promise<void> {
    return firstValueFrom(
      this.http.get<LoginResponse>('/api/v1/auth/me').pipe(
        tap((res) => {
          const user: CurrentUser = { username: res.username, role: res.role };
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          this.currentUser.set(user);
        }),
        catchError(() => {
          localStorage.removeItem(USER_KEY);
          this.currentUser.set(null);
          return of(null);
        })
      )
    ).then(() => {
      this.sessionChecked.set(true);
    });
  }

  private loadCachedUser(): CurrentUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CurrentUser;
    } catch {
      return null;
    }
  }
}