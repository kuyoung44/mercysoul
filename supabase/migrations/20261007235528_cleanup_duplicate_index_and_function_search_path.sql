-- MercySoul cleanup migration
-- Removes a verified duplicate unique index and hardens the audit-claim worker
-- against mutable search_path behavior.

DROP INDEX IF EXISTS public.cbt_tests_admission_unique;

ALTER FUNCTION public.mercysoul_claim_audit_batch(text, integer)
  SET search_path = public, pg_temp;
