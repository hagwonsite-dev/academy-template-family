'use client';
import { Button } from '../components/ui/button';
import { Alert,AlertTitle,AlertDescription } from '../components/ui/alert';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="fallback"><Alert><AlertTitle>화면을 불러오지 못했어요</AlertTitle><AlertDescription>연결 상태를 확인하고 다시 시도해 주세요.</AlertDescription></Alert><Button onClick={reset}>다시 시도</Button></main>;}
