import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  GenerationJobStatus,
  SchemaMetadataDocumentDto,
  SchemaMetadataPatchRequest,
} from '../models/schema-metadata.model';

@Injectable({ providedIn: 'root' })
export class SchemaMetadataService {
  private http = inject(HttpClient);

  generate() {
    return this.http.post<{ jobId: string; status: string }>('/api/v1/schema/metadata/generate', {});
  }

  getGenerateStatus(jobId: string) {
    return this.http.get<GenerationJobStatus>('/api/v1/schema/metadata/generate/status', {
      params: { jobId },
    });
  }

  listDocuments() {
    return this.http.get<SchemaMetadataDocumentDto[]>('/api/v1/schema/metadata/documents');
  }

  getDocument(id: string) {
    return this.http.get<SchemaMetadataDocumentDto>(`/api/v1/schema/metadata/documents/${id}`);
  }

  copyDocument(id: string) {
    return this.http.post<SchemaMetadataDocumentDto>(`/api/v1/schema/metadata/documents/${id}/copy`, {});
  }

  updateDocument(id: string, patch: SchemaMetadataPatchRequest) {
    return this.http.put<SchemaMetadataDocumentDto>(`/api/v1/schema/metadata/documents/${id}`, patch);
  }

  promoteDocument(id: string) {
    return this.http.post<SchemaMetadataDocumentDto>(`/api/v1/schema/metadata/documents/${id}/promote`, {});
  }
}