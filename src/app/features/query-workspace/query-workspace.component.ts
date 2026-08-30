import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { SessionService } from '../../core/services/session.service';
import { TextToSqlService } from '../../core/services/text-to-sql.service';
import { DisplayMessage, fromChatMessage, fromChatResponse } from '../../core/models/chat.model';
import { ChatSessionDto } from '../../core/models/session.model';

@Component({
  selector: 'app-query-workspace',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './query-workspace.component.html',
  styleUrl: './query-workspace.component.scss',
})
export class QueryWorkspaceComponent implements OnInit {
  private auth = inject(AuthService);
  private sessionService = inject(SessionService);
  private textToSqlService = inject(TextToSqlService);

  sessions = signal<ChatSessionDto[]>([]);
  loadingSessions = signal(false);
  messages = signal<DisplayMessage[]>([]);
  loadingMessages = signal(false);
  sendingQuestion = signal<string | null>(null);
  confirmDeleteId = signal<string | null>(null);
  questionInput = '';

  currentSessionId = this.sessionService.currentSessionId;

  ngOnInit(): void {
    this.refreshSessions();
  }

  refreshSessions(): void {
    this.loadingSessions.set(true);
    this.sessionService.loadSessions().subscribe({
      next: (page) => {
        this.sessions.set(page.content);
        this.loadingSessions.set(false);
      },
      error: () => this.loadingSessions.set(false),
    });
  }

  onNewSession(): void {
    this.sessionService.selectSession(null);
    this.messages.set([]);
  }

  onSelectSession(session: ChatSessionDto): void {
    if (session.id === this.currentSessionId()) return;
    this.sessionService.selectSession(session.id);
    this.loadingMessages.set(true);
    this.sessionService.getMessages(session.id).subscribe({
      next: (msgs) => {
        this.messages.set(msgs.map(fromChatMessage));
        this.loadingMessages.set(false);
      },
      error: () => this.loadingMessages.set(false),
    });
  }

  askDelete(sessionId: string, event: Event): void {
    event.stopPropagation();
    this.confirmDeleteId.set(sessionId);
  }

  cancelDelete(event: Event): void {
    event.stopPropagation();
    this.confirmDeleteId.set(null);
  }

  confirmDelete(sessionId: string, event: Event): void {
    event.stopPropagation();
    this.sessionService.deleteSession(sessionId).subscribe({
      next: () => {
        this.confirmDeleteId.set(null);
        this.sessions.update((list) => list.filter((s) => s.id !== sessionId));
        if (this.currentSessionId() === sessionId) {
          this.onNewSession();
        }
      },
      error: () => this.confirmDeleteId.set(null),
    });
  }

  submitQuestion(): void {
    const question = this.questionInput.trim();
    if (!question || this.sendingQuestion()) return;

    this.questionInput = '';
    this.sendingQuestion.set(question);
    const wasNewSession = this.currentSessionId() === null;

    this.textToSqlService.postQuery(question, this.currentSessionId()).subscribe({
      next: (res) => {
        const display = fromChatResponse(res);
        this.messages.update((list) => [...list, display]);
        this.sendingQuestion.set(null);

        if (wasNewSession) {
          this.sessionService.selectSession(res.sessionId);
          const newSession: ChatSessionDto = {
            id: res.sessionId,
            title: question.length > 100 ? question.slice(0, 100) : question,
            ownerUsername: this.auth.currentUser()?.username ?? null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.sessions.update((list) => [newSession, ...list]);
        } else {
          this.sessions.update((list) =>
            list.map((s) =>
              s.id === res.sessionId ? { ...s, updatedAt: new Date().toISOString() } : s
            )
          );
        }
      },
      error: () => {
        this.sendingQuestion.set(null);
      },
    });
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitQuestion();
    }
  }

  statusLabel(status: DisplayMessage['status']): string {
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

  columnsOf(row: Record<string, unknown>): string[] {
    return Object.keys(row);
  }

  formatSessionDate(iso: string): string {
    const date = new Date(iso);
    const now = new Date();
    const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const isSameDay = date.toDateString() === now.toDateString();
    if (isSameDay) return `Aujourd'hui, ${time}`;
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return `Hier, ${time}`;
    const day = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    return `${day}, ${time}`;
  }
}