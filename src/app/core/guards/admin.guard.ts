import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Awaits AuthService.ready() first — see auth.guard.ts / AuthService.ready()'s javadoc. In practice
 *  authGuard on the parent shell route already waited by the time this child-route guard runs, but
 *  awaiting again here too is a no-op once resolved and keeps this guard correct on its own, without
 *  depending on route nesting order. */
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.ready();

  if (auth.isAdmin()) {
    return true;
  }
  router.navigate(['/']);
  return false;
};