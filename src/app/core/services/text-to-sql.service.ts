import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChatResponseDto } from '../models/chat.model';

@Injectable({ providedIn: 'root' })
export class TextToSqlService {
  private http = inject(HttpClient);

  postQuery(question: string, sessionId: string | null) {
    return this.http.post<ChatResponseDto>('/api/v1/text-to-sql/query', {
      question,
      sessionId: sessionId ?? null,
    });
  }
}