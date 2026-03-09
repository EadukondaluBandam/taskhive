import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'

const dbPath = path.join(app.getPath('userData'), 'TaskHive.db')

const db = new Database(dbPath)

db.prepare(`
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  app_name TEXT,
  website TEXT,
  start_time TEXT,
  end_time TEXT,
  duration INTEGER,
  synced INTEGER DEFAULT 0
)
`).run()

export function insertLog(app, site, start, end, duration) {
  db.prepare(`
    INSERT INTO activity_logs 
    (app_name, website, start_time, end_time, duration)
    VALUES (?, ?, ?, ?, ?)
  `).run(app, site, start, end, duration)
}

export function getAllLogs() {
  return db.prepare(`SELECT * FROM activity_logs`).all()
}


export default db

