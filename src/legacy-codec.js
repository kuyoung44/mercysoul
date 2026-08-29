/** MERCYSOUL LEGACY CODEC v1.0.0 */
import crypto from 'node:crypto';
export const LEGACY_CODEC = Object.freeze({name:'MercySoul Legacy Codec',version:'1.0.0',encoding:'base64url-json',integrity:'sha256',reversible:true});
const b64u=(s)=>Buffer.from(s,'utf8').toString('base64url');
const unb64u=(s)=>Buffer.from(String(s),'base64url').toString('utf8');
const digest=(s)=>crypto.createHash('sha256').update(s,'utf8').digest('hex');
export function encodeLegacy(value={}){const json=JSON.stringify(value);return {codec:LEGACY_CODEC.name,version:LEGACY_CODEC.version,payload:b64u(json),checksum:digest(json)};}
export function decodeLegacy(envelope={}){try{if(envelope.codec!==LEGACY_CODEC.name||envelope.version!==LEGACY_CODEC.version)throw new Error('Unsupported legacy codec');const json=unb64u(envelope.payload);if(digest(json)!==envelope.checksum)throw new Error('Legacy checksum mismatch');return {ok:true,value:JSON.parse(json),verified:true,codec:LEGACY_CODEC};}catch(error){return {ok:false,verified:false,error:error.message,codec:LEGACY_CODEC};}}
export function legacyCodecStatus(){return {ok:true,active:true,codec:LEGACY_CODEC};}
