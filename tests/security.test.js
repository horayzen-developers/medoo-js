/**
 * Purpose: Security Hardening Sanity Test Framework
 * Description: Verifies that malicious identifier vectors strictly abort execution and values map to parameters.
 */

import assert from 'assert';
import { Medoo } from '../src/index.js';

async function runSecurityTests() {
  console.log('Beginning Security Isolation Checks...\n');

  const db = new Medoo({ type: 'mysql' });
  const maliciousTableName = 'users; DROP TABLE accounts; --';

  // Teste 1: Validação de Interrupção por Identificador Malicioso
  console.log('[Test 1] Testing identifier injection interception...');
  try {
    // Tentativa de executar um SELECT passando um comando injetado no nome da tabela
    await db.select(maliciousTableName, ['id', 'username'], { status: 'active' });
    
    // Se chegar aqui, significa que a query não abortou, o que indica uma falha de segurança
    assert.fail('Security Vulnerability: Malicious identifier was not blocked!');
  } catch (err) {
    // O teste passa se capturarmos o erro estrito lançado pelo nosso validador
    assert.match(err.message, /MedooJS Security Error/);
    console.log('✓ Security Check 1: Execution successfully aborted for dangerous identifier.');
  }

  // Teste 2: Validação de Parametrização de Valores (Prepared Statements)
  console.log('\n[Test 2] Testing dynamic criteria value parametrization...');
  const maliciousWhereValue = "' OR '1'='1";
  
  try {
    // O executor mock apenas nos devolve a query gerada e os parâmetros associados
    const res = await db.select('posts', '*', { author: maliciousWhereValue });
    
    // O comando perigoso deve ficar confinado de forma segura como dado dentro do array de parâmetros, nunca na query de texto
    assert.strictEqual(res.query, 'SELECT * FROM `posts` WHERE `author` = ?;');
    assert.strictEqual(res.params[0], maliciousWhereValue);
    console.log('✓ Security Check 2: Value injection safely isolated into parameters array.');
  } catch (err) {
    assert.fail(`Security Failure: Valid query parameters raised an unexpected error: ${err.message}`);
  }

  console.log('\nAll core security unit test checks completed.');
}

try {
  await runSecurityTests();
} catch (err) {
  console.error('\nSecurity verification check trace failure:', err.message);
  process.exit(1);
}