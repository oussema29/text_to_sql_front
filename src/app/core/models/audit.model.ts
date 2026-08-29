import { QueryStatus } from './chat.model';

export interface AuditLogAttemptDto {
  attemptNumber: number;
  generatedSql: string | null;
  status: QueryStatus;
  errorMessage: string | null;
  createdAt: string;
}

export interface AuditLogTurnDto {
  messageId: string;
  sessionId: string;
  userId: string;
  question: string;
  finalStatus: QueryStatus;
  attemptCount: number;
  createdAt: string;
  attempts: AuditLogAttemptDto[];
}