import 'server-only';
import { openDatabase } from './database.ts';
import { demoSeed } from './seed.ts';
let connection:ReturnType<typeof openDatabase>|undefined;
export function database(){
 return connection ??= openDatabase().then(async db=>{
  if(!process.env.TURSO_DATABASE_URL&&!process.env.DATABASE_URL)for(const statement of demoSeed())await db.query(statement.sql,statement.args);
  return db;
 }).catch(error=>{connection=undefined;throw error;});
}
