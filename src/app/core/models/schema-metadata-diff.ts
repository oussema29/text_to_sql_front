import { SchemaMetadataContent } from './schema-metadata.model';

export interface ColumnDiff {
  column: string;
  descriptionBefore: string | null;
  descriptionAfter: string | null;
  samplesBefore: string[];
  samplesAfter: string[];
}

export interface TableDiff {
  table: string;
  descriptionBefore: string | null;
  descriptionAfter: string | null;
  columnsAdded: string[];
  columnsRemoved: string[];
  columnsChanged: ColumnDiff[];
}

export interface ContentDiff {
  tablesAdded: string[];
  tablesRemoved: string[];
  tablesChanged: TableDiff[];
}

/** Front-end-only field-level diff, per front_end_preparation.md's "Schema Metadata representation"
 *  section — no backend diff endpoint exists or is needed, the front end already holds both
 *  documents' full content once fetched for preview/edit. */
export function diffSchemaMetadataContent(
  before: SchemaMetadataContent,
  after: SchemaMetadataContent
): ContentDiff {
  const beforeByName = new Map(before.tables.map((t) => [t.name, t]));
  const afterByName = new Map(after.tables.map((t) => [t.name, t]));

  const tablesAdded = [...afterByName.keys()].filter((n) => !beforeByName.has(n));
  const tablesRemoved = [...beforeByName.keys()].filter((n) => !afterByName.has(n));
  const tablesChanged: TableDiff[] = [];

  for (const [name, beforeTable] of beforeByName) {
    const afterTable = afterByName.get(name);
    if (!afterTable) continue;

    const colsBefore = new Map(beforeTable.columns.map((c) => [c.name, c]));
    const colsAfter = new Map(afterTable.columns.map((c) => [c.name, c]));
    const columnsAdded = [...colsAfter.keys()].filter((n) => !colsBefore.has(n));
    const columnsRemoved = [...colsBefore.keys()].filter((n) => !colsAfter.has(n));
    const columnsChanged: ColumnDiff[] = [];

    for (const [colName, cb] of colsBefore) {
      const ca = colsAfter.get(colName);
      if (!ca) continue;
      const descChanged = cb.description !== ca.description;
      const samplesChanged = JSON.stringify(cb.samples) !== JSON.stringify(ca.samples);
      if (descChanged || samplesChanged) {
        columnsChanged.push({
          column: colName,
          descriptionBefore: cb.description,
          descriptionAfter: ca.description,
          samplesBefore: cb.samples,
          samplesAfter: ca.samples,
        });
      }
    }

    const tableDescChanged = beforeTable.description !== afterTable.description;
    if (tableDescChanged || columnsAdded.length || columnsRemoved.length || columnsChanged.length) {
      tablesChanged.push({
        table: name,
        descriptionBefore: beforeTable.description,
        descriptionAfter: afterTable.description,
        columnsAdded,
        columnsRemoved,
        columnsChanged,
      });
    }
  }

  return { tablesAdded, tablesRemoved, tablesChanged };
}