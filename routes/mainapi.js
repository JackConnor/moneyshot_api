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
var dotenv            = require('dotenv').config();
var request           = require('request');
var resumableUpload   = require('node-youtube-resumable-upload');
var youtubeVideo      = require('youtube-video-api');
var stripe            = require('stripe')(process.env.STRIPE_TEST_ID);
var nodemailer        = require('nodemailer');
var cors              = require('cors');
var json2csv          = require('json2csv');

// console.log(process.env.STRIPE_ID);

var server = new Lien({
    host: "localhost"
    ,port: 5555
    ,root: __dirname + "/public"
});
// console.log(server);
///////cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME
  ,api_key: process.env.CLOUD_KEY
  ,api_secret: process.env.CLOUD_SECRET
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

var googlePlacesInfo = require( '../googlePlace.js' )


module.exports = function(app){

  app.use(cors())

  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    // res.header("Access-Control-Allow-Origin", "http://localhost:8100");
    // res.header("Access-Control-Allow-Origin", "http://localhost:8101");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

  var bankApi = require('../bank.js')(app)

  app.get( '/checkToken', function(req, res ) {
    res.json('Yesy')
  })

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
    });
  })

  app.post('/api/newimage', upload.array('file', 1), function(req, res){
    console.log(req.files);
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
    cloudinary.uploader.upload("./routes/uploads/"+filename, function(result) {
      console.log(result);
      cloudinary.uploader.upload("./routes/uploads/"+filename, function(thumbResult) {
        console.log(thumbResult);
        fs.unlink("./routes/uploads/"+filename)
        var photoObj = {secure_url: result.secure_url, thumbnail: thumbResult.secure_url};
        console.log(photoObj);
        res.json(photoObj);
      }, {gravity: "face", width: 150, height: 150, crop: "fill", gravity: 'center'});
    }, {width: 1080, height: 1350, y: 290, crop: 'crop'});
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
    console.log('create photo body');
    console.log(req.body);
    console.log('end body');
    var url = req.body.url;
    if(req.body.isVid === true){
      var thumbnail = req.body.url.split('').splice(0, req.body.url.length-4).join('')+".png";
    }
    else {
      var thumbnail = req.body.thumbnail;
    }
    Photo.create({url: url, thumbnail: thumbnail, date: new Date(), status: "submitted for sale", isVideo: req.body.isVid, creator: req.body.userId}, function(err, newPhoto){
      console.log(newPhoto);
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
    // .populate('photos')
    .exec(function(err, user){
      // console.log(user);
      var length = user.submissions.length;
      console.log(length);
      //////now we add statuses to all of this
      // for (var i = 0; i < length; i++) {
      //
      //   user.submissions[i].submissionPrice = 0;
      //   var rejectPhotos = 0;
      //
      //   var photoLength = user.submissions[i].photos.length;
      //   var photoSet = user.submissions[i].photos;
      //   // console.log(photoSet);
      //   console.log(user.submissions[i].submissionPrice);
      //   for (var i = 0; i < photoLength; i++) {
      //     if(photoSet[1].price > 0){
      //       user.submissions[i].submissionPrice += photoSet[i].price;
      //       console.log(user.submissions[i].submissionPrice);
      //     }
      //   }
      // }

      console.log(user);

      res.json(user);
    })
  })

  app.get('/api/all/submissions', function(req, res){
    Submission.find({})
    .populate({
      path: 'photos'
      ,model: 'Photo'
    })
    .exec(function(err, allSubmissions){
      res.json(allSubmissions)
    })
  })

  ///////add a price and a status of "submitted" to any photo, menaing it's accepted into the system and sent back to the user
  app.post('/api/accepted/photo', function(req, res){
    console.log(req.body);
    Photo.findOne({_id: req.body._id}, function(err, thisPhoto){
      thisPhoto.status = req.body.status;
      thisPhoto.price = req.body.price;
      thisPhoto.save(function(err, updatedPhoto){
        Submission.findOne({"_id":req.body.submissionId}, function(err, submission){
          console.log(submission);
          // submission.price = parseInt(submission.price) += parseInt(req.body.price);
          // submission.price += req.body.price;
          var oldPrice = parseInt(submission.price);
          var newAdd = parseInt(req.body.price);//
          submission.price = oldPrice + newAdd;
          submission.save(function(err, newSub){
            console.log(newSub);
            if(err) throw err;
              res.json(newSub);
          })
        })
      })
    })
  })

  /////rejected photo
  app.post('/api/reject/photo', function(req, res){
    // console.log(req.body);
    Photo.findOne({_id: req.body.photoId}, function(err, photo){
      // console.log(photo);
      if(photo){
        photo.status = 'rejected';
        photo.save(function(err, updatedPhoto){
          // console.log(updatedPhoto);
          Submission.findOne({'_id': req.body.submissionId}, function(err, submission){
            console.log(submission);
            console.log("----------------------");
            console.log("----------------------");
            console.log("----------------------");
            if(submission.rejectedPhotosLength >= 0){
              submission.rejectedPhotosLength++
            }
            submission.save(function(err, newSubmission){
              console.log(newSubmission);
              res.json(newSubmission);
            })
          });
        });
      }
      else {
        res.json('no photo');
      }
    })
  })

  /////our first test post video call
  app.post('/api/upload/video', upload.array('file', 1), function(req, res){
    console.log('something is happening');
    var filename = req.files[0].filename;
    var destination = req.files[0].destination;
    var filePath = destination + filename;
    cloudinary.uploader.upload("./routes/uploads/"+filename, function(result) {
      console.log(filename);
      var thumbFilename = result.secure_url.split('').slice(0, result.secure_url.length-4).join('')+'.jpg';
      console.log(filename);
      console.log(result.secure_url);
      console.log(thumbFilename);
      fs.unlink('./routes/uploads/'+filename);
      res.json(result.secure_url)
    }, { resource_type: "video"});
  })

  /////////temporary video cache call
  app.post('/api/temp/video', upload.array('file', 1), function(req, res){
    console.log('pinged');
    console.log(req.body);
    var filename = req.files[0].filename;
    var userId = req.body.userId;
    var tempVideo = new Photo();
    tempVideo.creator = userId;
    tempVideo.isBoolean = true;
    tempVideo.date = new Date();

    /////cloudinary stuff
    cloudinary.uploader.upload("./routes/uploads/"+filename, function(result) {
      console.log(result);
      var tempVidUrl = result.secure_url;
      tempVideo.url = tempVidUrl;
      tempVideo.save(function(err, savedVideo){
        if(err){throw err}
        console.log(savedVideo);
        User.findOne({'_id':userId}, function(err, user){
          console.log(user);
          user.tempVideoCache.push(savedVideo._id);
          fs.unlink('./routes/uploads/'+filename);
          user.save(function(err, newUser){
            res.json(newUser);
          })
        });
      })
    }, { resource_type: "video"});
  })

  ///////////////end photo db calls////////////////////
  /////////////////////////////////////////////////////

  /////////////////////////////////////
  /////////transaction calls///////////
  app.post('/api/transactions/all', function(req, res){
    console.log('tranny!');
    Transaction.find({creator: req.body.userId})
    .populate('photos')
    .exec(function(err, transData){
      res.json(transData);
    });
  })
  /////////transaction calls///////////
  /////////////////////////////////////

  //////submission calls
  //////////////////////

  app.post('/api/new/submission', function(req, res){
    console.log('new subbbbbbsssssssssssssss');
    console.log(req.body);
    var submission = new Submission();
    submission.creator = req.body.userId;
    submission.metadata = req.body.metaData;
    if(req.body.photos[0] !== undefined){
      submission.photos[0] = req.body.photos[0];
    }
    submission.price = 0;
    submission.rejectedPhotosLength = 0;
    submission.status = "pending";

    // Update metaData.location using googlePLaces API
    // if ( req.body.metaData.latitude && req.body.metaData.longitude ) {
    //       googlePlacesInfo( {
    //         id: submission._id,
    //         latitude: req.body.metaData.latitude,
    //         longittude: req.body.metaData.longitude
    //       } )
    // }
    for (var i = 0; i < req.body.photos.length; i++) {
      if(req.body.photos[i] !== undefined){
        submission.photos[i] = req.body.photos[i];
      }
    }
    for (var i = 0; i < req.body.videos.length; i++) {
      if(req.body.videos[i] !== undefined){
        submission.photos.push(req.body.videos[i]);
      }
    }
    // submission.videos = req.body.videos;
    submission.save(function(err, newSub){
      console.log(newSub);
      if(err){console.log(err)}
      User.findOne({'_id': req.body.userId}, function(err, user){
        user.submissions.push(newSub._id);
        user.tempVideoCache = [];
        user.save(function(updatedUser){
          res.json(newSub)
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
    if(req.body.password){
      bcrypt.hash(req.body.password, 8, function(err, newHash){
        User.findOne({email: emailLower}, function(err, isEmail){
          if(isEmail == null){
            User.create({email: emailLower, passwordDigest: newHash, access_token: '', refresh_token: '', stripe_publishable_key: '', stripe_user_id: ''}, function(err, newUser){
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
  app.get('/api/get/userinfo/:token', function(req, res){
    var decodedToken = jwt.verify(req.params.token, process.env.JWT_SECRET);
    console.log(decodedToken);
    User.findOne({"_id": decodedToken.userId})
    .populate({
      path: 'submissions',
      model: 'Submission',
      populate: {
        path: 'photos',
        model: 'Photo',
      }
    })
    .populate('tempVideoCache')
    // .populate({
    //   path: 'tempVideoCache',
    //   model: 'Photo'
    // })
    .exec(function(err, userInfo){
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
    var token = req.query.code;
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
      User.findOne({'_id':req.query.state}, function(err, user){
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
    var userId  = req.body.userId;
    console.log(userId);
    var transaction = new Transaction();
    Photo.findOne({'_id': photoId}, function(err, photo){
      if(req.body.status == 'sold'){
        photo.status = 'sold';
        photo.price = req.body.price;
        photo.transactions.push(transaction._id);
        photo.save(function(err, updatedPhoto){
          console.log(updatedPhoto);
          transaction.creator = userId;
          transaction.photos = [photoId];
          transaction.date =  new Date();
          transaction.price = req.body.price;
          transaction.save(function(err, newTrans){
            console.log(newTrans);
            res.header("Access-Control-Allow-Origin", "*");
            res.json(newTrans);
          })
        });
        /////stripe stuff, need to change credentials and then can add this back in
        // request.post({
        //   url: 'https://connect.stripe.com/oauth/token'
        //   ,form: {
        //     grant_type: "refresh_token"
        //     ,refresh_token: req.body.refresh_token
        //     ,client_secret: process.env.CLIENT_SECRET
        //     ,client_id: process.env.CLIENT_ID
        //   }
        // }, function(err, r, userData){
        //   console.log(userData);
        //   stripe.tokens.create({
        //     card: {
        //       "number": '4242424242424242',
        //       "exp_month": 12,
        //       "exp_year": 2017,
        //       "cvc": '123'
        //     }
        //   }, function(err, token) {
        //     // asynchronously called
        //     console.log(token);
        //     stripe.charges.create({
        //       amount: req.body.price,
        //       currency: 'usd',
        //       source: token.id
        //     }, {stripe_account: userData.stripe_user_id})
        //     .then(function(newCharge){
        //       console.log('charginggggg');
        //       console.log(newCharge);
        //       photo.status = 'sold';
        //       photo.save(function(err, updatedPhoto){
        //         console.log(updatedPhoto);
        //         res.header("Access-Control-Allow-Origin", "*");
        //         res.json(newCharge);
        //       });
        //     })
        //   });
        // })
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
    var transporter = nodemailer.createTransport('smtps://'+process.env.SMPT);
    console.log(transporter);
    var mailOptions = {
        from: '"Fred Foo 👥" <jack.connor83@gmail.com>', // sender address
        to: req.body.userEmail, // list of receivers
        subject: 'New Mopho Account ✔', // Subject line
        text: 'Thank you for signing up', // plaintext body
        html: '<b>Thank you for signing up! Here is a horse 🐴</b>' // html body
    };

    transporter.sendMail(mailOptions, function(error, info){
        if(error){
          console.log(error);
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
    User.findOne({_id: req.body._id}, function(err, user){
      if(err){console.log(err)}
      console.log(user);
      var newHash = bcrypt.hashSync(req.body.password, 8);
      console.log(newHash);
      user.passwordDigest = newHash;
      var isTrue = bcrypt.compareSync(req.body.password, newHash);
      console.log(isTrue);
      user.save(function(err, newUser){
        if(err){res.json(err)}
        console.log('newUser');
        console.log(newUser);
        res.json(newUser)
      })
    })
  })

  app.post('/api/newpw/request', function(req, res){
    var email = req.body.userEmail;
    console.log(email);

    User.findOne({'email': email}, function(err, user){
      console.log('errr');
      if(err) res.json(err);
      if(user !== null){
        console.log('user');
        console.log(user);
        var userId = user._id;
        // console.log(userId);
        //
        // var hashId = bcrypt.hashSync(userId.toString(), 8);
        // console.log(hashId);
        var transporter = nodemailer.createTransport('smtps://jack.connor83%40gmail.com:FreezerP1@smtp.gmail.com');
        var mailOptions = {
            from: '"New Password" <jack.connor83@gmail.com>', // sender address
            to: email, // list of receivers
            subject: 'update password', // Subject line
            text: 'Thank you for signing up', // plaintext body
            html: '<b>click the following link to get your new password: http://mophocms.herokuapp.com/#/new/password/'+userId+'</b>' // html body
        };
        console.log(transporter);

        transporter.sendMail(mailOptions, function(error, info){
            if(error){
              console.log('transport error');
              console.log(error);
            }
            else{
              console.log('Message sent: ' + info.response);
              res.json(info)
            }
        });
      }
      else {
        res.json('no user');
      }
    })
  })


  app.get('/api/bankroute', function(req, res){
    console.log('yo');
    res.json(process.env.STRIPE_ID)
  })

  ///////function to convert financial data to an excel sheet and mail to the user
  app.post('/api/tocsv', function(req, res){
    var email = req.body.email;
    console.log(email);
    User.findOne({email: email}, function(err, data){
      var userData = data;
      console.log(userData);
      var fields = ['name', 'email' ,'photos'];
      json2csv({data: userData, fields: fields}, function(err, csv){
        if(err){console.log(err)}
        console.log(csv);
        fs.writeFile('newcsv.csv', csv, function(){
          ///start email stuff
          var transporter = nodemailer.createTransport('smtps://'+process.env.SMPT);
          var mailOptions = {
              from: '"Your Data" <jack.connor83@gmail.com>' // sender address
              ,to: 'jack.connor83@gmail.com' // list of receivers
              ,subject: 'Your Data (attached)' // Subject line
              ,text: 'Thank you for your request' // plaintext body
              ,html: '<b>here is your data</b>' // html body
              ,attachments: [
                {path: './newcsv.csv'}
              ]

          };
          transporter.sendMail(mailOptions, function(error, info){
              if(error){
                  return console.log(error);
              }
              console.log('Message sent: ' + info.response);
              fs.unlink('./newcsv.csv')
              res.json(csv)
          });
        });
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
