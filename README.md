# MercySoul OS

MercySoul Vision intake and automation core.

## Runtime

Requires Node.js 20+.

```bash
npm install
npm start
```

Health check:

```bash
npm run health
```

The health URL can be overridden with `MERCYSOUL_HEALTH_URL`.

## Optional Datadog tracing

If `dd-trace` is configured in the environment, start with:

```bash
npm run start:traced
```

For Railway, the normal production command remains `node server.js`; a `NODE_OPTIONS=--require=dd-trace/init` environment setting is now supported because `dd-trace` is included as a runtime dependency.
