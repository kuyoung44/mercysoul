import crypto from 'node:crypto';
import multer from 'multer';
import { config as appConfig } from '../config.js';
import { chatRateLimit } from '../middleware/rateLimit.js';
import { sanitizeMessage } from '../middleware/input.js';
import { handleApiError } from '../middleware/errorHandler.js';
import { requestLogging } from '../middleware/requestLogging.js';
import { enforceMercySoulInput } from '../lib/mercy-enforcement.js';

export const config = { api: { bodyParser: false } };
const MAX_PDF_SIZE = 50 * 1024 * 1024;
const SYSTEM_PROMPT = `You are MercySoul Vision Brain, the warm, calm, truthful Sales Concierge for MercySoul Dominion.
IDENTITY
- Parent brand: MercySoul Dominion. Flagship: MercySoul Vision Brain.
- Tagline: "Where Imagination Becomes Sacred Art."
- SI means Soul Intelligence, MercySoul's chosen brand philosophy, not a scientifically established intelligence category.
- Global statement: "Global Vision. Soul Intelligence. Responsible Innovation. Lasting Legacy."
- Brand palette: deep purple #1A0033, royal gold #FFD700, black, restrained white. Signature: Aṣẹ.
- Website: https://mercysoul.vercel.app
- WhatsApp: +234 813 527 8110; https://wa.me/2348135278110
OFFERS AND INDICATIVE USD STARTING PRICES
- Vision Brain custom digital artwork: $5 per image starting.
- Build Flash website project: $99 starting.
- MercySoul Business Assistant setup: $149 starting.
- Command centers, dashboards, evaluation systems, integrations, and custom software: custom quote after scope review.
- Prices are indicative, not guaranteed quotes. Domains, hosting, APIs, taxes, complexity, revisions, and maintenance may cost extra.
PAYMENT
- Payment policy is CRYPTO ONLY.
- Never invent or infer a wallet address, QR code, asset, network, amount, or payment confirmation.
- Confirm exact asset, network, amount, and receiving wallet through an official MercySoul contact route. Crypto transfers can be irreversible. Verify receipt through the approved process before work begins.
- Do not claim a wallet, automatic checkout, payment webhook, or automated verification is configured unless verified.
CUSTOMER CARE
- Be warm, composed, empathetic, clear, and professional. Never beg, pressure, manipulate, or exaggerate.
- Ask only useful questions to scope work. Explain deliverables, limitations, dependencies, and next steps.
- Never invent registrations, awards, certifications, partnerships, customers, sales, metrics, or working features. Describe global reach as an ambition unless evidence confirms actual reach.
- Distinguish planned, committed, deployed, tested, and end-to-end verified features. A deployment marked READY does not prove every workflow works.
GOVERNANCE AND DEVICES
- Follow RECEIVE -> ROUTE -> THINK -> PLAN -> GUARDIAN -> APPROVE -> EXECUTE -> VERIFY -> RECOVER -> RECORD.
- Operational rule: OBSERVE -> VERIFY -> PROTECT -> MODIFY ONLY WITH AUTHORIZATION -> TEST -> RECORD -> LOCK.
- Capability is not permission. Do not perform consequential external actions without explicit authorization, appropriate permissions, and verification. Human judgment remains required.
- Never expose credentials, service-role keys, tokens, or private data. Do not claim Samsung, MacroDroid, SmartThings, Bixby, or other device integrations are connected unless end-to-end tests confirm them.
- If evidence is incomplete or risk is unclear, pause and explain the uncertainty.
Respond in concise, easy-to-scan language. End with "Aṣẹ." when natural.`;
const PRICE_LIST = `Vision Brain custom digital artwork — $5/image starting
Build Flash website project — $99/project starting
MercySoul Business Assistant setup — $149/setup starting
Command centers, dashboards, evaluation systems, integrations, and custom software — custom quote after scope review
Payment policy: crypto only. Confirm the exact asset, network, amount, and receiving wallet through an official MercySoul contact route before sending funds.`;
const PRICE_PATTERN = /\\b(price|prices|pricing|cost|costs|how much|payment|pay|paying|catalog|catalogue|fee|fees|price list|list of prices)\\b/i;
const SERVICE_PATTERN = /\\b(service|services|options|offerings|what do you sell|what do you offer|what services do you offer|what does mercy?soul sell)\\b/i;
const BLOCKED = [
  /\\b(kill|murder|assassinate|bomb|terrorize|terrorise)\\b/i,
  /\\b(hurt|harm|attack|threaten)\\s+(someone|somebody|him|her|them|people|person)\\b/i,
  /\\b(make|build|create)\\s+(a\\s+)?(bomb|explosive|weapon)\\b/i,
];
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PDF_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype === 'application/pdf' || file.originalname?.toLowerCase().endsWith('.pdf')),
});
function parseMultipart(req){return new Promise((resolve,reject)=>pdfUpload.single('file')(req,{},error=>error?reject(error):resolve()));}
function ensureAse(text){
  let cleaned=String(text||'').trim()||'Please tell me what business solution you need and I will be happy to help.';
  cleaned=cleaned.replace(/https?:\/\/\S+/gi,'').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1')
    .replace(/^\s*[-*•]\s+/gm,'').replace(/^\s*\d+[.)]\s+/gm,'')
    .replace(/\*\*([^*]+)\*\*/g,'$1').replace(/__([^_]+)__/g,'$1')
    .replace(/={2,}/g,'').replace(/\bColor:\s*/gi,'').replace(/\n{3,}/g,'\n\n')
    .replace(/Aṣẹ\.?\s*$/iu,'').trim();
  return `${cleaned}\n\nAṣẹ.`;
}
function rateLimit(req,res){let allowed=true;chatRateLimit(req,res,()=>{allowed=true;});return allowed&&!res.headersSent;}
function validateOrigin(req){const origin=String(req.headers?.origin||'').trim();return !origin||appConfig.ALLOWED_ORIGINS.includes('*')||appConfig.ALLOWED_ORIGINS.includes(origin);}
async function fetchGemini(payload,requestId){
  const models=[appConfig.GEMINI_MODEL,String(process.env.GEMINI_FALLBACK_MODEL||'gemini-2.5-flash').trim()].filter((v,i,a)=>v&&a.indexOf(v)===i);
  let lastResponse=null;
  for(const model of models){
    const endpoint=`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const controller=new AbortController();
    const timer=setTimeout(()=>controller.abort(),appConfig.CHAT_TIMEOUT_MS);
    try{
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':appConfig.GEMINI_API_KEY,'x-goog-api-client':'mercysoul/5.1'},body:JSON.stringify(payload),signal:controller.signal});
      lastResponse=response;
      if(response.ok)return response;
      if(![429,500,502,503,504].includes(response.status))return response;
    }catch(error){
      if(error?.name==='AbortError'){const timeout=new Error('AI engine timeout. Please try again.');timeout.statusCode=504;timeout.code='AI_ENGINE_TIMEOUT';throw timeout;}
      error.requestId=requestId;
    }finally{clearTimeout(timer);}
    await new Promise(r=>setTimeout(r,350));
  }
  return lastResponse;
}
export default async function handler(req,res){
  const requestId=String(req.headers?.['x-request-id']||crypto.randomUUID?.()||Date.now());
  req.requestId=requestId;requestLogging(req,res,()=>{});
  res.setHeader('x-request-id',requestId);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
  const origin=String(req.headers?.origin||'').trim();
  if(origin && appConfig.ALLOWED_ORIGINS.includes(origin)){
    res.setHeader('Access-Control-Allow-Origin',origin);
    res.setHeader('Vary','Origin');
  }
  res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Accept, X-Request-Id');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='POST')return res.status(405).json({success:false,error:'Method not allowed.',code:'METHOD_NOT_ALLOWED'});
  if(!validateOrigin(req))return res.status(403).json({success:false,error:'Request origin is not authorized.',code:'ORIGIN_NOT_ALLOWED'});
  if(!rateLimit(req,res))return;
  try{
    const isMultipart=String(req.headers['content-type']||'').toLowerCase().startsWith('multipart/form-data');
    if(isMultipart)await parseMultipart(req);
    const message=sanitizeMessage(req.body?.message);
    const enforcement=await enforceMercySoulInput({input:message,sourceService:'mercysoul-os',kind:'prompt'});
    if(enforcement.action==='block'||enforcement.action==='quarantine')return res.status(422).json({success:false,error:'This request is blocked by the MercySoul Creation & Provenance Lock.',code:'MERCYSOUL_ENFORCEMENT_BLOCKED',reason:enforcement.reason});
    if(BLOCKED.some(pattern=>pattern.test(message)))return res.status(400).json({success:false,error:'The request cannot be processed.',code:'REQUEST_BLOCKED'});
    if(PRICE_PATTERN.test(message)||SERVICE_PATTERN.test(message))return res.status(200).json({success:true,data:{reply:`${PRICE_LIST}\\n\\nFor orders, please click the gold 'Chat on WhatsApp' button below.\\n\\nAṣẹ.`,concierge:true}});
    const uploadedFile=req.file;
    const parts=[{text:message}];
    if(uploadedFile)parts.push({inline_data:{mime_type:'application/pdf',data:uploadedFile.buffer.toString('base64')}});
    const response=await fetchGemini({systemInstruction:{parts:[{text:SYSTEM_PROMPT}]},contents:[{role:'user',parts}]},requestId);
    const data=await response?.json().catch(()=>({}));
    if(!response?.ok){
      console.error('[MercySoul Gemini]',JSON.stringify({event:'gemini_failure',requestId,status:response?.status||0,models:[appConfig.GEMINI_MODEL,process.env.GEMINI_FALLBACK_MODEL||'gemini-2.5-flash'],providerError:String(data?.error?.message||'').slice(0,500)}));
      return res.status(200).json({success:true,data:{reply:'The Vision Brain is temporarily busy. I have switched to the backup AI route; please try again shortly.',fallback:true}});
    }
    const text=data?.candidates?.[0]?.content?.parts?.map(p=>p?.text||'').join(' ').trim()||'';
    return res.status(200).json({success:true,data:{reply:ensureAse(text),concierge:true}});
  }catch(error){
    if(error?.code==='LIMIT_FILE_SIZE'){error.statusCode=413;error.code='PDF_TOO_LARGE';error.publicMessage='PDF is too large. Maximum size is 50 MB.';}
    else if(error?.code==='LIMIT_FILE_COUNT'||error?.code==='LIMIT_UNEXPECTED_FILE'){error.statusCode=400;error.code='INVALID_FILE_COUNT';error.publicMessage='Please upload one PDF file only.';}
    if(error?.code==='AI_ENGINE_TIMEOUT')return handleApiError(error,req,res);
    console.error('[MercySoul Chat]',JSON.stringify({requestId,message:error?.message,stack:error?.stack}));
    return res.status(200).json({success:true,data:{reply:'The Vision Brain is temporarily busy. Please try again shortly.',fallback:true}});
  }
}