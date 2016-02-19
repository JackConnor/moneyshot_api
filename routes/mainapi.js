var express = require('express');
var mongoose       = require('mongoose');
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');
console.log('yo');

module.exports = function(app){
  console.log('yoppp');
  console.log(app);

  app.get('/api/test', function(req, res){
    console.log('yp');
    res.json("boom");
  })
}
