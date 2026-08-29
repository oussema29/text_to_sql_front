export interface TableSummaryDto {
  name: string;
  description: string | null;
  columnCount: number;
}

export interface ColumnDto {
  name: string;
  dataType: string;
  maxLength: number | null;
  nullable: boolean;
  description: string | null;
  samples: string[];
}

export interface ForeignKeyDto {
  column: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface TableDetailDto {
  name: string;
  description: string | null;
  columns: ColumnDto[];
  foreignKeys: ForeignKeyDto[];
}