# MercySoul OS

MercySoul Vision intake and automation core.

## Run locally

Requires Node.js 20+.

```bash
npm install
cp .env.example .env
npm start
```

Open `http://localhost:3000`.

## API

- `GET /health`
- `POST /api/visions`
- `GET /api/visions`
- `POST /api/orders`
- `GET /api/orders`
- `POST /api/payments/webhook`

## Production

Set real secrets only in the deployment environment. Never commit API/payment secrets. Add persistent database storage, object storage, HTTPS, authentication, rate limiting, transactional email, image generation credentials, and social publishing credentials before opening the service publicly.
