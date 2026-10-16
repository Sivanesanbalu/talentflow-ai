// Never derive bearer-token invitation links from an untrusted request Host header.
export function invitationOrigin(env=process.env) {
 const configured=env.APP_BASE_URL || env.NEXT_PUBLIC_APP_URL ||
   (env.VERCEL_URL ? 'https://'+env.VERCEL_URL : '');
 if (!configured) throw Error('Invitation URL configuration missing');
 const url=new URL(configured);
 const local=env.NODE_ENV!=='production' && ['localhost','127.0.0.1'].includes(url.hostname);
 if((url.protocol!=='https:'&&!local) || url.username || url.password || url.search || url.hash ||
   !url.hostname || (url.pathname!=='/'&&url.pathname!=='')) {
  throw Error('Invalid invitation base URL');
 }
 return url.origin;
}
export function invitationLink(secret,env=process.env){
 return new URL('/interview-studio?invite='+encodeURIComponent(secret),invitationOrigin(env)).toString();
}
