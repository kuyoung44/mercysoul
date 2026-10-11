-- MercySoul SI security regression checks.
-- Run AFTER applying 20261011090000_secure_mercysoul_si_rpc_access.sql
-- against a disposable/staging Supabase project with the standard Supabase roles.
-- Read-only assertions: this file makes no data or schema changes.

do $$
declare
  v_table text;
  v_privilege text;
  v_function regprocedure;
  v_functions regprocedure[] := array[
    'public.ms_create_task(text,text,jsonb)'::regprocedure,
    'public.ms_approve_task(uuid,text)'::regprocedure,
    'public.ms_execute_task(uuid,text)'::regprocedure,
    'public.ms_record_verification(uuid,text,jsonb)'::regprocedure
  ];
begin
  -- Internal workflow tables must have RLS enabled and no direct client DML/read access.
  foreach v_table in array array[
    'public.frontier_workflows',
    'public.frontier_events',
    'public.frontier_tool_calls'
  ]
  loop
    if not exists (
      select 1
      from pg_class c
      where c.oid = v_table::regclass
        and c.relrowsecurity
    ) then
      raise exception 'RLS is not enabled on %', v_table;
    end if;

    foreach v_privilege in array array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']
    loop
      if has_table_privilege('anon', v_table, v_privilege) then
        raise exception 'anon retains % privilege on %', v_privilege, v_table;
      end if;
      if has_table_privilege('authenticated', v_table, v_privilege) then
        raise exception 'authenticated retains % privilege on %', v_privilege, v_table;
      end if;
    end loop;

    -- Service-role operations must remain available for trusted server-side code.
    if not has_table_privilege('service_role', v_table, 'SELECT')
       or not has_table_privilege('service_role', v_table, 'INSERT')
       or not has_table_privilege('service_role', v_table, 'UPDATE')
       or not has_table_privilege('service_role', v_table, 'DELETE') then
      raise exception 'service_role lost required table privileges on %', v_table;
    end if;
  end loop;

  -- Privileged RPCs must not be executable by PUBLIC/anon/authenticated.
  foreach v_function in array v_functions
  loop
    if has_function_privilege('anon', v_function, 'EXECUTE') then
      raise exception 'anon can still execute privileged RPC %', v_function;
    end if;
    if has_function_privilege('authenticated', v_function, 'EXECUTE') then
      raise exception 'authenticated can still execute privileged RPC %', v_function;
    end if;
    if not has_function_privilege('service_role', v_function, 'EXECUTE') then
      raise exception 'service_role cannot execute privileged RPC %', v_function;
    end if;

    if not exists (
      select 1
      from pg_proc p
      where p.oid = v_function
        and p.prosecdef
        and p.proconfig @> array['search_path=pg_catalog, public, pg_temp']
    ) then
      raise exception 'RPC % lost SECURITY DEFINER or hardened search_path configuration', v_function;
    end if;
  end loop;
end;
$$;

-- Expected: DO completes without exception.
