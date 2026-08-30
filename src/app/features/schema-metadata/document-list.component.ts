import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SchemaMetadataService } from '../../core/services/schema-metadata.service';
import { SchemaMetadataDocumentDto } from '../../core/models/schema-metadata.model';

type DocStatus = 'PRINCIPAL' | 'BROUILLON' | 'ARCHIVÉ';

@Component({
  selector: 'app-document-list',
  standalone: true,
  templateUrl: './document-list.component.html',
  styleUrl: './document-list.component.scss',
})
export class DocumentListComponent implements OnInit, OnDestroy {
  private schemaMetadataService = inject(SchemaMetadataService);
  private router = inject(Router);

  documents = signal<SchemaMetadataDocumentDto[]>([]);
  loading = signal(false);
  generating = signal(false);
  generateError = signal<string | null>(null);
  private pollHandle: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.fetchDocuments();
  }

  ngOnDestroy(): void {
    if (this.pollHandle) clearTimeout(this.pollHandle);
  }

  private fetchDocuments(): void {
    this.loading.set(true);
    this.schemaMetadataService.listDocuments().subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  lastGeneratedAt(): string | null {
    if (this.documents().length === 0) return null;
    return this.documents().reduce((latest, d) => (d.createdAt > latest ? d.createdAt : latest), this.documents()[0].createdAt);
  }

  statusOf(doc: SchemaMetadataDocumentDto): DocStatus {
    if (doc.principal) return 'PRINCIPAL';
    return doc.promotedAt === null ? 'BROUILLON' : 'ARCHIVÉ';
  }

  labelOf(doc: SchemaMetadataDocumentDto): string {
    return doc.label ?? `Document ${doc.id.slice(0, 8)}`;
  }

  triggerGenerate(): void {
    this.generating.set(true);
    this.generateError.set(null);
    this.schemaMetadataService.generate().subscribe({
      next: (res) => this.pollGenerateStatus(res.jobId),
      error: (err) => {
        this.generating.set(false);
        this.generateError.set(
          err.status === 409
            ? 'Une génération est déjà en cours.'
            : 'Échec du déclenchement de la génération.'
        );
      },
    });
  }

  private pollGenerateStatus(jobId: string): void {
    this.schemaMetadataService.getGenerateStatus(jobId).subscribe({
      next: (status) => {
        if (status.status === 'IN_PROGRESS') {
          this.pollHandle = setTimeout(() => this.pollGenerateStatus(jobId), 3000);
          return;
        }
        this.generating.set(false);
        if (status.status === 'FAILED') {
          this.generateError.set(status.errorMessage ?? 'La génération a échoué.');
          return;
        }
        this.fetchDocuments();
        if (status.resultDocumentId) {
          this.router.navigate(['/metadata', status.resultDocumentId], {
            queryParams: { diff: 'principal' },
          });
        }
      },
      error: () => {
        this.generating.set(false);
        this.generateError.set('Impossible de récupérer le statut de la génération.');
      },
    });
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  openDocument(doc: SchemaMetadataDocumentDto): void {
    this.router.navigate(['/metadata', doc.id]);
  }

  compareDocument(doc: SchemaMetadataDocumentDto): void {
    this.router.navigate(['/metadata', doc.id], { queryParams: { diff: 'principal' } });
  }

  promoteDocument(doc: SchemaMetadataDocumentDto, event: Event): void {
    event.stopPropagation();
    this.schemaMetadataService.promoteDocument(doc.id).subscribe({
      next: () => this.fetchDocuments(),
    });
  }
}