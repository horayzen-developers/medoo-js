/**
 * Purpose: Intelligent Adaptable Core Client Orchestrator
 * Description: Evaluates exec types (function vs driver instance) to apply default query runners dynamically.
 */

import { Dialect } from './dialect.js';
import { compileSelect } from '../methods/select.js';
import { compileGet } from '../methods/get.js';
import { compileInsert } from '../methods/insert.js';
import { compileUpdate } from '../methods/update.js';
import { compileDelete } from '../methods/delete.js';

export class Medoo {
  constructor(config = {}) {
    if (!config.type) {
      throw new Error("MedooJS Error: Property config field 'type' tracking system targets is required.");
    }
    
    this.dialect = new Dialect(config.type);
    this.runtimeExecutor = null;

    if (config.exec) {
      if (typeof config.exec === 'function') {
        // Option Case A: Standard Explicit Functional Callback Delegate Wrapper
        this.runtimeExecutor = config.exec;
      } else if (typeof config.exec === 'object') {
        // Option Case B: Native Connected Driver Instanced Pipeline Automation Auto-Wiring
        this.runtimeExecutor = this._resolveAutoDriverExecutor(config.type, config.exec);
      }
    }

    // Default Fallback Driverless Compilation Logging Mock Interface
    if (!this.runtimeExecutor) {
      this.runtimeExecutor = async (query, params) => ({ query, params, info: 'Driverless dry-run output compiled.' });
    }
  }

  /**
   * Evaluates driver structures dynamically at instance initialization to bind accurate execution patterns.
   * @param {string} type - Engine type string value descriptor.
   * @param {Object} instance - Active structural network client class link target.
   * @returns {Function} Standardized execution handler pipeline.
   */
  _resolveAutoDriverExecutor(type, instance) {
    const targetType = type.toLowerCase();

    // 1. Target Engine Category: MySQL/MariaDB Core (mysql2)
    if (targetType === 'mysql' || targetType === 'mariadb') {
      if (typeof instance.execute === 'function') {
        return async (query, params) => {
          const [rows] = await instance.execute(query, params);
          return rows;
        };
      }
    }

    // 2. Target Engine Category: PostgreSQL Ecosystem Core (pg)
    if (targetType === 'postgresql') {
      if (typeof instance.query === 'function') {
        return async (query, params) => {
          const res = await instance.query(query, params);
          return res.rows;
        };
      }
    }

    // 3. Target Engine Category: Embedded Local Structures Core (sqlite3)
    if (targetType === 'sqlite') {
      if (typeof instance.all === 'function') {
        return new Promise((resolve, reject) => {
          return async (query, params) => {
            instance.all(query, params, (err, rows) => {
              if (err) return reject(err);
              resolve(rows);
            });
          };
        });
      }
    }

    // Unrecognized or complex driver signature layout fallback definition
    throw new Error(`MedooJS Error: The execution instance provided doesn't map standard signatures for dialect type: '${type}'.`);
  }

  async select(table, columns, where) {
    const payload = compileSelect(this.dialect, table, columns, where);
    return this.runtimeExecutor(payload.query, payload.params);
  }

  async get(table, columns, where) {
    const payload = compileGet(this.dialect, table, columns, where);
    return this.runtimeExecutor(payload.query, payload.params);
  }

  async insert(table, data) {
    const payload = compileInsert(this.dialect, table, data);
    return this.runtimeExecutor(payload.query, payload.params);
  }

  async update(table, data, where) {
    const payload = compileUpdate(this.dialect, table, data, where);
    return this.runtimeExecutor(payload.query, payload.params);
  }

  async delete(table, where) {
    const payload = compileDelete(this.dialect, table, where);
    return this.runtimeExecutor(payload.query, payload.params);
  }
}