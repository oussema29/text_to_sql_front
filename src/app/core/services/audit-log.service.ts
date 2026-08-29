import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuditLogTurnDto } from '../models/audit.model';

@Injectable({ providedIn: 'root' })
export class AuditLogService {
  private http = inject(HttpClient);

  getBySession(sessionId: string) {
    return this.http.get<AuditLogTurnDto[]>(`/api/v1/audit-logs/session/${sessionId}`);
  }
}