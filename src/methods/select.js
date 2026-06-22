/**
 * Purpose: SELECT Compilation Logic
 * Description: Maps table references and array criteria parameters securely into an executable framework schema.
 */

import { buildWhere } from '../core/queryBuilder.js';
import { formatColumns, sanitizeIdentifier } from '../utils/helpers.js';

export function compileSelect(dialect, table, columns, where = {}) {
  const cleanTable = sanitizeIdentifier(table);
  const escapedTable = dialect.escapeIdentifier(cleanTable);
  const columnString = formatColumns(columns, dialect);
  const { prefix, whereSuffix, querySuffix, params } = buildWhere(where, dialect);

  const query = `SELECT ${prefix}${columnString} FROM ${escapedTable}${whereSuffix}${querySuffix};`;
  return { query, params };
}