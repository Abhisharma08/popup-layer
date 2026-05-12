function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function notFound(message = 'Not found') {
  return httpError(404, message);
}

function forbidden(message = 'Forbidden') {
  return httpError(403, message);
}

function badRequest(message = 'Bad request') {
  return httpError(400, message);
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : err.message });
}

module.exports = {
  asyncHandler,
  httpError,
  notFound,
  forbidden,
  badRequest,
  errorHandler,
};
