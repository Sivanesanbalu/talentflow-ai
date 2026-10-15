import pg from 'pg';
const globalPool=globalThis;
export const pool=globalPool.__talentflowPool ||= new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:undefined,max:5});
export async function sql(query,params=[]){return pool.query(query,params)}
