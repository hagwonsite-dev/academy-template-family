export function koreanToday(now = new Date()): string {
 return new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
export function calendarDays(month: string): (string | null)[] {
 const [year, number] = month.split('-').map(Number);
 const start = new Date(Date.UTC(year, number - 1, 1)).getUTCDay();
 const length = new Date(Date.UTC(year, number, 0)).getUTCDate();
 return [...Array<null>(start).fill(null), ...Array.from({length}, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)];
}
export function attendanceSummary(sessions: {date: string; status: string}[], month: string) {
 const selected = sessions.filter(s => s.date.startsWith(month));
 const present = selected.filter(s => s.status === 'present').length;
 const absent = selected.filter(s => s.status === 'absent').length;
 const makeup = selected.filter(s => s.status === 'makeup').length;
 const total = present + absent + makeup;
 return {present, absent, makeup, total, rate: total ? Math.round((present + makeup) / total * 100) : null};
}
export const statusLabels: Record<string, string> = {present:'출석 완료',absent:'결석',makeup:'보강 완료',arrived:'등원했어요',scheduled:'수업 예정'};
