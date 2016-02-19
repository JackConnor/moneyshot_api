var express = require('express');
var mongoose       = require('mongoose');
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');

module.exports = function(app){
  app.get('/api/testingbitches', function(req, res){
    res.json("boom");
  })
}
