import {randomBytes,createHash,scryptSync,timingSafeEqual} from 'node:crypto';
import {cookies} from 'next/headers';
import {sql} from './db';
export const token=()=>randomBytes(32).toString('hex');
export const hash=s=>createHash('sha256').update(String(s)).digest('hex');
export function pw(password){const salt=randomBytes(16).toString('hex');return 'scrypt:'+salt+':'+scryptSync(password,salt,64).toString('hex')}
export function verify(password,saved){try{const [alg,salt,v]=saved.split(':');if(alg!=='scrypt')return false;const target=Buffer.from(v,'hex'),candidate=scryptSync(password,salt,target.length);return timingSafeEqual(target,candidate)}catch{return false}}
export async function me(){const c=await cookies(),value=c.get('tf_session')?.value;if(!value)return null;const r=await sql(`SELECT r.id,r.org_id,r.email FROM sessions s JOIN recruiters r ON r.id=s.recruiter_id WHERE s.token_hash=$1 AND s.expires_at>now()`,[hash(value)]);return r.rows[0]||null}
export async function requireMe(){const u=await me();if(!u){const e=new Error('Authentication required');e.status=401;throw e}return u}
export function fail(e){const message=String(e?.message||'Request failed');const client=/^(Invalid|Score |Review |Assessment |Invitation |Interview |Email |Organization |Candidate |Already |Choose |Authentication required)/.test(message);return Response.json({error:client?message:'Request failed'}, {status:e?.status|| (client?400:500)})}
