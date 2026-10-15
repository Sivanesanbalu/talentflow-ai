export function validateRecipient(value) {
  const email=String(value||"").trim().toLowerCase();
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error("Invalid recipient email");
  return email;
}
export function invitationEmail({candidate, role, scheduledAt, url}) {
  if(!String(url).startsWith("https://")) throw Error("Invitation URL must use HTTPS");
  const name=String(candidate||"Candidate").replace(/[\r\n]/g," ").slice(0,100);
  const job=String(role||"Interview").replace(/[\r\n]/g," ").slice(0,120);
  const schedule=scheduledAt?new Date(scheduledAt).toISOString():"At your convenience before link expiration";
  return {subject:`Interview invitation: ${job}`,text:`Hello ${name},\n\nYou have been invited to interview for ${job}.\nScheduled: ${schedule} (UTC if a timestamp is shown).\nSecure interview link: ${url}\n\nPlease do not forward this private link.\n\nTalentFlow AI`};
}
export async function deliverEmail({to, subject, text, idempotencyKey},fetchImpl=fetch) {
  const key=process.env.RESEND_API_KEY,from=process.env.EMAIL_FROM;
  if(!key||!from)return {status:"not_configured",providerId:null};
  const response=await fetchImpl("https://api.resend.com/emails",{
    method:"POST",headers:{"Authorization":`Bearer ${key}`,"Content-Type":"application/json",...(idempotencyKey?{"Idempotency-Key":idempotencyKey}:{})},
    body:JSON.stringify({from,to:[validateRecipient(to)],subject,text}),signal:AbortSignal.timeout(12000)
  });
  if(!response.ok)return {status:"failed",providerId:null};
  const data=await response.json();
  return {status:"sent",providerId:String(data.id||"")||null};
}
