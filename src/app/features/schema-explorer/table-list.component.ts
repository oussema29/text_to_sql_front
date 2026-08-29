import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SchemaService } from '../../core/services/schema.service';
import { TableSummaryDto } from '../../core/models/schema.model';

@Component({
  selector: 'app-table-list',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './table-list.component.html',
  styleUrl: './table-list.component.scss',
})
export class TableListComponent implements OnInit, OnDestroy {
  private schemaService = inject(SchemaService);
  private router = inject(Router);

  tables = signal<TableSummaryDto[]>([]);
  loading = signal(false);
  searchTerm = '';
  private debounceHandle: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.fetchTables();
  }

  ngOnDestroy(): void {
    if (this.debounceHandle) clearTimeout(this.debounceHandle);
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