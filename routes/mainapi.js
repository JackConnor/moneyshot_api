var express           = require('express');
var mongoose          = require('mongoose');
var bodyParser        = require('body-parser');
var methodOverride    = require('method-override');
var multer            = require('multer');
var upload            = multer({dest: './routes/uploads/'})
var cloudinary        = require('cloudinary');

///////cloudinary configuration
cloudinary.config({
  cloud_name: "drjseeoep"
  ,api_key: 632163526492235
  ,api_secret: 'otIFpH0cDOvG5Rn2L2Dorpq_n4Y'
});

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
      // console.log(photos);
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
  console.log(cloudinary);

  app.post('/api/newimage', upload.array('file', 1), function(req, res){
    console.log('yoyoyoyoyoyoy uploading an image');
    console.log(req.body);
    console.log(req.files);
    var filename = req.files[0].filename;
    console.log(filename);
    var destination = req.files[0].destination;
    console.log(destination);
    var filePath = destination + filename;
    console.log(filePath);
    cloudinary.uploader.upload("./routes/uploads/"+filename, function(result) {
      console.log(result)
      Photo.create({url: result.secure_url, location: 90210, date: new Date(), photosubjects: ['kris jenner', 'kim kardashian', 'kanye west'], status: "submitted for sale"}, function(err, newPhoto){
        console.log(newPhoto);
        res.json(newPhoto);
      })
    });
  })

  app.get('/api/all/photos', function(req, res){
    Photo.find({}, function(err, photos){
      console.log(photos);
      res.json(photos)
    });
  })
  // app.get('/api/testCloud', function(req, res){
  //   cloudinary.uploader.upload("./routes/uploads/3d6a26a1db43670bf3fa768547e48c58", function(err, result) {
  //     console.log(err);
  //     console.log(result);
  //     res.json(result);
  //   });
  // })
  ///////////////end photo db calls////////////////////
  /////////////////////////////////////////////////////

  ///////add a price and a status of "submitted" to any photo, menaing it's accepted into the system and sent back to the user
  app.post('/api/accepted/photo', function(req, res){
    Photo.findOne({_id: req.body.photoId}, function(thisPhoto){
      thisPhoto.status = "sold";
      thisPhoto.price = req.body.price;
      thisPhoto.save(function(updatedPhoto){
        res.json(updatedPhoto);
      })
    })
  })

}

mongoose.connect("mongodb://jackconnor:Skateboard1@ds011308.mongolab.com:11308/moneyshot_db");
