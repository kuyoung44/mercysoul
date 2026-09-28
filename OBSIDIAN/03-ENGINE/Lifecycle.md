# Engine Lifecycle

1. **STOP** — prevent uncontrolled execution.
2. **VERIFY** — validate the requested command and available routing.
3. **AUTHORIZE** — require explicit authorization for execution.
4. **EXECUTE** — invoke the approved adapter.
5. **VERIFY_RESULT** — inspect the actual provider result.
6. **AUDIT** — persist the lifecycle and result evidence.

## Failure rule
Unverified execution is not reported as successful execution.
