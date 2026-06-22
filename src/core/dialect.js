/**
 * Purpose: Dialect Strategy Layer
 * Description: Manages identifier enclosing syntax and binds execution routing rules for target databases.
 */

import { sanitizeIdentifier } from '../utils/helpers.js';

export const DIALECTS = {
  MYSQL: 'mysql',
  MARIADB: 'mariadb',
  POSTGRESQL: 'postgresql',
  SQLITE: 'sqlite',
  MSSQL: 'mssql',
  ORACLE: 'oracle',
  SYBASE: 'sybase'
};

export class Dialect {
  constructor(type = 'mysql') {
    this.type = type.toLowerCase();
  }

  /**
   * Encloses a pre-sanitized database entity identifier name in dialect-safe markers.
   * @param {string} identifier - Internal structural entity label string.
   * @returns {string} Secure, escaped dialect string identifier.
   */
  escapeIdentifier(identifier) {
    if (identifier === '*') return '*';
    const clean = sanitizeIdentifier(identifier);
    
    switch (this.type) {
      case DIALECTS.POSTGRESQL:
      case DIALECTS.ORACLE:
        return `"${clean}"`;
      case DIALECTS.MSSQL:
        return `[${clean}]`;
      case DIALECTS.MYSQL:
      case DIALECTS.MARIADB:
      case DIALECTS.SQLITE:
      case DIALECTS.SYBASE:
      default:
        return `\`${clean}\``;
    }
  }

  getPlaceholder(index) {
    switch (this.type) {
      case DIALECTS.POSTGRESQL:
        return `$${index + 1}`;
      case DIALECTS.ORACLE:
        return `:${index + 1}`;
      default:
        return '?';
    }
  }

  applyLimit(limitVal, whereAndConditionsSql) {
    const result = { prefix: '', whereSuffix: whereAndConditionsSql, querySuffix: '' };
    switch (this.type) {
      case DIALECTS.MSSQL:
        result.prefix = `TOP (${limitVal}) `;
        break;
      case DIALECTS.ORACLE:
        result.querySuffix = ` FETCH FIRST ${limitVal} ROWS ONLY`;
        break;
      default:
        result.querySuffix = ` LIMIT ${limitVal}`;
        break;
    }
    return result;
  }
}