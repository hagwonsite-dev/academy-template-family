'use client';
import {useState} from 'react';
import {Card,CardContent,CardHeader,CardTitle,CardDescription} from './ui/card';
import {Button} from './ui/button';
import {Progress} from './ui/progress';
import {Badge} from './ui/badge';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from './ui/dialog';
import type {PortalData} from '../src/model';
export function PassPanel({data}:{data:PortalData}){
 const [selected,setSelected]=useState<string|null>(null);
 const pass=data.passes.find(p=>p.id===selected);
 return <><div className="two-columns">{data.passes.map(p=><Card key={p.id}><CardHeader><CardDescription>{data.profile.academy}</CardDescription><CardTitle>{p.title}</CardTitle></CardHeader><CardContent><div className="pass-count"><strong>{p.remaining}회 남았어요</strong><span>전체 {p.total}회</span></div><Progress value={p.total?Math.max(0,Math.min(100,p.remaining/p.total*100)):0} aria-label="수강권 잔여 회차"/><dl className="details"><div><dt>사용한 회차</dt><dd>{p.total-p.remaining}회</dd></div><div><dt>사용 기한</dt><dd>{p.expires}</dd></div><div><dt>담당 선생님</dt><dd>{data.profile.teacher}</dd></div><div><dt>수업 장소</dt><dd>{data.sessions[0]?.room??'미정'}</dd></div></dl><Button onClick={()=>setSelected(p.id)}>상세 · 사용 이력</Button></CardContent></Card>)}</div><Dialog open={!!pass} onOpenChange={open=>{if(!open)setSelected(null);}}><DialogContent className="portal-dialog"><DialogHeader><DialogTitle>{pass?.title}</DialogTitle><DialogDescription>수강권 사용 이력 · {data.profile.name}</DialogDescription></DialogHeader><p className="muted">예시의 회차 기록이에요. 실제 수업 차감은 운영자가 처리해요.</p><div className="usage-list">{data.usage.filter(u=>u.passId===pass?.id).map(u=><div key={u.id} className="ledger-row"><div><strong>{u.title}</strong><p className="muted">{u.date} · {u.kind}</p></div><div><Badge variant="outline">−{u.units}회</Badge><p className="muted">잔여 {u.remaining}회</p></div></div>)}{!data.usage.some(u=>u.passId===pass?.id)?<p>아직 사용 이력이 없어요.</p>:null}</div></DialogContent></Dialog></>;
}
