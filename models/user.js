var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  photos: [{type: Schema.Types.ObjectId, ref: "Photo"}]
  ,submissions: [{type: Schema.Types.ObjectId, ref: "Submission"}]
  ,transactions: [{type: Schema.Types.ObjectId, ref: "Transaction"}]
  ,access_token: String
  ,refresh_token: String
  ,stripe_publishable_key: String
  ,stripe_user_id: String
  ,bankaccounts: Array
  ,firstname: String
  ,lastname: String
  ,email: String
  ,passwordDigest: String
})

module.exports = mongoose.model('User', userSchema);
