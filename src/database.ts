import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { migrateLocal } from './migrations.ts';

export async function openDatabase() {
    if (process.env.TURSO_DATABASE_URL) {
        const { createClient } = await import('@libsql/client');
        const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN });
        return {
            query: async (text: string, values: SQLInputValue[] = []): Promise<Record<string, unknown>[]> => {
                try {
                    const result = await db.execute({ sql: text, args: values.map(value => ArrayBuffer.isView(value) ? new Uint8Array(value.buffer, value.byteOffset, value.byteLength) : value) });
                    return result.rows.map(row => Object.fromEntries(Object.entries(row)));
                } catch { throw Error('Database request failed'); }
            },
            close: () => db.close(),
        };
    }
    const uri = process.env.DATABASE_URL;
    if (uri?.startsWith('postgresql://') || uri?.startsWith('postgres://')) {
        const { neon } = process.env.NEON_DRIVER_PATH ? await import(process.env.NEON_DRIVER_PATH) : await import('@neondatabase/serverless');
        const sql = neon(uri);
        return {
            query: async (text: string, values: SQLInputValue[] = []): Promise<Record<string, unknown>[]> => {
                try { return await sql.query(text.replace(/\?/g, (() => { let index = 0; return () => '$' + (++index); })()), values); }
                catch { throw Error('Database request failed'); }
            },
            close: () => {},
        };
    }
    const db = new DatabaseSync(process.env.DATABASE_FILE || 'academy.sqlite');
    db.exec('PRAGMA foreign_keys=ON');
    migrateLocal(db, process.cwd());
    return {
        query: async (text: string, values: SQLInputValue[] = []): Promise<Record<string, unknown>[]> => db.prepare(text.replace(/\$\d+/g, '?')).all(...values).map(row => ({ ...row })),
        close: () => db.close(),
    };
}
