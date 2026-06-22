/**
 * Purpose: Security Validation & Formatting Utilities
 * Description: Implements strict structural checking for identifiers to block SQL injection and formats projection tokens.
 */

/**
 * Validates names used for tables or columns.
 * Se encontrar qualquer caractere de quebra de comando, aspas ou operadores de comentário,
 * lança um erro imediatamente e interrompe a execução do programa.
 * @param {string} name - Raw identifier target input string.
 * @returns {string} The validated identifier name if safe.
 * @throws {Error} If the identifier contains illegal or dangerous characters.
 */
export function sanitizeIdentifier(name) {
  if (typeof name !== 'string') return '';
  
  const trimmed = name.trim();
  
  // Expressão regular que detecta qualquer caractere perigoso:
  // Pontos e vírgulas, quebras de linha, comentários (-- ou #), aspas (', ", `), barras ou espaços extras suspeitos.
  const dangerousCharRegex = /[\0\n\r\b\t;`'"\\\]\[#\/\*]|\-\-/;
  
  if (dangerousCharRegex.test(trimmed)) {
    throw new Error(`MedooJS Security Error: Illegal characters detected in identifier name "${trimmed}". Execution aborted.`);
  }

  return trimmed;
}

/**
 * Normalizes lists of columns into clean escaped syntax blocks after strict validation.
 * @param {string|string[]} columns - Selected targets or wildcard asset.
 * @param {Object} dialect - Internal active dialect schema map helper.
 * @returns {string} Sanitized select projection fragment string.
 */
export function formatColumns(columns, dialect) {
  if (!columns || columns === '*') return '*';
  if (typeof columns === 'string') {
    const clean = sanitizeIdentifier(columns);
    return clean ? dialect.escapeIdentifier(clean) : '*';
  }
  if (Array.isArray(columns)) {
    return columns
      .map(col => sanitizeIdentifier(col))
      .filter(col => col.length > 0)
      .map(col => dialect.escapeIdentifier(col))
      .join(', ');
  }
  return '*';
}