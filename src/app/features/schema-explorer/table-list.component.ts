import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SchemaService } from '../../core/services/schema.service';
import { ReindexStatus, TableSummaryDto } from '../../core/models/schema.model';

@Component({
  selector: 'app-table-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './table-list.component.html',
  styleUrl: './table-list.component.scss',
})
export class TableListComponent implements OnInit, OnDestroy {
  private schemaService = inject(SchemaService);
  private auth = inject(AuthService);
  private router = inject(Router);

  isAdmin = computed(() => this.auth.isAdmin());

  tables = signal<TableSummaryDto[]>([]);
  loading = signal(false);
  searchTerm = '';
  private debounceHandle: ReturnType<typeof setTimeout> | null = null;

  reindexStatus = signal<ReindexStatus | null>(null);
  reindexTriggering = signal(false);
  reindexMessage = signal<string | null>(null);
  private pollHandle: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.fetchTables();
    if (this.isAdmin()) {
      this.schemaService.getReindexStatus().subscribe({
        next: (status) => this.reindexStatus.set(status),
        error: () => {},
      });
    }
  }

  ngOnDestroy(): void {
    if (this.debounceHandle) clearTimeout(this.debounceHandle);
    if (this.pollHandle) clearTimeout(this.pollHandle);
  }

  triggerReindex(): void {
    this.reindexTriggering.set(true);
    this.reindexMessage.set(null);
    this.schemaService.triggerReindex().subscribe({
      next: () => {
        this.reindexTriggering.set(false);
        this.pollReindexStatus();
      },
      error: (err) => {
        this.reindexTriggering.set(false);
        if (err.status === 409) {
          this.reindexMessage.set('Une réindexation est déjà en cours.');
          this.pollReindexStatus();
        } else {
          this.reindexMessage.set('Échec du déclenchement de la réindexation.');
        }
      },
    });
  }

  private pollReindexStatus(): void {
    this.schemaService.getReindexStatus().subscribe({
      next: (status) => {
        this.reindexStatus.set(status);
        if (status.attemptStatus === 'IN_PROGRESS') {
          this.pollHandle = setTimeout(() => this.pollReindexStatus(), 3000);
        }
      },
      error: () => {},
    });
  }

  formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  onSearchInput(): void {
    if (this.debounceHandle) clearTimeout(this.debounceHandle);
    this.debounceHandle = setTimeout(() => this.fetchTables(), 300);
  }

  private fetchTables(): void {
    this.loading.set(true);
    this.schemaService.listTables(this.searchTerm.trim() || undefined).subscribe({
      next: (tables) => {
        this.tables.set(tables);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openTable(name: string): void {
    this.router.navigate(['/schema', name]);
  }
}