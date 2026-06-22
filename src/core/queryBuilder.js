/**
 * Purpose: Secure Query Compilation Framework
 * Description: Assembles SQL blueprints safely using parameter placeholder generation matrices.
 */

import { sanitizeIdentifier } from '../utils/helpers.js';

export function buildQueryState(dialect) {
  return {
    paramIndex: 0,
    params: [],
    addParam(value) {
      const placeholder = dialect.getPlaceholder(this.paramIndex);
      this.params.push(value);
      this.paramIndex++;
      return placeholder;
    }
  };
}

export function buildWhere(where, dialect) {
  if (!where || typeof where !== 'object' || Object.keys(where).length === 0) {
    return { prefix: '', whereSuffix: '', querySuffix: '', params: [] };
  }

  const state = buildQueryState(dialect);
  const conditions = [];
  let limitVal = null;

  for (const key of Object.keys(where)) {
    if (key.toUpperCase() === 'LIMIT') {
      limitVal = parseInt(where[key], 10);
      continue;
    }

    const value = where[key];
    // Rigid injection containment layer applied directly to target evaluating keys
    const cleanKey = sanitizeIdentifier(key);
    if (!cleanKey) continue;

    const escapedKey = dialect.escapeIdentifier(cleanKey);
    const placeholder = state.addParam(value);
    conditions.push(`${escapedKey} = ${placeholder}`);
  }

  let baseWhereSql = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
  
  if (limitVal !== null && !isNaN(limitVal)) {
    const limitResult = dialect.applyLimit(limitVal, baseWhereSql);
    return {
      prefix: limitResult.prefix,
      whereSuffix: limitResult.whereSuffix,
      querySuffix: limitResult.querySuffix,
      params: state.params
    };
  }

  return { prefix: '', whereSuffix: baseWhereSql, querySuffix: '', params: state.params };
}