import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync,type SQLInputValue} from 'node:sqlite';
import {fileURLToPath} from 'node:url';
import {migrateLocal} from '../src/migrations.ts';
import {context,loadPortal,mutate} from '../src/portal.ts';
import {demoSeed} from '../src/seed.ts';
function fixture(){const sqlite=new DatabaseSync(':memory:');sqlite.exec('PRAGMA foreign_keys=ON');migrateLocal(sqlite,fileURLToPath(new URL('..',import.meta.url)));const db={query:async(sql:string,args:SQLInputValue[]=[])=>sqlite.prepare(sql).all(...args)};for(const s of demoSeed())sqlite.prepare(s.sql).run(...s.args);return{db,close:()=>sqlite.close()};}
test('role and child scope excludes sibling and parent messages from student',async()=>{const f=fixture();try{assert.throws(()=>context('student','jiwoo'));assert.throws(()=>context('teacher','haneul'));assert.throws(()=>context('parent',"' OR 1=1"));const parent=context('parent','haneul');await mutate(f.db,parent,{action:'message',teacherId:'haneul-teacher',body:'parent private demo conversation'});const student=await loadPortal(f.db,context('student','haneul'));assert.equal(student.profiles.length,1);assert.ok(student.invoices.length>0);assert.ok(student.sessions.every(s=>s.studentId==='haneul'));assert.ok(!student.messages.some(m=>m.body==='parent private demo conversation'));const sibling=await loadPortal(f.db,context('parent','jiwoo'));assert.equal(sibling.profile.name,'김지우');assert.ok(sibling.sessions.every(s=>s.studentId==='jiwoo'));}finally{f.close();}});
test('writes are scoped, validated and persist; payment is a guarded demo transition',async()=>{const f=fixture();try{const ctx=context('parent','haneul');await assert.rejects(mutate(f.db,ctx,{action:'pay',id:'jiwoo-invoice'}));await mutate(f.db,ctx,{action:'pay',id:'haneul-invoice'});await assert.rejects(mutate(f.db,ctx,{action:'pay',id:'haneul-invoice'}));assert.equal((await loadPortal(f.db,ctx)).invoices.find(i=>i.id==='haneul-invoice')?.status,'demo-paid');await assert.rejects(mutate(f.db,ctx,{action:'message',body:' '}));await assert.rejects(mutate(f.db,ctx,{action:'message',body:'x'.repeat(1001)}));await mutate(f.db,ctx,{action:'message',teacherId:'haneul-teacher',body:'저장되는 쪽지'});assert.ok((await loadPortal(f.db,ctx)).messages.some(m=>m.body==='저장되는 쪽지'));await assert.rejects(mutate(f.db,ctx,{action:'intention',id:'haneul-session-0',choice:'absent',reason:'과거'}));await assert.rejects(mutate(f.db,ctx,{action:'intention',id:'jiwoo-session-2',choice:'absent',reason:'다른 학생'}));await assert.rejects(mutate(f.db,ctx,{action:'intention',id:'haneul-session-2',choice:'absent',reason:''}));await mutate(f.db,ctx,{action:'intention',id:'haneul-session-2',choice:'absent',reason:'체험 일정'});assert.equal((await loadPortal(f.db,ctx)).sessions.find(s=>s.id==='haneul-session-2')?.intention,'absent');}finally{f.close();}});
test('read receipts and one updatable vote per role remain separate',async()=>{const f=fixture();try{const ctx=context('parent','haneul');await assert.rejects(mutate(f.db,ctx,{action:'read',id:'jiwoo-notice'}));await assert.rejects(mutate(f.db,ctx,{action:'vote',id:'haneul-notice',choice:'attend'}));await assert.rejects(mutate(f.db,ctx,{action:'vote',id:'haneul-poll',choice:'invalid'}));await mutate(f.db,ctx,{action:'vote',id:'haneul-poll',choice:'attend'});await mutate(f.db,ctx,{action:'vote',id:'haneul-poll',choice:'decline'});const parent=await loadPortal(f.db,ctx);assert.equal(parent.notices.find(n=>n.id==='haneul-poll')?.choice,'decline');assert.equal(parent.notices.find(n=>n.id==='haneul-poll')?.isRead,1);const student=await loadPortal(f.db,context('student','haneul'));assert.equal(student.notices.find(n=>n.id==='haneul-poll')?.choice,null);assert.equal(student.notices.find(n=>n.id==='haneul-poll')?.isRead,0);}finally{f.close();}});

test('new detail rows and teacher histories remain scoped; student messages are disabled',async()=>{const f=fixture();try{
 const data=await loadPortal(f.db,context('parent','haneul'));
 assert.ok(data.usage.length>0);assert.ok(data.usage.every(u=>u.studentId==='haneul'));
 assert.equal(data.teachers.length,2);assert.ok(data.refunds.length>0);
 await assert.rejects(mutate(f.db,context('parent','haneul'),{action:'message',teacherId:'jiwoo-teacher',body:'foreign'}));
 await assert.rejects(mutate(f.db,context('student','haneul'),{action:'message',teacherId:'haneul-teacher',body:'student'}));
 await mutate(f.db,context('parent','haneul'),{action:'message',teacherId:'haneul-director',body:'director only'});
 assert.equal((await loadPortal(f.db,context('parent','haneul'))).messages.find(m=>m.body==='director only')?.teacherId,'haneul-director');
 assert.equal((await loadPortal(f.db,context('student','haneul'))).messages.length,0);
}finally{f.close();}});
test('bundle payment is atomic, scoped and repeat-safe for either demo role',async()=>{const f=fixture();try{
 const ctx=context('student','haneul');
 for(const ids of [[],['haneul-invoice','haneul-invoice'],['haneul-invoice','jiwoo-invoice'],['haneul-invoice','missing']])await assert.rejects(mutate(f.db,ctx,{action:'pay',ids}));
 assert.equal((await loadPortal(f.db,ctx)).invoices.find(i=>i.id==='haneul-invoice')?.status,'unpaid');
 const results=await Promise.allSettled([mutate(f.db,ctx,{action:'pay',ids:['haneul-invoice','haneul-materials']}),mutate(f.db,ctx,{action:'pay',ids:['haneul-invoice','haneul-materials']})]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 const data=await loadPortal(f.db,ctx);const paid=data.invoices.filter(i=>['haneul-invoice','haneul-materials'].includes(i.id));assert.ok(paid.every(i=>i.status==='demo-paid'));assert.equal(paid[0].paymentId,paid[1].paymentId);
}finally{f.close();}});
test('comments validate notice, parent reply and author; deleted comments preserve replies',async()=>{const f=fixture();try{
 const parent=context('parent','haneul'),student=context('student','haneul');
 await assert.rejects(mutate(f.db,parent,{action:'comment',id:'jiwoo-notice',body:'wrong child'}));
 await mutate(f.db,parent,{action:'comment',id:'haneul-notice',body:'parent comment'});
 const comment=(await loadPortal(f.db,parent)).comments.find(c=>c.body==='parent comment')!;assert.ok(comment);
 await assert.rejects(mutate(f.db,student,{action:'editComment',id:comment.id,body:'not mine'}));
 await assert.rejects(mutate(f.db,parent,{action:'comment',id:'haneul-poll',parentId:comment.id,body:'wrong notice'}));
 await mutate(f.db,student,{action:'comment',id:'haneul-notice',parentId:comment.id,body:'reply'});
 await mutate(f.db,parent,{action:'editComment',id:comment.id,body:'edited'});
 await mutate(f.db,parent,{action:'deleteComment',id:comment.id});
 const comments=(await loadPortal(f.db,parent)).comments;assert.equal(comments.find(c=>c.id===comment.id)?.body,'');assert.equal(comments.find(c=>c.id===comment.id)?.deleted,1);assert.ok(comments.some(c=>c.body==='reply'));
}finally{f.close();}});
test('academy policy prevents advance attendance even for a future valid session',async()=>{const f=fixture();try{
 await f.db.query('UPDATE "FamilyPolicy" SET "advanceAttendance"=0 WHERE "studentId"=?',['haneul']);
 await assert.rejects(mutate(f.db,context('parent','haneul'),{action:'intention',id:'haneul-session-2',choice:'attend'}));
}finally{f.close();}});
