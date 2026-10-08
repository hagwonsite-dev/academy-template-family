import { randomUUID } from 'node:crypto';
import type { SQLInputValue } from 'node:sqlite';
import type { Context, PortalData } from './model.ts';
export type Database = { query(text:string,values?:SQLInputValue[]):Promise<Record<string,unknown>[]> };
export class PortalError extends Error { status:number; constructor(status:number,message:string){super(message);this.status=status;} }
export function context(role:string|null,studentId:string|null):Context {
 if(role !== null && role !== 'parent' && role !== 'student') throw new PortalError(400,'역할을 확인해 주세요.');
 const result:Context={role:role ?? 'parent',studentId:studentId ?? 'haneul'};
 if(!['haneul','jiwoo'].includes(result.studentId) || (result.role==='student' && result.studentId!=='haneul')) throw new PortalError(403,'이 체험 역할에서 볼 수 없는 학생이에요.');
 return result;
}
export async function loadPortal(db:Database,ctx:Context):Promise<PortalData> {
 context(ctx.role,ctx.studentId);
 const [profiles,sessions,passes,invoices,notices,messages] = await Promise.all([
  db.query('SELECT * FROM "Profile" WHERE "id" IN ('+(ctx.role==='parent'?"'haneul','jiwoo'":"'haneul'")+') ORDER BY "id"'),
  db.query('SELECT * FROM "Session" WHERE "studentId"=? ORDER BY "date" LIMIT 30',[ctx.studentId]),
  db.query('SELECT * FROM "Pass" WHERE "studentId"=? LIMIT 10',[ctx.studentId]),
  ctx.role==='parent'?db.query('SELECT * FROM "Invoice" WHERE "studentId"=? ORDER BY "dueDate" DESC LIMIT 20',[ctx.studentId]):Promise.resolve([]),
  db.query('SELECT n.*, CASE WHEN r."id" IS NULL THEN 0 ELSE 1 END AS "isRead", v."choice" FROM "Notice" n LEFT JOIN "Receipt" r ON r."noticeId"=n."id" AND r."role"=? LEFT JOIN "Vote" v ON v."noticeId"=n."id" AND v."role"=? WHERE n."studentId"=? ORDER BY n."date" DESC LIMIT 20',[ctx.role,ctx.role,ctx.studentId]),
  db.query('SELECT "id","sender","body","createdAt" FROM "Message" WHERE "studentId"=? AND ("sender"=? OR "sender"=\'teacher\') ORDER BY "createdAt" DESC LIMIT 30',[ctx.studentId,ctx.role]),
 ]);
 const profile=profiles.find(p=>p.id===ctx.studentId);if(!profile)throw new PortalError(503,'체험 데이터가 아직 준비되지 않았어요.');
 // Rows originate from the versioned, typed template schema, never from a client payload.
 return {context:ctx,profiles,profile,sessions,passes,invoices,notices,messages:messages.reverse()} as PortalData;
}
function text(value:unknown,max:number) {if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw new PortalError(400,'입력 내용을 확인해 주세요.');return value.trim();}
export async function mutate(db:Database,ctx:Context,body:unknown) {
 context(ctx.role,ctx.studentId);
 if(!body||typeof body!=='object'||Array.isArray(body))throw new PortalError(400,'잘못된 요청이에요.');
 const b=body as Record<string,unknown>,action=text(b.action,30);
 if(action==='message') {
  const message=text(b.body,1000);
  await db.query('INSERT INTO "Message" ("id","studentId","sender","body","createdAt") VALUES (?,?,?,?,?) RETURNING "id"',[randomUUID(),ctx.studentId,ctx.role,message,new Date().toISOString()]);return;
 }
 const id=text(b.id,100);
 if(action==='pay') {
  if(ctx.role!=='parent')throw new PortalError(403,'학부모 체험에서 이용해 주세요.');
  const rows=await db.query('UPDATE "Invoice" SET "status"=\'demo-paid\', "paidAt"=? WHERE "id"=? AND "studentId"=? AND "status"=\'unpaid\' RETURNING "id"',[new Date().toISOString(),id,ctx.studentId]);
  if(!rows.length)throw new PortalError(409,'이미 처리했거나 볼 수 없는 청구서예요.');return;
 }
 if(action==='intention') {
  if(!['attend','absent'].includes(String(b.choice)))throw new PortalError(400,'출결 선택을 확인해 주세요.');
  const reason=b.choice==='absent'?text(b.reason,200):'';
  const rows=await db.query('UPDATE "Session" SET "intention"=?, "reason"=? WHERE "id"=? AND "studentId"=? AND "status"=\'scheduled\' AND "date">=? RETURNING "id"',[String(b.choice),reason,id,ctx.studentId,new Date().toISOString().slice(0,10)]);
  if(!rows.length)throw new PortalError(409,'사전 출결을 변경할 수 없는 수업이에요.');return;
 }
 if(action==='read'||action==='vote') {
  const rows=await db.query('SELECT "poll" FROM "Notice" WHERE "id"=? AND "studentId"=?',[id,ctx.studentId]);
  if(!rows.length)throw new PortalError(404,'공지를 찾을 수 없어요.');
  if(action==='vote') {
   if(!rows[0].poll||!['attend','decline'].includes(String(b.choice)))throw new PortalError(400,'투표 선택을 확인해 주세요.');
   await db.query('INSERT INTO "Vote" ("id","studentId","noticeId","role","choice") VALUES (?,?,?,?,?) ON CONFLICT ("id") DO UPDATE SET "choice"=excluded."choice" RETURNING "id"',[ctx.role+':'+id,ctx.studentId,id,ctx.role,String(b.choice)]);
  }
  await db.query('INSERT INTO "Receipt" ("id","studentId","noticeId","role") VALUES (?,?,?,?) ON CONFLICT ("id") DO NOTHING RETURNING "id"',[ctx.role+':'+id,ctx.studentId,id,ctx.role]);return;
 }
 throw new PortalError(400,'지원하지 않는 동작이에요.');
}
