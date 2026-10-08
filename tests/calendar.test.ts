import {test} from 'node:test';
import assert from 'node:assert/strict';
import {attendanceSummary, calendarDays, koreanToday} from '../src/calendar.ts';

test('attendance counts completed sessions only and includes makeup as attended',()=>{
 const result=attendanceSummary([{date:'2026-10-01',status:'present'},{date:'2026-10-02',status:'absent'},{date:'2026-10-03',status:'makeup'},{date:'2026-10-04',status:'scheduled'},{date:'2026-09-01',status:'present'}],'2026-10');
 assert.deepEqual(result,{present:1,absent:1,makeup:1,total:3,rate:67});
 assert.equal(attendanceSummary([],'2026-10').rate,null);
});
test('calendar uses valid month days and Seoul dates at UTC boundaries',()=>{
 assert.equal(calendarDays('2024-02').filter(Boolean).length,29);
 assert.equal(calendarDays('2026-02').filter(Boolean).length,28);
 assert.equal(calendarDays('2026-10')[4],'2026-10-01');
 assert.equal(koreanToday(new Date('2026-10-07T16:00:00Z')),'2026-10-08');
});
