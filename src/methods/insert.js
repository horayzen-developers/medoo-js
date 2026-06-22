/**
 * Purpose: Secure Record Insertion Compiler
 * Description: Generates parameters schemas mapping inputs safely via structured array positions.
 */

import { buildQueryState } from '../core/queryBuilder.js';
import { sanitizeIdentifier } from '../utils/helpers.js';

export function compileInsert(dialect, table, data) {
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    throw new Error('MedooJS Error: Insert payload structure maps empty entries list.');
  }

  const cleanTable = sanitizeIdentifier(table);
  const escapedTable = dialect.escapeIdentifier(cleanTable);
  const state = buildQueryState(dialect);
  
  const columns = Object.keys(data).map(col => sanitizeIdentifier(col)).filter(col => col.length > 0);
  const escapedColumns = columns.map(col => dialect.escapeIdentifier(col)).join(', ');
  const placeholders = columns.map(col => state.addParam(data[col])).join(', ');

  const query = `INSERT INTO ${escapedTable} (${escapedColumns}) VALUES (${placeholders});`;
  return { query, params: state.params };
}