export interface MetaColumn {
  name: string;
  type: string;
  maxLength: number | null;
  nullable: boolean;
  samples: string[];
  description: string | null;
  descriptionSource: string | null;
}

export interface MetaForeignKey {
  column: string;
  referencesTable: string;
  referencesColumn: string;
}

export interface MetaTable {
  name: string;
  description: string | null;
  descriptionSource: string | null;
  columns: MetaColumn[];
  foreignKeys: MetaForeignKey[];
}

export interface SchemaMetadataContent {
  tables: MetaTable[];
}

export interface SchemaMetadataDocumentDto {
  id: string;
  createdAt: string;
  createdBy: string | null;
  parentDocumentId: string | null;
  label: string | null;
  promotedAt: string | null;
  principal: boolean;
  /** Omitted (null) on the list/summary form — only the detail fetch includes it. */
  content: SchemaMetadataContent | null;
}

export interface TableDescriptionPatch {
  table: string;
  description: string;
}

export interface ColumnDescriptionPatch {
  table: string;
  column: string;
  description?: string;
  samples?: string[];
}

export interface SchemaMetadataPatchRequest {
  tableDescriptions: TableDescriptionPatch[];
  columnDescriptions: ColumnDescriptionPatch[];
}

export type GenerationJobState = 'IN_PROGRESS' | 'DONE' | 'FAILED';

export interface GenerationJobStatus {
  jobId: string;
  status: GenerationJobState;
  startedAt: string | null;
  finishedAt: string | null;
  resultDocumentId: string | null;
  errorMessage: string | null;
}