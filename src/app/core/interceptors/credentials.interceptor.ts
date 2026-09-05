import { HttpInterceptorFn } from '@angular/common/http';

/** Makes every request send/accept cookies, including cross-origin ones — needed for the httpOnly
 *  auth cookie (see plan_secure_token_storage.md). The local dev proxy makes traffic look same-origin
 *  so this is a no-op there, but it's required the moment frontend and backend are on genuinely
 *  different origins in a real deployment. */
export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};