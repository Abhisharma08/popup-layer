module.exports = (req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startedAt;
    const userId = req.user?.userId ? ` user=${req.user.userId}` : '';
    const requestId = req.requestId ? ` requestId=${req.requestId}` : '';
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms${userId}${requestId}`);
  });

  next();
};
