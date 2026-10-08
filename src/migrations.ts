import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
/** Execute our additive PostgreSQL migration subset on local SQLite. */
export function migrateLocal(db: DatabaseSync, directory: string) {
    db.exec('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL)');
    for (const name of readdirSync(join(directory, 'prisma/migrations')).sort()) {
        const sql = readFileSync(join(directory, 'prisma/migrations', name, 'migration.sql'), 'utf8');
        const checksum = createHash('sha256').update(sql).digest('hex');
        const applied = db.prepare('SELECT checksum FROM _migrations WHERE name=?').get(name) as {
            checksum: string;
        } | undefined;
        if (applied) {
            if (applied.checksum !== checksum)
                throw Error('Applied migration checksum mismatch: ' + name);
            continue;
        }
        db.exec('BEGIN');
        try {
            for (const statement of sql.split(';').map(s => s.trim()).filter(Boolean)) {
                const additive = statement.match(/^ALTER TABLE "(\w+)" ADD COLUMN IF NOT EXISTS "(\w+)" (TEXT|INTEGER)$/i);
                if (additive) {
                    const columns = db.prepare(`PRAGMA table_info("${additive[1]}")`).all() as {
                        name: string;
                        type: string;
                        notnull: number;
                    }[];
                    const existing = columns.find(c => c.name === additive[2]);
                    if (existing) {
                        if (existing.type.toUpperCase() !== additive[3].toUpperCase() || existing.notnull)
                            throw Error('Retained database column conflicts with migration');
                        continue;
                    }
                    db.exec(statement.replace(' IF NOT EXISTS', ''));
                }
                else
                    db.exec(statement);
            }
            db.prepare('INSERT INTO _migrations VALUES (?,?)').run(name, checksum);
            db.exec('COMMIT');
        }
        catch (error) {
            db.exec('ROLLBACK');
            throw error;
        }
    }
}
