var express           = require('express');
var mongoose          = require('mongoose');
var bodyParser        = require('body-parser');
var methodOverride    = require('method-override');
var multer            = require('multer');
var bcrypt            = require('bcrypt');
var upload            = multer({dest: './routes/uploads/'})
var cloudinary        = require('cloudinary');
var jwt               = require('jsonwebtoken');
var youtube           = require('youtube-api');
var fs                = require('fs');
var opn               = require('opn');
var Lien              = require('lien');
var request           = require('request');
var resumableUpload   = require('node-youtube-resumable-upload');
var youtubeVideo      = require('youtube-video-api');
var stripe            = require('stripe')('sk_test_InGTWI3kMvNLl9HNs7eGUi8X');
var nodemailer        = require('nodemailer');

console.log(process.env.JWT_SECRET);

var server = new Lien({
    host: "localhost"
    ,port: 5555
    ,root: __dirname + "/public"
});
// console.log(server);
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
    console.log('body');
    console.log(req.body);
    var filename = req.files[0].filename;
    var destination = req.files[0].destination;
    var filePath = destination + filename;
    var width = function(){
      if(req.body.cloudCropImageWidth){
        return req.body.cloudCropImageWidth;
      }
      else {
        return req.body.naturalWidth;
      }
    }
    var height = function(){
      if(req.body.cloudCropImageHeight){
        return parseInt(req.body.cloudCropImageHeight);
      }
      else {
        return parseInt(req.body.naturalHeight);
      }
    }
    var offsetX = function(){
      if(req.body.cloudCropImageX){
        return parseInt(req.body.cloudCropImageX);
      }
      else {
        return 0;
      }
    }
    var offsetY = function(){
      if(req.body.cloudCropImageY){
        return parseInt(req.body.cloudCropImageY);
      }
      else {
        return 0;
      }
    }
    console.log('coords');
    console.log(height());
    console.log(width());
    console.log(offsetY());
    console.log(offsetX());
    cloudinary.uploader.upload("./routes/uploads/"+filename, {width: 300, height: 300}, function(result) {
      res.json(result);
    });
  })

  ///////function to convert a photo for cropping

  app.post('/crop/photo', upload.array('file', 1), function(req, res){
    var filename = req.files[0].filename;
    var destination = req.files[0].destination;
    var filePath = destination + filename;
    cloudinary.uploader.upload("./routes/uploads/"+filename, function(result){
      console.log(result);
      res.json(result);
    })
  })

  app.post('/api/createphotos', function(req, res){
    // console.log(req.body);
    var url = req.body.url;
    Photo.create({url: url, location: "los angeles", date: new Date(), photosubjects: ['kris jenner', 'kim kardashian', 'kanye west'], status: "submitted for sale", isVideo: req.body.isVid, creator: req.body.userId}, function(err, newPhoto){
      console.log('new photo object');
      // console.log(newPhoto);
      User.findOne({_id:req.body.userId}, function(err, user){
        user.photos.push(newPhoto._id);
        user.save(function(err, updatedUser){
          res.json(newPhoto);
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
        model: 'Photo',
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
    var filename = req.files[0].filename;
    var destination = req.files[0].destination;
    var filePath = destination + filename;
    cloudinary.uploader.upload("./routes/uploads/"+filename, function(result) {
      res.json(result.secure_url)
    }, { resource_type: "video" });
  })

  ///////////////end photo db calls////////////////////
  /////////////////////////////////////////////////////


  //////submission calls
  //////////////////////

  app.post('/api/new/submission', function(req, res){
    var submission = new Submission();
    submission.creator = req.body.userId;
    submission.photos[0] = req.body.photos[0];
    for (var i = 0; i < req.body.photos.length; i++) {
      submission.photos[i] = req.body.photos[i];
    }
    for (var i = 0; i < req.body.videos.length; i++) {
      submission.photos.push(req.body.videos[i]);
    }
    // submission.videos = req.body.videos;
    submission.save(function(err, newSub){
      if(err){console.log(err)}
      User.findOne({'_id': req.body.userId}, function(err, user){
        user.submissions.push(newSub._id)
        user.save(function(updatedUser){
          res.json(updatedUser)
        })
      })
    })
  })

  //////end submission calls
  //////////////////////////


  /////////////////////////////////////////////////////
  /////////////Begin Authorization calls///////////////

  /////////call to signup a new user
  app.post('/api/signup', function(req, res){
    var emailLower = req.body.email.toLowerCase();
    console.log(emailLower);
    if(req.body.password){
      bcrypt.hash(req.body.password, 8, function(err, newHash){
        User.findOne({email: emailLower}, function(err, isEmail){
          if(isEmail == null){
            User.create({email: emailLower, passwordDigest: newHash, access_token: '', refresh_token: '', stripe_publishable_key: '', stripe_user_id: ''}, function(err, newUser){
              console.log('new user');
              console.log(newUser);
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

  /////get all user info
  app.post('/api/userinfo', function(req, res){
    User.findOne({"_id": req.body.userId}, function(err, userInfo){
      res.json(userInfo);
    })
  })


  /////////////////////
  ////bank calls//////
  // app.get('banking/:stripe_data', function(req, res){
  //   console.log('stripe params');
  //   console.log(req.params);
  //   res.json(req.params)
  // })

  app.get('/api/stripe/test/', function(req, res){
    console.log(1);
    // var token = req.body.token;
    console.log(req.query);
    console.log('yoyoyoyo');
    var token = req.query.code;
    console.log(token);
    // res.json(token);
    request.post({
      url: 'https://connect.stripe.com/oauth/token'
      ,form: {
        grant_type: "authorization_code"
        ,code: token
        ,client_secret: "sk_test_InGTWI3kMvNLl9HNs7eGUi8X"
        ,client_id: "ca_85XIIrajUKuhChdWZQFJ9zu1lmuzul3F"
      }
    }, function(err, r, userData){
      if(err){console.log(err)}
      console.log('in the callback');
      console.log(req.query.state);
      console.log(userData);
      User.findOne({'_id':req.query.state}, function(err, user){
        console.log('user coming');
        console.log(user);
        user.access_token = JSON.parse(userData).access_token;
        user.refresh_token = JSON.parse(userData).refresh_token;
        user.stripe_user_id = JSON.parse(userData).stripe_user_id;
        user.stripe_publishable_key = JSON.parse(userData).stripe_publishable_key;
        user.save(function(err, newUser){
          console.log(newUser);
          ////////some shit to test creating a charge

          res.redirect("/")
        })
      })
    })
  })

  ///delete a bank account
  app.post('/api/delete/bank', function(req, res){
    User.findOne({"_id":req.body.userId}, function(err, user){
      console.log(user);
      user.access_token = '';
      user.refresh_token = '';
      user.stripe_user_id = '';
      user.stripe_publishable_key = '';
      user.save(function(err, newUser){
        res.json(newUser);
      })
    })
  })
  ////bank calls//////
  /////////////////////

  ////////function to submit or reject a photo
  app.post('/api/photopurchase', function(req, res){
    var photoId = req.body.photoId;
    // stripe.customers.create(
    //   { description: "example@stripe.com" },
    //   {stripe_account: req.body.access_token} // account's access token from the Connect flow
    // );
    Photo.findOne({'_id': photoId}, function(err, photo){
      if(req.body.status == 'sold'){
        request.post({
          url: 'https://connect.stripe.com/oauth/token'
          ,form: {
            grant_type: "refresh_token"
            ,refresh_token: req.body.refresh_token
            ,client_secret: "sk_test_InGTWI3kMvNLl9HNs7eGUi8X"
            ,client_id: "ca_85XIIrajUKuhChdWZQFJ9zu1lmuzul3F"
          }
        }, function(err, r, userData){
          console.log(userData);
          stripe.tokens.create({
            card: {
              "number": '4242424242424242',
              "exp_month": 12,
              "exp_year": 2017,
              "cvc": '123'
            }
          }, function(err, token) {
            // asynchronously called
            console.log(token);
            stripe.charges.create({
              amount: req.body.price,
              currency: 'usd',
              source: token.id
            }, {stripe_account: userData.stripe_user_id})
            .then(function(newCharge){
              console.log('charginggggg');
              console.log(newCharge);
              photo.status = 'sold';
              photo.save(function(err, updatedPhoto){
                console.log(updatedPhoto);
                res.json(newCharge);
              });
            })
          });
        })
      }
      else if(req.body.status == 'rejected'){
        photo.status = 'rejected';
        photo.save(function(err, updatedPhoto){
          console.log(updatedPhoto);
          res.json(updatedPhoto);
        });
      }
    })
  })

  //////////////////////////////////
  ////////////email functions///////
  app.post('/api/signup/email', function(req, res){
    //////nodemailer stuff
    console.log(req.body);
    var transporter = nodemailer.createTransport('smtps://jack.connor83%40gmail.com:FreezerP1zza@smtp.gmail.com');
    var mailOptions = {
        from: '"Fred Foo 👥" <jack.connor83@gmail.com>', // sender address
        to: req.body.userEmail, // list of receivers
        subject: 'New Mopho Account ✔', // Subject line
        text: 'Thank you for signing up', // plaintext body
        html: '<b>Thank you for signing up! Here is a horse 🐴</b>' // html body
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
        res.json(info)
    });
  })

  app.post('/api/getpw', function(req, res){
    console.log(req.body);
    var userEmail = req.body.userEmail.toLowerCase();
    User.findOne({"email": userEmail}, function(err, user){
      if(err){console.log(err)}
      console.log(user);
      if(user == null){
        res.json({bool: false, message: 'no user'});
      }
      else{
        res.json({bool: true, message: 'successful lookup'});
      }
    })
  })

  app.post('/api/update/pw', function(req, res){
    console.log(req.body);
    var email = req.body.email.toLowerCase();
    User.findOne({email: email}, function(err, user){
      console.log(user);
      var newHash = bcrypt.hashSync(req.body.password, 8);
      console.log(newHash);
      user.passwordDigest = newHash;
      var isTrue = bcrypt.compareSync(req.body.password, newHash);
      console.log(isTrue);
      user.save(function(err, newUser){
        if(err) throw err;
        console.log(newUser);
        // bcrypt.compare(req.body.password, function(err, result) {
        //     console.log('new password?');
        //     console.log(result);
        //     res.json(newUser);
        // });
      })
    })
  })

  ////////////email functions///////
  //////////////////////////////////

}




// Listen for load
server.on("load", function (err) {
    console.log(err || "Server started on port 5555.");
    err && process.exit(1);
});

mongoose.connect("mongodb://jackconnor:Skateboard1@ds011308.mongolab.com:11308/moneyshot_db");
