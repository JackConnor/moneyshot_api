/////////////////////////////////////////////
// Signup-
// 1. client signs up which takes them to stripe to create/signin to accnt
// 2. client gets redirected to our pre made uri with auth token
// 3. Using auth token we send that and our secret to stripe to get info storing it in our db
// 4. Once they have an account we will need to ask

// Payout-
// 1. Admin logs in to stripe cms and finds user in users sidebar
// 2. Admin creates payment to user and sends amount of $
// 3. Done.
// ----OR-----
// 1. Admin signs in to our cms
// 2. Admin selects user from list of users and inputs amount of money to payment
// 3. Client side sends to our api user_id and payment info
// 4. our api goes to db gets user's stripe account info and makes payment
// 5. Api sends request to stripe to get Admin's account token
//     - payment looks as follows
		// stripe.charges.create({
		// amount: 1000,
		// currency: 'usd',
		// source: {Admin's account token},
		// destination: {user's account id}
		// });

//SERVER SIDE
//===========================
var jwt = require('jsonwebtoken');
var bcrypt = require('bcrypt');
var mongoose = require('mongoose');
var express = require('express');
var rp = require('request-promise');
var User = mongoose.model('User');

// TODO clean up auth and genToken since it's already in mainapi.js
function auth(req, res, next) {
	// Get token from request
	var token = req.params.token || req.headers['Authorization'] || req.headers['x-access-token'] || req.body.token;
	if (token){
		jwt.verify(token, process.env.JWT_SECRET, function(err, decoded) {
			// check token, if bad don't allow access
			if (err) {
				console.log('Bad Token')
				res.json('Bad Token')
				return
			}
			// If token is legit attach to request object and proceed
			req.decoded = decoded
			next()
			// return?
		});
	} else if (email){
		next()
	} else {
		console.log('No token')
		res.json('No token provided')
	}
}

function genToken(req, res, next) {
	// Unsure of how info is coming in so checking everything
	var body = req.body || req.params || req.headers
	var password = body.password
	var userId = body.userId
	// Find user by email
	User.findById(userId).exec()
		.then(function(user){
			if (user){
				// Check if password coming in matches one in db for user
				bcrypt.compare(password, user.passwordDigest, function(err, isPass){
					if ( err ) {
						console.log('Error', err)
						res.json(err)
						return
					}
					if(!isPass) {
						console.log('Error wrong password', isPass)
						res.json('Wrong Password')
						return
					} else {
						var token = jwt.sign({userId: user._id, active: true}, process.env.JWT_SECRET);
						res.json({token: token})
					}
				})
			} else {
				res.json('No user found')
			}
		})
		.catch(function(err){
			console.log( 'Error finding user', err )
			res.json(err)
		})
}

module.exports = function(app) {

	var bankRoutes = express.Router()

	bankRoutes.get( '/stripe/redirect_uri', function(req, res) {
		// TODO make reirect to bankRoutes url if can
		res.redirect( 'http://localhost:8100/#/banking/' + req.query.code)
		// res.json( 'Yes!' )
	})

	bankRoutes.post('/addStripe', auth, function(req, res) {
		console.log(req.body);
		var query = {
			method: 'POST',
			uri: 'https://connect.stripe.com/oauth/token',
			form: {
				grant_type: "authorization_code"
				,code: req.body.stripe
				,client_secret: process.env.CLIENT_SECRET
				,client_id: process.env.CLIENT_ID
			}
			,headers: {
				'content-type': 'application/x-www-form-urlencoded'
			}
		}
		rp( query)
			.then(function(userData){
				var stripe = JSON.parse( userData )
				return User.findOneAndUpdate({_id: req.decoded.userId}, {
					access_token: stripe.access_token,
					refresh_token: stripe.refresh_token,
					stripe_publishable_key: stripe.stripe_publishable_key,
					stripe_user_id: stripe.stripe_user_id
				}, { new: true }).exec()
			})
			.then(function(user){
				// console.log( 'USER', user)
				res.json(user)
			})
			.catch(function(err){
				console.log('Error!!!', err)
				res.json(err)
			})
		})

	// Sending in token to check password for if actual person
	bankRoutes.post( '/genToken', genToken )

	app.use( '/api/bank', bankRoutes )
};
