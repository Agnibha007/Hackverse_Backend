export function errorHandler(err, req, res, next) {
  // Map Postgres unique constraint violations to 409
  if (err.code === "23505") {
    const field = err.detail?.includes("username") ? "Username" : "Email";
    return res.status(409).json({ success: false, data: null, error: `${field} already taken` });
  }

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
    error: statusCode < 500 ? err.message : "Internal server error",
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    data: null,
    error: "Endpoint not found",
  });
}
