/**
 * Purpose: Secure Deletion Compilation
 * Description: Sets up record purge operations under sanitized key spaces cleanly.
 */

import { buildWhere } from '../core/queryBuilder.js';
import { sanitizeIdentifier } from '../utils/helpers.js';

export function compileDelete(dialect, table, where = {}) {
  const cleanTable = sanitizeIdentifier(table);
  const escapedTable = dialect.escapeIdentifier(cleanTable);
  const { whereSuffix, params } = buildWhere(where, dialect, 'DELETE');

  const query = `DELETE FROM ${escapedTable}${whereSuffix};`;
  return { query, params };
}