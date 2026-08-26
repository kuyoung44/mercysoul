import { evaluateEmotionalShield, EMOTIONAL_SHIELD_PROTOCOL } from '../emotional-shield.js';

export const MERCYSOUL_CONSTITUTION = Object.freeze({
  name: 'MercySoul Dominion Constitution', version: '4.1.0', motto: 'One Vision, Many Connections, Governed by Privacy, Security, Peace, and Human-Centered Intelligence.', effective: '2026-08-26',
  precedence: ['security','privacy','identity','connection','peace','vision','creation'],
  layers: Object.freeze({
    vision:{rule:"The user's intention is the highest creative command.",law:'VisionBrain determines whether intent is sufficiently clear and safe; material ambiguity triggers clarification.'},
    identity:{rule:"The user's identity is sacred.",law:'No external data, location, or social profile is accessed, stored, or shared without explicit consent. Visual similarity is not evidence of connection.'},
    connection:{rule:"The user's connections remain their own.",law:'The system facilitates honest, respectful interaction and never forces, manipulates, or exploits relationships.'},
    peace:{rule:'Peace is protected through respectful, evidence-based moderation.',law:'Provocation, insults, harassment, manipulation, and threats may trigger proportionate warning, review, or temporary access restriction based on observable behavior. Intent is not assumed with certainty.'},
    security:{rule:'The ruler is bound by the same laws as citizens.',law:'No privileged bypass exists. Auto Metric moderation, privacy boundaries, security validation, Emotional Shield, and Device Gaze Match authentication apply equally to every actor.'},
    creation:{rule:'Creation should be unique, authentic, and aligned with the user’s intended outcome.',law:'Generated artwork receives a traceable MercySoul Signature as metadata; the signature does not silently alter the artwork.'},
    deviceGaze:{rule:'Device gaze signals are consented control signals, not proof of identity or intent.',law:'The Device Gaze Match protocol may synchronize a user-provided Samsung Smart Stay/automation focus signal with the server Eye Lens state. Both signals must be active for a match; gaze data is not used to infer identity or monitor users outside MercySoul-controlled endpoints.'}
  }),
  emotionalShield:Object.freeze({protocol:EMOTIONAL_SHIELD_PROTOCOL.name,version:EMOTIONAL_SHIELD_PROTOCOL.version,protectedBehaviors:['provocation','insults','harassment','manipulation','threats'],actions:['allow','warn','review','temporary-freeze'],permanentAutomaticBan:false,permanentRecord:false,noRetaliation:true,humanReviewForAmbiguous:true,equalTreatment:true}),
  deviceGazeMatch:Object.freeze({protocol:'Device Gaze Match',version:'1.0.0',inputs:['deviceFocus','serverGaze'],matchRule:'deviceFocus === true && serverGaze === true',requiresApiKey:true,storesRawCameraData:false,identityInference:false,externalPlatformControl:false}),
  safeguards:Object.freeze(['Security and privacy override conflicting lower-priority creative goals.','No safety bypass for administrators, rulers, or privileged accounts.','No political viewpoint suppression or special political immunity.','No relationship manipulation or coercive automation.','Emotional Shield enforcement is proportional, evidence-based, reversible, and subject to review.','No permanent account penalty is assigned solely from an automated Emotional Shield signal.','Human review remains available where ambiguity materially affects safety, privacy, or outcome.','MercySoul controls only services and infrastructure it operates; it cannot impose rules on external platforms.','Device Gaze Match does not claim access to Samsung sensors or camera data; clients must explicitly send permitted focus signals.'])
});

export function constitutionStatus(){return {name:MERCYSOUL_CONSTITUTION.name,version:MERCYSOUL_CONSTITUTION.version,effective:MERCYSOUL_CONSTITUTION.effective,precedence:[...MERCYSOUL_CONSTITUTION.precedence],emotionalShield:MERCYSOUL_CONSTITUTION.emotionalShield,deviceGazeMatch:MERCYSOUL_CONSTITUTION.deviceGazeMatch,safeguards:[...MERCYSOUL_CONSTITUTION.safeguards]};}

export function evaluateConstitution({intentClear=true,privacyConsent=true,securitySafe=true,relationshipCoercion=false,emotionalShield={},deviceGazeMatch={}}={}){
  if(!securitySafe)return {decision:'block',controllingLayer:'security',reason:'Security boundary failed.'};
  if(!privacyConsent)return {decision:'block',controllingLayer:'identity',reason:'Explicit privacy consent is required.'};
  if(relationshipCoercion)return {decision:'block',controllingLayer:'connection',reason:'Coercive relationship behavior is prohibited.'};
  const emotional=evaluateEmotionalShield(emotionalShield);
  if(emotional.action==='temporary-freeze')return {decision:'temporary-freeze',controllingLayer:'peace',reason:'High-risk observable behavior requires temporary access restriction and review.',emotionalShield:emotional};
  if(emotional.action==='review')return {decision:'review',controllingLayer:'peace',reason:'Potentially harmful interpersonal behavior requires review.',emotionalShield:emotional};
  if(emotional.action==='warn')return {decision:'warn',controllingLayer:'peace',reason:'Respectful interaction boundary reached.',emotionalShield:emotional};
  if(deviceGazeMatch.required && deviceGazeMatch.matched!==true)return {decision:'review',controllingLayer:'security',reason:'Required Device Gaze Match signal is not aligned.'};
  if(!intentClear)return {decision:'clarify',controllingLayer:'vision',reason:'Materially ambiguous intent requires clarification.'};
  return {decision:'allow',controllingLayer:'vision',reason:'Constitutional prerequisites satisfied.',emotionalShield:emotional};
}
