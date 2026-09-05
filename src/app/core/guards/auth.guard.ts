import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Awaits AuthService.ready() first — see its javadoc for why: currentUser() isn't trustworthy until
 *  the initial /me check has settled, and this guard is the thing that would otherwise act on it too
 *  early on every fresh page load. */
export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ready();

  if (auth.currentUser()) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};