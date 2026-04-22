export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === "development";

  console.error(`[${new Date().toISOString()}] Error:`, {
    message: err.message,
    statusCode,
    path: req.path,
    method: req.method,
    stack: isDevelopment ? err.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    data: null,
    error: isDevelopment ? err.message : "Internal server error",
    details: isDevelopment ? err.details : undefined,
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    data: null,
    error: "Endpoint not found",
  });
}
