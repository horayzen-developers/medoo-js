/**
 * Purpose: Security Hardening & Feature Sanity Test Framework
 * Description: Verifies that malicious identifier vectors strictly abort execution, values map to parameters, 
 *              and newly added features (LIKE, ORDER, JOIN) compile flawlessly across different dialects.
 */

import assert from 'assert';
import { Medoo } from '../src/main.js';

async function runSecurityTests() {
  console.log('Beginning Security Isolation and Feature Checks...\n');

  const db = new Medoo({ type: 'mysql' });
  const maliciousTableName = 'users; DROP TABLE accounts; --';

  // Teste 1: Validação de Interrupção por Identificador Malicioso
  console.log('[Test 1] Testing identifier injection interception...');
  try {
    await db.select(maliciousTableName, ['id', 'username'], { status: 'active' });
    assert.fail('Security Vulnerability: Malicious identifier was not blocked!');
  } catch (err) {
    assert.match(err.message, /MedooJS Security Error/);
    console.log('✓ Security Check 1: Execution successfully aborted for dangerous identifier.');
  }

  // Teste 2: Validação de Parametrização de Valores (Prepared Statements)
  console.log('\n[Test 2] Testing dynamic criteria value parametrization...');
  const maliciousWhereValue = "' OR '1'='1";
  try {
    const res = await db.select('posts', '*', { author: maliciousWhereValue });
    assert.strictEqual(res.query, 'SELECT * FROM `posts` WHERE `author` = ?;');
    assert.strictEqual(res.params[0], maliciousWhereValue);
    console.log('✓ Security Check 2: Value injection safely isolated into parameters array.');
  } catch (err) {
    assert.fail(`Security Failure: Valid query parameters raised an unexpected error: ${err.message}`);
  }

  // Teste 3: Validação do Modificador [LIKE] e Segurança de Pontos (Tabelas Relacionais)
  console.log('\n[Test 3] Testing [LIKE] clause compile and relational dot parsing...');
  try {
    const res = await db.select('posts', ['posts.title', 'users.username'], {
      'posts.status': 'published',
      'users.name[LIKE]': '%admin%'
    });
    
    // Deve quebrar corretamente os identificadores por pontos e parametrizar o valor do LIKE
    assert.strictEqual(res.query, 'SELECT `posts`.`title`, `users`.`username` FROM `posts` WHERE `posts`.`status` = ? AND `users`.`name` LIKE ?;');
    assert.strictEqual(res.params[0], 'published');
    assert.strictEqual(res.params[1], '%admin%');
    console.log('✓ Feature Check 3: [LIKE] and table dot delimiters compiled cleanly and securely.');
  } catch (err) {
    assert.fail(`Failure in Test 3: ${err.message}`);
  }

  // Teste 4: Validação do JOIN Estilo Medoo (Deslocamento de Argumentos e Operadores)
  console.log('\n[Test 4] Testing Medoo-style JOIN parameter shifting and token maps...');
  try {
    const res = await db.select('posts', {
      '[>]users': { 'posts.author_id': 'users.id' }
		}, ['posts.id', 'users.username(author_name)'], { 'posts.status': 'active' });

    // Verifica o LEFT JOIN ([>]), a resolução do ON com pontos, e o alias da coluna formatada
    assert.strictEqual(res.query, 'SELECT `posts`.`id`, `users`.`username` AS `author_name` FROM `posts` LEFT JOIN `users` ON `posts`.`author_id` = `users`.`id` WHERE `posts`.`status` = ?;');
    assert.strictEqual(res.params[0], 'active');
    console.log('✓ Feature Check 4: Complex JOIN shifting, operator mapping, and aliases validated.');
  } catch (err) {
    assert.fail(`Failure in Test 4: ${err.message}`);
  }

  // Teste 5: Validação das Barreiras e Trava de Segurança de Dialeto (ORDER em Escrita)
  console.log('\n[Test 5] Testing dialect capability constraints for ORDER clause in write contexts...');
  
  // 5A: MySQL deve aceitar ORDER no UPDATE
  const mysqlDb = new Medoo({ type: 'mysql' });
  try {
    const res = await mysqlDb.update('posts', { status: 'archived' }, { 'status': 'draft', 'ORDER': 'id' });
    assert.match(res.query, /ORDER BY `id` ASC/);
    console.log('✓ Dialect Check 5A: MySQL allowed ORDER clause inside UPDATE query.');
  } catch (err) {
    assert.fail(`Failure in Test 5A: MySQL should support ORDER in write context. ${err.message}`);
  }

  // 5B: PostgreSQL deve abortar e lançar erro de suporte caso tentem usar ORDER no UPDATE
  const postgresDb = new Medoo({ type: 'postgresql' });
  try {
    await postgresDb.update('posts', { status: 'archived' }, { 'status': 'draft', 'ORDER': 'id' });
    assert.fail('Security/Support Vulnerability: PostgreSQL allowed unsupported ORDER clause in UPDATE context!');
  } catch (err) {
    assert.match(err.message, /MedooJS Support Error/);
    console.log('✓ Dialect Check 5B: PostgreSQL successfully aborted execution for unsupported write ORDER constraint.');
  }

  console.log('\nAll core security and feature unit test checks completed successfully.');
}

try {
  await runSecurityTests();
} catch (err) {
  console.error('\nSecurity verification check trace failure:', err.message);
  process.exit(1);
}