export type QueryStatus =
  | 'SUCCESS'
  | 'IMPOSSIBLE'
  | 'SCHEMA_ERROR'
  | 'EXECUTION_FAILED'
  | 'BLOCKED'
  | 'SESSION_NOT_FOUND';

export interface ChatResponseDto {
  messageId: string;
  sessionId: string;
  question: string;
  generatedSql: string | null;
  aiExplanation: string | null;
  data: Record<string, unknown>[];
  rowCount: number;
  status: QueryStatus;
  errorMessage: string | null;
  executionTimeMs: number;
}

/** `queryResult` is a JSON-encoded string on this DTO (see ChatMessage entity), unlike
 *  ChatResponseDto's already-parsed `data` array — parse it via `fromChatMessage` before use. */
export interface ChatMessageDto {
  id: string;
  sessionId: string;
  userQuestion: string;
  generatedSql: string | null;
  queryResult: string | null;
  aiExplanation: string | null;
  rowCount: number | null;
  status: QueryStatus;
  errorMessage: string | null;
  executionTimeMs: number | null;
  createdAt: string;
}

/** Shared shape the query-workspace (and later audit-log) card renders, normalized from either
 *  ChatResponseDto (live POST result) or ChatMessageDto (hydrated session history). */
export interface DisplayMessage {
  id: string;
  question: string;
  generatedSql: string | null;
  aiExplanation: string | null;
  data: Record<string, unknown>[];
  rowCount: number;
  status: QueryStatus;
  errorMessage: string | null;
  executionTimeMs: number;
}

export function fromChatResponse(dto: ChatResponseDto): DisplayMessage {
  return {
    id: dto.messageId,
    question: dto.question,
    generatedSql: dto.generatedSql,
    aiExplanation: dto.aiExplanation,
    data: dto.data ?? [],
    rowCount: dto.rowCount,
    status: dto.status,
    errorMessage: dto.errorMessage,
    executionTimeMs: dto.executionTimeMs,
  };
}

export function fromChatMessage(dto: ChatMessageDto): DisplayMessage {
  let data: Record<string, unknown>[] = [];
  if (dto.queryResult) {
    try {
      data = JSON.parse(dto.queryResult);
    } catch {
      data = [];
    }
  }
  return {
    id: dto.id,
    question: dto.userQuestion,
    generatedSql: dto.generatedSql,
    aiExplanation: dto.aiExplanation,
    data,
    rowCount: dto.rowCount ?? data.length,
    status: dto.status,
    errorMessage: dto.errorMessage,
    executionTimeMs: dto.executionTimeMs ?? 0,
  };
}