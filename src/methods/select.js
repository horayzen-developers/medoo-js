/**
 * Purpose: SELECT Compilation Logic with Multi-Table JOIN Pipelines
 * Description: Maps table references, optional complex JOIN matrices, and array criteria parameters securely into an executable framework schema.
 */

import { buildWhere } from '../core/queryBuilder.js';
import { formatColumns, sanitizeIdentifier } from '../utils/helpers.js';

export function compileSelect(dialect, table, ...args) {
  const cleanTable = sanitizeIdentifier(table);
  const escapedTable = dialect.escapeIdentifier(cleanTable);

  let join = null;
  let columns = '*';
  let where = {};

  const hasJoin = args[0] && typeof args[0] === 'object' && Object.keys(args[0]).some(k => k.startsWith('['));

  if (hasJoin) {
    join = args[0];
    columns = args[1] || '*';
    where = args[2] || {};
  } else {
    columns = args[0] || '*';
    where = args[1] || {};
  }

  const columnString = formatColumns(columns, dialect);
  
  // 1. Processa a cláusula JOIN primeiro se ela existir
  let joinSql = '';
  if (join) {
    joinSql = compileJoinClause(join, dialect);
  }

  // 2. Compila o WHERE coletando os prefixos e sufixos baseados no dialeto
  const { prefix, whereSuffix, querySuffix, params } = buildWhere(where, dialect, 'SELECT');

  // 3. Montagem Estrita da Arquitetura SQL:
  // - ${prefix} entra antes das colunas (Ex: SELECT TOP (10) `id` ...)
  // - ${joinSql} entra colado na tabela de origem (Ex: FROM `posts` INNER JOIN `users` ...)
  // - ${whereSuffix} injeta as condições unificadas e ordenações (Ex: WHERE ... ORDER BY ...)
  // - ${querySuffix} encerra as travas do motor de paginação (Ex: ... FETCH FIRST 10 ROWS ONLY)
  const query = `SELECT ${prefix}${columnString} FROM ${escapedTable}${joinSql}${whereSuffix}${querySuffix};`;
  
  return { query, params };
}

function compileJoinClause(join, dialect) {
  let joinString = '';
  
  // Mapeamento corrigido estritamente de acordo com a especificação do Medoo original
  const joinMap = {
    '[>]': 'LEFT JOIN',
    '[<]': 'RIGHT JOIN',
    '[<>]': 'FULL JOIN',
    '[><]': 'INNER JOIN'
  };

  const escapeColumn = (col) => {
    return col.split('.').map(part => dialect.escapeIdentifier(sanitizeIdentifier(part))).join('.');
  };

  for (const [key, value] of Object.entries(join)) {
    // Regex ajustada para capturar os colchetes opcionais no início da string da chave, ex: "[>]users"
    const match = key.match(/^(\[>\]|\[<\]|\[<>\]|\[><\])?(.+)$/);
    if (!match) continue;

    const operator = match[1] || '[><]'; // Se omitido, o Medoo assume INNER JOIN ([><])
    const targetTable = sanitizeIdentifier(match[2]);
    const sqlOperator = joinMap[operator] || 'INNER JOIN';
    
    const escapedTarget = dialect.escapeIdentifier(targetTable);

    if (typeof value === 'string') {
      // Caso simplificado usando a cláusula USING: "[>]users": "id"
      const escapedCol = dialect.escapeIdentifier(sanitizeIdentifier(value));
      joinString += ` ${sqlOperator} ${escapedTarget} USING (${escapedCol})`;
    } else if (typeof value === 'object') {
      // Caso explícito usando a cláusula ON: "[>]users": { "posts.author_id": "users.id" }
      const [fromCol, toCol] = Object.entries(value)[0];
      
      const escapedFrom = escapeColumn(fromCol);
      const escapedTo = escapeColumn(toCol);
      
      joinString += ` ${sqlOperator} ${escapedTarget} ON ${escapedFrom} = ${escapedTo}`;
    }
  }

  return joinString;
}