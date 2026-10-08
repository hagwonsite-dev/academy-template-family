import {test,expect} from '@playwright/test';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const require=createRequire(import.meta.url);
test('family portal: responsive roles, scoped persistent actions and accessible dialogs',async({browser,request})=>{
 const directory=await mkdtemp(join(tmpdir(),'academy-family-'));
 const env={...process.env,DATABASE_FILE:join(directory,'app.sqlite'),PUBLIC_DEMO:'1',READ_ONLY:'0'};
 for(const key of ['TURSO_DATABASE_URL','DATABASE_URL','APP_PASSWORD'])delete env[key];
 const cwd=process.cwd().endsWith('family-academy')?process.cwd():join(process.cwd(),'templates/family-academy');
 const child=spawn(process.execPath,[require.resolve('next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','4340'],{cwd,env,stdio:['ignore','pipe','pipe']});
 child.stderr.on('data',value=>process.stderr.write(value));
 try {
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('start timeout')),30000);child.once('exit',()=>{clearTimeout(timer);reject(Error('server exited'));});child.stdout.on('data',value=>{if(String(value).includes('Ready in')){clearTimeout(timer);resolve();}});});
  const base='http://127.0.0.1:4340',ctx=await browser.newContext(),page=await ctx.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base);await expect(page.getByRole('heading',{level:1})).toContainText('김하늘');
  expect((await request.get(base+'/api/portal?role=student&student=jiwoo')).status()).toBe(403);
  expect((await request.post(base+'/api/portal',{data:{action:'message',body:'foreign origin'},headers:{origin:'https://example.com'}})).status()).toBe(403);
  await mkdir('/private/tmp/academy-family-preview',{recursive:true});
  for(const width of [390,768,1440,1920]){
   await page.setViewportSize({width,height:960});await page.goto(base);
   await page.screenshot({path:'/private/tmp/academy-family-preview/home-'+width+'.png',fullPage:true});
   for(const view of ['home','schedule','passes','community','payments','notifications','profile']){
    await page.goto(base+'/?view='+view);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),view+' '+width).toBe(true);
    expect(await page.locator('button:visible,input:visible,textarea:visible,select:visible').evaluateAll(nodes=>nodes.every(n=>n.hasAttribute('data-slot')))).toBe(true);
   }
  }
  await page.setViewportSize({width:390,height:844});await page.goto(base+'/?view=schedule');
  await page.getByRole('button',{name:'사전 출결',exact:true}).first().click();await expect(page.getByRole('dialog',{name:'사전 출결 알리기'})).toBeVisible();
  await page.getByLabel('참석 예정',{exact:true}).selectOption('absent');await page.getByLabel('결석 사유').fill('브라우저 체험');await page.getByRole('button',{name:'출결 예정 저장'}).click();await expect(page.getByRole('dialog')).not.toBeVisible();await expect(page.getByText('결석 예정',{exact:true})).toBeVisible();await page.reload();await expect(page.getByText('결석 예정',{exact:true})).toBeVisible();
  await page.goto(base+'/?view=community');await page.getByRole('button',{name:/가족 공개수업/}).click();await page.getByRole('button',{name:'참석할게요',exact:true}).click();await expect(page.getByRole('dialog')).not.toBeVisible();await page.getByRole('button',{name:/가족 공개수업/}).click();await expect(page.getByText('현재 응답: 참석')).toBeVisible();await page.keyboard.press('Escape');
  await page.getByLabel('쪽지 내용').fill('저장되는 브라우저 쪽지');await page.getByRole('button',{name:'체험 쪽지 보내기'}).click();await expect(page.getByText('저장되는 브라우저 쪽지',{exact:true})).toBeVisible();await page.reload();await expect(page.getByText('저장되는 브라우저 쪽지',{exact:true})).toBeVisible();
  await page.getByLabel('함께 보고 있는 자녀').selectOption('jiwoo');await expect(page.getByText('저장되는 브라우저 쪽지',{exact:true})).toHaveCount(0);
  await page.goto(base+'/?view=payments');await page.getByRole('button',{name:'청구서 확인'}).click();await page.getByRole('button',{name:'실제 과금 없이 결제 체험'}).click();await expect(page.getByRole('dialog')).not.toBeVisible();await page.reload();await expect(page.getByText('체험 결제 완료',{exact:true})).toBeVisible();
  await page.getByRole('navigation',{name:'모바일 메뉴'}).getByRole('link',{name:'내 정보'}).click();await page.getByRole('link',{name:'청구서 · 결제 내역'}).click();await expect(page.getByText('체험 결제 완료',{exact:true})).toBeVisible();
  await page.getByRole('link',{name:'학생',exact:true}).click();await expect(page.getByRole('heading',{level:1})).toContainText('나답게 배워요');await expect(page.getByLabel('함께 보고 있는 자녀')).toHaveCount(0);await expect(page.getByRole('link',{name:'결제',exact:true})).toHaveCount(0);
  const json=await (await request.get(base+'/api/portal?role=student')).json();expect(json.invoices).toEqual([]);expect(json.profiles).toHaveLength(1);
  expect(errors).toEqual([]);await ctx.close();
 }finally{if(child.exitCode===null){child.kill('SIGTERM');await new Promise(resolve=>child.once('exit',resolve));}await rm(directory,{recursive:true,force:true});}
});
