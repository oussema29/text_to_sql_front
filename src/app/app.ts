import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast.component';
import { AuthService } from './core/services/auth.service';

@Component({
  imports: [RouterOutlet, ToastComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('BanQuery');
  // Injected here (not just in the guards) so the /me check kicks off the instant the app boots,
  // regardless of which route loads first — e.g. landing directly on /login, which carries no guard
  // of its own and would otherwise never force AuthService into existence early.
  protected auth = inject(AuthService);
}