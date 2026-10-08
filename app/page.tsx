import { notFound } from 'next/navigation';
import { database } from '../src/runtime.ts';
import { context,loadPortal,PortalError } from '../src/portal.ts';
import { sections,type Section } from '../src/model.ts';
import { Setup } from '../components/setup.tsx';
import { Portal } from '../components/portal.tsx';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 const params=await searchParams;
 const value=(key:string)=>typeof params[key]==='string'?params[key]:null;
 const section=value('view')??'home';if(!sections.includes(section as Section))notFound();
 let ctx;
 try {
  ctx=context(value('role'),value('student'));if(ctx.role==='student'&&section==='payments')notFound();
 }catch(error){if(error instanceof PortalError&&error.status===403)notFound();throw error;}
 const data=await loadPortal(await database(),ctx).catch(error=>{if(error instanceof PortalError&&error.status===503)return null;throw error;});
 if(!data)return <Setup allowed={process.env.PUBLIC_DEMO!=='1'&&Boolean(process.env.APP_PASSWORD)}/>;
 return <Portal key={ctx.role+':'+ctx.studentId} data={data} section={section as Section}/>;
}
