export function errorHandler(error, req, res, _next) {
  console.error('[MercySoul Error]', JSON.stringify({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl || req.url,
    requestId: req.requestId,
    message: error?.message || String(error),
    stack: error?.stack,
  }));
  if (res.headersSent) return;
  res.status(error?.statusCode || 500).json({
    success: false,
    error: error?.publicMessage || 'Internal server error.',
    code: error?.code || 'INTERNAL_ERROR',
  });
}
