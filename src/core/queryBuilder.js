/**
 * Purpose: Secure Query Compilation Framework with LIKE and ORDER capabilities
 * Description: Assembles SQL blueprints safely using parameter placeholder generation matrices and dialect compatibility constraints.
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

// ... manter buildQueryState igual ...

export function buildWhere(where, dialect, context = 'SELECT') {
  if (!where || typeof where !== 'object' || Object.keys(where).length === 0) {
    return { prefix: '', whereSuffix: '', querySuffix: '', params: [] };
  }

  const state = buildQueryState(dialect);
  const conditions = [];
  let limitVal = null;
  let orderVal = null;

  for (const key of Object.keys(where)) {
    const upperKey = key.toUpperCase();

    if (upperKey === 'LIMIT') {
      limitVal = parseInt(where[key], 10);
      continue;
    }

    if (upperKey === 'ORDER') {
      if (context !== 'SELECT' && typeof dialect.supportsOrderInWrite === 'function' && !dialect.supportsOrderInWrite(context)) {
        throw new Error(`MedooJS Support Error: ORDER BY clause inside ${context} operations is not supported by the current dialect '${dialect.type}'.`);
      }
      orderVal = where[key];
      continue;
    }

    const value = where[key];

    // Tratamento de LIKE com suporte a tabelas relacionais (com ponto '.')
    if (key.endsWith('[LIKE]')) {
      const rawKey = key.replace('[LIKE]', '');
      // Divide por ponto caso seja "tabela.coluna"
      const escapedKey = rawKey.split('.').map(part => dialect.escapeIdentifier(sanitizeIdentifier(part))).join('.');
      
      const placeholder = state.addParam(value);
      conditions.push(`${escapedKey} LIKE ${placeholder}`);
      continue;
    }

    // Mapeamento padrão de igualdade com suporte a tabelas relacionais (com ponto '.')
    const escapedKey = key.split('.').map(part => dialect.escapeIdentifier(sanitizeIdentifier(part))).join('.');
    const placeholder = state.addParam(value);
    conditions.push(`${escapedKey} = ${placeholder}`);
  }

  let baseWhereSql = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';

  if (orderVal) {
    baseWhereSql += compileOrderClause(orderVal, dialect);
  }
  
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

function compileOrderClause(orderOption, dialect) {
  let sql = ' ORDER BY ';

  const escapeColumn = (col) => {
    return col.split('.').map(part => dialect.escapeIdentifier(sanitizeIdentifier(part))).join('.');
  };

  if (typeof orderOption === 'string') {
    return sql + `${escapeColumn(orderOption)} ASC`;
  }

  if (Array.isArray(orderOption)) {
    const segments = orderOption.map(col => `${escapeColumn(col)} ASC`);
    return sql + segments.join(', ');
  }

  if (typeof orderOption === 'object') {
    const segments = Object.entries(orderOption).map(([col, direction]) => {
      const dir = direction.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      return `${escapeColumn(col)} ${dir}`;
    });
    return sql + segments.join(', ');
  }

  return '';
}