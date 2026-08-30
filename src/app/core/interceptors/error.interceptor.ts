import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/** Requests whose owning component already renders its own curated, localized error message —
 *  toasting these too would show the same failure twice (once curated, once as the backend's raw
 *  English exception text). Every other endpoint (including the async job *status* polls, which had
 *  no error feedback at all before this step) gets the shared toast. */
const SELF_HANDLED_ERROR_URLS = new Set([
  '/api/v1/auth/login',
  '/api/v1/schema/reindex',
  '/api/v1/schema/metadata/generate',
  '/api/v1/schema/metadata/generate/status',
]);

/**
 * A 401 means the token is missing/expired/invalid — clear auth state and bounce to /login, with a
 * toast explaining why. Every other error status surfaces GlobalExceptionHandler's `{error: string}`
 * body (confirmed live — see etape_7.md) as a shared toast, except the URLs above.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err) => {
      if (err instanceof HttpErrorResponse) {
        const path = new URL(err.url ?? req.url, window.location.origin).pathname;
        const selfHandled = SELF_HANDLED_ERROR_URLS.has(path);

        if (err.status === 401) {
          auth.logout();
          router.navigate(['/login']);
          if (!selfHandled) toast.show('Session expirée — veuillez vous reconnecter.');
        } else if (!selfHandled) {
          if (err.status === 0) {
            toast.show('Impossible de contacter le serveur.');
          } else {
            toast.show(err.error?.error ?? 'Une erreur est survenue.');
          }
        }
      }
      return throwError(() => err);
    })
  );
};
