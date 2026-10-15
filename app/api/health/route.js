import {sql} from '../../../lib/db';
export async function GET(){try{await sql('SELECT 1');return Response.json({status:'healthy',database:'connected',aiFollowupsConfigured:!!process.env.OPENROUTER_API_KEY,autoEmail:false})}catch{return Response.json({status:'degraded'}, {status:503})}}
