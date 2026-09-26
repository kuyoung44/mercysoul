import crypto from 'node:crypto';
import multer from 'multer';
import { config as appConfig } from '../config.js';
import { chatRateLimit } from '../middleware/rateLimit.js';
import { sanitizeMessage } from '../middleware/input.js';
import { handleApiError } from '../middleware/errorHandler.js';
import { requestLogging } from '../middleware/requestLogging.js';

export const config = { api: { bodyParser: false } };
const MAX_PDF_SIZE = 50 * 1024 * 1024;
const SYSTEM_PROMPT = `You are the MercySoul Vision Brain, a professional AI Sales Concierge for a digital technology agency.
- When a user asks for services, options, or prices, output:
💎 AI Chatbot (Customer Assistant) → ₦150,000
💻 Build Flash (Website Generator) → ₦100,000
🌐 News Gate (Company Website) → ₦75,000
🏰 Enterprise Framework (Master AI System) → ₦750,000
- Do not use the = symbol anywhere.
- Do not use Color: or any label.
- Keep responses tight, professional and easy to scan. Always end with "Aṣẹ".`;
const PRICE_LIST = `💎 AI Chatbot (Customer Assistant) → ₦150,000
💻 Build Flash (Website Generator) → ₦100,000
🌐 News Gate (Company Website) → ₦75,000
🏰 Enterprise Framework (Master AI System) → ₦750,000`;
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
  cleaned=cleaned.replace(/https?:\\/\\/\\S+/gi,'').replace(/\\[([^\\]]+)\\]\\([^)]*\\)/g,'$1')
    .replace(/^\\s*[-*•]\\s+/gm,'').replace(/^\\s*\\d+[.)]\\s+/gm,'')
    .replace(/\\*\\*([^*]+)\\*\\*/g,'$1').replace(/__([^_]+)__/g,'$1')
    .replace(/={2,}/g,'').replace(/\\bColor:\\s*/gi,'').replace(/\\n{3,}/g,'\\n\\n')
    .replace(/Aṣẹ\\.?\\s*$/iu,'').trim();
  return `${cleaned}\\n\\nAṣẹ.`;
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
  if(req.method!=='POST')return res.status(405).json({success:false,error:'Method not allowed.',code:'METHOD_NOT_ALLOWED'});
  if(!validateOrigin(req))return res.status(403).json({success:false,error:'Request origin is not authorized.',code:'ORIGIN_NOT_ALLOWED'});
  if(!rateLimit(req,res))return;
  try{
    const isMultipart=String(req.headers['content-type']||'').toLowerCase().startsWith('multipart/form-data');
    if(isMultipart)await parseMultipart(req);
    const message=sanitizeMessage(req.body?.message);
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