/**
 * Purpose: Secure UPDATE Compilation Logic
 * Description: Assembles mutation workflows pairing assignments and constraint lists cleanly.
 */

import { buildWhere, buildQueryState } from '../core/queryBuilder.js';
import { sanitizeIdentifier } from '../utils/helpers.js';

export function compileUpdate(dialect, table, data, where = {}) {
  const cleanTable = sanitizeIdentifier(table);
  const escapedTable = dialect.escapeIdentifier(cleanTable);
  const state = buildQueryState(dialect);
  const assignments = [];

  for (const key of Object.keys(data)) {
    const cleanKey = sanitizeIdentifier(key);
    if (!cleanKey) continue;
    const escapedKey = dialect.escapeIdentifier(cleanKey);
    const placeholder = state.addParam(data[key]);
    assignments.push(`${escapedKey} = ${placeholder}`);
  }

  const { whereSuffix, params: whereParams } = buildWhere(where, dialect);
  const query = `UPDATE ${escapedTable} SET ${assignments.join(', ')}${whereSuffix};`;

  return { query, params: [...state.params, ...whereParams] };
}