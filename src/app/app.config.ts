import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([credentialsInterceptor, errorInterceptor]),
      // Reads the XSRF-TOKEN cookie set by the backend's CookieCsrfTokenRepository and echoes it back
      // as X-XSRF-TOKEN on every mutating request — the double-submit-cookie half of CSRF protection
      // now that the JWT lives in a cookie (see plan_secure_token_storage.md). Names match Spring
      // Security's defaults, so no backend-side coordination is needed beyond both sides being enabled.
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN'
      })
    )
  ]
};