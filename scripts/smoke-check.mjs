// Read-only HTTP smoke test. Protected Vercel previews should use `vercel curl` instead.
const base=process.env.TALENTFLOW_URL;
if(!base) { console.error('Set TALENTFLOW_URL to the deployment base URL'); process.exit(2); }
const root=new URL(base);
if(!['https:','http:'].includes(root.protocol))throw Error('Invalid URL scheme');
for(const route of ['/api/health','/api/auth','/api/interviews']) {
  const response=await fetch(new URL(route,root),{redirect:'manual',signal:AbortSignal.timeout(12000)});
  const contentType=response.headers.get('content-type')||'';
  if([301,302,303,307,308,401,403].includes(response.status)&&route==='/api/health') {
    console.error(route, 'HTTP '+response.status+' — preview may be protected; use authenticated vercel curl');process.exitCode=1;continue;
  }
  if(route==='/api/health'){
    if(!response.ok||!contentType.includes('application/json')){console.error(route,'Unhealthy HTTP '+response.status);process.exitCode=1;continue;}
    const data=await response.json();console.log(route,data.status||'unknown');if(data.status!=='healthy')process.exitCode=1;
  }else if(route==='/api/interviews'){
    // A visitor without a recruiter session must not receive protected data.
    if(![401,403].includes(response.status)){console.error(route,'Expected access denial; got',response.status);process.exitCode=1;}
    else console.log(route,'Access denied as expected',response.status);
  }else console.log(route,'HTTP',response.status);
}
