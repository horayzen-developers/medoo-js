/**
 * Purpose: Single Entity Read Compiler
 * Description: Wraps query outputs restricting bounds to individual row returns.
 */

import { compileSelect } from './select.js';

export function compileGet(dialect, table, columns, where = {}) {
  const localWhere = { ...where, LIMIT: 1 };
  return compileSelect(dialect, table, columns, localWhere);
}