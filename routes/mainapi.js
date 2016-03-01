var express           = require('express');
var mongoose          = require('mongoose');
var bodyParser        = require('body-parser');
var methodOverride    = require('method-override');
var multer            = require('multer');
var bcrypt            = require('bcrypt');
var upload            = multer({dest: './routes/uploads/'})
var cloudinary        = require('cloudinary');
var jwt               = require('jsonwebtoken');
console.log(jwt);
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
///////////////////////////////////////////////////
///////////End Models//////////////////////////////
///////////////////////////////////////////////////

module.exports = function(app){
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

  app.post('/api/newimage', upload.array('file', 1), function(req, res){
    console.log('yoyoyoyoyoyoy uploading an image');
    console.log(req.body);
    console.log(req.files);
    // console.log(req.file)
    var filename = req.files[0].filename;
    console.log(filename);
    var destination = req.files[0].destination;
    console.log(destination);
    var filePath = destination + filename;
    console.log(filePath);
    cloudinary.uploader.upload("./routes/uploads/"+filename, function(result) {
      console.log(result)
      res.json(result)
    });
  })

  app.post('/api/createphotos', function(req, res){
    var url = req.body.url;
    Photo.create({url: url, location: "los angeles", date: new Date(), photosubjects: ['kris jenner', 'kim kardashian', 'kanye west'], status: "submitted for sale", creator: req.body.userId}, function(err, newPhoto){
      var submission = new Submission();
      submission.photos.push(newPhoto.data._id);
      submission.creator = req.body.userId;
      submission.date = new Date();
      submission.save(function(err, newSubmission){
        console.log(newSubmission);
        User.findOne({_id:req.body.userId}, function(err, user){
          user.photos.push(newPhoto._id);
          user.submissions.push(newSubmission.data._id)
          user.save(function(err, updatedUser){
            console.log(updatedUser);
            res.json(newSubmission);
          })
        })
      })
    })
  })

  app.get('/api/decodetoken/:token', function(req, res){
    console.log(req.params);
    var decodedToken = jwt.verify(req.params.token, process.env.JWT_SECRET);
    console.log(decodedToken);
    res.json(decodedToken);
  })

  app.get('/api/all/photos', function(req, res){
    Photo.find({}, function(err, photos){
      res.json(photos)
    });
  })

  app.get('/api/photo/:id', function(req, res){
    console.log('hey there');
    Photo.findOne({_id: req.params.id}, function(err, photo){
      res.json(photo);
    })
  })

  //////get all photos from a single user
  app.get('/api/userphoto/:userid', function(req, res){
    console.log(req.params);
    var userId = req.params.userid;
    console.log(userId);
    User.findOne({_id: req.params.userid})
    .populate('photos')
    .exec(function(err, users){
      console.log(users);
      res.json(users);
    })
  })

  ///////add a price and a status of "submitted" to any photo, menaing it's accepted into the system and sent back to the user
  app.post('/api/accepted/photo', function(req, res){
    Photo.findOne({_id: req.body._id}, function(err, thisPhoto){
      thisPhoto.status = req.body.status;
      thisPhoto.price = req.body.price;
      thisPhoto.save(function(err, updatedPhoto){
        console.log('__________________');
        console.log(updatedPhoto);
        res.json(updatedPhoto);
      })
    })
  })

  /////rejected photo
  app.post('/api/reject/photo', function(req, res){
    Photo.findOne({_id: req.body.photoId}, function(err, photo){
      console.log(photo);
      photo.status = 'rejected';
      photo.save(function(err, updatedPhoto){
        console.log(updatedPhoto);
        res.json(updatedPhoto);
      })
    })
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
      // console.log(user);
      else if(user == null){
        res.json('no user found with that email address');
      }
      else {
        var unhashedPW = bcrypt.compareSync(req.body.password, user.passwordDigest);
        console.log(unhashedPW);
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
    console.log('ooooo');
    console.log(req.body);
    var token = jwt.sign({userId: req.body.userId, active: true}, process.env.JWT_SECRET);
    console.log(token);
    console.log(jwt.verify(token, process.env.JWT_SECRET));
    res.json(token);
  })

  ///////////////end Authorization calls///////////////
  /////////////////////////////////////////////////////

}

mongoose.connect("mongodb://jackconnor:Skateboard1@ds011308.mongolab.com:11308/moneyshot_db");
