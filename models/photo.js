var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var photoSchema = new Schema({
  creator: {type: Schema.Types.ObjectId, ref: "User"}
  ,submission: {type: Schema.Types.ObjectId, ref: "Submission"}
  ,transactions: [{type: Schema.Types.ObjectId, ref: "Transaction"}]
  ,url: String
  ,photosubjects: Array
  ,location: String
  ,status: String
  ,date: Date
})

module.exports = mongoose.model('Photo', photoSchema);