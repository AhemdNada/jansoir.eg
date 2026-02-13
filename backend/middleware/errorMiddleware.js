/* eslint-disable no-unused-vars */

const notFound = (req, res, next) => {
  res.status(404);
  next(new Error('Route not found'));
};

const errorHandler = (err, req, res, next) => {
  // eslint-disable-next-line no-console
  console.error(err);

  const statusCode = res.statusCode && res.statusCode !== 200
    ? res.statusCode
    : (err && err.statusCode ? err.statusCode : 500);

  // Multer errors
  if (err && err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'File size too large. Maximum size is 5MB' });
    }
    return res.status(400).json({ success: false, message: err.message || 'File upload error' });
  }

  // Mongo duplicate key error
  if (err && err.code === 11000) {
    const fields = err.keyValue ? Object.keys(err.keyValue) : [];
    const field = fields[0] || 'field';
    const value = err.keyValue ? err.keyValue[field] : undefined;
    return res.status(400).json({
      success: false,
      message: `${field} must be unique${value !== undefined ? ` (${value})` : ''}`,
    });
  }

  // Mongoose validation error
  if (err && err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e) => e.message).filter(Boolean);
    return res.status(400).json({
      success: false,
      message: messages[0] || 'Validation error',
      errors: messages,
    });
  }

  return res.status(statusCode).json({
    success: false,
    message: err && typeof err.message === 'string' ? err.message : 'Server error',
  });
};

module.exports = { notFound, errorHandler };

