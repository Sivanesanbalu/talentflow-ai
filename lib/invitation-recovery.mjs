export function validateReissueRequest(b){
 const id=String(b?.invitation_id||'');
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))throw Error('Invalid invitation id');
 if(b?.send_email!==true)throw Error('Explicit send_email approval is required');
 return {id};
}
export const RECOVERABLE_EMAIL_STATUSES=Object.freeze(['failed','bounced','not_configured']);
