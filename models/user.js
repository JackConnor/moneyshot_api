var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  photos: [{type: Schema.Types.ObjectId, ref: "Photo"}]
  ,submissions: [{type: Schema.Types.ObjectId, ref: "Submission"}]
  ,transactions: [{type: Schema.Types.ObjectId, ref: "Transaction"}]
  ,bankaccounts: Array
  ,firstname: String
  ,lastname: String
  ,email: String
  ,passwordDigest: String
})

module.exports = mongoose.model('User', userSchema);
