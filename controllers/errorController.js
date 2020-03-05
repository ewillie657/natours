const AppError = require('./../Utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  console.log(value);
  const message = `Duplicate field value: ${value}. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = err =>
  new AppError('Invalid Token please login again', 401);

const handleJWTExpiredError = err =>
  new AppError('Your token has expired! Pleased login again', 401);

const sendErrorDev = (err, req, res) => {
  // the req is not necessary unless using PUG
  // The if statement is if am using PUG including the else...... so if no Pug would use the following without a if
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  // NOT NECCESSARY UNLESS USING PUG
  // B) RENDERED WEBSITE
  console.error('ERROR', err);
  return res.status(err.statusCode).render('error', {
    title: ' Something went wrong!',
    msg: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  // the req is not necessary unless using PUG
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
    //Programming or other unknown error: dont't leak error details
    //1) Log error
    console.error('ERROR', err);
    //2) send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong'
    });
  }
  // B)
  //  RENDERED WEBSITE, PUG
  // B) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: ' Something went wrong!',
      msg: err.message
    });
  }
  // B) Programming or other unknown error: dont't leak error details
  //1) Log error
  console.error('ERROR', err);
  //2) send generic message
  return res.status(err.statusCode).render('error', {
    title: ' Something went wrong!',
    msg: 'Please try again later'
  });
};

module.exports = (err, req, res, next) => {
  //   console.log(err.stack);
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res); // the req is not necessary unless using PUG
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError(error);
    if (error.name === 'TokenExpiredError')
      error = handleJWTExpiredError(error);

    sendErrorProd(error, req, res); // the req is not necessary unless using PUG
  }
};
