var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var transactionSchema = new Schema({
  photos: [{type: Schema.Types.ObjectId, ref: "Photo"}]
  ,creator: {type: Schema.Types.ObjectId, ref: "User"}
  ,price: Number
})

module.exports = mongoose.model('Transaction', transactionSchema);
