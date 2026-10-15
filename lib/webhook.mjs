import {createHmac,timingSafeEqual} from 'node:crypto';
export function verifyResendWebhook({body,headers,secret,now=Date.now()}){
 if(!secret||!secret.startsWith('whsec_'))return false;
 const id=headers.get('svix-id'),stamp=headers.get('svix-timestamp'),signature=headers.get('svix-signature');
 const seconds=Number(stamp);
 if(!id||!/^\d{10}$/.test(stamp||'')||!Number.isFinite(seconds)||Math.abs(now-seconds*1000)>300000||!signature)return false;
 const key=Buffer.from(secret.slice(6),'base64');if(key.length<16)return false;
 const expected=createHmac('sha256',key).update(`${id}.${stamp}.${body}`).digest();
 return signature.split(' ').some(part=>{if(!part.startsWith('v1,'))return false;let sig;try{sig=Buffer.from(part.slice(3),'base64')}catch{return false}return sig.length===expected.length&&timingSafeEqual(sig,expected)})
}
