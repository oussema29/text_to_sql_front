import { HttpInterceptorFn } from '@angular/common/http';

const TOKEN_KEY = 'bq_token';

/** Attaches the JWT to every outgoing request. Reads localStorage directly rather than injecting
 *  AuthService's signal — an interceptor runs outside the component tree, and the raw token string
 *  (not the reactive user state) is all it needs. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
