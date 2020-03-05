const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const AppError = require('./Utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// SERVERING STATIC FILES
// app.use(express.static(`${__dirname}/public`)); // show static files such as overview.html
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Third part middleware
 */
// SET SECURITY HTTP HEADERS
app.use(helmet());

// DEVELOPMENT LOGGING
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//PREVENT THE NUMBER OF TIMES A USER CAN ATTEMPT TO MAKE REQUEST TO SAME API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour!'
});
app.use('/api', limiter);

//MiddleWare
// BODY PARSER, READING DATA FROM BODY INTO REQ.BODY
app.use(
  express.json({
    limit: '10kb'
  })
);

// PARSE DATA FROM FORM USE IN PUG/ BUT ALSO REACT AND SO ON
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// PARSE THE DATA FROM COOKIWS
app.use(cookieParser());

//DATA SANINTIZATION AGAINST NOSQL QUERY INJECTION
app.use(mongoSanitize());

// DATA SANINTIZATION AGAINST XSS
app.use(xss());

// PREVENT PARAMETER POLLUTION
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

app.use(compression());

// TEST MIDDLEWARE
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers); // get the header value can used to get ip address
  // console.log(req.cookies);
  next();
});

/**
 * MOUNT ROUTES START || 3) ROUTES
 */

// VIEWS ROUTES
app.use('/', viewRouter);
// app.use('/tour', viewRouter);

//API ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
/**
 * MOUNT ROUTES END
 */

/**
 * HANDLE ROUTES OUTSIDE THE SCOPE
 */
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this Server!`, 404));
});

// ERROR HANDLE MIDDLEWARE
app.use(globalErrorHandler);

module.exports = app;
