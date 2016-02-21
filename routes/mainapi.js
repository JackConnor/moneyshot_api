var express = require('express');
var mongoose       = require('mongoose');
var bodyParser     = require('body-parser');
var methodOverride = require('method-override');
console.log('yo');

///////////////////////////////////////////////////
///////////Our Models//////////////////////////////
///////////////////////////////////////////////////
var Submission  = require('../models/submission.js');
var User        = require('../models/user.js');
var Transaction = require('../models/transaction.js');
var Photo       = require('../models/photo.js');
///////////////////////////////////////////////////
///////////End Models//////////////////////////////
///////////////////////////////////////////////////

module.exports = function(app){
  console.log('here?');
  app.get('/api/test', function(req, res){
    Photo.find({}, function(err, photos){
      console.log(photos);
      res.json(photos);
    })
  })

  app.get('/api/users/newtest', function(req, res){
    User.create({firstname: "John"}, function(err, newUser){
      res.json({data: "here we go", user: newUser})
    })
  })

  app.get('/api/photos/newtest', function(req, res){
    Photo.create({creator: "56c7617d72409a68254c0fb7", url: "https://static-secure.guim.co.uk/sys-images/Guardian/Pix/pictures/2014/12/21/1419192922848/Madonna-010.jpg"}, function(err, newPhoto){
      res.json({data: "here we go", photo: newPhoto})
    })
  })


  /////////////////////////////////////////////////////
  ///////////////begin photo db calls//////////////////

  app.get('/api/allPhotos', function(req, res){
    Photo.find({}, function(err, allPhotos){
      res.json(allPhotos);
    })
  })

  app.post('/api/newimage', function(req, res){
    console.log(req.body);
    console.log(req.files);
  })

  ///////////////end photo db calls////////////////////
  /////////////////////////////////////////////////////

}

mongoose.connect("mongodb://jackconnor:Skateboard1@ds011308.mongolab.com:11308/moneyshot_db");
