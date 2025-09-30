import { getDatabase } from "../database/init";

// Helper function to execute SELECT queries
export function executeSelectQuery(query: string, params: any[] = []): any[] {
  const db = getDatabase();
  const stmt = db.prepare(query);

  if (params.length > 0) {
    return stmt.all(params);
  }
  return stmt.all();
}

// Helper function to execute COUNT queries
export function executeCountQuery(query: string, params: any[] = []): number {
  const db = getDatabase();
  const stmt = db.prepare(query);

  if (params.length > 0) {
    const result = stmt.get(params);
    return result
      ? (result as any).total || (result as any)["COUNT(*)"] || 0
      : 0;
  }
  const result = stmt.get();
  return result ? (result as any).total || (result as any)["COUNT(*)"] || 0 : 0;
}

// Helper function to execute INSERT/UPDATE/DELETE queries
export function executeModifyQuery(query: string, params: any[] = []): number {
  const db = getDatabase();
  const stmt = db.prepare(query);

  if (params.length > 0) {
    const result = stmt.run(params);
    return result.changes;
  }
  const result = stmt.run();
  return result.changes;
}

// Helper function to execute multiple INSERT operations
export function executeBatchInsert(query: string, dataArray: any[][]): void {
  const db = getDatabase();
  const stmt = db.prepare(query);

  // Use transaction for better performance
  const insertMany = db.transaction((dataArray: any[][]) => {
    for (const params of dataArray) {
      stmt.run(params);
    }
  });

  insertMany(dataArray);
}
