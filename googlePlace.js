var rp       = require('request-promise'),
	mongoose = require('mongoose'),
	Sub      = mongoose.model('Submission');

var key = 'key=' + process.env.GPLACEID

var gPlaceUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?'

function error( err ) {
	console.log( "Error", err )
}

//Retrieves a submission by id
function findSub( id ) {
	return Sub.findById( id ).exec()
}

// Returns first instance in array that is an establishment
function findEstab( arr ) {
	for (var index = 0; index < arr.length; index++) {
		var element = arr[index];
		// 0 is false so add 1 to index if indexOf = 0
		if (element.types.indexOf('establishment') + 1){
			return element
		}
	}
	return false
}

// Recieve incoming location data
function getPlaceStuffs(data) {
	// Create query string for google Places API
	var radius = 'radius=100'
	var location = 'location=' + data.latitude + ',' + data.longitude
	var query = gPlaceUrl + [ location, radius, key ].join( '&' )
	rp( query )
		.then( function(gplData){
			// Get google places data bak
			var results = JSON.parse( gplData ).results
			// returns the first result that is an establishment
			var first = findEstab( results )
			if (first) {
				// if there's an estab return the data needed
				return {
					place: first.name,
					lat: data.latitude,
					lng: data.longitude,
					address: first.vicinity
				}
			} else {
				throw 'No Establishment'
			}
		})
		.then( function(loc) {
			// Get a sub by incoming data from initial call
			findSub( data.id )
				.then( function( sub ) {

					// This if creates the metadata object if none is made
					if ( !sub.metadata ) {
						sub.metadata = {
							location: {}
						}
					}
					// Set the location data in the metadata field
					sub.metadata.location = loc
					sub.save( function( err, doc ) {
						// If error sned it to console catch
						if ( err ) {
							throw err
						}
					} )
				} )
		})
		.catch(error)
}

module.exports = getPlaceStuffs
