import { NextResponse, type NextRequest } from 'next/server';
import { authorize } from './src/access.ts';
export function proxy(request:NextRequest) {
 const access=authorize(Object.fromEntries(request.headers),request.method,process.env);
 if(access!==200)return new NextResponse(access===503?'App password not configured':'Authentication required',{status:access,headers:{'WWW-Authenticate':'Basic realm="Academy", charset="UTF-8"','Cache-Control':'no-store'}});
 const nonce=Buffer.from(crypto.randomUUID()).toString('base64');
 const csp=`default-src 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV==='development'?" 'unsafe-eval'":''}; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'`;
 const forwarded=new Headers(request.headers);forwarded.set('x-nonce',nonce);forwarded.set('Content-Security-Policy',csp);
 const response=NextResponse.next({request:{headers:forwarded}});
 response.headers.set('Content-Security-Policy',csp);
 response.headers.set('Cache-Control','private, no-store');
 response.headers.set('X-Content-Type-Options','nosniff');
 response.headers.set('Referrer-Policy','no-referrer');
 return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};
