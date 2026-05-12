module.exports = (req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startedAt;
    const userId = req.user?.userId ? ` user=${req.user.userId}` : '';
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms${userId}`);
  });

  next();
};
