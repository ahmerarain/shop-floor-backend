import { db } from "../database/init.js";

// Helper function to execute SELECT queries
export function executeSelectQuery(query: string, params: any[] = []): any[] {
  const stmt = db.prepare(query);
  const rows: any[] = [];

  // Bind parameters if any
  if (params.length > 0) {
    stmt.bind(params);
  }

  // Step through all rows
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();

  return rows;
}

// Helper function to execute COUNT queries
export function executeCountQuery(query: string, params: any[] = []): number {
  const stmt = db.prepare(query);
  let total = 0;

  // Bind parameters if any
  if (params.length > 0) {
    stmt.bind(params);
  }

  // Get the count result
  if (stmt.step()) {
    total = stmt.get()[0];
  }
  stmt.free();

  return total;
}

// Helper function to execute INSERT/UPDATE/DELETE queries
export function executeModifyQuery(query: string, params: any[] = []): number {
  const stmt = db.prepare(query);

  // Bind parameters if any
  if (params.length > 0) {
    stmt.bind(params);
  }

  stmt.step();
  const changes = db.getRowsModified();
  stmt.free();

  return changes;
}

// Helper function to execute multiple INSERT operations
export function executeBatchInsert(query: string, dataArray: any[][]): void {
  const stmt = db.prepare(query);

  dataArray.forEach((params) => {
    stmt.bind(params);
    stmt.step();
    stmt.reset();
  });

  stmt.free();
}
