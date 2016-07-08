var express        = require('express');
var path           = require('path');
var dotenv         = require('dotenv').load();
var cors           = require('cors');
var multer         = require('multer');
var upload         = multer({dest: 'uploads/'})
// var favicon = require('serve-favicon');
var logger         = require('morgan');
var cookieParser   = require('cookie-parser');
var bodyParser     = require('body-parser');
var http           = require('http');
var mongoose       = require('mongoose');
var bodyParser     = require('body-parser');
// var jwt            = require('jsonwebtoken');
var methodOverride = require('method-override');
var passport       = require('passport');
var passportlocal = require('passport-local');
var cloudinary     = require('cloudinary');

var app           = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
/////signup stuff
app.use(passport.initialize());
app.use(passport.session());
var router = require('./routes/mainapi.js')(app);
var cms = require('../moneyshot_cms_v2/server.js');
// require('./passport.js')(passport);
app.use(function(req, res, next) {
  console.log('=============', req.path)
  if (req.path == '/cms' ) {
    res.redirect('http://45.55.24.234:5000/')
    return
  }
  next()
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.listen(process.env.PORT || '5555' || 80 || 443, function() {
  console.log('Up1')
});

app.get('*', function(req, res){

  res.sendFile( __dirname + '/public/index.html')
})


module.exports = app;
