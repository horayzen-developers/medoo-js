/**
 * Purpose: Client Auto-Wiring & Advanced Query Engine Sandbox Demonstration
 * Description: Validates multi-case setup routines, testing driver instances mapping behaviors,
 *              relational JOIN structures, token modifiers, and strict column aliasing.
 */

import Medoo from '../src/main.js';

async function demonstrateSmartExecution() {
  console.log('===========================================================');
  console.log('    MedooJS v1.1.0 - Advanced Auto-Wiring Sandbox Run     ');
  console.log('===========================================================\n');

  // ===========================================================================
  // CENÁRIO A: Instância de Driver Injetada (Simulando pool do mysql2)
  // ===========================================================================
  const fakeMysqlPoolInstance = {
    async execute(sql, params) {
      console.log(`\x1b[33m[Mock MySQL Driver received]\x1b[0m`);
      console.log(`  SQL:    ${sql}`);
      console.log(`  Params: ${JSON.stringify(params)}`);
      
      // Simula o retorno bruto do driver mysql2: [ linhas, colunas ]
      return [[{ id: 42, author_name: 'John Doe', post_title: 'MedooJS Architecture' }], null];
    }
  };

  const dbMySQL = new Medoo({
    type: 'mysql',
    exec: fakeMysqlPoolInstance // MedooJS auto-detecta o método .execute()
  });

  console.log('\x1b[1m[Scenario A] - Testing Medoo-style JOIN with Column Aliases & WHERE criteria\x1b[0m');
  
  // Executando uma query relacional avançada com deslocamento de argumentos
  const postData = await dbMySQL.select(
    'posts', 
    { '[>]users': { 'posts.author_id': 'users.id' } }, // LEFT JOIN
    ['posts.id', 'posts.title(post_title)', 'users.username(author_name)'], // Aliases nativos do Medoo
    { 
      'posts.status': 'published',
      'posts.title[LIKE]': '%Architecture%' // Modificador LIKE
    }
  );

  console.log('\x1b[32m✓ Hydrated Output A:\x1b[0m', postData);
  console.log('\n-----------------------------------------------------------\n');

  // ===========================================================================
  // CENÁRIO B: Função de Callback Customizada (Simulando driver pg)
  // ===========================================================================
  const dbPostgres = new Medoo({
    type: 'postgresql',
    exec: async (sql, params) => {
      console.log(`\x1b[36m[Custom Postgres Function received]\x1b[0m`);
      console.log(`  SQL:    ${sql}`);
      console.log(`  Params: ${JSON.stringify(params)}`);
      
      // Simula o retorno de registro único do método .get()
      return [{ id: 101, username: 'john_doe', role: 'admin' }];
    }
  });

  console.log('\x1b[1m[Scenario B] - Testing Single Entity Read (GET Compiler) with LIMIT 1\x1b[0m');
  
  // O método get precisa injetar implicitamente o LIMIT 1 respeitando o dialeto
  const singleUser = await dbPostgres.get(
    'users', 
    ['id', 'username', 'role'], 
    { 'status': 'active' }
  );

  console.log('\x1b[32m✓ Hydrated Output B:\x1b[0m', singleUser);
  console.log('\n-----------------------------------------------------------\n');
}

// Inicializa a demonstração do ecossistema
demonstrateSmartExecution().catch(console.error);