import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'우리의 배움 · 학부모와 학생 포털',description:'일정부터 소통까지, 가족과 학원의 하루를 잇는 체험 포털'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>;}
