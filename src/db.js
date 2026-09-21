/**
 * Datenzugriff. Weg A: SQLite (Datei). Weg B und die meisten C-Fälle:
 * Postgres (DATABASE_URL). Alles darüber kennt nur query/queryOne — deshalb
 * ist der Umzug ein Umgebungs-Eintrag und keine Migration des Codes.
 *
 * Bringt Weg C eine andere Datenbank mit (MySQL/MariaDB), kommt hier ein
 * dritter Zweig dazu. Er muss genau zwei Dinge können: query und exec.
 * Nichts darüber darf merken, welcher Zweig läuft.
 *
 * node:sqlite ist ab Node 22.13 ohne Flag dabei (davor mit --experimental-sqlite).
 */
const POSTGRES = Boolean(process.env.DATABASE_URL);
let impl;

if (POSTGRES) {
  const pg = (await import('pg')).default;
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  impl = {
    query: async (sql, params = []) => (await pool.query(sql, params)).rows,
    exec: async (sql) => { await pool.query(sql); },
  };
} else {
  const { DatabaseSync } = await import('node:sqlite');
  const { mkdirSync } = await import('node:fs');
  const { dirname } = await import('node:path');
  const datei = process.env.SQLITE_FILE || 'data/site.db';
  // SQLite legt fehlende Ordner NICHT an — ohne diese Zeile scheitert der
  // allererste Start mit ERR_SQLITE_ERROR, und zwar auf jeder Plattform.
  mkdirSync(dirname(datei), { recursive: true });
  const db = new DatabaseSync(datei);
  db.exec('PRAGMA journal_mode = WAL');
  // $1, $2 … → ?, damit dasselbe SQL auf beiden Wegen läuft
  const um = (sql) => sql.replace(/\$(\d+)/g, '?');
  impl = {
    query: async (sql, params = []) => {
      const s = db.prepare(um(sql));
      return /^\s*(select|with|pragma)/i.test(sql) ? s.all(...params) : (s.run(...params), []);
    },
    exec: async (sql) => db.exec(sql),
  };
}

export const query = impl.query;
export const queryOne = async (sql, params) => (await impl.query(sql, params))[0] || null;

/** Migrationen: idempotent, lexikalisch, mit Tracking. */
export async function runMigrations() {
  const { readdirSync, readFileSync } = await import('node:fs');
  await impl.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)');
  const erledigt = new Set((await impl.query('SELECT name FROM schema_migrations')).map((r) => r.name));
  for (const datei of readdirSync('migrations').filter((f) => f.endsWith('.sql')).sort()) {
    if (erledigt.has(datei)) continue;
    await impl.exec(readFileSync(`migrations/${datei}`, 'utf8'));
    await impl.query('INSERT INTO schema_migrations (name) VALUES ($1)', [datei]);
    console.log(`[Motor] Migration: ${datei}`);
  }
}
