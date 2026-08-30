import { Injectable, signal } from '@angular/core';

export type ToastKind = 'error' | 'success';

export interface Toast {
  id: number;
  message: string;
  kind: ToastKind;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private nextId = 0;

  show(message: string, kind: ToastKind = 'error', durationMs = 5000): void {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, message, kind }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
