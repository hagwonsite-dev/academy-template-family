'use client';
import { PassPanel } from './pass-panel';
import { PaymentsPanel } from './payments-panel';
import { CommunityPanel } from './community-panel';
import { NoticeDetail } from './notice-detail';
import { SchedulePanel } from './schedule-panel';
import { koreanToday, statusLabels } from '../src/calendar';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight,Bell,BookOpen,CalendarDays,Check,ChevronRight,CreditCard,GraduationCap,Heart,Home,MessageCircle,Sparkles,Ticket,UserRound } from 'lucide-react';
import { Button } from './ui/button';
import { Card,CardContent,CardHeader,CardTitle,CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar,AvatarFallback } from './ui/avatar';
import { NativeSelect,NativeSelectOption } from './ui/native-select';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Alert,AlertDescription } from './ui/alert';
import { Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter } from './ui/dialog';
import { Separator } from './ui/separator';
import { sectionLabels,type PortalData,type Section,type Notice,type Invoice,type Session } from '../src/model.ts';
const icons={home:Home,schedule:CalendarDays,passes:Ticket,community:MessageCircle,payments:CreditCard,notifications:Bell,profile:UserRound};
const money=(amount:number)=>amount.toLocaleString('ko-KR')+'원';
const shortDate=(value:string)=>value.slice(5).replace('-','.');
type Modal={kind:'notice';item:Notice}|{kind:'invoice';item:Invoice}|{kind:'session';item:Session}|null;
export function Portal({data,section}:{data:PortalData;section:Section}) {
 const router=useRouter();
 const {context,profile,profiles,sessions,passes,invoices,notices}=data;
 const parent=context.role==='parent';
 const [modal,setModal]=useState<Modal>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState('');
 const href=(view:Section,student=context.studentId,role=context.role)=>'/?'+new URLSearchParams({view,student,role});
 const unread=notices.filter(n=>!n.isRead).length;
 const today=koreanToday();
 const upcoming=sessions.filter(s=>s.status==='scheduled'&&s.date>=today);
 const current=sessions.find(s=>s.status==='arrived')??upcoming[0]??sessions[0];
 const unpaid=invoices.filter(i=>i.status==='unpaid');
 const navigation:Section[]=['home','schedule','passes','community','payments','notifications','profile'];
 async function act(body:Record<string,unknown>,message:string,close=true) {
  setBusy(true);setError('');setSuccess('');
  try {
   const response=await fetch('/api/portal?'+new URLSearchParams({role:context.role,student:context.studentId}),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   if(!response.ok){const value:unknown=await response.json().catch(()=>null);throw Error(value&&typeof value==='object'&&'error' in value?String(value.error):'저장하지 못했어요.');}
   setSuccess(message);if(close)setModal(null);router.refresh();return true;
  }catch(error){setError(error instanceof Error?error.message:'연결을 확인해 주세요.');return false;}finally{setBusy(false);}
 }
 function open(value:Modal){setError('');setSuccess('');setModal(value);}
 const nav=(view:Section,mobile=false)=>{const Icon=icons[view];return <Button key={view} variant={section===view?'secondary':'ghost'} asChild className={mobile?'mobile-link':'nav-link'}><Link href={href(view)} aria-current={section===view?'page':undefined}><Icon size={18}/><span>{sectionLabels[view]}</span>{!mobile&&view==='notifications'&&unread>0?<Badge>{unread}</Badge>:null}</Link></Button>;};
 const sessionCard=(s:Session)=><div className="lesson-row" key={s.id}><div className="date-tile"><small>{s.date.slice(0,4)}</small><strong>{shortDate(s.date)}</strong></div><div className="grow"><h3>{s.title}</h3><p>{s.time} · {s.room}</p><div className="inline-badges"><Badge variant={s.status==='scheduled'?'outline':'secondary'}>{statusLabels[s.status]??'미처리'}</Badge>{s.intention?<Badge variant="outline">{s.intention==='attend'?'참석 예정':'결석 예정'}</Badge>:null}</div>{s.checkIn?<p className="attendance"><Check size={13}/>등원 {s.checkIn}{s.checkOut?' · 하원 '+s.checkOut:''}</p>:null}</div>{data.advanceAttendance&&s.status==='scheduled'&&s.date>=today?<Button variant="outline" size="sm" onClick={()=>open({kind:'session',item:s})}>사전 출결</Button>:null}</div>;
 const noticeCard=(n:Notice)=><Button key={n.id} variant="ghost" className="notice-row" onClick={()=>open({kind:'notice',item:n})}><span className="notice-icon">{n.poll?<Heart size={19}/>:<BookOpen size={19}/>}</span><span className="grow"><span className="notice-meta">{n.important?'중요 공지':n.category==='album'?'앨범':n.poll?'참여 요청':'학원 소식'} · {shortDate(n.date)}{!n.isRead?' · NEW':''}</span><strong>{n.title}</strong></span><ChevronRight size={17}/></Button>;
 return <div className="portal-shell">
  <aside className="sidebar"><Link className="brand" href={href('home')}><span className="brand-symbol"><GraduationCap/></span><span>우리의 배움<small>FAMILY PORTAL</small></span></Link><div className="sidebar-caption">함께 자라는 하루</div><nav aria-label="주 메뉴">{navigation.map(v=>nav(v))}</nav><div className="sidebar-bottom"><Heart size={18}/><p>작은 배움을 모아<br/>더 큰 내일로.</p><small>학부모 · 학생 체험 포털</small></div></aside>
  <div className="workspace"><header className="topbar"><span className="desktop-crumb">가족 포털 <ChevronRight size={13}/> {sectionLabels[section]}</span><span className="mobile-brand"><GraduationCap size={22}/> 우리의 배움</span><div className="topbar-actions"><Badge variant="outline">체험 중</Badge><Button variant="ghost" size="icon" asChild><Link href={href('notifications')} aria-label={'알림 '+unread+'개'}><Bell size={19}/></Link></Button><Button variant="ghost" size="icon" asChild><Link href={href('profile')} aria-label="내 정보"><Avatar className="size-8"><AvatarFallback>{parent?'보호':'하늘'}</AvatarFallback></Avatar></Link></Button></div></header>
   <main className="portal-main"><div className="demo-strip"><span><Sparkles size={15}/> 가상의 가족으로 둘러보는 공개 예시</span><div className="role-switch" aria-label="체험 역할"><Button size="sm" variant={parent?'default':'ghost'} asChild><Link href={href('home','haneul','parent')}>학부모</Link></Button><Button size="sm" variant={!parent?'default':'ghost'} asChild><Link href={href('home','haneul','student')}>학생</Link></Button></div></div>
   <div className="context-row"><div className="profile-context"><Avatar className="size-11"><AvatarFallback>{profile.name.slice(1)}</AvatarFallback></Avatar><div><Label htmlFor="child" className="context-label">{parent?'함께 보고 있는 자녀':'나의 배움'}</Label>{parent?<NativeSelect id="child" value={context.studentId} onChange={e=>router.push(href(section,e.target.value))}>{profiles.map(p=><NativeSelectOption key={p.id} value={p.id}>{p.name} · {p.academy}</NativeSelectOption>)}</NativeSelect>:<strong>{profile.name} · {profile.academy}</strong>}</div></div><Badge variant="secondary">{profile.className}</Badge></div>
   {success?<Alert className="feedback" role="status"><Check/><AlertDescription>{success}</AlertDescription></Alert>:null}{error&&!modal?<Alert variant="destructive" role="alert"><AlertDescription>{error}</AlertDescription></Alert>:null}
   {section==='home'?<>
    <section className="welcome"><div><p className="eyebrow">GROW TOGETHER, EVERY DAY</p><h1>{parent?profile.name+'의 하루,':'오늘도 한 걸음,'}<br/>{parent?'함께 지켜봐요.':'나답게 배워요.'}</h1><p>배움의 순간을 놓치지 않도록.<br className="mobile-only"/> 오늘의 수업과 새로운 소식을 모았어요.</p><Button asChild><Link href={href('schedule')}>수업 일정 보기<ArrowUpRight size={16}/></Link></Button></div><div className="welcome-art" aria-hidden="true"><span className="orbit one"/><span className="orbit two"/><span className="book"><BookOpen size={70}/></span><span className="art-star">✦</span><span className="art-caption">a little more, every day</span></div></section>
    <section className="summary-grid" aria-label="나의 배움 요약"><Card><CardContent className="summary"><span><CalendarDays size={17}/>다가오는 수업</span><strong>{upcoming.length}<small>개</small></strong><p>차근차근 쌓이는 배움</p></CardContent></Card><Card><CardContent className="summary"><span><Ticket size={17}/>남은 수강권</span><strong>{passes.reduce((n,p)=>n+p.remaining,0)}<small>회</small></strong><p>다음 배움이 기다려요</p></CardContent></Card><Card><CardContent className="summary"><span><Bell size={17}/>새로운 소식</span><strong>{unread}<small>개</small></strong><p>아직 확인하지 않은 공지</p></CardContent></Card></section>
    <div className="home-grid"><section><div className="section-title"><h2>지금, 우리의 수업</h2><Button variant="ghost" size="sm" asChild><Link href={href('schedule')}>전체 보기<ChevronRight size={14}/></Link></Button></div><Card className="lesson-card"><CardContent>{current?sessionCard(current):<p>예정된 수업이 없어요.</p>}<Separator/><div className="teacher-note"><Avatar><AvatarFallback>{profile.teacher.slice(0,1)}</AvatarFallback></Avatar><div><strong>{profile.teacher} 선생님과 함께해요</strong><p>궁금한 점은 소통 메뉴에서 남겨주세요.</p></div></div></CardContent></Card><div className="section-title"><h2>학원에서 온 소식</h2><Button variant="ghost" size="sm" asChild><Link href={href('community')}>전체 보기<ChevronRight size={14}/></Link></Button></div><Card className="notice-list"><CardContent>{notices.map(noticeCard)}</CardContent></Card></section><section><div className="section-title"><h2>{parent?'챙겨 주세요':'나의 수강권'}</h2></div>{unpaid.length?<Card className="invoice-highlight"><CardHeader><Badge variant="secondary">청구서가 도착했어요</Badge><CardTitle>{unpaid[0].title}</CardTitle><CardDescription>{shortDate(unpaid[0].dueDate)}까지 · 결제 체험</CardDescription></CardHeader><CardContent><strong className="amount">{money(unpaid[0].amount)}</strong><Button className="full" onClick={()=>open({kind:'invoice',item:unpaid[0]})}>청구서 확인<ChevronRight size={16}/></Button></CardContent></Card>:null}{passes.map(p=><Card key={p.id} className="pass-mini"><CardHeader><CardDescription>{profile.academy}</CardDescription><CardTitle>{p.title}</CardTitle></CardHeader><CardContent><div className="pass-count"><strong>{p.remaining}회</strong><span>/ 총 {p.total}회</span></div><Progress value={p.remaining/p.total*100} aria-label="남은 수강권"/><p>{shortDate(p.expires)}까지 사용 가능</p><Button variant="outline" className="full" asChild><Link href={href('passes')}>수강권 자세히</Link></Button></CardContent></Card>)}</section></div>
   </>:<>
    <div className="page-heading"><p className="eyebrow">{profile.academy}</p><h1>{sectionLabels[section]}</h1><p>{{schedule:'수업 일정과 출결을 한눈에 확인해요.',passes:'남은 배움과 유효기간을 확인해요.',community:'학원의 소식과 마음을 주고받아요.',payments:'청구서와 결제 체험 내역을 확인해요.',notifications:'확인이 필요한 소식을 모았어요.',profile:'가족과 학원으로 이어진 나의 정보예요.',home:''}[section]}</p></div>
    {section==='schedule'?<SchedulePanel sessions={sessions} today={today} renderSession={sessionCard}/>:null}
    {section==='passes'?<PassPanel data={data}/>:null}
    {section==='community'?<CommunityPanel data={data} act={act} busy={busy} renderNotice={noticeCard}/>:null}
    {section==='payments'?<PaymentsPanel data={data} act={act} busy={busy} error={error}/>:null}
    {section==='notifications'?<Card className="notice-list"><CardContent>{notices.map(noticeCard)}{unpaid.length?<Button variant="ghost" className="notice-row" asChild><Link href={href('payments')}><span className="notice-icon"><CreditCard size={19}/></span><span className="grow"><span className="notice-meta">청구서</span><strong>확인할 청구서 {unpaid.length}건이 있어요</strong></span><ChevronRight size={17}/></Link></Button>:null}<p className="muted">앱 안의 소식 목록이에요. 외부 푸시 알림은 발송하지 않아요.</p></CardContent></Card>:null}
    {section==='profile'?<div className="two-columns"><Card><CardHeader><UserRound className="section-icon"/><CardTitle>{parent?'김하늘·김지우의 보호자':profile.name}</CardTitle><CardDescription>{parent?'학부모':'학생'} 역할로 체험 중</CardDescription></CardHeader><CardContent><dl className="details"><div><dt>선택한 학생</dt><dd>{profile.name}</dd></div><div><dt>연결된 학원</dt><dd>{profile.academy}</dd></div><div><dt>수업</dt><dd>{profile.className}</dd></div><div><dt>담당 선생님</dt><dd>{profile.teacher}</dd></div></dl></CardContent></Card><Card><CardHeader><CardTitle>체험 안내</CardTitle></CardHeader><CardContent className="explanation"><Button className="full" variant="outline" asChild><Link href={href('payments')}>청구서 · 결제 내역<ChevronRight size={16}/></Link></Button><p>가상의 가족과 학원으로 구성한 공개 예시예요. 다른 방문자와 체험 기록을 공유해요.</p><p>역할 전환은 실제 로그인 기능이 아니에요. 실사용 전에는 가족 초대와 계정 인증을 연결해야 해요.</p><p>학원 내부 상담 기록이나 실제 개인정보는 포함하지 않아요.</p><Button variant="outline" asChild><Link href={href('home','haneul',parent?'student':'parent')}>{parent?'학생':'학부모'} 화면 체험하기<ArrowUpRight size={16}/></Link></Button></CardContent></Card></div>:null}
   </>}
   <footer className="page-footer"><Heart size={13}/> 오늘의 작은 배움이 내일의 가능성으로.</footer>
   </main><nav className="bottom-nav" aria-label="모바일 메뉴">{(['home','passes','schedule','payments','community'] as Section[]).map(v=>nav(v,true))}</nav>
  </div>
  <Dialog open={modal!==null} onOpenChange={value=>{if(!value&&!busy)setModal(null);}}><DialogContent className="portal-dialog"><DialogHeader><DialogTitle>{modal?.kind==='notice'?modal.item.title:modal?.kind==='invoice'?'청구서 · 결제 체험':'사전 출결 알리기'}</DialogTitle><DialogDescription>{profile.name} · {profile.academy}</DialogDescription></DialogHeader>
   {modal?.kind==='notice'?<NoticeDetail key={modal.item.id} notice={notices.find(n=>n.id===modal.item.id)??modal.item} data={data} act={act} busy={busy}/>:null}
   {modal?.kind==='invoice'?<><dl className="details"><div><dt>내역</dt><dd>{modal.item.title}</dd></div><div><dt>금액</dt><dd>{money(modal.item.amount)}</dd></div><div><dt>납부 기한</dt><dd>{modal.item.dueDate}</dd></div></dl><Alert><AlertDescription>실제 결제가 아니며 돈이 청구되지 않아요. 체험 기록만 저장해요.</AlertDescription></Alert>{modal.item.status==='unpaid'?<DialogFooter><Button disabled={busy} onClick={()=>act({action:'pay',id:modal.item.id},'결제 체험을 완료했어요. 실제 과금은 없어요.')}>{busy?'처리 중…':'실제 과금 없이 결제 체험'}</Button></DialogFooter>:<Badge variant="secondary">체험 결제 완료</Badge>}</>:null}
   {modal?.kind==='session'?<form onSubmit={e=>{e.preventDefault();const form=new FormData(e.currentTarget);void act({action:'intention',id:modal.item.id,choice:form.get('choice'),reason:form.get('reason')},'출결 예정을 저장했어요.');}}><p className="muted">{modal.item.date} · {modal.item.title}</p><Label htmlFor="intention">참석 예정</Label><NativeSelect id="intention" name="choice" defaultValue={modal.item.intention||'attend'}><NativeSelectOption value="attend">참석할게요</NativeSelectOption><NativeSelectOption value="absent">결석 예정이에요</NativeSelectOption></NativeSelect><Label htmlFor="reason">결석 사유 (결석 선택 시 필수)</Label><Textarea id="reason" name="reason" maxLength={200} defaultValue={modal.item.reason} placeholder="선생님께 알려드릴 내용을 적어주세요."/><DialogFooter><Button type="submit" disabled={busy}>{busy?'저장 중…':'출결 예정 저장'}</Button></DialogFooter></form>:null}
   {error?<Alert variant="destructive" role="alert"><AlertDescription>{error}</AlertDescription></Alert>:null}
  </DialogContent></Dialog>
 </div>;
}
