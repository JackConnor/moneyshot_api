var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var videoSchema = new Schema({
  videoUrl: String
  ,creator: {type: Schema.Types.ObjectId, ref: "User"}
  ,date: Date
})

module.exports = mongoose.model('Video', videoSchema);
