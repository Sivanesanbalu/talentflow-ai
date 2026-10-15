import {sql} from '../../../lib/db';

export const dynamic = 'force-dynamic';

const noStore = {'Cache-Control':'no-store, max-age=0'};

export async function GET() {
  try {
    await sql('SELECT 1');
    return Response.json({status:'healthy',database:'connected'}, {headers:noStore});
  } catch {
    return Response.json({status:'degraded'}, {status:503,headers:noStore});
  }
}
