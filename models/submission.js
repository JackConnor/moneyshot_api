var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var submissionSchema = new Schema({
  creator: {type: Schema.Types.ObjectId, ref: "User"}
  ,date: Date
  ,photos: [{type: Schema.Types.ObjectId, ref: "Photo"}]
  ,videos: [{type: Schema.Types.ObjectId, ref: "Photo"}]
  ,metadata: Object

   /*
    metadata: {
      location: {
        place: String //Name of inferred place taken
        lat: Number
        lng: Number
        address: String
      }
    }
  */
})

module.exports = mongoose.model('Submission', submissionSchema);
