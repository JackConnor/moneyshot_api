var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var submissionSchema = new Schema({
  creator: {type: Schema.Types.ObjectId, ref: "User"}
  ,date: Date
  ,photos: [{type: Schema.Types.ObjectId, ref: "Photo"}]
  ,videos: [{type: Schema.Types.ObjectId, ref: "Photo"}]
  ,price: Number
  ,status: String
  ,rejectedPhotosLength: Number
  ,metadata: Object
})

module.exports = mongoose.model('Submission', submissionSchema);
