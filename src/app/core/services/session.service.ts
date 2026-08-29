import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChatMessageDto } from '../models/chat.model';
import { ChatSessionDto, PageResponse } from '../models/session.model';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private http = inject(HttpClient);

  /** Session currently open in the query workspace; null means "new session, not yet created". */
  currentSessionId = signal<string | null>(null);

  loadSessions(page = 0, size = 50) {
    return this.http.get<PageResponse<ChatSessionDto>>('/api/v1/sessions', {
      params: { page, size },
    });
  }

  /** ADMIN-only, unscoped — every user's sessions. Never used by the query workspace sidebar,
   *  only the audit log's session picker. See front_end_preparation.md's callout on /sessions vs
   *  /sessions/all. */
  loadAllSessions(username?: string, page = 0, size = 50) {
    const params: Record<string, string | number> = { page, size };
    if (username) params['username'] = username;
    return this.http.get<PageResponse<ChatSessionDto>>('/api/v1/sessions/all', { params });
  }

  getMessages(sessionId: string) {
    return this.http.get<ChatMessageDto[]>(`/api/v1/sessions/${sessionId}/messages`);
  }

  deleteSession(sessionId: string) {
    return this.http.delete<void>(`/api/v1/sessions/${sessionId}`);
  }

  selectSession(id: string | null): void {
    this.currentSessionId.set(id);
  }
}