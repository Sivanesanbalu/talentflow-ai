export const MAX_ATTEMPTS=5;
export function delayMinutes(attempts){
 if(!Number.isInteger(attempts)||attempts<1)throw Error('Invalid attempt count');
 return Math.min(1440,5*Math.pow(2,attempts-1));
}
export function isRetryable(status,attempts){return ['failed','pending'].includes(status)&&Number.isInteger(attempts)&&attempts<MAX_ATTEMPTS;}
export function outcome(result,attempts){
 if(result?.status==='sent')return {status:'sent',delay:0};
 return {status:'failed',delay:delayMinutes(attempts)};
}
