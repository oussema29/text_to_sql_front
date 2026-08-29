import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReindexStatus, TableDetailDto, TableSummaryDto } from '../models/schema.model';

@Injectable({ providedIn: 'root' })
export class SchemaService {
  private http = inject(HttpClient);

  listTables(search?: string) {
    return this.http.get<TableSummaryDto[]>('/api/v1/schema/tables', {
      params: search ? { search } : {},
    });
  }

  getTable(tableName: string) {
    return this.http.get<TableDetailDto>(`/api/v1/schema/tables/${tableName}`);
  }

  triggerReindex() {
    return this.http.post<{ status: string }>('/api/v1/schema/reindex', {});
  }

  getReindexStatus() {
    return this.http.get<ReindexStatus>('/api/v1/schema/reindex/status');
  }
}