import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SchemaService } from '../../core/services/schema.service';
import { TableDetailDto } from '../../core/models/schema.model';

@Component({
  selector: 'app-table-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './table-detail.component.html',
  styleUrl: './table-detail.component.scss',
})
export class TableDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private schemaService = inject(SchemaService);

  table = signal<TableDetailDto | null>(null);
  loading = signal(true);
  notFound = signal(false);

  ngOnInit(): void {
    // Navigating between two /schema/:name routes reuses this component instance (same route
    // config), so paramMap must be subscribed to, not just read once from the initial snapshot.
    this.route.paramMap.subscribe((params) => {
      const name = params.get('name');
      if (!name) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }
      this.loading.set(true);
      this.notFound.set(false);
      this.schemaService.getTable(name).subscribe({
        next: (table) => {
          this.table.set(table);
          this.loading.set(false);
        },
        error: () => {
          this.notFound.set(true);
          this.loading.set(false);
        },
      });
    });
  }

  typeLabel(dataType: string, maxLength: number | null): string {
    return maxLength ? `${dataType}(${maxLength})` : dataType;
  }
}