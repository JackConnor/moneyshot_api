var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var submissionSchema = new Schema({
  creator: {type: Schema.Types.ObjectId, ref: "User"}
  ,photos: [{type: Schema.Types.ObjectId, ref: "Photo"}]
})

module.exports = mongoose.model('Submission', submissionSchema);
