'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/button';
import { Card,CardHeader,CardTitle,CardContent } from './ui/card';
export function Setup({allowed}:{allowed:boolean}){
 const router=useRouter(),[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <main className="fallback"><Card><CardHeader><CardTitle>가족 포털 체험 준비</CardTitle></CardHeader><CardContent><p className="muted">가상의 가족과 수업 데이터를 생성하면 포털을 체험할 수 있어요. 실제 개인정보는 사용하지 않아요.</p>{allowed?<Button disabled={busy} onClick={async()=>{setBusy(true);setError('');try{const result=await fetch('/api/initialize',{method:'POST'});if(!result.ok)throw Error('체험 데이터를 준비하지 못했어요.');router.refresh();}catch(error){setError(error instanceof Error?error.message:'다시 시도해 주세요.');}finally{setBusy(false);}}}>{busy?'준비 중…':'가상 가족 데이터 생성'}</Button>:<p>관리자가 예시 데이터를 준비하고 있어요.</p>}{error?<p role="alert">{error}</p>:null}</CardContent></Card></main>;
}
