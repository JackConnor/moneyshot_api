var express           = require('express');
var mongoose          = require('mongoose');
var bodyParser        = require('body-parser');
var methodOverride    = require('method-override');
var multer            = require('multer');
var bcrypt            = require('bcrypt');
var upload            = multer({dest: './routes/uploads/'})
var cloudinary        = require('cloudinary');
var jwt               = require('jsonwebtoken');
console.log(process.env.JWT_SECRET);

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
var Video       = require('../models/video.js');
///////////////////////////////////////////////////
///////////End Models//////////////////////////////
///////////////////////////////////////////////////

module.exports = function(app){
  app.get('/api/test', function(req, res){
    Photo.find({}, function(err, photos){
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

  app.post('/api/newimage', upload.array('file', 1), function(req, res){
    var filename = req.files[0].filename;
    var destination = req.files[0].destination;
    var filePath = destination + filename;
    cloudinary.uploader.upload("./routes/uploads/"+filename, function(result) {
      res.json(result)
    });
  })

  app.post('/api/createphotos', function(req, res){
    var url = req.body.url;
    Photo.create({url: url, location: "los angeles", date: new Date(), photosubjects: ['kris jenner', 'kim kardashian', 'kanye west'], status: "submitted for sale", creator: req.body.userId}, function(err, newPhoto){
      var submission = new Submission();
      submission.photos.push(newPhoto._id);
      submission.creator = req.body.userId;
      submission.date = new Date();
      submission.save(function(err, newSubmission){
        User.findOne({_id:req.body.userId}, function(err, user){
          user.photos.push(newPhoto._id);
          user.submissions.push(newSubmission._id)
          user.save(function(err, updatedUser){
            res.json(newSubmission);
          })
        })
      })
    })
  })

  app.get('/api/all/photos', function(req, res){
    Photo.find({}, function(err, photos){
      res.json(photos)
    });
  })

  app.get('/api/photo/:id', function(req, res){
    Photo.findOne({_id: req.params.id}, function(err, photo){
      res.json(photo);
    })
  })

  //////get all photos from a single user
  app.get('/api/userphoto/:userid', function(req, res){
    var userId = req.params.userid;
    User.findOne({_id: req.params.userid})
    .populate('photos')
    .exec(function(err, users){
      res.json(users);
    })
  })

  //////get all submissions from a single user
  app.get('/api/usersubmissions/:userid', function(req, res){
    var userId = req.params.userid;
    User.findOne({_id: req.params.userid})
    .populate({
      path: 'submissions',
      model: 'Submission',
      populate: {
        path: 'photos',
        model: 'Photo'
      }
    })
    .populate('photos')
    .exec(function(err, user){
      res.json(user);
    })
  })

  ///////add a price and a status of "submitted" to any photo, menaing it's accepted into the system and sent back to the user
  app.post('/api/accepted/photo', function(req, res){
    Photo.findOne({_id: req.body._id}, function(err, thisPhoto){
      thisPhoto.status = req.body.status;
      thisPhoto.price = req.body.price;
      thisPhoto.save(function(err, updatedPhoto){
        res.json(updatedPhoto);
      })
    })
  })

  /////rejected photo
  app.post('/api/reject/photo', function(req, res){
    Photo.findOne({_id: req.body.photoId}, function(err, photo){
      photo.status = 'rejected';
      photo.save(function(err, updatedPhoto){
        res.json(updatedPhoto);
      })
    })
  })

  /////our first test post video call
  app.post('/api/upload/video', upload.array('file', 1), function(req, res){
    console.log('videooooo');
    console.log(req.body);
    console.log(req.files);
    console.log(req.file);
    res.json(req.body)
  })




  ///////////////end photo db calls////////////////////
  /////////////////////////////////////////////////////

  /////////////////////////////////////////////////////
  /////////////Begin Authorization calls///////////////

  /////////call to signup a new user
  app.post('/api/signup', function(req, res){
    if(req.body.password){
      bcrypt.hash(req.body.password, 8, function(err, newHash){
        User.findOne({email: req.body.email}, function(err, isEmail){
          if(isEmail == null){
            User.create({email: req.body.email, passwordDigest: newHash}, function(err, newUser){
              res.json(newUser)
            })
          }
          else{
            ////////error if email is already in the system
            res.json('email already in use');
          }
        })
      })
    }
    else {
      //////error if they don't send a password
      res.json('please send a password');
    }
  })

  //////////call to sign in an existing user
  app.post('/api/signin', function(req, res){
    User.findOne({email: req.body.email}, function(err, user){
      if(err){res.json(err)}
      else if(user == null){
        res.json('no user found with that email address');
      }
      else {
        var unhashedPW = bcrypt.compareSync(req.body.password, user.passwordDigest);
        if(unhashedPW == false){
          res.json('incorrect password');
        }
        else{
          //////////password correct
          res.json(user)
        }
      }
    })
  })

  /////////////function to set the json web token
  app.post('/api/gettoken', function(req, res){
    var token = jwt.sign({userId: req.body.userId, active: true}, process.env.JWT_SECRET);
    res.json(token);
  })


  app.get('/api/decodetoken/:token', function(req, res){
    var decodedToken = jwt.verify(req.params.token, process.env.JWT_SECRET);
    res.json(decodedToken);
  })

  ///////////////end Authorization calls///////////////
  /////////////////////////////////////////////////////

}

mongoose.connect("mongodb://jackconnor:Skateboard1@ds011308.mongolab.com:11308/moneyshot_db");
