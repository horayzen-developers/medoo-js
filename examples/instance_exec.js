/**
 * Purpose: Client Auto-Wiring Integration Sandbox Demonstration
 * Description: Validates multi-case setup routines checking driver instances mapping behaviors.
 */

import { Medoo } from '../src/index.js';

async function demonstrateSmartExecution() {
  console.log('=== MedooJS Auto-Wiring Runtime Evaluation ===\n');

  // Case A: Testing direct dynamic instance object interception simulation (e.g., mysql2 pool class)
  const fakeMysqlPoolInstance = {
    async execute(sql, params) {
      console.log(` -> [Mock Driver executed query]: ${sql}`);
      return [[{ id: 101, username: 'automated_wiring_test' }], null];
    }
  };

  const dbFromInstance = new Medoo({
    type: 'mysql',
    exec: fakeMysqlPoolInstance // MedooJS auto-detects .execute() pattern
  });

  console.log('[Execution Scenario A] - Passing Live Instance Class Link:');
  const user = await dbFromInstance.get('users', ['id', 'username'], { id: 101 });
  console.log('Result extracted:', user);

  // Case B: Testing continuous custom callback delegate routine matching classical patterns
  const dbFromFunction = new Medoo({
    type: 'postgresql',
    exec: async (sql, params) => {
      console.log(` -> [Custom Function intercepting query]: ${sql}`);
      return [{ custom_flag: true }];
    }
  });

  console.log('\n[Execution Scenario B] - Passing Isolated Custom Functional Runner:');
  const items = await dbFromFunction.select('items', '*', { active: 1 });
  console.log('Result extracted:', items);
}

demonstrateSmartExecution();