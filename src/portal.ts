import { koreanToday } from './calendar.ts';
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
 const [profiles,sessions,passes,invoices,notices,messages,usage,refunds,teachers,comments,media,policy] = await Promise.all([
  db.query('SELECT * FROM "Profile" WHERE "id" IN ('+(ctx.role==='parent'?"'haneul','jiwoo'":"'haneul'")+') ORDER BY "id"'),
  db.query('SELECT * FROM "Session" WHERE "studentId"=? ORDER BY "date" LIMIT 366',[ctx.studentId]),
  db.query('SELECT * FROM "Pass" WHERE "studentId"=? LIMIT 10',[ctx.studentId]),
  db.query('SELECT * FROM "Invoice" WHERE "studentId"=? ORDER BY "dueDate" DESC LIMIT 100',[ctx.studentId]),
  db.query('SELECT n.*, CASE WHEN r."id" IS NULL THEN 0 ELSE 1 END AS "isRead", v."choice" FROM "Notice" n LEFT JOIN "Receipt" r ON r."noticeId"=n."id" AND r."role"=? LEFT JOIN "Vote" v ON v."noticeId"=n."id" AND v."role"=? WHERE n."studentId"=? ORDER BY n."date" DESC LIMIT 20',[ctx.role,ctx.role,ctx.studentId]),
  ctx.role==='parent'?db.query(`SELECT "id","sender","body","createdAt",COALESCE("teacherId", "studentId" || '-teacher') AS "teacherId",COALESCE("attachments",'[]') AS "attachments" FROM "Message" WHERE "studentId"=? AND "sender" IN ('parent','teacher') ORDER BY "createdAt" DESC LIMIT 100`,[ctx.studentId]):Promise.resolve([]),
  db.query('SELECT * FROM "PassUsage" WHERE "studentId"=? ORDER BY "date" DESC LIMIT 200',[ctx.studentId]),
  db.query('SELECT * FROM "Refund" WHERE "studentId"=? ORDER BY "createdAt" DESC LIMIT 100',[ctx.studentId]),
  ctx.role==='parent'?db.query('SELECT "id","name","subject" FROM "Teacher" WHERE "studentId"=? ORDER BY "id"',[ctx.studentId]):Promise.resolve([]),
  db.query('SELECT * FROM "Comment" WHERE "studentId"=? ORDER BY "createdAt" DESC LIMIT 200',[ctx.studentId]),
  db.query('SELECT * FROM "NoticeMedia" WHERE "studentId"=? LIMIT 100',[ctx.studentId]),
  db.query('SELECT "advanceAttendance" FROM "FamilyPolicy" WHERE "studentId"=?',[ctx.studentId]),
 ]);
 const profile=profiles.find(p=>p.id===ctx.studentId);if(!profile)throw new PortalError(503,'체험 데이터가 아직 준비되지 않았어요.');
 // Rows originate from the versioned, typed template schema, never from a client payload.
 return {context:ctx,profiles,profile,sessions,passes,invoices,notices,messages:messages.reverse(),usage,refunds,teachers,comments:comments.reverse(),media,advanceAttendance:policy[0]?.advanceAttendance===1} as PortalData;
}
function text(value:unknown,max:number) {if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw new PortalError(400,'입력 내용을 확인해 주세요.');return value.trim();}
export async function mutate(db:Database,ctx:Context,body:unknown) {
 context(ctx.role,ctx.studentId);
 if(!body||typeof body!=='object'||Array.isArray(body))throw new PortalError(400,'잘못된 요청이에요.');
 const b=body as Record<string,unknown>,action=text(b.action,30);
 if(action==='message') {
  if(ctx.role!=='parent')throw new PortalError(403,'이 예시에서는 학부모가 쪽지를 작성해요.');
  const message=text(b.body,1000),teacherId=text(b.teacherId,100);
  const attachments=b.attachments??[];
  if(!Array.isArray(attachments)||attachments.length>3||attachments.some(a=>typeof a!=='string'||!['reading','art','schedule'].includes(a))||new Set(attachments).size!==attachments.length)throw new PortalError(400,'체험 첨부 자료를 확인해 주세요.');
  const rows=await db.query('INSERT INTO "Message" ("id","studentId","sender","body","createdAt","teacherId","attachments") SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM "Teacher" WHERE "id"=? AND "studentId"=?) RETURNING "id"',[randomUUID(),ctx.studentId,ctx.role,message,new Date().toISOString(),teacherId,JSON.stringify(attachments),teacherId,ctx.studentId]);
  if(!rows.length)throw new PortalError(404,'연결된 선생님을 찾을 수 없어요.');return;
 }
 if(action==='pay') {
  const ids=b.ids??[b.id];
  if(!Array.isArray(ids)||ids.length<1||ids.length>20||ids.some(id=>typeof id!=='string'||!id||id.length>100)||new Set(ids).size!==ids.length)throw new PortalError(400,'청구서를 1~20개 선택해 주세요.');
  const placeholders=ids.map(()=>'?').join(',');
  // One SQL statement: all selected invoices must be scoped and unpaid in the same snapshot.
  const rows=await db.query(`UPDATE "Invoice" SET "status"='demo-paid', "paidAt"=?, "paymentId"=? WHERE "studentId"=? AND "status"='unpaid' AND "id" IN (${placeholders}) AND (SELECT COUNT(*) FROM "Invoice" WHERE "studentId"=? AND "status"='unpaid' AND "id" IN (${placeholders}))=? RETURNING "id"`,[new Date().toISOString(),randomUUID(),ctx.studentId,...ids,ctx.studentId,...ids,ids.length]);
  if(rows.length!==ids.length)throw new PortalError(409,'청구서가 변경됐거나 선택 범위가 잘못됐어요. 새로고침 후 다시 선택해 주세요.');return;
 }
 const id=text(b.id,100);
 if(action==='comment') {
  const comment=text(b.body,1000),parentId=b.parentId==null?null:text(b.parentId,100),now=new Date().toISOString();
  const rows=await db.query('INSERT INTO "Comment" ("id","studentId","noticeId","parentId","role","body","createdAt","updatedAt") SELECT ?,?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM "Notice" WHERE "id"=? AND "studentId"=?) AND (? IS NULL OR EXISTS (SELECT 1 FROM "Comment" WHERE "id"=? AND "noticeId"=? AND "studentId"=? AND "parentId" IS NULL AND "deleted"=0)) RETURNING "id"',[randomUUID(),ctx.studentId,id,parentId,ctx.role,comment,now,now,id,ctx.studentId,parentId,parentId,id,ctx.studentId]);
  if(!rows.length)throw new PortalError(404,'댓글을 남길 공지나 원문을 찾을 수 없어요.');return;
 }
 if(action==='editComment'||action==='deleteComment') {
  const comment=action==='editComment'?text(b.body,1000):'';
  const rows=await db.query('UPDATE "Comment" SET "body"=?, "deleted"=?, "updatedAt"=? WHERE "id"=? AND "studentId"=? AND "role"=? AND "deleted"=0 RETURNING "id"',[comment,action==='deleteComment'?1:0,new Date().toISOString(),id,ctx.studentId,ctx.role]);
  if(!rows.length)throw new PortalError(403,'내가 작성한 댓글만 변경할 수 있어요.');return;
 }
 if(action==='intention') {
  if(!['attend','absent'].includes(String(b.choice)))throw new PortalError(400,'출결 선택을 확인해 주세요.');
  const reason=b.choice==='absent'?text(b.reason,200):'';
  const rows=await db.query('UPDATE "Session" SET "intention"=?, "reason"=? WHERE "id"=? AND "studentId"=? AND "status"=\'scheduled\' AND "date">=? AND EXISTS (SELECT 1 FROM "FamilyPolicy" WHERE "studentId"=? AND "advanceAttendance"=1) RETURNING "id"',[String(b.choice),reason,id,ctx.studentId,koreanToday(),ctx.studentId]);
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
