import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';
import { AuditLogService } from '../../core/services/audit-log.service';
import { ChatSessionDto } from '../../core/models/session.model';
import { AuditLogTurnDto } from '../../core/models/audit.model';
import { QueryStatus } from '../../core/models/chat.model';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.scss',
})
export class AuditLogComponent implements OnInit, OnDestroy {
  private auth = inject(AuthService);
  private sessionService = inject(SessionService);
  private auditLogService = inject(AuditLogService);

  isAdmin = computed(() => this.auth.isAdmin());

  sessions = signal<ChatSessionDto[]>([]);
  loadingSessions = signal(false);
  usernameFilter = '';
  private filterDebounce: ReturnType<typeof setTimeout> | null = null;

  selectedSession = signal<ChatSessionDto | null>(null);
  turns = signal<AuditLogTurnDto[]>([]);
  loadingTurns = signal(false);
  expandedTurns = signal<Set<string>>(new Set());
  notFound = signal(false);

  ngOnInit(): void {
    this.fetchSessions();
  }

  ngOnDestroy(): void {
    if (this.filterDebounce) clearTimeout(this.filterDebounce);
  }

  onUsernameFilterInput(): void {
    if (this.filterDebounce) clearTimeout(this.filterDebounce);
    this.filterDebounce = setTimeout(() => this.fetchSessions(), 300);
  }

  private fetchSessions(): void {
    this.loadingSessions.set(true);
    const request = this.isAdmin()
      ? this.sessionService.loadAllSessions(this.usernameFilter.trim() || undefined)
      : this.sessionService.loadSessions();

    request.subscribe({
      next: (page) => {
        this.sessions.set(page.content);
        this.loadingSessions.set(false);
      },
      error: () => this.loadingSessions.set(false),
    });
  }

  onSelectSession(session: ChatSessionDto): void {
    this.selectedSession.set(session);
    this.notFound.set(false);
    this.loadingTurns.set(true);
    this.auditLogService.getBySession(session.id).subscribe({
      next: (turns) => {
        this.turns.set(turns);
        const last = turns[turns.length - 1];
        this.expandedTurns.set(last ? new Set([last.messageId]) : new Set());
        this.loadingTurns.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loadingTurns.set(false);
      },
    });
  }

  toggleTurn(messageId: string): void {
    this.expandedTurns.update((set) => {
      const next = new Set(set);
      if (next.has(messageId)) next.delete(messageId);
      else next.add(messageId);
      return next;
    });
  }

  isExpanded(messageId: string): boolean {
    return this.expandedTurns().has(messageId);
  }

  statusLabel(status: QueryStatus): string {
    switch (status) {
      case 'SUCCESS':
        return 'SUCCÈS';
      case 'IMPOSSIBLE':
        return 'IMPOSSIBLE';
      case 'SCHEMA_ERROR':
        return 'ERREUR DE SCHÉMA';
      case 'EXECUTION_FAILED':
        return 'ÉCHEC';
      case 'BLOCKED':
        return 'BLOQUÉ';
      case 'SESSION_NOT_FOUND':
        return 'SESSION INTROUVABLE';
    }
  }

  formatDateTime(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}