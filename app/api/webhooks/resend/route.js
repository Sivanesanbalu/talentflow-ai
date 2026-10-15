import {sql} from '../../../../lib/db';
import {verifyResendWebhook} from '../../../../lib/webhook.mjs';

export async function POST(req) {
  const body = await req.text();
  if (body.length > 200000 || !verifyResendWebhook({
    body, headers: req.headers, secret: process.env.RESEND_WEBHOOK_SECRET
  })) return Response.json({error:'Invalid webhook signature'}, {status:401});

  let event;
  try { event = JSON.parse(body); }
  catch { return Response.json({error:'Invalid JSON'}, {status:400}); }

  const id = event?.data?.email_id;
  const kind = event?.type;
  const statuses = {
    'email.delivered':'delivered',
    'email.bounced':'bounced',
    'email.complained':'complained',
    'email.delivery_delayed':'sent'
  };
  if (typeof id !== 'string' || !Object.hasOwn(statuses, kind)) {
    return Response.json({ok:true,ignored:true});
  }

  try {
    // Provider events can arrive out of order. Never regress delivered to sent,
    // or replace a bounced/complained terminal state with an older event.
    await sql(`UPDATE email_deliveries
      SET status=$1,updated_at=now()
      WHERE provider_message_id=$2
        AND status NOT IN ('bounced','complained')
        AND NOT (status='delivered' AND $1='sent')`,
      [statuses[kind],id]);
    return Response.json({ok:true});
  } catch {
    return Response.json({error:'Database unavailable'}, {status:503});
  }
}
