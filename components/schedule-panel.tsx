'use client';
import {useState, type ReactNode} from 'react';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {Button} from './ui/button';
import {Card, CardContent, CardHeader, CardTitle, CardDescription} from './ui/card';
import {Badge} from './ui/badge';
import {attendanceSummary, calendarDays, statusLabels} from '../src/calendar';
import type {Session} from '../src/model';
export function SchedulePanel({sessions,today,renderSession}:{sessions:Session[];today:string;renderSession:(session:Session)=>ReactNode}) {
 const [month,setMonth]=useState(today.slice(0,7));
 const [selected,setSelected]=useState<string|null>(null);
 const summary=attendanceSummary(sessions,month);
 const visible=sessions.filter(s=>selected?s.date===selected:s.date.startsWith(month));
 function move(offset:number){const [y,m]=month.split('-').map(Number);setMonth(new Date(Date.UTC(y,m-1+offset,1)).toISOString().slice(0,7));setSelected(null);}
 return <div className="content-stack"><Card><CardHeader><div className="calendar-heading"><Button variant="outline" size="icon" aria-label="이전 달" onClick={()=>move(-1)}><ChevronLeft/></Button><CardTitle aria-live="polite">{month.replace('-','년 ')}월</CardTitle><Button variant="outline" size="icon" aria-label="다음 달" onClick={()=>move(1)}><ChevronRight/></Button></div><CardDescription>완료된 수업 기준 출석률 · 출석과 보강을 출석으로 계산해요.</CardDescription></CardHeader><CardContent><div className="calendar-grid" aria-label="수업 달력">{['일','월','화','수','목','금','토'].map(d=><span className="weekday" key={d}>{d}</span>)}{calendarDays(month).map((date,i)=>date?<Button key={date} variant={selected===date?'default':date===today?'secondary':'ghost'} className="calendar-day" aria-label={date+' '+sessions.filter(s=>s.date===date).map(s=>statusLabels[s.status]).join(', ')} aria-pressed={selected===date} onClick={()=>setSelected(date)}><span>{Number(date.slice(-2))}</span><span className="day-dots" aria-hidden="true">{sessions.filter(s=>s.date===date).map(s=><span key={s.id} className={'day-dot '+s.status}/>)}</span></Button>:<span key={'blank-'+i}/>)}</div><div className="inline-badges calendar-summary"><Badge>출석률 {summary.rate===null?'—':summary.rate+'%'}</Badge><Badge variant="outline">출석 {summary.present}</Badge><Badge variant="outline">결석 {summary.absent}</Badge><Badge variant="outline">보강 {summary.makeup}</Badge></div><p className="muted">초록: 출석 · 빨강: 결석 · 주황: 보강 · 회색: 예정 · 파랑: 등원</p></CardContent></Card><Card><CardHeader><div className="calendar-heading"><CardTitle>{selected??month} 수업</CardTitle>{selected?<Button variant="outline" size="sm" onClick={()=>setSelected(null)}>월 전체 보기</Button>:null}</div></CardHeader><CardContent className="session-list">{visible.length?visible.map(renderSession):<p className="muted">이 기간에는 등록된 수업이 없어요.</p>}</CardContent></Card></div>;
}
