import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Minimal for now: a 401 means the token is missing/expired/invalid — clear auth state and bounce
 * to /login. Every other status is passed through unchanged; a shared toast/snackbar surface for
 * {error} bodies is build-order step 7, once GlobalExceptionHandler's real shape is confirmed live
 * (see front_end_preparation.md's Known Gaps).
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err) => {
      if (err?.status === 401) {
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
