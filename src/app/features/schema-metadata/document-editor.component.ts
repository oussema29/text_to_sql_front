import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SchemaMetadataService } from '../../core/services/schema-metadata.service';
import {
  MetaColumn,
  MetaTable,
  SchemaMetadataDocumentDto,
  SchemaMetadataPatchRequest,
} from '../../core/models/schema-metadata.model';
import { ContentDiff, diffSchemaMetadataContent } from '../../core/models/schema-metadata-diff';

type WorkingColumn = MetaColumn & { samplesText: string };
type WorkingTable = Omit<MetaTable, 'columns'> & { columns: WorkingColumn[] };

type Mode = 'preview' | 'edit' | 'diff';

@Component({
  selector: 'app-document-editor',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './document-editor.component.html',
  styleUrl: './document-editor.component.scss',
})
export class DocumentEditorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private schemaMetadataService = inject(SchemaMetadataService);

  document = signal<SchemaMetadataDocumentDto | null>(null);
  loading = signal(true);
  notFound = signal(false);
  mode = signal<Mode>('preview');
  searchTerm = '';
  saving = signal(false);
  copying = signal(false);
  promoting = signal(false);
  saveMessage = signal<string | null>(null);

  diff = signal<ContentDiff | null>(null);
  diffAgainstLabel = signal<string | null>(null);
  loadingDiff = signal(false);

  private originalTables: MetaTable[] = [];
  workingTables: WorkingTable[] = [];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (!id) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }
      this.loadDocument(id);
    });
  }

  private loadDocument(id: string): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.mode.set('preview');
    this.diff.set(null);
    this.saveMessage.set(null);
    this.schemaMetadataService.getDocument(id).subscribe({
      next: (doc) => {
        this.document.set(doc);
        this.originalTables = doc.content?.tables ?? [];
        this.resetWorking();
        this.loading.set(false);

        if (this.route.snapshot.queryParamMap.get('diff') === 'principal') {
          this.openDiffAgainstPrincipal();
        }
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  private resetWorking(): void {
    this.workingTables = this.originalTables.map((t) => ({
      ...t,
      columns: t.columns.map((c) => ({ ...c, samplesText: c.samples.join(', ') })),
    }));
  }

  isEditable(): boolean {
    return this.document()?.promotedAt === null;
  }

  filteredTables(): WorkingTable[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.workingTables;
    return this.workingTables.filter(
      (t) =>
        t.name.toLowerCase().includes(term) || (t.description ?? '').toLowerCase().includes(term)
    );
  }

  setMode(mode: Mode): void {
    if (mode === 'edit' && !this.isEditable()) return;
    this.mode.set(mode);
  }

  cancelEdit(): void {
    this.resetWorking();
    this.mode.set('preview');
  }

  saveEdit(): void {
    const doc = this.document();
    if (!doc) return;
    const patch = this.buildPatch();
    if (patch.tableDescriptions.length === 0 && patch.columnDescriptions.length === 0) {
      this.mode.set('preview');
      return;
    }
    this.saving.set(true);
    this.schemaMetadataService.updateDocument(doc.id, patch).subscribe({
      next: (updated) => {
        this.document.set(updated);
        this.originalTables = updated.content?.tables ?? [];
        this.resetWorking();
        this.saving.set(false);
        this.mode.set('preview');
        this.saveMessage.set('Modifications enregistrées.');
      },
      error: () => {
        // The shared error toast (error.interceptor.ts) surfaces the backend's message; staying in
        // edit mode here (rather than reverting) lets the admin retry without re-typing anything.
        this.saving.set(false);
      },
    });
  }

  private buildPatch(): SchemaMetadataPatchRequest {
    const tableDescriptions: SchemaMetadataPatchRequest['tableDescriptions'] = [];
    const columnDescriptions: SchemaMetadataPatchRequest['columnDescriptions'] = [];

    const originalByName = new Map(this.originalTables.map((t) => [t.name, t]));

    for (const table of this.workingTables) {
      const original = originalByName.get(table.name);
      if (!original) continue;

      if (table.description !== original.description) {
        tableDescriptions.push({ table: table.name, description: table.description ?? '' });
      }

      const originalCols = new Map(original.columns.map((c) => [c.name, c]));
      for (const col of table.columns) {
        const originalCol = originalCols.get(col.name);
        if (!originalCol) continue;
        const newSamples = col.samplesText
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        const descChanged = col.description !== originalCol.description;
        const samplesChanged = JSON.stringify(newSamples) !== JSON.stringify(originalCol.samples);
        if (descChanged || samplesChanged) {
          const entry: SchemaMetadataPatchRequest['columnDescriptions'][number] = {
            table: table.name,
            column: col.name,
          };
          if (descChanged) entry.description = col.description ?? '';
          if (samplesChanged) entry.samples = newSamples;
          columnDescriptions.push(entry);
        }
      }
    }

    return { tableDescriptions, columnDescriptions };
  }

  copyForEditing(): void {
    const doc = this.document();
    if (!doc) return;
    this.copying.set(true);
    this.schemaMetadataService.copyDocument(doc.id).subscribe({
      next: (copy) => {
        this.copying.set(false);
        this.router.navigate(['/metadata', copy.id]);
      },
      error: () => this.copying.set(false),
    });
  }

  promote(): void {
    const doc = this.document();
    if (!doc) return;
    this.promoting.set(true);
    this.schemaMetadataService.promoteDocument(doc.id).subscribe({
      next: (updated) => {
        this.document.set(updated);
        this.promoting.set(false);
      },
      error: () => this.promoting.set(false),
    });
  }

  openDiffAgainstPrincipal(): void {
    const doc = this.document();
    if (!doc || doc.principal) return;
    this.loadingDiff.set(true);
    this.mode.set('diff');
    this.schemaMetadataService.listDocuments().subscribe({
      next: (docs) => {
        const principal = docs.find((d) => d.principal);
        if (!principal) {
          this.loadingDiff.set(false);
          return;
        }
        this.schemaMetadataService.getDocument(principal.id).subscribe({
          next: (fullPrincipal) => {
            const before = fullPrincipal.content ?? { tables: [] };
            const after = doc.content ?? { tables: [] };
            this.diff.set(diffSchemaMetadataContent(before, after));
            this.diffAgainstLabel.set(fullPrincipal.label ?? `Document ${fullPrincipal.id.slice(0, 8)}`);
            this.loadingDiff.set(false);
          },
          error: () => this.loadingDiff.set(false),
        });
      },
      error: () => this.loadingDiff.set(false),
    });
  }
}