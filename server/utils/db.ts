import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync, type StatementSync } from 'node:sqlite'

let _db: DatabaseSync | null = null

/**
 * Embedded SQLite via Node's built-in `node:sqlite` — zero dependencies,
 * nothing to bundle. The DB is just a file.
 * - Local/dev: `.data/enboucle.db` (NUXT_DB_URL unset).
 * - Production (Fly): NUXT_DB_URL=file:/data/enboucle.db on a persistent volume.
 */
export function db(): DatabaseSync {
  if (_db)
    return _db

  const raw = process.env.NUXT_DB_URL || 'file:.data/enboucle.db'
  const path = raw.startsWith('file:') ? raw.slice('file:'.length).split('?')[0]! : raw
  try {
    mkdirSync(dirname(path), { recursive: true })
  }
  catch { /* already exists */ }

  _db = new DatabaseSync(path)
  _db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;')
  return _db
}

type Arg = string | number | bigint | null | Uint8Array

export function run(sql: string, ...args: Arg[]) {
  return db().prepare(sql).run(...args)
}
export function all<T = Record<string, unknown>>(sql: string, ...args: Arg[]): T[] {
  return (db().prepare(sql) as StatementSync).all(...args) as T[]
}
export function get<T = Record<string, unknown>>(sql: string, ...args: Arg[]): T | undefined {
  return (db().prepare(sql) as StatementSync).get(...args) as T | undefined
}
