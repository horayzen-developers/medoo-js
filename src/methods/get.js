/**
 * Purpose: Single Entity Read Compiler with JOIN support
 * Description: Intercepts dynamic argument blocks to inject structural bounds restricting outputs to individual row returns.
 */

import { compileSelect } from './select.js';

export function compileGet(dialect, table, ...args) {
  let join = null;
  let columns = '*';
  let where = {};

  // Mapeia a assinatura dinâmica exatamente igual ao select
  const hasJoin = args[0] && typeof args[0] === 'object' && Object.keys(args[0]).some(k => k.startsWith('['));

  if (hasJoin) {
    join = args[0];
    columns = args[1] || '*';
    where = args[2] || {};
  } else {
    columns = args[0] || '*';
    where = args[1] || {};
  }

  // Garante a imutabilidade criando uma cópia e força o limite de 1 registro para o comportamento do GET
  const localWhere = { ...where, LIMIT: 1 };

  // Devolve o payload remontando a chamada com ou sem JOIN de forma transparente para o compileSelect
  if (join) {
    return compileSelect(dialect, table, join, columns, localWhere);
  }

  return compileSelect(dialect, table, columns, localWhere);
}