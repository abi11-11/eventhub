/**
 * Mock Database for Integration Tests
 * Provides in-memory database simulation with full Knex.js pattern support
 */

const { EventEmitter } = require('events');

// In-memory storage
const storage = {
  users: new Map(),
  events: new Map(),
  bookings: new Map(),
  reviews: new Map(),
  tokens: new Map(),
};

class MockQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.whereConditions = [];
    this.insertData = null;
    this.updateData = null;
    this.selectFields = ['*'];
    this.joinedTables = [];
    this.orderByInfo = null;
    this.limitInfo = null;
    this.offsetInfo = null;
  }

  where(column, operator, value) {
    // Handle where(column, value) and where(column, operator, value)
    if (arguments.length === 2) {
      this.whereConditions.push({ column, operator: '=', value: operator });
    } else {
      this.whereConditions.push({ column, operator, value });
    }
    return this;
  }

  orWhere(column, operator, value) {
    // Mock orWhere support
    if (arguments.length === 2) {
      this.whereConditions.push({ column, operator: '=', value: operator, logic: 'OR' });
    } else {
      this.whereConditions.push({ column, operator, value, logic: 'OR' });
    }
    return this;
  }

  whereIn(column, values) {
    this.whereConditions.push({ column, operator: 'IN', value: values });
    return this;
  }

  whereNotIn(column, values) {
    this.whereConditions.push({ column, operator: 'NOT IN', value: values });
    return this;
  }

  whereNull(column) {
    this.whereConditions.push({ column, operator: 'IS NULL', value: null });
    return this;
  }

  whereNotNull(column) {
    this.whereConditions.push({ column, operator: 'IS NOT NULL', value: null });
    return this;
  }

  whereBetween(column, range) {
    this.whereConditions.push({ column, operator: 'BETWEEN', value: range });
    return this;
  }

  first() {
    const table = storage[this.tableName] || new Map();
    
    for (let [key, record] of table) {
      if (this._matchesConditions(record)) {
        return Promise.resolve(record);
      }
    }
    
    return Promise.resolve(null);
  }

  select(fields) {
    this.selectFields = Array.isArray(fields) ? fields : [fields];
    return this;
  }

  orderBy(column, direction = 'asc') {
    this.orderByInfo = { column, direction };
    return this;
  }

  limit(count) {
    this.limitInfo = count;
    return this;
  }

  offset(count) {
    this.offsetInfo = count;
    return this;
  }

  then(onFulfilled, onRejected) {
    // Support Promise-like behavior for async operations
    return this._execute().then(onFulfilled, onRejected);
  }

  _matchesConditions(record) {
    for (let condition of this.whereConditions) {
      const recordValue = record[condition.column];
      
      if (condition.operator === '=') {
        if (recordValue !== condition.value) return false;
      } else if (condition.operator === '!=') {
        if (recordValue === condition.value) return false;
      } else if (condition.operator === '>') {
        if (!(recordValue > condition.value)) return false;
      } else if (condition.operator === '<') {
        if (!(recordValue < condition.value)) return false;
      } else if (condition.operator === '>=') {
        if (!(recordValue >= condition.value)) return false;
      } else if (condition.operator === '<=') {
        if (!(recordValue <= condition.value)) return false;
      } else if (condition.operator === 'IN') {
        if (!condition.value.includes(recordValue)) return false;
      } else if (condition.operator === 'NOT IN') {
        if (condition.value.includes(recordValue)) return false;
      } else if (condition.operator === 'IS NULL') {
        if (recordValue !== null) return false;
      } else if (condition.operator === 'IS NOT NULL') {
        if (recordValue === null) return false;
      } else if (condition.operator === 'BETWEEN') {
        if (!(recordValue >= condition.value[0] && recordValue <= condition.value[1])) return false;
      }
    }
    return true;
  }

  _execute() {
    const table = storage[this.tableName] || new Map();
    let results = Array.from(table.values()).filter(record => this._matchesConditions(record));

    // Apply ordering
    if (this.orderByInfo) {
      results.sort((a, b) => {
        const aVal = a[this.orderByInfo.column];
        const bVal = b[this.orderByInfo.column];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return this.orderByInfo.direction === 'desc' ? -comparison : comparison;
      });
    }

    // Apply offset and limit
    if (this.offsetInfo) {
      results = results.slice(this.offsetInfo);
    }
    if (this.limitInfo) {
      results = results.slice(0, this.limitInfo);
    }

    return Promise.resolve(results);
  }

  insert(data) {
    const table = storage[this.tableName] || new Map();
    if (!storage[this.tableName]) {
      storage[this.tableName] = table;
    }
    
    const id = data.id || `${this.tableName}_${Date.now()}`;
    table.set(id, { ...data, id });

    // Return Promise-like object that supports chaining
    const result = Promise.resolve([id]);
    result.onConflict = (column) => ({
      merge: () => result,
      ignore: () => result,
    });
    return result;
  }

  update(data) {
    const table = storage[this.tableName] || new Map();
    let updated = 0;
    
    for (let [key, record] of table) {
      if (this._matchesConditions(record)) {
        Object.assign(record, data);
        updated++;
      }
    }
    
    return Promise.resolve(updated);
  }

  del() {
    const table = storage[this.tableName] || new Map();
    let deleted = 0;
    
    for (let [key, record] of table) {
      if (this._matchesConditions(record)) {
        table.delete(key);
        deleted++;
      }
    }
    
    return Promise.resolve(deleted);
  }

  count(columnName = '*') {
    const table = storage[this.tableName] || new Map();
    let total = 0;
    
    for (let [key, record] of table) {
      if (this._matchesConditions(record)) {
        total++;
      }
    }
    
    const result = [{ count: total }];
    result[0][columnName] = total;
    return Promise.resolve(result);
  }

  pluck(column) {
    const table = storage[this.tableName] || new Map();
    const values = Array.from(table.values())
      .filter(record => this._matchesConditions(record))
      .map(record => record[column]);
    return Promise.resolve(values);
  }

  join(table, col1, operator, col2) {
    this.joinedTables.push({ table, col1, operator, col2 });
    return this;
  }

  leftJoin(table, col1, operator, col2) {
    this.joinedTables.push({ table, col1, operator, col2, type: 'left' });
    return this;
  }

  innerJoin(table, col1, operator, col2) {
    this.joinedTables.push({ table, col1, operator, col2, type: 'inner' });
    return this;
  }
}

const mockDb = function(tableName) {
  return new MockQueryBuilder(tableName);
};

// Add utility methods
mockDb.raw = function(sql) {
  return Promise.resolve({ rows: [] });
};

mockDb.destroy = function() {
  return Promise.resolve();
};

// Mock transaction
mockDb.transaction = function(callback) {
  return callback(mockDb);
};

// Add table-specific methods for chainable queries
mockDb.schema = {
  createTable: () => Promise.resolve(),
  dropTable: () => Promise.resolve(),
  hasTable: () => Promise.resolve(true),
};

module.exports = mockDb;
