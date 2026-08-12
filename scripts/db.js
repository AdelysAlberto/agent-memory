const os = require('os');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(os.homedir(), '.agents-memory');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'memory.db');
const db = new sqlite3.Database(dbPath);

function initDb() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS agent_memories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          project_name TEXT NOT NULL,
          category TEXT DEFAULT 'general',
          title TEXT NOT NULL,
          summary_signature TEXT NOT NULL,
          tags TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) return reject(err);
        resolve(dbPath);
      });
    });
  });
}

function saveMemory(projectName, title, summarySignature, category = 'general', tags = '') {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO agent_memories (project_name, title, summary_signature, category, tags)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(projectName, title, summarySignature, category, tags, function(err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, projectName, title });
    });
    stmt.finalize();
  });
}

function searchMemories(projectName, query) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, title, summary_signature, category, tags, timestamp
      FROM agent_memories
      WHERE (project_name = ? OR project_name = 'global')
        AND (title LIKE ? OR summary_signature LIKE ? OR tags LIKE ?)
      ORDER BY timestamp DESC
      LIMIT 10
    `;
    const searchTerm = `%${query}%`;
    db.all(sql, [projectName, searchTerm, searchTerm, searchTerm], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function listMemories(projectName) {
  return new Promise((resolve, reject) => {
    const sql = projectName
      ? `SELECT id, project_name, title, summary_signature, category, tags, timestamp
         FROM agent_memories
         WHERE project_name = ? OR project_name = 'global'
         ORDER BY timestamp DESC LIMIT 50`
      : `SELECT id, project_name, title, summary_signature, category, tags, timestamp
         FROM agent_memories
         ORDER BY timestamp DESC LIMIT 50`;
    const params = projectName ? [projectName] : [];
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function deleteMemory(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM agent_memories WHERE id = ?`, [id], function(err) {
      if (err) return reject(err);
      resolve({ deleted: this.changes });
    });
  });
}

function getProjects() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT DISTINCT project_name FROM agent_memories ORDER BY project_name ASC`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(r => r.project_name));
    });
  });
}

function getStats() {
  return new Promise((resolve, reject) => {
    db.get(`
      SELECT 
        COUNT(*) as total_memories,
        COUNT(DISTINCT project_name) as total_projects,
        SUM(LENGTH(summary_signature)) as total_chars
      FROM agent_memories
    `, [], (err, row) => {
      if (err) return reject(err);
      const estTokensSaved = Math.round((row.total_chars || 0) / 4);
      resolve({
        totalMemories: row.total_memories || 0,
        totalProjects: row.total_projects || 0,
        estimatedTokensSaved: estTokensSaved
      });
    });
  });
}

module.exports = {
  db,
  initDb,
  saveMemory,
  searchMemories,
  listMemories,
  deleteMemory,
  getProjects,
  getStats
};
